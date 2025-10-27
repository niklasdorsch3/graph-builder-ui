import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { GraphBuilder } from './GraphBuilder'
import exampleGraph from '../schema/example-graph.json'
import largeGraph from '../test-graphs/large-graph.json'
import hubNode from '../test-graphs/hub-node.json'
import longLabels from '../test-graphs/long-labels.json'
import sparseGraph from '../test-graphs/sparse-graph.json'
import chainGraph from '../test-graphs/chain-graph.json'
import treeGraph from '../test-graphs/tree-graph.json'
import isolatedNodes from '../test-graphs/isolated-nodes.json'

/**
 * Generate a complex graph with 40 nodes
 * Each node can have 1-3 connections (weighted towards 1-2)
 */
function generateComplexGraph() {
  const nodeCount = 40
  const nodes = []

  const labels = [
    'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta',
    'Iota', 'Kappa', 'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi',
    'Rho', 'Sigma', 'Tau', 'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega'
  ]

  // Create 100 nodes
  for (let i = 0; i < nodeCount; i++) {
    const labelPrefix = labels[i % labels.length]
    nodes.push({
      id: `node${i}`,
      label: `${labelPrefix}${Math.floor(i / labels.length)}`
    })
  }

  const edges = []
  const existingEdges = new Set()

  // For each node, create 1-3 random connections (weighted towards 1-2)
  for (let i = 0; i < nodeCount; i++) {
    // Weighted distribution: 50% get 1 edge, 30% get 2 edges, 20% get 3 edges
    const rand = Math.random()
    let numConnections
    if (rand < 0.5) {
      numConnections = 1
    } else if (rand < 0.8) {
      numConnections = 2
    } else {
      numConnections = 3
    }

    let connectionsCreated = 0
    let attempts = 0

    while (connectionsCreated < numConnections && attempts < 50) {
      const targetIdx = Math.floor(Math.random() * nodeCount)

      // Skip self-loops
      if (targetIdx === i) {
        attempts++
        continue
      }

      const edgeKey = `${i}-${targetIdx}`
      const reverseKey = `${targetIdx}-${i}`

      // Skip if edge already exists
      if (existingEdges.has(edgeKey) || existingEdges.has(reverseKey)) {
        attempts++
        continue
      }

      edges.push({
        source: `node${i}`,
        target: `node${targetIdx}`
      })

      existingEdges.add(edgeKey)
      connectionsCreated++
      attempts++
    }
  }

  return {
    version: "1.0",
    type: "directed",
    nodes,
    edges
  }
}

/**
 * Generate a random graph with specified number of nodes and edges
 */
function generateRandomGraph(nodeCount = 10, edgeCount = 10) {
  const randomLabels = [
    'Blue Mountain',
    'Silver River',
    'Golden Eagle',
    'Dark Forest',
    'Crystal Lake',
    'Red Desert',
    'Green Valley',
    'White Cloud',
    'Iron Gate',
    'Thunder Storm',
    'Ocean Wave',
    'Fire Dragon',
    'Moon Shadow',
    'Star Light',
    'Wind Runner',
    'Stone Bridge',
    'Snow Peak',
    'Rain Garden',
    'Sky Tower',
    'Earth Spirit'
  ]

  const nodes = []

  // Create nodes with random two-word labels
  for (let i = 0; i < nodeCount; i++) {
    const randomLabel = randomLabels[Math.floor(Math.random() * randomLabels.length)]
    nodes.push({
      id: `node${i}`,
      label: randomLabel
    })
  }

  const edges = []
  const existingEdges = new Set()

  // Create random edges
  let attempts = 0
  while (edges.length < edgeCount && attempts < edgeCount * 10) {
    const sourceIdx = Math.floor(Math.random() * nodeCount)
    const targetIdx = Math.floor(Math.random() * nodeCount)

    // Skip self-loops
    if (sourceIdx === targetIdx) {
      attempts++
      continue
    }

    const edgeKey = `${sourceIdx}-${targetIdx}`
    const reverseKey = `${targetIdx}-${sourceIdx}`

    // Skip if edge already exists (in either direction)
    if (existingEdges.has(edgeKey) || existingEdges.has(reverseKey)) {
      attempts++
      continue
    }

    edges.push({
      source: `node${sourceIdx}`,
      target: `node${targetIdx}`
    })

    existingEdges.add(edgeKey)
    attempts++
  }

  return { nodes, edges }
}

const testGraphs = {
  'example': { name: 'Example', data: exampleGraph },
  'tree': { name: 'Tree (3 hubs)', data: treeGraph },
  'isolated': { name: 'Isolated Nodes', data: isolatedNodes },
  'large': { name: 'Large (20 nodes)', data: largeGraph },
  'hub': { name: 'Hub Node', data: hubNode },
  'long': { name: 'Long Labels', data: longLabels },
  'sparse': { name: 'Sparse', data: sparseGraph },
  'chain': { name: 'Chain', data: chainGraph }
}

