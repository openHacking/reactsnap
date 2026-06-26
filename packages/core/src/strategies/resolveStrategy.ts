import type { RenderOptions, RenderStrategy } from "../types";

type HtmlInCanvasCanvas = HTMLCanvasElement & {
  layoutSubtree?: boolean;
  requestPaint?: () => void;
};

type HtmlInCanvasRenderingContext2D = CanvasRenderingContext2D & {
  drawElementImage?: (
    element: Element,
    dx: number,
    dy: number,
    dw?: number,
    dh?: number
  ) => void;
};

export function supportsHtmlInCanvas(): boolean {
  if (typeof globalThis.document === "undefined") {
    return false;
  }

  const canvas = document.createElement("canvas") as HtmlInCanvasCanvas;
  if (!("layoutSubtree" in canvas) || typeof canvas.requestPaint !== "function") {
    return false;
  }

  const context = canvas.getContext("2d") as HtmlInCanvasRenderingContext2D | null;

  return typeof context?.drawElementImage === "function";
}

export function resolveRasterStrategy(options: RenderOptions = {}): RenderStrategy {
  if (options.strategy === "html-in-canvas") {
    return "html-in-canvas";
  }

  if (options.strategy === "foreign-object") {
    return "foreign-object";
  }

  return supportsHtmlInCanvas() ? "html-in-canvas" : "foreign-object";
}

export function debugStrategySelection(
  requested: RenderStrategy,
  resolved: RenderStrategy,
  reason: string,
  enabled?: boolean
): void {
  if (!enabled) {
    return;
  }

  console.warn(
    `[reactsnap] strategy "${requested}" resolved to "${resolved}": ${reason}`
  );
}
