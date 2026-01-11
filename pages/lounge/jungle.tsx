import { useAction, useMutation, useQuery } from "convex/react";
import { AnimatePresence, m } from "framer-motion";
import {
  Crown,
  ListMusic,
  Lock,
  LogOut,
  Mic,
  MicOff,
  Music2,
  Pause,
  Play,
  Radio,
  Settings,
  SkipForward,
  Trash2,
  TreePalm,
  Users,
  Volume2,
  VolumeX,
  X,
  Youtube,
} from "lucide-react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import YouTube, { type YouTubeEvent, type YouTubePlayer } from "react-youtube";
import styled from "styled-components";
import { LoungeLayout } from "../../components/lounge/layout/LoungeLayout";
import { LOUNGE_COLORS, TIER_INFO } from "../../constants/lounge";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useTierAccess } from "../../hooks/lounge/useTierAccess";
import { useLiveKitContext } from "../../lib/lounge/LiveKitContext";
import type { Tier } from "../../types/lounge";

export const getServerSideProps = () => ({ props: {} });

interface JungleUser {
  _id: Id<"users">;
  displayName: string;
  avatarUrl?: string;
  tier: Tier;
  joinedAt: number;
}

interface QueueTrack {
  id: string;
  youtubeId: string;
  title: string;
  artist?: string;
  duration: number;
  addedBy: string;
}

interface JungleState {
  mode: "youtube" | "live" | "idle";
  currentTrack?: {
    youtubeId: string;
    title: string;
    artist?: string;
    duration: number;
    startedAt: number;
    addedBy: string;
  } | null;
  listeners: JungleUser[];
  queue: QueueTrack[];
  isPlaying: boolean;
  liveStreamTitle?: string;
  liveStreamStartedAt?: number;
}

// Mulberry32 seeded PRNG - deterministic and high quality
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Generate deterministic waypoints for smooth avatar movement
function generateWaypoints(seed: number, count: number = 6): { x: number; y: number }[] {
  const rng = mulberry32(seed);
  const waypoints: { x: number; y: number }[] = [];

  const minX = 12;
  const maxX = 88;
  const minY = 45;
  const maxY = 82;

  for (let i = 0; i < count; i++) {
    waypoints.push({
      x: minX + rng() * (maxX - minX),
      y: minY + rng() * (maxY - minY),
    });
  }

  const firstWaypoint = waypoints[0];
  if (firstWaypoint) {
    waypoints.push(firstWaypoint);
  }

  return waypoints;
}

function getAvatarAnimation(joinTime: number) {
  const seed = Math.floor(joinTime / 1000);
  const rng = mulberry32(seed);
  const waypoints = generateWaypoints(seed);
  const duration = 45 + rng() * 30;
  const xPositions = waypoints.map((w) => w.x);
  const yPositions = waypoints.map((w) => w.y);
  const firstX = waypoints[0]?.x ?? 50;
  const firstY = waypoints[0]?.y ?? 60;

  return { xPositions, yPositions, duration, initialX: firstX, initialY: firstY };
}

// Extract YouTube video ID from URL
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?\s]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

// Format duration from milliseconds to human-readable string
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  } else {
    return "just now";
  }
}

