import React, { useState } from 'react'
import { Node } from './Node'
import { Edge } from './Edge'

export const GraphCanvas = ({ graphData }) => {
  const { nodes, edges } = graphData
  const [hoveredNodeId, setHoveredNodeId] = useState(null)

  // Create a lookup map for quick node access
  const nodeMap = new Map(nodes.map(node => [node.id, node]))

  // Find which edges are connected to the hovered node
  const isEdgeHighlighted = (edge) => {
    if (!hoveredNodeId) return false
    return edge.source === hoveredNodeId || edge.target === hoveredNodeId
  }

  // Find which nodes are connected to the hovered node
  const getConnectedNodeIds = () => {
    if (!hoveredNodeId) return new Set()

    const connectedIds = new Set()
    edges.forEach(edge => {
      if (edge.source === hoveredNodeId) {
        connectedIds.add(edge.target)
      } else if (edge.target === hoveredNodeId) {
        connectedIds.add(edge.source)
      }
    })
    return connectedIds
  }

  const connectedNodeIds = getConnectedNodeIds()

  const isNodeHighlighted = (nodeId) => {
    if (!hoveredNodeId) return false
    return nodeId === hoveredNodeId || connectedNodeIds.has(nodeId)
  }

  return (
    <svg
      width="800"
      height="600"
      style={{
        border: '1px solid #ccc',
        backgroundColor: '#f9f9f9'
      }}
    >
      {/* Layer 1: Edges (bottom) */}
      <g>
        {edges.map(edge => {
          const sourceNode = nodeMap.get(edge.source)
          const targetNode = nodeMap.get(edge.target)
          return (
            <Edge
              key={edge.id}
              edge={edge}
              sourceNode={sourceNode}
              targetNode={targetNode}
              isHighlighted={isEdgeHighlighted(edge)}
              isDimmed={hoveredNodeId !== null && !isEdgeHighlighted(edge)}
            />
          )
        })}
      </g>

      {/* Layer 2: Node ellipses/circles */}
      <g>
        {nodes.map(node => (
          <Node
            key={`circle-${node.id}`}
            node={node}
            renderLayer="circle"
            onMouseEnter={() => setHoveredNodeId(node.id)}
            onMouseLeave={() => setHoveredNodeId(null)}
            isHovered={hoveredNodeId === node.id}
            isConnected={connectedNodeIds.has(node.id)}
            isDimmed={hoveredNodeId !== null && !isNodeHighlighted(node.id)}
          />
        ))}
      </g>

      {/* Layer 3: Text labels inside nodes */}
      <g>
        {nodes.map(node => (
          <Node
            key={`label-${node.id}`}
            node={node}
            renderLayer="label"
            onMouseEnter={() => setHoveredNodeId(node.id)}
            onMouseLeave={() => setHoveredNodeId(null)}
          />
        ))}
      </g>
    </svg>
  )
}
