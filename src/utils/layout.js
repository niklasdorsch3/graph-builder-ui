import { adjustForCollisions } from './collision'
import { spaceOutNodes } from './spacing'
import { optimizeEdgeVisibility } from './edgeVisibility'
import { contractEdges } from './edgeContraction'

/**
 * CircularLayoutEngine - Handles graph layout with hub-and-spoke arrangement
 */
class CircularLayoutEngine {
  constructor(nodes, edges, centerX = 400, centerY = 300, minRadius = 180, maxRadius = 240) {
    this.nodes = nodes
    this.edges = edges
    this.centerX = centerX
    this.centerY = centerY
    this.minRadius = minRadius
    this.maxRadius = maxRadius
    this.childRadius = maxRadius + 60

    // State that will be computed
    this.degrees = new Map()
    this.adjacency = new Map()
    this.maxDegree = 0
    this.minDegree = 0
    this.sortedNodes = []
    this.hubNodes = []
    this.positions = new Map()
    this.childrenToHubs = new Map()
    this.hubToChildren = new Map()
    this.hubAngularRanges = new Map()
    this.isolatedNodes = [] // Nodes with no connections
    this.isolatedRadius = this.childRadius + 100 // Place isolated nodes even further out
  }

  /**
   * Calculate degree (number of connections) for each node
   */
  calculateDegrees() {
    // Initialize all nodes with degree 0
    this.nodes.forEach(node => this.degrees.set(node.id, 0))

    // Count connections (both incoming and outgoing)
    this.edges.forEach(edge => {
      this.degrees.set(edge.source, (this.degrees.get(edge.source) || 0) + 1)
      this.degrees.set(edge.target, (this.degrees.get(edge.target) || 0) + 1)
    })

    this.maxDegree = Math.max(...Array.from(this.degrees.values()))
    this.minDegree = Math.min(...Array.from(this.degrees.values()))
  }

  /**
   * Build adjacency list for quick neighbor lookup
   */
  buildAdjacencyList() {
    this.nodes.forEach(node => this.adjacency.set(node.id, new Set()))

    this.edges.forEach(edge => {
      this.adjacency.get(edge.source).add(edge.target)
      this.adjacency.get(edge.target).add(edge.source)
    })
  }

  /**
   * Identify and separate isolated nodes (nodes with no connections)
   * These will be positioned separately on an outer circle
   */
  identifyIsolatedNodes() {
    this.isolatedNodes = this.nodes.filter(node => this.degrees.get(node.id) === 0)
  }

  /**
   * Sort nodes by degree (high to low)
   * Excludes isolated nodes (degree 0) which are handled separately
   */
  sortNodesByDegree() {
    this.sortedNodes = [...this.nodes]
      .filter(node => this.degrees.get(node.id) > 0) // Exclude isolated nodes
      .sort((a, b) => {
        return this.degrees.get(b.id) - this.degrees.get(a.id)
      })
  }

  /**
   * Identify hub nodes based on degree threshold
   */
  identifyHubNodes() {
    const degreeThreshold = Math.max(2, this.maxDegree * 0.67)
    this.hubNodes = this.sortedNodes.filter(node => this.degrees.get(node.id) >= degreeThreshold)
  }

  /**
   * Calculate angular space allocation for hubs based on their degree (connectivity)
   * More connected hubs get more angular space
   */
  calculateHubAngularAllocations() {
    const totalDegree = this.hubNodes.reduce((sum, hub) => sum + this.degrees.get(hub.id), 0)
    let currentAngle = 0

    this.hubNodes.forEach(hub => {
      const hubDegree = this.degrees.get(hub.id)
      const proportion = totalDegree > 0 ? hubDegree / totalDegree : 1 / this.hubNodes.length
      const angularSpace = proportion * (2 * Math.PI) // Proportional slice of the circle

      this.hubAngularRanges.set(hub.id, {
        startAngle: currentAngle,
        endAngle: currentAngle + angularSpace,
        midAngle: currentAngle + (angularSpace / 2),
        angularSpace: angularSpace
      })

      currentAngle += angularSpace
    })
  }

