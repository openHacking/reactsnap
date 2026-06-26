# Roadmap

## Vision

ReactSnap should become a reliable export engine for React teams that need:

- component snapshots
- share cards
- invoice and report exports
- UI-driven document generation

## Milestones

### v0.1 Bootstrap

- `pnpm` monorepo
- `@reactsnap/core` baseline export path
- `@reactsnap/react` hook
- Vite example that runs locally
- initial documentation

### v0.2 Rendering Stability

- font embedding
- image embedding
- better style normalization
- debug diagnostics
- browser fixture tests

### v0.3 Output Expansion

- PDF export
- SVG export modes
- JPEG / WebP polish
- CLI draft commands

### v0.4 Strategy Engine

- capability detection
- `auto` strategy selection
- `html-in-canvas` experimental support
- fallback tracing for debugging

### v1.0 Public Release

- stable API
- compatibility matrix
- benchmark suite against `html2canvas` and similar tools
- examples for Next.js, OG image, and invoices

## Non-Goals

- poster editor
- Canva-like product
- design surface
- template marketplace
