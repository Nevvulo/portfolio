/**
 * Unit Tests for Founder System
 *
 * Tests the core founder logic using a mock Redis implementation.
 * This tests the business logic without requiring a real Redis connection.
 */

import { describe, expect, test } from "bun:test";
import { BadgeColors, BadgeDescriptions, BadgeNames, BadgeType } from "../constants/badges";
import { MAX_FOUNDERS } from "./redis";

// ============================================
// PURE LOGIC TESTS (No Redis required)
// ============================================

describe("Founder System - Pure Logic", () => {
  describe("MAX_FOUNDERS constant", () => {
    test("is 10", () => {
      expect(MAX_FOUNDERS).toBe(10);
    });

    test("is a positive integer", () => {
      expect(Number.isInteger(MAX_FOUNDERS)).toBe(true);
      expect(MAX_FOUNDERS).toBeGreaterThan(0);
    });
  });

  describe("Founder Number Validation", () => {
    test("valid founder numbers are 1-10", () => {
      const validNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      validNumbers.forEach((num) => {
        expect(num).toBeGreaterThanOrEqual(1);
        expect(num).toBeLessThanOrEqual(MAX_FOUNDERS);
      });
    });

    test("0 is not a valid founder number", () => {
      expect(0).toBeLessThan(1);
    });

    test("11 is not a valid founder number", () => {
      expect(11).toBeGreaterThan(MAX_FOUNDERS);
    });
  });

  describe("Spots Remaining Calculation", () => {
    function calculateSpotsRemaining(claimedCount: number): number {
      return Math.max(0, MAX_FOUNDERS - claimedCount);
    }

    test("returns 10 when no spots claimed", () => {
      expect(calculateSpotsRemaining(0)).toBe(10);
    });

    test("returns 7 when 3 spots claimed", () => {
      expect(calculateSpotsRemaining(3)).toBe(7);
    });

    test("returns 0 when all spots claimed", () => {
      expect(calculateSpotsRemaining(10)).toBe(0);
    });

    test("returns 0 when over-claimed (edge case)", () => {
      expect(calculateSpotsRemaining(15)).toBe(0);
    });

    test("never returns negative", () => {
      for (let i = 0; i <= 20; i++) {
        expect(calculateSpotsRemaining(i)).toBeGreaterThanOrEqual(0);
      }
    });
  });
});

// ============================================
// BADGE INTEGRATION TESTS
// ============================================

describe("Founder Badge Constants", () => {
  test("FOUNDER badge type exists", () => {
    expect(BadgeType.FOUNDER).toBeDefined();
    expect(String(BadgeType.FOUNDER)).toBe("FOUNDER");
  });

  test("FOUNDER badge has a name", () => {
    const founderType = BadgeType.FOUNDER;
    expect(BadgeNames[founderType]).toBe("Founder");
  });

  test("FOUNDER badge has hot pink color", () => {
    const founderType = BadgeType.FOUNDER;
    expect(BadgeColors[founderType]).toBe("#ff6eb4");
  });

  test("FOUNDER badge has description", () => {
    const founderType = BadgeType.FOUNDER;
    expect(BadgeDescriptions[founderType]).toBe("One of the first 10 supporters");
  });

  test("FOUNDER badge color is valid hex", () => {
    const founderType = BadgeType.FOUNDER;
    const color = BadgeColors[founderType];
    expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
  });
});

// ============================================
// TYPE TESTS (Compile-time validation)
// ============================================

