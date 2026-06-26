import type { RenderOptions } from "../types";
import { nodeToSvgDataUrl } from "../nodeToSvg";
import { createCanvas, drawBackground, resolveDimensions } from "../utils";

export async function renderWithForeignObject(
  node: HTMLElement,
  options: RenderOptions = {}
): Promise<HTMLCanvasElement> {
  const { width, height, scale } = resolveDimensions(node, options);
  const { canvas, context } = createCanvas(width, height, scale);

  drawBackground(context, canvas, options.background);

  const image = new Image();
  image.decoding = "async";
  image.src = await nodeToSvgDataUrl(node, options);
  await image.decode();

  context.scale(scale, scale);
  context.drawImage(image, 0, 0, width, height);
  return canvas;
}
