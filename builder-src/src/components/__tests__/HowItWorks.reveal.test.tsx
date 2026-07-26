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
