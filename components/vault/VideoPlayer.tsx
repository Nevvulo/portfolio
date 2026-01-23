import { Maximize, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useRef, useState } from "react";
import styled from "styled-components";

interface VideoPlayerProps {
  url: string;
  poster?: string;
}

export function VideoPlayer({ url, poster }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const total = videoRef.current.duration;
    setProgress((current / total) * 100);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    videoRef.current.currentTime = percentage * videoRef.current.duration;
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Container>
      <Video
        ref={videoRef}
        src={url}
        poster={poster}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onClick={togglePlay}
        playsInline
      />

      <Controls>
        <ControlButton onClick={togglePlay}>
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </ControlButton>

        <ProgressContainer onClick={handleSeek}>
          <ProgressBar style={{ width: `${progress}%` }} />
        </ProgressContainer>

        <TimeDisplay>
          {videoRef.current ? formatTime(videoRef.current.currentTime) : "0:00"} /{" "}
          {formatTime(duration)}
        </TimeDisplay>

        <ControlButton onClick={toggleMute}>
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </ControlButton>

        <ControlButton onClick={handleFullscreen}>
          <Maximize size={20} />
        </ControlButton>
      </Controls>
    </Container>
  );
}

const Container = styled.div`
  position: relative;
  width: 100%;
  background: black;

  &:hover > div:last-child {
    opacity: 1;
  }
`;

const Video = styled.video`
  width: 100%;
  height: auto;
  max-height: 70vh;
  display: block;
  cursor: pointer;
`;

const Controls = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  opacity: 0;
  transition: opacity 0.2s;
`;

const ControlButton = styled.button`
  padding: 8px;
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  opacity: 0.9;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
`;

const ProgressContainer = styled.div`
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  cursor: pointer;
  position: relative;

  &:hover {
    height: 6px;
  }
`;

const ProgressBar = styled.div`
  height: 100%;
  background: #9074f2;
  border-radius: 2px;
  transition: width 0.1s linear;
`;

const TimeDisplay = styled.span`
  font-size: 12px;
  color: white;
  opacity: 0.8;
  min-width: 80px;
  text-align: center;
`;
