// Template read-model + pending-change outbox for the web builder.
//
// Model (mirrors the mobile manual-sync product): edits queue locally as
// pending mutations; an explicit "Push to phone" sends them to the journal.
// Failures are always surfaced — no silent catch (Data Integrity rules).
// Pending mutations survive a page refresh via localStorage.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  pullMutations,
  pushMutations,
  type SyncEnvelopeWire,
  type PushFailureWire,
} from "../api/syncClient";
import { replayJournal, liveRecords, type EntityRecord } from "./journal";
import { getOrCreateDeviceId } from "./deviceId";
import { buildTemplateWirePayload } from "../models/templatePayload";
import type { WorkoutTemplateDraft } from "../models/wire";

const ENTITY_TYPE = "workout_template";
const PENDING_STORAGE_PREFIX = "thymos_builder_pending_v1:";

export type HydrationState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "error"; message: string };

export type PushState =
  | { kind: "idle" }
  | { kind: "pushing" }
  | { kind: "done"; accepted: number }
  | {
      kind: "error";
      message: string;
      retryAfterSeconds?: number;
      failures: PushFailureWire[];
    };

export interface PendingMutation {
  envelope: SyncEnvelopeWire;
  /** Human-readable label for the pending-changes list. */
  label: string;
  lastFailure?: PushFailureWire;
}

export interface TemplateListItem {
  entityId: string;
  name: string;
  exerciseCount: number;
  lastModifiedAtEpochMs: number;
  originInputChannel: string;
  hasPendingChanges: boolean;
  payload: Record<string, unknown> | null;
}

function pendingStorageKey(principalId: string): string {
  return `${PENDING_STORAGE_PREFIX}${principalId}`;
}

