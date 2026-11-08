import { expect, it } from "vitest";
import { initialSelection, sampleExpressiveAvatar, sampleSentiments } from "./expressive-avatar";

it("selects the first avatar and its first sentiment", () => {
  const avatar = sampleExpressiveAvatar("Demo Avatar (Sample)", sampleSentiments(true));
  expect(initialSelection([avatar])).toEqual({
    avatar,
    sentiment: avatar.sentiments[0],
  });
  expect(initialSelection([])).toEqual({ avatar: null, sentiment: null });
});
