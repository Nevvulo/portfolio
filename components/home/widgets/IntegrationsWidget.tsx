import { faDiscord, faTwitch } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useQuery } from "convex/react";
import { Check, Link2, X } from "lucide-react";
import Link from "next/link";
import styled from "styled-components";
import { api } from "../../../convex/_generated/api";
import { WidgetContainer } from "./WidgetContainer";

// Roblox doesn't have a FontAwesome icon — keep inline SVG
function RobloxIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M5.164 0L0 18.576l13.836 5.424L24 5.424 5.164 0zm7.412 15.54l-4.956-1.932 1.932-4.956 4.956 1.932-1.932 4.956z" />
    </svg>
  );
}

export function IntegrationsWidget() {
  const user = useQuery(api.users.getMe);
  const linkedRoblox = useQuery(api.roblox.getLinkedRoblox);

  const hasDiscord = !!user?.discordId;
  const hasRoblox = !!linkedRoblox?.robloxUserId;
  const hasTwitch = !!user?.twitchUsername;

  return (
    <WidgetContainer title="Integrations" icon={<Link2 size={16} />} headerAction={<Link href="/account">Manage</Link>}>
      <IntegrationsList>
        <IntegrationRow>
          <IntegrationIcon $connected={hasDiscord} $color="#5865f2">
            <FontAwesomeIcon icon={faDiscord} />
          </IntegrationIcon>
          <IntegrationName>Discord</IntegrationName>
          <StatusDot $connected={hasDiscord}>
            {hasDiscord ? <Check size={10} /> : <X size={10} />}
          </StatusDot>
        </IntegrationRow>

        <IntegrationRow>
          <IntegrationIcon $connected={hasTwitch} $color="#9146ff">
            <FontAwesomeIcon icon={faTwitch} />
          </IntegrationIcon>
          <IntegrationName>Twitch</IntegrationName>
          <StatusDot $connected={hasTwitch}>
            {hasTwitch ? <Check size={10} /> : <X size={10} />}
          </StatusDot>
        </IntegrationRow>

        <IntegrationRow>
          <IntegrationIcon $connected={hasRoblox} $color="#e2231a">
            <RobloxIcon />
          </IntegrationIcon>
          <IntegrationName>Roblox</IntegrationName>
          <StatusDot $connected={hasRoblox}>
            {hasRoblox ? <Check size={10} /> : <X size={10} />}
          </StatusDot>
        </IntegrationRow>
      </IntegrationsList>

    </WidgetContainer>
  );
}

const IntegrationsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const IntegrationRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
`;

const IntegrationIcon = styled.div<{ $connected: boolean; $color: string }>`
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(p) => (p.$connected ? `${p.$color}15` : "rgba(255, 255, 255, 0.04)")};
  border-radius: 6px;
  color: ${(p) => (p.$connected ? `${p.$color}bb` : "rgba(255, 255, 255, 0.3)")};
  font-size: 14px;
`;

const IntegrationName = styled.span`
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
`;

const StatusDot = styled.div<{ $connected: boolean }>`
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(p) => (p.$connected ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.04)")};
  border-radius: 50%;
  color: ${(p) => (p.$connected ? "rgba(255, 255, 255, 0.5)" : "rgba(255, 255, 255, 0.2)")};
`;

