import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styled from "styled-components";
import type { DiscordWidget } from "../../types/discord";

const InviteContainer = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.35em;
  padding: 0.15em 0.6em;
  height: 1.6em;
  max-height: 1.6em;
  background: linear-gradient(135deg, rgba(88, 101, 242, 0.2), rgba(88, 101, 242, 0.1));
  border: 1px solid rgba(88, 101, 242, 0.4);
  border-radius: 999px;
  text-decoration: none;
  color: #7289da;
  font-weight: 500;
  font-size: 0.75em;
  transition: all 0.2s ease;
  vertical-align: middle;
  white-space: nowrap;

  &:hover {
    background: linear-gradient(135deg, rgba(88, 101, 242, 0.3), rgba(88, 101, 242, 0.2));
    border-color: rgba(88, 101, 242, 0.6);
    color: #8ea1f5;
  }
`;

const DiscordIcon = styled(FontAwesomeIcon)`
  color: #5865f2;
  font-size: 1em;
`;

const ServerName = styled.span`
  color: inherit;
`;

const OnlineBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25em;
  padding: 0 0.35em;
  background: rgba(67, 181, 129, 0.2);
  border-radius: 999px;
  font-size: 0.9em;
  color: #43b581;
  font-weight: 600;
`;

const OnlineDot = styled.span`
  display: inline-block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: #43b581;
`;

const ExternalIcon = styled(FontAwesomeIcon)`
  font-size: 0.7em;
  opacity: 0.6;
`;

interface DiscordInviteLinkProps {
  href: string;
  widget: DiscordWidget | null;
}

export const DiscordInviteLink: React.FC<DiscordInviteLinkProps> = ({ href, widget }) => {
  const serverName = widget?.name || "Discord Server";
  const onlineCount = widget?.presence_count || 0;

  return (
    <InviteContainer href={href} target="_blank" rel="noopener noreferrer">
      <DiscordIcon icon={faDiscord} />
      <ServerName>Join {serverName}</ServerName>
      {onlineCount > 0 && (
        <OnlineBadge>
          <OnlineDot />
          {onlineCount}
        </OnlineBadge>
      )}
      <ExternalIcon icon={faExternalLinkAlt} />
    </InviteContainer>
  );
};

// Helper to check if a URL is a Discord invite
export const isDiscordInvite = (url: string): boolean => {
  return /^https?:\/\/(discord\.gg|discord\.com\/invite)\//.test(url);
};
