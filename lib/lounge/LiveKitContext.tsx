import { createContext, useContext, useState, useRef, useMemo, useEffect, useCallback, type ReactNode } from "react";
import {
  Room,
  RoomEvent,
  Track,
  LocalAudioTrack,
  RemoteTrack,
  RemoteTrackPublication,
  Participant,
  createLocalAudioTrack,
} from "livekit-client";

/**
 * LiveKit Context - manages LiveKit connection globally so audio persists across page navigation.
 * The audio element is stored in the context and survives route changes.
 */

// Session limits to control costs
const SESSION_LIMIT_MS = 60 * 60 * 1000; // 1 hour
const COOLDOWN_MS = 30 * 1000; // 30 seconds before reconnect

interface AudioDevice {
  deviceId: string;
  label: string;
  isVirtual?: boolean;
}

type AudioSourceType = "microphone" | "tab" | "screen";

interface LiveKitContextValue {
  // State
  isConnected: boolean;
  isReceiving: boolean;
  isPublishing: boolean;
  timeRemaining: number | null;
  isOnCooldown: boolean;
  cooldownUntil: number | null;
  streamTitle: string | null;
  error: string | null;

  // Audio device state (for publisher)
  audioDevices: AudioDevice[];
  selectedDevice: string | null;
  audioSource: AudioSourceType;
  isLoopbackActive: boolean;

  // Setters
  setStreamTitle: (title: string | null) => void;
  setSelectedDevice: (deviceId: string | null) => void;
  setAudioSource: (source: AudioSourceType) => void;

  // Mini-player / external setters
  setConnectionState: (connected: boolean, receiving: boolean) => void;
  setTimeRemaining: (time: number | null) => void;
  setCooldownState: (isOnCooldown: boolean, cooldownUntil: number | null) => void;

  // Callbacks ref for external controls (mini player)
  callbacksRef: {
    current: {
      onDisconnect: (() => void) | null;
      onSetVolume: ((volume: number) => void) | null;
      onSetMuted: ((muted: boolean) => void) | null;
    };
  };

  // Actions
  connectAsListener: (userId: string, displayName?: string) => Promise<void>;
  connectAsPublisher: (userId: string, displayName?: string, deviceId?: string, sourceType?: AudioSourceType) => Promise<void>;
  stopPublishing: () => Promise<void>;
  disconnect: (expired?: boolean) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  loadAudioDevices: () => Promise<void>;
  testLoopback: (enable: boolean) => void;
  getDebugInfo: () => object;
}

const LiveKitContext = createContext<LiveKitContextValue | null>(null);

// Known virtual audio device keywords
const VIRTUAL_DEVICE_KEYWORDS = [
  "blackhole",
  "soundflower",
  "loopback",
  "virtual",
  "vb-cable",
  "vb-audio",
  "cable input",
  "cable output",
  "voicemeeter",
  "obs",
  "streamlabs",
  "audio hijack",
  "aggregate",
  "multi-output",
];

const isVirtualDevice = (label: string): boolean => {
  const lowerLabel = label.toLowerCase();
  return VIRTUAL_DEVICE_KEYWORDS.some((keyword) => lowerLabel.includes(keyword));
};

