"use client";

import { useMemo, useState, type FormEvent } from "react";

import JsonInputPanel from "@/components/JsonInputPanel";
import JsonTreeCanvas from "@/components/JsonTreeCanvas";
import ThemeToggle from "@/components/ThemeToggle";
import { buildFlowGraph, type FlowGraph } from "@/lib/jsonTree";

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

  const isDark = theme === "dark";

  const graph = useMemo<FlowGraph>(() => {
    if (!parsedJson) {
      return { nodes: [], edges: [] };
    }

    return buildFlowGraph(parsedJson, isDark);
  }, [parsedJson, isDark]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const value = JSON.parse(jsonText);
      setParsedJson(value);
      setParsedPreview(JSON.stringify(value, null, 2));
      setParseError(null);
    } catch (error) {
      setParsedJson(null);
      setParsedPreview(null);
      setParseError(error instanceof Error ? error.message : "Invalid JSON");
    }
  };

  const handleJsonChange = (value: string) => {
    setJsonText(value);
  };

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

          <section className="space-y-3">
            <h2 className="text-sm font-medium text-slate-500 dark:text-slate-300">
              Tree visualization
            </h2>
            <JsonTreeCanvas graph={graph} isDark={isDark} />
          </section>
        </div>
      </div>
    </main>
  );
}