  /**
   * Position hub nodes in a circular arrangement
   * Single hub: placed at center
   * Multiple hubs: placed at same radius, positioned at midpoint of their allocated angular space
   */
  positionHubNodesInCircle() {
    // Special case: single hub goes in the center
    if (this.hubNodes.length === 1) {
      const hub = this.hubNodes[0]
      const degree = this.degrees.get(hub.id)

      this.positions.set(hub.id, {
        x: this.centerX,
        y: this.centerY,
        degree,
        isHub: true
      })
      return
    }

    // Multiple hubs: position on a circle
    const hubRadius = (this.minRadius + this.maxRadius) / 2 // Fixed radius for all hubs

    this.hubNodes.forEach((hub) => {
      const degree = this.degrees.get(hub.id)
      const hubRange = this.hubAngularRanges.get(hub.id)

      // Safety check: if hubRange doesn't exist, use default equal spacing
      if (!hubRange) {
        console.warn(`No angular range found for hub ${hub.id}`)
        const defaultAngle = (2 * Math.PI * this.hubNodes.indexOf(hub)) / this.hubNodes.length
        const x = this.centerX + hubRadius * Math.cos(defaultAngle)
        const y = this.centerY + hubRadius * Math.sin(defaultAngle)
        this.positions.set(hub.id, { x, y, degree, isHub: true })
        return
      }

      const angle = hubRange.midAngle // Position at center of allocated space

      const x = this.centerX + hubRadius * Math.cos(angle)
      const y = this.centerY + hubRadius * Math.sin(angle)

      this.positions.set(hub.id, { x, y, degree, isHub: true })
    })
  }

  /**
   * Map each non-hub node to its connected hub nodes
   * Each child is assigned to exactly ONE hub (the first one it connects to)
   */
  mapChildrenToHubs() {
    // Initialize child count for each hub
    this.hubNodes.forEach(hub => this.hubToChildren.set(hub.id, []))

    this.sortedNodes.forEach(node => {
      if (this.positions.has(node.id)) return // Skip hubs

      const neighbors = Array.from(this.adjacency.get(node.id))
      const connectedHubs = neighbors.filter(nId => this.positions.has(nId))

      // Each child is assigned to only ONE hub (the first connected hub)
      if (connectedHubs && connectedHubs.length > 0) {
        const primaryHub = connectedHubs[0]
        this.childrenToHubs.set(node.id, primaryHub) // Store only one hub (not array)
        this.hubToChildren.get(primaryHub).push(node.id)
      } else {
        this.childrenToHubs.set(node.id, null) // No hub connection
      }
    })
  }

  /**
   * Find which hub a node can reach by traversing the graph
   * Uses BFS to find the first hub reachable from the given node
   * @param {string} nodeId - The node to search from
   * @returns {string|null} - The ID of the first hub found, or null if none found
   */
  findReachableHub(nodeId) {
    const visited = new Set()
    const queue = [nodeId]
    visited.add(nodeId)

    while (queue.length > 0) {
      const currentId = queue.shift()

      // Check if current node is a hub
      if (this.positions.has(currentId)) {
        return currentId
      }

      // Check if current node is already mapped to a hub
      const mappedHub = this.childrenToHubs.get(currentId)
      if (mappedHub) {
        return mappedHub
      }

      // Explore neighbors
      const neighbors = this.adjacency.get(currentId)
      if (neighbors) {
        for (const neighborId of neighbors) {
          if (!visited.has(neighborId)) {
            visited.add(neighborId)
            queue.push(neighborId)
          }
        }
      }
    }

    return null // No hub reachable
  }

  /**
   * Find unconnected children - nodes that aren't directly connected to hubs
   * but are connected to children or sub-children
   * Recursively maps each unconnected child to the first hub it can reach
   */
  findUnconnectedChildren() {
    let foundNewMappings = true

    while (foundNewMappings) {
      foundNewMappings = false

      // Find all unmapped nodes (excluding isolated nodes)
      const unmappedNodes = this.sortedNodes.filter(node => {
        // Skip if it's a hub
        if (this.positions.has(node.id)) return false

        // Skip if already mapped to a hub
        const hubMapping = this.childrenToHubs.get(node.id)
        if (hubMapping !== null && hubMapping !== undefined) return false

        return true
      })

      // Try to map each unmapped node to a hub
      for (const node of unmappedNodes) {
        const reachableHub = this.findReachableHub(node.id)

        if (reachableHub) {
          // Map this node to the hub
          this.childrenToHubs.set(node.id, reachableHub)
          this.hubToChildren.get(reachableHub).push(node.id)
          foundNewMappings = true
        }
      }

      // If we found new mappings, loop again to catch any nodes
      // that can now be reached through the newly mapped nodes
    }
  }

