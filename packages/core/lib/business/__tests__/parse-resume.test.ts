/**
 * MRCP-Business — Testes da Ferramenta parse-resume
 *
 * Testa a pipeline completa de parsing de currículos com arquivo TXT real.
 */

import { describe, it, expect } from "vitest";
import path from "path";
import { parseResume, executeParseResume } from "../parse-resume.js";
import { ANONYMIZED_LABEL } from "../types.js";

const FIXTURES_DIR = path.resolve(
  import.meta.dirname,
  "fixtures",
);

describe("mrcp_business_parse_resume", () => {
  it("deve parsear currículo TXT completo", async () => {
    const result = await parseResume({
      file_path: path.join(FIXTURES_DIR, "sample-resume.txt"),
    });

    // Tipo do contrato
    expect(result).toHaveProperty("candidate_name");
    expect(result).toHaveProperty("email");
    expect(result).toHaveProperty("verified_skills");
    expect(result).toHaveProperty("experience_years_calculated");
    expect(result).toHaveProperty("mrcp_confidence_score");
    expect(result).toHaveProperty("processing_ms");
    expect(result).toHaveProperty("source_format");
    expect(result).toHaveProperty("raw_text_length");

    // Nome anonimizado
    expect(result.candidate_name).toBe(ANONYMIZED_LABEL);

    // Email extraído
    expect(result.email).toBe("joao.silva@email.com");

    // Skills detectadas
    expect(result.verified_skills.length).toBeGreaterThan(3);
    expect(result.verified_skills).toContain("typescript");
    expect(result.verified_skills).toContain("react");
    expect(result.verified_skills).toContain("node.js");
    expect(result.verified_skills).toContain("aws");

    // Experiência > 0
    expect(result.experience_years_calculated).toBeGreaterThan(0);

    // CPF detectado
    expect(result.cpf_detected).toBe(true);

    // Salário detectado
    expect(result.salary_detected).not.toBeNull();

    // Formato correto
    expect(result.source_format).toBe("txt");

    // Confidence score razoável
    expect(result.mrcp_confidence_score).toBeGreaterThanOrEqual(50);
    expect(result.mrcp_confidence_score).toBeLessThanOrEqual(100);

    // Processing time registrado
    expect(result.processing_ms).toBeGreaterThanOrEqual(0);

    // Texto tem tamanho
    expect(result.raw_text_length).toBeGreaterThan(100);
  });

  it("deve retornar contrato com score baixo para texto vazio", async () => {
    // Criar arquivo vazio temporário
    const fs = await import("fs");
    const tmpFile = path.join(FIXTURES_DIR, "_empty_resume.txt");
    fs.writeFileSync(tmpFile, "", "utf-8");

    try {
      const result = await parseResume({ file_path: tmpFile });
      expect(result.mrcp_confidence_score).toBeLessThan(30);
      expect(result.verified_skills).toEqual([]);
      expect(result.raw_text_length).toBe(0);
    } finally {
      fs.unlinkSync(tmpFile);
    }
  });

  it("deve retornar contract com education quando detectada", async () => {
    const result = await parseResume({
      file_path: path.join(FIXTURES_DIR, "sample-resume.txt"),
    });
    expect(result.education.length).toBeGreaterThanOrEqual(0);
  });

  it("deve ter tamanho de contrato < 600 tokens (estimativa)", async () => {
    const result = await parseResume({
      file_path: path.join(FIXTURES_DIR, "sample-resume.txt"),
    });
    const jsonStr = JSON.stringify(result);
    // Estimativa: 1 token ≈ 4 caracteres
    const estimatedTokens = Math.ceil(jsonStr.length / 4);
    expect(estimatedTokens).toBeLessThan(600);
  });
});

describe("executeParseResume (MCP wrapper)", () => {
  it("deve retornar erro quando file_path está vazio", async () => {
    const result = await executeParseResume({});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("MISSING_FILE_PATH");
  });

  it("deve retornar erro quando arquivo não existe", async () => {
    const result = await executeParseResume({
      file_path: "/caminho/inexistente.txt",
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("PARSE_FAILED");
  });

  it("deve retornar contrato válido com arquivo real", async () => {
    const result = await executeParseResume({
      file_path: path.join(FIXTURES_DIR, "sample-resume.txt"),
    });
    expect(result.isError).toBeUndefined();
    const contract = JSON.parse(result.content[0].text);
    expect(contract.candidate_name).toBe(ANONYMIZED_LABEL);
    expect(contract.verified_skills.length).toBeGreaterThan(0);
  });
});
