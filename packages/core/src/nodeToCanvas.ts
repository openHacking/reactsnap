import type { RenderOptions } from "./types";
import { nodeToSvgDataUrl } from "./nodeToSvg";
import { ensureBrowserApi, resolveDimensions, waitForReady } from "./utils";

export async function nodeToCanvas(
  node: HTMLElement,
  options: RenderOptions = {}
): Promise<HTMLCanvasElement> {
  ensureBrowserApi("document", globalThis.document);
  ensureBrowserApi("Image", globalThis.Image);
  await waitForReady(node.ownerDocument, options.waitUntil);

  const { width, height, scale } = resolveDimensions(node, options);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to acquire a 2D canvas context.");
  }

  if (options.background) {
    context.fillStyle = options.background;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  const image = new Image();
  image.decoding = "async";
  image.src = await nodeToSvgDataUrl(node, options);
  await image.decode();

  context.scale(scale, scale);
  context.drawImage(image, 0, 0, width, height);
  return canvas;
}
