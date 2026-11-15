import { SessionProvider } from "../features/session/index.js";
import { Screens } from "./screens.js";

export function App() {
  return (
    <SessionProvider>
      <Screens />
    </SessionProvider>
  );
}
