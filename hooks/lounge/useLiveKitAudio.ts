import { useState, useCallback, useRef, useEffect } from "react";
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

// Session limits to control costs
const SESSION_LIMIT_MS = 60 * 60 * 1000; // 1 hour
const COOLDOWN_MS = 30 * 1000; // 30 seconds before reconnect

interface UseLiveKitAudioOptions {
  onError?: (error: Error) => void;
  onSessionExpired?: () => void;
}

interface AudioDevice {
  deviceId: string;
  label: string;
  isVirtual?: boolean;
}

type AudioSourceType = "microphone" | "tab" | "screen";

export function useLiveKitAudio(options?: UseLiveKitAudioOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [audioSource, setAudioSource] = useState<AudioSourceType>("tab");
  const [error, setError] = useState<string | null>(null);

  // Session time tracking
  const [_sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const roomRef = useRef<Room | null>(null);
  const localTrackRef = useRef<LocalAudioTrack | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const loopbackAudioRef = useRef<HTMLAudioElement | null>(null);

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

  // Check if currently on cooldown
  const isOnCooldown = cooldownUntil !== null && Date.now() < cooldownUntil;

  // Start session timer
  const startSessionTimer = useCallback(() => {
    const startTime = Date.now();
    setSessionStartTime(startTime);
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
        // Session expired - auto disconnect
        setTimeRemaining(0);
        setError("Session limit reached (1 hour). Please wait before reconnecting.");
        options?.onSessionExpired?.();
        // Disconnect will be called by the component
      } else {
        setTimeRemaining(remaining);
      }
    }, 1000);
  }, [options]);

  // Clear session timer and set cooldown
  const clearSessionTimer = useCallback((setCooldown: boolean = false) => {
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    setSessionStartTime(null);
    setTimeRemaining(null);

    if (setCooldown) {
      setCooldownUntil(Date.now() + COOLDOWN_MS);
      // Clear cooldown after the period
      setTimeout(() => {
        setCooldownUntil(null);
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
        // Sort: virtual devices first, then by name
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
          console.log("[LiveKit] Auto-selected device:", deviceToSelect.label, deviceToSelect.isVirtual ? "(virtual)" : "");
        }
      }
    } catch (err) {
      console.error("Failed to enumerate audio devices:", err);
      setError("Could not access audio devices");
    }
  }, [selectedDevice]);

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

  // Connect to room as listener
  const connectAsListener = useCallback(
    async (userId: string, displayName?: string) => {
      // Check cooldown
      if (cooldownUntil !== null && Date.now() < cooldownUntil) {
        const remaining = Math.ceil((cooldownUntil - Date.now()) / 1000);
        setError(`Please wait ${remaining}s before reconnecting`);
        return;
      }

      try {
        setError(null);

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
              // Create audio element and attach track
              const audioElement = track.attach();
              audioElement.id = `audio-${participant.identity}`;
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
              track.detach().forEach((el) => el.remove());
              setIsReceiving(false);
            }
          }
        );

        room.on(RoomEvent.Disconnected, () => {
          setIsConnected(false);
          setIsReceiving(false);
        });

        await room.connect(wsUrl, token);
        setIsConnected(true);
        startSessionTimer();
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Connection failed");
        setError(error.message);
        options?.onError?.(error);
      }
    },
    [getToken, options, cooldownUntil, startSessionTimer]
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
        // Do this before connecting so the room doesn't timeout waiting
        if (source === "tab" || source === "screen") {
          console.log("[LiveKit] Requesting display media, source:", source);

          // Build constraints based on source type
          const displayMediaOptions: DisplayMediaStreamOptions = {
            video: source === "screen" ? true : {
              // For tab audio, request minimal video that we'll discard
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

          // Chrome-specific: prefer current tab for audio-only
          if (source === "tab") {
            (displayMediaOptions as any).preferCurrentTab = false;
            (displayMediaOptions as any).selfBrowserSurface = "exclude";
            (displayMediaOptions as any).surfaceSwitching = "include";
            // Request system audio on supported browsers
            (displayMediaOptions as any).systemAudio = "include";
          }

          const displayStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);

          mediaStreamRef.current = displayStream;
          console.log("[LiveKit] Got display stream, audio tracks:", displayStream.getAudioTracks().length, "video tracks:", displayStream.getVideoTracks().length);

          // Get the audio track from the display stream
          const audioTracks = displayStream.getAudioTracks();
          if (audioTracks.length === 0) {
            // Clean up video tracks
            displayStream.getVideoTracks().forEach((track) => track.stop());
            throw new Error("No audio track found. Make sure to check 'Share tab audio' in the share dialog.");
          }

          // Stop video track - we only want audio
          displayStream.getVideoTracks().forEach((track) => {
            console.log("[LiveKit] Stopping video track:", track.label);
            track.stop();
          });

          const rawTrack = audioTracks[0]!;
          console.log("[LiveKit] Audio track settings:", rawTrack.getSettings());
          console.log("[LiveKit] Audio track label:", rawTrack.label);
          console.log("[LiveKit] Audio track enabled:", rawTrack.enabled, "readyState:", rawTrack.readyState);

          // Create LocalAudioTrack from the MediaStreamTrack
          audioTrack = new LocalAudioTrack(rawTrack, undefined, false);
        } else {
          console.log("[LiveKit] Creating microphone track...");
          // Use microphone
          audioTrack = await createLocalAudioTrack({
            deviceId: deviceId || selectedDevice || undefined,
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          });
        }

        localTrackRef.current = audioTrack;
        console.log("[LiveKit] Audio track created:", audioTrack.sid);

        // THEN: Get token and connect to room
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

        // FINALLY: Publish the track
        console.log("[LiveKit] Publishing track...");
        const publication = await room.localParticipant.publishTrack(audioTrack);
        console.log("[LiveKit] Track published successfully:", publication.trackSid);
        setIsPublishing(true);
      } catch (err) {
        console.error("[LiveKit] Publisher error:", err);
        const error = err instanceof Error ? err : new Error("Failed to start streaming");
        setError(error.message);
        options?.onError?.(error);

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

        throw error; // Re-throw so caller knows it failed
      }
    },
    [getToken, selectedDevice, audioSource, options, cooldownUntil, startSessionTimer]
  );

  // Stop publishing
  const stopPublishing = useCallback(async () => {
    if (localTrackRef.current && roomRef.current) {
      await roomRef.current.localParticipant.unpublishTrack(localTrackRef.current);
      localTrackRef.current.stop();
      localTrackRef.current = null;
    }

    // Stop display media stream if active
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    setIsPublishing(false);
  }, []);

  // Disconnect from room
  const disconnect = useCallback((expired: boolean = false) => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }

    if (localTrackRef.current) {
      localTrackRef.current.stop();
      localTrackRef.current = null;
    }

    // Stop display media stream if active
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioElementRef.current) {
      audioElementRef.current.remove();
      audioElementRef.current = null;
    }

    // Clear session timer and set cooldown if session expired
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

  // Test loopback - play captured audio locally
  const [isLoopbackActive, setIsLoopbackActive] = useState(false);
  const testLoopback = useCallback((enable: boolean) => {
    if (enable && mediaStreamRef.current) {
      // Create audio element to play back the captured stream
      const audio = new Audio();
      audio.srcObject = mediaStreamRef.current;
      audio.play().catch(console.error);
      loopbackAudioRef.current = audio;
      setIsLoopbackActive(true);
      console.log("[LiveKit] Loopback enabled - you should hear your captured audio");
    } else if (enable && localTrackRef.current) {
      // For microphone, attach the track
      const audio = localTrackRef.current.attach();
      document.body.appendChild(audio);
      loopbackAudioRef.current = audio;
      setIsLoopbackActive(true);
      console.log("[LiveKit] Loopback enabled for mic");
    } else {
      // Disable loopback
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

  return {
    // State
    isConnected,
    isPublishing,
    isReceiving,
    audioDevices,
    selectedDevice,
    audioSource,
    error,
    isLoopbackActive,

    // Session state
    timeRemaining,
    isOnCooldown,
    cooldownUntil,

    // Actions
    loadAudioDevices,
    setSelectedDevice,
    setAudioSource,
    connectAsListener,
    connectAsPublisher,
    stopPublishing,
    disconnect,
    setVolume,
    setMuted,
    testLoopback,
    getDebugInfo,
  };
}
