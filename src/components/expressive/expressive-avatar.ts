import type { ExpressiveAvatar, ExpressiveSentiment } from "@/types/did";

const SAMPLE_THUMBNAIL = "/demo/sample-talking-avatar.png";

export function sampleExpressiveAvatar(name: string, sentiments: ExpressiveSentiment[]): ExpressiveAvatar {
  return {
    id: "demo_avatar",
    name,
    thumbnail_url: SAMPLE_THUMBNAIL,
    provider_details: { provider: "demo" },
    sentiments,
  };
}

export function sampleSentiments(includeFriendly: boolean): ExpressiveSentiment[] {
  const professional: ExpressiveSentiment = {
    id: "demo_sentiment_professional",
    name: "Professional",
    thumbnail_url: SAMPLE_THUMBNAIL,
    voice: { type: "demo" },
  };
  if (!includeFriendly) return [professional];
  return [
    professional,
    {
      id: "demo_sentiment_friendly",
      name: "Friendly",
      thumbnail_url: SAMPLE_THUMBNAIL,
      voice: { type: "demo" },
    },
  ];
}

export function initialSelection(avatars: ExpressiveAvatar[]): {
  avatar: ExpressiveAvatar | null;
  sentiment: ExpressiveSentiment | null;
} {
  const avatar = avatars[0] ?? null;
  return { avatar, sentiment: avatar?.sentiments[0] ?? null };
}
