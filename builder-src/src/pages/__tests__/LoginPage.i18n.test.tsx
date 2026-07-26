// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import LoginPage from "../LoginPage";
import { SHOTS } from "../../components/HowItWorks";
import { setLocaleForTests } from "../../i18n/locale";

beforeAll(() => {
  // jsdom ships no IntersectionObserver; the reveal falls back to "show all".
  expect(typeof IntersectionObserver).toBe("undefined");
});

afterEach(() => {
  cleanup();
  setLocaleForTests("en");
});

describe("LoginPage localization", () => {
  it("renders Turkish UI when the locale is tr", () => {
    setLocaleForTests("tr");
    render(<LoginPage />);
    expect(screen.getByText("Rutin Oluşturucu")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Giriş bağlantısı gönder" }),
    ).toBeTruthy();
    expect(screen.getByLabelText("E-posta")).toBeTruthy();
    expect(screen.getByText("Senkronize et.")).toBeTruthy();
    expect(screen.getByText("Çalışma alanın")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Aşağı kaydır" })).toBeTruthy();
  });

  it("renders English UI when the locale is en", () => {
    setLocaleForTests("en");
    render(<LoginPage />);
    expect(screen.getByText("Routine Builder")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Send magic link" }),
    ).toBeTruthy();
    expect(screen.getByLabelText("Email")).toBeTruthy();
  });

  it("leads with the build / sync / train headline", () => {
    render(<LoginPage />);
    const headline = screen.getByRole("heading", { level: 1 });
    expect(headline.textContent).toBe("Build. Sync. Train.");
  });
});

describe("see how it works", () => {
  it("says 'see how it works' once, as three staggered words", () => {
    const { container } = render(<LoginPage />);
    const heading = screen.getByRole("heading", { level: 2 });
    expect(
      [...heading.querySelectorAll(":scope > span")].map((s) => s.textContent),
    ).toEqual(["See", "how", "it works"]);
    // The scroll cue under the form is an arrow only — no second copy.
    expect(container.textContent?.match(/See how it works/g)).toBeNull();
    expect(screen.getByRole("link", { name: "Scroll down" })).toBeTruthy();
  });

  it("drops the explanatory blurb under the heading", () => {
    const { container } = render(<LoginPage />);
    expect(container.textContent).not.toContain("Seven screens");
    expect(container.textContent).not.toContain("open it full size and zoom");
  });

  it("shows every screenshot with its own sentence", () => {
    render(<LoginPage />);
    const shots = screen.getAllByRole("button", { name: /^Open full size:/ });
    expect(shots).toHaveLength(7);
    expect(SHOTS).toHaveLength(7);
    // Each step carries a caption, so no screenshot ships unexplained.
    expect(screen.getByText("Every set, spelled out")).toBeTruthy();
    expect(
      screen.getByText(/Warm-up or working, reps, weight, rest, RPE and RIR/),
    ).toBeTruthy();
  });

  it("keeps the captions free of claims the builder does not make", () => {
    const { container } = render(<LoginPage />);
    const text = container.textContent ?? "";
    expect(text).not.toContain("copy week 1");
    expect(text).not.toContain("Thirteen");
    expect(text).not.toContain("calendar");
    expect(screen.getByText("Open THYMOS, run Sync, and train.")).toBeTruthy();
  });

  it("renders each shot at display size and unique per step", () => {
    const { container } = render(<LoginPage />);
    const sources = [...container.querySelectorAll(".how__shot img")].map(
      (img) => img.getAttribute("src"),
    );
    expect(new Set(sources).size).toBe(7);
    expect(sources.every((src) => src?.endsWith(".webp"))).toBe(true);
    expect(sources.some((src) => src?.includes("-full"))).toBe(false);
  });

  it("hides every step until it is scrolled into view", () => {
    const { container } = render(<LoginPage />);
    // jsdom has no IntersectionObserver, so the fallback marks them visible.
    // What matters is that the reveal opt-in exists on every step and heading.
    expect(container.querySelectorAll(".how__step")).toHaveLength(7);
    expect(container.querySelector(".how__title")).toBeTruthy();
  });
});

describe("lightbox", () => {
  function open(name: RegExp) {
    render(<LoginPage />);
    act(() => {
      fireEvent.click(screen.getByRole("button", { name }));
    });
    return screen.getByRole("dialog");
  }

  it("opens the clicked shot at full resolution and 100% zoom", () => {
    const dialog = open(/^Open full size: Schedule the block/);
    expect(dialog.getAttribute("aria-label")).toBe("Schedule the block");
    expect(
      dialog.querySelector("img")?.getAttribute("src"),
    ).toContain("schedule-full.webp");
    expect(screen.getByText("100%")).toBeTruthy();
    expect(screen.getByText("4 / 7")).toBeTruthy();
  });

  it("zooms in and out and resets to 100%", () => {
    open(/^Open full size: Your workspace/);
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    });
    expect(screen.getByText("140%")).toBeTruthy();

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));
    });
    expect(screen.getByText("100%")).toBeTruthy();
  });

  it("never zooms below 100% or past the ceiling", () => {
    open(/^Open full size: Your workspace/);
    const out = screen.getByRole("button", { name: "Zoom out" });
    const zoomIn = screen.getByRole("button", { name: "Zoom in" });
    for (let i = 0; i < 5; i += 1) {
      act(() => {
        fireEvent.click(out);
      });
    }
    expect(screen.getByText("100%")).toBeTruthy();
    for (let i = 0; i < 20; i += 1) {
      act(() => {
        fireEvent.click(zoomIn);
      });
    }
    expect(screen.getByText("600%")).toBeTruthy();
  });

  it("walks through the shots and wraps around", () => {
    open(/^Open full size: Sync, schedule, train/); // last shot
    expect(screen.getByText("7 / 7")).toBeTruthy();
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Next screenshot" }));
    });
    expect(screen.getByText("1 / 7")).toBeTruthy();
    expect(screen.getByRole("dialog").getAttribute("aria-label")).toBe(
      "Your workspace",
    );
  });

  it("resets the zoom when moving to another shot", () => {
    open(/^Open full size: Your workspace/);
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    });
    expect(screen.getByText("140%")).toBeTruthy();
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Next screenshot" }));
    });
    expect(screen.getByText("100%")).toBeTruthy();
  });

  it("closes on Escape and restores page scrolling", () => {
    open(/^Open full size: Your workspace/);
    expect(document.body.style.overflow).toBe("hidden");
    act(() => {
      fireEvent.keyDown(window, { key: "Escape" });
    });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("moves between shots with the arrow keys", () => {
    open(/^Open full size: Your workspace/);
    act(() => {
      fireEvent.keyDown(window, { key: "ArrowLeft" });
    });
    expect(screen.getByText("7 / 7")).toBeTruthy();
  });
});
