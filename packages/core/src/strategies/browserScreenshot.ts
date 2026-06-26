import type { RenderOptions } from "../types";

export async function renderWithBrowserScreenshot(
  _node: HTMLElement,
  _options: RenderOptions = {}
): Promise<HTMLCanvasElement> {
  throw new Error("browser screenshot strategy is reserved for future remote/browser-backed export.");
}