// Format session time remaining (mm:ss)
function formatSessionTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function JunglePage() {
  const [mounted, setMounted] = useState(false);
  const [userReady, setUserReady] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(50);
  const [showControls, setShowControls] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showModePanel, setShowModePanel] = useState(false);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [isAddingVideo, setIsAddingVideo] = useState(false);
  const [liveStreamTitle, setLiveStreamTitle] = useState("Live Audio");
  const playerRef = useRef<YouTubePlayer | null>(null);

  // Global LiveKit provider (persistent across navigation)
  const liveKit = useLiveKitContext();

  // Auto-disconnect when session expires
  useEffect(() => {
    if (liveKit.timeRemaining === 0 && liveKit.isConnected) {
      liveKit.disconnect(true);
    }
  }, [liveKit, liveKit.timeRemaining, liveKit.isConnected, liveKit.disconnect]);
  const router = useRouter();
  const { isLoading, user, displayName, avatarUrl, isFreeUser, isCreator } = useTierAccess();

  const getOrCreateUser = useAction(api.users.getOrCreateUser);
  const joinJungle = useMutation(api.jungle.join);
  const leaveJungle = useMutation(api.jungle.leave);
  const heartbeat = useMutation(api.jungle.heartbeat);
  const addToQueue = useMutation(api.jungle.addToQueue);
  const setPlaying = useMutation(api.jungle.setPlaying);
  const skipTrack = useMutation(api.jungle.skipTrack);
  const removeFromQueue = useMutation(api.jungle.removeFromQueue);
  const onTrackEnd = useMutation(api.jungle.onTrackEnd);
  const startLiveStream = useMutation(api.jungle.startLiveStream);
  const stopLiveStream = useMutation(api.jungle.stopLiveStream);
  // setIdle is available via api.jungle.setIdle if needed

  const jungleState = useQuery(api.jungle.getState, userReady && !isFreeUser ? {} : "skip") as
    | JungleState
    | null
    | undefined;

  // Register callbacks for mini player controls (using refs to avoid re-renders)
  useEffect(() => {
    liveKit.callbacksRef.current.onDisconnect = () => {
      liveKit.disconnect(true);
      leaveJungle().catch(console.error);
    };
    liveKit.callbacksRef.current.onSetMuted = liveKit.setMuted;
    liveKit.callbacksRef.current.onSetVolume = liveKit.setVolume;

    return () => {
      liveKit.callbacksRef.current.onDisconnect = null;
      liveKit.callbacksRef.current.onSetMuted = null;
      liveKit.callbacksRef.current.onSetVolume = null;
    };
  }, [
    liveKit,
    liveKit.disconnect,
    liveKit.setMuted,
    liveKit.setVolume,
    leaveJungle,
    liveKit.callbacksRef,
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // SECURITY: Server fetches verified discordId and tier from Clerk
  useEffect(() => {
    if (!mounted || isLoading || !user || userReady) return;

    getOrCreateUser({
      displayName: displayName || "Anonymous",
      avatarUrl: avatarUrl,
    })
      .then(() => setUserReady(true))
      .catch(() => setUserReady(true));
  }, [mounted, isLoading, user, displayName, avatarUrl, userReady, getOrCreateUser]);

  useEffect(() => {
    if (!userReady || isFreeUser) return;

    joinJungle().catch(console.error);
    const heartbeatInterval = setInterval(() => {
      heartbeat().catch(console.error);
    }, 30 * 1000);

    return () => {
      clearInterval(heartbeatInterval);
      leaveJungle().catch(console.error);
    };
  }, [userReady, isFreeUser, joinJungle, leaveJungle, heartbeat]);

  // Sync playback state with YouTube player
  useEffect(() => {
    if (!playerRef.current || !jungleState) return;

    try {
      if (jungleState.isPlaying && jungleState.currentTrack) {
        // Calculate where we should be in the video
        const elapsed = (Date.now() - jungleState.currentTrack.startedAt) / 1000;
        const currentTime = playerRef.current.getCurrentTime?.() || 0;

        // Only seek if we're more than 3 seconds out of sync
        if (Math.abs(currentTime - elapsed) > 3) {
          playerRef.current.seekTo(elapsed, true);
        }
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    } catch {
      // Player not ready
    }
  }, [jungleState?.isPlaying, jungleState?.currentTrack?.startedAt]);

  // Handle volume changes
  useEffect(() => {
    if (playerRef.current) {
      try {
        playerRef.current.setVolume(isMuted ? 0 : volume);
      } catch {
        // Player not ready
      }
    }
  }, [isMuted, volume]);

  const handlePlayerReady = useCallback(
    (event: YouTubeEvent) => {
      playerRef.current = event.target;
      event.target.setVolume(isMuted ? 0 : volume);

      // Sync to current position
      if (jungleState?.currentTrack && jungleState.isPlaying) {
        const elapsed = (Date.now() - jungleState.currentTrack.startedAt) / 1000;
        event.target.seekTo(elapsed, true);
        event.target.playVideo();
      }
    },
    [isMuted, volume, jungleState],
  );

  const handlePlayerEnd = useCallback(() => {
    onTrackEnd().catch(console.error);
  }, [onTrackEnd]);

  const handleAddVideo = async () => {
    const youtubeId = extractYouTubeId(newVideoUrl);
    if (!youtubeId) {
      alert("Invalid YouTube URL");
      return;
    }

    setIsAddingVideo(true);
    try {
      await addToQueue({
        youtubeId,
        title: newVideoTitle || "Untitled",
        duration: 0, // We could fetch this from YouTube API
      });
      setNewVideoUrl("");
      setNewVideoTitle("");
      setShowControls(false);
    } catch (error) {
      console.error("Failed to add video:", error);
    } finally {
      setIsAddingVideo(false);
    }
  };

  const toggleMute = useCallback(() => setIsMuted((prev) => !prev), []);

  // Load audio devices when creator opens mode panel
  useEffect(() => {
    if (isCreator && showModePanel && liveKit.audioDevices.length === 0) {
      liveKit.loadAudioDevices();
    }
  }, [isCreator, showModePanel, liveKit]);

  // Listeners auto-connect when mode is "live" (creator connects manually via handleStartLiveStream)
  const dbMode = jungleState?.mode;
  const prevDbModeRef = useRef(dbMode);

  useEffect(() => {
    // Only run when dbMode actually changes, not on every render
    if (prevDbModeRef.current === dbMode) return;
    prevDbModeRef.current = dbMode;

    if (!userReady || isFreeUser || !user?.id) return;

    if (dbMode === "live") {
      // Only listeners auto-connect - creator connects manually when clicking "Go Live"
      if (!isCreator) {
        liveKit.connectAsListener(user.id, displayName || "Anonymous");
      }
    } else {
      // Disconnect listeners from LiveKit when not in live mode
      // Creator handles their own disconnect via handleStopLiveStream
      if (!isCreator && liveKit.isConnected) {
        liveKit.disconnect();
      }
    }
  });

  // Handle live volume/mute
  useEffect(() => {
    if (jungleState?.mode === "live" && liveKit.isReceiving) {
      liveKit.setVolume(isMuted ? 0 : volume / 100);
      liveKit.setMuted(isMuted);
    }
  }, [isMuted, volume, jungleState?.mode, liveKit]);

  // Handle starting live stream
  const handleStartLiveStream = async () => {
    if (!user) return;

    try {
      // First, connect to LiveKit and start publishing (this prompts for audio source)
      await liveKit.connectAsPublisher(
        user.id,
        displayName || "Creator",
        liveKit.selectedDevice || undefined,
        liveKit.audioSource,
      );

      // Only update DB after successfully connected
      await startLiveStream({ title: liveStreamTitle });
      setShowModePanel(false);
    } catch (error) {
      console.error("Failed to start live stream:", error);
      // If LiveKit connection failed, don't leave it in a bad state
      liveKit.disconnect();
    }
  };

  // Handle stopping live stream
  const handleStopLiveStream = async () => {
    try {
      liveKit.stopPublishing();
      await stopLiveStream();
    } catch (error) {
      console.error("Failed to stop live stream:", error);
    }
  };

  // Handle leaving the jungle
  const handleLeaveJungle = async () => {
    try {
      if (liveKit.isConnected) {
        liveKit.disconnect();
      }
      await leaveJungle();
      router.push("/lounge");
    } catch (error) {
      console.error("Failed to leave jungle:", error);
    }
  };

  // Handle switching to YouTube mode
  const handleSwitchToYouTube = async () => {
    if (liveKit.isPublishing) {
      await liveKit.stopPublishing();
    }
    if (liveKit.isConnected) {
      liveKit.disconnect();
    }
    setShowModePanel(false);
  };

  // Free tier locked state
  if (!isLoading && isFreeUser) {
    return (
      <>
        <Head>
          <title>The Jungle | nevulounge</title>
        </Head>
        <LoungeLayout channelName="The Jungle" customIcon={TreePalm}>
          <LockedContainer>
            <LockedContent>
              <Lock size={48} />
              <LockedTitle>The Jungle is for Supporters</LockedTitle>
              <LockedText>
                Become a Super Legend to hang out in The Jungle with other supporters, listen to
                shared music, and vibe together!
              </LockedText>
              <UpgradeButton href="/support">
                <Crown size={16} />
                Become a Super Legend
              </UpgradeButton>
            </LockedContent>
          </LockedContainer>
        </LoungeLayout>
      </>
    );
  }

  if (isLoading || !userReady) {
    return (
      <LoungeLayout channelName="The Jungle" customIcon={TreePalm}>
        <LoadingContainer>
          <LoadingText>entering the jungle</LoadingText>
        </LoadingContainer>
      </LoungeLayout>
    );
  }

  const listeners = jungleState?.listeners ?? [];
  const currentTrack = jungleState?.currentTrack;
  const queue = jungleState?.queue ?? [];
  const isPlaying = jungleState?.isPlaying ?? false;
  const mode = jungleState?.mode ?? "idle";
  const streamTitle = jungleState?.liveStreamTitle;
  const streamStartedAt = jungleState?.liveStreamStartedAt;

  return (
    <>
      <Head>
        <title>The Jungle | nevulounge</title>
      </Head>
      <LoungeLayout channelName="The Jungle" customIcon={TreePalm}>
        <JungleContainer>
          <StageWrapper>
            <Stage>
              {/* Background */}
              <StageBackground>
                <TreeLeft>
                  <TreePalm size={80} />
                </TreeLeft>
                <TreeRight>
                  <TreePalm size={80} />
                </TreeRight>
                <StageLights>
                  <Light $color={LOUNGE_COLORS.tier1} $delay={0} />
                  <Light $color={LOUNGE_COLORS.tier2} $delay={0.5} />
                  <Light $color="#22c55e" $delay={1} />
                </StageLights>
              </StageBackground>

              {/* YouTube Player (hidden visually, audio only) */}
              {mode === "youtube" && currentTrack && (
                <YouTubeWrapper>
                  <YouTube
                    videoId={currentTrack.youtubeId}
                    opts={{
                      height: "1",
                      width: "1",
                      playerVars: {
                        autoplay: 1,
                        controls: 0,
                        disablekb: 1,
                        fs: 0,
                        modestbranding: 1,
                        rel: 0,
                      },
                    }}
                    onReady={handlePlayerReady}
                    onEnd={handlePlayerEnd}
                  />
                </YouTubeWrapper>
              )}

              {/* DJ Booth / Now Playing */}
              <DJBooth $isLive={mode === "live"}>
                {mode === "live" ? (
                  <>
                    <LiveIndicator>
                      <Radio size={24} />
                      <LiveDot />
                    </LiveIndicator>
                    <NowPlaying>
                      <NowPlayingLabel>LIVE AUDIO</NowPlayingLabel>
                      <TrackTitle>{streamTitle || "Live Stream"}</TrackTitle>
                      {streamStartedAt && (
                        <TrackArtist>
                          Started {formatDuration(Date.now() - streamStartedAt)}
                        </TrackArtist>
                      )}
                      {liveKit.isReceiving && <LiveStatus>Connected</LiveStatus>}
                      {!liveKit.isReceiving && !isCreator && liveKit.isConnected && (
                        <LiveStatus>Connecting...</LiveStatus>
                      )}
                    </NowPlaying>
                  </>
                ) : (
                  <>
                    <Music2 size={32} />
                    {currentTrack ? (
                      <NowPlaying>
                        <NowPlayingLabel>{isPlaying ? "NOW PLAYING" : "PAUSED"}</NowPlayingLabel>
                        <TrackTitle>{currentTrack.title}</TrackTitle>
                        {currentTrack.artist && <TrackArtist>{currentTrack.artist}</TrackArtist>}
                      </NowPlaying>
                    ) : (
                      <NowPlaying>
                        <NowPlayingLabel>NO MUSIC</NowPlayingLabel>
                        <TrackTitle>Waiting for tracks...</TrackTitle>
                      </NowPlaying>
                    )}
                  </>
                )}
              </DJBooth>

              {/* Avatars */}
              <AvatarsContainer>
                <AnimatePresence mode="popLayout">
                  {listeners.map((listener) => {
                    const anim = getAvatarAnimation(listener.joinedAt);
                    return (
                      <AvatarWrapper
                        key={listener._id}
                        initial={{
                          opacity: 0,
                          scale: 0,
                          left: `${anim.initialX}%`,
                          top: `${anim.initialY}%`,
                        }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                          left: anim.xPositions.map((x) => `${x}%`),
                          top: anim.yPositions.map((y) => `${y}%`),
                        }}
                        exit={{ opacity: 0, scale: 0, transition: { duration: 0.3 } }}
                        transition={{
                          opacity: { duration: 0.5, ease: "easeOut" },
                          scale: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] },
                          left: {
                            duration: anim.duration,
                            repeat: Infinity,
                            ease: "easeInOut",
                            times: anim.xPositions.map((_, i) => i / (anim.xPositions.length - 1)),
                          },
                          top: {
                            duration: anim.duration,
                            repeat: Infinity,
                            ease: "easeInOut",
                            times: anim.yPositions.map((_, i) => i / (anim.yPositions.length - 1)),
                          },
                        }}
                      >
                        <StageAvatar
                          src={listener.avatarUrl || "/default-avatar.png"}
                          alt={listener.displayName}
                          $tier={listener.tier}
                        />
                        <AvatarName $tier={listener.tier}>{listener.displayName}</AvatarName>
                      </AvatarWrapper>
                    );
                  })}
                </AnimatePresence>
              </AvatarsContainer>

              {/* Empty state */}
              {listeners.length === 0 && (
                <EmptyStage>
                  <Users size={48} />
                  <EmptyText>No one's here yet</EmptyText>
                  <EmptySubtext>You're the first!</EmptySubtext>
                </EmptyStage>
              )}
            </Stage>
          </StageWrapper>

          {/* Controls Bar */}
          <ControlsBar>
            <ListenerCount>
              <Users size={16} />
              <span>
                {listeners.length} {listeners.length === 1 ? "listener" : "listeners"}
              </span>
              {/* Session timer for live audio */}
              {mode === "live" && liveKit.isConnected && liveKit.timeRemaining !== null && (
                <SessionTimer $isLow={liveKit.timeRemaining < 5 * 60 * 1000}>
                  {formatSessionTime(liveKit.timeRemaining)} left
                </SessionTimer>
              )}
              {/* Cooldown indicator */}
              {liveKit.isOnCooldown && liveKit.cooldownUntil && (
                <CooldownBadge>
                  Reconnect in {Math.ceil((liveKit.cooldownUntil - Date.now()) / 1000)}s
                </CooldownBadge>
              )}
            </ListenerCount>

            <AudioControls>
              <ControlButton onClick={toggleMute} title={isMuted ? "Unmute" : "Mute"}>
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </ControlButton>
              {!isMuted && (
                <VolumeSlider
                  type="range"
                  min={0}
                  max={100}
                  value={volume}
                  onChange={(e) => setVolume(parseInt(e.target.value))}
                />
              )}

              {/* Creator Controls */}
              {isCreator && (
                <>
                  <Divider />

                  {/* Mode indicator and controls */}
                  {mode === "live" ? (
                    <>
                      <LiveModeIndicator>
                        <Radio size={14} />
                        <LiveDotSmall />
                        LIVE
                      </LiveModeIndicator>
                      <ControlButton onClick={handleStopLiveStream} title="Stop Streaming" $danger>
                        <MicOff size={20} />
                      </ControlButton>
                    </>
                  ) : (
                    <>
                      {currentTrack && (
                        <>
                          <ControlButton
                            onClick={() => setPlaying({ isPlaying: !isPlaying })}
                            title={isPlaying ? "Pause" : "Play"}
                          >
                            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                          </ControlButton>
                          <ControlButton onClick={() => skipTrack()} title="Skip">
                            <SkipForward size={20} />
                          </ControlButton>
                        </>
                      )}
                      <ControlButton
                        onClick={() => setShowQueue(!showQueue)}
                        title="Queue"
                        $active={showQueue}
                      >
                        <ListMusic size={20} />
                        {queue.length > 0 && <QueueBadge>{queue.length}</QueueBadge>}
                      </ControlButton>
                      <ControlButton
                        onClick={() => setShowControls(!showControls)}
                        title="Add YouTube"
                        $active={showControls}
                      >
                        <Youtube size={20} />
                      </ControlButton>
                    </>
                  )}

                  {/* Mode switcher */}
                  <ControlButton
                    onClick={() => setShowModePanel(!showModePanel)}
                    title="Streaming Mode"
                    $active={showModePanel}
                  >
                    <Settings size={20} />
                  </ControlButton>
                </>
              )}

              {/* Leave Button */}
              <Divider />
              <ControlButton onClick={handleLeaveJungle} title="Leave Jungle" $danger>
                <LogOut size={20} />
              </ControlButton>
            </AudioControls>
          </ControlsBar>

          {/* Creator Add Track Panel */}
          <AnimatePresence>
            {isCreator && showControls && (
              <CreatorPanel
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <PanelHeader>
                  <PanelTitle>Add YouTube Video</PanelTitle>
                  <CloseButton onClick={() => setShowControls(false)}>
                    <X size={16} />
                  </CloseButton>
                </PanelHeader>
                <InputGroup>
                  <Input
                    type="text"
                    placeholder="YouTube URL or Video ID"
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                  />
                  <Input
                    type="text"
                    placeholder="Title (optional)"
                    value={newVideoTitle}
                    onChange={(e) => setNewVideoTitle(e.target.value)}
                  />
                  <AddButton onClick={handleAddVideo} disabled={!newVideoUrl || isAddingVideo}>
                    {isAddingVideo ? "Adding..." : "Add to Queue"}
                  </AddButton>
                </InputGroup>
              </CreatorPanel>
            )}
          </AnimatePresence>

          {/* Queue Panel */}
          <AnimatePresence>
            {isCreator && showQueue && (
              <QueuePanel
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <PanelHeader>
                  <PanelTitle>Queue ({queue.length})</PanelTitle>
                  <CloseButton onClick={() => setShowQueue(false)}>
                    <X size={16} />
                  </CloseButton>
                </PanelHeader>
                {queue.length === 0 ? (
                  <EmptyQueue>No tracks in queue</EmptyQueue>
                ) : (
                  <QueueList>
                    {queue.map((track, index) => (
                      <QueueItem key={track.id}>
                        <QueueIndex>{index + 1}</QueueIndex>
                        <QueueInfo>
                          <QueueTrackTitle>{track.title}</QueueTrackTitle>
                          <QueueAddedBy>Added by {track.addedBy}</QueueAddedBy>
                        </QueueInfo>
                        <RemoveButton onClick={() => removeFromQueue({ trackId: track.id })}>
                          <Trash2 size={14} />
                        </RemoveButton>
                      </QueueItem>
                    ))}
                  </QueueList>
                )}
              </QueuePanel>
            )}
          </AnimatePresence>

          {/* Mode Panel (Creator Only) */}
          <AnimatePresence>
            {isCreator && showModePanel && (
              <ModePanel
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <PanelHeader>
                  <PanelTitle>Streaming Mode</PanelTitle>
                  <CloseButton onClick={() => setShowModePanel(false)}>
                    <X size={16} />
                  </CloseButton>
                </PanelHeader>

                <ModeOptions>
                  {/* Live Audio Option */}
                  <ModeOption $active={mode === "live"}>
                    <ModeOptionHeader>
                      <ModeOptionIcon $active={mode === "live"}>
                        <Mic size={20} />
                      </ModeOptionIcon>
                      <ModeOptionInfo>
                        <ModeOptionTitle>Live Audio</ModeOptionTitle>
                        <ModeOptionDesc>Stream audio from your device in real-time</ModeOptionDesc>
                      </ModeOptionInfo>
                    </ModeOptionHeader>

                    {mode !== "live" && (
                      <ModeOptionContent>
                        <Label>Stream Title</Label>
                        <Input
                          type="text"
                          placeholder="My Live Set"
                          value={liveStreamTitle}
                          onChange={(e) => setLiveStreamTitle(e.target.value)}
                        />

                        <Label>Audio Source</Label>
                        <SourceToggle>
                          <SourceOption
                            $active={liveKit.audioSource === "tab"}
                            onClick={() => liveKit.setAudioSource("tab")}
                          >
                            Tab Audio
                          </SourceOption>
                          <SourceOption
                            $active={liveKit.audioSource === "microphone"}
                            onClick={() => liveKit.setAudioSource("microphone")}
                          >
                            Microphone
                          </SourceOption>
                        </SourceToggle>

                        {liveKit.audioSource === "microphone" && (
                          <>
                            <Label>Audio Input Device</Label>
                            <Select
                              value={liveKit.selectedDevice || ""}
                              onChange={(e) => liveKit.setSelectedDevice(e.target.value)}
                            >
                              {liveKit.audioDevices.length === 0 ? (
                                <option value="">Loading devices...</option>
                              ) : (
                                liveKit.audioDevices.map((device) => (
                                  <option key={device.deviceId} value={device.deviceId}>
                                    {device.isVirtual ? "🔊 " : "🎤 "}
                                    {device.label}
                                    {device.isVirtual ? " (Virtual)" : ""}
                                  </option>
                                ))
                              )}
                            </Select>
                            {liveKit.audioDevices.some((d) => d.isVirtual) && (
                              <SourceHint>
                                Virtual audio devices (like BlackHole) let you stream system audio.
                                Route your audio output to the virtual device to stream it.
                              </SourceHint>
                            )}
                          </>
                        )}

                        {liveKit.audioSource === "tab" && (
                          <SourceHint>
                            Select a Chrome tab to stream its audio. The tab content won't be shared
                            - only the audio. Make sure to check "Share tab audio" in the picker.
                          </SourceHint>
                        )}

                        <GoLiveButton onClick={handleStartLiveStream}>
                          <Mic size={16} />
                          Go Live
                        </GoLiveButton>
                      </ModeOptionContent>
                    )}

                    {mode === "live" && (
                      <ModeOptionContent>
                        <LiveStatusBox>
                          <LiveDot />
                          <span>Currently streaming: {streamTitle}</span>
                        </LiveStatusBox>

                        {/* Debug controls */}
                        <DebugSection>
                          <DebugTitle>Debug Controls</DebugTitle>
                          <DebugRow>
                            <DebugLabel>Status:</DebugLabel>
                            <DebugValue>
                              {liveKit.isConnected ? "Connected" : "Disconnected"} |{" "}
                              {liveKit.isPublishing ? "Publishing" : "Not Publishing"}
                            </DebugValue>
                          </DebugRow>
                          <DebugButton
                            onClick={() => liveKit.testLoopback(!liveKit.isLoopbackActive)}
                            $active={liveKit.isLoopbackActive}
                          >
                            {liveKit.isLoopbackActive
                              ? "Stop Loopback"
                              : "Test Loopback (hear yourself)"}
                          </DebugButton>
                          <DebugButton
                            onClick={() => console.log("[LiveKit Debug]", liveKit.getDebugInfo())}
                          >
                            Log Debug Info to Console
                          </DebugButton>
                        </DebugSection>

                        <StopButton onClick={handleStopLiveStream}>
                          <MicOff size={16} />
                          Stop Streaming
                        </StopButton>
                      </ModeOptionContent>
                    )}
                  </ModeOption>

                  {/* YouTube Option */}
                  <ModeOption $active={mode === "youtube" || mode === "idle"}>
                    <ModeOptionHeader>
                      <ModeOptionIcon $active={mode === "youtube"}>
                        <Youtube size={20} />
                      </ModeOptionIcon>
                      <ModeOptionInfo>
                        <ModeOptionTitle>YouTube Queue</ModeOptionTitle>
                        <ModeOptionDesc>Play YouTube videos with synced playback</ModeOptionDesc>
                      </ModeOptionInfo>
                    </ModeOptionHeader>

                    {mode === "live" && (
                      <ModeOptionContent>
                        <SwitchModeButton onClick={handleSwitchToYouTube}>
                          <Youtube size={16} />
                          Switch to YouTube
                        </SwitchModeButton>
                      </ModeOptionContent>
                    )}

                    {mode !== "live" && (
                      <ModeOptionContent>
                        <ModeActiveText>
                          {currentTrack
                            ? `Now playing: ${currentTrack.title}`
                            : "Add tracks using the YouTube button"}
                        </ModeActiveText>
                      </ModeOptionContent>
                    )}
                  </ModeOption>
                </ModeOptions>

                {liveKit.error && <ErrorBox>{liveKit.error}</ErrorBox>}
              </ModePanel>
            )}
          </AnimatePresence>

          {/* Info */}
          <InfoSection>
            <InfoTitle>Welcome to The Jungle</InfoTitle>
            <InfoText>
              Hang out with other supporters! Your avatar wanders the stage.
              {isCreator
                ? " As the creator, you can stream live audio or play YouTube videos."
                : mode === "live"
                  ? " Currently streaming live audio."
                  : " Music plays in sync for everyone."}
            </InfoText>
          </InfoSection>
        </JungleContainer>
      </LoungeLayout>
    </>
  );
}

