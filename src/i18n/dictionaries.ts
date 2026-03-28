import { Locale } from "./config";

const dictionaries = {
  ja: () => import("../../messages/ja.json").then((m) => m.default),
  en: () => import("../../messages/en.json").then((m) => m.default),
};

export async function getDictionary(locale: Locale) {
  return dictionaries[locale]();
}
