// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import LoginPage, { resolveShowcaseVariant } from "../LoginPage";
import { setLocaleForTests } from "../../i18n/locale";

function visit(search: string): void {
  window.history.replaceState({}, "", `/${search}`);
}

afterEach(() => {
  cleanup();
  setLocaleForTests("en");
  visit("");
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

  it("localizes the showcase caption, step strip and logo alt text", () => {
    setLocaleForTests("tr");
    render(<LoginPage />);
    expect(screen.getByText("Tüm planın tek listede")).toBeTruthy();
    expect(screen.getByText("Antrenman")).toBeTruthy();
    expect(screen.getByAltText("THYMOS logosu")).toBeTruthy();
  });
});

describe("showcase variant selection", () => {
  it("defaults to the carousel and ignores unknown values", () => {
    expect(resolveShowcaseVariant("")).toBe("carousel");
    expect(resolveShowcaseVariant("?showcase=sparkles")).toBe("carousel");
  });

  it("reads the known variants from the query string", () => {
    expect(resolveShowcaseVariant("?showcase=collage")).toBe("collage");
    expect(resolveShowcaseVariant("?showcase=BACKDROP")).toBe("backdrop");
  });

  it("keeps the sign-in form in every variant", () => {
    for (const variant of ["carousel", "collage", "backdrop"]) {
      visit(`?showcase=${variant}`);
      render(<LoginPage />);
      expect(screen.getByLabelText("Email")).toBeTruthy();
      expect(
        screen.getByRole("button", { name: "Send magic link" }),
      ).toBeTruthy();
      cleanup();
    }
  });

  it("drops the screenshot panel in the backdrop variant", () => {
    visit("?showcase=backdrop");
    render(<LoginPage />);
    expect(screen.queryByLabelText("What the builder looks like")).toBeNull();
    // The build -> push -> train story still ships without the panel.
    expect(screen.getByText("Train")).toBeTruthy();
  });
});

describe("showcase carousel", () => {
  it("shows the selected frame's caption when a dot is clicked", () => {
    render(<LoginPage />);
    expect(screen.getByText("Your whole plan, one list")).toBeTruthy();

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Show screenshot 3" }));
    });

    expect(screen.getByText("Multi-week programs")).toBeTruthy();
    expect(screen.queryByText("Your whole plan, one list")).toBeNull();
  });
});