// Styled Components
const JungleContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: linear-gradient(180deg, #0d1117 0%, #161b22 100%);
  overflow-y: auto;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
`;

const LoadingText = styled.p`
  color: rgba(255, 255, 255, 0.5);
  font-family: var(--font-display);
  font-size: 1rem;
`;

const LockedContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
`;

const LockedContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 400px;
  padding: 2rem;
  background: ${LOUNGE_COLORS.glassBackground};
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 16px;
  color: rgba(255, 255, 255, 0.5);
`;

const LockedTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: #fff;
  margin: 1rem 0 0.5rem;
`;

const LockedText = styled.p`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 1.5rem;
  line-height: 1.5;
`;

const UpgradeButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, ${LOUNGE_COLORS.tier1}, ${LOUNGE_COLORS.tier2});
  color: #fff;
  font-weight: 600;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(144, 116, 242, 0.4);
  }
`;

const StageWrapper = styled.div`
  flex: 1;
  min-height: 350px;
  padding: 1rem;
`;

const Stage = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 300px;
  background: linear-gradient(
    180deg,
    rgba(16, 13, 27, 0.9) 0%,
    rgba(30, 25, 50, 0.9) 50%,
    rgba(20, 17, 35, 0.95) 100%
  );
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 16px;
  overflow: hidden;
`;