  /**
   * Sort children to group connected ones together
   * Uses a greedy algorithm to order children so connected ones are adjacent
   */
  sortChildrenByConnections(children) {
    if (children.length <= 1) return children

    const sorted = []
    const remaining = new Set(children)

    // Start with first child
    let current = children[0]
    sorted.push(current)
    remaining.delete(current)

    // Keep adding the child most connected to the last added
    while (remaining.size > 0) {
      let bestNext = null
      let bestScore = -1

      // Find the remaining child with most connections to already sorted children
      for (const candidate of remaining) {
        let score = 0

        // Count connections to already sorted children
        for (const sortedChild of sorted) {
          const neighbors = this.adjacency.get(candidate)
          if (neighbors && neighbors.has(sortedChild)) {
            score++
          }
        }

        if (score > bestScore) {
          bestScore = score
          bestNext = candidate
        }
      }

      // If no connections found, just take the first remaining
      if (bestNext === null) {
        bestNext = remaining.values().next().value
      }

      sorted.push(bestNext)
      remaining.delete(bestNext)
    }

    return sorted
  }

  /**
   * Identify which children are directly connected to the hub vs unconnected
   * Store this info so we can mark them with different flags when positioning
   */
  identifyUnconnectedChildren() {
    this.unconnectedChildrenSet = new Set()

    this.hubNodes.forEach(hub => {
      const hubId = hub.id
      const children = this.hubToChildren.get(hubId)

      if (!children || children.length === 0) return

      // Check each child - if it's not directly connected to the hub, it's unconnected
      children.forEach(childId => {
        const neighbors = this.adjacency.get(childId)
        const isDirectlyConnected = neighbors && neighbors.has(hubId)

        if (!isDirectlyConnected) {
          this.unconnectedChildrenSet.add(childId)
        }
      })
    })

    console.log('Identified unconnected children:', this.unconnectedChildrenSet)
  }

  /**
   * Position child nodes within their hub's allocated angular space
   * Iterates hub by hub, positioning each hub's children
   * Children connected to each other are placed adjacent
   */
  positionChildNodes() {
    // Iterate over each Hub Node
    this.hubNodes.forEach(hub => {
      // Get this hub's data
      const hubId = hub.id
      const hubRange = this.hubAngularRanges.get(hubId)
      const children = this.hubToChildren.get(hubId)
      const hubPos = this.positions.get(hubId)

      // Skip if no children or missing data
      if (!children || children.length === 0 || !hubRange || !hubPos) return

      // Filter to only directly connected children (not unconnected ones)
      const directChildren = children.filter(childId => !this.unconnectedChildrenSet.has(childId))

      if (directChildren.length === 0) return

      // Sort children to group connected ones together
      const sortedChildren = this.sortChildrenByConnections(directChildren)

      // Add padding to avoid overlap at boundaries
      const ANGULAR_PADDING = 0.1 // 10% padding on each side
      const totalRange = hubRange.endAngle - hubRange.startAngle
      const padding = totalRange * ANGULAR_PADDING
      const paddedStart = hubRange.startAngle + padding
      const paddedEnd = hubRange.endAngle - padding
      const usableRange = paddedEnd - paddedStart

      // Iterate over each child of this hub
      sortedChildren.forEach((childId, childIndex) => {
        // Get child's degree
        const degree = this.degrees.get(childId)

        // Calculate angle within the hub's allocated range
        let angle
        if (sortedChildren.length === 1) {
          // Single child: place at midpoint of range
          angle = (paddedStart + paddedEnd) / 2
        } else {
          // Multiple children: distribute evenly across the range
          const angleStep = usableRange / (sortedChildren.length - 1)
          angle = paddedStart + (childIndex * angleStep)
        }

        // Position at fixed outer radius
        const x = this.centerX + this.childRadius * Math.cos(angle)
        const y = this.centerY + this.childRadius * Math.sin(angle)

        this.positions.set(childId, { x, y, degree, isHub: false, isUnconnected: false })
      })
    })
  }

  /**
   * Find which already-positioned child node connects to this unconnected child
   * Returns the closest connected child that is already positioned
   */
  findConnectingChild(unconnectedChildId) {
    const neighbors = this.adjacency.get(unconnectedChildId)
    if (!neighbors) return null

    // Find positioned neighbors
    for (const neighborId of neighbors) {
      if (this.positions.has(neighborId) && !this.positions.get(neighborId).isHub) {
        return neighborId
      }
    }

    return null
  }

