import { afterEach, describe, expect, it, vi } from "vitest";

import { isLocalDevelopment } from "@/libs/deploy-env";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isLocalDevelopment", () => {
  it("allows a local next dev process", () => {
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(isLocalDevelopment()).toBe(true);
  });

  it("blocks Vercel preview and production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(isLocalDevelopment()).toBe(false);
    vi.stubEnv("VERCEL_ENV", "production");
    expect(isLocalDevelopment()).toBe(false);
  });

  it("blocks non-Vercel production", () => {
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(isLocalDevelopment()).toBe(false);
  });
});
