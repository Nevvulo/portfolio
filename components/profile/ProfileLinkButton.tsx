import { ExternalLink } from "lucide-react";
import styled from "styled-components";
import { getServiceByKey } from "../../constants/profile-links";

interface ProfileLinkButtonProps {
  type: "service" | "custom";
  serviceKey?: string;
  url: string;
  title?: string;
}

export function ProfileLinkButton({ type, serviceKey, url, title }: ProfileLinkButtonProps) {
  const service = serviceKey ? getServiceByKey(serviceKey) : undefined;
  const IconComponent = service?.icon;
  const brandColor = service?.brandColor ?? "#9CA3AF";
  const label = type === "custom" ? (title ?? "Link") : (service?.label ?? serviceKey ?? "Link");

  return (
    <LinkPill href={url} target="_blank" rel="noopener noreferrer" $brandColor={brandColor}>
      <IconWrapper $brandColor={brandColor}>
        {IconComponent ? <IconComponent size={20} /> : <ExternalLink size={20} />}
      </IconWrapper>
      <LinkLabel>{label}</LinkLabel>
      <ExternalIcon>
        <ExternalLink size={14} />
      </ExternalIcon>
    </LinkPill>
  );
}

const LinkPill = styled.a<{ $brandColor: string }>`
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 14px 18px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.07);
    border-color: ${(p) => `${p.$brandColor}50`};
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  }
`;

const IconWrapper = styled.div<{ $brandColor: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${(p) => `${p.$brandColor}18`};
  color: ${(p) => p.$brandColor};
  flex-shrink: 0;
`;

const LinkLabel = styled.span`
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
`;

const ExternalIcon = styled.span`
  color: rgba(255, 255, 255, 0.3);
  flex-shrink: 0;
`;
