import { Download, X } from "lucide-react";
import { useEffect } from "react";
import styled from "styled-components";
import { DocumentPreview } from "./DocumentPreview";
import { PdfPreview } from "./PdfPreview";
import type { VaultItem } from "./VaultCard";
import { VideoPlayer } from "./VideoPlayer";

interface PreviewModalProps {
  item: VaultItem;
  onClose: () => void;
}

// Check if file is a document that can be previewed via Google Docs Viewer
function isPreviewableDocument(mimeType?: string): boolean {
  if (!mimeType) return false;
  const previewable = [
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ];
  return previewable.includes(mimeType);
}

export function PreviewModal({ item, onClose }: PreviewModalProps) {
  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const isPdf = item.fileType === "pdf";
  const isVideo = item.type === "video" || item.fileType === "video";
  const isImage = item.fileType === "image";
  const isDocument = item.fileType === "document" && isPreviewableDocument(item.mimeType);

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>{item.title}</ModalTitle>
          <HeaderActions>
            {item.fileUrl && (
              <DownloadButton as="a" href={item.fileUrl} download target="_blank">
                <Download size={18} />
                Download
              </DownloadButton>
            )}
            <CloseButton onClick={onClose}>
              <X size={24} />
            </CloseButton>
          </HeaderActions>
        </ModalHeader>

        <ModalContent>
          {isPdf && item.fileUrl && <PdfPreview url={item.fileUrl} />}
          {isVideo && item.fileUrl && <VideoPlayer url={item.fileUrl} />}
          {isImage && item.fileUrl && <ImagePreview src={item.fileUrl} alt={item.title} />}
          {isDocument && item.fileUrl && <DocumentPreview url={item.fileUrl} />}
          {!isPdf && !isVideo && !isImage && !isDocument && (
            <NoPreview>
              <p>Preview not available for this file type.</p>
              {item.fileUrl && (
                <DownloadLink href={item.fileUrl} download target="_blank">
                  <Download size={20} />
                  Download File
                </DownloadLink>
              )}
            </NoPreview>
          )}
        </ModalContent>
      </Modal>
    </Overlay>
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
`;

const Modal = styled.div`
  background: ${(props) => props.theme.background};
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  width: 100%;
  max-width: 1000px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const DownloadButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(144, 116, 242, 0.2);
  border: 1px solid rgba(144, 116, 242, 0.3);
  border-radius: 8px;
  color: ${(props) => props.theme.contrast};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s;

  &:hover {
    background: rgba(144, 116, 242, 0.3);
    border-color: rgba(144, 116, 242, 0.5);
  }
`;

const CloseButton = styled.button`
  padding: 8px;
  background: transparent;
  border: none;
  color: ${(props) => props.theme.textColor};
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
`;

const ModalContent = styled.div`
  flex: 1;
  overflow: auto;
  min-height: 0;
`;

const ImagePreview = styled.img`
  width: 100%;
  height: auto;
  display: block;
`;

const NoPreview = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px;
  color: ${(props) => props.theme.textColor};
  text-align: center;

  p {
    margin: 0 0 24px;
    opacity: 0.6;
  }
`;

const DownloadLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #9074f2 0%, #6366f1 100%);
  border-radius: 8px;
  color: white;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(144, 116, 242, 0.4);
  }
`;
