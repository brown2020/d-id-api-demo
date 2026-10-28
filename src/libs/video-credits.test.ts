import { describe, expect, it } from "vitest";

import {
  VIDEO_GENERATION_CREDIT_COST,
  balanceAfterVideoDebit,
} from "@/libs/video-credits";

describe("balanceAfterVideoDebit", () => {
  it("debits the fixed per-video cost", () => {
    expect(VIDEO_GENERATION_CREDIT_COST).toBe(1);
    expect(balanceAfterVideoDebit(1000)).toBe(999);
  });

  it("rejects balances that cannot cover a video", () => {
    expect(balanceAfterVideoDebit(0)).toBeNull();
    expect(balanceAfterVideoDebit(Number.NaN)).toBeNull();
  });
});
