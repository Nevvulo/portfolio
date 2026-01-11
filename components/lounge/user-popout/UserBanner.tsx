import { Camera, Check, X } from "lucide-react";
import { useRef, useState } from "react";
import styled from "styled-components";
import { LOUNGE_COLORS } from "../../../constants/lounge";
import { useBannerUpload } from "../../../hooks/lounge/useBannerUpload";
import { BannerFocalSlider } from "./BannerFocalSlider";

interface UserBannerProps {
  bannerUrl?: string;
  bannerFocalY?: number;
  isEditable?: boolean;
  onBannerUpdate?: () => void;
}

/**
 * User profile banner with edit functionality
 */
export function UserBanner({
  bannerUrl,
  bannerFocalY = 50,
  isEditable = false,
  onBannerUpdate,
}: UserBannerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [focalY, setFocalY] = useState(bannerFocalY);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { upload, remove, isUploading, error } = useBannerUpload();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setPreviewFile(file);
    setIsEditing(true);
    setFocalY(50); // Reset focal point for new image
  };

  const handleSave = async () => {
    if (!previewFile) return;

    const result = await upload(previewFile, focalY);
    if (result) {
      setIsEditing(false);
      setPreviewUrl(null);
      setPreviewFile(null);
      onBannerUpdate?.();
    }
  };

  const handleCancel = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setIsEditing(false);
    setPreviewUrl(null);
    setPreviewFile(null);
    setFocalY(bannerFocalY);
  };

  // Remove banner (for future use when adding remove button)
  const _handleRemove = async () => {
    const success = await remove();
    if (success) {
      onBannerUpdate?.();
    }
  };
  void _handleRemove; // Prevent unused warning

  const displayUrl = previewUrl || bannerUrl;
  const displayFocalY = isEditing ? focalY : bannerFocalY;

  return (
    <BannerContainer>
      {displayUrl ? (
        <BannerImage src={displayUrl} alt="Profile banner" $focalY={displayFocalY} />
      ) : (
        <BannerPlaceholder />
      )}

      {/* Gradient overlay for better text readability */}
      <BannerOverlay />

      {/* Edit controls */}
      {isEditable && !isEditing && (
        <EditButton onClick={() => fileInputRef.current?.click()}>
          <Camera size={16} />
        </EditButton>
      )}

      {/* Editing mode controls */}
      {isEditing && (
        <EditingOverlay>
          <FocalSliderContainer>
            <BannerFocalSlider focalY={focalY} onChange={setFocalY} />
          </FocalSliderContainer>
          <EditActions>
            <ActionButton onClick={handleCancel} $variant="cancel">
              <X size={16} />
            </ActionButton>
            <ActionButton onClick={handleSave} $variant="save" disabled={isUploading}>
              {isUploading ? "..." : <Check size={16} />}
            </ActionButton>
          </EditActions>
          {error && <ErrorMessage>{error}</ErrorMessage>}
        </EditingOverlay>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />
    </BannerContainer>
  );
}

const BannerContainer = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  max-height: 200px;
  overflow: hidden;
  border-radius: 8px 8px 0 0;
`;

const BannerImage = styled.img<{ $focalY: number }>`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center ${(p) => p.$focalY}%;
`;

const BannerPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    ${LOUNGE_COLORS.tier1}33 0%,
    ${LOUNGE_COLORS.glassBackground} 50%,
    ${LOUNGE_COLORS.tier2}33 100%
  );
`;

const BannerOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60%;
  background: linear-gradient(
    to top,
    ${LOUNGE_COLORS.glassBackground} 0%,
    transparent 100%
  );
  pointer-events: none;
`;

const EditButton = styled.button`
  position: absolute;
  top: 8px;
  left: 8px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${LOUNGE_COLORS.glassBackground};
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease;

  ${BannerContainer}:hover & {
    opacity: 1;
  }

  &:hover {
    background: ${LOUNGE_COLORS.tier1}33;
    border-color: ${LOUNGE_COLORS.tier1};
  }
`;

const EditingOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
`;

const FocalSliderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
`;

const EditActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button<{ $variant: "save" | "cancel"; disabled?: boolean }>`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${(p) => (p.disabled ? "not-allowed" : "pointer")};
  opacity: ${(p) => (p.disabled ? 0.5 : 1)};
  transition: all 0.2s ease;

  ${(p) =>
    p.$variant === "save"
      ? `
    background: ${LOUNGE_COLORS.online};
    color: #fff;
    &:hover:not(:disabled) {
      background: #16a34a;
    }
  `
      : `
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  `}
`;

const ErrorMessage = styled.div`
  font-size: 0.75rem;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
`;

export default UserBanner;
