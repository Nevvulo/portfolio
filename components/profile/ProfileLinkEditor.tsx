import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, m } from "framer-motion";
import { ArrowDown, ArrowUp, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { PROFILE_SERVICES, getServiceByKey } from "../../constants/profile-links";
import { LOUNGE_COLORS } from "../../constants/theme";
import { updateProfileLinks } from "@/src/db/client/profile";

interface ProfileLink {
  type: "service" | "custom";
  serviceKey?: string;
  url: string;
  title?: string;
}

interface ProfileLinkEditorProps {
  isOpen: boolean;
  onClose: () => void;
  currentLinks: ProfileLink[];
  userTier: "free" | "tier1" | "tier2";
}

export function ProfileLinkEditor({ isOpen, onClose, currentLinks, userTier }: ProfileLinkEditorProps) {
  const [links, setLinks] = useState<ProfileLink[]>(currentLinks);
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [serviceUrl, setServiceUrl] = useState("");
  const [selectedServiceKey, setSelectedServiceKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const updateProfileLinksMutation = useMutation({
    mutationFn: (links: ProfileLink[]) => updateProfileLinks(links),
  });

  // Sync when modal opens
  useEffect(() => {
    if (isOpen) {
      setLinks(currentLinks);
      setError("");
      setShowServicePicker(false);
      setShowCustomForm(false);
    }
  }, [isOpen, currentLinks]);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleEscape]);

  const usedServiceKeys = new Set(links.filter((l) => l.type === "service").map((l) => l.serviceKey));
  const customCount = links.filter((l) => l.type === "custom").length;
  const canAddCustom = (userTier === "tier1" || userTier === "tier2") && customCount < 10;

  function moveLink(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= links.length) return;
    const updated = [...links];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setLinks(updated);
  }

  function removeLink(index: number) {
    setLinks(links.filter((_, i) => i !== index));
  }

  function addServiceLink() {
    if (!selectedServiceKey || !serviceUrl.trim()) return;
    let url = serviceUrl.trim();
    if (!url.startsWith("https://")) {
      url = `https://${url}`;
    }
    setLinks([...links, { type: "service", serviceKey: selectedServiceKey, url }]);
    setSelectedServiceKey(null);
    setServiceUrl("");
    setShowServicePicker(false);
  }

  function addCustomLink() {
    if (!customTitle.trim() || !customUrl.trim()) return;
    let url = customUrl.trim();
    if (!url.startsWith("https://")) {
      url = `https://${url}`;
    }
    setLinks([...links, { type: "custom", title: customTitle.trim(), url }]);
    setCustomTitle("");
    setCustomUrl("");
    setShowCustomForm(false);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      await updateProfileLinksMutation.mutateAsync(links);
      onClose();
    } catch (e: any) {
      setError(e.message || "Failed to save links");
    } finally {
      setSaving(false);
    }
  }

  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <Overlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <Modal
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Header>
              <Title>Edit Links</Title>
              <CloseButton onClick={onClose}>
                <X size={20} />
              </CloseButton>
            </Header>

            <Content>
              {error && <ErrorBanner>{error}</ErrorBanner>}

              {/* Current links list */}
              <LinksList>
                {links.length === 0 && (
                  <EmptyMessage>No links yet. Add your first link below.</EmptyMessage>
                )}
                {links.map((link, index) => {
                  const service = link.serviceKey ? getServiceByKey(link.serviceKey) : undefined;
                  const IconComponent = service?.icon;
                  const label = link.type === "custom" ? link.title : service?.label ?? link.serviceKey;

                  return (
                    <LinkItem key={`${link.type}-${link.serviceKey ?? link.title}-${index}`}>
                      <LinkIcon $color={service?.brandColor ?? "#9CA3AF"}>
                        {IconComponent && <IconComponent size={16} />}
                      </LinkIcon>
                      <LinkInfo>
                        <LinkName>{label}</LinkName>
                        <LinkUrl>{link.url}</LinkUrl>
                      </LinkInfo>
                      <LinkActions>
                        <SmallButton onClick={() => moveLink(index, -1)} disabled={index === 0}>
                          <ArrowUp size={14} />
                        </SmallButton>
                        <SmallButton onClick={() => moveLink(index, 1)} disabled={index === links.length - 1}>
                          <ArrowDown size={14} />
                        </SmallButton>
                        <SmallButton onClick={() => removeLink(index)} $danger>
                          <Trash2 size={14} />
                        </SmallButton>
                      </LinkActions>
                    </LinkItem>
                  );
                })}
              </LinksList>

              {/* Add service link */}
              {!showServicePicker && !showCustomForm && (
                <AddButtons>
                  <AddButton onClick={() => setShowServicePicker(true)}>
                    <Plus size={16} />
                    Add Service Link
                  </AddButton>
                  {canAddCustom && (
                    <AddButton onClick={() => setShowCustomForm(true)} $secondary>
                      <Plus size={16} />
                      Add Custom Link
                    </AddButton>
                  )}
                  {userTier === "free" && (
                    <CustomLinkHint>Custom links available for Super Legends</CustomLinkHint>
                  )}
                </AddButtons>
              )}

              {/* Service picker */}
              {showServicePicker && !selectedServiceKey && (
                <PickerPanel>
                  <PickerTitle>Choose a service</PickerTitle>
                  <ServiceGrid>
                    {PROFILE_SERVICES.filter((s) => !usedServiceKeys.has(s.key)).map((service) => {
                      const Icon = service.icon;
                      return (
                        <ServiceOption
                          key={service.key}
                          onClick={() => setSelectedServiceKey(service.key)}
                          $color={service.brandColor}
                        >
                          <Icon size={20} />
                          <span>{service.label}</span>
                        </ServiceOption>
                      );
                    })}
                  </ServiceGrid>
                  <CancelLink onClick={() => setShowServicePicker(false)}>Cancel</CancelLink>
                </PickerPanel>
              )}

              {/* Service URL input */}
              {showServicePicker && selectedServiceKey && (
                <PickerPanel>
                  <PickerTitle>Add {getServiceByKey(selectedServiceKey)?.label} link</PickerTitle>
                  <Input
                    type="url"
                    placeholder={`${getServiceByKey(selectedServiceKey)?.urlPrefix ?? "https://"}...`}
                    value={serviceUrl}
                    onChange={(e) => setServiceUrl(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && addServiceLink()}
                  />
                  <PickerActions>
                    <ActionButton onClick={addServiceLink} disabled={!serviceUrl.trim()}>
                      Add
                    </ActionButton>
                    <CancelLink onClick={() => { setSelectedServiceKey(null); setServiceUrl(""); }}>
                      Back
                    </CancelLink>
                  </PickerActions>
                </PickerPanel>
              )}

              {/* Custom link form */}
              {showCustomForm && (
                <PickerPanel>
                  <PickerTitle>Add Custom Link</PickerTitle>
                  <Input
                    type="text"
                    placeholder="Title (e.g. My Portfolio)"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    autoFocus
                  />
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCustomLink()}
                  />
                  <PickerActions>
                    <ActionButton onClick={addCustomLink} disabled={!customTitle.trim() || !customUrl.trim()}>
                      Add
                    </ActionButton>
                    <CancelLink onClick={() => { setShowCustomForm(false); setCustomTitle(""); setCustomUrl(""); }}>
                      Cancel
                    </CancelLink>
                  </PickerActions>
                </PickerPanel>
              )}
            </Content>

            <Footer>
              <SaveButton onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Links"}
              </SaveButton>
            </Footer>
          </Modal>
        </Overlay>
      )}
    </AnimatePresence>,
    document.body,
  );
}

