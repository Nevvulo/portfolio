import { useState, useRef } from "react";
import styled from "styled-components";
import { m, AnimatePresence } from "framer-motion";
import { X, Upload, Mail, Package, Megaphone, Loader2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { LOUNGE_COLORS, RARITY_COLORS } from "../../../constants/lounge";
import type { InventoryItem, ItemRarity } from "../../../types/lounge";

interface ClaimModalProps {
  item: InventoryItem;
  isOpen: boolean;
  onClose: () => void;
  onClaim: (data: ClaimData) => Promise<void>;
}

export interface ClaimData {
  itemId: string;
  rewardId: string;
  deliveryMethod: "email" | "inventory";
  email?: string;
  // Shoutout specific
  shoutoutTitle?: string;
  shoutoutImage?: string;
  shoutoutLink?: string;
}

type DeliveryMethod = "email" | "inventory";

export function ClaimModal({ item, isOpen, onClose, onClaim }: ClaimModalProps) {
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delivery method state (for non-shoutout items)
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("inventory");
  const [customEmail, setCustomEmail] = useState("");

  // Shoutout specific state
  const [shoutoutTitle, setShoutoutTitle] = useState("");
  const [shoutoutLink, setShoutoutLink] = useState("");
  const [shoutoutImage, setShoutoutImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const isShoutout = item.type === "shoutout";
  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const rarityColors = RARITY_COLORS[item.rarity as ItemRarity];

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    setUploadingImage(true);
    setError(null);

    try {
      const base64 = await fileToBase64(file);

      const response = await fetch("/api/lounge/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file: base64,
          filename: file.name,
          mimeType: file.type,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await response.json();
      setShoutoutImage(data.url);
    } catch (err: any) {
      setError(err.message || "Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    setError(null);

    // Validation
    if (isShoutout) {
      if (!shoutoutTitle.trim()) {
        setError("Please enter a title for the shoutout");
        return;
      }
    } else {
      if (deliveryMethod === "email") {
        const emailToUse = customEmail || userEmail;
        if (!emailToUse) {
          setError("Please enter an email address");
          return;
        }
        // Basic email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToUse)) {
          setError("Please enter a valid email address");
          return;
        }
      }
    }

    setSubmitting(true);

    try {
      const claimData: ClaimData = {
        itemId: item.id,
        rewardId: item.rewardId as string,
        deliveryMethod: isShoutout ? "inventory" : deliveryMethod,
        email: deliveryMethod === "email" ? (customEmail || userEmail) : undefined,
        shoutoutTitle: isShoutout ? shoutoutTitle.trim() : undefined,
        shoutoutImage: isShoutout ? shoutoutImage || undefined : undefined,
        shoutoutLink: isShoutout && shoutoutLink.trim() ? shoutoutLink.trim() : undefined,
      };

      await onClaim(claimData);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to claim item");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <Overlay
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <Modal
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>

          <ModalHeader>
            <IconWrapper $color={rarityColors.color}>
              {isShoutout ? <Megaphone size={24} /> : <Package size={24} />}
            </IconWrapper>
            <div>
              <ModalTitle>
                {isShoutout ? "Who are we shouting out!?" : "Where should we send this?"}
              </ModalTitle>
              <ItemName $color={rarityColors.color}>{item.name}</ItemName>
            </div>
          </ModalHeader>

          <ModalBody>
            {isShoutout ? (
              // Shoutout Form
              <>
                <FormGroup>
                  <Label>Title *</Label>
                  <Input
                    type="text"
                    placeholder="e.g., Check out my friend's awesome project!"
                    value={shoutoutTitle}
                    onChange={(e) => setShoutoutTitle(e.target.value)}
                    maxLength={100}
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Image (optional)</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: "none" }}
                  />
                  {shoutoutImage ? (
                    <ImagePreview>
                      <img src={shoutoutImage} alt="Preview" />
                      <RemoveImageButton
                        onClick={() => setShoutoutImage(null)}
                        type="button"
                      >
                        <X size={16} />
                      </RemoveImageButton>
                    </ImagePreview>
                  ) : (
                    <UploadButton
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      type="button"
                    >
                      {uploadingImage ? (
                        <>
                          <Loader2 size={18} className="spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={18} />
                          Upload Image
                        </>
                      )}
                    </UploadButton>
                  )}
                </FormGroup>

                <FormGroup>
                  <Label>Link (optional)</Label>
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={shoutoutLink}
                    onChange={(e) => setShoutoutLink(e.target.value)}
                  />
                </FormGroup>

                <HelpText>
                  Your shoutout will be posted to the #shoutouts channel!
                </HelpText>
              </>
            ) : (
              // Delivery Method Form
              <>
                <DeliveryOptions>
                  {userEmail && (
                    <DeliveryOption
                      $selected={deliveryMethod === "email" && !customEmail}
                      onClick={() => {
                        setDeliveryMethod("email");
                        setCustomEmail("");
                      }}
                    >
                      <Mail size={20} />
                      <div>
                        <OptionLabel>Send to my email</OptionLabel>
                        <OptionEmail>{userEmail}</OptionEmail>
                      </div>
                    </DeliveryOption>
                  )}

                  <DeliveryOption
                    $selected={deliveryMethod === "email" && !!customEmail}
                    onClick={() => setDeliveryMethod("email")}
                  >
                    <Mail size={20} />
                    <div>
                      <OptionLabel>Send to different email</OptionLabel>
                      {deliveryMethod === "email" && (
                        <EmailInput
                          type="email"
                          placeholder="Enter email address"
                          value={customEmail}
                          onChange={(e) => setCustomEmail(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                    </div>
                  </DeliveryOption>

                  <DeliveryOption
                    $selected={deliveryMethod === "inventory"}
                    onClick={() => {
                      setDeliveryMethod("inventory");
                      setCustomEmail("");
                    }}
                  >
                    <Package size={20} />
                    <div>
                      <OptionLabel>Just put it in my inventory</OptionLabel>
                      <OptionHint>Access it anytime from your rewards page</OptionHint>
                    </div>
                  </DeliveryOption>
                </DeliveryOptions>
              </>
            )}

            {error && <ErrorMessage>{error}</ErrorMessage>}
          </ModalBody>

          <ModalFooter>
            <CancelButton onClick={onClose} disabled={submitting}>
              Cancel
            </CancelButton>
            <SubmitButton onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 size={16} className="spin" />
                  Processing...
                </>
              ) : isShoutout ? (
                "Post Shoutout"
              ) : (
                "Claim Reward"
              )}
            </SubmitButton>
          </ModalFooter>
        </Modal>
      </Overlay>
    </AnimatePresence>
  );
}

// Styled Components
const Overlay = styled(m.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 1rem;
`;

const Modal = styled(m.div)`
  background: ${LOUNGE_COLORS.glassBackground};
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 16px;
  max-width: 480px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 8px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border-bottom: 1px solid ${LOUNGE_COLORS.glassBorder};
`;

const IconWrapper = styled.div<{ $color: string }>`
  width: 48px;
  height: 48px;
  background: ${(p) => `${p.$color}20`};
  border: 1px solid ${(p) => `${p.$color}40`};
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(p) => p.$color};
`;

const ModalTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 600;
  color: #fff;
  margin: 0 0 0.25rem;
`;

const ItemName = styled.div<{ $color: string }>`
  font-size: 0.85rem;
  color: ${(p) => p.$color};
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.25rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.85rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 8px;
  color: #fff;
  font-size: 0.9rem;
  transition: border-color 0.2s;

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }

  &:focus {
    outline: none;
    border-color: ${LOUNGE_COLORS.tier1};
  }
`;

const UploadButton = styled.button`
  width: 100%;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border: 2px dashed ${LOUNGE_COLORS.glassBorder};
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    border-color: ${LOUNGE_COLORS.tier1};
    color: ${LOUNGE_COLORS.tier1};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }

  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const ImagePreview = styled.div`
  position: relative;
  border-radius: 8px;
  overflow: hidden;

  img {
    width: 100%;
    max-height: 200px;
    object-fit: cover;
  }
`;

const RemoveImageButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: rgba(0, 0, 0, 0.7);
  border: none;
  border-radius: 6px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: rgba(239, 68, 68, 0.8);
  }
`;

const HelpText = styled.p`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  font-style: italic;
`;

const DeliveryOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const DeliveryOption = styled.div<{ $selected: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: ${(p) => (p.$selected ? `${LOUNGE_COLORS.tier1}15` : "rgba(0, 0, 0, 0.2)")};
  border: 1px solid ${(p) => (p.$selected ? LOUNGE_COLORS.tier1 : LOUNGE_COLORS.glassBorder)};
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;

  svg {
    color: ${(p) => (p.$selected ? LOUNGE_COLORS.tier1 : "rgba(255, 255, 255, 0.5)")};
    flex-shrink: 0;
    margin-top: 2px;
  }

  &:hover {
    background: ${(p) => (p.$selected ? `${LOUNGE_COLORS.tier1}15` : "rgba(255, 255, 255, 0.05)")};
  }
`;

const OptionLabel = styled.div`
  font-size: 0.9rem;
  font-weight: 500;
  color: #fff;
`;

const OptionEmail = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 0.25rem;
`;

const OptionHint = styled.div`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 0.25rem;
`;

const EmailInput = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 6px;
  color: #fff;
  font-size: 0.85rem;
  margin-top: 0.5rem;

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }

  &:focus {
    outline: none;
    border-color: ${LOUNGE_COLORS.tier1};
  }
`;

const ErrorMessage = styled.div`
  padding: 0.75rem 1rem;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #ef4444;
  font-size: 0.85rem;
  margin-top: 1rem;
`;

const ModalFooter = styled.div`
  display: flex;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid ${LOUNGE_COLORS.glassBorder};
`;

const CancelButton = styled.button`
  flex: 1;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.15);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SubmitButton = styled.button`
  flex: 1;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, ${LOUNGE_COLORS.tier1}, #6b69d6);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(144, 116, 242, 0.4);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  .spin {
    animation: spin 1s linear infinite;
  }
`;
