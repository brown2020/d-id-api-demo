export type DidImageAccessResult = {
  success: boolean;
  method?: "HEAD" | "GET";
  status?: number;
  statusText?: string;
  contentType?: string | null;
  size?: number;
  error?: string;
};

/**
 * Simulates how D-ID accesses image URLs (HEAD then GET).
 * Used by the API route and server actions without an HTTP round-trip.
 */
export async function checkDidImageAccess(
  imageUrl: string
): Promise<DidImageAccessResult> {
  try {
    const headResponse = await fetch(imageUrl, {
      method: "HEAD",
      headers: {
        "User-Agent": "Mozilla/5.0 D-ID-API-Service",
        Accept: "image/png,image/jpeg,image/*;q=0.8",
        Origin: "https://api.d-id.com",
        Referer: "https://api.d-id.com/",
      },
    }).catch(() => null);

    if (headResponse?.ok) {
      return {
        success: true,
        method: "HEAD",
        status: headResponse.status,
        contentType: headResponse.headers.get("content-type"),
      };
    }

    const getResponse = await fetch(imageUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 D-ID-API-Service",
        Accept: "image/png,image/jpeg,image/*;q=0.8",
        Origin: "https://api.d-id.com",
        Referer: "https://api.d-id.com/",
      },
    });

    if (getResponse.ok) {
      const arrayBuffer = await getResponse.arrayBuffer();
      return {
        success: true,
        method: "GET",
        status: getResponse.status,
        contentType: getResponse.headers.get("content-type"),
        size: arrayBuffer.byteLength,
      };
    }

    return {
      success: false,
      method: "GET",
      status: getResponse.status,
      statusText: getResponse.statusText,
      error: `Failed with status ${getResponse.status}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
