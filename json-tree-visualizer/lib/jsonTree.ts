import type { Edge, Node } from "reactflow";

export type JsonNodeType = "object" | "array" | "primitive" | "value";

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
    light: { background: "#DBEAFE", border: "#1D4ED8", color: "#1E3A8A" },
    dark: { background: "#1E3A8A", border: "#3B82F6", color: "#DBEAFE" },
  },
  array: {
    light: { background: "#FEF3C7", border: "#D97706", color: "#7C2D12" },
    dark: { background: "#7C2D12", border: "#F59E0B", color: "#FFFBEB" },
  },
  primitive: {
    light: { background: "#F3E8FF", border: "#7C3AED", color: "#4C1D95" },
    dark: { background: "#4C1D95", border: "#A855F7", color: "#F3E8FF" },
  },
  value: {
    light: { background: "#DCFCE7", border: "#047857", color: "#064E3B" },
    dark: { background: "#064E3B", border: "#34D399", color: "#ECFDF5" },
  },
} as const;

const HIGHLIGHT_STYLE = {
  light: {
    borderColor: "#F97316",
    glow: "rgba(249, 115, 22, 0.28)",
  },
  dark: {
    borderColor: "#FBBF24",
    glow: "rgba(251, 191, 36, 0.28)",
  },
} as const;

export const MINIMAP_COLORS: Record<JsonNodeType, string> = {
  object: "#1D4ED8",
  array: "#D97706",
  primitive: "#7C3AED",
  value: "#047857",
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

    const label = key === "root" ? "{ }" : `${key} { }`;

    return {
      id: path,
      label,
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

  const formattedValue = formatPrimitive(value);

  if (key === "root") {
    return {
      id: path,
      label: formattedValue,
      type: "value",
      depth,
      children: [],
    };
  }

  const valueNode: StructuredNode = {
    id: `${path}.value`,
    label: formattedValue,
    type: "value",
    depth: depth + 1,
    children: [],
  };

  return {
    id: path,
    label: key,
    type,
    depth,
    children: [valueNode],
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

function getNodeStyle(
  type: JsonNodeType,
  isDark: boolean,
  isHighlighted = false
) {
  const palette = NODE_STYLE_TOKENS[type][isDark ? "dark" : "light"];
  const highlightPalette = HIGHLIGHT_STYLE[isDark ? "dark" : "light"];

  return {
    background: palette.background,
    color: palette.color,
    borderColor: isHighlighted ? highlightPalette.borderColor : palette.border,
    borderWidth: isHighlighted ? 2 : 1,
    borderStyle: "solid",
    padding: "8px 12px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 500,
    boxShadow: isHighlighted ? `0 0 0 6px ${highlightPalette.glow}` : "none",
    transition: "box-shadow 0.2s ease, border-color 0.2s ease",
    zIndex: isHighlighted ? 1 : 0,
  } satisfies FlowNode["style"];
}

function tokenizeJsonPath(jsonPath: string): string[] | null {
  const trimmed = jsonPath.trim();

  if (trimmed.length === 0) {
    return [];
  }

  let cursor = trimmed;

  if (cursor.startsWith("$")) {
    cursor = cursor.slice(1);
    if (cursor.startsWith(".")) {
      cursor = cursor.slice(1);
    }
  }

  const tokens: string[] = [];
  let index = 0;

  while (index < cursor.length) {
    const char = cursor[index];

    if (char === ".") {
      index += 1;
      continue;
    }

    if (char === "[") {
      const closeBracketIndex = cursor.indexOf("]", index + 1);

      if (closeBracketIndex === -1) {
        return null;
      }

      const segment = cursor.slice(index + 1, closeBracketIndex).trim();

      if (segment.length === 0) {
        return null;
      }

      const firstChar = segment[0];
      const lastChar = segment[segment.length - 1];

      if ((firstChar === "'" || firstChar === '"') && lastChar === firstChar) {
        tokens.push(segment.slice(1, -1));
        index = closeBracketIndex + 1;
        continue;
      }

      if (/^-?\d+$/.test(segment)) {
        tokens.push(String(Number.parseInt(segment, 10)));
        index = closeBracketIndex + 1;
        continue;
      }

      return null;
    }

    const start = index;

    while (
      index < cursor.length &&
      cursor[index] !== "." &&
      cursor[index] !== "["
    ) {
      index += 1;
    }

    const token = cursor.slice(start, index).trim();

    if (token.length === 0) {
      return null;
    }

    tokens.push(token);
  }

  return tokens;
}

export type JsonPathResolution = {
  nodeId: string;
  nodeType: JsonNodeType;
};

export function resolveNodeIdForJsonPath(
  value: unknown,
  jsonPath: string
): JsonPathResolution | null {
  const tokens = tokenizeJsonPath(jsonPath);

  if (tokens === null) {
    return null;
  }

  if (tokens.length === 0) {
    const rootType = detectNodeType(value);

    if (rootType === "primitive") {
      return { nodeId: "root", nodeType: "value" };
    }

    return null;
  }

  let current: unknown = value;
  let currentPath = "root";

  for (const token of tokens) {
    const currentType = detectNodeType(current);

    if (currentType === "array") {
      const numericIndex = Number.parseInt(token, 10);

      if (!Number.isInteger(numericIndex) || numericIndex < 0) {
        return null;
      }

      const arrayValue = current as unknown[];

      if (numericIndex >= arrayValue.length) {
        return null;
      }

      current = arrayValue[numericIndex];
      currentPath = `${currentPath}.${numericIndex}`;
      continue;
    }

    if (currentType === "object") {
      if (
        current === null ||
        typeof current !== "object" ||
        !Object.prototype.hasOwnProperty.call(current, token)
      ) {
        return null;
      }

      current = (current as Record<string, unknown>)[token];
      currentPath = `${currentPath}.${token}`;
      continue;
    }

    return null;
  }

  const resolvedType = detectNodeType(current);

  if (resolvedType === "primitive") {
    return { nodeId: `${currentPath}.value`, nodeType: "value" };
  }

  return { nodeId: currentPath, nodeType: resolvedType };
}

export function buildFlowGraph(
  value: unknown,
  isDark: boolean,
  highlightNodeId: string | null = null
): FlowGraph {
  const root = buildStructuredNode(value, "root", 0, "root");
  const hideRootNode = root.type !== "value";
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
      style: getNodeStyle(node.type, isDark, node.id === highlightNodeId),
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
