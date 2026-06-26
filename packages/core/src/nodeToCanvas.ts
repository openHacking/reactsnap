import type { RenderOptions } from "./types";
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

  if (resolvedStrategy === "html-in-canvas") {
    if (requestedStrategy === "html-in-canvas") {
      return await renderWithHtmlInCanvas(node, options);
    }

    debugStrategySelection("auto", "html-in-canvas", "browser capability available", options.debug);

    try {
      return await renderWithHtmlInCanvas(node, options);
    } catch (error) {
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
    debugStrategySelection(
      "auto",
      "foreign-object",
      "html-in-canvas capability unavailable; falling back to foreign-object",
      options.debug
    );
  }

  return await renderWithForeignObject(node, options);
}
