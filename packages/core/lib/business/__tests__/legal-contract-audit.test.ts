/**
 * MRCP-Business — Testes da Ferramenta legal-contract-audit
 */

import { describe, it, expect } from "vitest";
import path from "path";
import {
  legalContractAudit,
  executeLegalContractAudit,
} from "../legal-contract-audit.js";

const FIXTURES_DIR = path.resolve(
  import.meta.dirname,
  "fixtures",
);

describe("mrcp_business_legal_contract_audit", () => {
  it("deve auditar contrato TXT completo", async () => {
    const result = await legalContractAudit({
      file_path: path.join(FIXTURES_DIR, "sample-contract.txt"),
    });

    expect(result).toHaveProperty("document_title");
    expect(result).toHaveProperty("dqi_score");
    expect(result).toHaveProperty("parties_detected");
    expect(result).toHaveProperty("key_clauses");
    expect(result).toHaveProperty("penalties_detected");
    expect(result).toHaveProperty("termination_clauses");
    expect(result).toHaveProperty("cpf_cnpj_detected");
    expect(result).toHaveProperty("monetary_values");
    expect(result).toHaveProperty("mrcp_confidence_score");
    expect(result).toHaveProperty("processing_ms");

    // Cláusulas detectadas
    expect(result.key_clauses.length).toBeGreaterThanOrEqual(5);

    // Partes detectadas
    expect(result.parties_detected.length).toBeGreaterThanOrEqual(1);

    // Penalidades detectadas
    expect(result.penalties_detected.length).toBeGreaterThanOrEqual(1);

    // Rescisão detectada
    expect(result.termination_clauses.length).toBeGreaterThanOrEqual(1);

    // CPF/CNPJ detectados
    expect(result.cpf_cnpj_detected.length).toBeGreaterThanOrEqual(1);

    // Valores monetários
    expect(result.monetary_values.length).toBeGreaterThanOrEqual(1);

    // DQI score razoável
    expect(result.dqi_score).toBeGreaterThan(30);
    expect(result.dqi_score).toBeLessThanOrEqual(100);

    // Confidence score
    expect(result.mrcp_confidence_score).toBeGreaterThanOrEqual(50);
  });

  it("DQI deve ser 0-100", async () => {
    const result = await legalContractAudit({
      file_path: path.join(FIXTURES_DIR, "sample-contract.txt"),
    });
    expect(result.dqi_score).toBeGreaterThanOrEqual(0);
    expect(result.dqi_score).toBeLessThanOrEqual(100);
  });
});

describe("executeLegalContractAudit (MCP wrapper)", () => {
  it("deve retornar erro quando file_path está vazio", async () => {
    const result = await executeLegalContractAudit({});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("MISSING_FILE_PATH");
  });

  it("deve retornar erro quando arquivo não existe", async () => {
    const result = await executeLegalContractAudit({
      file_path: "/caminho/inexistente.pdf",
    });
    expect(result.isError).toBe(true);
  });

  it("deve retornar contrato válido com contrato real", async () => {
    const result = await executeLegalContractAudit({
      file_path: path.join(FIXTURES_DIR, "sample-contract.txt"),
    });
    expect(result.isError).toBeUndefined();
    const contract = JSON.parse(result.content[0].text);
    expect(contract.dqi_score).toBeGreaterThan(0);
    expect(contract.key_clauses.length).toBeGreaterThan(0);
  });
});
