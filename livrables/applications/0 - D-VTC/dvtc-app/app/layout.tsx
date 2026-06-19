import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'D-VTC — Réservez votre chauffeur privé',
  description: 'Réservez votre chauffeur privé en toute simplicité. Tarifs clairs, sans surprise.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
