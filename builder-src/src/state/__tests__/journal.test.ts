import { describe, expect, it } from "vitest";
import { replayJournal, liveRecords } from "../journal";
import type { SyncEnvelopeWire } from "../../api/syncClient";

function envelope(args: {
  entityId: string;
  entityType?: string;
  localVersion?: number;
  modifiedAt: number;
  isDeleted?: boolean;
  name?: string;
}): SyncEnvelopeWire {
  return {
    header: {
      principalId: "acct:user-1",
      entityType: args.entityType ?? "workout_template",
      entityId: args.entityId,
      localVersion: args.localVersion ?? 1,
      lastModifiedAtEpochMs: args.modifiedAt,
      lastModifiedDeviceId: "device-a",
      lastMutationId: `m-${args.entityId}-${args.modifiedAt}-${args.localVersion ?? 1}`,
      originInputChannel: "phone_app",
      originDataSource: "manual",
      isDeleted: args.isDeleted ?? false,
    },
    payload: args.isDeleted ? null : { name: args.name ?? "T" },
  };
}

describe("replayJournal", () => {
  it("keeps the most recently modified state per entity", () => {
    const latest = replayJournal([
      envelope({ entityId: "a", modifiedAt: 100, name: "old" }),
      envelope({ entityId: "a", modifiedAt: 200, name: "new" }),
      envelope({ entityId: "b", modifiedAt: 150, name: "other" }),
    ]);
    expect(latest.get("workout_template:a")?.payload).toEqual({ name: "new" });
    expect(latest.size).toBe(2);
  });

  it("resolves equal timestamps to the later journal entry", () => {
    const latest = replayJournal([
      envelope({ entityId: "a", modifiedAt: 100, name: "first" }),
      envelope({ entityId: "a", modifiedAt: 100, name: "second" }),
    ]);
    expect(latest.get("workout_template:a")?.payload).toEqual({
      name: "second",
    });
  });

  it("does not resurrect older state after a newer tombstone", () => {
    const latest = replayJournal([
      envelope({ entityId: "a", modifiedAt: 300, isDeleted: true }),
      envelope({ entityId: "a", modifiedAt: 200, name: "stale" }),
    ]);
    expect(latest.get("workout_template:a")?.isDeleted).toBe(true);
    expect(liveRecords(latest)).toHaveLength(0);
  });

  it("filters by entity type and tracks the max localVersion", () => {
    const latest = replayJournal(
      [
        envelope({ entityId: "a", modifiedAt: 100, localVersion: 4 }),
        envelope({ entityId: "a", modifiedAt: 200, localVersion: 2 }),
        envelope({ entityId: "w", entityType: "workout", modifiedAt: 500 }),
      ],
      "workout_template",
    );
    expect(latest.size).toBe(1);
    expect(latest.get("workout_template:a")?.localVersion).toBe(4);
  });
});
