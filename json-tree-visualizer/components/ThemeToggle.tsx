type ThemeToggleProps = {
  isDark: boolean;
  onToggle: () => void;
};

export default function ThemeToggle({ isDark, onToggle }: ThemeToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors duration-150 ${
        isDark
          ? "border-slate-600 bg-slate-700 text-slate-100 hover:bg-slate-600"
          : "border-slate-200 bg-white text-slate-800 hover:bg-slate-100"
      }`}
      type="button"
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
    >
      {isDark ? "Light" : "Dark"} mode
    </button>
  );
}
