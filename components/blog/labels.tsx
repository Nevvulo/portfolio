import styled from "styled-components";

export const Labels = styled.div`
  border-radius: 8px;
  margin-top: 0.5em;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 0.5em;
`;

export const Label = styled.div`
  background: rgba(79, 77, 193, 0.15);
  padding: 0.1em 0.6em;
  border: 1px solid rgba(79, 77, 193, 0.3);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  border-radius: 4px;
  color: #a5a3f5;
  text-transform: lowercase;
`;
