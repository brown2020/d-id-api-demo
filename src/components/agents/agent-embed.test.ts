import { expect, it } from "vitest";
import { agentEmbedMarkup, buildDemoAgent, formatAgentCreatedAt } from "./agent-embed";

it("builds a local demo agent without a D-ID request", () => {
  const agent = buildDemoAgent("Support", 1_700_000_000_000);
  expect(agent.id).toBe("demo_agent_1700000000000");
  expect(agent.preview_name).toBe("Support (Demo)");
  expect(agent.presenter.presenter_id).toBe("v2_public_Amber@0zSz8kflCN");
  expect(agent.created_at).toBe(new Date(1_700_000_000_000).toISOString());
});

it("shows a placeholder client key in demo embed markup", () => {
  const markup = agentEmbedMarkup("agent-1", null, true);
  expect(markup).toContain('data-client-key="YOUR_CLIENT_KEY_HERE"');
  expect(markup).toContain('data-agent-id="agent-1"');
});

it("formats created dates with an explicit UTC locale", () => {
  expect(formatAgentCreatedAt("2026-03-01T23:30:00.000Z")).toBe("3/1/2026");
});

it("waits for a real client key before rendering embed markup", () => {
  expect(agentEmbedMarkup("agent-1", null, false)).toBe("");
  expect(agentEmbedMarkup("agent-1", "ck_live", false)).toContain(
    'data-client-key="ck_live"',
  );
});
