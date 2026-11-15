import { SessionProvider } from "../features/session/index.js";
import { AppHeader } from "./AppHeader.js";
import { Screens } from "./screens.js";

export function App() {
  return (
    <SessionProvider>
      <div className="flex min-h-dvh flex-col bg-bg text-fg">
        <AppHeader />
        <Screens />
      </div>
    </SessionProvider>
  );
}
