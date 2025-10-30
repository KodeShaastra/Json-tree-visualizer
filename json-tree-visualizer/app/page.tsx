"use client";

import { type ChangeEvent, type FormEvent, useMemo, useState } from "react";

import JsonInputPanel from "@/components/JsonInputPanel";
import JsonTreeCanvas from "@/components/JsonTreeCanvas";
import ThemeToggle from "@/components/ThemeToggle";
import {
  buildFlowGraph,
  resolveNodeIdForJsonPath,
  type FlowGraph,
} from "@/lib/jsonTree";

type Theme = "light" | "dark";

const SAMPLE_JSON = `{
  "id": 1,
  "title": "Sample todo",
  "completed": false,
  "tags": ["json", "tree"]
}`;

export default function Home() {
  const [theme, setTheme] = useState<Theme>("light");
  const [jsonText, setJsonText] = useState(SAMPLE_JSON);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedJson, setParsedJson] = useState<unknown | null>(() => {
    try {
      return JSON.parse(SAMPLE_JSON);
    } catch {
      return null;
    }
  });
  const [parsedPreview, setParsedPreview] = useState<string | null>(() => {
    try {
      return JSON.stringify(JSON.parse(SAMPLE_JSON), null, 2);
    } catch {
      return null;
    }
  });
  const [highlightNodeId, setHighlightNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<
    "idle" | "match" | "no-match" | "no-tree"
  >("idle");

  const isDark = theme === "dark";

  const searchInputStyles = isDark
    ? "border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500 focus-visible:outline-slate-500"
    : "border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus-visible:outline-slate-400";

  const searchButtonStyles = isDark
    ? "bg-emerald-600 text-white hover:bg-emerald-500"
    : "bg-emerald-500 text-white hover:bg-emerald-600";

  const graph = useMemo<FlowGraph>(() => {
    if (!parsedJson) {
      return { nodes: [], edges: [] };
    }

    return buildFlowGraph(parsedJson, isDark, highlightNodeId);
  }, [parsedJson, isDark, highlightNodeId]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const value = JSON.parse(jsonText);
      setParsedJson(value);
      setParsedPreview(JSON.stringify(value, null, 2));
      setParseError(null);
      setHighlightNodeId(null);
      setSearchResult("idle");
    } catch (error) {
      setParsedJson(null);
      setParsedPreview(null);
      setParseError(error instanceof Error ? error.message : "Invalid JSON");
      setHighlightNodeId(null);
      setSearchResult("no-tree");
    }
  };

  const handleJsonChange = (value: string) => {
    setJsonText(value);
  };

  const handleSearchInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchQuery(value);

    if (value.trim().length === 0) {
      setHighlightNodeId(null);
      setSearchResult("idle");
    }
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = searchQuery.trim();

    if (trimmed.length === 0) {
      setHighlightNodeId(null);
      setSearchResult("idle");
      return;
    }

    if (!parsedJson) {
      setHighlightNodeId(null);
      setSearchResult("no-tree");
      return;
    }

    const resolution = resolveNodeIdForJsonPath(parsedJson, trimmed);

    if (!resolution) {
      setHighlightNodeId(null);
      setSearchResult("no-match");
      return;
    }

    setHighlightNodeId(resolution.nodeId);
    setSearchResult("match");
  };

  const searchMessage =
    searchResult === "match"
      ? "Match found"
      : searchResult === "no-match"
      ? "No match found"
      : searchResult === "no-tree"
      ? "No match found (generate the tree first)"
      : null;

  const searchMessageClass =
    searchResult === "match"
      ? "text-emerald-500"
      : searchResult === "no-match" || searchResult === "no-tree"
      ? "text-red-500"
      : "";

  return (
    <main
      className={`min-h-screen px-6 py-10 transition-colors duration-200 ${
        isDark ? "bg-slate-900 text-slate-100" : "bg-slate-100 text-slate-900"
      }`}
    >
      <div
        className={`mx-auto max-w-3xl rounded-xl border px-6 py-8 shadow-sm transition-colors duration-200 ${
          isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"
        }`}
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Json Tree Visualizer</h1>
            <p
              className={`mt-2 text-sm ${
                isDark ? "text-slate-300" : "text-slate-600"
              }`}
            >
              Paste JSON below and generate a tree.
            </p>
          </div>
          <ThemeToggle
            isDark={isDark}
            onToggle={() => setTheme(isDark ? "light" : "dark")}
          />
        </header>

        <div
          className={`mt-8 grid gap-6 rounded-lg border px-4 py-6 text-sm transition-colors duration-200 ${
            isDark
              ? "border-slate-700 bg-slate-900 text-slate-200"
              : "border-slate-200 bg-slate-50 text-slate-600"
          }`}
        >
          <JsonInputPanel
            jsonText={jsonText}
            onJsonChange={handleJsonChange}
            onSubmit={handleSubmit}
            parsedPreview={parsedPreview}
            parseError={parseError}
            isDark={isDark}
            placeholder={SAMPLE_JSON}
          />

          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <h2 className="text-sm font-medium text-slate-500 dark:text-slate-300">
                  Tree visualization
                </h2>
                {searchMessage && (
                  <p className={`text-xs ${searchMessageClass}`}>
                    {searchMessage}
                  </p>
                )}
              </div>
              <form
                onSubmit={handleSearchSubmit}
                className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center"
              >
                <label className="sr-only" htmlFor="json-path-input">
                  Search JSON path
                </label>
                <input
                  id="json-path-input"
                  name="json-path"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  placeholder="search..."
                  className={`w-full rounded-md border px-3 py-2 text-sm font-mono transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 ${searchInputStyles}`}
                />
                <button
                  type="submit"
                  className={`w-full rounded-md px-4 py-2 text-sm font-medium transition-colors duration-150 sm:w-auto ${searchButtonStyles}`}
                >
                  Search
                </button>
              </form>
            </div>

            <JsonTreeCanvas
              graph={graph}
              isDark={isDark}
              highlightNodeId={highlightNodeId}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