const StageBackground = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
`;

const TreeLeft = styled.div`
  position: absolute;
  left: 2%;
  bottom: 10%;
  color: rgba(34, 197, 94, 0.3);
  transform: scaleX(-1);
`;

const TreeRight = styled.div`
  position: absolute;
  right: 2%;
  bottom: 10%;
  color: rgba(34, 197, 94, 0.3);
`;

const StageLights = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200px;
  display: flex;
  justify-content: center;
  gap: 20%;
  pointer-events: none;
`;

const Light = styled.div<{ $color: string; $delay: number }>`
  width: 60px;
  height: 200px;
  background: linear-gradient(180deg, ${(props) => props.$color}40 0%, transparent 100%);
  clip-path: polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%);
  animation: lightPulse 3s ease-in-out infinite;
  animation-delay: ${(props) => props.$delay}s;

  @keyframes lightPulse {
    0%,
    100% {
      opacity: 0.3;
    }
    50% {
      opacity: 0.6;
    }
  }
`;

const YouTubeWrapper = styled.div`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
`;

const DJBooth = styled.div<{ $isLive?: boolean }>`
  position: absolute;
  top: 12%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem 2rem;
  background: ${(props) => (props.$isLive ? "rgba(239, 68, 68, 0.2)" : "rgba(0, 0, 0, 0.6)")};
  border: 1px solid ${(props) =>
    props.$isLive ? "rgba(239, 68, 68, 0.5)" : LOUNGE_COLORS.glassBorder};
  border-radius: 12px;
  color: ${(props) => (props.$isLive ? "#ef4444" : LOUNGE_COLORS.tier1)};
  backdrop-filter: blur(8px);
  transition: all 0.3s ease;
`;

