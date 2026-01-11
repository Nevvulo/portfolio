import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./auth";

// Heartbeat timeout - users without heartbeat for 60 seconds are considered disconnected
const HEARTBEAT_TIMEOUT = 60 * 1000;

/**
 * Get current jungle state including listeners and current track
 */
export const getState = query({
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    // Free users cannot access the jungle
    if (user.tier === "free") {
      return null;
    }

    // Get all active listeners (with recent heartbeat)
    const cutoffTime = Date.now() - HEARTBEAT_TIMEOUT;
    const activeListeners = await ctx.db
      .query("jungleListeners")
      .withIndex("by_heartbeat")
      .filter((q) => q.gt(q.field("lastHeartbeat"), cutoffTime))
      .collect();

    // Get user info for each listener
    const listeners = await Promise.all(
      activeListeners.map(async (listener) => {
        const listenerUser = await ctx.db.get(listener.userId);
        if (!listenerUser) return null;
        return {
          _id: listenerUser._id,
          displayName: listenerUser.displayName,
          avatarUrl: listenerUser.avatarUrl,
          tier: listenerUser.tier,
          joinedAt: listener.joinedAt,
        };
      }),
    );

    // Get jungle state (singleton)
    const jungleState = await ctx.db.query("jungleState").first();

    return {
      mode: jungleState?.mode ?? "idle",
      currentTrack: jungleState?.currentTrack ?? null,
      queue: jungleState?.queue ?? [],
      isPlaying: jungleState?.isPlaying ?? false,
      liveStreamTitle: jungleState?.liveStreamTitle,
      liveStreamStartedAt: jungleState?.liveStreamStartedAt,
      listeners: listeners.filter(Boolean),
    };
  },
});

/**
 * Join the jungle
 */
export const join = mutation({
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    // Free users cannot join
    if (user.tier === "free") {
      throw new Error("Supporters only");
    }

    const now = Date.now();

    // Check if user is already in jungle
    const existingListener = await ctx.db
      .query("jungleListeners")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (existingListener) {
      // Update heartbeat
      await ctx.db.patch(existingListener._id, {
        lastHeartbeat: now,
      });
      return existingListener._id;
    }

    // Add new listener
    const listenerId = await ctx.db.insert("jungleListeners", {
      userId: user._id,
      joinedAt: now,
      lastHeartbeat: now,
    });

    return listenerId;
  },
});

/**
 * Leave the jungle
 */
export const leave = mutation({
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const listener = await ctx.db
      .query("jungleListeners")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (listener) {
      await ctx.db.delete(listener._id);
    }
  },
});

/**
 * Send heartbeat to stay in jungle
 */
export const heartbeat = mutation({
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const listener = await ctx.db
      .query("jungleListeners")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (listener) {
      await ctx.db.patch(listener._id, {
        lastHeartbeat: Date.now(),
      });
    }
  },
});

/**
 * Add YouTube video to queue (creator only)
 */