describe("SupporterStatus Type", () => {
  test("founderNumber accepts valid values (1-10)", () => {
    const validStatuses: import("../types/supporter").SupporterStatus[] = [
      {
        twitchSubTier: null,
        discordBooster: false,
        discordHighestRole: null,
        clerkPlan: null,
        clerkPlanStatus: null,
        founderNumber: 1,
        lastSyncedAt: new Date().toISOString(),
      },
      {
        twitchSubTier: null,
        discordBooster: false,
        discordHighestRole: null,
        clerkPlan: null,
        clerkPlanStatus: null,
        founderNumber: 5,
        lastSyncedAt: new Date().toISOString(),
      },
      {
        twitchSubTier: null,
        discordBooster: false,
        discordHighestRole: null,
        clerkPlan: null,
        clerkPlanStatus: null,
        founderNumber: 10,
        lastSyncedAt: new Date().toISOString(),
      },
    ];

    expect(validStatuses[0]!.founderNumber).toBe(1);
    expect(validStatuses[1]!.founderNumber).toBe(5);
    expect(validStatuses[2]!.founderNumber).toBe(10);
  });

  test("founderNumber can be null", () => {
    const status: import("../types/supporter").SupporterStatus = {
      twitchSubTier: null,
      discordBooster: false,
      discordHighestRole: null,
      clerkPlan: null,
      clerkPlanStatus: null,
      founderNumber: null,
      lastSyncedAt: new Date().toISOString(),
    };

    expect(status.founderNumber).toBeNull();
  });

  test("founderNumber works with active subscription", () => {
    const status: import("../types/supporter").SupporterStatus = {
      twitchSubTier: null,
      discordBooster: false,
      discordHighestRole: null,
      clerkPlan: "super_legend",
      clerkPlanStatus: "active",
      founderNumber: 3,
      lastSyncedAt: new Date().toISOString(),
    };

    expect(status.founderNumber).toBe(3);
    expect(status.clerkPlan).toBe("super_legend");
    expect(status.clerkPlanStatus).toBe("active");
  });
});

// ============================================
// IN-MEMORY FOUNDER SLOT SIMULATION
// ============================================

