import type { RenderOptions, ResolvedRenderStrategy } from "./types";
import { renderWithForeignObject } from "./strategies/foreignObject";
import { renderWithHtmlInCanvas } from "./strategies/htmlInCanvas";
import { debugStrategySelection, resolveRasterStrategy, supportsHtmlInCanvas } from "./strategies/resolveStrategy";
import { ensureBrowserApi, waitForReady } from "./utils";

export async function nodeToCanvas(
  node: HTMLElement,
  options: RenderOptions = {}
): Promise<HTMLCanvasElement> {
  ensureBrowserApi("document", globalThis.document);
  ensureBrowserApi("Image", globalThis.Image);
  await waitForReady(node.ownerDocument, options.waitUntil);

  const requestedStrategy = options.strategy ?? "auto";
  const resolvedStrategy = resolveRasterStrategy(options);
  const reportStrategy = (strategy: ResolvedRenderStrategy) => {
    options.onStrategyResolved?.(strategy);
  };

  if (resolvedStrategy === "html-in-canvas") {
    if (requestedStrategy === "html-in-canvas") {
      reportStrategy({
        requested: "html-in-canvas",
        resolved: "html-in-canvas",
        fallback: false,
        reason: "explicit html-in-canvas strategy requested"
      });
      return await renderWithHtmlInCanvas(node, options);
    }

    debugStrategySelection("auto", "html-in-canvas", "browser capability available", options.debug);
    reportStrategy({
      requested: "auto",
      resolved: "html-in-canvas",
      fallback: false,
      reason: "browser capability available"
    });

    try {
      return await renderWithHtmlInCanvas(node, options);
    } catch (error) {
      reportStrategy({
        requested: "auto",
        resolved: "foreign-object",
        fallback: true,
        reason: `html-in-canvas render failed; falling back to foreign-object (${String(error)})`
      });
      debugStrategySelection(
        "auto",
        "foreign-object",
        `html-in-canvas render failed; falling back to foreign-object (${String(error)})`,
        options.debug
      );
      return await renderWithForeignObject(node, options);
    }
  }

  if (requestedStrategy === "html-in-canvas" && !supportsHtmlInCanvas()) {
    throw new Error("html-in-canvas is not supported in this browser environment.");
  }

  if (requestedStrategy === "auto") {
    reportStrategy({
      requested: "auto",
      resolved: "foreign-object",
      fallback: true,
      reason: "html-in-canvas capability unavailable; falling back to foreign-object"
    });
    debugStrategySelection(
      "auto",
      "foreign-object",
      "html-in-canvas capability unavailable; falling back to foreign-object",
      options.debug
    );
    return await renderWithForeignObject(node, options);
  }

  reportStrategy({
    requested: "foreign-object",
    resolved: "foreign-object",
    fallback: false,
    reason: "explicit foreign-object strategy requested"
  });
  return await renderWithForeignObject(node, options);
}
