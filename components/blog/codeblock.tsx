// @ts-nocheck
import { Highlight, themes } from "prism-react-renderer";

// Custom dark purple theme based on shadesOfPurple but with better contrast
const theme = {
  plain: {
    color: "#e0def4",
    backgroundColor: "#1a1525",
  },
  styles: [
    {
      types: ["comment", "prolog", "doctype", "cdata"],
      style: { color: "#6e6a86", fontStyle: "italic" },
    },
    {
      types: ["punctuation"],
      style: { color: "#908caa" },
    },
    {
      types: ["namespace"],
      style: { opacity: 0.7 },
    },
    {
      types: ["tag", "operator", "number"],
      style: { color: "#eb6f92" },
    },
    {
      types: ["property", "function"],
      style: { color: "#c4a7e7" },
    },
    {
      types: ["tag-id", "selector", "atrule-id"],
      style: { color: "#f6c177" },
    },
    {
      types: ["attr-name"],
      style: { color: "#f6c177" },
    },
    {
      types: ["boolean", "string", "entity", "url", "attr-value", "keyword", "control", "directive", "unit", "statement", "regex", "atrule"],
      style: { color: "#9ccfd8" },
    },
    {
      types: ["placeholder", "variable"],
      style: { color: "#e0def4" },
    },
    {
      types: ["deleted"],
      style: { textDecorationLine: "line-through", color: "#eb6f92" },
    },
    {
      types: ["inserted"],
      style: { textDecorationLine: "underline", color: "#31748f" },
    },
    {
      types: ["italic"],
      style: { fontStyle: "italic" },
    },
    {
      types: ["important", "bold"],
      style: { fontWeight: "bold" },
    },
    {
      types: ["important"],
      style: { color: "#c4a7e7" },
    },
    {
      types: ["class-name"],
      style: { color: "#ebbcba" },
    },
  ],
};

import styled from "styled-components";

// Prism language extensions removed - not needed with prism-react-renderer v2

const Pre = styled.pre`
  text-align: left;
  margin: 1.5em 0;
  overflow: auto;
  padding: 1.25em;
  border-radius: 12px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.3),
    0 2px 4px -2px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(144, 116, 242, 0.15);
  background: linear-gradient(135deg, #1a1525 0%, #1e1730 100%) !important;

  /* Custom scrollbar - webkit browsers */
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, rgba(144, 116, 242, 0.4), rgba(144, 116, 242, 0.25));
    border-radius: 4px;
    border: 1px solid rgba(144, 116, 242, 0.2);

    &:hover {
      background: linear-gradient(135deg, rgba(144, 116, 242, 0.6), rgba(144, 116, 242, 0.4));
    }
  }

  &::-webkit-scrollbar-corner {
    background: transparent;
  }

  /* Firefox scrollbar */
  scrollbar-width: thin;
  scrollbar-color: rgba(144, 116, 242, 0.4) rgba(0, 0, 0, 0.2);

  @media (max-width: 450px) {
    margin: 1em -1.5em;
    padding: 1em 1.25em;
    border-radius: 0;
    border-left: none;
    border-right: none;
  }
`;

const Line = styled.div`
  display: table-row;
  line-height: 1.6;
`;

const LineNo = styled.span`
  display: table-cell;
  text-align: right;
  padding-right: 1.25em;
  user-select: none;
  opacity: 0.35;
  color: #908caa;
  font-size: 0.85em;
  min-width: 2em;
`;

const LineContent = styled.span`
  display: table-cell;
  word-break: break-word;
`;

// biome-ignore lint/suspicious/noExplicitAny: MDX children type
function WithLineNumbers({ children }: { children?: any }) {
  return (
    <Highlight
      theme={theme}
      code={children.props.children}
      language={children?.props?.className?.slice(9) || "jsx"}
    >
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <Pre className={className} style={style}>
          {tokens.slice(0, -1).map((line, i) => {
            const { ...lineProps } = getLineProps({ line, key: i });
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: Line numbers are stable in code blocks
              <Line key={i} {...lineProps}>
                <LineNo>{i + 1}</LineNo>
                <LineContent>
                  {line.map((token, key) => {
                    const { ...tokenProps } = getTokenProps({ token, key });
                    return (
                      // biome-ignore lint/suspicious/noArrayIndexKey: Token indices are stable within lines
                      <span key={key} {...tokenProps} />
                    );
                  })}
                </LineContent>
              </Line>
            );
          })}
        </Pre>
      )}
    </Highlight>
  );
}

export const Inline = styled.span`
  background: rgba(144, 116, 242, 0.15);
  padding: 0.15em 0.4em;
  border-radius: 4px;
  font-weight: 500;
  color: #e0def4;
  border: 1px solid rgba(144, 116, 242, 0.1);
`;

export default WithLineNumbers;
