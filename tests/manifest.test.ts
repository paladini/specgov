import { describe, expect, it } from "vitest";
import { normalizeConfig } from "../src/manifest.js";

describe("manifest", () => {
  it("normalizes defaults", () => {
    const config = normalizeConfig({
      artifacts: [{ path: "docs/**/*.md", kind: "documentation" }],
      mappings: [{ code: "src/**", specs: "docs/**" }],
    });

    expect(config.mode).toBe("advisory");
    expect(config.rules.require_spec_impact_for_code_changes).toBe(true);
    expect(config.ignore).toContain("node_modules/**");
  });

  it("rejects invalid modes", () => {
    expect(() => normalizeConfig({ mode: "blocking" })).toThrow(/mode/);
  });
});
