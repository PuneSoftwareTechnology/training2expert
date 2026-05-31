import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import { Wand2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatHtml } from "@/utils/format-html";
import "./html-code-editor.css";

interface HtmlCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Min visible height in px before the editor scrolls. */
  minHeight?: number;
  /** Max visible height in px; content scrolls beyond this. */
  maxHeight?: number;
}

/**
 * A lightweight code editor for editing raw HTML email bodies.
 * The HTML structure is faded and the editable text is bold so a
 * non-developer can tell the "code" apart from the "content" they edit.
 */
export function HtmlCodeEditor({
  value,
  onChange,
  placeholder,
  className,
  minHeight = 220,
  maxHeight = 360,
}: HtmlCodeEditorProps) {
  return (
    <div className="space-y-2">
      {/* Legend + tidy action */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="font-mono" style={{ color: "#93a8d0" }}>
              &lt;tag style="..."&gt;
            </span>
            = faded = HTML code, ignore it
          </span>
          <span className="flex items-center gap-1.5">
            <span className="font-mono font-bold" style={{ color: "#0f172a" }}>
              Your text
            </span>
            = bold black = edit this
          </span>
        </div>
        <button
          type="button"
          onClick={() => onChange(formatHtml(value))}
          className="text-muted-foreground hover:text-foreground hover:border-ring flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors"
          title="Re-indent the HTML so it reads like a clean email"
        >
          <Wand2 className="h-3.5 w-3.5" />
          Tidy
        </button>
      </div>

      <div
        className={cn(
          "html-code-editor border-input focus-within:border-ring focus-within:ring-ring/50 w-full overflow-auto rounded-md border bg-white shadow-xs transition-[color,box-shadow] focus-within:ring-[3px]",
          className,
        )}
        style={{ minHeight, maxHeight }}
      >
        <Editor
          value={value}
          onValueChange={onChange}
          highlight={(code) =>
            Prism.highlight(code, Prism.languages.markup, "markup")
          }
          padding={12}
          placeholder={placeholder}
          textareaClassName="html-code-editor__textarea"
          style={{
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
            fontSize: 15,
            lineHeight: 1.7,
            minHeight,
          }}
        />
      </div>
    </div>
  );
}
