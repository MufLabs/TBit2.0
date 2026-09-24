import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Fase 0 — Contrato de especificaciones de agentes (.github/agents).
 *
 * Este test es la semilla del futuro AgentSpecLoader (Fase 1 del blueprint):
 * define y congela el contrato real del frontmatter de los .agent.md.
 *
 * Contrato verificado contra los 17 archivos del repositorio:
 *   name, description, capabilities (lista), tools (inline o bloque),
 *   argument-hint  -> presentes en todos.
 *   permissions, modelRequirements -> AUSENTES en todos (gap que cubrira el
 *   PolicyOverlay como capa versionada, no modificando los markdown).
 */

const AGENTS_DIR = join(process.cwd(), ".github", "agents");

type AgentSpec = {
  file: string;
  name: string;
  description: string;
  capabilities: string[];
  tools: string[];
  argumentHint: string;
  permissions: boolean;
  modelRequirements: boolean;
};

function parseInlineList(value: string): string[] {
  const inner = value.replace(/^\[/, "").replace(/\]$/, "");
  return inner
    .split(",")
    .map((item) => item.trim().replace(/^['"]|['"]$/g, ""))
    .filter(Boolean);
}

function parseBlockList(frontmatter: string, key: string): string[] | null {
  const blockMatch = frontmatter.match(
    new RegExp(`^${key}:\\r?\\n((?:[ \\t]+- .*\\r?\\n?)+)`, "m")
  );
  if (!blockMatch) return null;
  return blockMatch[1]
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^-[ \t]*/, ""));
}

function scalar(frontmatter: string, key: string): string | null {
  const match = frontmatter.match(new RegExp(`^${key}:[ \\t]*(.*)$`, "m"));
  return match ? match[1].trim() : null;
}

function loadAgentSpecs(): AgentSpec[] {
  return readdirSync(AGENTS_DIR)
    .filter((file) => file.endsWith(".agent.md"))
    .sort()
    .map((file) => {
      const raw = readFileSync(join(AGENTS_DIR, file), "utf8");
      const frontmatterMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!frontmatterMatch) {
        throw new Error(`${file}: no tiene bloque de frontmatter delimitado por ---`);
      }
      const frontmatter = frontmatterMatch[1];

      const toolsScalar = scalar(frontmatter, "tools");
      const tools = toolsScalar
        ? parseInlineList(toolsScalar)
        : parseBlockList(frontmatter, "tools") ?? [];

      const capabilities = parseBlockList(frontmatter, "capabilities") ?? [];
      const description = scalar(frontmatter, "description") ?? "";

      return {
        file,
        name: scalar(frontmatter, "name") ?? "",
        description: description.replace(/^['"]|['"]$/g, ""),
        capabilities,
        tools,
        argumentHint: scalar(frontmatter, "argument-hint") ?? "",
        permissions: /^permissions:/m.test(frontmatter),
        modelRequirements: /^modelRequirements:/m.test(frontmatter)
      };
    });
}

const specs = loadAgentSpecs();

describe("Inventario de agentes — baseline Fase 0 (17 especificaciones)", () => {
  it("contiene exactamente las 17 especificaciones del baseline", () => {
    expect(specs.length).toBe(17);
  });

  it("todos los specs declaran name, description, capabilities, tools y argument-hint", () => {
    for (const spec of specs) {
      expect(spec.name.length, `${spec.file}: name vacio`).toBeGreaterThan(0);
      expect(spec.description.length, `${spec.file}: description vacia`).toBeGreaterThan(40);
      expect(spec.capabilities.length, `${spec.file}: capabilities vacias`).toBeGreaterThan(0);
      expect(spec.tools.length, `${spec.file}: tools vacios`).toBeGreaterThan(0);
      expect(spec.argumentHint.length, `${spec.file}: argument-hint vacio`).toBeGreaterThan(0);
    }
  });

  it("los roles clave del framework MUF Labs estan presentes (incluido Context Engineer)", () => {
    const names = specs.map((spec) => spec.name);
    for (const expected of [
      "AI Systems Engineer",
      "Chief Architect",
      "Code Reviewer",
      "Consensus Agent",
      "Context Engineer",
      "Developer Agent",
      "Engineering Manager",
      "Prompt Engineer",
      "Security Auditor",
      "Validation Agent"
    ]) {
      expect(names).toContain(expected);
    }
  });

  it("no existe aun un Graph Engineering Agent (pendiente de diseño en Fase 3)", () => {
    const graphAgents = specs.filter((spec) => /graph/i.test(spec.name) || /graph/i.test(spec.file));
    expect(graphAgents).toEqual([]);
  });

  it("permissions y modelRequirements estan ausentes en los 17 specs (gap documentado para el PolicyOverlay)", () => {
    for (const spec of specs) {
      expect(spec.permissions, `${spec.file} ya declara permissions: actualizar PolicyOverlay`).toBe(false);
      expect(spec.modelRequirements, `${spec.file} ya declara modelRequirements: actualizar PolicyOverlay`).toBe(false);
    }
  });

  it("los tools declarados pertenecen al vocabulario permitido del runtime", () => {
    const ALLOWED_TOOLS = new Set(["read", "search", "edit", "vscode", "agent"]);
    for (const spec of specs) {
      for (const tool of spec.tools) {
        expect(ALLOWED_TOOLS.has(tool), `${spec.file}: tool desconocido '${tool}'`).toBe(true);
      }
    }
  });

  it("soporta ambos formatos de tools (lista inline y bloque YAML)", () => {
    const blockFormat = specs.find((spec) => spec.file === "ContextEngineer.agent.md");
    expect(blockFormat?.tools.sort()).toEqual(["read", "search"]);

    const inlineFormat = specs.find((spec) => spec.file === "AiSystemEngineer.agent.md");
    expect(inlineFormat?.tools.sort()).toEqual(["edit", "read", "search", "vscode"]);
  });
});
