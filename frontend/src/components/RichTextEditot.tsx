import React, { useRef, useState, useEffect } from "react";
import type { ReactNode } from "react";

interface ToolbarButtonProps {
  cmd?: string;
  title: string;
  children: ReactNode;
  onClick?: () => void;
  isActive?: boolean;
  execFn?: (cmd: string, value?: string | null) => void;
}

interface RichTextEditorProps {
  placeholder?: string;
  defaultValue?: string;
  onChange?: (html: string) => void;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  cmd,
  title,
  children,
  onClick,
  isActive,
  execFn,
}) => (
  <button
    type="button"
    title={title}
    onMouseDown={(e: React.MouseEvent) => {
      e.preventDefault();
      if (onClick) onClick();
      else if (execFn && cmd) execFn(cmd);
    }}
    style={{
      width: 28,
      height: 28,
      border: "none",
      borderRadius: 4,
      background: isActive ? "#dbeafe" : "transparent",
      color: isActive ? "#1d4ed8" : "#374151",
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 13,
      flexShrink: 0,
    }}
  >
    {children}
  </button>
);

const Sep = () => (
  <div
    style={{
      width: 1,
      height: 20,
      background: "#d1d5db",
      margin: "0 2px",
      flexShrink: 0,
    }}
  />
);

const FONT_SIZES = ["12px", "24px", "36px", "48px", "60px", "72px"];

const FONT_FAMILIES = [
  { label: "Arial", value: "Arial" },
  { label: "Comic Sans", value: "Comic Sans MS" },
  { label: "Courier", value: "Courier New" },
  { label: "Georgia", value: "Georgia" },
  { label: "Helvetica", value: "Helvetica" },
  { label: "Impact", value: "Impact" },
  { label: "Tahoma", value: "Tahoma" },
  { label: "Times", value: "Times New Roman" },
  { label: "Trebuchet", value: "Trebuchet MS" },
  { label: "Verdana", value: "Verdana" },
];

const SELECT_STYLES: { label: string; value: string }[] = [
  { label: "Strikethrough", value: "strikeThrough" },
  { label: "Superscript X²", value: "superscript" },
  { label: "Subscript X₂", value: "subscript" },
  { label: "Align Left", value: "justifyLeft" },
  { label: "Align Center", value: "justifyCenter" },
  { label: "Align Right", value: "justifyRight" },
  { label: "Align Justify", value: "justifyFull" },
  { label: "Indent →", value: "indent" },
  { label: "Outdent ←", value: "outdent" },
  { label: "Code Block", value: "__codeBlock" },
  { label: "Blockquote", value: "__blockquote" },
  { label: "Horizontal Rule", value: "__hr" },
  { label: "Clear Formatting", value: "removeFormat" },
];

