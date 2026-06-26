# API Reference

This document covers the currently implemented browser APIs in ReactSnap.

## `@reactsnap/core`

### `renderToPng(input, options?)`

Render a DOM node to a PNG `Blob`.

```ts
import { renderToPng } from "@reactsnap/core";

const blob = await renderToPng(document.getElementById("card")!, {
  scale: 2,
  background: "#ffffff"
});
```

### `renderToJpeg(input, options?)`

Render a DOM node to a JPEG `Blob`.

### `renderToWebp(input, options?)`

Render a DOM node to a WebP `Blob`.

### `renderToCanvas(input, options?)`

Render a DOM node to an `HTMLCanvasElement`.

### `nodeToCanvas(input, options?)`

Low-level canvas rendering primitive used by the format helpers.

### `nodeToSvgString(input, options?)`

Serialize a DOM node into an SVG string that wraps the cloned DOM subtree inside a
`foreignObject`.

### `nodeToSvgDataUrl(input, options?)`

Serialize a DOM node into an SVG data URL.

### `downloadBlob(blob, filename)`

Trigger a browser download for an already rendered `Blob`.

### `RenderOptions`

```ts
type RenderOptions = {
  width?: number;
  height?: number;
  scale?: number;
  background?: string;
  pixelRatio?: number;
  strategy?: "auto" | "html-in-canvas" | "foreign-object";
  waitUntil?: "load" | "fonts" | "network-idle" | number;
  fontEmbed?: boolean;
  imageEmbed?: boolean;
  allowTaint?: boolean;
  timeout?: number;
  debug?: boolean;
};
```

Option notes:

- `width` / `height`: Override the exported dimensions in CSS pixels.
- `scale`: Multiply the rasterized output size. `2` is a good default for previews.
- `background`: Fill the canvas before drawing the exported node.
- `pixelRatio`: Reserved for future renderer tuning. The current baseline renderer
  primarily relies on `scale`.
- `strategy`: Currently the `foreign-object` path is the implemented baseline.
- `waitUntil`: Wait for document readiness before capture. You can also pass a number
  in milliseconds.
- `fontEmbed`, `imageEmbed`, `allowTaint`, `timeout`, `debug`: Reserved for the next
  rendering milestones and API stability.

## `@reactsnap/react`

### `useReactSnap(baseOptions?)`

Attach a ref to a rendered React subtree and export that node on demand.

```tsx
import { useReactSnap } from "@reactsnap/react";

function CardPreview() {
  const { ref, exportPng, exportJpeg, exportWebp } = useReactSnap({
    scale: 2,
    background: "#f7f3ea"
  });

  return (
    <>
      <div ref={ref}>
        <Card />
      </div>
      <button onClick={() => void exportPng("card.png")}>Export PNG</button>
      <button onClick={() => void exportJpeg("card.jpg")}>Export JPEG</button>
      <button onClick={() => void exportWebp("card.webp")}>Export WebP</button>
    </>
  );
}
```

Return shape:

```ts
{
  ref: RefObject<T | null>;
  exportPng: (filename?: string, options?: RenderOptions) => Promise<Blob>;
  exportJpeg: (filename?: string, options?: RenderOptions) => Promise<Blob>;
  exportWebp: (filename?: string, options?: RenderOptions) => Promise<Blob>;
}
```

Behavior notes:

- Passing a `filename` triggers a browser download after rendering succeeds.
- Omitting `filename` returns the rendered `Blob` without downloading, which is useful
  for in-app preview flows such as the dev workbench example.
- Per-call `options` are merged on top of the hook's `baseOptions`.
- If the ref is not attached yet, the hook throws `ReactSnap target ref is not attached.`

## Current Baseline

The currently implemented renderer follows this browser-first sequence:

1. Clone the DOM subtree.
2. Inline computed styles into the clone.
3. Serialize the cloned subtree into SVG.
4. Load the SVG into an `Image`.
5. Draw the result onto a canvas.

That means the API is already useful for browser-side development previews, while some
advanced asset handling and fallback strategies are still in progress.
