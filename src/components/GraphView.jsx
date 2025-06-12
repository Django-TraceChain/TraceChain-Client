import React, {
  useRef,
  useLayoutEffect,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import ForceGraph2D from "react-force-graph-2d";

function GraphView({ nodes, edges, onNodeClick }) {
  const fgRef = useRef();
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState(null);

  // getNodeColor는 그대로 useCallback 유지
  const getNodeColor = useCallback((count) => {
    if (count >= 4) return "#ff3b30";
    if (count >= 2) return "#ff9500";
    if (count === 1) return "#ffcc00";
    return "white";
  }, []);

  // nodes 배열 내부 객체를 재활용하기 위해, nodes 배열 안 객체의 참조를 유지한 채
  // graphData 생성시 객체 새로 만들지 말고 기존 nodes 객체를 직접 사용
  const graphData = useMemo(() => {
    // nodes가 이미 {address, patternCount} 형태라면 id 필드만 alias 해줌
    // (새 객체 생성 X, 기존 nodes 객체 재활용)
    // 이 방법으로 내부 상태 초기화를 방지 가능
    const graphNodes = nodes.map((n) => {
      if (!n.id) {
        // id가 없으면 새로 만들어서 할당
        n.id = n.address;
      }
      return n;
    });

    const graphLinks = edges.map((e) => ({
      source: e.from,
      target: e.to,
      amount: e.amount,
    }));

    return { nodes: graphNodes, links: graphLinks };
  }, [nodes, edges]);

  // nodeCanvasObject 그대로 useCallback 유지
  const drawNode = useCallback(
    (node, ctx, globalScale) => {
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
      ctx.strokeStyle = "#0B0D67";
      ctx.stroke();

      ctx.font = `${fontSize}px Sans-Serif`;
      ctx.fillStyle = "#0B0D67";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      if (ctx.measureText(text).width > maxTextWidth) {
        while (
          displayText.length > 0 &&
          ctx.measureText(displayText + "...").width > maxTextWidth
        ) {
          displayText = displayText.slice(0, -1);
        }
        displayText += "...";
      }

      ctx.fillText(displayText, node.x, node.y);
    },
    [getNodeColor]
  );

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      const rect = containerRef.current.getBoundingClientRect();
      setDimensions((prev) => {
        if (prev?.width !== rect.width || prev?.height !== rect.height) {
          return {
            width: rect.width,
            height: rect.height,
          };
        }
        return prev;
      });
    };

    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="force-graph-container"
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
        top: 0,
        left: 0,
      }}
    >
      {dimensions && (
        <ForceGraph2D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeLabel="id"
          linkLabel={(link) =>
            typeof link.amount === "string"
              ? `💰 Amount: ${link.amount}`
              : "(no amount)"
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
