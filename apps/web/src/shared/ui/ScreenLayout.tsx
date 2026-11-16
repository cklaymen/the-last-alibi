import type { ReactNode } from "react";

type Props = { header?: ReactNode; footer?: ReactNode; children: ReactNode };

/** Mobile column below the app header: screen header near the centre, actions at the bottom. */
export function ScreenLayout({ header, footer, children }: Props) {
  return (
    <main className="mx-auto flex w-full max-w-103.5 flex-1 flex-col px-4.25 pt-[max(16px,calc(40dvh-192px))] pb-[max(17px,env(safe-area-inset-bottom))]">
      {header ? <header>{header}</header> : null}
      <div className="mt-auto flex min-w-0 flex-col gap-4.25 pt-6">
        {children}
      </div>
      {footer ? <footer className="pt-4 text-center">{footer}</footer> : null}
    </main>
  );
}
