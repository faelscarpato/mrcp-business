import React, { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { DetailDrawer } from './components/DetailDrawer';
import { useDataLakeStore } from './lib/store';

function App() {
  const loadDocuments = useDataLakeStore((state) => state.loadDocuments);
  const selectedDocId = useDataLakeStore((state) => state.selectedDocId);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
          <Dashboard />
          {selectedDocId && (
            <>
              {/* Overlay for small screens if needed, but for now we let it slide over */}
              <DetailDrawer />
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
