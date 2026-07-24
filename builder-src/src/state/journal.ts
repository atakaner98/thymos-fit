import type { SyncEnvelopeWire } from "../api/syncClient";

export interface EntityRecord {
  entityId: string;
  entityType: string;
  /** Highest localVersion observed for this entity in the journal. */
  localVersion: number;
  lastModifiedAtEpochMs: number;
  originInputChannel: string;
  isDeleted: boolean;
  payload: Record<string, unknown> | null;
}

/**
 * Replays journal envelopes (in server_seq order) into latest-state-per-entity.
 *
 * Read-model note: the phone resolves conflicts with field-level LWW +
 * tombstones (field_lww_tombstone_v1); for the builder's display/edit
 * purposes an entity-level LWW by lastModifiedAtEpochMs is sufficient —
 * ties resolve to the later journal entry (replay order), matching the
 * "most recent modifiedAt wins" rule of Guardrail 10.
 */
export function replayJournal(
  envelopes: SyncEnvelopeWire[],
  entityTypeFilter?: string,
): Map<string, EntityRecord> {
  const latest = new Map<string, EntityRecord>();
  for (const envelope of envelopes) {
    const header = envelope.header;
    if (!header?.entityId || !header.entityType) continue;
    if (entityTypeFilter && header.entityType !== entityTypeFilter) continue;

    const key = `${header.entityType}:${header.entityId}`;
    const existing = latest.get(key);
    if (
      existing &&
      existing.lastModifiedAtEpochMs > header.lastModifiedAtEpochMs
    ) {
      continue;
    }
    latest.set(key, {
      entityId: header.entityId,
      entityType: header.entityType,
      localVersion: Math.max(
        header.localVersion ?? 0,
        existing?.localVersion ?? 0,
      ),
      lastModifiedAtEpochMs: header.lastModifiedAtEpochMs,
      originInputChannel: header.originInputChannel,
      isDeleted: header.isDeleted === true,
      payload: envelope.payload ?? null,
    });
  }
  return latest;
}

export function liveRecords(
  latest: Map<string, EntityRecord>,
): EntityRecord[] {
  return [...latest.values()].filter((record) => !record.isDeleted);
}
