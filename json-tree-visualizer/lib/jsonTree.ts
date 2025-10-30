import type { Edge, Node } from "reactflow";

export type JsonNodeType = "object" | "array" | "primitive";

export type FlowNodeData = {
  label: string;
  type: JsonNodeType;
};

export type FlowNode = Node<FlowNodeData>;

export type FlowGraph = {
  nodes: FlowNode[];
  edges: Edge[];
};

type StructuredNode = {
  id: string;
  label: string;
  type: JsonNodeType;
  depth: number;
  children: StructuredNode[];
};

const HORIZONTAL_GAP = 200;
const VERTICAL_GAP = 120;

const NODE_STYLE_TOKENS = {
  object: {
    light: { background: "#E0E7FF", border: "#4338CA", color: "#1E1B4B" },
    dark: { background: "#312E81", border: "#4338CA", color: "#EEF2FF" },
  },
  array: {
    light: { background: "#DCFCE7", border: "#15803D", color: "#14532D" },
    dark: { background: "#14532D", border: "#22C55E", color: "#ECFDF5" },
  },
  primitive: {
    light: { background: "#FFEDD5", border: "#EA580C", color: "#7C2D12" },
    dark: { background: "#7C2D12", border: "#FB923C", color: "#FFF7ED" },
  },
} as const;

export const MINIMAP_COLORS: Record<JsonNodeType, string> = {
  object: "#4338CA",
  array: "#15803D",
  primitive: "#EA580C",
};

function detectNodeType(value: unknown): JsonNodeType {
  if (Array.isArray(value)) {
    return "array";
  }

  if (value !== null && typeof value === "object") {
    return "object";
  }

  return "primitive";
}

function formatPrimitive(value: unknown): string {
  if (typeof value === "string") {
    return `"${value}"`;
  }

  if (value === null) {
    return "null";
  }

  return String(value);
}

function buildStructuredNode(
  value: unknown,
  key: string,
  depth: number,
  path: string
): StructuredNode {
  const type = detectNodeType(value);

  if (type === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    const children = entries.map(([childKey, childValue]) =>
      buildStructuredNode(
        childValue,
        childKey,
        depth + 1,
        `${path}.${childKey}`
      )
    );

    return {
      id: path,
      label: key === "root" ? "{ }" : key,
      type,
      depth,
      children,
    };
  }

  if (type === "array") {
    const arrayValue = value as unknown[];
    const children = arrayValue.map((child, index) =>
      buildStructuredNode(child, `[${index}]`, depth + 1, `${path}.${index}`)
    );

    const labelBase =
      key === "root" ? "[]" : key.startsWith("[") ? key : `${key} []`;

    return {
      id: path,
      label: labelBase,
      type,
      depth,
      children,
    };
  }

  const display =
    key === "root"
      ? formatPrimitive(value)
      : `${key}: ${formatPrimitive(value)}`;

  return {
    id: path,
    label: display,
    type,
    depth,
    children: [],
  };
}

function assignPositions(
  root: StructuredNode
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  let leafIndex = 0;

  const place = (node: StructuredNode): { min: number; max: number } => {
    if (node.children.length === 0) {
      const x = leafIndex * HORIZONTAL_GAP;
      const y = node.depth * VERTICAL_GAP;
      leafIndex += 1;
      positions.set(node.id, { x, y });
      return { min: x, max: x };
    }

    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;

    for (const child of node.children) {
      const childRange = place(child);
      min = Math.min(min, childRange.min);
      max = Math.max(max, childRange.max);
    }

    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      const x = leafIndex * HORIZONTAL_GAP;
      const y = node.depth * VERTICAL_GAP;
      leafIndex += 1;
      positions.set(node.id, { x, y });
      return { min: x, max: x };
    }

    const x = (min + max) / 2;
    const y = node.depth * VERTICAL_GAP;
    positions.set(node.id, { x, y });
    return { min, max };
  };

  place(root);

  const allX = Array.from(positions.values()).map((position) => position.x);
  const minX = allX.length ? Math.min(...allX) : 0;

  if (minX !== 0) {
    positions.forEach((position, id) => {
      positions.set(id, { x: position.x - minX, y: position.y });
    });
  }

  return positions;
}

function getNodeStyle(type: JsonNodeType, isDark: boolean) {
  const palette = NODE_STYLE_TOKENS[type][isDark ? "dark" : "light"];

  return {
    background: palette.background,
    color: palette.color,
    border: `1px solid ${palette.border}`,
    padding: "8px 12px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 500,
  } satisfies FlowNode["style"];
}

export function buildFlowGraph(value: unknown, isDark: boolean): FlowGraph {
  const root = buildStructuredNode(value, "root", 0, "root");
  const hideRootNode = root.type !== "primitive";
  const positions = assignPositions(root);

  let nodes: FlowNode[] = [];
  let edges: Edge[] = [];

  const visit = (node: StructuredNode) => {
    const position = positions.get(node.id) ?? {
      x: 0,
      y: node.depth * VERTICAL_GAP,
    };

    nodes.push({
      id: node.id,
      data: { label: node.label, type: node.type },
      position,
      draggable: false,
      selectable: false,
      style: getNodeStyle(node.type, isDark),
    });

    for (const child of node.children) {
      edges.push({
        id: `edge-${node.id}-${child.id}`,
        source: node.id,
        target: child.id,
        type: "smoothstep",
        animated: false,
      });

      visit(child);
    }
  };

  visit(root);

  if (hideRootNode) {
    nodes = nodes
      .filter((node) => node.id !== root.id)
      .map((node) => ({
        ...node,
        position: { x: node.position.x, y: node.position.y - VERTICAL_GAP },
      }));

    edges = edges.filter(
      (edge) => edge.source !== root.id && edge.target !== root.id
    );
  }

  return { nodes, edges };
}
