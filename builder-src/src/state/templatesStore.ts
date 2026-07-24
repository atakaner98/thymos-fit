// Read-model + pending-change outbox for the web builder (templates AND
// progressive programs).
//
// Model (mirrors the mobile manual-sync product): edits queue locally as
// pending mutations; an explicit "Push to phone" sends them to the journal.
// Failures are always surfaced — no silent catch (Data Integrity rules).
// Pending mutations survive a page refresh via localStorage.
//
// Program convention (mirrors mobile saveProgram): the program envelope
// carries sessions: []; each session is its own program_session mutation.
// On edit, sessions removed from the grid get tombstones — the phone would
// otherwise keep showing orphaned sessions.

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
import {
  buildProgramWirePayload,
  buildProgramSessionWirePayload,
  type ProgressiveProgramDraft,
} from "../models/programWire";

const TEMPLATE_TYPE = "workout_template";
const PROGRAM_TYPE = "progressive_program";
const SESSION_TYPE = "program_session";
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

export interface ProgramListItem {
  entityId: string;
  name: string;
  durationWeeks: number;
  sessionsPerWeek: number;
  sessionCount: number;
  lastModifiedAtEpochMs: number;
  originInputChannel: string;
  hasPendingChanges: boolean;
  payload: Record<string, unknown> | null;
  /** Latest known session payloads for this program (journal + pending). */
  sessionPayloads: Record<string, unknown>[];
}

interface EnqueueItem {
  entityType: string;
  entityId: string;
  label: string;
  payload: Record<string, unknown> | null;
  isDeleted: boolean;
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

