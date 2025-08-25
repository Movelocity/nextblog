'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface SidePanelContextType {
  isSidePanelOpen: boolean;
  toggleSidePanel: () => void;
  closeSidePanel: () => void;
}

const SidePanelContext = createContext<SidePanelContextType | undefined>(undefined);

export function SidePanelProvider({ children }: { children: React.ReactNode }) {
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);
  // useEffect(() => {
  //   document.body.classList.toggle('has-side-panel', isSidePanelOpen);
  // }, [isSidePanelOpen]);

  const toggleSidePanel = useCallback(() => {
    console.log('toggleSidePanel');
    setIsSidePanelOpen(prev => !prev);
  }, []);

  const closeSidePanel = useCallback(() => {
    setIsSidePanelOpen(false);
  }, []);

  return (
    <SidePanelContext.Provider value={{ isSidePanelOpen, toggleSidePanel, closeSidePanel }}>
      {children}
    </SidePanelContext.Provider>
  );
}

export function useSidePanel() {
  const context = useContext(SidePanelContext);
  if (context === undefined) {
    throw new Error('useSidePanel must be used within a SidePanelProvider');
  }
  return context;
} 