const NowPlaying = styled.div`
  margin-top: 0.5rem;
  text-align: center;
`;

const NowPlayingLabel = styled.div`
  font-size: 0.6rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 1px;
  margin-bottom: 0.25rem;
`;

const TrackTitle = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  color: #fff;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TrackArtist = styled.div`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
`;

const AvatarsContainer = styled.div`
  position: absolute;
  inset: 0;
`;

const AvatarWrapper = styled(m.div)`
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translate(-50%, -100%);
  z-index: 10;
  will-change: left, top;
  pointer-events: none;
`;

const StageAvatar = styled.img<{ $tier: Tier }>`
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 3px solid ${(props) => TIER_INFO[props.$tier]?.color || "#9CA3AF"};
  background: ${LOUNGE_COLORS.glassBorder};
  object-fit: cover;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4),
    0 0 20px ${(props) => TIER_INFO[props.$tier]?.color || "#9CA3AF"}33;
`;

const AvatarName = styled.div<{ $tier: Tier }>`
  margin-top: 4px;
  padding: 2px 8px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 500;
  color: ${(props) => TIER_INFO[props.$tier]?.color || "#9CA3AF"};
  white-space: nowrap;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const EmptyStage = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  color: rgba(255, 255, 255, 0.3);
`;

const EmptyText = styled.div`
  font-size: 1rem;
  font-weight: 600;
  margin-top: 1rem;
  color: rgba(255, 255, 255, 0.5);
