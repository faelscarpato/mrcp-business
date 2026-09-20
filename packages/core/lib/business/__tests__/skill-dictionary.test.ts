/**
 * MRCP-Business — Testes do Skill Dictionary
 */

import { describe, it, expect } from "vitest";
import {
  extractSkillsFromText,
  findMissingKeywords,
  SKILL_DICTIONARY,
  ALL_SKILLS_FLAT,
} from "../skill-dictionary.js";

describe("Skill Dictionary", () => {
  it("deve ter categorias de skills", () => {
    expect(Object.keys(SKILL_DICTIONARY).length).toBeGreaterThan(5);
  });

  it("ALL_SKILLS_FLAT deve ter muitas skills", () => {
    expect(ALL_SKILLS_FLAT.length).toBeGreaterThan(100);
  });

  it("deve extrair skills de texto", () => {
    const skills = extractSkillsFromText(
      "Experiência com TypeScript, React, Node.js e AWS",
    );
    expect(skills).toContain("typescript");
    expect(skills).toContain("react");
    expect(skills).toContain("node.js");
    expect(skills).toContain("aws");
  });

  it("deve ignorar substrings falsas", () => {
    const skills = extractSkillsFromText("I use reacting badly");
    expect(skills).not.toContain("react");
  });

  it("deve retornar skills únicas e ordenadas", () => {
    const skills = extractSkillsFromText("Python Python Python");
    const pythonCount = skills.filter((s) => s === "python").length;
    expect(pythonCount).toBe(1);
    // Deve ser ordenado
    const sorted = [...skills].sort();
    expect(skills).toEqual(sorted);
  });

  it("deve extrair skills de backend", () => {
    const skills = extractSkillsFromText(
      "Desenvolvedor Django com Flask e FastAPI",
    );
    expect(skills).toContain("django");
    expect(skills).toContain("flask");
    expect(skills).toContain("fastapi");
  });

  it("deve extrair skills de DevOps", () => {
    const skills = extractSkillsFromText(
      "Docker, Kubernetes e Terraform",
    );
    expect(skills).toContain("docker");
    expect(skills).toContain("kubernetes");
    expect(skills).toContain("terraform");
  });

  it("deve retornar array vazio para texto sem skills", () => {
    expect(extractSkillsFromText("bom dia, tudo bem?")).toEqual([]);
  });
});

describe("findMissingKeywords", () => {
  it("deve encontrar keywords faltantes", () => {
    const missing = findMissingKeywords(
      ["typescript", "react"],
      ["typescript", "react", "kubernetes", "graphql"],
    );
    expect(missing).toContain("kubernetes");
    expect(missing).toContain("graphql");
    expect(missing).not.toContain("typescript");
  });

  it("deve retornar vazio quando todas estão presentes", () => {
    const missing = findMissingKeywords(
      ["typescript", "react"],
      ["typescript", "react"],
    );
    expect(missing).toEqual([]);
  });

  it("deve ser case-insensitive", () => {
    const missing = findMissingKeywords(
      ["TypeScript"],
      ["typescript"],
    );
    expect(missing).toEqual([]);
  });
});
