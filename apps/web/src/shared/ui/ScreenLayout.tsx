import type { ReactNode } from "react";

type Props = { header: ReactNode; children: ReactNode };

/** Mobile column: header sits near the vertical centre, actions stick to the bottom. */
export function ScreenLayout({ header, children }: Props) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-103.5 flex-col px-4.25 pt-[max(24px,calc(50dvh-192px))] pb-[max(17px,env(safe-area-inset-bottom))]">
      <header>{header}</header>
      <div className="mt-auto flex min-w-0 flex-col gap-4.25 pt-6">
        {children}
      </div>
    </main>
  );
}
