export type RenderStrategy = "auto" | "html-in-canvas" | "foreign-object";

export type RenderWaitUntil = "load" | "fonts" | "network-idle" | number;

export type RenderOptions = {
  width?: number;
  height?: number;
  scale?: number;
  background?: string;
  pixelRatio?: number;
  strategy?: RenderStrategy;
  waitUntil?: RenderWaitUntil;
  fontEmbed?: boolean;
  imageEmbed?: boolean;
  allowTaint?: boolean;
  timeout?: number;
  debug?: boolean;
};

export type BinaryOutput = "blob" | "data-url" | "array-buffer";
