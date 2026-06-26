# ReactSnap

Render React components and DOM nodes to PNG, PDF, and SVG.

ReactSnap is a lightweight export engine for product teams that want to turn real UI into assets without reaching for Puppeteer or re-implementing CSS in JavaScript. The long-term direction is native browser rendering first, with graceful fallback strategies when the platform cannot do everything directly.

## Project Scope

ReactSnap focuses on one job:

`React Component / DOM Node -> PNG / PDF / SVG`

It does not try to be a poster editor, design tool, template marketplace, or whiteboard product.

## Monorepo Layout

```txt
reactsnap/
├── packages/
│   ├── core/
│   ├── react/
│   ├── pdf/
│   ├── svg/
│   └── cli/
├── examples/
│   └── vite-react/
├── docs/
├── playground/
├── benchmarks/
└── tests/
```

## Package Overview

- `@reactsnap/core`: DOM-first rendering primitives and format helpers.
- `@reactsnap/react`: React hook and ergonomic browser helpers.
- `@reactsnap/pdf`: PDF API surface for the planned document pipeline.
- `@reactsnap/svg`: SVG-focused helpers and mode selection.
- `@reactsnap/cli`: future CLI entrypoint for scripted exports.

## Current Bootstrap

This repository bootstrap includes:

- a `pnpm` workspace
- TypeScript package scaffolding
- a browser-friendly `foreignObject` rendering baseline in `@reactsnap/core`
- a React hook in `@reactsnap/react`
- placeholder package APIs for PDF, SVG, and CLI
- a Vite example app showing the intended developer experience

## Target API

```tsx
import { renderToPng } from "@reactsnap/core";

const blob = await renderToPng(document.getElementById("card")!, {
  width: 1200,
  height: 630,
  scale: 2
});
```

```tsx
import { useReactSnap } from "@reactsnap/react";

function App() {
  const { ref, exportPng } = useReactSnap();

  return (
    <>
      <div ref={ref}>
        <Card />
      </div>
      <button onClick={() => exportPng("card.png")}>Export PNG</button>
    </>
  );
}
```

## Strategy Direction

The initial implementation uses a `foreignObject`-based strategy as the baseline. The intended evolution is:

1. `auto`
2. `html-in-canvas` when browsers support it well enough
3. `foreign-object` fallback

## Next Build Steps

1. Add asset inlining for fonts and images.
2. Implement a real PDF backend.
3. Add browser capability detection and strategy fallback.
4. Add test fixtures and rendering benchmarks.

## Docs

- [Development Guide](/Volumes/github/private/reactsnap/docs/development-guide.md)
- [Roadmap](/Volumes/github/private/reactsnap/docs/roadmap.md)
- [Architecture](/Volumes/github/private/reactsnap/docs/architecture.md)
