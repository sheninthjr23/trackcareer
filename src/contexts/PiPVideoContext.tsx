
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PiPVideoState {
  isOpen: boolean;
  videoUrl: string | null;
  videoTitle: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

interface PiPVideoContextType {
  pipState: PiPVideoState;
  openPiP: (url: string, title: string) => void;
  closePiP: () => void;
  updatePosition: (x: number, y: number) => void;
  updateSize: (width: number, height: number) => void;
}

const PiPVideoContext = createContext<PiPVideoContextType | undefined>(undefined);

const DEFAULT_PIP_STATE: PiPVideoState = {
  isOpen: false,
  videoUrl: null,
  videoTitle: '',
  position: { x: window.innerWidth - 420, y: 100 },
  size: { width: 400, height: 225 }
};

interface PiPVideoProviderProps {
  children: ReactNode;
}

export function PiPVideoProvider({ children }: PiPVideoProviderProps) {
  const [pipState, setPipState] = useState<PiPVideoState>(DEFAULT_PIP_STATE);

  const openPiP = (url: string, title: string) => {
    setPipState(prev => ({
      ...prev,
      isOpen: true,
      videoUrl: url,
      videoTitle: title
    }));
  };

  const closePiP = () => {
    setPipState(prev => ({
      ...prev,
      isOpen: false,
      videoUrl: null,
      videoTitle: ''
    }));
  };

  const updatePosition = (x: number, y: number) => {
    setPipState(prev => ({
      ...prev,
      position: { x, y }
    }));
  };

  const updateSize = (width: number, height: number) => {
    setPipState(prev => ({
      ...prev,
      size: { width, height }
    }));
  };

  return (
    <PiPVideoContext.Provider value={{
      pipState,
      openPiP,
      closePiP,
      updatePosition,
      updateSize
    }}>
      {children}
    </PiPVideoContext.Provider>
  );
}

export function usePiPVideo() {
  const context = useContext(PiPVideoContext);
  if (context === undefined) {
    throw new Error('usePiPVideo must be used within a PiPVideoProvider');
  }
  return context;
}
