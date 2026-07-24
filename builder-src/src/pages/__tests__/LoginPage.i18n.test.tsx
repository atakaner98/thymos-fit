// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import LoginPage from "../LoginPage";
import { setLocaleForTests } from "../../i18n/locale";

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
});
