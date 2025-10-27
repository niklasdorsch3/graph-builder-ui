/**
 * Calculate bounding box for an ellipse node
 * @param {Object} node - Node with x, y, label
 * @param {number} fontSize - Font size
 * @param {number} avgCharWidth - Average character width
 * @param {number} padding - Padding inside ellipse
 * @returns {Object} Bounding box {minX, maxX, minY, maxY, radiusX, radiusY}
 */
export function getNodeBounds(node, fontSize = 12, avgCharWidth = 6.5, padding = 12) {
  const displayText = node.label || node.id
  const textWidth = displayText.length * avgCharWidth
  const textHeight = fontSize

  const radiusX = (textWidth / 2) + padding
  const radiusY = textHeight + padding

  // Add extra spacing margin for collision detection (2px buffer)
  const margin = 5

  return {
    minX: node.x - radiusX - margin,
    maxX: node.x + radiusX + margin,
    minY: node.y - radiusY - margin,
    maxY: node.y + radiusY + margin,
    radiusX,
    radiusY
  }
}

/**
 * Check if two ellipses overlap
 * @param {Object} bounds1 - First node bounds
 * @param {Object} bounds2 - Second node bounds
 * @returns {boolean} True if overlapping
 */
export function checkOverlap(bounds1, bounds2) {
  // Simple bounding box collision check
  const overlapX = bounds1.minX < bounds2.maxX && bounds1.maxX > bounds2.minX
  const overlapY = bounds1.minY < bounds2.maxY && bounds1.maxY > bounds2.minY

  return overlapX && overlapY
}

/**
 * Adjust node positions to avoid overlaps
 * Uses iterative force-based separation
 * @param {Array} nodes - Array of positioned nodes
 * @param {number} iterations - Number of adjustment iterations
 * @returns {Array} Adjusted nodes
 */
export function adjustForCollisions(nodes, iterations = 50) {
  const adjustedNodes = nodes.map(node => ({ ...node }))
  const centerX = 400
  const centerY = 300

  for (let iter = 0; iter < iterations; iter++) {
    let hasOverlap = false

    for (let i = 0; i < adjustedNodes.length; i++) {
      const node1 = adjustedNodes[i]
      const bounds1 = getNodeBounds(node1)

      for (let j = i + 1; j < adjustedNodes.length; j++) {
        const node2 = adjustedNodes[j]
        const bounds2 = getNodeBounds(node2)

        if (checkOverlap(bounds1, bounds2)) {
          hasOverlap = true

          // Calculate direction to push nodes apart
          const dx = node2.x - node1.x
          const dy = node2.y - node1.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 0.1) continue // Avoid division by zero

          // Push nodes apart along the line between them
          const pushStrength = 2
          const pushX = (dx / distance) * pushStrength
          const pushY = (dy / distance) * pushStrength

          // Push away from each other
          node1.x -= pushX
          node1.y -= pushY
          node2.x += pushX
          node2.y += pushY

          // Maintain radial distance from center (preserve ring structure)
          const dist1 = Math.sqrt((node1.x - centerX) ** 2 + (node1.y - centerY) ** 2)
          const dist2 = Math.sqrt((node2.x - centerX) ** 2 + (node2.y - centerY) ** 2)

          const angle1 = Math.atan2(node1.y - centerY, node1.x - centerX)
          const angle2 = Math.atan2(node2.y - centerY, node2.x - centerX)

          node1.x = centerX + Math.cos(angle1) * dist1
          node1.y = centerY + Math.sin(angle1) * dist1
          node2.x = centerX + Math.cos(angle2) * dist2
          node2.y = centerY + Math.sin(angle2) * dist2
        }
      }
    }

    // Early exit if no overlaps detected
    if (!hasOverlap) break
  }

  return adjustedNodes
}