`;

const EmptySubtext = styled.div`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.3);
  margin-top: 0.25rem;
`;

const ControlsBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: ${LOUNGE_COLORS.glassBackground};
  border-top: 1px solid ${LOUNGE_COLORS.glassBorder};
`;

const ListenerCount = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
`;

const AudioControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ControlButton = styled.button<{ $active?: boolean; $danger?: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  background: ${(props) =>
    props.$danger
      ? "rgba(239, 68, 68, 0.2)"
      : props.$active
        ? "rgba(144, 116, 242, 0.2)"
        : "rgba(255, 255, 255, 0.1)"};
  border: none;
  border-radius: 6px;
  color: ${(props) => (props.$danger ? "#ef4444" : props.$active ? LOUNGE_COLORS.tier1 : "#fff")};
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: ${(props) =>
      props.$danger ? "rgba(239, 68, 68, 0.3)" : "rgba(255, 255, 255, 0.2)"};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const QueueBadge = styled.span`
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: ${LOUNGE_COLORS.tier1};
  border-radius: 8px;
  font-size: 0.65rem;
  font-weight: 700;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Divider = styled.div`
  width: 1px;
  height: 24px;
  background: rgba(255, 255, 255, 0.2);
  margin: 0 0.25rem;
`;

const VolumeSlider = styled.input`
  width: 80px;
  height: 4px;
  appearance: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  cursor: pointer;

  &::-webkit-slider-thumb {
    appearance: none;
    width: 12px;
    height: 12px;
    background: ${LOUNGE_COLORS.tier1};
    border-radius: 50%;
    cursor: pointer;
  }
`;

