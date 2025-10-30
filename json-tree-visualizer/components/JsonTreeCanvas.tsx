import { useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";

import type { FlowGraph } from "@/lib/jsonTree";

type JsonTreeCanvasProps = {
  graph: FlowGraph;
  isDark: boolean;
  highlightNodeId?: string | null;
};

type JsonTreeCanvasInnerProps = {
  graph: FlowGraph;
  highlightNodeId: string | null;
};

function JsonTreeCanvasInner({
  graph,
  highlightNodeId,
}: JsonTreeCanvasInnerProps) {
  const { getNode, setCenter } = useReactFlow();

  useEffect(() => {
    if (!highlightNodeId || graph.nodes.length === 0) {
      return;
    }

    const targetNode = getNode(highlightNodeId);

    if (!targetNode) {
      return;
    }

    const position = targetNode.positionAbsolute ?? targetNode.position;
    const width = targetNode.width ?? 160;
    const height = targetNode.height ?? 60;

    setCenter(position.x + width / 2, position.y + height / 2, {
      zoom: 1.1,
      duration: 500,
    });
  }, [getNode, graph.nodes.length, highlightNodeId, setCenter]);

  return (
    <ReactFlow
      nodes={graph.nodes}
      edges={graph.edges}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      panOnScroll
      zoomOnScroll
      minZoom={0.3}
    >
      <Controls showInteractive={false} />
      <Background gap={24} size={1} />
    </ReactFlow>
  );
}

export default function JsonTreeCanvas({
  graph,
  isDark,
  highlightNodeId = null,
}: JsonTreeCanvasProps) {
  const hasNodes = graph.nodes.length > 0;

  return (
    <div
      className={`h-96 w-full overflow-hidden rounded-md border transition-colors duration-150 ${
        isDark ? "border-slate-700 bg-slate-950" : "border-slate-200 bg-white"
      }`}
    >
      {hasNodes ? (
        <ReactFlowProvider>
          <JsonTreeCanvasInner
            graph={graph}
            highlightNodeId={highlightNodeId}
          />
        </ReactFlowProvider>
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-slate-500 dark:text-slate-400">
          Provide valid JSON to see the tree.
        </div>
      )}
    </div>
  );
}
