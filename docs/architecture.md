# Architecture

## Product Boundary

ReactSnap focuses on:

`React Component / DOM Node -> PNG / PDF / SVG`

The project is intentionally narrow so the rendering engine can stay dependable.

## Current Flow

```txt
DOM Node
  -> clone subtree
  -> inline computed styles
  -> serialize SVG foreignObject
  -> decode in Image
  -> draw to Canvas
  -> export Blob
```

## Planned Flow

```txt
React Component
  -> isolated render root
  -> wait for fonts, images, layout readiness
  -> choose strategy
  -> canvas or vector pipeline
  -> PNG / JPEG / WebP / PDF / SVG
```

## Strategy Model

- `foreign-object`: current baseline and fallback
- `html-in-canvas`: preferred future browser-native path
- `auto`: capability-based router

## Package Responsibilities

- `@reactsnap/core`: rendering primitives, strategy selection, asset prep
- `@reactsnap/react`: hooks and React-first ergonomics
- `@reactsnap/pdf`: PDF-oriented output adapters
- `@reactsnap/svg`: SVG mode selection and output helpers
- `@reactsnap/cli`: automation and scripting entrypoint
