/**
 * Smoke test — compile-clean only. No integration with the brain.
 *
 * This is intentionally minimal per Decision F (v1.4 scaffold,
 * ~200 LOC, no integration tests, no active maintenance until user
 * demand). When real Claude Flow wiring lands in v1.5, real tests
 * arrive with it.
 */
import { describe, it, expect } from "vitest";
import { suraya } from "../src/index.js";
import type { FlowRun, FlowStep, AgentInvocation } from "../src/index.js";

describe("@surayaorg/adapter-claude-flow", () => {
  it("exports a suraya.connect function", () => {
    expect(typeof suraya).toBe("object");
    expect(typeof suraya.connect).toBe("function");
  });

  it("connect() returns a proxy with the expected surface", () => {
    const proxy = suraya.connect({
      projectSlug: "test-project",
      hmacSecret: "test-secret",
      baseUrl: "https://brain.example.invalid",
    });
    expect(typeof proxy.retrieve).toBe("function");
    expect(typeof proxy.retrieveForAgent).toBe("function");
    expect(typeof proxy.emit).toBe("function");
    expect(typeof proxy.emitFromStep).toBe("function");
    expect(typeof proxy.emitFromRun).toBe("function");
    expect(typeof proxy.formatAsContext).toBe("function");
  });

  it("formatAsContext returns a no-match string for empty results", () => {
    const proxy = suraya.connect({ projectSlug: "test-project" });
    expect(proxy.formatAsContext([])).toContain("no observations matched");
  });

  it("type stubs compile (FlowRun, FlowStep, AgentInvocation)", () => {
    const run: FlowRun = { run_id: "r1", flow_id: "f1" };
    const step: FlowStep = { step_id: "s1", run_id: "r1" };
    const agent: AgentInvocation = { id: "a1" };
    expect(run.run_id).toBe("r1");
    expect(step.step_id).toBe("s1");
    expect(agent.id).toBe("a1");
  });
});
