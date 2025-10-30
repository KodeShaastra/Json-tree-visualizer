import ReactFlow, { Background, Controls, ReactFlowProvider } from "reactflow";
import "reactflow/dist/style.css";

import type { FlowGraph } from "@/lib/jsonTree";

type JsonTreeCanvasProps = {
  graph: FlowGraph;
  isDark: boolean;
};

export default function JsonTreeCanvas({ graph, isDark }: JsonTreeCanvasProps) {
  const hasNodes = graph.nodes.length > 0;

  return (
    <div
      className={`h-96 w-full overflow-hidden rounded-md border transition-colors duration-150 ${
        isDark ? "border-slate-700 bg-slate-950" : "border-slate-200 bg-white"
      }`}
    >
      {hasNodes ? (
        <ReactFlowProvider>
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
        </ReactFlowProvider>
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-slate-500 dark:text-slate-400">
          Provide valid JSON to see the tree.
        </div>
      )}
    </div>
  );
}
