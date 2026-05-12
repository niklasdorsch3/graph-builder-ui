# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev                    # Start dev server at localhost:5173
npm run dev -- --host 0.0.0.0  # Expose on network

# Building
npm run build                  # Build the npm library (ESM + UMD) → dist/
npm run build:demo             # Build the demo site → demo-dist/

# Deploying the demo
npm run deploy                 # build:demo then push demo-dist/ to gh-pages branch
```

There are no tests or linting scripts configured.

## Architecture

This repo is a **dual-purpose project**: a publishable React component library and a hosted demo app.

### Library vs Demo modes (Vite config)

`vite.config.ts` switches behavior based on `--mode`:
- **`lib` (default)** — builds `src/index.jsx` as a library with externalized `react`, `react-dom`, `framer-motion`. Outputs `dist/graph-builder-ui.{es,umd}.js`.
- **`demo`** — builds `src/demo.jsx` as a standalone app with `base: '/graph-builder-ui/'` for GitHub Pages. Outputs `demo-dist/`.

The `demo-dist/` directory is gitignored and deployed separately to the `gh-pages` branch.

### Data flow

```
graph JSON (user prop)
  → createGraphData() in utils/layout.js
      → CircularLayoutEngine.compute()   # assigns x,y to every node
      → adjustForCollisions()            # pass 1
      → spaceOutNodes()
      → optimizeEdgeVisibility()
      → contractEdges()
      → adjustForCollisions()            # pass 2
  → GraphCanvas (SVG, 800×600)
      → Edge components (layer 1)
      → Node circle components (layer 2)
      → Node label components (layer 3)
```

### Layout engine (`src/utils/layout.js`)

`CircularLayoutEngine` is the core algorithm class. It runs a 13-step pipeline:

1. **Degree calculation** — counts connections per node
2. **Isolated node separation** — degree-0 nodes go to outer ring
3. **Adjacency list** — for neighbor lookups
4. **Sort by degree** — high-degree nodes first
5. **Hub identification** — nodes with degree ≥ 67% of max (minimum 2) become hubs
6. **Angular allocation** — each hub gets a proportional slice of the circle
7. **Hub positioning** — single hub → center; multiple hubs → inner circle
8. **Child→hub mapping** — each child assigned to its first connected hub
9. **Unconnected child discovery** — BFS to find nodes reachable through children
10. **Unconnected child marking** — flags nodes not directly touching a hub
11. **Direct child positioning** — children distributed evenly in hub's angular slice
12. **Unconnected child positioning** — placed near their connecting child at larger radius
13. **Isolated node positioning** — evenly spaced on outermost circle

After the engine runs, four post-processing passes refine positions (see `src/utils/` files). All four can be toggled via `algorithmOptions` props.

### Node types and colors

Nodes carry boolean flags set during layout: `isHub`, `isIsolated`, `isUnconnected`. The `Node` component maps these to colors: hub → purple, direct child → blue, unconnected child → orange, isolated → gray.

### Graph JSON schema

Defined in `schema/graph-schema.md`. Only `id` is required for nodes; `source` + `target` for edges. The `data` field supports arbitrary custom properties. Node positions are **not** stored in JSON — they are always computed at render time.

### Public URL

The demo deploys to `https://niklasdorsch.com/graph-builder-ui/` (custom domain configured on the GitHub Pages site for `niklasdorsch3.github.io`).
