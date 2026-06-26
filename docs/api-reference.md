# API Reference

This document covers the currently implemented browser APIs in ReactSnap, with copy-pasteable examples for the common export flows.

## `@reactsnap/core`

### `renderToPng(input, options?)`

Render a DOM node to a PNG `Blob`.

```ts
import { renderToPng } from "@reactsnap/core";

const card = document.getElementById("card");

if (!card) {
  throw new Error("Missing #card element");
}

const blob = await renderToPng(card, {
  width: 1200,
  height: 630,
  scale: 2,
  background: "#ffffff"
});
```

Preview the result in the page before downloading it:

```ts
const previewUrl = URL.createObjectURL(blob);
const previewImage = document.createElement("img");

previewImage.src = previewUrl;
previewImage.alt = "PNG preview";
document.body.appendChild(previewImage);
```

### `renderToJpeg(input, options?)`

Render a DOM node to a JPEG `Blob`.

```ts
import { renderToJpeg } from "@reactsnap/core";

const hero = document.getElementById("hero");

if (!hero) {
  throw new Error("Missing #hero element");
}

const jpeg = await renderToJpeg(hero, {
  scale: 2,
  background: "#f6f1e8"
});
```

Typical use case: upload the generated file instead of downloading it immediately.

```ts
const formData = new FormData();
formData.append("file", jpeg, "hero.jpg");

await fetch("/api/uploads", {
  method: "POST",
  body: formData
});
```

### `renderToWebp(input, options?)`

Render a DOM node to a WebP `Blob`.

```ts
import { renderToWebp } from "@reactsnap/core";

const banner = document.querySelector<HTMLElement>("[data-export='banner']");

if (!banner) {
  throw new Error("Missing export target");
}

const webp = await renderToWebp(banner, {
  width: 1600,
  height: 900,
  scale: 1.5
});
```

### `renderToCanvas(input, options?)`

Render a DOM node to an `HTMLCanvasElement`.

This is useful when you want to keep working with the raster output inside the browser instead of converting it to a `Blob` immediately.

```ts
import { renderToCanvas } from "@reactsnap/core";

const poster = document.getElementById("poster");

if (!poster) {
  throw new Error("Missing #poster element");
}

const canvas = await renderToCanvas(poster, {
  scale: 2,
  background: "#111111"
});

document.body.appendChild(canvas);
```

You can also post-process the canvas:

```ts
const ctx = canvas.getContext("2d");

if (!ctx) {
  throw new Error("2D context is unavailable");
}

ctx.strokeStyle = "#ff7a00";
ctx.lineWidth = 12;
ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);
```

### `supportsHtmlInCanvas()`

Check whether the current browser environment can use the experimental WICG `html-in-canvas` strategy.

```ts
import { renderToCanvas, supportsHtmlInCanvas } from "@reactsnap/core";

const target = document.getElementById("poster");

if (!target) {
  throw new Error("Missing #poster element");
}

const canvas = await renderToCanvas(target, {
  strategy: supportsHtmlInCanvas() ? "html-in-canvas" : "foreign-object",
  debug: true
});
```

`supportsHtmlInCanvas()` checks for the WICG canvas APIs ReactSnap uses today: `layoutSubtree`, `requestPaint()`, and `CanvasRenderingContext2D.drawElementImage()`.

### `nodeToCanvas(input, options?)`

Low-level canvas rendering primitive used by the format helpers.

Most apps should call `renderToCanvas`, `renderToPng`, `renderToJpeg`, or `renderToWebp`. Reach for `nodeToCanvas` when you want the lower-level primitive directly.

```ts
import { nodeToCanvas } from "@reactsnap/core";

const widget = document.getElementById("widget");

if (!widget) {
  throw new Error("Missing #widget element");
}

const canvas = await nodeToCanvas(widget, {
  waitUntil: "fonts",
  scale: 2
});
```

### `nodeToSvgString(input, options?)`

Serialize a DOM node into an SVG string that wraps the cloned DOM subtree inside a `foreignObject`.

```ts
import { nodeToSvgString } from "@reactsnap/core";

const profileCard = document.getElementById("profile-card");

if (!profileCard) {
  throw new Error("Missing #profile-card element");
}

const svg = await nodeToSvgString(profileCard, {
  width: 800,
  height: 418
});

console.log(svg);
```

Write the SVG string into a downloadable file:

```ts
const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
const svgUrl = URL.createObjectURL(svgBlob);

const link = document.createElement("a");
link.href = svgUrl;
link.download = "profile-card.svg";
link.click();
```

### `nodeToSvgDataUrl(input, options?)`

Serialize a DOM node into an SVG data URL.