export function LiveKitProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isOnCooldown, setIsOnCooldown] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [streamTitle, setStreamTitle] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Audio device state
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [audioSource, setAudioSource] = useState<AudioSourceType>("tab");
  const [isLoopbackActive, setIsLoopbackActive] = useState(false);

  // Refs for LiveKit objects (persist across renders)
  const roomRef = useRef<Room | null>(null);
  const localTrackRef = useRef<LocalAudioTrack | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const loopbackAudioRef = useRef<HTMLAudioElement | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTimeRef = useRef<number | null>(null);
  // Callbacks for external controls (mini player) — stored in a ref to avoid re-renders
  const callbacksRef = useRef<{
    onDisconnect: (() => void) | null;
    onSetVolume: ((volume: number) => void) | null;
    onSetMuted: ((muted: boolean) => void) | null;
  }>({ onDisconnect: null, onSetVolume: null, onSetMuted: null });

  // Get LiveKit token from API
  const getToken = useCallback(
    async (identity: string, isPublisher: boolean, displayName?: string) => {
      const response = await fetch("/api/lounge/livekit-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity, isPublisher, displayName }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to get LiveKit token");
      }

      return response.json();
    },
    []
  );

  // Start session timer
  const startSessionTimer = useCallback(() => {
    const startTime = Date.now();
    sessionStartTimeRef.current = startTime;
    setTimeRemaining(SESSION_LIMIT_MS);

    // Clear any existing timer
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
    }

    // Update remaining time every second
    sessionTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = SESSION_LIMIT_MS - elapsed;

      if (remaining <= 0) {
        setTimeRemaining(0);
        setError("Session limit reached (1 hour). Please wait before reconnecting.");
      } else {
        setTimeRemaining(remaining);
      }
    }, 1000);
  }, []);

  // Helpers used by pages to update the mini-player/global connection state
  const setConnectionState = useCallback((connected: boolean, receiving: boolean) => {
    setIsConnected(connected);
    setIsReceiving(receiving);
  }, []);

  const setTimeRemainingLocal = useCallback((time: number | null) => {
    setTimeRemaining(time);
  }, []);

  const setCooldownState = useCallback((cooldown: boolean, until: number | null) => {
    setIsOnCooldown(cooldown);
    setCooldownUntil(until);
  }, []);

  // Clear session timer and optionally set cooldown
  const clearSessionTimer = useCallback((setCooldownFlag: boolean = false) => {
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    sessionStartTimeRef.current = null;
    setTimeRemaining(null);

    if (setCooldownFlag) {
      const cooldownEnd = Date.now() + COOLDOWN_MS;
      setCooldownUntil(cooldownEnd);
      setIsOnCooldown(true);
      // Clear cooldown after the period
      setTimeout(() => {
        setCooldownUntil(null);
        setIsOnCooldown(false);
      }, COOLDOWN_MS);
    }
  }, []);

  // Load available audio devices
  const loadAudioDevices = useCallback(async () => {
    try {
      // Request permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices
        .filter((d) => d.kind === "audioinput")
        .map((d) => {
          const label = d.label || `Microphone ${d.deviceId.slice(0, 5)}`;
          return {
            deviceId: d.deviceId,
            label,
            isVirtual: isVirtualDevice(label),
          };
        })
        .sort((a, b) => {
          if (a.isVirtual && !b.isVirtual) return -1;
          if (!a.isVirtual && b.isVirtual) return 1;
          return a.label.localeCompare(b.label);
        });

      console.log("[LiveKit] Found audio devices:", audioInputs);
      setAudioDevices(audioInputs);

      // Prefer virtual device if available, otherwise first device
      if (!selectedDevice && audioInputs.length > 0) {
        const virtualDevice = audioInputs.find((d) => d.isVirtual);
        const deviceToSelect = virtualDevice || audioInputs[0];
        if (deviceToSelect) {
          setSelectedDevice(deviceToSelect.deviceId);
          console.log("[LiveKit] Auto-selected device:", deviceToSelect.label);
        }
      }
    } catch (err) {
      console.error("Failed to enumerate audio devices:", err);
      setError("Could not access audio devices");
    }
  }, [selectedDevice]);

  // Connect to room as listener
  const connectAsListener = useCallback(
    async (userId: string, displayName?: string) => {
      // Already connected
      if (isConnected && roomRef.current) {
        console.log("[LiveKit] Already connected as listener");
        return;
      }

      // Check cooldown
      if (cooldownUntil !== null && Date.now() < cooldownUntil) {
        const remaining = Math.ceil((cooldownUntil - Date.now()) / 1000);
        setError(`Please wait ${remaining}s before reconnecting`);
        return;
      }

      try {
        setError(null);
        console.log("[LiveKit] Connecting as listener...");

        const { token, wsUrl } = await getToken(userId, false, displayName);

        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
        });

        roomRef.current = room;

        // Handle incoming audio tracks
        room.on(
          RoomEvent.TrackSubscribed,
          (track: RemoteTrack, _publication: RemoteTrackPublication, participant: Participant) => {
            if (track.kind === Track.Kind.Audio) {
              console.log("[LiveKit] Audio track subscribed from:", participant.identity);
              // Create audio element and attach track
              const audioElement = track.attach();
              audioElement.id = `livekit-audio-${participant.identity}`;
              // Append to body so it persists across route changes
              document.body.appendChild(audioElement);
              audioElementRef.current = audioElement;
              setIsReceiving(true);
            }
          }
        );

        room.on(
          RoomEvent.TrackUnsubscribed,
          (track: RemoteTrack) => {
            if (track.kind === Track.Kind.Audio) {
              console.log("[LiveKit] Audio track unsubscribed");
              track.detach().forEach((el) => el.remove());
              setIsReceiving(false);
            }
          }
        );

        room.on(RoomEvent.Disconnected, (reason) => {
          console.log("[LiveKit] Disconnected, reason:", reason);
          setIsConnected(false);
          setIsReceiving(false);
          // Clean up audio element
          if (audioElementRef.current) {
            audioElementRef.current.remove();
            audioElementRef.current = null;
          }
        });

        // Log when a participant joins
        room.on(RoomEvent.ParticipantConnected, (participant) => {
          console.log("[LiveKit] Participant connected:", participant.identity);
        });

        // Handle when a track is published by a remote participant
        room.on(RoomEvent.TrackPublished, (publication, participant) => {
          console.log("[LiveKit] Track published:", publication.trackSid, "kind:", publication.kind, "by:", participant.identity);
        });

        await room.connect(wsUrl, token);
        console.log("[LiveKit] Connected to room:", room.name);
        console.log("[LiveKit] Remote participants:", room.remoteParticipants.size);
        setIsConnected(true);
        startSessionTimer();

        // Subscribe to any existing tracks (if publisher was already streaming before listener joined)
        room.remoteParticipants.forEach((participant) => {
          console.log("[LiveKit] Checking existing participant:", participant.identity);
          participant.trackPublications.forEach((publication) => {
            console.log("[LiveKit] Existing publication:", publication.trackSid, publication.kind, "subscribed:", publication.isSubscribed, "track:", !!publication.track);
            // For audio tracks, we need to check if they're already subscribed or need subscription
            if (publication.kind === Track.Kind.Audio) {
              if (publication.track) {
                // Track is already available, attach it
                console.log("[LiveKit] Attaching existing audio track from:", participant.identity);
                const audioElement = (publication.track as RemoteTrack).attach();
                audioElement.id = `livekit-audio-${participant.identity}`;
                document.body.appendChild(audioElement);
                audioElementRef.current = audioElement;
                setIsReceiving(true);
              } else {
                console.log("[LiveKit] Audio track not yet available, waiting for TrackSubscribed event");
              }
            }
          });
        });
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Connection failed");
        console.error("[LiveKit] Connection error:", error);
        setError(error.message);
      }
    },
    [getToken, cooldownUntil, startSessionTimer, isConnected]
  );

  // Connect as publisher (creator only)
  const connectAsPublisher = useCallback(
    async (userId: string, displayName?: string, deviceId?: string, sourceType?: AudioSourceType) => {
      // Check cooldown
      if (cooldownUntil !== null && Date.now() < cooldownUntil) {
        const remaining = Math.ceil((cooldownUntil - Date.now()) / 1000);
        setError(`Please wait ${remaining}s before reconnecting`);
        return;
      }

      try {
        setError(null);

        const source = sourceType || audioSource;
        let audioTrack: LocalAudioTrack;

        console.log("[LiveKit] Starting publisher connection, source:", source);

        // FIRST: Get the audio track (this may prompt user for permission)
        if (source === "tab" || source === "screen") {
          console.log("[LiveKit] Requesting display media, source:", source);

          const displayMediaOptions: DisplayMediaStreamOptions = {
            video: source === "screen" ? true : {
              width: 1,
              height: 1,
              frameRate: 1,
            },
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
            } as MediaTrackConstraints,
          };

          if (source === "tab") {
            (displayMediaOptions as any).preferCurrentTab = false;
            (displayMediaOptions as any).selfBrowserSurface = "exclude";
            (displayMediaOptions as any).surfaceSwitching = "include";
            (displayMediaOptions as any).systemAudio = "include";
          }

          const displayStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);

          mediaStreamRef.current = displayStream;
          console.log("[LiveKit] Got display stream, audio tracks:", displayStream.getAudioTracks().length);

          const audioTracks = displayStream.getAudioTracks();
          if (audioTracks.length === 0) {
            displayStream.getVideoTracks().forEach((track) => track.stop());
            throw new Error("No audio track found. Make sure to check 'Share tab audio' in the share dialog.");
          }

          displayStream.getVideoTracks().forEach((track) => {
            console.log("[LiveKit] Stopping video track:", track.label);
            track.stop();
          });

          const rawTrack = audioTracks[0]!;
          console.log("[LiveKit] Audio track settings:", rawTrack.getSettings());

          audioTrack = new LocalAudioTrack(rawTrack, undefined, false);
        } else {
          console.log("[LiveKit] Creating microphone track...");
          audioTrack = await createLocalAudioTrack({
            deviceId: deviceId || selectedDevice || undefined,
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          });
        }

        localTrackRef.current = audioTrack;
        console.log("[LiveKit] Audio track created");

        // Get token and connect
        console.log("[LiveKit] Getting token...");
        const { token, wsUrl } = await getToken(userId, true, displayName);
        console.log("[LiveKit] Got token, connecting to:", wsUrl);

        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
        });

        roomRef.current = room;

        room.on(RoomEvent.Disconnected, (reason) => {
          console.log("[LiveKit] Disconnected, reason:", reason);
          setIsConnected(false);
          setIsPublishing(false);
        });

        room.on(RoomEvent.TrackPublished, (pub, participant) => {
          console.log("[LiveKit] Track published:", pub.trackSid, "by:", participant.identity);
        });

        await room.connect(wsUrl, token);
        console.log("[LiveKit] Connected to room:", room.name);
        setIsConnected(true);
        startSessionTimer();

        // Publish the track
        console.log("[LiveKit] Publishing track...");
        const publication = await room.localParticipant.publishTrack(audioTrack);
        console.log("[LiveKit] Track published successfully:", publication.trackSid);
        setIsPublishing(true);
      } catch (err) {
        console.error("[LiveKit] Publisher error:", err);
        const error = err instanceof Error ? err : new Error("Failed to start streaming");
        setError(error.message);

        // Clean up on failure
        if (localTrackRef.current) {
          localTrackRef.current.stop();
          localTrackRef.current = null;
        }
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }
        if (roomRef.current) {
          roomRef.current.disconnect();
          roomRef.current = null;
        }

        throw error;
      }
    },
    [getToken, selectedDevice, audioSource, cooldownUntil, startSessionTimer]
  );

  // Stop publishing
  const stopPublishing = useCallback(async () => {
    if (localTrackRef.current && roomRef.current) {
      await roomRef.current.localParticipant.unpublishTrack(localTrackRef.current);
      localTrackRef.current.stop();
      localTrackRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    setIsPublishing(false);
  }, []);

  // Disconnect from room
  const disconnect = useCallback((expired: boolean = false) => {
    console.log("[LiveKit] Disconnecting...", { expired });

    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }

    if (localTrackRef.current) {
      localTrackRef.current.stop();
      localTrackRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioElementRef.current) {
      audioElementRef.current.remove();
      audioElementRef.current = null;
    }

    clearSessionTimer(expired);

    setIsConnected(false);
    setIsPublishing(false);
    setIsReceiving(false);
  }, [clearSessionTimer]);

  // Set audio volume
  const setVolume = useCallback((volume: number) => {
    if (audioElementRef.current) {
      audioElementRef.current.volume = Math.max(0, Math.min(1, volume));
    }
  }, []);

  // Mute/unmute
  const setMuted = useCallback((muted: boolean) => {
    if (audioElementRef.current) {
      audioElementRef.current.muted = muted;
    }
  }, []);

  // Test loopback
  const testLoopback = useCallback((enable: boolean) => {
    if (enable && mediaStreamRef.current) {
      const audio = new Audio();
      audio.srcObject = mediaStreamRef.current;
      audio.play().catch(console.error);
      loopbackAudioRef.current = audio;
      setIsLoopbackActive(true);
      console.log("[LiveKit] Loopback enabled");
    } else if (enable && localTrackRef.current) {
      const audio = localTrackRef.current.attach();
      document.body.appendChild(audio);
      loopbackAudioRef.current = audio;
      setIsLoopbackActive(true);
      console.log("[LiveKit] Loopback enabled for mic");
    } else {
      if (loopbackAudioRef.current) {
        loopbackAudioRef.current.pause();
        loopbackAudioRef.current.srcObject = null;
        loopbackAudioRef.current.remove();
        loopbackAudioRef.current = null;
      }
      setIsLoopbackActive(false);
      console.log("[LiveKit] Loopback disabled");
    }
  }, []);

  // Get debug info
  const getDebugInfo = useCallback(() => {
    return {
      room: roomRef.current?.name || null,
      roomState: roomRef.current?.state || null,
      localParticipant: roomRef.current?.localParticipant?.identity || null,
      publishedTracks: roomRef.current?.localParticipant?.trackPublications.size || 0,
      remoteParticipants: roomRef.current?.remoteParticipants.size || 0,
      mediaStreamActive: mediaStreamRef.current?.active || false,
      mediaStreamTracks: mediaStreamRef.current?.getTracks().map(t => ({
        kind: t.kind,
        enabled: t.enabled,
        readyState: t.readyState,
        label: t.label,
      })) || [],
      localTrackSid: localTrackRef.current?.sid || null,
      audioElementExists: !!audioElementRef.current,
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
      if (loopbackAudioRef.current) {
        loopbackAudioRef.current.pause();
        loopbackAudioRef.current.remove();
      }
    };
  }, [disconnect]);

  const value = useMemo(() => ({
    // State
    isConnected,
    isReceiving,
    isPublishing,
    timeRemaining,
    isOnCooldown,
    cooldownUntil,
    streamTitle,
    error,
    audioDevices,
    selectedDevice,
    audioSource,
    isLoopbackActive,
    // Setters
    setStreamTitle,
    setSelectedDevice,
    setAudioSource,

    // Mini-player / external setters
    setConnectionState,
    setTimeRemaining: setTimeRemainingLocal,
    setCooldownState,

    // Callbacks ref for external controls (mini player)
    callbacksRef,

    // Actions
    connectAsListener,
    connectAsPublisher,
    stopPublishing,
    disconnect,
    setVolume,
    setMuted,
    loadAudioDevices,
    testLoopback,
    getDebugInfo,
  }), [
    isConnected,
    isReceiving,
    isPublishing,
    timeRemaining,
    isOnCooldown,
    cooldownUntil,
    streamTitle,
    error,
    audioDevices,
    selectedDevice,
    audioSource,
    isLoopbackActive,
    connectAsListener,
    connectAsPublisher,
    stopPublishing,
    disconnect,
    setVolume,
    setMuted,
    loadAudioDevices,
    testLoopback,
    getDebugInfo,
  ]);

  return (
    <LiveKitContext.Provider value={value}>
      {children}
    </LiveKitContext.Provider>
  );
}

export function useLiveKitContext() {
  const context = useContext(LiveKitContext);
  if (!context) {
    throw new Error("useLiveKitContext must be used within LiveKitProvider");
  }
  return context;
}

// Optional hook that doesn't throw if outside provider
export function useLiveKitContextOptional() {
  return useContext(LiveKitContext);
}
