"use server";

import { ExpressiveAvatar } from "@/types/did";
import { resolveDidCredentials } from "@/libs/did-demo";

export async function listExpressiveAvatars(
  apiKey: string | null,
  basicAuth: string | null,
  limit: number = 200
): Promise<{ status: boolean; avatars?: ExpressiveAvatar[]; message?: string }> {
  try {
    const credentials = resolveDidCredentials(apiKey, basicAuth);
    
    if (!credentials) {
      return {
        status: false,
        message: "D-ID API key required. Please add your key in Profile.",
      };
    }

    const url = `https://api.d-id.com/expressives/avatars?limit=${limit}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("D-ID API error:", response.status, errorText);
      
      if (response.status === 401 || response.status === 403) {
        return {
          status: false,
          message: "Authentication failed. Please check your D-ID API key.",
        };
      }
      
      return {
        status: false,
        message: `Failed to fetch avatars: ${response.status}`,
      };
    }

    const data = await response.json();
    const avatars: ExpressiveAvatar[] = data.avatars || [];

    return {
      status: true,
      avatars,
    };
  } catch (error) {
    console.error("Error listing expressive avatars:", error);
    return {
      status: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function getExpressiveAvatar(
  avatarId: string,
  apiKey: string | null,
  basicAuth: string | null
): Promise<{ status: boolean; avatar?: ExpressiveAvatar; message?: string }> {
  try {
    const credentials = resolveDidCredentials(apiKey, basicAuth);
    
    if (!credentials) {
      return {
        status: false,
        message: "D-ID API key required",
      };
    }

    const url = `https://api.d-id.com/expressives/avatars/${avatarId}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return {
        status: false,
        message: `Failed to fetch avatar: ${response.status}`,
      };
    }

    const avatar: ExpressiveAvatar = await response.json();

    return {
      status: true,
      avatar,
    };
  } catch (error) {
    console.error("Error getting expressive avatar:", error);
    return {
      status: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
