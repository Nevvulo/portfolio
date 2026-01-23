import styled from "styled-components";

interface PdfPreviewProps {
  url: string;
}

export function PdfPreview({ url }: PdfPreviewProps) {
  // Use Google Docs viewer for better compatibility
  // Or embed directly if the browser supports it
  const embedUrl = url;

  return (
    <Container>
      <PdfEmbed src={embedUrl} title="PDF Preview" />
      <Fallback>
        <p>Unable to display PDF preview.</p>
        <a href={url} target="_blank" rel="noopener noreferrer">
          Open in new tab
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
  background: rgba(0, 0, 0, 0.2);
`;

const PdfEmbed = styled.iframe`
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
