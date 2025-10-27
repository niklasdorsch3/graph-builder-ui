import { getNodeBounds } from './collision'

/**
 * Check if a line segment intersects with a node's bounding box
 * @param {Object} edge - Edge with source and target node references
 * @param {Object} sourceNode - Source node with x, y
 * @param {Object} targetNode - Target node with x, y
 * @param {Object} blockingNode - Node that might block the edge
 * @returns {boolean} True if edge passes through the node's bounding box
 */
function doesEdgeIntersectNode(edge, sourceNode, targetNode, blockingNode) {
  // Don't check if the blocking node is the source or target
  if (blockingNode.id === sourceNode.id || blockingNode.id === targetNode.id) {
    return false
  }

  const bounds = getNodeBounds(blockingNode)

  // Get edge endpoints
  const x1 = sourceNode.x
  const y1 = sourceNode.y
  const x2 = targetNode.x
  const y2 = targetNode.y

  // Check if the line segment intersects with the bounding box
  // Use a simple algorithm: check if line crosses any of the 4 box edges

  // First, quick rejection test: if both endpoints are outside on same side, no intersection
  if ((x1 < bounds.minX && x2 < bounds.minX) ||
      (x1 > bounds.maxX && x2 > bounds.maxX) ||
      (y1 < bounds.minY && y2 < bounds.minY) ||
      (y1 > bounds.maxY && y2 > bounds.maxY)) {
    return false
  }

  // Check if line segment intersects with the bounding box
  // We'll check if the line passes through the rectangle
  return lineIntersectsRect(x1, y1, x2, y2, bounds.minX, bounds.minY, bounds.maxX, bounds.maxY)
}

/**
 * Check if a line segment intersects with a rectangle
 */
function lineIntersectsRect(x1, y1, x2, y2, rectMinX, rectMinY, rectMaxX, rectMaxY) {
  // Check if either endpoint is inside the rectangle
  if (pointInRect(x1, y1, rectMinX, rectMinY, rectMaxX, rectMaxY) ||
      pointInRect(x2, y2, rectMinX, rectMinY, rectMaxX, rectMaxY)) {
    return true
  }

  // Check intersection with each of the 4 rectangle edges
  // Top edge
  if (lineSegmentIntersect(x1, y1, x2, y2, rectMinX, rectMinY, rectMaxX, rectMinY)) return true
  // Right edge
  if (lineSegmentIntersect(x1, y1, x2, y2, rectMaxX, rectMinY, rectMaxX, rectMaxY)) return true
  // Bottom edge
  if (lineSegmentIntersect(x1, y1, x2, y2, rectMinX, rectMaxY, rectMaxX, rectMaxY)) return true
  // Left edge
  if (lineSegmentIntersect(x1, y1, x2, y2, rectMinX, rectMinY, rectMinX, rectMaxY)) return true

  return false
}

/**
 * Check if a point is inside a rectangle
 */
function pointInRect(x, y, minX, minY, maxX, maxY) {
  return x >= minX && x <= maxX && y >= minY && y <= maxY
}

/**
 * Check if two line segments intersect
 * Line 1: (x1,y1) to (x2,y2)
 * Line 2: (x3,y3) to (x4,y4)
 */
function lineSegmentIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
  const denom = ((y4 - y3) * (x2 - x1)) - ((x4 - x3) * (y2 - y1))

  if (denom === 0) return false // Lines are parallel

  const ua = (((x4 - x3) * (y1 - y3)) - ((y4 - y3) * (x1 - x3))) / denom
  const ub = (((x2 - x1) * (y1 - y3)) - ((y2 - y1) * (x1 - x3))) / denom

  // Check if intersection point is on both line segments
  return (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1)
}

/**
 * Find the closest point on the edge to the blocking node
 * This helps us determine where to apply the push force
 */
function closestPointOnLine(lineX1, lineY1, lineX2, lineY2, pointX, pointY) {
  const dx = lineX2 - lineX1
  const dy = lineY2 - lineY1
  const lengthSquared = dx * dx + dy * dy

  if (lengthSquared === 0) {
    return { x: lineX1, y: lineY1 }
  }

  // Calculate projection parameter
  const t = Math.max(0, Math.min(1,
    ((pointX - lineX1) * dx + (pointY - lineY1) * dy) / lengthSquared
  ))

  return {
    x: lineX1 + t * dx,
    y: lineY1 + t * dy
  }
}

/**
 * Optimize node positions to improve edge visibility
 * Moves nodes slightly when edges pass through them
 *
 * @param {Array} nodes - Array of positioned nodes
 * @param {Array} edges - Array of edges with source/target IDs
 * @param {number} iterations - Number of optimization iterations
 * @returns {Array} Adjusted nodes
 */
export function optimizeEdgeVisibility(nodes, edges, iterations = 40) {
  const adjustedNodes = nodes.map(node => ({ ...node }))

  // Create a map for quick node lookup
  const nodeMap = new Map()
  adjustedNodes.forEach(node => nodeMap.set(node.id, node))

  for (let iter = 0; iter < iterations; iter++) {
    let hadMovement = false

    // Check each edge
    for (const edge of edges) {
      const sourceNode = nodeMap.get(edge.source)
      const targetNode = nodeMap.get(edge.target)

      if (!sourceNode || !targetNode) continue

      // Check if any node blocks this edge
      for (const blockingNode of adjustedNodes) {
        if (doesEdgeIntersectNode(edge, sourceNode, targetNode, blockingNode)) {
          hadMovement = true

          // Calculate push direction perpendicular to the edge
          const edgeDx = targetNode.x - sourceNode.x
          const edgeDy = targetNode.y - sourceNode.y
          const edgeLength = Math.sqrt(edgeDx * edgeDx + edgeDy * edgeDy)

          if (edgeLength < 0.1) continue

          // Find closest point on edge to blocking node
          const closest = closestPointOnLine(
            sourceNode.x, sourceNode.y,
            targetNode.x, targetNode.y,
            blockingNode.x, blockingNode.y
          )

          // Calculate direction from closest point to blocking node
          const pushDx = blockingNode.x - closest.x
          const pushDy = blockingNode.y - closest.y
          const pushDistance = Math.sqrt(pushDx * pushDx + pushDy * pushDy)

          if (pushDistance < 0.1) continue

          // Push the blocking node away from the edge (more aggressively)
          const pushStrength = 5.0 // Increased from 1.5 to 5.0
          blockingNode.x += (pushDx / pushDistance) * pushStrength
          blockingNode.y += (pushDy / pushDistance) * pushStrength
        }
      }
    }

    // Early exit if no movement
    if (!hadMovement) break
  }

  return adjustedNodes
}
