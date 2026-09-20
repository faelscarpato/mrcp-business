import { DocumentRecord } from './indexeddb';

const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const processDocument = async (
  file: File,
  addDocument: (doc: DocumentRecord) => Promise<void>,
  updateDocument: (doc: DocumentRecord) => Promise<void>,
  apiKey?: string,
  provider?: string
) => {
  const filesize_kb = parseFloat((file.size / 1024).toFixed(2));

  const docRecord: DocumentRecord = {
    id: generateId(),
    filename: file.name,
    filesize_kb,
    pipeline: 'Classificando via IA...',
    status: 'Processando',
    created_at: Date.now(),
    finops: { raw_tokens: 0, parsed_tokens: 0, saved_tokens: 0, cost_saved_usd: 0 },
    parsedData: {},
  };

  await addDocument(docRecord);

  // Use Web Worker to avoid blocking the main thread
  const worker = new Worker(new URL('./parser.worker.ts', import.meta.url), { type: 'module' });

  worker.onmessage = async (e) => {
    const { success, parsedData, error, pipeline, finops } = e.data;
    if (success) {
      const updatedDoc: DocumentRecord = {
        ...docRecord,
        status: 'AST Parsed',
        pipeline: pipeline || 'Desconhecido',
        finops: finops || docRecord.finops,
        parsedData,
      };
      await updateDocument(updatedDoc);
    } else {
      const errorDoc: DocumentRecord = {
        ...docRecord,
        status: 'Erro',
        parsedData: { error: String(error) },
      };
      await updateDocument(errorDoc);
    }
    worker.terminate();
  };

  worker.onerror = async (err) => {
    const errorDoc: DocumentRecord = {
      ...docRecord,
      status: 'Erro',
      parsedData: { error: err.message || 'Worker Error' },
    };
    await updateDocument(errorDoc);
    worker.terminate();
  };

  worker.postMessage({ file, apiKey, provider });
};