  /**
   * Position unconnected children that were found through recursive graph traversal
   * Places them close to the child node they connect through, at a slightly larger radius
   * Keeps them between the hub and farther out
   */
  positionUnconnectedChildren() {
    // Collect all unconnected children across all hubs
    const unconnectedChildren = []

    this.hubNodes.forEach(hub => {
      const hubId = hub.id
      const children = this.hubToChildren.get(hubId)

      if (!children || children.length === 0) return

      // Find unconnected children (not yet positioned)
      children.forEach(childId => {
        if (!this.positions.has(childId)) {
          unconnectedChildren.push({ childId, hubId })
        }
      })
    })

    console.log('Unconnected children found:', unconnectedChildren.length, unconnectedChildren)

    if (unconnectedChildren.length === 0) return

    // Position each unconnected child near its connecting child
    unconnectedChildren.forEach(({ childId, hubId }) => {
      const degree = this.degrees.get(childId)

      // Find which positioned child connects to this unconnected child
      const connectingChildId = this.findConnectingChild(childId)

      if (!connectingChildId) {
        // Fallback: if no connecting child found, place at hub's angle
        const hubPos = this.positions.get(hubId)
        if (hubPos) {
          const angle = Math.atan2(hubPos.y - this.centerY, hubPos.x - this.centerX)
          const x = this.centerX + (this.childRadius + 40) * Math.cos(angle)
          const y = this.centerY + (this.childRadius + 40) * Math.sin(angle)
          this.positions.set(childId, { x, y, degree, isHub: false, isUnconnected: true })
        }
        return
      }

      // Get the connecting child's position
      const connectingChildPos = this.positions.get(connectingChildId)

      // Calculate angle from center to connecting child
      const baseAngle = Math.atan2(
        connectingChildPos.y - this.centerY,
        connectingChildPos.x - this.centerX
      )

      // Place unconnected child at a slightly larger radius, close to connecting child
      // Use a small angular offset to avoid exact overlap
      const angularOffset = 0.15 // Small offset in radians (~8 degrees)
      const angle = baseAngle + angularOffset

      // Position at a radius farther out than regular children
      const extendedRadius = this.childRadius + 60
      const x = this.centerX + extendedRadius * Math.cos(angle)
      const y = this.centerY + extendedRadius * Math.sin(angle)

      console.log('Setting unconnected node:', childId, 'isUnconnected: true')
      this.positions.set(childId, { x, y, degree, isHub: false, isUnconnected: true })
    })
  }

  /**
   * Position isolated nodes (no connections) on a large outer circle
   * These nodes are placed far from the main graph structure
   */
  positionIsolatedNodes() {
    if (this.isolatedNodes.length === 0) return

    const angleIncrement = (2 * Math.PI) / this.isolatedNodes.length 

    this.isolatedNodes.forEach((node, index) => {
      const angle = index * angleIncrement + (Math.PI / 4)
      const x = this.centerX + this.isolatedRadius * Math.cos(angle)
      const y = this.centerY + this.isolatedRadius * Math.sin(angle)

      this.positions.set(node.id, {
        x,
        y,
        degree: 0,
        isHub: false,
        isIsolated: true
      })
    })
  }

  /**
   * Execute the full layout algorithm
   * @returns {Map} Map of node id to {x, y, degree} coordinates
   */
  compute() {
    // Step 1: Count connections for each node
    // Creates a Map of node ID -> degree count (e.g., {A: 3, B: 2, C: 1})
    // Also sets this.maxDegree and this.minDegree for normalization
    this.calculateDegrees()

    // Step 2: Identify and separate isolated nodes (degree 0)
    // These nodes will be positioned on a large outer circle at the end
    this.identifyIsolatedNodes()

    // Step 3: Build neighbor lookup structure
    // Creates a Map of node ID -> Set of connected node IDs
    // Used to quickly find which nodes are connected to each other
    this.buildAdjacencyList()

    // Step 4: Sort connected nodes from most to least connected
    // Excludes isolated nodes, puts high-degree nodes first
    this.sortNodesByDegree()

    // Step 5: Identify which nodes are "hubs" (highly connected)
    // Filters nodes with degree >= 67% of max degree (or at least 2)
    // These will be positioned in a circle
    this.identifyHubNodes()

    // Step 6: Allocate angular space proportionally to each hub based on connectivity
    // Each hub gets a slice of the circle based on its degree (number of connections)
    // Example: Hub with degree 6 gets 2x the angular space as hub with degree 3
    this.calculateHubAngularAllocations()

    // Step 7: Position hub nodes around a circle
    // All hubs placed at the same radius (equidistant from center)
    // Each hub positioned at the midpoint of its allocated angular space
    this.positionHubNodesInCircle()

    // Step 8: Map each child node to its parent hub
    // For each non-hub node, finds which hub(s) it connects to
    // Builds two maps: childrenToHubs and hubToChildren
    this.mapChildrenToHubs()

    // Step 9: Find unconnected children recursively
    // Identifies nodes not directly connected to hubs but reachable through children
    // Maps them to the first hub they can reach through graph traversal
    this.findUnconnectedChildren()

    // Step 10: Identify which children are unconnected (not directly to hub)
    // This must happen BEFORE positioning so we can mark them differently
    this.identifyUnconnectedChildren()

    // Step 11: Position child nodes within their hub's angular slice
    // Distributes each hub's directly connected children evenly within its allocated angular range
    // Places children at childRadius (outside the hub circle)
    this.positionChildNodes()

    // Step 12: Position unconnected children found in step 9
    // Places these nodes near their connecting child, at a larger radius
    this.positionUnconnectedChildren()

    // Step 13: Position isolated nodes on a large outer circle
    // Nodes with no connections are placed far from the main graph
    this.positionIsolatedNodes()

    return this.positions
  }
}

