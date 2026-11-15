import { useLocale, type Locale } from "../i18n/index.js";
import { errorMessages } from "./i18n.js";

export function errorText(locale: Locale, code: string): string {
  const dict = errorMessages[locale] as Record<string, string>;
  return dict[code] ?? dict.unknown ?? code;
}

/** `(code) => text` for server ErrorCodes and the client codes "connect" / "unknown". */
export function useErrorText(): (code: string) => string {
  const locale = useLocale();
  return (code) => errorText(locale, code);
}
