import type { FormEvent } from "react";

type JsonInputPanelProps = {
  jsonText: string;
  onJsonChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  parsedPreview: string | null;
  parseError: string | null;
  isDark: boolean;
  placeholder?: string;
};

export default function JsonInputPanel({
  jsonText,
  onJsonChange,
  onSubmit,
  parsedPreview,
  parseError,
  isDark,
  placeholder,
}: JsonInputPanelProps) {
  const textareaStyles = isDark
    ? "border-slate-700 bg-slate-950 text-slate-100 focus-visible:outline-slate-500"
    : "border-slate-300 bg-white text-slate-800 focus-visible:outline-slate-400";

  const submitStyles = isDark
    ? "bg-slate-700 text-slate-100 hover:bg-slate-600"
    : "bg-slate-900 text-white hover:bg-slate-800";

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="text-sm font-medium" htmlFor="json-input">
          JSON input
        </label>
        <textarea
          id="json-input"
          name="json"
          value={jsonText}
          onChange={(event) => onJsonChange(event.target.value)}
          rows={10}
          className={`w-full resize-y rounded-md border px-3 py-2 font-mono text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 ${textareaStyles}`}
          placeholder={placeholder}
          aria-describedby={parseError ? "json-error" : undefined}
        />
        {parseError && (
          <p id="json-error" className="text-xs text-red-500">
            {parseError}
          </p>
        )}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors duration-150 ${submitStyles}`}
          >
            Generate Tree
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {parseError === null && parsedPreview !== null && (
          <p className="text-xs text-emerald-500">
            Valid JSON. Tree is generated below.
          </p>
        )}
      </div>
    </div>
  );
}
<h2 className="text-sm font-medium text-slate-500 dark:text-slate-300">
  Parsed preview
</h2>;
