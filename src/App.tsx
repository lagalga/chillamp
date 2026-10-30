import { AudioEngineProvider } from './context/AudioEngineContext';
import { WinampShell } from './components/layout/WinampShell';

function App() {
  return (
    <AudioEngineProvider>
      <WinampShell />
    </AudioEngineProvider>
  );
}

export default App;
