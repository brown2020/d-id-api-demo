"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import useProfileStore from "@/zustand/useProfileStore";
import { createAgent, listUserAgents, createAgentClientKey } from "@/actions/agents";
import type { Agent } from "@/types/did";
import { Loader2, MessageSquare, Bot, Copy, Check, ExternalLink } from "lucide-react";
import { agentEmbedMarkup, buildDemoAgent, formatAgentCreatedAt } from "./agent-embed";

const DEFAULT_PRESENTER_ID = "v2_public_Amber@0zSz8kflCN";
const DEFAULT_VOICE_ID = "en-US-JennyMultilingualV2Neural";

export default function AgentManager() {
  const profile = useProfileStore((state) => state.profile);
  const { did_api_key: didApiKey, did_basic_auth: didBasicAuth } = profile;
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [clientKey, setClientKey] = useState<string | null>(null);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [showDemoEmbed, setShowDemoEmbed] = useState(false);

  const hasApiKey = !!(didApiKey || didBasicAuth);

  useEffect(() => {
    let ignore = false;
    listUserAgents().then((result) => {
      if (ignore) return;
      if (result.status && result.agents) setAgents(result.agents);
      setLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, []);

  const handleCreateAgent = async () => {
    if (!agentName.trim()) return;
    if (hasApiKey) setCreating(true);
    try {
      const created = await createNamedAgent({
        name: agentName,
        hasApiKey,
        didApiKey,
        didBasicAuth,
      });
      if (!created) return;
      setAgents((current) => [created.agent, ...current]);
      setAgentName("");
      setShowCreateForm(false);
      setSelectedAgent(created.agent);
      setShowDemoEmbed(created.demo);
    } finally {
      setCreating(false);
    }
  };

  const handleGenerateClientKey = async () => {
    if (!selectedAgent) return;
    setGeneratingKey(true);
    const currentOrigin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const result = await createAgentClientKey([currentOrigin], didApiKey, didBasicAuth);
    if (result.status && result.clientKey) {
      setClientKey(result.clientKey.client_key);
    }
    setGeneratingKey(false);
  };

  const copyToClipboard = async (text: string, type: "key" | "embed") => {
    await navigator.clipboard.writeText(text);
    if (type === "key") {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
      return;
    }
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const embedCode = selectedAgent
    ? agentEmbedMarkup(selectedAgent.id, clientKey, showDemoEmbed)
    : "";

  return (
    <div className="max-w-6xl mx-auto">
      <AgentHeader hasApiKey={hasApiKey} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AgentColumn
          agents={agents}
          selectedAgent={selectedAgent}
          showCreateForm={showCreateForm}
          agentName={agentName}
          creating={creating}
          onToggleCreate={() => setShowCreateForm((open) => !open)}
          onNameChange={setAgentName}
          onCreate={handleCreateAgent}
          onSelect={setSelectedAgent}
        />
        <AgentWorkspace
          selectedAgent={selectedAgent}
          showDemoEmbed={showDemoEmbed}
          clientKey={clientKey}
          embedCode={embedCode}
          copiedKey={copiedKey}
          copiedEmbed={copiedEmbed}
          generatingKey={generatingKey}
          hasApiKey={hasApiKey}
          onGenerateKey={handleGenerateClientKey}
          onCopy={copyToClipboard}
        />
      </div>
      <AgentAbout />
    </div>
  );
}

async function createNamedAgent(input: {
  name: string;
  hasApiKey: boolean;
  didApiKey: string;
  didBasicAuth: string;
}): Promise<{ agent: Agent; demo: boolean } | null> {
  if (!input.hasApiKey) {
    return { agent: buildDemoAgent(input.name, Date.now()), demo: true };
  }
  const result = await createAgent(
    input.name,
    DEFAULT_PRESENTER_ID,
    "microsoft",
    DEFAULT_VOICE_ID,
    input.didApiKey,
    input.didBasicAuth,
  );
  if (!result.status || !result.agent) return null;
  return { agent: result.agent, demo: false };
}

function AgentHeader({ hasApiKey }: { hasApiKey: boolean }) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
        <MessageSquare className="w-8 h-8 text-blue-600" />
        Realtime Agents
      </h1>
      <p className="text-gray-600">
        Create conversational AI agents with live avatars for real-time interactions
      </p>
      {!hasApiKey && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Demo Mode:</strong> You can explore the interface and see sample embed code.
            Add your D-ID API key in{" "}
            <Link href="/profile" className="underline hover:text-blue-900">Profile</Link> to create real agents with working client keys.
          </p>
        </div>
      )}
    </div>
  );
}

function AgentColumn({
  agents,
  selectedAgent,
  showCreateForm,
  agentName,
  creating,
  onToggleCreate,
  onNameChange,
  onCreate,
  onSelect,
}: {
  agents: Agent[];
  selectedAgent: Agent | null;
  showCreateForm: boolean;
  agentName: string;
  creating: boolean;
  onToggleCreate: () => void;
  onNameChange: (name: string) => void;
  onCreate: () => void;
  onSelect: (agent: Agent) => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Your Agents</h2>
        <button
          onClick={onToggleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
        >
          {showCreateForm ? "Cancel" : "Create Agent"}
        </button>
      </div>
      {showCreateForm && (
        <CreateAgentForm
          agentName={agentName}
          creating={creating}
          onNameChange={onNameChange}
          onCreate={onCreate}
        />
      )}
      <AgentList agents={agents} selectedId={selectedAgent?.id} onSelect={onSelect} />
    </div>
  );
}

function CreateAgentForm({
  agentName,
  creating,
  onNameChange,
  onCreate,
}: {
  agentName: string;
  creating: boolean;
  onNameChange: (name: string) => void;
  onCreate: () => void;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Create New Agent</h3>
      <label htmlFor="agent-name" className="block text-sm font-medium text-gray-700 mb-2">
        Agent name
      </label>
      <input
        id="agent-name"
        type="text"
        value={agentName}
        onChange={(event) => onNameChange(event.target.value)}
        placeholder="Agent name (e.g., Support Agent, Sales Assistant)"
        className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <button
        onClick={onCreate}
        disabled={!agentName.trim() || creating}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {creating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Creating...
          </>
        ) : (
          <>
            <Bot className="w-5 h-5" />
            Create Agent
          </>
        )}
      </button>
      <p className="text-xs text-gray-500 mt-2">
        Uses default Amber presenter with Microsoft Azure voice
      </p>
    </div>
  );
}

function AgentList({
  agents,
  selectedId,
  onSelect,
}: {
  agents: Agent[];
  selectedId?: string;
  onSelect: (agent: Agent) => void;
}) {
  if (agents.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <Bot className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No agents yet. Create your first agent to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {agents.map((agent) => (
        <button
          key={agent.id}
          onClick={() => onSelect(agent)}
          className={`w-full p-4 border-2 rounded-lg transition-colors text-left ${
            selectedId === agent.id
              ? "border-blue-600 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{agent.preview_name || "Unnamed Agent"}</h3>
              <p className="text-sm text-gray-600">ID: {agent.id}</p>
              {agent.created_at && (
                <p className="text-xs text-gray-500 mt-1">
                  Created: {formatAgentCreatedAt(agent.created_at)}
                </p>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function AgentWorkspace(props: {
  selectedAgent: Agent | null;
  showDemoEmbed: boolean;
  clientKey: string | null;
  embedCode: string;
  copiedKey: boolean;
  copiedEmbed: boolean;
  generatingKey: boolean;
  hasApiKey: boolean;
  onGenerateKey: () => void;
  onCopy: (text: string, type: "key" | "embed") => void;
}) {
  if (!props.selectedAgent) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center h-full flex items-center justify-center">
        <div>
          <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Select an agent to view details and embed options</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AgentDetails agent={props.selectedAgent} />
      <EmbedPanel {...props} />
    </div>
  );
}

function AgentDetails({ agent }: { agent: Agent }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Agent Details</h3>
      <div className="space-y-3 text-sm">
        <div>
          <span className="font-medium text-gray-700">Name:</span>
          <span className="ml-2 text-gray-600">{agent.preview_name || "Unnamed"}</span>
        </div>
        <div>
          <span className="font-medium text-gray-700">Agent ID:</span>
          <span className="ml-2 text-gray-600 break-all">{agent.id}</span>
        </div>
        <div>
          <span className="font-medium text-gray-700">Presenter:</span>
          <span className="ml-2 text-gray-600">{agent.presenter.presenter_id}</span>
        </div>
        <div>
          <span className="font-medium text-gray-700">Voice:</span>
          <span className="ml-2 text-gray-600">
            {agent.presenter.voice.type} - {agent.presenter.voice.voice_id}
          </span>
        </div>
      </div>
    </div>
  );
}

function EmbedPanel({
  showDemoEmbed,
  clientKey,
  embedCode,
  copiedKey,
  copiedEmbed,
  generatingKey,
  hasApiKey,
  onGenerateKey,
  onCopy,
}: {
  showDemoEmbed: boolean;
  clientKey: string | null;
  embedCode: string;
  copiedKey: boolean;
  copiedEmbed: boolean;
  generatingKey: boolean;
  hasApiKey: boolean;
  onGenerateKey: () => void;
  onCopy: (text: string, type: "key" | "embed") => void;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Embed Agent</h3>
      <p className="text-sm text-gray-600 mb-4">
        Generate a client key to embed this agent on your website
      </p>
      {showDemoEmbed ? (
        <DemoEmbed embedCode={embedCode} copied={copiedEmbed} onCopy={onCopy} />
      ) : !clientKey ? (
        <button
          onClick={onGenerateKey}
          disabled={generatingKey || !hasApiKey}
          className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {generatingKey ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : !hasApiKey ? (
            "API Key Required for Real Client Key"
          ) : (
            "Generate Client Key"
          )}
        </button>
      ) : (
        <LiveEmbed
          clientKey={clientKey}
          embedCode={embedCode}
          copiedKey={copiedKey}
          copiedEmbed={copiedEmbed}
          onCopy={onCopy}
        />
      )}
    </div>
  );
}

function EmbedSnippet({
  title,
  copied,
  code,
  onCopy,
}: {
  title: string;
  copied: boolean;
  code: string;
  onCopy: () => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm font-medium text-gray-700">{title}</p>
        <CopyAction copied={copied} onClick={onCopy} />
      </div>
      <div className="bg-gray-50 p-3 rounded border border-gray-200">
        <pre className="text-xs overflow-x-auto">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

function CopyAction({
  copied,
  onClick,
}: {
  copied: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4" />
          Copied
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          Copy
        </>
      )}
    </button>
  );
}

function DemoEmbed({
  embedCode,
  copied,
  onCopy,
}: {
  embedCode: string;
  copied: boolean;
  onCopy: (text: string, type: "key" | "embed") => void;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800 mb-2">
          <strong>Demo Agent:</strong> This is a sample agent created without a D-ID API key.
        </p>
        <p className="text-xs text-yellow-700">
          To create a real agent with a working client key, add your D-ID API key in Profile.
        </p>
      </div>
      <EmbedSnippet
        title="Sample Embed Code"
        copied={copied}
        code={embedCode}
        onCopy={() => onCopy(embedCode, "embed")}
      />
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          Replace <code className="bg-white px-1 rounded">YOUR_CLIENT_KEY_HERE</code> with
          a real client key from a D-ID agent to make this embed work.
        </p>
      </div>
    </div>
  );
}

function LiveEmbed({
  clientKey,
  embedCode,
  copiedKey,
  copiedEmbed,
  onCopy,
}: {
  clientKey: string;
  embedCode: string;
  copiedKey: boolean;
  copiedEmbed: boolean;
  onCopy: (text: string, type: "key" | "embed") => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-medium text-gray-700">Client Key</p>
          <CopyAction copied={copiedKey} onClick={() => onCopy(clientKey, "key")} />
        </div>
        <div className="bg-gray-50 p-3 rounded border border-gray-200 text-xs break-all font-mono">
          {clientKey}
        </div>
      </div>
      <EmbedSnippet
        title="Embed Code"
        copied={copiedEmbed}
        code={embedCode}
        onCopy={() => onCopy(embedCode, "embed")}
      />
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800 mb-2">
          <strong>Important:</strong> This client key is restricted to your current domain.
        </p>
        <p className="text-xs text-blue-700">
          To use it on other domains, generate a new key with those domains allowlisted in the D-ID console.
        </p>
      </div>
      <a
        href="https://docs.d-id.com/docs/embed-quickstart"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-700"
      >
        <ExternalLink className="w-4 h-4" />
        View Embed Documentation
      </a>
    </div>
  );
}

function AgentAbout() {
  return (
    <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-3">About Realtime Agents</h3>
      <p className="text-sm text-gray-600 mb-3">
        D-ID Realtime Agents enable conversational AI experiences with live video avatars.
        They combine speech-to-text, LLM responses, text-to-speech, and avatar rendering
        into a seamless WebRTC stream.
      </p>
      <p className="text-sm text-gray-600">
        Use the embed code to add an interactive agent widget to any website.
        The agent can have custom knowledge bases, LLM configurations, and voices.
      </p>
    </div>
  );
}
