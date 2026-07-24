import { afterEach, describe, expect, it } from "vitest";
import { resolveLocale, setLocaleForTests, t } from "../locale";
import { messages, type MessageKey } from "../messages";

afterEach(() => setLocaleForTests("en"));

describe("resolveLocale", () => {
  it("URL ?lang= override wins over the device language", () => {
    expect(resolveLocale("?lang=tr", ["en-US"])).toBe("tr");
    expect(resolveLocale("?lang=en", ["tr-TR"])).toBe("en");
    expect(resolveLocale("?foo=1&lang=TR", ["en-US"])).toBe("tr");
  });

  it("ignores unknown overrides and falls back to the device language", () => {
    expect(resolveLocale("?lang=de", ["tr-TR"])).toBe("tr");
    expect(resolveLocale("?lang=", ["tr"])).toBe("tr");
  });

  it("device language tr (any region) resolves to tr", () => {
    expect(resolveLocale("", ["tr-TR", "en-US"])).toBe("tr");
    expect(resolveLocale("", ["tr"])).toBe("tr");
    expect(resolveLocale("", ["en-US", "tr-TR"])).toBe("tr");
  });

  it("non-Turkish device languages fall back to English", () => {
    expect(resolveLocale("", ["en-US"])).toBe("en");
    expect(resolveLocale("", ["de-DE", "fr-FR"])).toBe("en");
    expect(resolveLocale("", [])).toBe("en");
  });
});

describe("t()", () => {
  it("returns the active locale's string with interpolation", () => {
    setLocaleForTests("en");
    expect(t("exercisesCount", { n: 5 })).toBe("5 exercises");
    setLocaleForTests("tr");
    expect(t("exercisesCount", { n: 5 })).toBe("5 egzersiz");
    expect(t("weekN", { n: 3 })).toBe("Hafta 3");
  });
});

describe("message dictionaries", () => {
  it("tr covers every en key with non-empty text (compile-checked too)", () => {
    for (const key of Object.keys(messages.en) as MessageKey[]) {
      expect(messages.tr[key], `tr missing ${key}`).toBeTruthy();
    }
  });

  it("placeholders match between en and tr for every key", () => {
    const tokens = (text: string) =>
      [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
    for (const key of Object.keys(messages.en) as MessageKey[]) {
      expect(tokens(messages.tr[key]), `placeholder drift in ${key}`).toEqual(
        tokens(messages.en[key]),
      );
    }
  });
});