/**
 * Calculate circular layout positions for nodes based on connectivity
 * Nodes with more connections are placed closer to center
 * Lower-degree nodes are distributed around their connected higher-degree neighbors
 * @param {Array} nodes - Array of node objects
 * @param {Array} edges - Array of edge objects
 * @param {number} centerX - Center X coordinate
 * @param {number} centerY - Center Y coordinate
 * @param {number} minRadius - Minimum radius (for most connected nodes)
 * @param {number} maxRadius - Maximum radius (for least connected nodes)
 * @returns {Map} Map of node id to {x, y} coordinates
 */
export function circularLayout(nodes, edges, centerX = 400, centerY = 300, minRadius = 60, maxRadius = 120) {
  const engine = new CircularLayoutEngine(nodes, edges, centerX, centerY, minRadius, maxRadius)
  return engine.compute()
}

/**
 * Convert graph JSON to internal data structure with positions
 * @param {Object} graph - Graph JSON object
 * @param {Object} options - Algorithm options for toggling features
 * @returns {Object} Internal graph representation
 */
export function createGraphData(graph, options = {}) {
  // Default all algorithms to enabled
  const {
    useSpacing = true,
    useEdgeVisibility = true,
    useContraction = true,
    useCollision = true
  } = options

  const positions = circularLayout(graph.nodes, graph.edges)

  // Only include nodes that have been positioned
  let positionedNodes = graph.nodes
    .filter(node => positions.has(node.id))
    .map(node => ({
      ...node,
      x: positions.get(node.id).x,
      y: positions.get(node.id).y,
      degree: positions.get(node.id).degree,
      isHub: positions.get(node.id).isHub || false,
      isIsolated: positions.get(node.id).isIsolated || false,
      isUnconnected: positions.get(node.id).isUnconnected || false
    }))

  // Apply collision detection to prevent overlaps (first pass)
  // This maintains radial structure while pushing nodes apart
  if (useCollision) {
    positionedNodes = adjustForCollisions(positionedNodes)
  }

  // Canvas is 800x600, keep nodes within boundaries with padding
  const canvasBounds = {
    minX: 50,
    maxX: 750,
    minY: 50,
    maxY: 550
  }

  // Space out nodes to prevent overlaps
  // Hub nodes stay near center, non-hub nodes move more aggressively
  if (useSpacing) {
    positionedNodes = spaceOutNodes(positionedNodes, canvasBounds, 100)
  }

  // Optimize edge visibility by moving nodes that block edges
  // Increased iterations for more aggressive clearing
  if (useEdgeVisibility) {
    positionedNodes = optimizeEdgeVisibility(positionedNodes, graph.edges, 30)
  }

  // Contract edges to reduce their length
  // Pulls connected nodes closer together (reduced strength)
  if (useContraction) {
    positionedNodes = contractEdges(positionedNodes, graph.edges, 10, 0.15)
  }

  // Apply collision detection to prevent overlaps (second pass)
  // This maintains radial structure while pushing nodes apart
  if (useCollision) {
    positionedNodes = adjustForCollisions(positionedNodes)
  }

  return {
    nodes: positionedNodes,
    edges: graph.edges
  }
}
