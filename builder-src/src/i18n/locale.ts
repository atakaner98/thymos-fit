import { messages, type Locale, type MessageKey } from "./messages";

/**
 * Locale resolution, in precedence order:
 * 1. URL query override `?lang=tr` / `?lang=en`
 * 2. URL path override — a trailing `/en` or `/tr` segment (served by the
 *    physical /builder/en/ and /builder/tr/ folder files)
 * 3. Device language: any navigator language starting with "tr"
 * 4. Fallback: English
 *
 * Resolved once per page load (module state); SPA navigations keep it.
 */
export function resolveLocale(
  search: string,
  pathname: string,
  languages: readonly string[],
): Locale {
  const query = new URLSearchParams(search).get("lang")?.toLowerCase();
  if (query === "tr" || query === "en") return query;

  const pathMatch = pathname.toLowerCase().match(/\/(en|tr)\/?$/);
  if (pathMatch) return pathMatch[1] as Locale;

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
  current = resolveLocale(
    window.location.search,
    window.location.pathname,
    languages,
  );
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
