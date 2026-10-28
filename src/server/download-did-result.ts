import { isAllowedDidResultUrl, maxDidResultBytes } from "@/libs/did-result-url";

export async function downloadDidResultVideo(resultUrl: string): Promise<Buffer> {
  if (!isAllowedDidResultUrl(resultUrl)) {
    throw new Error("Untrusted video URL");
  }

  const response = await fetch(resultUrl, { redirect: "error" });
  if (!response.ok || !response.body) {
    throw new Error("Video download failed");
  }

  const declared = Number(response.headers.get("content-length") ?? 0);
  if (Number.isFinite(declared) && declared > maxDidResultBytes()) {
    throw new Error("Video is too large");
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    if (!value) {
      continue;
    }
    total += value.byteLength;
    if (total > maxDidResultBytes()) {
      throw new Error("Video is too large");
    }
    chunks.push(value);
  }

  return Buffer.concat(chunks);
}
