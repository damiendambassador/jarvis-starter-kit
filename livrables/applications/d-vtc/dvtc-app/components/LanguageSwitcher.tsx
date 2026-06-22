'use client'

import type { Lang } from '@/lib/i18n'

interface Props {
  lang: Lang
  setLang: (l: Lang) => void
}

const LANGS: Lang[] = ['fr', 'en', 'es']

export default function LanguageSwitcher({ lang, setLang }: Props) {
  return (
    <div className="flex items-center gap-1 text-[11px] font-semibold tracking-widest">
      {LANGS.map((l, i) => (
        <span key={l} className="flex items-center gap-1">
          {i > 0 && <span className="text-white/20 font-normal select-none">·</span>}
          <button
            onClick={() => setLang(l)}
            className={[
              'uppercase transition-colors',
              lang === l ? 'text-[#C9A84C]' : 'text-[#8A94A6] hover:text-white',
            ].join(' ')}
          >
            {l}
          </button>
        </span>
      ))}
    </div>
  )
}
