// GUARDRAIL 10: opaque, locally generated device identity — a random UUID
// minted on first use, stored in localStorage. Never a hardware identifier.
const STORAGE_KEY = "thymos_builder_device_id";

export function getOrCreateDeviceId(): string {
  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;
  const created = `web-${crypto.randomUUID()}`;
  window.localStorage.setItem(STORAGE_KEY, created);
  return created;
}
