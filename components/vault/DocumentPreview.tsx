import styled from "styled-components";

interface DocumentPreviewProps {
  url: string;
}

export function DocumentPreview({ url }: DocumentPreviewProps) {
  // Use Google Docs Viewer for .docx, .xlsx, .pptx preview
  const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;

  return (
    <Container>
      <DocEmbed src={viewerUrl} title="Document Preview" />
      <Fallback>
        <p>Unable to display document preview.</p>
        <a href={url} target="_blank" rel="noopener noreferrer">
          Download file
        </a>
      </Fallback>
    </Container>
  );
}

const Container = styled.div`
  width: 100%;
  height: 70vh;
  min-height: 400px;
  position: relative;
  background: rgba(255, 255, 255, 0.02);
`;

const DocEmbed = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;

  &:not([src]) + div {
    display: flex;
  }
`;

const Fallback = styled.div`
  display: none;
  position: absolute;
  inset: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: ${(props) => props.theme.textColor};
  text-align: center;
  gap: 16px;

  p {
    margin: 0;
    opacity: 0.6;
  }

  a {
    color: #9074f2;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;