function loadPending(principalId: string): PendingMutation[] {
  try {
    const raw = window.localStorage.getItem(pendingStorageKey(principalId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PendingMutation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Corrupted drafts must not brick the builder; the journal remains the
    // recoverable source. Surface as empty and let the user re-edit.
    return [];
  }
}

function savePending(principalId: string, pending: PendingMutation[]): void {
  window.localStorage.setItem(
    pendingStorageKey(principalId),
    JSON.stringify(pending),
  );
}

export function useTemplatesStore(userId: string | null) {
  const principalId = userId ? `acct:${userId}` : null;
  const deviceId = useMemo(() => getOrCreateDeviceId(), []);

  const [hydration, setHydration] = useState<HydrationState>({ kind: "idle" });
  const [pushState, setPushState] = useState<PushState>({ kind: "idle" });
  const [journalRecords, setJournalRecords] = useState<EntityRecord[]>([]);
  const [pending, setPendingState] = useState<PendingMutation[]>([]);
  const versionsRef = useRef<Map<string, number>>(new Map());

  const setPending = useCallback(
    (next: PendingMutation[]) => {
      setPendingState(next);
      if (principalId) savePending(principalId, next);
    },
    [principalId],
  );

  const hydrate = useCallback(async () => {
    if (!principalId) return;
    setHydration({ kind: "loading" });
    const envelopes: SyncEnvelopeWire[] = [];
    let cursor: string | null = null;
    for (;;) {
      const result = await pullMutations({ principalId, cursor });
      if (!result.ok) {
        setHydration({
          kind: "error",
          message: result.retryAfterSeconds
            ? `${result.message} (retry in ~${result.retryAfterSeconds}s)`
            : result.message,
        });
        return;
      }
      envelopes.push(...result.value.records);
      if (!result.value.hasMore) break;
      cursor = result.value.nextCursor;
    }

    const latest = replayJournal(envelopes, ENTITY_TYPE);
    for (const record of latest.values()) {
      versionsRef.current.set(record.entityId, record.localVersion);
    }
    setJournalRecords(liveRecords(latest));
    setHydration({ kind: "ready" });
  }, [principalId]);

  useEffect(() => {
    if (!principalId) return;
    setPendingState(loadPending(principalId));
    void hydrate();
  }, [principalId, hydrate]);

  const enqueue = useCallback(
    (args: {
      entityId: string;
      label: string;
      payload: Record<string, unknown> | null;
      isDeleted: boolean;
    }) => {
      if (!principalId) return;
      const now = Date.now();
      const nextVersion =
        (versionsRef.current.get(args.entityId) ?? 0) + 1;
      versionsRef.current.set(args.entityId, nextVersion);

      const envelope: SyncEnvelopeWire = {
        header: {
          principalId,
          entityType: ENTITY_TYPE,
          entityId: args.entityId,
          localVersion: nextVersion,
          lastModifiedAtEpochMs: now,
          lastModifiedDeviceId: deviceId,
          // Batch identity must never come from shared timestamps.
          lastMutationId: crypto.randomUUID(),
          originInputChannel: "web_app",
          originDataSource: "manual",
          isDeleted: args.isDeleted,
          ...(args.isDeleted ? { deletedAtEpochMs: now } : {}),
        },
        payload: args.payload,
      };

      // One pending mutation per entity: a newer edit replaces the queued one.
      const remaining = pending.filter(
        (item) => item.envelope.header.entityId !== args.entityId,
      );
      setPending([...remaining, { envelope, label: args.label }]);
      setPushState({ kind: "idle" });
    },
    [principalId, deviceId, pending, setPending],
  );

  const saveTemplate = useCallback(
    (draft: WorkoutTemplateDraft) => {
      enqueue({
        entityId: draft.id,
        label: `Save "${draft.name}"`,
        payload: buildTemplateWirePayload(draft),
        isDeleted: false,
      });
    },
    [enqueue],
  );

  const deleteTemplate = useCallback(
    (entityId: string, name: string) => {
      enqueue({
        entityId,
        label: `Delete "${name}"`,
        payload: null,
        isDeleted: true,
      });
    },
    [enqueue],
  );

  const pushPending = useCallback(async () => {
    if (!principalId || pending.length === 0) return;
    setPushState({ kind: "pushing" });
    const result = await pushMutations({
      principalId,
      deviceId,
      mutations: pending.map((item) => item.envelope),
    });

    if (!result.ok) {
      setPushState({
        kind: "error",
        message: result.message,
        retryAfterSeconds: result.retryAfterSeconds,
        failures: [],
      });
      return;
    }

    const accepted = new Set(result.value.acceptedMutationIds);
    const failuresById = new Map(
      result.value.failed.map((failure) => [failure.mutationId, failure]),
    );
    const stillPending = pending
      .filter((item) => !accepted.has(item.envelope.header.lastMutationId))
      .map((item) => ({
        ...item,
        lastFailure:
          failuresById.get(item.envelope.header.lastMutationId) ??
          item.lastFailure,
      }));
    setPending(stillPending);

    if (stillPending.length > 0) {
      setPushState({
        kind: "error",
        message: `${accepted.size} change(s) pushed, ${stillPending.length} rejected — see details below.`,
        failures: result.value.failed,
      });
    } else {
      setPushState({ kind: "done", accepted: accepted.size });
    }
    // Refresh the read model so the list reflects the journal's new state.
    await hydrate();
  }, [principalId, deviceId, pending, setPending, hydrate]);

  const templates: TemplateListItem[] = useMemo(() => {
    const pendingByEntity = new Map(
      pending.map((item) => [item.envelope.header.entityId, item]),
    );

    const byId = new Map<string, TemplateListItem>();
    for (const record of journalRecords) {
      const payload = record.payload;
      byId.set(record.entityId, {
        entityId: record.entityId,
        name: typeof payload?.name === "string" ? payload.name : "(unnamed)",
        exerciseCount: Array.isArray(payload?.exercises)
          ? payload.exercises.length
          : 0,
        lastModifiedAtEpochMs: record.lastModifiedAtEpochMs,
        originInputChannel: record.originInputChannel,
        hasPendingChanges: pendingByEntity.has(record.entityId),
        payload,
      });
    }
    // Overlay queued (not yet pushed) creations/edits/deletes.
    for (const item of pending) {
      const header = item.envelope.header;
      if (header.isDeleted) {
        byId.delete(header.entityId);
        continue;
      }
      const payload = item.envelope.payload;
      byId.set(header.entityId, {
        entityId: header.entityId,
        name: typeof payload?.name === "string" ? payload.name : "(unnamed)",
        exerciseCount: Array.isArray(payload?.exercises)
          ? payload.exercises.length
          : 0,
        lastModifiedAtEpochMs: header.lastModifiedAtEpochMs,
        originInputChannel: header.originInputChannel,
        hasPendingChanges: true,
        payload,
      });
    }
    return [...byId.values()].sort(
      (a, b) => b.lastModifiedAtEpochMs - a.lastModifiedAtEpochMs,
    );
  }, [journalRecords, pending]);

  return {
    hydration,
    pushState,
    templates,
    pending,
    hydrate,
    saveTemplate,
    deleteTemplate,
    pushPending,
  };
}