    const latest = replayJournal(envelopes);
    for (const record of latest.values()) {
      versionsRef.current.set(
        `${record.entityType}:${record.entityId}`,
        record.localVersion,
      );
    }
    setJournalRecords(liveRecords(latest));
    setHydration({ kind: "ready" });
  }, [principalId]);

  useEffect(() => {
    if (!principalId) return;
    setPendingState(loadPending(principalId));
    void hydrate();
  }, [principalId, hydrate]);

  /** Queue several mutations atomically (single pending-state update). */
  const enqueueMany = useCallback(
    (items: EnqueueItem[]) => {
      if (!principalId || items.length === 0) return;
      const now = Date.now();
      const additions: PendingMutation[] = items.map((item) => {
        const versionKey = `${item.entityType}:${item.entityId}`;
        const nextVersion = (versionsRef.current.get(versionKey) ?? 0) + 1;
        versionsRef.current.set(versionKey, nextVersion);
        return {
          envelope: {
            header: {
              principalId,
              entityType: item.entityType,
              entityId: item.entityId,
              localVersion: nextVersion,
              lastModifiedAtEpochMs: now,
              lastModifiedDeviceId: deviceId,
              // Batch identity must never come from shared timestamps.
              lastMutationId: crypto.randomUUID(),
              originInputChannel: "web_app",
              originDataSource: "manual",
              isDeleted: item.isDeleted,
              ...(item.isDeleted ? { deletedAtEpochMs: now } : {}),
            },
            payload: item.payload,
          },
          label: item.label,
        };
      });

      // One pending mutation per entity: a newer edit replaces the queued one.
      const replaced = new Set(
        items.map((item) => `${item.entityType}:${item.entityId}`),
      );
      const remaining = pending.filter(
        (entry) =>
          !replaced.has(
            `${entry.envelope.header.entityType}:${entry.envelope.header.entityId}`,
          ),
      );
      setPending([...remaining, ...additions]);
      setPushState({ kind: "idle" });
    },
    [principalId, deviceId, pending, setPending],
  );

  const saveTemplate = useCallback(
    (draft: WorkoutTemplateDraft) => {
      enqueueMany([
        {
          entityType: TEMPLATE_TYPE,
          entityId: draft.id,
          label: `Save template "${draft.name}"`,
          payload: buildTemplateWirePayload(draft),
          isDeleted: false,
        },
      ]);
    },
    [enqueueMany],
  );

  const deleteTemplate = useCallback(
    (entityId: string, name: string) => {
      enqueueMany([
        {
          entityType: TEMPLATE_TYPE,
          entityId,
          label: `Delete template "${name}"`,
          payload: null,
          isDeleted: true,
        },
      ]);
    },
    [enqueueMany],
  );

  /** Session ids currently known for a program (journal + pending upserts). */
  const knownSessionIds = useCallback(
    (programId: string): Set<string> => {
      const ids = new Set<string>();
      for (const record of journalRecords) {
        if (
          record.entityType === SESSION_TYPE &&
          record.payload?.programId === programId
        ) {
          ids.add(record.entityId);
        }
      }
      for (const entry of pending) {
        const header = entry.envelope.header;
        if (
          header.entityType === SESSION_TYPE &&
          !header.isDeleted &&
          entry.envelope.payload?.programId === programId
        ) {
          ids.add(header.entityId);
        }
      }
      return ids;
    },
    [journalRecords, pending],
  );

  const saveProgram = useCallback(
    (draft: ProgressiveProgramDraft) => {
      const keptIds = new Set(draft.sessions.map((session) => session.id));
      const removed = [...knownSessionIds(draft.id)].filter(
        (id) => !keptIds.has(id),
      );
      enqueueMany([
        {
          entityType: PROGRAM_TYPE,
          entityId: draft.id,
          label: `Save program "${draft.name}"`,
          payload: buildProgramWirePayload(draft),
          isDeleted: false,
        },
        ...draft.sessions.map((session) => ({
          entityType: SESSION_TYPE,
          entityId: session.id,
          label: `— session W${session.weekIndex}D${session.dayIndex} "${session.title}"`,
          payload: buildProgramSessionWirePayload(session),
          isDeleted: false,
        })),
        ...removed.map((sessionId) => ({
          entityType: SESSION_TYPE,
          entityId: sessionId,
          label: "— remove session no longer in the plan",
          payload: null,
          isDeleted: true,
        })),
      ]);
    },
    [enqueueMany, knownSessionIds],
  );

  const deleteProgram = useCallback(
    (programId: string, name: string) => {
      enqueueMany([
        {
          entityType: PROGRAM_TYPE,
          entityId: programId,
          label: `Delete program "${name}"`,
          payload: null,
          isDeleted: true,
        },
        ...[...knownSessionIds(programId)].map((sessionId) => ({
          entityType: SESSION_TYPE,
          entityId: sessionId,
          label: "— delete its session",
          payload: null,
          isDeleted: true,
        })),
      ]);
    },
    [enqueueMany, knownSessionIds],
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

  const pendingByEntity = useMemo(
    () =>
      new Map(
        pending.map((item) => [
          `${item.envelope.header.entityType}:${item.envelope.header.entityId}`,
          item,
        ]),
      ),
    [pending],
  );

  const templates: TemplateListItem[] = useMemo(() => {
    const byId = new Map<string, TemplateListItem>();
    for (const record of journalRecords) {
      if (record.entityType !== TEMPLATE_TYPE) continue;
      const payload = record.payload;
      byId.set(record.entityId, {
        entityId: record.entityId,
        name: typeof payload?.name === "string" ? payload.name : "(unnamed)",
        exerciseCount: Array.isArray(payload?.exercises)
          ? payload.exercises.length
          : 0,
        lastModifiedAtEpochMs: record.lastModifiedAtEpochMs,
        originInputChannel: record.originInputChannel,
        hasPendingChanges: pendingByEntity.has(
          `${TEMPLATE_TYPE}:${record.entityId}`,
        ),
        payload,
      });
    }
    // Overlay queued (not yet pushed) creations/edits/deletes.
    for (const item of pending) {
      const header = item.envelope.header;
      if (header.entityType !== TEMPLATE_TYPE) continue;
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
  }, [journalRecords, pending, pendingByEntity]);

  const programs: ProgramListItem[] = useMemo(() => {
    // Latest session payloads per program (journal, then pending overlay).
    const sessionsByProgram = new Map<
      string,
      Map<string, Record<string, unknown>>
    >();
    function putSession(payload: Record<string, unknown> | null) {
      const programId = payload?.programId;
      const sessionId = payload?.id;
      if (typeof programId !== "string" || typeof sessionId !== "string") {
        return;
      }
      const bucket =
        sessionsByProgram.get(programId) ??
        new Map<string, Record<string, unknown>>();
      bucket.set(sessionId, payload!);
      sessionsByProgram.set(programId, bucket);
    }
    function dropSession(sessionId: string) {
      for (const bucket of sessionsByProgram.values()) {
        bucket.delete(sessionId);
      }
    }
    for (const record of journalRecords) {
      if (record.entityType === SESSION_TYPE) putSession(record.payload);
    }
    for (const item of pending) {
      const header = item.envelope.header;
      if (header.entityType !== SESSION_TYPE) continue;
      if (header.isDeleted) {
        dropSession(header.entityId);
      } else {
        putSession(item.envelope.payload);
      }
    }

    const byId = new Map<string, ProgramListItem>();
    function putProgram(args: {
      entityId: string;
      payload: Record<string, unknown> | null;
      lastModifiedAtEpochMs: number;
      originInputChannel: string;
      hasPendingChanges: boolean;
    }) {
      const payload = args.payload;
      const sessionPayloads = [
        ...(sessionsByProgram.get(args.entityId)?.values() ?? []),
      ];
      byId.set(args.entityId, {
        entityId: args.entityId,
        name: typeof payload?.name === "string" ? payload.name : "(unnamed)",
        durationWeeks:
          typeof payload?.durationWeeks === "number"
            ? payload.durationWeeks
            : 0,
        sessionsPerWeek:
          typeof payload?.sessionsPerWeek === "number"
            ? payload.sessionsPerWeek
            : 0,
        sessionCount: sessionPayloads.length,
        lastModifiedAtEpochMs: args.lastModifiedAtEpochMs,
        originInputChannel: args.originInputChannel,
        hasPendingChanges: args.hasPendingChanges,
        payload,
        sessionPayloads,
      });
    }
    for (const record of journalRecords) {
      if (record.entityType !== PROGRAM_TYPE) continue;
      putProgram({
        entityId: record.entityId,
        payload: record.payload,
        lastModifiedAtEpochMs: record.lastModifiedAtEpochMs,
        originInputChannel: record.originInputChannel,
        hasPendingChanges: pendingByEntity.has(
          `${PROGRAM_TYPE}:${record.entityId}`,
        ),
      });
    }
    for (const item of pending) {
      const header = item.envelope.header;
      if (header.entityType !== PROGRAM_TYPE) continue;
      if (header.isDeleted) {
        byId.delete(header.entityId);
        continue;
      }
      putProgram({
        entityId: header.entityId,
        payload: item.envelope.payload,
        lastModifiedAtEpochMs: header.lastModifiedAtEpochMs,
        originInputChannel: header.originInputChannel,
        hasPendingChanges: true,
      });
    }
    return [...byId.values()].sort(
      (a, b) => b.lastModifiedAtEpochMs - a.lastModifiedAtEpochMs,
    );
  }, [journalRecords, pending, pendingByEntity]);

  return {
    hydration,
    pushState,
    templates,
    programs,
    pending,
    hydrate,
    saveTemplate,
    deleteTemplate,
    saveProgram,
    deleteProgram,
    pushPending,
  };
}
