import { NodeViewWrapper } from "@tiptap/react";
import { useState, useCallback } from "react";
import { CodePlaygroundWrapper, ComponentWrapper } from "../styles";

interface EditorCodePlaygroundProps {
  node: {
    attrs: {
      language: string;
      code: string;
    };
  };
  selected: boolean;
  updateAttributes: (attrs: Record<string, unknown>) => void;
}

const SUPPORTED_LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
];

export function EditorCodePlayground({
  node,
  selected,
  updateAttributes,
}: EditorCodePlaygroundProps) {
  const { language, code } = node.attrs;
  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCodeChange = (e: React.FormEvent<HTMLDivElement>) => {
    const newCode = e.currentTarget.textContent || "";
    updateAttributes({ code: newCode });
  };

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    setError(null);
    setOutput("");

    try {
      const response = await fetch("/api/blog/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to execute code");
      } else {
        setOutput(data.stdout || "");
        if (data.stderr) {
          setError(data.stderr);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setIsRunning(false);
    }
  }, [code, language]);

  return (
    <NodeViewWrapper>
      <ComponentWrapper $selected={selected}>
        <CodePlaygroundWrapper>
          <div className="playground-header">
            <select
              className="playground-language"
              value={language}
              onChange={(e) => updateAttributes({ language: e.target.value })}
              style={{
                background: "transparent",
                border: "1px solid rgba(165, 163, 245, 0.3)",
                borderRadius: "4px",
                padding: "4px 8px",
                color: "#a5a3f5",
                cursor: "pointer",
              }}
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="playground-run"
              onClick={handleRun}
              disabled={isRunning || !code.trim()}
            >
              {isRunning ? (
                "Running..."
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Run
                </>
              )}
            </button>
          </div>

          <div
            className="playground-code"
            contentEditable
            suppressContentEditableWarning
            onInput={handleCodeChange}
            spellCheck={false}
          >
            {code}
          </div>

          {(output || error) && (
            <div className="playground-output">
              {error && <span className="error">{error}</span>}
              {output && !error && output}
            </div>
          )}
        </CodePlaygroundWrapper>
      </ComponentWrapper>
    </NodeViewWrapper>
  );
}

export default EditorCodePlayground;
