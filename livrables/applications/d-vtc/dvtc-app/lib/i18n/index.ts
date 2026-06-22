import { useState, useEffect } from 'react'
import { dict as fr, locale as frLocale } from './fr'
import { dict as en, locale as enLocale } from './en'
import { dict as es, locale as esLocale } from './es'

export type Lang = 'fr' | 'en' | 'es'
export type Dict = typeof fr

const LANGS: Lang[] = ['fr', 'en', 'es']
const dicts = { fr, en, es } as const
const locales = { fr: frLocale, en: enLocale, es: esLocale }

export function useLanguage() {
  const [lang, setLangState] = useState<Lang>('fr')

  useEffect(() => {
    const saved = localStorage.getItem('dvtc_lang') as Lang | null
    if (saved && LANGS.includes(saved)) setLangState(saved)
  }, [])

  function setLang(l: Lang) {
    setLangState(l)
    localStorage.setItem('dvtc_lang', l)
  }

  return {
    lang,
    setLang,
    t: dicts[lang] as Dict,
    dateFnsLocale: locales[lang],
  }
}
