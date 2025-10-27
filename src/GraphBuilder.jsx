import React, { useMemo } from 'react'
import { GraphCanvas } from './components/GraphCanvas'
import { createGraphData } from './utils/layout'

export const GraphBuilder = ({ graph, algorithmOptions }) => {
  if (!graph) {
    return <div>No graph data provided</div>
  }

  // Transform graph JSON into positioned graph data
  const graphData = useMemo(() => createGraphData(graph, algorithmOptions), [graph, algorithmOptions])

  return (
    <div style={{ padding: '20px' }}>
      <h2>Graph Builder</h2>
      <div style={{ marginBottom: '20px' }}>
        <p><strong>Version:</strong> {graph.version} | <strong>Type:</strong> {graph.type}</p>
        <p>{graph.nodes?.length || 0} nodes, {graph.edges?.length || 0} edges</p>
      </div>

      <GraphCanvas graphData={graphData} />

      {/* Display JSON format */}
      <div style={{ marginTop: '40px' }}>
        <h3>Graph JSON Format</h3>
        <pre style={{
          backgroundColor: '#f5f5f5',
          padding: '15px',
          borderRadius: '5px',
          overflow: 'auto',
          maxHeight: '400px',
          fontSize: '12px',
          border: '1px solid #ddd'
        }}>
          {JSON.stringify(graph, null, 2)}
        </pre>
      </div>
    </div>
  )
}
