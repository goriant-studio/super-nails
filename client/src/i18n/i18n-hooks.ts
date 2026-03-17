import { useContext } from "react";

import { I18nContext } from "./i18n-store";

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT must be used inside I18nProvider.");
  return ctx.t;
}

export function useLocale() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useLocale must be used inside I18nProvider.");
  return { locale: ctx.locale, setLocale: ctx.setLocale };
}