export default function RichTextEditor({
  placeholder = "Add a detailed description...",
  defaultValue = "",
  onChange,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [active, setActive] = useState<Record<string, boolean>>({});
  const [showLink, setShowLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  useEffect(() => {
    if (editorRef.current && defaultValue) {
      editorRef.current.innerHTML = defaultValue;
    }
  }, []);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  };

  const updateActive = () => {
    setActive({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      strikeThrough: document.queryCommandState("strikeThrough"),
      superscript: document.queryCommandState("superscript"),
      subscript: document.queryCommandState("subscript"),
      ol: document.queryCommandState("insertOrderedList"),
      ul: document.queryCommandState("insertUnorderedList"),
      justifyLeft: document.queryCommandState("justifyLeft"),
      justifyCenter: document.queryCommandState("justifyCenter"),
      justifyRight: document.queryCommandState("justifyRight"),
      justifyFull: document.queryCommandState("justifyFull"),
    });
  };

  const handleInteraction = () => {
    saveSelection();
    updateActive();
  };

  const exec = (cmd: string, value: string | null = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value ?? undefined);
    updateActive();
    onChange?.(editorRef.current?.innerHTML ?? "");
  };

  const execFontFamily = (value: string) => {
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand("fontName", false, value);
    updateActive();
    onChange?.(editorRef.current?.innerHTML ?? "");
  };

  const execFontSizePx = (sizePx: string) => {
    editorRef.current?.focus();
    restoreSelection();

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);

    if (range.collapsed) {
      document.execCommand("fontSize", false, "7");
      if (editorRef.current) {
        const fonts = editorRef.current.getElementsByTagName("font");
        for (let i = fonts.length - 1; i >= 0; i--) {
          const f = fonts[i];
          if (f.getAttribute("size") === "7") {
            f.removeAttribute("size");
            f.style.fontSize = sizePx;
          }
        }
      }
    } else {
      const span = document.createElement("span");
      span.style.fontSize = sizePx;
      try {
        range.surroundContents(span);
      } catch {
        span.appendChild(range.extractContents());
        range.insertNode(span);
      }
      const newRange = document.createRange();
      newRange.setStartAfter(span);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
    }

    updateActive();
    onChange?.(editorRef.current?.innerHTML ?? "");
  };

  const execStyle = (value: string) => {
    editorRef.current?.focus();
    restoreSelection();

    if (value === "__codeBlock") {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && !sel.getRangeAt(0).collapsed) {
        const range = sel.getRangeAt(0);
        const code = document.createElement("code");
        code.style.cssText =
          "background:#f3f4f6;padding:1px 5px;border-radius:4px;font-family:monospace;font-size:13px;";
        code.appendChild(range.extractContents());
        range.insertNode(code);
      } else {
        document.execCommand(
          "insertHTML",
          false,
          `<code style="background:#f3f4f6;padding:1px 5px;border-radius:4px;font-family:monospace;font-size:13px;">code</code>`,
        );
      }
    } else if (value === "__blockquote") {
      document.execCommand("formatBlock", false, "blockquote");
    } else if (value === "__hr") {
      document.execCommand(
        "insertHTML",
        false,
        "<hr style='border:none;border-top:2px solid #e5e7eb;margin:12px 0;'/>",
      );
    } else {
      document.execCommand(value, false, undefined);
    }

    updateActive();
    onChange?.(editorRef.current?.innerHTML ?? "");
  };

  const openLink = () => {
    saveSelection();
    setLinkUrl("");
    setShowLink(true);
  };

  const insertLink = () => {
    editorRef.current?.focus();
    restoreSelection();
    if (!linkUrl.trim()) {
      setShowLink(false);
      return;
    }
    const url = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`;
    document.execCommand("createLink", false, url);
    setShowLink(false);
    updateActive();
    onChange?.(editorRef.current?.innerHTML ?? "");
  };

  return (
    <div
      style={{
        border: "1px solid #d0d5dd",
        borderRadius: 8,
        background: "#fff",
        fontFamily: "inherit",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "5px 8px",
          borderBottom: "1px solid #e5e7eb",
          background: "#f9fafb",
          borderRadius: "8px 8px 0 0",
          flexWrap: "wrap",
          position: "relative",
        }}
      >
        <select
          defaultValue="Arial"
          onChange={(e) => execFontFamily(e.target.value)}
          onMouseDown={() => saveSelection()}
          style={{
            height: 28,
            border: "1px solid #d1d5db",
            borderRadius: 4,
            background: "white",
            fontSize: 12,
            padding: "0 4px",
            color: "#374151",
            cursor: "pointer",
            width: 100,
          }}
        >
          {FONT_FAMILIES.map((f) => (
            <option
              key={f.value}
              value={f.value}
              style={{ fontFamily: f.value }}
            >
              {f.label}
            </option>
          ))}
        </select>

        <select
          defaultValue="12px"
          onChange={(e) => execFontSizePx(e.target.value)}
          onMouseDown={() => saveSelection()}
          style={{
            height: 28,
            border: "1px solid #d1d5db",
            borderRadius: 4,
            background: "white",
            fontSize: 12,
            padding: "0 4px",
            color: "#374151",
            cursor: "pointer",
            width: 68,
          }}
        >
          {FONT_SIZES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value="default"
          onChange={(e) => {
            const val = e.target.value;
            if (val !== "default") {
              execStyle(val);

              (e.target as HTMLSelectElement).value = "default";
            }
          }}
          onMouseDown={() => saveSelection()}
          style={{
            height: 28,
            border: "1px solid #d1d5db",
            borderRadius: 4,
            background: "white",
            fontSize: 12,
            padding: "0 4px",
            color: "#374151",
            cursor: "pointer",
            width: 108,
          }}
        >
          <option value="default" disabled>
            More Styles
          </option>
          {SELECT_STYLES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <Sep />

        <ToolbarButton
          cmd="bold"
          title="Bold (Ctrl+B)"
          execFn={exec}
          isActive={active.bold}
        >
          <b>B</b>
        </ToolbarButton>
        <ToolbarButton
          cmd="italic"
          title="Italic (Ctrl+I)"
          execFn={exec}
          isActive={active.italic}
        >
          <i style={{ fontStyle: "italic" }}>I</i>
        </ToolbarButton>
        <ToolbarButton
          cmd="underline"
          title="Underline (Ctrl+U)"
          execFn={exec}
          isActive={active.underline}
        >
          <u>U</u>
        </ToolbarButton>

        <Sep />

        <div style={{ position: "relative" }}>
          <ToolbarButton title="Insert Link" onClick={openLink}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </ToolbarButton>

          {showLink && (
            <div
              style={{
                position: "absolute",
                top: "110%",
                left: 0,
                zIndex: 50,
                background: "white",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                padding: 10,
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                display: "flex",
                gap: 6,
                alignItems: "center",
                whiteSpace: "nowrap",
              }}
            >
              <input
                autoFocus
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && insertLink()}
                placeholder="example.com"
                style={{
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  padding: "4px 8px",
                  fontSize: 13,
                  width: 200,
                  outline: "none",
                }}
              />
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertLink();
                }}
                style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  border: "none",
                  background: "#4f46e5",
                  color: "white",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Insert
              </button>
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  setShowLink(false);
                }}
                style={{
                  padding: "4px 8px",
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                  background: "white",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
          )}
        </div>

        <Sep />

        <ToolbarButton
          title="Numbered List"
          isActive={active.ol}
          onClick={() => exec("insertOrderedList")}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="10" y1="6" x2="21" y2="6" />
            <line x1="10" y1="12" x2="21" y2="12" />
            <line x1="10" y1="18" x2="21" y2="18" />
            <text x="2" y="8" fontSize="7" fill="currentColor" stroke="none">
              1.
            </text>
            <text x="2" y="14" fontSize="7" fill="currentColor" stroke="none">
              2.
            </text>
            <text x="2" y="20" fontSize="7" fill="currentColor" stroke="none">
              3.
            </text>
          </svg>
        </ToolbarButton>

        <ToolbarButton
          title="Bullet List"
          isActive={active.ul}
          onClick={() => exec("insertUnorderedList")}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="9" y1="6" x2="20" y2="6" />
            <line x1="9" y1="12" x2="20" y2="12" />
            <line x1="9" y1="18" x2="20" y2="18" />
            <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none" />
          </svg>
        </ToolbarButton>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={() => {
          handleInteraction();
          onChange?.(editorRef.current?.innerHTML ?? "");
        }}
        onKeyUp={handleInteraction}
        onMouseUp={handleInteraction}
        onMouseLeave={saveSelection}
        style={{
          minHeight: 90,
          padding: "10px 12px",
          outline: "none",
          fontSize: 12,
          lineHeight: 1.6,
          color: "#111827",
          borderRadius: "0 0 8px 8px",
        }}
      />

      <style>{`
        [contenteditable]:empty::before { content: attr(data-placeholder); color: #9ca3af; pointer-events: none; }
        [contenteditable] a { color: #4f46e5; text-decoration: underline; }
        [contenteditable] blockquote { border-left: 3px solid #6366f1; margin: 6px 0; padding-left: 10px; color: #6b7280; font-style: italic; }
        [contenteditable] pre { background: #f3f4f6; padding: 8px; border-radius: 6px; font-family: monospace; font-size: 13px; }
        [contenteditable] code { background: #f3f4f6; padding: 1px 5px; border-radius: 4px; font-family: monospace; font-size: 13px; }
        [contenteditable] hr { border: none; border-top: 2px solid #e5e7eb; margin: 12px 0; }
      `}</style>
    </div>
  );
}
