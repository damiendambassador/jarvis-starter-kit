import Link from 'next/link'

const BENEFITS = [
  {
    icon: '🔗',
    title: 'Votre page perso en 5 min',
    desc: 'Lien unique à partager à vos clients. Ils réservent directement chez vous, sans intermédiaire.',
  },
  {
    icon: '💶',
    title: 'Zéro commission',
    desc: 'Contrairement à Uber ou Bolt qui prennent 25 à 30%, chaque euro va directement dans votre poche.',
  },
  {
    icon: '📲',
    title: 'Notifications instantanées',
    desc: 'Chaque nouvelle demande vous est envoyée par email. Acceptez ou refusez en un clic depuis votre dashboard.',
  },
  {
    icon: '📅',
    title: 'Agenda et disponibilités',
    desc: 'Bloquez les créneaux où vous n\'êtes pas disponible. Vos clients ne peuvent pas réserver sur ces horaires.',
  },
  {
    icon: '📊',
    title: 'Tableau de bord pro',
    desc: 'Suivez votre chiffre d\'affaires, vos économies vs Uber, votre taux de fidélité client en temps réel.',
  },
  {
    icon: '🤝',
    title: 'Setup clé en main',
    desc: 'Votre page, votre compte, vos tarifs — tout est configuré pour vous. Vous n\'avez rien à coder.',
  },
]

const STEPS = [
  { num: '01', title: 'Contactez-nous', desc: 'Envoyez-nous votre nom et email. Votre espace est créé en quelques minutes.' },
  { num: '02', title: 'Personnalisez', desc: 'Ajoutez votre véhicule, vos tarifs, vos disponibilités depuis votre tableau de bord.' },
  { num: '03', title: 'Partagez', desc: 'Envoyez votre lien à vos clients réguliers. Ils réservent, vous conduisez.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* Nav */}
      <nav className="bg-[#0A1628] px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-[36px] h-[36px] rounded-[9px] border border-[#C9A84C]/50 flex items-center justify-center">
            <span className="text-[#C9A84C] font-bold text-[17px] leading-none">D</span>
          </div>
          <span className="text-white font-bold text-[16px] tracking-[.02em]">D-VTC</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard/login" className="text-white/60 hover:text-white text-[13px] font-medium transition-colors">
            Espace chauffeur
          </Link>
          <a
            href="mailto:damiendambassador@gmail.com?subject=Je veux ma page D-VTC"
            className="bg-[#C9A84C] text-[#0A1628] px-4 py-2 rounded-[8px] text-[13px] font-bold hover:opacity-90 transition-opacity">
            Démarrer — 60€/mois
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-[#0A1628] text-white px-8 pt-20 pb-24 text-center">
        <div className="max-w-[680px] mx-auto">
          <span className="inline-block text-[11px] font-bold tracking-[.2em] uppercase text-[#C9A84C] mb-6 border border-[#C9A84C]/30 rounded-full px-4 py-1.5">
            Pour les chauffeurs VTC indépendants
          </span>
          <h1 className="font-serif text-[46px] font-bold leading-[1.1] mb-6 tracking-[-0.02em]">
            Votre propre page de<br />
            <span className="text-[#C9A84C]">réservation privée</span>
          </h1>
          <p className="text-[17px] text-white/70 leading-[1.7] mb-10 max-w-[520px] mx-auto">
            Fini les commissions Uber et Bolt. Recevez vos réservations directement, gérez votre agenda et encaissez 100% de vos courses.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:damiendambassador@gmail.com?subject=Je veux ma page D-VTC"
              className="bg-[#C9A84C] text-[#0A1628] px-8 py-4 rounded-[10px] text-[15px] font-bold hover:opacity-90 transition-opacity">
              Demander ma page
            </a>
            <Link href="/r/patrick-vtc"
              className="bg-white/10 text-white px-8 py-4 rounded-[10px] text-[15px] font-semibold hover:bg-white/20 transition-colors border border-white/20">
              Réserver une course
            </Link>
          </div>
          <p className="text-[12px] text-white/40 mt-5">Setup en 5 minutes · À partir de 60€/mois · Réponse sous 24h</p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#F8F3E8] px-8 py-10">
        <div className="max-w-[800px] mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { value: '28%', label: 'de commission économisée vs Uber' },
            { value: '< 5 min', label: 'pour avoir votre page active' },
            { value: '100%', label: 'de vos revenus vous appartiennent' },
          ].map(s => (
            <div key={s.label}>
              <div className="font-serif text-[36px] font-bold text-[#0A1628]">{s.value}</div>
              <div className="text-[13px] text-[#6B7280] mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="px-8 py-20">
        <div className="max-w-[1000px] mx-auto">
          <h2 className="font-serif text-[34px] font-bold text-[#0A1628] text-center mb-3">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-[15px] text-[#6B7280] text-center mb-12 max-w-[480px] mx-auto">
            Une plateforme conçue pour les chauffeurs indépendants qui veulent garder le contrôle.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {BENEFITS.map(b => (
              <div key={b.title} className="bg-white border border-[#E8EDF5] rounded-2xl px-6 py-6 hover:shadow-md transition-shadow">
                <div className="text-[28px] mb-3">{b.icon}</div>
                <h3 className="text-[15px] font-bold text-[#0A1628] mb-2">{b.title}</h3>
                <p className="text-[13px] text-[#6B7280] leading-[1.6]">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-[#F4F6FA] px-8 py-20">
        <div className="max-w-[800px] mx-auto">
          <h2 className="font-serif text-[34px] font-bold text-[#0A1628] text-center mb-12">
            Comment ça fonctionne
          </h2>
          <div className="flex flex-col md:flex-row gap-6">
            {STEPS.map((s, i) => (
              <div key={s.num} className="flex-1 relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-[calc(100%+12px)] w-6 border-t-2 border-dashed border-[#C9A84C]/40" />
                )}
                <div className="bg-white rounded-2xl border border-[#E8EDF5] px-6 py-6">
                  <div className="font-serif text-[28px] font-bold text-[#C9A84C] mb-3">{s.num}</div>
                  <h3 className="text-[15px] font-bold text-[#0A1628] mb-2">{s.title}</h3>
                  <p className="text-[13px] text-[#6B7280] leading-[1.6]">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-[#0A1628] px-8 py-20 text-center">
        <div className="max-w-[560px] mx-auto">
          <h2 className="font-serif text-[34px] font-bold text-white mb-4">
            Prêt à reprendre le contrôle ?
          </h2>
          <p className="text-[15px] text-white/60 mb-8 leading-[1.7]">
            Rejoignez les chauffeurs qui encaissent 100% de leurs courses sans passer par les plateformes.
          </p>
          <a
            href="mailto:damiendambassador@gmail.com?subject=Je veux ma page D-VTC"
            className="inline-block bg-[#C9A84C] text-[#0A1628] px-10 py-4 rounded-[10px] text-[15px] font-bold hover:opacity-90 transition-opacity">
            Demander ma page
          </a>
          <p className="text-[12px] text-white/30 mt-4">À partir de 60€/mois · Réponse sous 24h · damiendambassador@gmail.com</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#06101E] text-white/30 text-center py-6 text-[12px]">
        D-VTC · Service propulsé par D Embassy · {new Date().getFullYear()}
      </footer>
    </div>
  )
}
