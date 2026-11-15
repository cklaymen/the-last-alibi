import { useCallback, useEffect, useRef, useState } from "react";
import type { ClientToServerEvents } from "@mystery-game/contracts";
import type { GameContextValue } from "../game/index.js";
import { useErrorText } from "../../shared/errors/index.js";

export type Send = GameContextValue["send"];
type PayloadOf<E extends keyof ClientToServerEvents> = Parameters<ClientToServerEvents[E]>[0];

/**
 * Wraps `send` with a busy flag and a translated error from the server ack.
 * `run` resolves to true when the command was accepted.
 */
export function useCommand(send: Send) {
  const errorText = useErrorText();
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(
    async <E extends keyof ClientToServerEvents>(event: E, payload: PayloadOf<E>): Promise<boolean> => {
      setBusy(true);
      setCode(null);
      try {
        const res = await send(event, payload);
        if (!mounted.current) return res.ok;
        if (!res.ok) setCode(res.code);
        return res.ok;
      } catch {
        if (mounted.current) setCode("unknown");
        return false;
      } finally {
        if (mounted.current) setBusy(false);
      }
    },
    [send],
  );

  return {
    run,
    busy,
    error: code ? errorText(code) : null,
    clearError: () => setCode(null),
  };
}
