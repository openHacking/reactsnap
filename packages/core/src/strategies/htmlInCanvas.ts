import type { RenderOptions } from "../types";

export async function renderWithHtmlInCanvas(
  _node: HTMLElement,
  _options: RenderOptions = {}
): Promise<HTMLCanvasElement> {
  throw new Error("html-in-canvas strategy is planned but not implemented yet.");
}
