import { Download, Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { LOUNGE_COLORS } from "../../../constants/lounge";

interface AudioPlayerProps {
  src: string;
  title: string;
  thumbnail?: string;
  duration?: number;
  soundcloudUrl?: string;
}

export function AudioPlayer({ src, title, thumbnail, duration, soundcloudUrl }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setAudioDuration(audio.duration);
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

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = parseFloat(e.target.value);
    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume || 1;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const skip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(0, Math.min(audioDuration, audio.currentTime + seconds));
  };

  // Close download menu when clicking outside
  useEffect(() => {
    if (!showDownloadMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target as Node)) {
        setShowDownloadMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDownloadMenu]);

  const handleDownloadClick = useCallback(() => {
    if (soundcloudUrl) {
      setShowDownloadMenu((prev) => !prev);
    } else {
      // Direct download
      const link = document.createElement("a");
      link.href = src;
      link.download = title || "audio";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [soundcloudUrl, src, title]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  return (
    <PlayerContainer>
      <audio ref={audioRef} src={src} preload="metadata" />

      {thumbnail && <Thumbnail src={thumbnail} alt={title} />}

      <PlayerContent>
        <TrackTitle>{title}</TrackTitle>

        <ProgressContainer>
          <TimeDisplay>{formatTime(currentTime)}</TimeDisplay>
          <ProgressBar>
            <ProgressTrack>
              <ProgressFill style={{ width: `${progress}%` }} />
            </ProgressTrack>
            <ProgressInput
              type="range"
              min={0}
              max={audioDuration || 100}
              value={currentTime}
              onChange={handleSeek}
            />
          </ProgressBar>
          <TimeDisplay>{formatTime(audioDuration)}</TimeDisplay>
        </ProgressContainer>

        <ControlsRow>
          <Controls>
            <ControlButton onClick={() => skip(-10)} title="Back 10s">
              <SkipBack size={16} />
            </ControlButton>
            <PlayButton onClick={togglePlay}>
              {isPlaying ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: 2 }} />}
            </PlayButton>
            <ControlButton onClick={() => skip(10)} title="Forward 10s">
              <SkipForward size={16} />
            </ControlButton>
          </Controls>

          <RightControls>
            <VolumeControl>
              <ControlButton onClick={toggleMute}>
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </ControlButton>
              <VolumeSlider
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
              />
            </VolumeControl>

            <DownloadWrapper ref={downloadMenuRef}>
              <ControlButton onClick={handleDownloadClick} title="Download">
                <Download size={16} />
              </ControlButton>
              {showDownloadMenu && soundcloudUrl && (
                <DownloadMenu>
                  <DownloadMenuItem href={soundcloudUrl} target="_blank" rel="noopener noreferrer">
                    <SoundCloudIcon />
                    SoundCloud
                  </DownloadMenuItem>
                  <DownloadMenuItem href={src} download={title || "audio"}>
                    <Download size={14} />
                    Direct Download
                  </DownloadMenuItem>
                </DownloadMenu>
              )}
            </DownloadWrapper>
          </RightControls>
        </ControlsRow>
      </PlayerContent>
    </PlayerContainer>
  );
}

const PlayerContainer = styled.div`
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 12px;
  overflow: hidden;
`;

const Thumbnail = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
`;

const PlayerContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
`;

const TrackTitle = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ProgressContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const TimeDisplay = styled.span`
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
  font-family: "JetBrains Mono", monospace;
  min-width: 35px;
`;

const ProgressBar = styled.div`
  flex: 1;
  position: relative;
  height: 20px;
  display: flex;
  align-items: center;
`;

const ProgressTrack = styled.div`
  position: absolute;
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, ${LOUNGE_COLORS.tier1}, ${LOUNGE_COLORS.tier2});
  border-radius: 2px;
  transition: width 0.1s linear;
`;

const ProgressInput = styled.input`
  position: absolute;
  width: 100%;
  height: 20px;
  opacity: 0;
  cursor: pointer;

  &::-webkit-slider-thumb {
    width: 12px;
    height: 12px;
  }
`;

const ControlsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const ControlButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: 50%;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
  }
`;

const PlayButton = styled(ControlButton)`
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, ${LOUNGE_COLORS.tier1}, ${LOUNGE_COLORS.tier2});
  color: #fff;

  &:hover {
    background: linear-gradient(135deg, ${LOUNGE_COLORS.tier1}, ${LOUNGE_COLORS.tier2});
    opacity: 0.9;
  }
