import { faSoundcloud, faTwitch, faYoutube } from "@fortawesome/free-brands-svg-icons";
import { faClock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Music2 } from "lucide-react";
import styled from "styled-components";
import { LOUNGE_COLORS } from "../../../constants/theme";
import { WidgetContainer } from "./WidgetContainer";

const MUSIC_LINKS = [
  {
    platform: "YouTube",
    href: "https://youtube.com/@nevdnb",
    icon: faYoutube,
    color: "#ff0000",
  },
  {
    platform: "Twitch",
    href: "https://twitch.tv/nevdnb",
    icon: faTwitch,
    color: "#9146ff",
  },
  {
    platform: "SoundCloud",
    href: "https://soundcloud.com/nevdnb",
    icon: faSoundcloud,
    color: "#ff5500",
  },
];

/** Music widget — platform links + upcoming releases teaser */
export function MusicWidget() {
  return (
    <WidgetContainer noPadding>
      <CustomHeader>
        <Handle>@nevdnb</Handle>
        <TitleGroup>
          <TitleIcon><Music2 size={16} /></TitleIcon>
          <TitleText>Music</TitleText>
        </TitleGroup>
      </CustomHeader>
      <SplitLayout>
        <PlatformSide>
          {MUSIC_LINKS.map((link) => (
            <PlatformLink
              key={link.platform}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              <PlatformIcon $color={link.color}>
                <FontAwesomeIcon icon={link.icon} />
              </PlatformIcon>
              <PlatformLabel>{link.platform}</PlatformLabel>
            </PlatformLink>
          ))}
        </PlatformSide>

        <Divider />

        <ReleaseGroup>
          <ClockIcon>
            <FontAwesomeIcon icon={faClock} />
          </ClockIcon>
          <ReleaseText>Releases coming soon</ReleaseText>
        </ReleaseGroup>
      </SplitLayout>
    </WidgetContainer>
  );
}

const SplitLayout = styled.div`
  display: flex;
  align-items: center;
  gap: 0;
  min-height: 48px;
  padding: 10px 16px 16px;
`;

const PlatformSide = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
`;

const PlatformLink = styled.a`
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  transition: opacity 0.15s ease;
  padding: 4px 0;

  &:hover {
    opacity: 0.8;
  }
`;

const PlatformIcon = styled.div<{ $color: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  font-size: 14px;
  color: ${(p) => p.$color};
`;

const PlatformLabel = styled.span`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
`;

const Divider = styled.div`
  width: 1px;
  align-self: stretch;
  background: rgba(255, 255, 255, 0.06);
  margin: 0 16px;
`;

const CustomHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 0;
`;

const Handle = styled.span`
  font-family: "Sixtyfour", monospace;
  font-size: 12px;
  padding-top: 6px;
  color: white;
  line-height: 1;
`;

const TitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TitleIcon = styled.div`
  display: flex;
  align-items: center;
  color: ${LOUNGE_COLORS.tier1};
`;

const TitleText = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: ${(p) => p.theme.textColor};
  opacity: 0.55;
`;

const ReleaseGroup = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
`;

const ClockIcon = styled.div`
  font-size: 20px;
  color: rgba(255, 255, 255, 0.25);
`;

const ReleaseText = styled.span`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
  font-weight: 500;
  line-height: 1.3;
`;
