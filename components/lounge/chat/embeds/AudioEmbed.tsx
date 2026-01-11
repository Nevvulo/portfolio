import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { LOUNGE_COLORS } from "../../../../constants/lounge";

interface AudioEmbedProps {
  url: string;
  filename?: string;
  duration?: number;
}

export const AudioEmbed = memo(function AudioEmbed({ url, filename }: AudioEmbedProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoaded(true);
    };
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const time = Number(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <AudioContainer>
      <audio ref={audioRef} src={url} preload="metadata" />

      <PlayButton onClick={togglePlay} aria-label={isPlaying ? "Pause" : "Play"}>
        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
      </PlayButton>

      <ProgressSection>
        {filename && <Filename title={filename}>{filename}</Filename>}
        <ProgressBar>
          <ProgressInput
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            disabled={!isLoaded}
          />
          <ProgressFill $progress={progress} />
        </ProgressBar>
        <TimeDisplay>
          {formatTime(currentTime)} / {isLoaded ? formatTime(duration) : "--:--"}
        </TimeDisplay>
      </ProgressSection>

      <MuteButton onClick={toggleMute} aria-label={isMuted ? "Unmute" : "Mute"}>
        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </MuteButton>
    </AudioContainer>
  );
});

const AudioContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 8px;
  margin-top: 0.5rem;
  max-width: 400px;
`;

const PlayButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: ${LOUNGE_COLORS.tier1};
  border: none;
  border-radius: 50%;
  color: #fff;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.15s, opacity 0.15s;

  &:hover {
    transform: scale(1.05);
    opacity: 0.9;
  }

  svg {
    margin-left: 2px; // Visual centering for play icon
  }
`;

const ProgressSection = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const Filename = styled.div`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.8);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ProgressBar = styled.div`
  position: relative;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
`;

const ProgressInput = styled.input`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 1;

  &:disabled {
    cursor: default;
  }
`;

const ProgressFill = styled.div<{ $progress: number }>`
  height: 100%;
  width: ${(p) => p.$progress}%;
  background: ${LOUNGE_COLORS.tier1};
  border-radius: 2px;
  transition: width 0.1s linear;
`;

const TimeDisplay = styled.div`
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.5);
  font-variant-numeric: tabular-nums;
`;

const MuteButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  border-radius: 4px;
  transition: color 0.15s, background 0.15s;

  &:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
  }
`;
