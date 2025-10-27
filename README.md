# Graph Builder UI

A React component library for building and visualizing JSON-based graphs with animated, force-directed layouts.

🔗 **[Live Demo](https://niklasdorsch3.github.io/graph-builder-ui)**

## Features

- 🎨 **Beautiful Layouts** - Hub-and-spoke circular layout with intelligent node positioning
- ✨ **Smooth Animations** - Spring-based animations powered by Framer Motion
- 🎯 **Interactive** - Hover over nodes to highlight connections
- 🧩 **Smart Algorithms** - Multiple layout optimization algorithms:
  - Node spacing to prevent overlaps
  - Edge visibility optimization
  - Edge contraction for compact graphs
  - Collision detection and adjustment
- 🎨 **Color-coded Nodes** - Visual distinction between hubs, children, and unconnected nodes
- 📦 **Zero Config** - Works out of the box with sensible defaults
- 🔧 **Customizable** - Toggle individual algorithms on/off

## Installation

```bash
npm install graph-builder-ui react react-dom framer-motion
```

## Usage

```jsx
import { GraphBuilder } from 'graph-builder-ui'

const myGraph = {
  version: "1.0",
  type: "directed",
  nodes: [
    { id: "hub1", label: "Main Hub" },
    { id: "node1", label: "Node 1" },
    { id: "node2", label: "Node 2" }
  ],
  edges: [
    { source: "hub1", target: "node1" },
    { source: "hub1", target: "node2" }
  ]
}

function App() {
  return <GraphBuilder graph={myGraph} />
}
```

## Graph Format

The component accepts graphs in the following JSON format:

```json
{
  "version": "1.0",
  "type": "directed",
  "nodes": [
    { "id": "unique-id", "label": "Display Name" }
  ],
  "edges": [
    { "source": "node-id-1", "target": "node-id-2" }
  ]
}
```

## Props

### `graph` (required)

The graph data object containing `nodes` and `edges`.

### `algorithmOptions` (optional)

Control which layout algorithms are applied:

```jsx
<GraphBuilder
  graph={myGraph}
  algorithmOptions={{
    useSpacing: true,           // Space out nodes to prevent overlaps
    useEdgeVisibility: true,    // Optimize edge visibility
    useContraction: true,       // Contract edges for compactness
    useCollision: true          // Adjust for node collisions
  }}
/>
```

All options default to `true`.

## Node Types

The component automatically categorizes nodes:

- **Purple (Hub Nodes)** - Nodes with many connections, positioned in the center
- **Blue (Direct Children)** - Nodes directly connected to hubs
- **Orange (Unconnected Children)** - Nodes connected through intermediate nodes
- **Gray (Isolated)** - Nodes with no connections

## Layout Algorithms

### Hub Detection
Automatically identifies hub nodes (nodes with ≥3 connections) and places them centrally.

### Circular Layout
Children nodes are positioned in a circular pattern around hubs at calculated angles.

### Node Spacing
Pushes overlapping nodes apart using force-based simulation.

### Edge Visibility
Moves nodes that block edges to clearer areas.

### Edge Contraction
Pulls connected nodes closer together for a more compact visualization.

### Zone Protection
- **Hub Zone** - Only hub nodes can exist in the center
- **Child Zone** - Only hubs and direct children allowed in the middle ring
- **Outer Zone** - Unconnected children positioned in the outer ring

## Interactive Features

- **Hover Highlighting** - Hover over any node to:
  - Highlight the node (full opacity, thicker border)
  - Highlight connected nodes (95% opacity)
  - Highlight connected edges (blue, thicker lines)
  - Dim unrelated nodes and edges

## Development

```bash
# Run the demo locally
npm run dev

# Build the library
npm run build

# Build the demo site
npm run build:demo

# Deploy demo to GitHub Pages
npm run deploy
```

## Examples

Check out the [live demo](https://niklasdorsch3.github.io/graph-builder-ui) to see:

- Example graphs with various structures
- Random graph generator with adjustable complexity
- Algorithm toggles to see each optimization in action
- Interactive node addition to test animations

## License

MIT © Niklas Dorsch

## Contributing

Issues and pull requests are welcome on [GitHub](https://github.com/niklasdorsch3/graph-builder-ui).
