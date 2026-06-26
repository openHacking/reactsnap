import { nodeToSvgString, type RenderOptions } from "@reactsnap/core";

export type SvgMode = "raster" | "foreignObject";

export type SvgOptions = RenderOptions & {
  svgMode?: SvgMode;
};

export async function renderToSvg(
  input: HTMLElement,
  options: SvgOptions = {}
): Promise<string> {
  if ((options.svgMode ?? "foreignObject") === "raster") {
    throw new Error("Raster SVG mode is scaffolded but not implemented yet.");
  }

  return await nodeToSvgString(input, options);
}
