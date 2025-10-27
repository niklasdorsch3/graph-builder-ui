/**
 * Calculate distance between two points
 */
function distance(x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Calculate the hub zone boundaries
 * Returns center point and radius defining the hub area
 */
function calculateHubZone(nodes) {
  const hubNodes = nodes.filter(node => node.isHub)

  if (hubNodes.length === 0) {
    return { centerX: 400, centerY: 300, radius: 0 }
  }

  // Calculate center of all hubs
  const centerX = hubNodes.reduce((sum, node) => sum + node.x, 0) / hubNodes.length
  const centerY = hubNodes.reduce((sum, node) => sum + node.y, 0) / hubNodes.length

  // Find the maximum distance from center to any hub, add buffer
  let maxHubDistance = 0
  for (const hub of hubNodes) {
    const dist = distance(centerX, centerY, hub.x, hub.y)
    maxHubDistance = Math.max(maxHubDistance, dist)
  }

  // Hub zone radius is max hub distance plus 40px buffer
  const radius = maxHubDistance + 40

  return { centerX, centerY, radius }
}

/**
 * Calculate the child zone boundaries
 * Returns the outer radius where child nodes (directly connected) are allowed
 */
function calculateChildZone(nodes, hubZone) {
  const childNodes = nodes.filter(node => !node.isHub && !node.isUnconnected && !node.isIsolated)

  if (childNodes.length === 0) {
    return { radius: hubZone.radius + 100 }
  }

  // Find the maximum distance from center to any child node, add buffer
  let maxChildDistance = hubZone.radius
  for (const child of childNodes) {
    const dist = distance(hubZone.centerX, hubZone.centerY, child.x, child.y)
    maxChildDistance = Math.max(maxChildDistance, dist)
  }

  // Child zone radius is max child distance plus 40px buffer
  const radius = maxChildDistance + 40

  return { radius }
}

/**
 * Check if a non-hub node would enter the hub zone
 */
function wouldEnterHubZone(node, newX, newY, hubZone) {
  if (node.isHub) return false // Hubs can be in hub zone

  const distToCenter = distance(newX, newY, hubZone.centerX, hubZone.centerY)
  return distToCenter < hubZone.radius
}

/**
 * Check if an unconnected node would enter the child zone
 */
function wouldEnterChildZone(node, newX, newY, hubZone, childZone) {
  // Only restrict unconnected children (orange nodes)
  if (!node.isUnconnected) return false

  const distToCenter = distance(newX, newY, hubZone.centerX, hubZone.centerY)
  return distToCenter < childZone.radius
}

/**
 * Contract edges to reduce their length
 * Pulls connected nodes closer together iteratively
 * Prevents non-hub nodes from entering the hub area
 *
 * @param {Array} nodes - Array of positioned nodes
 * @param {Array} edges - Array of edges with source/target IDs
 * @param {number} iterations - Number of contraction iterations
 * @param {number} pullStrength - How strongly to pull nodes together (0-1)
 * @returns {Array} Adjusted nodes with shorter edges
 */
export function contractEdges(nodes, edges, iterations = 20, pullStrength = 0.3) {
  const adjustedNodes = nodes.map(node => ({ ...node }))

  // Create a map for quick node lookup
  const nodeMap = new Map()
  adjustedNodes.forEach(node => nodeMap.set(node.id, node))

  // Calculate hub zone and child zone boundaries
  const hubZone = calculateHubZone(adjustedNodes)
  const childZone = calculateChildZone(adjustedNodes, hubZone)

  for (let iter = 0; iter < iterations; iter++) {
    // For each edge, pull the nodes closer together
    for (const edge of edges) {
      const sourceNode = nodeMap.get(edge.source)
      const targetNode = nodeMap.get(edge.target)

      if (!sourceNode || !targetNode) continue

      // Calculate current distance
      const dx = targetNode.x - sourceNode.x
      const dy = targetNode.y - sourceNode.y
      const dist = distance(sourceNode.x, sourceNode.y, targetNode.x, targetNode.y)

      if (dist < 0.1) continue // Skip if already very close

      // Calculate midpoint between nodes
      const midX = (sourceNode.x + targetNode.x) / 2
      const midY = (sourceNode.y + targetNode.y) / 2

      // Pull both nodes towards the midpoint
      // Hub nodes resist movement more
      const sourceMultiplier = sourceNode.isHub ? 0.1 : 1.0
      const targetMultiplier = targetNode.isHub ? 0.1 : 1.0

      // Move towards midpoint
      const pullX = (midX - sourceNode.x) * pullStrength * sourceMultiplier
      const pullY = (midY - sourceNode.y) * pullStrength * sourceMultiplier

      const newSourceX = sourceNode.x + pullX
      const newSourceY = sourceNode.y + pullY

      // Check zone violations before applying movement
      const sourceEntersHub = wouldEnterHubZone(sourceNode, newSourceX, newSourceY, hubZone)
      const sourceEntersChild = wouldEnterChildZone(sourceNode, newSourceX, newSourceY, hubZone, childZone)

      if (!sourceEntersHub && !sourceEntersChild) {
        sourceNode.x = newSourceX
        sourceNode.y = newSourceY
      }

      const pullX2 = (midX - targetNode.x) * pullStrength * targetMultiplier
      const pullY2 = (midY - targetNode.y) * pullStrength * targetMultiplier

      const newTargetX = targetNode.x + pullX2
      const newTargetY = targetNode.y + pullY2

      // Check zone violations before applying movement
      const targetEntersHub = wouldEnterHubZone(targetNode, newTargetX, newTargetY, hubZone)
      const targetEntersChild = wouldEnterChildZone(targetNode, newTargetX, newTargetY, hubZone, childZone)

      if (!targetEntersHub && !targetEntersChild) {
        targetNode.x = newTargetX
        targetNode.y = newTargetY
      }
    }

    // Gradually reduce pull strength for stability
    pullStrength *= 0.95
  }

  return adjustedNodes
}
