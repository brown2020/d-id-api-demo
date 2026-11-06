"use server";

import { Agent, AgentClientKey } from "@/types/did";
import { resolveDidCredentials } from "@/libs/did-demo";
import { requireAuth } from "./auth";
import { adminDb } from "@/firebase/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";

const AGENTS_COLLECTION = "agents";

export async function createAgent(
  previewName: string,
  presenterId: string,
  voiceType: string,
  voiceId: string,
  apiKey: string | null,
  basicAuth: string | null
): Promise<{
  status: boolean;
  agent?: Agent;
  message?: string;
}> {
  let userId: string;
  try {
    userId = await requireAuth();
  } catch (error) {
    return {
      status: false,
      message: error instanceof Error ? error.message : "Authentication required",
    };
  }

  try {
    const credentials = resolveDidCredentials(apiKey, basicAuth);

    if (!credentials) {
      return {
        status: false,
        message: "D-ID API key required. Please add your key in Profile.",
      };
    }

    const url = "https://api.d-id.com/agents";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        preview_name: previewName,
        presenter: {
          type: "clip",
          presenter_id: presenterId,
          voice: {
            type: voiceType,
            voice_id: voiceId,
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("D-ID agents API error:", response.status, errorText);

      if (response.status === 401 || response.status === 403) {
        return {
          status: false,
          message: "Authentication failed. Please check your D-ID API key.",
        };
      }

      return {
        status: false,
        message: `Failed to create agent: ${response.status}`,
      };
    }

    const agent: Agent = await response.json();

    const agentRef = adminDb.collection(AGENTS_COLLECTION).doc(agent.id);
    await agentRef.set({
      id: agent.id,
      owner: userId,
      preview_name: agent.preview_name,
      presenter: agent.presenter,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    });

    return {
      status: true,
      agent,
      message: "Agent created successfully",
    };
  } catch (error) {
    console.error("Error creating agent:", error);
    return {
      status: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function listUserAgents(): Promise<{
  status: boolean;
  agents?: Agent[];
  message?: string;
}> {
  let userId: string;
  try {
    userId = await requireAuth();
  } catch (error) {
    return {
      status: false,
      message: error instanceof Error ? error.message : "Authentication required",
    };
  }

  try {
    const snapshot = await adminDb
      .collection(AGENTS_COLLECTION)
      .where("owner", "==", userId)
      .orderBy("created_at", "desc")
      .limit(50)
      .get();

    const agents: Agent[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: data.id || doc.id,
        preview_name: data.preview_name,
        presenter: data.presenter,
        llm: data.llm,
        knowledge: data.knowledge,
        created_at: data.created_at?.toDate().toISOString(),
        updated_at: data.updated_at?.toDate().toISOString(),
      };
    });

    return {
      status: true,
      agents,
    };
  } catch (error) {
    console.error("Error listing user agents:", error);
    return {
      status: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function createAgentClientKey(
  allowedDomains: string[],
  apiKey: string | null,
  basicAuth: string | null
): Promise<{
  status: boolean;
  clientKey?: AgentClientKey;
  message?: string;
}> {
  try {
    await requireAuth();
  } catch (error) {
    return {
      status: false,
      message: error instanceof Error ? error.message : "Authentication required",
    };
  }

  try {
    const credentials = resolveDidCredentials(apiKey, basicAuth);

    if (!credentials) {
      return {
        status: false,
        message: "D-ID API key required. Please add your key in Profile.",
      };
    }

    const url = "https://api.d-id.com/agents/client-key";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        allowed_domains: allowedDomains,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("D-ID client key API error:", response.status, errorText);

      if (response.status === 401 || response.status === 403) {
        return {
          status: false,
          message: "Authentication failed. Please check your D-ID API key.",
        };
      }

      return {
        status: false,
        message: `Failed to create client key: ${response.status}`,
      };
    }

    const clientKey: AgentClientKey = await response.json();

    return {
      status: true,
      clientKey,
      message: "Client key created successfully",
    };
  } catch (error) {
    console.error("Error creating agent client key:", error);
    return {
      status: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