```ts
import { nodeToSvgDataUrl } from "@reactsnap/core";

const tile = document.getElementById("tile");

if (!tile) {
  throw new Error("Missing #tile element");
}

const dataUrl = await nodeToSvgDataUrl(tile, {
  width: 600,
  height: 600
});

const image = new Image();
image.src = dataUrl;
document.body.appendChild(image);
```

### `downloadBlob(blob, filename)`

Trigger a browser download for an already rendered `Blob`.

```ts
import { downloadBlob, renderToPng } from "@reactsnap/core";

const receipt = document.getElementById("receipt");

if (!receipt) {
  throw new Error("Missing #receipt element");
}

const blob = await renderToPng(receipt, {
  scale: 2,
  background: "#ffffff"
});

downloadBlob(blob, "receipt.png");
```

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
- `scale`: Multiply the rasterized output size. `2` is a good default for previews and share cards.
- `background`: Fill the canvas before drawing the exported node.
- `pixelRatio`: Reserved for future renderer tuning. The current baseline renderer primarily relies on `scale`.
- `strategy`: `auto` prefers WICG `html-in-canvas` when supported and falls back to `foreign-object`. `html-in-canvas` is explicit and experimental, and throws when the browser does not expose the required WICG APIs. `foreign-object` always uses the stable baseline.
- `waitUntil`: Wait for document readiness before capture. You can also pass a number in milliseconds.
- `fontEmbed`, `imageEmbed`, `allowTaint`, `timeout`, `debug`: Reserved for the next rendering milestones and API stability.

Recommended strategy usage:

- `auto`: sensible production default
- `html-in-canvas`: explicit validation or experimentation path
- `foreign-object`: deterministic baseline for compatibility-sensitive exports

Useful presets:

```ts
const ogImageOptions = {
  width: 1200,
  height: 630,
  scale: 2,
  background: "#ffffff",
  waitUntil: "fonts"
} satisfies RenderOptions;

const thumbnailOptions = {
  width: 320,
  height: 180,
  scale: 1,
  strategy: "foreign-object"
} satisfies RenderOptions;
```

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

Return the `Blob` without downloading it:

```tsx
import { useState } from "react";
import { useReactSnap } from "@reactsnap/react";

function ShareCard() {
  const { ref, exportPng } = useReactSnap({ scale: 2 });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handlePreview = async () => {
    const blob = await exportPng(undefined, {
      width: 1200,
      height: 630
    });

    setPreviewUrl(URL.createObjectURL(blob));
  };

  return (
    <section>
      <div ref={ref}>
        <Card />
      </div>
      <button onClick={() => void handlePreview()}>Generate preview</button>
      {previewUrl ? <img src={previewUrl} alt="Preview" /> : null}
    </section>
  );
}
```

Override the base options for a single export:

```tsx
const { ref, exportPng } = useReactSnap({
  scale: 2,
  background: "#ffffff"
});

await exportPng("tweet-card.png", {
  width: 1200,
  height: 675
});
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
- Omitting `filename` returns the rendered `Blob` without downloading, which is useful for in-app preview flows such as the dev workbench example.
- Per-call `options` are merged on top of the hook's `baseOptions`.
- If the ref is not attached yet, the hook throws `ReactSnap target ref is not attached.`

## `@reactsnap/svg`

### `renderToSvg(input, options?)`

Render a DOM node to an SVG string.

```ts
import { renderToSvg } from "@reactsnap/svg";

const badge = document.getElementById("badge");

if (!badge) {
  throw new Error("Missing #badge element");
}

const svg = await renderToSvg(badge, {
  width: 512,
  height: 512
});
```

### `SvgOptions`

```ts
type SvgMode = "raster" | "foreignObject";

type SvgOptions = RenderOptions & {
  svgMode?: SvgMode;
};
```

Current status:

- `svgMode: "foreignObject"` is the current implemented path.
- `svgMode: "raster"` is scaffolded but not implemented yet and currently throws.

Example:

```ts
const svg = await renderToSvg(node, {
  svgMode: "foreignObject",
  width: 1200,
  height: 630
});
```

## `@reactsnap/pdf`

### `renderToPdf(input, options?)`

PDF export is scaffolded but not implemented yet.

Current function signature:

```ts
import { renderToPdf } from "@reactsnap/pdf";

await renderToPdf(document.getElementById("invoice")!, {
  filename: "invoice.pdf"
});
```

### `PdfOptions`

```ts
type PdfOptions = RenderOptions & {
  filename?: string;
};
```

Current status:

- The API shape is in place.
- The current implementation throws: `PDF export is scaffolded but not implemented yet.`

## Current Baseline

The currently implemented renderer follows this browser-first sequence:

1. Clone the DOM subtree.
2. Inline computed styles into the clone.
3. Serialize the cloned subtree into SVG.
4. Load the SVG into an `Image`.
5. Draw the result onto a canvas.

That means the API is already useful for browser-side development previews, while some advanced asset handling and fallback strategies are still in progress.
