// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import HowItWorks from "../HowItWorks";

type Observed = { target: Element };

let observed: Observed[] = [];
let fire: (targets: Element[]) => void = () => {};

class FakeIntersectionObserver {
  constructor(private callback: IntersectionObserverCallback) {
    fire = (targets) =>
      this.callback(
        targets.map(
          (target) =>
            ({ target, isIntersecting: true }) as IntersectionObserverEntry,
        ),
        this as unknown as IntersectionObserver,
      );
  }
  observe(target: Element) {
    observed.push({ target });
  }
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  observed = [];
  // Default browser state: motion allowed, so the reveal is armed.
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({ matches: false, addListener() {}, removeListener() {} }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("scroll reveal", () => {
  it("starts with the heading and every step hidden", () => {
    const { container } = render(<HowItWorks />);
    const revealables = container.querySelectorAll(".how__title, .how__step");
    expect(revealables).toHaveLength(8); // heading + 7 steps
    revealables.forEach((node) => {
      expect(node.classList.contains("is-in")).toBe(false);
    });
  });

  it("observes the heading and every step", () => {
    render(<HowItWorks />);
    expect(observed).toHaveLength(8);
  });

  it("reveals only what has scrolled into view", () => {
    const { container } = render(<HowItWorks />);
    const heading = container.querySelector(".how__title") as HTMLElement;
    const steps = [
      ...container.querySelectorAll(".how__step"),
    ] as HTMLElement[];

    act(() => fire([heading]));
    expect(heading.classList.contains("is-in")).toBe(true);
    // Steps further down the page stay hidden until they are reached.
    expect(steps.every((step) => !step.classList.contains("is-in"))).toBe(true);

    act(() => fire([steps[0], steps[1]]));
    expect(steps[0].classList.contains("is-in")).toBe(true);
    expect(steps[1].classList.contains("is-in")).toBe(true);
    expect(steps[2].classList.contains("is-in")).toBe(false);
  });

  it("fills the timeline rail and parallaxes the shots on scroll", () => {
    const { container } = render(<HowItWorks />);
    const list = container.querySelector(".how__steps") as HTMLElement;
    // jsdom reports every rect as 0×0, so the ratio pins to a clamp bound —
    // what this proves is that the frame runs and only writes custom props.
    expect(list.style.getPropertyValue("--rail")).not.toBe("");
    const rail = Number(list.style.getPropertyValue("--rail"));
    expect(rail).toBeGreaterThanOrEqual(0);
    expect(rail).toBeLessThanOrEqual(1);

    const cards = [...container.querySelectorAll(".how__shot")];
    expect(cards).toHaveLength(7);
    cards.forEach((card) => {
      const offset = (card as HTMLElement).style.getPropertyValue("--p");
      expect(offset).toMatch(/^-?\d+(\.\d+)?px$/);
      // The card drifts, never the image: the stylesheet owns `transform`, so
      // the screenshot itself is never scaled or clipped to hide the travel.
      expect((card as HTMLElement).style.transform).toBe("");
    });
    container.querySelectorAll(".how__shot img").forEach((img) => {
      expect((img as HTMLElement).style.transform).toBe("");
    });
  });

  it("runs no scroll work at all under reduced motion", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: true, addListener() {}, removeListener() {} }),
    );
    const { container } = render(<HowItWorks />);
    const list = container.querySelector(".how__steps") as HTMLElement;
    expect(list.style.getPropertyValue("--rail")).toBe("");
    container.querySelectorAll(".how__shot").forEach((card) => {
      expect((card as HTMLElement).style.getPropertyValue("--p")).toBe("");
    });
  });

  it("shows everything up front when the user asks for reduced motion", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: true, addListener() {}, removeListener() {} }),
    );
    const { container } = render(<HowItWorks />);
    container.querySelectorAll(".how__title, .how__step").forEach((node) => {
      expect(node.classList.contains("is-in")).toBe(true);
    });
    expect(observed).toHaveLength(0);
  });
});
