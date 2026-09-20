import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface DocumentRecord {
  id: string; // UUID v4
  filename: string;
  filesize_kb: number;
  pipeline: 'RH & Triagem' | 'Financeiro & BI' | 'Jurídico' | 'Operacional' | 'Desconhecido';
  status: 'Processando' | 'AST Parsed' | 'Erro';
  created_at: number; // timestamp
  finops: {
    raw_tokens: number;
    parsed_tokens: number;
    saved_tokens: number;
    cost_saved_usd: number;
  };
  parsedData: Record<string, any>; // O Micro-Contrato JSON resultante
}

interface MRCPDB extends DBSchema {
  documents: {
    key: string;
    value: DocumentRecord;
  };
}

const DB_NAME = 'MRCP_DataLake';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<MRCPDB>> | null = null;

export const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<MRCPDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('documents')) {
          db.createObjectStore('documents', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
};

export const getDocuments = async (): Promise<DocumentRecord[]> => {
  const db = await initDB();
  return db.getAll('documents');
};

export const getDocument = async (id: string): Promise<DocumentRecord | undefined> => {
  const db = await initDB();
  return db.get('documents', id);
};

export const saveDocument = async (doc: DocumentRecord): Promise<void> => {
  const db = await initDB();
  await db.put('documents', doc);
};

export const deleteDocument = async (id: string): Promise<void> => {
  const db = await initDB();
  await db.delete('documents', id);
};