const Overlay = styled(m.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const Modal = styled(m.div)`
  background: rgba(20, 17, 32, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  width: 100%;
  max-width: 520px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Title = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  margin: 0;
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
`;

const ErrorBanner = styled.div`
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  color: #f87171;
  margin-bottom: 16px;
`;

const LinksList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
`;

const EmptyMessage = styled.p`
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
  text-align: center;
  padding: 20px 0;
  margin: 0;
`;

const LinkItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
`;

const LinkIcon = styled.div<{ $color: string }>`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: ${(p) => `${p.$color}18`};
  color: ${(p) => p.$color};
  flex-shrink: 0;
`;

const LinkInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const LinkName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #fff;
`;

const LinkUrl = styled.div`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const LinkActions = styled.div`
  display: flex;
  gap: 4px;
  flex-shrink: 0;
`;

const SmallButton = styled.button<{ $danger?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  color: ${(p) => (p.$danger ? "#f87171" : "rgba(255, 255, 255, 0.5)")};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: ${(p) => (p.$danger ? "rgba(239, 68, 68, 0.15)" : "rgba(255, 255, 255, 0.1)")};
    color: ${(p) => (p.$danger ? "#ef4444" : "#fff")};
  }

  &:disabled {
    opacity: 0.3;
    cursor: default;
  }
`;

const AddButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const AddButton = styled.button<{ $secondary?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px;
  background: ${(p) => (p.$secondary ? "rgba(255, 255, 255, 0.03)" : `${LOUNGE_COLORS.tier1}15`)};
  border: 1px dashed ${(p) => (p.$secondary ? "rgba(255, 255, 255, 0.15)" : `${LOUNGE_COLORS.tier1}40`)};
  border-radius: 10px;
  color: ${(p) => (p.$secondary ? "rgba(255, 255, 255, 0.6)" : LOUNGE_COLORS.tier1)};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${(p) => (p.$secondary ? "rgba(255, 255, 255, 0.06)" : `${LOUNGE_COLORS.tier1}25`)};
  }
`;

const CustomLinkHint = styled.p`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
  text-align: center;
  margin: 4px 0 0;
`;

const PickerPanel = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px;
`;

const PickerTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 12px;
`;

const ServiceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 8px;
  margin-bottom: 12px;
`;

const ServiceOption = styled.button<{ $color: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  color: ${(p) => p.$color};
  cursor: pointer;
  transition: all 0.15s ease;

  span {
    font-size: 11px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.7);
  }

  &:hover {
    background: ${(p) => `${p.$color}15`};
    border-color: ${(p) => `${p.$color}40`};
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 14px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  outline: none;
  margin-bottom: 10px;

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }

  &:focus {
    border-color: ${LOUNGE_COLORS.tier1};
  }
`;

const PickerActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ActionButton = styled.button`
  padding: 8px 20px;
  background: ${LOUNGE_COLORS.tier1};
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.4;
    cursor: default;
  }
`;

const CancelLink = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  cursor: pointer;

  &:hover {
    color: rgba(255, 255, 255, 0.8);
  }
`;

const Footer = styled.div`
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const SaveButton = styled.button`
  width: 100%;
  padding: 12px;
  background: ${LOUNGE_COLORS.tier1};
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;