`;

const VolumeControl = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const VolumeSlider = styled.input`
  width: 60px;
  height: 4px;
  appearance: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  cursor: pointer;

  &::-webkit-slider-thumb {
    appearance: none;
    width: 12px;
    height: 12px;
    background: #fff;
    border-radius: 50%;
    cursor: pointer;
  }

  &::-moz-range-thumb {
    width: 12px;
    height: 12px;
    background: #fff;
    border-radius: 50%;
    cursor: pointer;
    border: none;
  }
`;

const RightControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const DownloadWrapper = styled.div`
  position: relative;
`;

const DownloadMenu = styled.div`
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 0.5rem;
  background: rgba(30, 30, 35, 0.98);
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 8px;
  overflow: hidden;
  min-width: 160px;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
`;

const DownloadMenuItem = styled.a`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.75rem;
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  font-size: 0.8rem;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  &:not(:last-child) {
    border-bottom: 1px solid ${LOUNGE_COLORS.glassBorder};
  }
`;

// SoundCloud icon SVG
const SoundCloudIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.052-.1-.084-.1zm-.899 1.324c-.046 0-.086.04-.093.093l-.185 1.738.185 1.706c.007.051.047.09.093.09.046 0 .085-.039.093-.09l.21-1.706-.21-1.738c-.008-.053-.047-.093-.093-.093zm1.83-1.117c-.057 0-.102.047-.11.107l-.207 2.442.207 2.345c.008.055.053.102.11.102.054 0 .1-.047.108-.102l.235-2.345-.235-2.442c-.008-.06-.054-.107-.108-.107zm.907-.432c-.063 0-.113.053-.12.113l-.18 2.874.18 2.698c.007.06.057.112.12.112.062 0 .112-.052.12-.112l.204-2.698-.203-2.874c-.008-.06-.058-.113-.121-.113zm.912-.392c-.07 0-.126.059-.133.126l-.153 3.266.153 2.984c.007.067.063.125.133.125.068 0 .124-.058.132-.125l.174-2.984-.174-3.266c-.008-.067-.064-.126-.132-.126zm.957-.293c-.076 0-.137.066-.143.14l-.127 3.56.127 3.14c.006.073.067.138.143.138.075 0 .136-.065.143-.138l.144-3.14-.144-3.56c-.007-.074-.068-.14-.143-.14zm.973-.143c-.082 0-.148.07-.155.152l-.1 3.703.1 3.254c.007.08.073.15.155.15.08 0 .147-.07.154-.15l.114-3.254-.114-3.703c-.007-.082-.074-.152-.154-.152zm.99.012c-.088 0-.16.077-.166.166l-.074 3.525.074 3.306c.006.087.078.164.166.164.087 0 .158-.077.165-.164l.084-3.306-.084-3.525c-.007-.09-.078-.166-.165-.166zm1.004-.142c-.094 0-.17.082-.177.178l-.047 3.667.047 3.35c.007.093.083.176.177.176.093 0 .17-.083.176-.176l.053-3.35-.053-3.667c-.006-.096-.083-.178-.176-.178zm1.017.04c-.1 0-.183.088-.188.19l-.02 3.638.02 3.386c.005.1.088.19.188.19.1 0 .182-.09.188-.19l.024-3.386-.024-3.638c-.006-.102-.088-.19-.188-.19zm1.027.036c-.107 0-.194.095-.2.203l.006 3.6.007 3.416c.006.107.093.202.2.202.105 0 .192-.095.198-.202l.008-3.416-.008-3.6c-.006-.108-.093-.203-.198-.203zm1.038.06c-.113 0-.205.1-.21.214v3.542l.007 3.437c.005.112.097.212.21.212.113 0 .205-.1.21-.212l.008-3.437v-3.542c-.005-.114-.097-.214-.21-.214zm4.467 1.234c-.276 0-.534.043-.78.115l-.006-3.395c0-.126-.103-.228-.228-.228-.125 0-.227.102-.227.228v8.12c0 .11.078.204.184.225.36.072.735.11 1.12.11 2.018 0 3.653-1.624 3.653-3.626s-1.635-3.55-3.716-3.55z" />
  </svg>
);

export default AudioPlayer;
