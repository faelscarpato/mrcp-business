/**
 * MRCP-Business — Testes da Ferramenta extract-dax
 */

import { describe, it, expect } from "vitest";
import path from "path";
import { extractDax, executeExtractDax } from "../extract-dax.js";

const FIXTURES_DIR = path.resolve(
  import.meta.dirname,
  "fixtures",
);

describe("mrcp_business_extract_dax", () => {
  it("deve parsear CSV com headers e dados numéricos", async () => {
    const result = await extractDax({
      file_path: path.join(FIXTURES_DIR, "sample-spreadsheet.csv"),
    });

    expect(result).toHaveProperty("file_name");
    expect(result).toHaveProperty("total_rows");
    expect(result).toHaveProperty("total_columns");
    expect(result).toHaveProperty("column_headers");
    expect(result).toHaveProperty("numeric_summary");
    expect(result).toHaveProperty("mrcp_confidence_score");
    expect(result).toHaveProperty("processing_ms");

    expect(result.file_name).toBe("sample-spreadsheet.csv");
    expect(result.column_headers.length).toBeGreaterThan(0);
    expect(result.mrcp_confidence_score).toBeGreaterThanOrEqual(50);
    expect(result.processing_ms).toBeGreaterThanOrEqual(0);
  });

  it("deve calcular sumarização numérica", async () => {
    const result = await extractDax({
      file_path: path.join(FIXTURES_DIR, "sample-spreadsheet.csv"),
    });

    // CSV tem coluna "Salário" com valores numéricos
    if (result.numeric_summary.length > 0) {
      const summary = result.numeric_summary[0];
      expect(summary).toHaveProperty("min");
      expect(summary).toHaveProperty("max");
      expect(summary).toHaveProperty("avg");
      expect(summary).toHaveProperty("count");
      expect(summary.min).toBeLessThanOrEqual(summary.max);
    }
  });
});

describe("executeExtractDax (MCP wrapper)", () => {
  it("deve retornar erro quando file_path está vazio", async () => {
    const result = await executeExtractDax({});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("MISSING_FILE_PATH");
  });

  it("deve retornar erro quando arquivo não existe", async () => {
    const result = await executeExtractDax({
      file_path: "/caminho/inexistente.xlsx",
    });
    expect(result.isError).toBe(true);
  });

  it("deve retornar contrato válido com CSV real", async () => {
    const result = await executeExtractDax({
      file_path: path.join(FIXTURES_DIR, "sample-spreadsheet.csv"),
    });
    expect(result.isError).toBeUndefined();
    const contract = JSON.parse(result.content[0].text);
    expect(contract.file_name).toBe("sample-spreadsheet.csv");
  });
});
