// Typed client for the Ironclad Sync API v1
// (supabase/contracts/sync/v1/sync_v1_openapi.yaml in the app repo).
// Server is relay/journal only (Guardrail 1): the phone's local DB stays the
// source of truth; the web builder reconstructs a read model from the journal.

import { getSupabase } from "../auth/supabaseClient";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config";
import { t } from "../i18n/locale";

export interface SyncRecordHeaderWire {
  principalId: string;
  entityType: string;
  entityId: string;
  localVersion: number;
  lastModifiedAtEpochMs: number;
  lastModifiedDeviceId: string;
  lastMutationId: string;
  originInputChannel: string;
  originDataSource: string;
  isDeleted: boolean;
  deletedAtEpochMs?: number;
}

export interface SyncEnvelopeWire {
  header: SyncRecordHeaderWire;
  payload: Record<string, unknown> | null;
}

export interface PushFailureWire {
  mutationId: string;
  errorCode: string;
  retryable: boolean;
  message?: string;
}

export interface PushResponse {
  acceptedMutationIds: string[];
  failed: PushFailureWire[];
  serverCursorAfter: string | null;
}

export interface PullResponse {
  records: SyncEnvelopeWire[];
  nextCursor: string;
  hasMore: boolean;
}

export type SyncResult<T> =
  | { ok: true; value: T }
  | { ok: false; errorCode: string; message: string; retryAfterSeconds?: number };

async function callSyncFunction<T>(
  name: "sync-v1-push" | "sync-v1-pull",
  body: Record<string, unknown>,
): Promise<SyncResult<T>> {
  const { data } = await getSupabase().auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    return {
      ok: false,
      errorCode: "unauthorized",
      message: t("errSessionExpired"),
    };
  }

  let response: Response;
  try {
    response = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Gateway verification uses the anon key; the user session goes in
        // the dedicated header (see OpenAPI contract).
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "X-Sync-User-Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    return {
      ok: false,
      errorCode: "network_error",
      message: error instanceof Error ? error.message : t("errNetworkFailed"),
    };
  }

  if (!response.ok) {
    let errorCode = "unknown_error";
    let message = `Request failed with status ${response.status}.`;
    try {
      const parsed = (await response.json()) as {
        errorCode?: string;
        message?: string;
      };
      errorCode = parsed.errorCode ?? errorCode;
      message = parsed.message ?? message;
    } catch {
      // Keep the generic message when the body is not JSON.
    }
    const retryAfterRaw = response.headers.get("Retry-After");
    const retryAfterSeconds = retryAfterRaw
      ? Number.parseInt(retryAfterRaw, 10)
      : undefined;
    return {
      ok: false,
      errorCode,
      message,
      retryAfterSeconds: Number.isFinite(retryAfterSeconds)
        ? retryAfterSeconds
        : undefined,
    };
  }

  return { ok: true, value: (await response.json()) as T };
}

export function pushMutations(args: {
  principalId: string;
  deviceId: string;
  mutations: SyncEnvelopeWire[];
}): Promise<SyncResult<PushResponse>> {
  return callSyncFunction<PushResponse>("sync-v1-push", {
    principalId: args.principalId,
    deviceId: args.deviceId,
    contractVersion: "v1",
    mutations: args.mutations,
  });
}

export function pullMutations(args: {
  principalId: string;
  cursor: string | null;
  limit?: number;
}): Promise<SyncResult<PullResponse>> {
  return callSyncFunction<PullResponse>("sync-v1-pull", {
    principalId: args.principalId,
    cursor: args.cursor,
    limit: args.limit ?? 500,
    contractVersion: "v1",
  });
}
