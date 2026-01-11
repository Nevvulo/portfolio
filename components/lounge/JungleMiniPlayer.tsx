import { AnimatePresence, m } from "framer-motion";
import { Radio, TreePalm, Volume2, VolumeX, X } from "lucide-react";
import { useRouter } from "next/router";
import { useState } from "react";
import styled from "styled-components";
import { LOUNGE_COLORS } from "../../constants/lounge";
import { useLiveKitContextOptional } from "../../lib/lounge/LiveKitContext";

export function JungleMiniPlayer() {
  const router = useRouter();
  const liveKit = useLiveKitContextOptional();
  const [isMuted, setIsMuted] = useState(false);

  // Don't render if no context, not connected, or already on jungle page
  if (!liveKit || !liveKit.isConnected || router.pathname === "/lounge/jungle") {
    return null;
  }

  const handleToggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    liveKit.callbacksRef.current.onSetMuted?.(newMuted);
  };

  const handleDisconnect = () => {
    liveKit.callbacksRef.current.onDisconnect?.();
  };

  const handleClick = () => {
    router.push("/lounge/jungle");
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <AnimatePresence>
      <Container
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        drag
        dragMomentum={false}
        dragElastic={0.1}
        whileDrag={{ scale: 1.05 }}
      >
        <MainContent onClick={handleClick}>
          <IconWrapper>
            <TreePalm size={20} />
            {liveKit.isReceiving && <LiveDot />}
          </IconWrapper>
          <Info>
            <Title>Jungle</Title>
            <Status>
              {liveKit.isReceiving ? (
                <>
                  <Radio size={10} />
                  <span>Live</span>
                </>
              ) : (
                <span>Connected</span>
              )}
              {liveKit.timeRemaining !== null && (
                <Timer $isLow={liveKit.timeRemaining < 5 * 60 * 1000}>
                  {formatTime(liveKit.timeRemaining)}
                </Timer>
              )}
            </Status>
          </Info>
        </MainContent>

        <Controls>
          <ControlButton onClick={handleToggleMute} title={isMuted ? "Unmute" : "Mute"}>
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </ControlButton>
          <ControlButton onClick={handleDisconnect} title="Disconnect" $danger>
            <X size={16} />
          </ControlButton>
        </Controls>
      </Container>
    </AnimatePresence>
  );
}

const Container = styled(m.div)`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(20, 20, 25, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
`;

const MainContent = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding-right: 8px;
  border-right: 1px solid ${LOUNGE_COLORS.glassBorder};

  &:hover {
    opacity: 0.9;
  }
`;

const IconWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, ${LOUNGE_COLORS.tier1}30, ${LOUNGE_COLORS.tier2}30);
  border-radius: 8px;
  color: ${LOUNGE_COLORS.tier1};
`;

const LiveDot = styled.div`
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.1); }
  }
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const Title = styled.span`
  font-size: 0.85rem;
  font-weight: 600;
  color: #fff;
`;

const Status = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);

  svg {
    color: #ef4444;
  }
`;

const Timer = styled.span<{ $isLow?: boolean }>`
  margin-left: 4px;
  padding: 1px 4px;
  background: ${(p) => (p.$isLow ? "rgba(239, 68, 68, 0.2)" : "rgba(255, 255, 255, 0.1)")};
  border-radius: 4px;
  font-size: 0.65rem;
  color: ${(p) => (p.$isLow ? "#ef4444" : "rgba(255, 255, 255, 0.6)")};
  font-variant-numeric: tabular-nums;
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ControlButton = styled.button<{ $danger?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: ${(p) => (p.$danger ? "#ef4444" : "rgba(255, 255, 255, 0.7)")};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${(p) => (p.$danger ? "rgba(239, 68, 68, 0.2)" : "rgba(255, 255, 255, 0.1)")};
    color: ${(p) => (p.$danger ? "#ef4444" : "#fff")};
  }
`;

export default JungleMiniPlayer;
