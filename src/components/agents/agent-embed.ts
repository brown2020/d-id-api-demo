import type { Agent } from "@/types/did";

const DEFAULT_PRESENTER_ID = "v2_public_Amber@0zSz8kflCN";
const DEFAULT_VOICE_ID = "en-US-JennyMultilingualV2Neural";

export function buildDemoAgent(name: string, createdAtMs: number): Agent {
  return {
    id: `demo_agent_${createdAtMs}`,
    preview_name: `${name} (Demo)`,
    presenter: {
      type: "clip",
      presenter_id: DEFAULT_PRESENTER_ID,
      voice: {
        type: "microsoft",
        voice_id: DEFAULT_VOICE_ID,
      },
    },
    created_at: new Date(createdAtMs).toISOString(),
  };
}

export function agentEmbedMarkup(
  agentId: string,
  clientKey: string | null,
  showDemoEmbed: boolean,
): string {
  if (showDemoEmbed) {
    return embedScript("YOUR_CLIENT_KEY_HERE", agentId);
  }
  if (!clientKey) return "";
  return embedScript(clientKey, agentId);
}

export function formatAgentCreatedAt(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString("en-US", { timeZone: "UTC" });
}

function embedScript(clientKey: string, agentId: string): string {
  return `<script
  type="module"
  src="https://agent.d-id.com/v2/index.js"
  data-mode="fabio"
  data-client-key="${clientKey}"
  data-agent-id="${agentId}"
  data-name="did-agent"
></script>`;
}
