import { useState, useRef } from "react";
import { marked } from "marked";
import { Bold, Italic, Heading1, List } from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  placeholder?: string;
}

export const MarkdownEditor: React.FC<Props> = ({
  value,
  onChange,
  maxLength = 2000,
  placeholder = "",
}) => {
  const [tab, setTab] = useState<"write" | "preview">("write");
  const ref = useRef<HTMLTextAreaElement>(null);

  const insert = (before: string, after = "") => {
    const el = ref.current;
    if (!el) return;
    const s = el.selectionStart;
    const e = el.selectionEnd;
    const next =
      value.slice(0, s) + before + value.slice(s, e) + after + value.slice(e);
    if (next.length > maxLength) return;
    onChange(next);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(s + before.length, e + before.length);
    }, 0);
  };

  const counterColor =
    value.length >= maxLength
      ? "text-red-400"
      : value.length >= maxLength * 0.9
      ? "text-amber-400"
      : "text-slate-500";

  return (
    <div className="border border-slate-700 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between bg-slate-900/50 border-b border-slate-700 px-3 py-1.5">
        <div className="flex gap-1">
          {(["write", "preview"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                tab === t
                  ? "bg-indigo-500/20 text-indigo-300"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t === "write" ? "Escribir" : "Vista previa"}
            </button>
          ))}
        </div>

        {tab === "write" && (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => insert("**", "**")}
              title="Negrita"
              className="p-1 text-slate-400 hover:text-white rounded transition-colors"
            >
              <Bold size={14} />
            </button>
            <button
              type="button"
              onClick={() => insert("*", "*")}
              title="Cursiva"
              className="p-1 text-slate-400 hover:text-white rounded transition-colors"
            >
              <Italic size={14} />
            </button>
            <button
              type="button"
              onClick={() => insert("# ")}
              title="Encabezado"
              className="p-1 text-slate-400 hover:text-white rounded transition-colors"
            >
              <Heading1 size={14} />
            </button>
            <button
              type="button"
              onClick={() => insert("- ")}
              title="Lista"
              className="p-1 text-slate-400 hover:text-white rounded transition-colors"
            >
              <List size={14} />
            </button>
          </div>
        )}
      </div>

      {tab === "write" ? (
        <div className="relative">
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            maxLength={maxLength}
            placeholder={placeholder}
            className="w-full bg-slate-900/30 px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none resize-none h-40 block"
          />
          <span className={`absolute bottom-2 right-3 text-xs ${counterColor}`}>
            {value.length}/{maxLength}
          </span>
        </div>
      ) : (
        <div
          className="px-4 py-3 min-h-40 prose prose-invert prose-sm max-w-none"
          dangerouslySetInnerHTML={{
            __html: value
              ? (marked.parse(value) as string)
              : '<p class="text-slate-500 italic">Nada que previsualizar.</p>',
          }}
        />
      )}
    </div>
  );
};
