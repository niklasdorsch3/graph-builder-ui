import React from 'react'
import { motion } from 'framer-motion'

export const Node = ({ node, renderLayer, onMouseEnter, onMouseLeave, isHovered, isConnected, isDimmed }) => {
  const fontSize = 12
  const avgCharWidth = 6.5
  const padding = 12

  // Use label if available, otherwise use id
  const displayText = node.label || node.id

  // Calculate text dimensions
  const textWidth = displayText.length * avgCharWidth
  const textHeight = fontSize

  // Calculate ellipse radii to fit text
  const radiusX = (textWidth / 2) + padding
  const radiusY = textHeight + padding

  // Determine colors based on node type
  let fillColor, strokeColor
  if (node.isIsolated) {
    // Gray for isolated nodes (no connections)
    fillColor = '#95A5A6'
    strokeColor = '#7F8C8D'
  } else if (node.isHub) {
    // Purple for hub nodes
    fillColor = '#9B59B6'
    strokeColor = '#7D3C98'
  } else if (node.isUnconnected) {
    // Orange for unconnected children (connected through other children)
    fillColor = '#E67E22'
    strokeColor = '#D35400'
  } else {
    // Blue for directly connected child nodes
    fillColor = '#4A90E2'
    strokeColor = '#2E5C8A'
  }

  // Adjust opacity and stroke based on hover state
  let opacity = 0.8
  let strokeWidth = 2

  if (isHovered) {
    opacity = 1.0
    strokeWidth = 3
  } else if (isConnected) {
    opacity = 0.95 // Connected nodes are slightly highlighted
    strokeWidth = 2.5
  } else if (isDimmed) {
    opacity = 0.3
  }

  // Render the ellipse/circle
  if (renderLayer === 'circle') {
    return (
      <motion.ellipse
        animate={{
          cx: node.x,
          cy: node.y,
          opacity: opacity,
          strokeWidth: strokeWidth
        }}
        initial={false}
        transition={{
          type: 'spring',
          stiffness: 100,
          damping: 15,
          mass: 0.5
        }}
        rx={radiusX}
        ry={radiusY}
        fill={fillColor}
        stroke={strokeColor}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{ cursor: 'pointer' }}
      />
    )
  }

  // Render text inside the ellipse
  if (renderLayer === 'label') {
    return (
      <motion.text
        animate={{
          x: node.x,
          y: node.y
        }}
        initial={false}
        transition={{
          type: 'spring',
          stiffness: 100,
          damping: 15,
          mass: 0.5
        }}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize={fontSize}
        fontWeight="500"
        fontFamily="system-ui, -apple-system, sans-serif"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{ cursor: 'pointer', pointerEvents: 'all' }}
      >
        {displayText}
      </motion.text>
    )
  }

  return null
}
