/**
 * MRCP-Business — Document Reader (Local-First)
 *
 * Leitura binária de PDF, DOCX e XLSX usando parsers determinísticos.
 * Todo processamento ocorre localmente. Nunca envia dados brutos externamente.
 */

import fs from "fs";
import path from "path";

export type DocumentFormat = "pdf" | "docx" | "xlsx" | "txt" | "csv" | "unknown";

export interface DocumentContent {
  readonly text: string;
  readonly format: DocumentFormat;
  readonly metadata: Record<string, unknown>;
}

/**
 * Detecta o formato do documento pela extensão do arquivo.
 */
export function detectFormat(filePath: string): DocumentFormat {
  const ext = path.extname(filePath).toLowerCase().replace(".", "");
  switch (ext) {
    case "pdf":
      return "pdf";
    case "docx":
    case "doc":
      return "docx";
    case "xlsx":
    case "xls":
      return "xlsx";
    case "txt":
      return "txt";
    case "csv":
      return "csv";
    default:
      return "unknown";
  }
}

/**
 * Lê e extrai texto de um documento local.
 * Usa parsers binários determinísticos para cada formato.
 */
export async function readDocument(filePath: string): Promise<DocumentContent> {
  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Arquivo não encontrado: ${absolutePath}`);
  }

  const format = detectFormat(absolutePath);

  switch (format) {
    case "pdf":
      return readPdf(absolutePath);
    case "docx":
      return readDocx(absolutePath);
    case "xlsx":
      return readXlsx(absolutePath);
    case "txt":
    case "csv":
      return readPlainText(absolutePath, format);
    default:
      return readPlainText(absolutePath, "unknown");
  }
}

/**
 * Lê PDF usando pdf-parse (processamento local).
 */
async function readPdf(filePath: string): Promise<DocumentContent> {
  try {
    const pdfParse = (await import("pdf-parse")).default;
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);

    return {
      text: data.text ?? "",
      format: "pdf",
      metadata: {
        pages: data.numpages ?? 0,
        info: data.info ?? {},
      },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    // Fallback silencioso: retorna string vazia se o parser falhar
    console.error(`[MRCP-Business] Erro ao ler PDF: ${msg}`);
    return {
      text: "",
      format: "pdf",
      metadata: { error: msg },
    };
  }
}

/**
 * Lê DOCX usando mammoth (processamento local).
 */
async function readDocx(filePath: string): Promise<DocumentContent> {
  try {
    const mammoth = await import("mammoth");
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer });

    return {
      text: result.value ?? "",
      format: "docx",
      metadata: {
        messages: result.messages?.length ?? 0,
      },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[MRCP-Business] Erro ao ler DOCX: ${msg}`);
    return {
      text: "",
      format: "docx",
      metadata: { error: msg },
    };
  }
}

/**
 * Lê XLSX usando xlsx (processamento local).
 * Retorna texto concatenado de todas as sheets.
 */
async function readXlsx(filePath: string): Promise<DocumentContent> {
  try {
    const XLSX = await import("xlsx");
    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer, { type: "buffer" });

    let fullText = "";
    const sheetMeta: Record<string, { rows: number; cols: number }> = {};

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;

      const csv = XLSX.utils.sheet_to_csv(sheet);
      fullText += `--- Sheet: ${sheetName} ---\n${csv}\n`;

      const range = sheet["!ref"] ? XLSX.utils.decode_range(sheet["!ref"]) : null;
      sheetMeta[sheetName] = {
        rows: range ? range.e.r - range.s.r + 1 : 0,
        cols: range ? range.e.c - range.s.c + 1 : 0,
      };
    }

    return {
      text: fullText,
      format: "xlsx",
      metadata: {
        sheetCount: workbook.SheetNames.length,
        sheetNames: workbook.SheetNames,
        sheets: sheetMeta,
      },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[MRCP-Business] Erro ao ler XLSX: ${msg}`);
    return {
      text: "",
      format: "xlsx",
      metadata: { error: msg },
    };
  }
}

/**
 * Lê arquivos de texto puro.
 */
function readPlainText(
  filePath: string,
  format: DocumentFormat,
): DocumentContent {
  try {
    const text = fs.readFileSync(filePath, "utf-8");
    return {
      text,
      format,
      metadata: {
        sizeBytes: Buffer.byteLength(text, "utf-8"),
      },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[MRCP-Business] Erro ao ler texto: ${msg}`);
    return {
      text: "",
      format,
      metadata: { error: msg },
    };
  }
}
