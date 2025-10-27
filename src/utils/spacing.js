/**
 * Space out nodes to avoid overlaps
 * Uses only center points - moves points away from each other
 * Hub nodes stay near center, non-hub nodes move more aggressively
 *
 * @param {Array} nodes - Array of positioned nodes
 * @param {Object} bounds - Canvas boundaries {minX, maxX, minY, maxY}
 * @param {number} iterations - Number of spacing iterations
 * @returns {Array} Adjusted nodes
 */
export function spaceOutNodes(nodes, bounds, iterations = 50) {
  const adjustedNodes = nodes.map((node, index) => ({
    ...node,
    originalIndex: index
  }))

  for (let iter = 0; iter < iterations; iter++) {
    let hadMovement = false

    for (let i = 0; i < adjustedNodes.length; i++) {
      const node = adjustedNodes[i]
      let pushX = 0
      let pushY = 0

      // Check distance from center point to all other center points
      for (let j = 0; j < adjustedNodes.length; j++) {
        if (i === j) continue

        const other = adjustedNodes[j]

        // Calculate distance between center points
        const dx = node.x - other.x
        const dy = node.y - other.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        // If center points are too close, push them apart
        const minDistance = 150 // Minimum desired distance between center points (increased)

        if (distance < minDistance) {
          hadMovement = true

          // Calculate push direction (away from other node's center)
          if (distance > 0.1) {
            const pushStrength = (minDistance - distance) / distance
            pushX += (dx / distance) * pushStrength * 3 // Multiply by 3 for stronger push
            pushY += (dy / distance) * pushStrength * 3
          } else {
            // If centers are exactly on top, push in random direction
            pushX += (Math.random() - 0.5) * 10
            pushY += (Math.random() - 0.5) * 10
          }
        }
      }

      // Apply push force to move the center point
      // Hub nodes move less (0.5x), non-hub nodes move more aggressively (2.5x)
      const movementMultiplier = node.isHub ? 0.5 : 2.5
      node.x += pushX * movementMultiplier
      node.y += pushY * movementMultiplier

      // Add tiny offset based on index to prevent exact overlaps
      const offset = node.originalIndex * 0.1
      node.x += offset * 0.01
      node.y += offset * 0.01

      // Constrain center point to bounds with margin
      const margin = 20
      node.x = Math.max(bounds.minX + margin, Math.min(bounds.maxX - margin, node.x))
      node.y = Math.max(bounds.minY + margin, Math.min(bounds.maxY - margin, node.y))
    }

    // Early exit if no movement
    if (!hadMovement) break
  }

  return adjustedNodes
}
