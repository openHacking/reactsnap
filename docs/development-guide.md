# Development Guide

## Requirements

- Node.js 20+
- `pnpm` 10+

## Quick Start

```bash
pnpm install
pnpm dev:example
```

This starts the Vite example app and resolves local workspace packages directly from source.

## Common Commands

```bash
pnpm dev:example
pnpm build
pnpm build:example
pnpm check
```

`pnpm build` currently targets the production-ready subset of the repo: `@reactsnap/core`, `@reactsnap/react`, and `examples/vite-react`.

## Workspace Notes

- `packages/core` contains the browser rendering baseline.
- `packages/react` wraps the core package with React ergonomics.
- `examples/vite-react` is the reference local development surface.
- `packages/pdf`, `packages/svg`, and `packages/cli` are scaffolded for the next milestones.
- `packages/pdf`, `packages/svg`, and `packages/cli` are scaffolded placeholders and are not part of the default verification loop yet.

## Current Rendering Baseline

The repository currently uses a `foreignObject` export path:

1. clone the DOM subtree
2. inline computed styles into the clone
3. serialize the clone into SVG
4. load the SVG into an `Image`
5. draw the `Image` onto a canvas

This is enough to validate the package shape and demo flow, but it is not yet the final architecture.

## Known Limitations

- font fetching and embedding are not implemented
- image asset inlining is not implemented
- PDF export is scaffolded but not implemented
- SVG raster mode is scaffolded but not implemented
- browser capability detection for `html-in-canvas` is not implemented

## Suggested Next Tasks

1. Add a proper asset inlining pipeline for fonts and images.
2. Add visual fixtures under `tests/`.
3. Implement `renderToPdf`.
4. Add `auto` strategy selection with capability detection.
