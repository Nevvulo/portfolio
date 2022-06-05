// @ts-nocheck
import Highlight, { defaultProps } from "prism-react-renderer";
import Prism from "prism-react-renderer/prism";
import theme from "prism-react-renderer/themes/shadesOfPurple";
import React from "react";
import styled from "styled-components";

(typeof global !== "undefined" ? global : window).Prism = Prism;
require("prismjs/components/prism-csharp");
require("prismjs/components/prism-python");

const Pre = styled.pre`
  text-align: left;
  margin: 1em 0;
  overflow: scroll;
  padding: 1em;
  border-radius: 4px;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.7);

  @media (max-width: 450px) {
    margin: 0 -2em;
    padding: 1.35em;
  }
`;

const Line = styled.div`
  display: table-row;
`;

const LineNo = styled.span`
  display: table-cell;
  text-align: right;
  padding-right: 1em;
  user-select: none;
  opacity: 0.5;
`;

const LineContent = styled.span`
  display: table-cell;

  span.token {
    color: #9efeff;
  }
`;

function WithLineNumbers({
  children,
}: {
  children?: { props: { children: string; className: string } };
}) {
  return (
    <Highlight
      {...defaultProps}
      theme={theme}
      code={children.props.children}
      language={children?.props?.className?.slice(9) || "jsx"}
    >
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <Pre className={className} style={style}>
          {tokens.slice(0, -1).map((line, i) => (
            <Line key={i} {...getLineProps({ line, key: i })}>
              <LineNo>{i + 1}</LineNo>
              <LineContent>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token, key })} />
                ))}
              </LineContent>
            </Line>
          ))}
        </Pre>
      )}
    </Highlight>
  );
}

export const Inline = styled.span`
  background: rgba(150, 150, 150, 0.3);
  padding: 0.1em 0.35em;
  border-radius: 3px;
  font-weight: 600;
`;

export default WithLineNumbers;
