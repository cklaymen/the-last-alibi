import { useState } from "react";
import type { RoomSummary } from "@mystery-game/contracts";
import { t } from "../../i18n/index.js";

export function useJoinRoom() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function submit(
    request: () => Promise<RoomSummary>,
  ): Promise<RoomSummary | null> {
    setError(null);
    setIsLoading(true);
    try {
      return await request();
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : t("err_connect"),
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  return { error, isLoading, submit };
}
