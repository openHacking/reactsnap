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

async function drawDuringPaint(
  canvas: HtmlInCanvasCanvas,
  draw: () => void,
  timeout = 500
): Promise<void> {
  const requestPaint = canvas.requestPaint;

  if (typeof requestPaint !== "function") {
    await delay(16);
    draw();
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error("html-in-canvas paint event timed out."));
    }, timeout);

    const done = () => {
      window.clearTimeout(timer);
      resolve();
    };

    const onPaint = () => {
      try {
        draw();
        done();
      } catch (error) {
        window.clearTimeout(timer);
        reject(error);
      }
    };

    canvas.addEventListener("paint", onPaint, { once: true });
    requestPaint.call(canvas);
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
    "position:fixed;left:0;top:0;opacity:0.001;pointer-events:none;overflow:hidden;z-index:-1;"
  );
  htmlCanvas.layoutSubtree = true;
  htmlCanvas.setAttribute("layoutsubtree", "");
  cloned.style.width = `${width}px`;
  cloned.style.height = `${height}px`;
  htmlCanvas.appendChild(cloned);
  host.appendChild(htmlCanvas);
  document.body.appendChild(host);

  try {
    htmlContext.scale(scale, scale);
    await drawDuringPaint(
      htmlCanvas,
      () => {
        htmlContext.drawElementImage(cloned, 0, 0, width, height);
      },
      options.timeout ?? 500
    );
    return canvas;
  } finally {
    host.remove();
  }
}
