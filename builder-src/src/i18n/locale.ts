import { messages, type Locale, type MessageKey } from "./messages";

/**
 * Locale resolution, in precedence order:
 * 1. URL override `?lang=tr` / `?lang=en` (for checking translations)
 * 2. Device language: any navigator language starting with "tr"
 * 3. Fallback: English
 *
 * Resolved once per page load (module state); SPA navigations keep it.
 */
export function resolveLocale(
  search: string,
  languages: readonly string[],
): Locale {
  const override = new URLSearchParams(search).get("lang")?.toLowerCase();
  if (override === "tr" || override === "en") return override;
  for (const language of languages) {
    if (language.toLowerCase().startsWith("tr")) return "tr";
  }
  return "en";
}

let current: Locale = "en";

export function initLocale(): void {
  const languages =
    navigator.languages && navigator.languages.length > 0
      ? navigator.languages
      : [navigator.language];
  current = resolveLocale(window.location.search, languages);
  document.documentElement.lang = current;
}

export function getLocale(): Locale {
  return current;
}

/** Test hook — production code must use initLocale(). */
export function setLocaleForTests(locale: Locale): void {
  current = locale;
}

/** Translate a key, interpolating `{param}` placeholders. */
export function t(
  key: MessageKey,
  params?: Record<string, string | number>,
): string {
  let text: string = messages[current][key];
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.split(`{${name}}`).join(String(value));
    }
  }
  return text;
}
