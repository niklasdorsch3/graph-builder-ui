import React from 'react'
import { motion } from 'framer-motion'

export const Edge = ({ edge, sourceNode, targetNode, isHighlighted, isDimmed }) => {
  if (!sourceNode || !targetNode) {
    return null
  }

  // Determine edge styling based on hover state
  let stroke = '#999'
  let strokeWidth = 2
  let opacity = 1

  if (isHighlighted) {
    stroke = '#4A90E2' // Blue when highlighted
    strokeWidth = 3
    opacity = 1
  } else if (isDimmed) {
    opacity = 0.2 // Dim other edges when hovering a node
  }

  return (
    <motion.line
      animate={{
        x1: sourceNode.x,
        y1: sourceNode.y,
        x2: targetNode.x,
        y2: targetNode.y,
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
      stroke={stroke}
    />
  )
}