function Demo() {
  const [activeTab, setActiveTab] = useState('random')
  const [randomGraph, setRandomGraph] = useState(() => generateRandomGraph(10, 10))
  const [complexGraph] = useState(() => generateComplexGraph())

  // Algorithm toggles for random graph
  const [algorithmOptions, setAlgorithmOptions] = useState({
    useSpacing: true,
    useEdgeVisibility: true,
    useContraction: true,
    useCollision: true
  })

  const toggleAlgorithm = (key) => {
    setAlgorithmOptions(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const addRandomNode = () => {
    const randomLabels = [
      'Blue Mountain',
      'Silver River',
      'Golden Eagle',
      'Dark Forest',
      'Crystal Lake',
      'Red Desert',
      'Green Valley',
      'White Cloud',
      'Iron Gate',
      'Thunder Storm',
      'Ocean Wave',
      'Fire Dragon',
      'Moon Shadow',
      'Star Light',
      'Wind Runner',
      'Stone Bridge',
      'Snow Peak',
      'Rain Garden',
      'Sky Tower',
      'Earth Spirit'
    ]

    setRandomGraph(prev => {
      const newNodeId = `node${prev.nodes.length}`
      const randomLabel = randomLabels[Math.floor(Math.random() * randomLabels.length)]

      // Create new node
      const newNode = {
        id: newNodeId,
        label: randomLabel
      }

      // Create 1-2 random edges to existing nodes
      const numEdges = Math.random() < 0.5 ? 1 : 2
      const newEdges = []
      const existingEdges = new Set(prev.edges.map(e => `${e.source}-${e.target}`))

      for (let i = 0; i < numEdges && prev.nodes.length > 0; i++) {
        const randomNodeIdx = Math.floor(Math.random() * prev.nodes.length)
        const targetNodeId = prev.nodes[randomNodeIdx].id

        const edgeKey = `${newNodeId}-${targetNodeId}`
        const reverseKey = `${targetNodeId}-${newNodeId}`

        if (!existingEdges.has(edgeKey) && !existingEdges.has(reverseKey)) {
          newEdges.push({
            source: newNodeId,
            target: targetNodeId
          })
          existingEdges.add(edgeKey)
        }
      }

      return {
        nodes: [...prev.nodes, newNode],
        edges: [...prev.edges, ...newEdges]
      }
    })
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <h1>Graph Builder UI Demo</h1>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '4px',
        borderBottom: '2px solid #ddd',
        marginBottom: '20px'
      }}>
        {Object.entries(testGraphs).map(([key, { name }]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderBottom: activeTab === key ? '3px solid #4A90E2' : '3px solid transparent',
              background: activeTab === key ? '#f0f0f0' : 'transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === key ? 'bold' : 'normal',
              color: activeTab === key ? '#4A90E2' : '#666'
            }}
          >
            {name}
          </button>
        ))}
        <button
          key="random"
          onClick={() => setActiveTab('random')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderBottom: activeTab === 'random' ? '3px solid #4A90E2' : '3px solid transparent',
            background: activeTab === 'random' ? '#f0f0f0' : 'transparent',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === 'random' ? 'bold' : 'normal',
            color: activeTab === 'random' ? '#4A90E2' : '#666'
          }}
        >
          Random
        </button>
        <button
          key="complex"
          onClick={() => setActiveTab('complex')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderBottom: activeTab === 'complex' ? '3px solid #4A90E2' : '3px solid transparent',
            background: activeTab === 'complex' ? '#f0f0f0' : 'transparent',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === 'complex' ? 'bold' : 'normal',
            color: activeTab === 'complex' ? '#4A90E2' : '#666'
          }}
        >
          Complex (40)
        </button>
      </div>

      {/* Random Graph Controls */}
      {activeTab === 'random' && (
        <div style={{ marginBottom: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => setRandomGraph(generateRandomGraph(10, 10))}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: '#4A90E2',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              borderRadius: '4px'
            }}
          >
            Generate New Random Graph
          </button>
          <button
            onClick={addRandomNode}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: '#27AE60',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              borderRadius: '4px'
            }}
          >
            Add Random Node
          </button>
          <span style={{ color: '#666' }}>
            Current: {randomGraph.nodes.length} nodes, {randomGraph.edges.length} edges
          </span>
        </div>
      )}

      {/* Algorithm Toggles - Available on all tabs */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          padding: '15px',
          background: '#f5f5f5',
          borderRadius: '4px',
          display: 'inline-block'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>
            Algorithm Toggles:
          </div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={algorithmOptions.useSpacing}
                onChange={() => toggleAlgorithm('useSpacing')}
                style={{ marginRight: '8px', cursor: 'pointer' }}
              />
              Space Out Nodes
            </label>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={algorithmOptions.useEdgeVisibility}
                onChange={() => toggleAlgorithm('useEdgeVisibility')}
                style={{ marginRight: '8px', cursor: 'pointer' }}
              />
              Optimize Edge Visibility
            </label>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={algorithmOptions.useContraction}
                onChange={() => toggleAlgorithm('useContraction')}
                style={{ marginRight: '8px', cursor: 'pointer' }}
              />
              Contract Edges
            </label>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={algorithmOptions.useCollision}
                onChange={() => toggleAlgorithm('useCollision')}
                style={{ marginRight: '8px', cursor: 'pointer' }}
              />
              Adjust for Collisions
            </label>
          </div>
        </div>
      </div>

      <GraphBuilder
        graph={
          activeTab === 'random' ? randomGraph :
          activeTab === 'complex' ? complexGraph :
          testGraphs[activeTab].data
        }
        algorithmOptions={algorithmOptions}
      />
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<Demo />)
