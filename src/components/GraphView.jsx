import React, { useRef, useLayoutEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

function GraphView({ nodes, edges, onNodeClick }) {
  const fgRef = useRef();
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState(null); // null 초기화로 안전

  const getNodeColor = (count) => {
    if (count >= 4) return '#ff3b30';
    if (count >= 2) return '#ff9500';
    if (count === 1) return '#ffcc00';
    return 'white';
  };

  const graphData = {
    nodes: nodes.map((n) => ({
      id: n.address,
      patternCount: n.patternCount || 0,
    })),
    links: edges.map((e) => ({
      source: e.from,
      target: e.to,
      amount: e.amount,
    })),
  };

  const drawNode = (node, ctx, globalScale) => {
    const radius = 6;
    const fontSize = 12 / globalScale;
    const text = node.id;
    let displayText = text;
    const maxTextWidth = radius * 2;

    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = getNodeColor(node.patternCount || 0);
    ctx.fill();
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = '#0B0D67';
    ctx.stroke();

    ctx.font = `${fontSize}px Sans-Serif`;
    ctx.fillStyle = '#0B0D67';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (ctx.measureText(text).width > maxTextWidth) {
      while (
        displayText.length > 0 &&
        ctx.measureText(displayText + '...').width > maxTextWidth
      ) {
        displayText = displayText.slice(0, -1);
      }
      displayText += '...';
    }

    ctx.fillText(displayText, node.x, node.y);
  };

  // 👇 canvas 정확한 초기 크기 설정
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      const rect = containerRef.current.getBoundingClientRect();
      setDimensions({
        width: rect.width,
        height: rect.height,
      });
    };

    updateSize(); // 최초 실행

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="force-graph-container"
      style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
    >
      {dimensions && (
        <ForceGraph2D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeLabel="id"
          linkLabel={(link) =>
            typeof link.amount === 'string'
              ? `💰 Amount: ${link.amount}`
              : '(no amount)'
          }
          linkDirectionalArrowLength={6}
          linkDirectionalArrowRelPos={1}
          onNodeClick={(node) => onNodeClick(node.id)}
          nodeCanvasObject={drawNode}
        />
      )}
    </div>
  );
}

export default GraphView;
