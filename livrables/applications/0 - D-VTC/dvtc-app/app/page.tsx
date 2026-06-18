import { redirect } from 'next/navigation'

// Redirection depuis la racine :
// - Si un slug est connu, on peut rediriger vers la page du chauffeur
// - Sinon, page d'accueil plateforme (Phase 4)
export default function Home() {
  redirect('/login')
}
