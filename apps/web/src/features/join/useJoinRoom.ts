import { useState } from "react";
import type { RoomSessionResponse } from "@mystery-game/contracts";
import { ApiError, useSession } from "../session/index.js";

/** Runs a create/join request; on success begins the session, otherwise keeps the error code. */
export function useJoinRoom() {
  const { begin } = useSession();
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function submit(request: () => Promise<RoomSessionResponse>) {
    setErrorCode(null);
    setIsLoading(true);
    try {
      begin(await request());
    } catch (error) {
      setErrorCode(error instanceof ApiError ? error.code : "connect");
    } finally {
      setIsLoading(false);
    }
  }

  return { errorCode, isLoading, submit };
}
