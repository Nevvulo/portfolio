import { Download, Eye, File, FileText, Film, Image, Lock, Package, Play } from "lucide-react";
import Link from "next/link";
import styled from "styled-components";

type FileType = "pdf" | "video" | "document" | "image" | "archive";
type ContentType = "file" | "article" | "video";
type Visibility = "public" | "members" | "tier1" | "tier2";

export interface VaultItem {
  _id: string;
  type: ContentType;
  title: string;
  description?: string;
  slug: string;
  visibility: Visibility;
  thumbnailUrl?: string;
  fileUrl?: string;
  fileType?: FileType;
  mimeType?: string;
  fileSize?: number;
  coverImage?: string;
  contentType?: string;
  createdAt: number;
  hasAccess: boolean;
}

interface VaultCardProps {
  item: VaultItem;
  onPreview?: (item: VaultItem) => void;
}

// Check if document can be previewed via Google Docs Viewer
function isPreviewableDoc(mimeType?: string): boolean {
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

const FILE_TYPE_ICONS: Record<FileType, typeof File> = {
  pdf: FileText,
  video: Film,
  document: File,
  image: Image,
  archive: Package,
};

const VISIBILITY_LABELS: Record<Visibility, string> = {
  public: "Free",
  members: "Members",
  tier1: "Super Legend",
  tier2: "Super Legend II",
};

const VISIBILITY_COLORS: Record<Visibility, string> = {
  public: "#22c55e",
  members: "#3b82f6",
  tier1: "#f59e0b",
  tier2: "#a855f7",
};

export function VaultCard({ item, onPreview }: VaultCardProps) {
  const isFile = item.type === "file";
  const isVideo = item.type === "video" || item.fileType === "video";
  const isPdf = item.fileType === "pdf";

  const Icon = isFile && item.fileType ? FILE_TYPE_ICONS[item.fileType] : FileText;
  const thumbnail = item.thumbnailUrl || item.coverImage;

  const handleClick = () => {
    if (!item.hasAccess) return;

    if (isFile && onPreview) {
      onPreview(item);
    }
  };

  // For articles/videos, link to the post
  if (!isFile) {
    return (
      <CardLink href={`/learn/${item.slug}`}>
        <Card $hasAccess={item.hasAccess}>
          <CardThumbnail>
            {thumbnail ? (
              <ThumbnailImage src={thumbnail} alt={item.title} />
            ) : (
              <ThumbnailPlaceholder>
                {isVideo ? <Film size={32} /> : <FileText size={32} />}
              </ThumbnailPlaceholder>
            )}
            {isVideo && (
              <PlayOverlay>
                <Play size={32} fill="white" />
              </PlayOverlay>
            )}
            {!item.hasAccess && (
              <LockedOverlay>
                <Lock size={24} />
                <span>Unlock with {VISIBILITY_LABELS[item.visibility]}</span>
              </LockedOverlay>
            )}
          </CardThumbnail>

          <CardContent>
            <CardTitle>{item.title}</CardTitle>
            {item.description && <CardDescription>{item.description}</CardDescription>}
            <CardMeta>
              <TypeBadge $type={item.contentType === "video" ? "video" : "article"}>
                {item.contentType === "video" ? <Film size={12} /> : <FileText size={12} />}
                {item.contentType === "video" ? "Video" : "Article"}
              </TypeBadge>
              <VisibilityBadge $visibility={item.visibility}>
                {item.visibility !== "public" && <Lock size={10} />}
                {VISIBILITY_LABELS[item.visibility]}
              </VisibilityBadge>
            </CardMeta>
          </CardContent>
        </Card>
      </CardLink>
    );
  }

  // For files, use click handler
  return (
    <Card $hasAccess={item.hasAccess} onClick={handleClick} $clickable={item.hasAccess}>
      <CardThumbnail>
        {thumbnail ? (
          <ThumbnailImage src={thumbnail} alt={item.title} />
        ) : (
          <ThumbnailPlaceholder $type={item.fileType}>
            <Icon size={32} />
          </ThumbnailPlaceholder>
        )}
        {isVideo && (
          <PlayOverlay>
            <Play size={32} fill="white" />
          </PlayOverlay>
        )}
        {!item.hasAccess && (
          <LockedOverlay>
            <Lock size={24} />
            <span>Unlock with {VISIBILITY_LABELS[item.visibility]}</span>
          </LockedOverlay>
        )}
      </CardThumbnail>

      <CardContent>
        <CardTitle>{item.title}</CardTitle>
        {item.description && <CardDescription>{item.description}</CardDescription>}
        <CardMeta>
          <TypeBadge $type={item.fileType || "document"}>
            <Icon size={12} />
            {item.fileType?.toUpperCase() || "FILE"}
          </TypeBadge>
          {item.fileSize && <SizeBadge>{formatFileSize(item.fileSize)}</SizeBadge>}
          <VisibilityBadge $visibility={item.visibility}>
            {item.visibility !== "public" && <Lock size={10} />}
            {VISIBILITY_LABELS[item.visibility]}
          </VisibilityBadge>
        </CardMeta>

        {item.hasAccess && (
          <CardActions>
            {(isPdf || isVideo || isPreviewableDoc(item.mimeType)) && (
              <ActionButton title="Preview">
                <Eye size={16} /> Preview
              </ActionButton>
            )}
            <ActionButton
              as="a"
              href={item.fileUrl}
              download
              target="_blank"
              title="Download"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <Download size={16} /> Download
            </ActionButton>
          </CardActions>
        )}
      </CardContent>
    </Card>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const CardLink = styled(Link)`
  text-decoration: none;
  display: block;
`;

const Card = styled.div<{ $hasAccess: boolean; $clickable?: boolean }>`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.2s;
  cursor: ${(p) => (p.$clickable ? "pointer" : "default")};
  opacity: ${(p) => (p.$hasAccess ? 1 : 0.8)};

  &:hover {
    border-color: rgba(144, 116, 242, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }
`;

const CardThumbnail = styled.div`
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
`;

const ThumbnailImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ThumbnailPlaceholder = styled.div<{ $type?: FileType }>`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(p) => {
    switch (p.$type) {
      case "pdf":
        return "linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.05) 100%)";
      case "video":
        return "linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.05) 100%)";
      case "image":
        return "linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(34, 197, 94, 0.05) 100%)";
      case "archive":
        return "linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(168, 85, 247, 0.05) 100%)";
      default:
        return "linear-gradient(135deg, rgba(144, 116, 242, 0.2) 0%, rgba(144, 116, 242, 0.05) 100%)";
    }
  }};
  color: ${(p) => {
    switch (p.$type) {
      case "pdf":
        return "#ef4444";
      case "video":
        return "#3b82f6";
      case "image":
        return "#22c55e";
      case "archive":
        return "#a855f7";
      default:
        return "#9074f2";
    }
  }};
`;

const PlayOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  color: white;
  opacity: 0;
  transition: opacity 0.2s;

  ${Card}:hover & {
    opacity: 1;
  }
`;

const LockedOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  backdrop-filter: blur(4px);

  span {
    font-size: 12px;
    opacity: 0.8;
  }
`;

const CardContent = styled.div`
  padding: 16px;
`;

const CardTitle = styled.h3`
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: ${(props) => props.theme.contrast};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CardDescription = styled.p`
  margin: 0 0 12px;
  font-size: 13px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.7;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CardMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`;

const TypeBadge = styled.span<{ $type: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: ${(p) => {
    switch (p.$type) {
      case "pdf":
        return "rgba(239, 68, 68, 0.15)";
      case "video":
        return "rgba(59, 130, 246, 0.15)";
      case "image":
        return "rgba(34, 197, 94, 0.15)";
      case "archive":
        return "rgba(168, 85, 247, 0.15)";
      case "article":
        return "rgba(144, 116, 242, 0.15)";
      default:
        return "rgba(255, 255, 255, 0.1)";
    }
  }};
  color: ${(p) => {
    switch (p.$type) {
      case "pdf":
        return "#ef4444";
      case "video":
        return "#3b82f6";
      case "image":
        return "#22c55e";
      case "archive":
        return "#a855f7";
      case "article":
        return "#9074f2";
      default:
        return "inherit";
    }
  }};
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
`;

const SizeBadge = styled.span`
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  font-size: 11px;
  color: ${(props) => props.theme.textColor};
`;

const VisibilityBadge = styled.span<{ $visibility: Visibility }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: ${(p) => `${VISIBILITY_COLORS[p.$visibility]}20`};
  color: ${(p) => VISIBILITY_COLORS[p.$visibility]};
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  margin-left: auto;
`;

const CardActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(144, 116, 242, 0.1);
  border: 1px solid rgba(144, 116, 242, 0.2);
  border-radius: 6px;
  color: ${(props) => props.theme.contrast};
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;

  &:hover {
    background: rgba(144, 116, 242, 0.2);
    border-color: rgba(144, 116, 242, 0.4);
  }
`;