const CreatorPanel = styled(m.div)`
  background: ${LOUNGE_COLORS.glassBackground};
  border-top: 1px solid ${LOUNGE_COLORS.glassBorder};
  padding: 1rem;
`;

const QueuePanel = styled(m.div)`
  background: ${LOUNGE_COLORS.glassBackground};
  border-top: 1px solid ${LOUNGE_COLORS.glassBorder};
  padding: 1rem;
  max-height: 300px;
  overflow-y: auto;
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

const PanelTitle = styled.h3`
  font-size: 0.9rem;
  font-weight: 600;
  color: #fff;
  margin: 0;
`;

const CloseButton = styled.button`
  padding: 4px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;

  &:hover {
    color: #fff;
  }
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Input = styled.input`
  padding: 0.5rem 0.75rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 6px;
  color: #fff;
  font-size: 0.85rem;

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }

  &:focus {
    outline: none;
    border-color: ${LOUNGE_COLORS.tier1};
  }
`;

const AddButton = styled.button`
  padding: 0.5rem 1rem;
  background: ${LOUNGE_COLORS.tier1};
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;

  &:hover:not(:disabled) {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyQueue = styled.p`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.4);
  text-align: center;
  margin: 1rem 0;
`;

const QueueList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
`;

const QueueItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
`;

const QueueIndex = styled.span`
  width: 20px;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
  text-align: center;
`;

const QueueInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const QueueTrackTitle = styled.div`
  font-size: 0.85rem;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const QueueAddedBy = styled.div`
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.4);
`;

const RemoveButton = styled.button`
  padding: 4px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: color 0.15s;

  &:hover {
    color: #ef4444;
  }
`;

const InfoSection = styled.div`
  padding: 1rem;
  border-top: 1px solid ${LOUNGE_COLORS.glassBorder};
`;

const InfoTitle = styled.h3`
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 0.5rem;
`;

const InfoText = styled.p`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
  line-height: 1.5;
`;

// Live Audio Components
const LiveIndicator = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LiveDot = styled.div`
  position: absolute;
  top: -2px;
  right: -2px;
  width: 10px;
  height: 10px;
  background: #ef4444;
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(1.2);
    }
  }
`;

