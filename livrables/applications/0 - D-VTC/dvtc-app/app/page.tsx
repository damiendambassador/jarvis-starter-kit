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
    desc: 'Contrairement à Uber ou Bolt qui prennent 22 à 25%, chaque euro va directement dans votre poche.',
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

const ROI_ROWS = [
  { courses: 5,   eco: 19,  net: -50, positive: false },
  { courses: 10,  eco: 37,  net: -32, positive: false },
  { courses: 19,  eco: 71,  net: 2,   positive: true,  highlight: true },
  { courses: 30,  eco: 112, net: 43,  positive: true },
  { courses: 50,  eco: 187, net: 118, positive: true },
  { courses: 100, eco: 374, net: 305, positive: true },
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
            Démarrer — 69€/mois
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-[#0A1628] text-white px-8 pt-20 pb-24 text-center">
        <div className="max-w-[700px] mx-auto">
          <span className="inline-block text-[11px] font-bold tracking-[.2em] uppercase text-[#C9A84C] mb-6 border border-[#C9A84C]/30 rounded-full px-4 py-1.5">
            Pour les chauffeurs VTC indépendants
          </span>
          <h1 className="font-serif text-[46px] font-bold leading-[1.1] mb-6 tracking-[-0.02em]">
            Reprenez 22% de commission<br />
            <span className="text-[#C9A84C]">sur chaque course directe</span>
          </h1>
          <p className="text-[17px] text-white/70 leading-[1.7] mb-4 max-w-[540px] mx-auto">
            Uber et Bolt prennent en moyenne <strong className="text-white">3,74€ par course</strong> de commission. Avec votre page D-VTC, vous encaissez 100% du tarif directement.
          </p>
          <p className="text-[15px] text-[#C9A84C] font-semibold mb-10">
            Rentable dès 19 courses directes par mois — soit 10% de votre activité.
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
          <p className="text-[12px] text-white/40 mt-5">Setup en 5 minutes · 69€/mois · Réponse sous 24h</p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#F8F3E8] px-8 py-10">
        <div className="max-w-[900px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '22%', label: 'de commission prélevée par Uber/Bolt en moyenne' },
            { value: '3,74€', label: 'perdus à chaque course à 17€ via plateforme' },
            { value: '19', label: 'courses directes/mois pour rembourser D-VTC' },
            { value: '100%', label: 'de vos revenus directs restent dans votre poche' },
          ].map(s => (
            <div key={s.label}>
              <div className="font-serif text-[36px] font-bold text-[#0A1628]">{s.value}</div>
              <div className="text-[12px] text-[#6B7280] mt-1 leading-[1.5]">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Comparatif Uber vs D-VTC */}
      <section className="px-8 py-20 bg-white">
        <div className="max-w-[900px] mx-auto">
          <h2 className="font-serif text-[34px] font-bold text-[#0A1628] text-center mb-3">
            Ce que vous perdez chaque mois
          </h2>
          <p className="text-[15px] text-[#6B7280] text-center mb-12 max-w-[520px] mx-auto">
            Pour un chauffeur qui fait 200 courses/mois à 17€ de panier moyen, la différence est brutale.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">

            {/* Colonne Uber */}
            <div className="border-2 border-[#E8EDF5] rounded-2xl overflow-hidden">
              <div className="bg-[#F4F6FA] px-6 py-4 flex items-center justify-between">
                <span className="font-bold text-[#3A4456] text-[16px]">Uber / Bolt</span>
                <span className="text-[12px] text-[#8A94A6] bg-white border border-[#E8EDF5] px-3 py-1 rounded-full">Situation actuelle</span>
              </div>
              <div className="px-6 py-5 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-[14px] text-[#6B7280]">CA brut (200 courses × 17€)</span>
                  <span className="font-bold text-[#0A1628]">3 400€</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[14px] text-[#6B7280]">Commission plateforme (22%)</span>
                  <span className="font-bold text-red-500">- 748€</span>
                </div>
                <div className="border-t border-[#E8EDF5] pt-4 flex justify-between items-center">
                  <span className="text-[14px] font-semibold text-[#0A1628]">Ce que vous encaissez</span>
                  <span className="text-[22px] font-bold text-[#0A1628]">2 652€</span>
                </div>
              </div>
            </div>

            {/* Colonne D-VTC */}
            <div className="border-2 border-[#C9A84C] rounded-2xl overflow-hidden">
              <div className="bg-[#C9A84C] px-6 py-4 flex items-center justify-between">
                <span className="font-bold text-[#0A1628] text-[16px]">D-VTC (30% en direct)</span>
                <span className="text-[12px] text-[#0A1628] bg-white/50 px-3 py-1 rounded-full font-semibold">Avec D-VTC</span>
              </div>
              <div className="px-6 py-5 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-[14px] text-[#6B7280]">140 courses via plateforme (22%)</span>
                  <span className="font-bold text-[#0A1628]">2 372€ net</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[14px] text-[#6B7280]">60 courses directes (0% commission)</span>
                  <span className="font-bold text-green-600">+ 1 020€ net</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[14px] text-[#6B7280]">Abonnement D-VTC</span>
                  <span className="font-bold text-[#6B7280]">- 69€</span>
                </div>
                <div className="border-t border-[#E8EDF5] pt-4 flex justify-between items-center">
                  <span className="text-[14px] font-semibold text-[#0A1628]">Ce que vous encaissez</span>
                  <span className="text-[22px] font-bold text-green-600">3 323€</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#0A1628] rounded-2xl px-8 py-6 text-center">
            <p className="text-white text-[15px] mb-1">Gain mensuel avec seulement 30% de courses directes</p>
            <p className="text-[#C9A84C] font-serif text-[42px] font-bold">+ 671€ / mois</p>
            <p className="text-white/50 text-[13px] mt-1">soit + 8 052€ sur l'année</p>
          </div>
        </div>
      </section>

      {/* Calculateur de rentabilité */}
      <section className="bg-[#F4F6FA] px-8 py-20">
        <div className="max-w-[720px] mx-auto">
          <h2 className="font-serif text-[34px] font-bold text-[#0A1628] text-center mb-3">
            À partir de combien de courses<br />D-VTC devient rentable ?
          </h2>
          <p className="text-[15px] text-[#6B7280] text-center mb-10 max-w-[480px] mx-auto">
            Basé sur un panier moyen de 17€ et une commission Uber de 22% (soit 3,74€ économisés par course directe).
          </p>

          <div className="bg-white rounded-2xl border border-[#E8EDF5] overflow-hidden">
            <div className="grid grid-cols-4 px-6 py-3 bg-[#F8F9FC] border-b border-[#E8EDF5]">
              <span className="text-[12px] font-bold text-[#8A94A6] uppercase tracking-[.08em]">Courses directes</span>
              <span className="text-[12px] font-bold text-[#8A94A6] uppercase tracking-[.08em] text-right">Économie commissions</span>
              <span className="text-[12px] font-bold text-[#8A94A6] uppercase tracking-[.08em] text-right">Coût D-VTC</span>
              <span className="text-[12px] font-bold text-[#8A94A6] uppercase tracking-[.08em] text-right">Gain net</span>
            </div>

            {ROI_ROWS.map((row) => (
              <div
                key={row.courses}
                className={[
                  'grid grid-cols-4 px-6 py-4 border-b border-[#E8EDF5] last:border-0 items-center',
                  row.highlight ? 'bg-[#FBF7EC] border-l-4 border-l-[#C9A84C]' : '',
                ].join(' ')}>
                <div className="flex items-center gap-2">
                  <span className={`text-[15px] font-bold ${row.highlight ? 'text-[#C9A84C]' : 'text-[#0A1628]'}`}>
                    {row.courses} courses
                  </span>
                  {row.highlight && (
                    <span className="text-[10px] bg-[#C9A84C] text-[#0A1628] font-bold px-2 py-0.5 rounded-full">SEUIL</span>
                  )}
                </div>
                <span className="text-[15px] font-semibold text-green-600 text-right">+ {row.eco}€</span>
                <span className="text-[15px] text-[#8A94A6] text-right">- 69€</span>
                <span className={`text-[15px] font-bold text-right ${row.positive ? 'text-green-600' : 'text-red-400'}`}>
                  {row.positive ? '+ ' : ''}{row.net}€
                </span>
              </div>
            ))}
          </div>

          <p className="text-[13px] text-[#8A94A6] text-center mt-5">
            Sur 200 courses/mois, 19 courses directes = seulement <strong className="text-[#0A1628]">10% de votre activité</strong>. Le reste continue sur Uber et Bolt.
          </p>
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
        <div className="max-w-[600px] mx-auto">
          <h2 className="font-serif text-[34px] font-bold text-white mb-4">
            19 courses directes.<br />C'est tout ce qu'il faut.
          </h2>
          <p className="text-[15px] text-white/60 mb-2 leading-[1.7]">
            Sur 200 courses/mois, 19 en direct via votre lien D-VTC et l'abonnement est remboursé. Tout ce qui dépasse, c'est du gain pur.
          </p>
          <p className="text-[14px] text-[#C9A84C] font-semibold mb-10">
            Vos 5 meilleurs clients fidèles = déjà rentable.
          </p>
          <a
            href="mailto:damiendambassador@gmail.com?subject=Je veux ma page D-VTC"
            className="inline-block bg-[#C9A84C] text-[#0A1628] px-10 py-4 rounded-[10px] text-[15px] font-bold hover:opacity-90 transition-opacity">
            Demander ma page — 69€/mois
          </a>
          <p className="text-[12px] text-white/30 mt-5">Réponse sous 24h · damiendambassador@gmail.com</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#06101E] text-white/30 text-center py-6 text-[12px]">
        D-VTC · Service propulsé par D Embassy · {new Date().getFullYear()}
      </footer>
    </div>
  )
}
