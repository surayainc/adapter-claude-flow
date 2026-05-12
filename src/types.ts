/**
 * Types for the Claude Flow ↔ Suraya brain adapter.
 *
 * Claude Flow is a community-built orchestration framework on top of
 * Claude Code (think LangChain-style for Claude Code runs). Its public
 * SDK is not stable yet, so the Run/Step/AgentInvocation shapes below
 * are duck-typed placeholders — they reflect the *expected* concepts
 * based on Claude Flow's published docs. Real type alignment lands in
 * v1.5 once the upstream SDK is pinned.
 */
import type {
  BrainClient,
  RetrieveResult,
  ObservationInput,
} from "@surayaorg/brain-sdk";

export type SurayaConnectOptions = {
  projectSlug: string;
  hmacSecret?: string;
  bootstrapToken?: string;
  baseUrl?: string;
};

/**
 * A Claude Flow "run" — one orchestration pass that fans out into one
 * or more steps. Approximate shape; will be replaced with the upstream
 * SDK's type in v1.5.
 */
export type FlowRun = {
  run_id: string;
  flow_id: string;
  started_at?: string;
  stop_reason?: string;
  user_message?: string;
};

/**
 * A single step inside a flow — typically wraps one Claude Code
 * invocation plus any pre/post hooks.
 */
export type FlowStep = {
  step_id: string;
  run_id: string;
  agent_id?: string;
  stop_reason?: string;
  content?: string;
};

/**
 * A nested agent invocation — Claude Flow supports spawning sub-agents
 * inside a step (similar to claude-swarm). Mirrors the swarm adapter's
 * SwarmAgent shape so future alignment is cheap.
 */
export type AgentInvocation = {
  id: string;
  systemPrompt?: string;
  lastUserMessage?: string;
};

export type SurayaBrainProxy = {
  client: BrainClient;
  retrieve(q: string, topK?: number): Promise<RetrieveResult[]>;
  retrieveForAgent(agent: AgentInvocation, topK?: number): Promise<RetrieveResult[]>;
  emit(observation: ObservationInput): Promise<void>;
  emitFromStep(step: FlowStep, projectSlug?: string): Promise<void>;
  emitFromRun(run: FlowRun, projectSlug?: string): Promise<void>;
  formatAsContext(results: RetrieveResult[]): string;
};
