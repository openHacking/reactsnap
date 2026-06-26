import { cloneNodeForSnapshot } from "../snapshotNode";
import type { RenderOptions } from "../types";
import { createCanvas, delay, drawBackground, resolveDimensions } from "../utils";
import { supportsHtmlInCanvas } from "./resolveStrategy";

type HtmlInCanvasCanvas = HTMLCanvasElement & {
  layoutSubtree?: boolean;
  requestPaint?: () => void;
};

type HtmlInCanvasRenderingContext2D = CanvasRenderingContext2D & {
  drawElementImage: (
    element: Element,
    dx: number,
    dy: number,
    dw?: number,
    dh?: number
  ) => void;
};

async function waitForPaint(canvas: HtmlInCanvasCanvas, timeout = 500): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error("html-in-canvas paint event timed out."));
    }, timeout);

    const done = () => {
      window.clearTimeout(timer);
      resolve();
    };

    if (typeof canvas.requestPaint === "function") {
      canvas.addEventListener("paint", done, { once: true });
      canvas.requestPaint();
      return;
    }

    void delay(16).then(done);
  });
}

export async function renderWithHtmlInCanvas(
  node: HTMLElement,
  options: RenderOptions = {}
): Promise<HTMLCanvasElement> {
  if (!supportsHtmlInCanvas()) {
    throw new Error("html-in-canvas is not supported in this browser environment.");
  }

  const { width, height, scale } = resolveDimensions(node, options);
  const { canvas, context } = createCanvas(width, height, scale);
  const htmlCanvas = canvas as HtmlInCanvasCanvas;
  const htmlContext = context as HtmlInCanvasRenderingContext2D;
  const host = document.createElement("div");
  const cloned = cloneNodeForSnapshot(node);

  drawBackground(context, canvas, options.background);
  host.setAttribute(
    "style",
    "position:fixed;left:-100000px;top:0;opacity:0;pointer-events:none;overflow:hidden;"
  );
  htmlCanvas.layoutSubtree = true;
  htmlCanvas.setAttribute("layoutsubtree", "");
  cloned.style.width = `${width}px`;
  cloned.style.height = `${height}px`;
  htmlCanvas.appendChild(cloned);
  host.appendChild(htmlCanvas);
  document.body.appendChild(host);

  try {
    await waitForPaint(htmlCanvas, options.timeout ?? 500);
    htmlContext.scale(scale, scale);
    htmlContext.drawElementImage(cloned, 0, 0, width, height);
    return canvas;
  } finally {
    host.remove();
  }
}
