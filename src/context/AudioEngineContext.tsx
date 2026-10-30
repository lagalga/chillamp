import { createContext, useContext, type ReactNode } from 'react';
import { useAudioEngine } from '../hooks/useAudioEngine';

type AudioEngineValue = ReturnType<typeof useAudioEngine>;

const AudioEngineContext = createContext<AudioEngineValue | null>(null);

export function AudioEngineProvider({ children }: { children: ReactNode }) {
  const engine = useAudioEngine();
  return (
    <AudioEngineContext.Provider value={engine}>{children}</AudioEngineContext.Provider>
  );
}

export function useAudioEngineContext(): AudioEngineValue {
  const ctx = useContext(AudioEngineContext);
  if (!ctx) {
    throw new Error('useAudioEngineContext must be used within AudioEngineProvider');
  }
  return ctx;
}