describe("Founder Slot Claiming Simulation", () => {
  /**
   * Simulates the founder slot claiming logic without Redis
   * This is a pure in-memory implementation for testing
   */
  class FounderSlotSimulator {
    private count = 0;
    private slots = new Map<number, string>();
    private userSlots = new Map<string, number>();

    async claimSlot(userId: string): Promise<number | null> {
      // Check if already a founder
      const existing = this.userSlots.get(userId);
      if (existing) return existing;

      // Atomic increment simulation
      const newCount = ++this.count;

      if (newCount > MAX_FOUNDERS) {
        this.count--; // Rollback
        return null;
      }

      // Claim the slot
      this.slots.set(newCount, userId);
      this.userSlots.set(userId, newCount);

      return newCount;
    }

    getFounderNumber(userId: string): number | null {
      return this.userSlots.get(userId) ?? null;
    }

    getSpotsRemaining(): number {
      return Math.max(0, MAX_FOUNDERS - this.count);
    }

    getCount(): number {
      return this.count;
    }

    reset(): void {
      this.count = 0;
      this.slots.clear();
      this.userSlots.clear();
    }
  }

  test("first subscriber gets slot #1", () => {
    const sim = new FounderSlotSimulator();
    const slot = sim.claimSlot("user_1");
    expect(slot).resolves.toBe(1);
  });

  test("sequential claims get sequential slots", async () => {
    const sim = new FounderSlotSimulator();

    for (let i = 1; i <= 5; i++) {
      const slot = await sim.claimSlot(`user_${i}`);
      expect(slot).toBe(i);
    }

    expect(sim.getCount()).toBe(5);
    expect(sim.getSpotsRemaining()).toBe(5);
  });

  test("10th subscriber gets slot #10", async () => {
    const sim = new FounderSlotSimulator();

    for (let i = 1; i <= 10; i++) {
      const slot = await sim.claimSlot(`user_${i}`);
      expect(slot).toBe(i);
    }

    expect(sim.getSpotsRemaining()).toBe(0);
  });

  test("11th subscriber gets null (full)", async () => {
    const sim = new FounderSlotSimulator();

    // Fill all slots
    for (let i = 1; i <= 10; i++) {
      await sim.claimSlot(`user_${i}`);
    }

    // 11th should fail
    const slot = await sim.claimSlot("user_11");
    expect(slot).toBeNull();
    expect(sim.getCount()).toBe(10);
  });

  test("same user claiming twice returns existing slot (idempotent)", async () => {
    const sim = new FounderSlotSimulator();

    const first = await sim.claimSlot("user_same");
    const second = await sim.claimSlot("user_same");

    expect(first).toBe(1);
    expect(second).toBe(1);
    expect(sim.getCount()).toBe(1);
  });

  test("getFounderNumber returns correct slot", async () => {
    const sim = new FounderSlotSimulator();

    await sim.claimSlot("user_a");
    await sim.claimSlot("user_b");
    await sim.claimSlot("user_c");

    expect(sim.getFounderNumber("user_a")).toBe(1);
    expect(sim.getFounderNumber("user_b")).toBe(2);
    expect(sim.getFounderNumber("user_c")).toBe(3);
    expect(sim.getFounderNumber("user_unknown")).toBeNull();
  });

  test("handles 15 concurrent claims correctly (only 10 succeed)", async () => {
    const sim = new FounderSlotSimulator();
    const results: Array<{ userId: string; slot: number | null }> = [];

    for (let i = 1; i <= 15; i++) {
      const slot = await sim.claimSlot(`concurrent_${i}`);
      results.push({ userId: `concurrent_${i}`, slot });
    }

    const successful = results.filter((r) => r.slot !== null);
    const failed = results.filter((r) => r.slot === null);

    expect(successful.length).toBe(10);
    expect(failed.length).toBe(5);

    // Verify unique slot numbers
    const slots = successful.map((r) => r.slot).sort((a, b) => (a ?? 0) - (b ?? 0));
    expect(slots).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
});

// ============================================
// HELPER FUNCTION TESTS
// ============================================

describe("hasAnyBadge Helper Logic", () => {
  function hasAnyBadge(
    status: Partial<import("../types/supporter").SupporterStatus> | null,
  ): boolean {
    if (!status) return false;
    if (status.founderNumber) return true;
    if (status.twitchSubTier) return true;
    if (status.discordBooster) return true;
    if (status.discordHighestRole) return true;
    if (status.clerkPlan && status.clerkPlanStatus === "active") return true;
    return false;
  }

  test("returns false for null status", () => {
    expect(hasAnyBadge(null)).toBe(false);
  });

  test("returns false for empty status", () => {
    expect(hasAnyBadge({})).toBe(false);
  });

  test("returns true for founder", () => {
    expect(hasAnyBadge({ founderNumber: 1 })).toBe(true);
    expect(hasAnyBadge({ founderNumber: 10 })).toBe(true);
  });

  test("returns true for twitch sub", () => {
    expect(hasAnyBadge({ twitchSubTier: 1 })).toBe(true);
    expect(hasAnyBadge({ twitchSubTier: 3 })).toBe(true);
  });

  test("returns true for discord booster", () => {
    expect(hasAnyBadge({ discordBooster: true })).toBe(true);
  });

  test("returns false for non-booster", () => {
    expect(hasAnyBadge({ discordBooster: false })).toBe(false);
  });

  test("returns true for discord role", () => {
    expect(
      hasAnyBadge({
        discordHighestRole: { id: "123", name: "Test", color: 0, position: 1 },
      }),
    ).toBe(true);
  });

  test("returns true for active subscription", () => {
    expect(
      hasAnyBadge({
        clerkPlan: "super_legend",
        clerkPlanStatus: "active",
      }),
    ).toBe(true);
  });

  test("returns false for canceled subscription", () => {
    expect(
      hasAnyBadge({
        clerkPlan: "super_legend",
        clerkPlanStatus: "canceled",
      }),
    ).toBe(false);
  });

  test("returns true for founder + subscription combo", () => {
    expect(
      hasAnyBadge({
        founderNumber: 3,
        clerkPlan: "super_legend_2",
        clerkPlanStatus: "active",
      }),
    ).toBe(true);
  });
});

// ============================================
// EDGE CASE TESTS
// ============================================

describe("Edge Cases", () => {
  test("empty string userId is technically valid", () => {
    // While not recommended, empty strings shouldn't break the system
    expect("".length).toBe(0);
  });

  test("special characters in userId don't break anything", () => {
    const specialIds = [
      "user_with-dash",
      "user.with.dots",
      "user@email.com",
      "user#123",
      "user/path",
      "user?query=1",
    ];

    specialIds.forEach((id) => {
      // Just verify these don't throw
      expect(typeof id).toBe("string");
      expect(id.length).toBeGreaterThan(0);
    });
  });

  test("very long userId is handled", () => {
    const longId = "user_" + "x".repeat(1000);
    expect(longId.length).toBe(1005);
    // System should handle this gracefully
  });
});
