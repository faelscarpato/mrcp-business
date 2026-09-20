import { create } from 'zustand';
import { DocumentRecord, getDocuments, saveDocument, deleteDocument } from './indexeddb';

interface DataLakeState {
  documents: DocumentRecord[];
  isLoading: boolean;
  selectedDocId: string | null;
  activePipeline: string;
  loadDocuments: () => Promise<void>;
  addDocument: (doc: DocumentRecord) => Promise<void>;
  updateDocument: (doc: DocumentRecord) => Promise<void>;
  removeDocument: (id: string) => Promise<void>;
  setSelectedDocId: (id: string | null) => void;
  setActivePipeline: (pipeline: string) => void;
}

export const useDataLakeStore = create<DataLakeState>((set, get) => ({
  documents: [],
  isLoading: false,
  selectedDocId: null,
  activePipeline: 'Geral',

  loadDocuments: async () => {
    set({ isLoading: true });
    try {
      const docs = await getDocuments();
      set({ documents: docs.sort((a, b) => b.created_at - a.created_at) });
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addDocument: async (doc: DocumentRecord) => {
    await saveDocument(doc);
    set((state) => ({
      documents: [doc, ...state.documents]
    }));
  },

  updateDocument: async (doc: DocumentRecord) => {
    await saveDocument(doc);
    set((state) => ({
      documents: state.documents.map((d) => (d.id === doc.id ? doc : d))
    }));
  },

  removeDocument: async (id: string) => {
    await deleteDocument(id);
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== id),
      selectedDocId: state.selectedDocId === id ? null : state.selectedDocId
    }));
  },

  setSelectedDocId: (id: string | null) => {
    set({ selectedDocId: id });
  },

  setActivePipeline: (pipeline: string) => {
    set({ activePipeline: pipeline });
  }
}));
