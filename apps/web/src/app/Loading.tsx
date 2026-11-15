import { useT } from "../shared/i18n/index.js";
import { appMessages } from "./i18n.js";

export function Loading() {
  const t = useT(appMessages);
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <p role="status" className="m-0 text-muted">
        {t("loading")}
      </p>
    </main>
  );
}