export const addToQueue = mutation({
  args: {
    youtubeId: v.string(),
    title: v.string(),
    artist: v.optional(v.string()),
    duration: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // Only creator can add tracks
    if (!user.isCreator) {
      throw new Error("Only the creator can add tracks");
    }

    // Get or create jungle state
    const jungleState = await ctx.db.query("jungleState").first();

    const trackId = `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newTrack = {
      id: trackId,
      youtubeId: args.youtubeId,
      title: args.title,
      artist: args.artist,
      duration: args.duration,
      addedBy: user.displayName,
    };

    if (!jungleState) {
      // Create new state with this track playing
      await ctx.db.insert("jungleState", {
        mode: "youtube",
        currentTrack: {
          youtubeId: newTrack.youtubeId,
          title: newTrack.title,
          artist: newTrack.artist,
          duration: newTrack.duration,
          startedAt: Date.now(),
          addedBy: newTrack.addedBy,
        },
        queue: [],
        isPlaying: true,
        updatedAt: Date.now(),
      });
    } else if (!jungleState.currentTrack || jungleState.mode === "idle") {
      // No current track or idle, start playing immediately
      await ctx.db.patch(jungleState._id, {
        mode: "youtube",
        currentTrack: {
          youtubeId: newTrack.youtubeId,
          title: newTrack.title,
          artist: newTrack.artist,
          duration: newTrack.duration,
          startedAt: Date.now(),
          addedBy: newTrack.addedBy,
        },
        isPlaying: true,
        updatedAt: Date.now(),
      });
    } else {
      // Add to queue
      const newQueue = [...jungleState.queue, newTrack];
      await ctx.db.patch(jungleState._id, {
        queue: newQueue,
        updatedAt: Date.now(),
      });
    }

    return trackId;
  },
});

/**
 * Play/pause control (creator only)
 */
export const setPlaying = mutation({
  args: { isPlaying: v.boolean() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (!user.isCreator) {
      throw new Error("Only the creator can control playback");
    }

    const jungleState = await ctx.db.query("jungleState").first();
    if (!jungleState) return;

    // If resuming, adjust startedAt to account for paused time
    if (args.isPlaying && jungleState.currentTrack && !jungleState.isPlaying) {
      // Track was paused - we need to recalculate startedAt
      // For simplicity, just set startedAt to now (restarts track)
      // In a real implementation, you'd track elapsed time
      await ctx.db.patch(jungleState._id, {
        isPlaying: true,
        currentTrack: {
          ...jungleState.currentTrack,
          startedAt: Date.now(),
        },
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.patch(jungleState._id, {
        isPlaying: args.isPlaying,
        updatedAt: Date.now(),
      });
    }
  },
});

/**
 * Skip current track (creator only)
 */
export const skipTrack = mutation({
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    if (!user.isCreator) {
      throw new Error("Only the creator can skip tracks");
    }

    const jungleState = await ctx.db.query("jungleState").first();
    if (!jungleState) return;

    if (jungleState.queue.length > 0) {
      // Play next track in queue
      const nextTrack = jungleState.queue[0];
      const remainingQueue = jungleState.queue.slice(1);

      if (nextTrack) {
        await ctx.db.patch(jungleState._id, {
          currentTrack: {
            youtubeId: nextTrack.youtubeId,
            title: nextTrack.title,
            artist: nextTrack.artist,
            duration: nextTrack.duration,
            addedBy: nextTrack.addedBy,
            startedAt: Date.now(),
          },
          queue: remainingQueue,
          isPlaying: true,
          updatedAt: Date.now(),
        });
      }
    } else {
      // No more tracks in queue
      await ctx.db.patch(jungleState._id, {
        currentTrack: undefined,
        isPlaying: false,
        updatedAt: Date.now(),
      });
    }
  },
});

/**
 * Remove track from queue (creator only)
 */
export const removeFromQueue = mutation({
  args: { trackId: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (!user.isCreator) {
      throw new Error("Only the creator can modify the queue");
    }

    const jungleState = await ctx.db.query("jungleState").first();
    if (!jungleState) return;

    const newQueue = jungleState.queue.filter((t) => t.id !== args.trackId);
    await ctx.db.patch(jungleState._id, {
      queue: newQueue,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Clear entire queue (creator only)
 */
export const clearQueue = mutation({
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    if (!user.isCreator) {
      throw new Error("Only the creator can clear the queue");
    }

    const jungleState = await ctx.db.query("jungleState").first();
    if (!jungleState) return;

    await ctx.db.patch(jungleState._id, {
      queue: [],
      updatedAt: Date.now(),
    });
  },
});

/**
 * Auto-advance to next track when current ends
 */
export const onTrackEnd = mutation({
  handler: async (ctx) => {
    // Verify user is authenticated (any user can trigger this as it's called by the player)
    await requireUser(ctx);

    const jungleState = await ctx.db.query("jungleState").first();
    if (!jungleState) return;

    if (jungleState.queue.length > 0) {
      const nextTrack = jungleState.queue[0];
      const remainingQueue = jungleState.queue.slice(1);

      if (nextTrack) {
        await ctx.db.patch(jungleState._id, {
          currentTrack: {
            youtubeId: nextTrack.youtubeId,
            title: nextTrack.title,
            artist: nextTrack.artist,
            duration: nextTrack.duration,
            addedBy: nextTrack.addedBy,
            startedAt: Date.now(),
          },
          queue: remainingQueue,
          isPlaying: true,
          updatedAt: Date.now(),
        });
      }
    } else {
      // No more tracks
      await ctx.db.patch(jungleState._id, {
        currentTrack: undefined,
        isPlaying: false,
        updatedAt: Date.now(),
      });
    }
  },
});

/**
 * Start live audio streaming (creator only)
 */
export const startLiveStream = mutation({
  args: { title: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (!user.isCreator) {
      throw new Error("Only the creator can start live streaming");
    }

    const jungleState = await ctx.db.query("jungleState").first();

    if (!jungleState) {
      await ctx.db.insert("jungleState", {
        mode: "live",
        queue: [],
        isPlaying: false,
        liveStreamTitle: args.title || "Live Audio",
        liveStreamStartedAt: Date.now(),
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.patch(jungleState._id, {
        mode: "live",
        currentTrack: undefined, // Clear YouTube track
        isPlaying: false,
        liveStreamTitle: args.title || "Live Audio",
        liveStreamStartedAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

/**
 * Stop live audio streaming (creator only)
 */
export const stopLiveStream = mutation({
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    if (!user.isCreator) {
      throw new Error("Only the creator can stop live streaming");
    }

    const jungleState = await ctx.db.query("jungleState").first();
    if (!jungleState) return;

    // Check if there are queued YouTube tracks
    if (jungleState.queue.length > 0) {
      const nextTrack = jungleState.queue[0];
      const remainingQueue = jungleState.queue.slice(1);

      if (nextTrack) {
        await ctx.db.patch(jungleState._id, {
          mode: "youtube",
          currentTrack: {
            youtubeId: nextTrack.youtubeId,
            title: nextTrack.title,
            artist: nextTrack.artist,
            duration: nextTrack.duration,
            addedBy: nextTrack.addedBy,
            startedAt: Date.now(),
          },
          queue: remainingQueue,
          isPlaying: true,
          liveStreamTitle: undefined,
          liveStreamStartedAt: undefined,
          updatedAt: Date.now(),
        });
        return;
      }
    }

    // No queued tracks, go to idle
    await ctx.db.patch(jungleState._id, {
      mode: "idle",
      liveStreamTitle: undefined,
      liveStreamStartedAt: undefined,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Set mode to idle (stop everything)
 */
export const setIdle = mutation({
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    if (!user.isCreator) {
      throw new Error("Only the creator can control playback");
    }

    const jungleState = await ctx.db.query("jungleState").first();
    if (!jungleState) return;

    await ctx.db.patch(jungleState._id, {
      mode: "idle",
      currentTrack: undefined,
      isPlaying: false,
      liveStreamTitle: undefined,
      liveStreamStartedAt: undefined,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Clean up stale listeners (run periodically)
 */
export const cleanupStaleListeners = mutation({
  handler: async (ctx) => {
    const cutoffTime = Date.now() - HEARTBEAT_TIMEOUT;

    const staleListeners = await ctx.db
      .query("jungleListeners")
      .withIndex("by_heartbeat")
      .filter((q) => q.lt(q.field("lastHeartbeat"), cutoffTime))
      .collect();

    for (const listener of staleListeners) {
      await ctx.db.delete(listener._id);
    }

    return { removed: staleListeners.length };
  },
});
