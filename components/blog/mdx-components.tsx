import { useQuery } from "convex/react";
import { useCallback, useState } from "react";
import styled from "styled-components";
import { api } from "../../convex/_generated/api";

// Blog Post Preview Component
const PreviewWrapper = styled.a`
  display: block;
  padding: 20px;
  border-radius: 12px;
  background: ${(p) => p.theme.postBackground};
  border: 1px solid rgba(150, 150, 150, 0.2);
  margin: 1.5em 0;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    border-color: #a5a3f5;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const PreviewHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 12px;
  color: ${(p) => p.theme.postDescriptionText};
  text-transform: uppercase;
  letter-spacing: 0.5px;

  svg {
    width: 14px;
    height: 14px;
  }
`;

const PreviewTitle = styled.h3`
  font-size: 1.25em;
  font-weight: 600;
  color: ${(p) => p.theme.contrast};
  margin: 0 0 8px;
`;

const PreviewDescription = styled.p`
  font-size: 0.95em;
  color: ${(p) => p.theme.postDescriptionText};
  line-height: 1.6;
  margin: 0;
`;

export function BlogPostPreview({ id }: { id: string }) {
  const post = useQuery(api.blogPosts.getBySlug, id ? { slug: id } : "skip");

  if (!id) {
    return null;
  }

  if (post === undefined) {
    return (
      <PreviewWrapper as="div">
        <PreviewHeader>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
          </svg>
          <span>Related Post</span>
        </PreviewHeader>
        <div style={{ color: "var(--text-muted)" }}>Loading...</div>
      </PreviewWrapper>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <PreviewWrapper href={`/blog/${post.slug}`}>
      <PreviewHeader>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
        </svg>
        <span>Related Post</span>
      </PreviewHeader>
      <PreviewTitle>{post.title}</PreviewTitle>
      <PreviewDescription>{post.description}</PreviewDescription>
    </PreviewWrapper>
  );
}

// YouTube Component
const YouTubeWrapper = styled.div`
  position: relative;
  width: 100%;
  padding-bottom: 56.25%;
  margin: 1.5em 0;
  border-radius: 12px;
  overflow: hidden;
  background: #000;

  iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
  }
`;

export function YouTube({ id }: { id: string }) {
  if (!id) return null;

  return (
    <YouTubeWrapper>
      <iframe
        src={`https://www.youtube.com/embed/${id}`}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </YouTubeWrapper>
  );
}

// Callout Component
const CalloutWrapper = styled.div<{ $type: "info" | "warning" | "tip" }>`
  padding: 20px;
  border-radius: 12px;
  margin: 1.5em 0;
  background: ${(p) =>
    ({
      info: "rgba(88, 101, 242, 0.1)",
      warning: "rgba(245, 158, 11, 0.1)",
      tip: "rgba(16, 185, 129, 0.1)",
    })[p.$type]};
  border-left: 4px solid
    ${(p) =>
      ({
        info: "#5865f2",
        warning: "#f59e0b",
        tip: "#10b981",
      })[p.$type]};
`;

const CalloutHeader = styled.div<{ $type: "info" | "warning" | "tip" }>`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-weight: 600;
  color: ${(p) =>
    ({
      info: "#5865f2",
      warning: "#f59e0b",
      tip: "#10b981",
    })[p.$type]};

  svg {
    width: 18px;
    height: 18px;
  }
`;

const CalloutContent = styled.div`
  color: ${(p) => p.theme.textColor};

  p:first-child {
    margin-top: 0;
  }
  p:last-child {
    margin-bottom: 0;
  }
`;

const CALLOUT_ICONS = {
  info: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
    </svg>
  ),
  tip: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" />
    </svg>
  ),
};

const CALLOUT_LABELS = {
  info: "Info",
  warning: "Warning",
  tip: "Tip",
};

export function Callout({
  type = "info",
  children,
}: {
  type?: "info" | "warning" | "tip";
  children: React.ReactNode;
}) {
  const calloutType = type in CALLOUT_ICONS ? type : "info";

  return (
    <CalloutWrapper $type={calloutType}>
      <CalloutHeader $type={calloutType}>
        {CALLOUT_ICONS[calloutType]}
        <span>{CALLOUT_LABELS[calloutType]}</span>
      </CalloutHeader>
      <CalloutContent>{children}</CalloutContent>
    </CalloutWrapper>
  );
}

// Code Playground Component
const PlaygroundWrapper = styled.div`
  border-radius: 12px;
  overflow: hidden;
  margin: 1.5em 0;
  background: #1e1e3f;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const PlaygroundHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const PlaygroundLanguage = styled.span`
  font-size: 12px;
  color: #a5a3f5;
  font-family: var(--font-mono);
  text-transform: uppercase;
`;

const PlaygroundRunButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  background: #a5a3f5;
  color: #1e1e3f;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: #8b88e8;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 12px;
    height: 12px;
  }
`;

const PlaygroundCode = styled.pre`
  padding: 16px;
  font-family: var(--font-mono);
  font-size: 14px;
  line-height: 1.6;
  color: #e0def4;
  margin: 0;
  overflow-x: auto;

  code {
    background: none !important;
    padding: 0 !important;
    font-size: inherit;
    color: inherit;
  }
`;

const PlaygroundOutput = styled.div<{ $hasError?: boolean }>`
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-family: var(--font-mono);
  font-size: 13px;
  color: ${(p) => (p.$hasError ? "#f87171" : "#a5a3f5")};
  white-space: pre-wrap;
  max-height: 200px;
  overflow-y: auto;
`;

export function CodePlayground({
  language = "javascript",
  children,
}: {
  language?: string;
  children: React.ReactNode;
}) {
  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract code from children
  const code = typeof children === "string" ? children : "";

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
    <PlaygroundWrapper>
      <PlaygroundHeader>
        <PlaygroundLanguage>{language}</PlaygroundLanguage>
        <PlaygroundRunButton onClick={handleRun} disabled={isRunning || !code.trim()}>
          {isRunning ? (
            "Running..."
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              Run
            </>
          )}
        </PlaygroundRunButton>
      </PlaygroundHeader>

      <PlaygroundCode>
        <code>{code}</code>
      </PlaygroundCode>

      {(output || error) && (
        <PlaygroundOutput $hasError={!!error}>{error || output}</PlaygroundOutput>
      )}
    </PlaygroundWrapper>
  );
}
