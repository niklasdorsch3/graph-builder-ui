# Graph Builder JSON Protocol

## Overview
A JSON-based protocol for representing directed/undirected graphs with rich node and edge metadata.

## Schema Version
Current version: `1.0.0`

## Top-Level Structure

```typescript
interface Graph {
  version: string;           // Schema version (e.g., "1.0.0")
  type: "directed" | "undirected";
  metadata?: GraphMetadata;  // Optional graph-level metadata
  nodes: Node[];            // Array of nodes
  edges: Edge[];            // Array of edges
}
```

## Node Structure

```typescript
interface Node {
  id: string;               // Unique identifier
  type?: string;            // Optional node type/category
  label?: string;           // Display label
  data?: Record<string, any>; // Custom node data
  style?: NodeStyle;        // Optional styling
}

interface NodeStyle {
  color?: string;
  size?: number;
  shape?: "circle" | "square" | "diamond" | "triangle";
  icon?: string;
}
```

## Edge Structure

```typescript
interface Edge {
  id: string;               // Unique identifier
  source: string;           // Source node ID
  target: string;           // Target node ID
  type?: string;            // Optional edge type/category
  label?: string;           // Display label
  weight?: number;          // Optional edge weight
  data?: Record<string, any>; // Custom edge data
  style?: EdgeStyle;        // Optional styling
}

interface EdgeStyle {
  color?: string;
  width?: number;
  dashed?: boolean;
  animated?: boolean;
}
```

## Graph Metadata

```typescript
interface GraphMetadata {
  title?: string;
  description?: string;
  author?: string;
  created?: string;         // ISO 8601 timestamp
  modified?: string;        // ISO 8601 timestamp
  tags?: string[];
  [key: string]: any;       // Additional custom metadata
}
```

## Design Principles

1. **Minimal Required Fields**: Only `id` is required for nodes/edges, plus `source`/`target` for edges
2. **Extensibility**: `data` field allows arbitrary custom properties
3. **Type Safety**: Clear type definitions for TypeScript/JSON Schema validation
4. **Human Readable**: JSON format is easy to read and edit manually
5. **Version Aware**: Schema version field for future compatibility
6. **Automatic Layout**: Positioning is handled by the UI component, not stored in JSON

## Example Use Cases

- Knowledge graphs
- Dependency graphs
- Social networks
- Flow diagrams
- Mind maps
- Organizational charts
