import { describe, expect, it } from "vitest";
import {
  formatFirebaseAuthErrorForLog,
  getFirebaseAuthErrorCode,
  mapFirebaseAuthError,
} from "@/libs/firebaseAuthErrors";

describe("mapFirebaseAuthError", () => {
  it("maps invalid-credential to a friendly message", () => {
    const error = {
      code: "auth/invalid-credential",
      message: "Firebase: Error (auth/invalid-credential).",
    };
    expect(mapFirebaseAuthError(error)).toMatch(/Incorrect email or password/i);
    expect(mapFirebaseAuthError(error)).not.toMatch(/Firebase/i);
  });

  it("maps email-already-in-use and weak-password", () => {
    expect(mapFirebaseAuthError({ code: "auth/email-already-in-use" })).toMatch(
      /already exists/i
    );
    expect(mapFirebaseAuthError({ code: "auth/weak-password" })).toMatch(
      /at least 6/i
    );
  });

  it("falls back when code is unknown", () => {
    expect(mapFirebaseAuthError({ code: "auth/mystery" })).toMatch(
      /try again/i
    );
  });

  it("extracts code from Error.message when code is missing", () => {
    const error = new Error("Firebase: Error (auth/too-many-requests).");
    expect(mapFirebaseAuthError(error)).toMatch(/Too many attempts/i);
  });

  it("getFirebaseAuthErrorCode reads code property", () => {
    expect(getFirebaseAuthErrorCode({ code: "auth/invalid-email" })).toBe(
      "auth/invalid-email"
    );
    expect(getFirebaseAuthErrorCode("nope")).toBeNull();
  });

  it("formatFirebaseAuthErrorForLog returns code string only", () => {
    expect(
      formatFirebaseAuthErrorForLog({ code: "auth/invalid-credential" })
    ).toBe("auth/invalid-credential");
    expect(formatFirebaseAuthErrorForLog(new Error("boom"))).toBe("boom");
  });
});
