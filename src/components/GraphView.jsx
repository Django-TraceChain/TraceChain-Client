// src/components/GraphView.jsx
import React, { useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

function GraphView({ nodes, edges, onNodeClick }) {
  const fgRef = useRef();

  const graphData = {
    nodes: nodes.map((n) => ({ id: n.address })),
    links: edges.map((e) => ({ source: e.from, target: e.to })),
  };

    const drawNode = (node, ctx, globalScale) => {
    const radius = 6;
  const fontSize = 12 / globalScale; // 줌에 따라 폰트 크기 조정
  const padding = 4;



    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = '#0B0D67'; // 파란 테두리
    ctx.stroke();

      ctx.font = `${fontSize}px Sans-Serif`;
  ctx.fillStyle = '#0B0D67';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';    

  // 문자열 자르기
  const maxTextWidth = radius * 2; // 노드 내부 너비에 맞게 제한
  const text = node.id;
  let displayText = text;

  if (ctx.measureText(text).width > maxTextWidth) {
    while (displayText.length > 0 && ctx.measureText(displayText + '...').width > maxTextWidth) {
      displayText = displayText.slice(0, -1);
    }
    displayText += '...';
  }

  ctx.fillText(displayText, node.x, node.y);

  };

  return (
    <ForceGraph2D
      ref={fgRef}
      graphData={graphData}
      nodeLabel="id"
      linkDirectionalArrowLength={6}
      linkDirectionalArrowRelPos={1}
      onNodeClick={(node) => onNodeClick(node.id)}
      nodeCanvasObject={drawNode}
      
    />
  );
}

export default GraphView;
