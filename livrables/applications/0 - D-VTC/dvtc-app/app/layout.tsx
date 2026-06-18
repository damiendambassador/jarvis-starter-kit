import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'D-VTC — Réservez votre chauffeur privé',
  description: 'Réservez votre chauffeur privé en toute simplicité. Tarifs clairs, sans surprise.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
