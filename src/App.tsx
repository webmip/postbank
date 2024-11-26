import React, { useEffect } from 'react';
import Sidebar from './components/Sidebar';
import RequestPanel from './components/RequestPanel';
import Header from './components/Header';
import Footer from './components/Footer';
import { useStore } from './store';
import { ThemeProvider } from './hooks/useTheme';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

function App() {
  const { loadCollections } = useStore();

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  return (
    <ThemeProvider>
      <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
        <Header />
        <PanelGroup direction="horizontal" className="flex-1 overflow-hidden">
          <Panel defaultSize={25} minSize={20} maxSize={40}>
            <Sidebar />
          </Panel>
          <PanelResizeHandle className="w-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors" />
          <Panel>
            <RequestPanel />
          </Panel>
        </PanelGroup>
        <Footer />
      </div>
    </ThemeProvider>
  );
}

export default App;