const LiveDotSmall = styled(LiveDot)`
  position: relative;
  top: auto;
  right: auto;
  width: 8px;
  height: 8px;
  margin-left: 4px;
`;

const LiveStatus = styled.div`
  font-size: 0.65rem;
  color: #22c55e;
  margin-top: 0.25rem;
`;

const LiveModeIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 700;
  color: #ef4444;
  letter-spacing: 0.5px;
`;

// Mode Panel Components
const ModePanel = styled(m.div)`
  background: ${LOUNGE_COLORS.glassBackground};
  border-top: 1px solid ${LOUNGE_COLORS.glassBorder};
  padding: 1rem;
  max-height: 400px;
  overflow-y: auto;
`;

const ModeOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ModeOption = styled.div<{ $active?: boolean }>`
  padding: 1rem;
  background: ${(props) => (props.$active ? "rgba(144, 116, 242, 0.1)" : "rgba(0, 0, 0, 0.2)")};
  border: 1px solid ${(props) =>
    props.$active ? "rgba(144, 116, 242, 0.3)" : "rgba(255, 255, 255, 0.1)"};
  border-radius: 8px;
  transition: all 0.2s ease;
`;

const ModeOptionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const ModeOptionIcon = styled.div<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: ${(props) =>
    props.$active ? "rgba(144, 116, 242, 0.2)" : "rgba(255, 255, 255, 0.1)"};
  border-radius: 8px;
  color: ${(props) => (props.$active ? LOUNGE_COLORS.tier1 : "rgba(255, 255, 255, 0.6)")};
`;

const ModeOptionInfo = styled.div`
  flex: 1;
`;

const ModeOptionTitle = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  color: #fff;
`;

const ModeOptionDesc = styled.div`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 2px;
`;

const ModeOptionContent = styled.div`
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
`;

const Select = styled.select`
  padding: 0.5rem 0.75rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid ${LOUNGE_COLORS.glassBorder};
  border-radius: 6px;
  color: #fff;
  font-size: 0.85rem;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${LOUNGE_COLORS.tier1};
  }

  option {
    background: #1a1a2e;
    color: #fff;
  }
`;

const GoLiveButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  margin-top: 0.5rem;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
  }
`;

const StopButton = styled(GoLiveButton)`
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);

  &:hover {
    background: rgba(239, 68, 68, 0.3);
    box-shadow: none;
  }
`;

const SwitchModeButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: #fff;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

const LiveStatusBox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 6px;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.8);
`;

const ModeActiveText = styled.div`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
`;

const ErrorBox = styled.div`
  margin-top: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 6px;
  font-size: 0.8rem;
  color: #ef4444;
`;

const SourceToggle = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const SourceOption = styled.button<{ $active?: boolean }>`
  flex: 1;
  padding: 0.5rem 0.75rem;
  background: ${(props) => (props.$active ? "rgba(144, 116, 242, 0.2)" : "rgba(0, 0, 0, 0.3)")};
  border: 1px solid ${(props) =>
    props.$active ? "rgba(144, 116, 242, 0.5)" : LOUNGE_COLORS.glassBorder};
  border-radius: 6px;
  color: ${(props) => (props.$active ? LOUNGE_COLORS.tier1 : "rgba(255, 255, 255, 0.6)")};
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: ${(props) =>
      props.$active ? "rgba(144, 116, 242, 0.25)" : "rgba(255, 255, 255, 0.1)"};
  }
`;

const SourceHint = styled.p`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  line-height: 1.4;
`;

const DebugSection = styled.div`
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const DebugTitle = styled.div`
  font-size: 0.7rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const DebugRow = styled.div`
  display: flex;
  gap: 0.5rem;
  font-size: 0.75rem;
`;

const DebugLabel = styled.span`
  color: rgba(255, 255, 255, 0.5);
`;

const DebugValue = styled.span`
  color: #22c55e;
  font-family: var(--font-mono);
`;

const DebugButton = styled.button<{ $active?: boolean }>`
  padding: 0.4rem 0.6rem;
  background: ${(props) => (props.$active ? "rgba(34, 197, 94, 0.2)" : "rgba(255, 255, 255, 0.1)")};
  border: 1px solid ${(props) => (props.$active ? "rgba(34, 197, 94, 0.4)" : "rgba(255, 255, 255, 0.2)")};
  border-radius: 4px;
  color: ${(props) => (props.$active ? "#22c55e" : "rgba(255, 255, 255, 0.7)")};
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

// Session timer and cooldown badges
const SessionTimer = styled.span<{ $isLow?: boolean }>`
  margin-left: 0.75rem;
  padding: 0.25rem 0.5rem;
  background: ${(props) => (props.$isLow ? "rgba(239, 68, 68, 0.2)" : "rgba(34, 197, 94, 0.2)")};
  border: 1px solid ${(props) => (props.$isLow ? "rgba(239, 68, 68, 0.4)" : "rgba(34, 197, 94, 0.4)")};
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  font-family: var(--font-mono);
  color: ${(props) => (props.$isLow ? "#ef4444" : "#22c55e")};
  ${(props) => props.$isLow && `animation: pulse 1s ease-in-out infinite;`}
`;

const CooldownBadge = styled.span`
  margin-left: 0.75rem;
  padding: 0.25rem 0.5rem;
  background: rgba(251, 191, 36, 0.2);
  border: 1px solid rgba(251, 191, 36, 0.4);
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  color: #fbbf24;
`;
