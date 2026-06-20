import Link from 'next/link'

const BENEFITS = [
  { icon: '🔗', title: 'Votre lien, vos clients', desc: 'Partagez un lien unique. Vos habitués réservent directement chez vous.' },
  { icon: '📅', title: 'Votre agenda, vos règles', desc: 'Bloquez vos créneaux librement. Personne ne vous impose un planning.' },
  { icon: '💶', title: 'Zéro commission', desc: 'Ce que vous facturez, vous le gardez. Entièrement.' },
  { icon: '📲', title: 'Notification immédiate', desc: 'Chaque demande arrive en temps réel. Vous acceptez ou refusez en un clic.' },
  { icon: '📊', title: 'Vos stats en un coup d\'œil', desc: 'CA, économies réalisées, courses — tout en temps réel sur votre dashboard.' },
  { icon: '🤝', title: 'Prêt en 5 minutes', desc: 'Votre espace est opérationnel le jour même. On configure tout.' },
]

const STEPS = [
  { num: '01', title: 'Contactez-nous', desc: 'Un email suffit. Votre espace est prêt en quelques minutes.' },
  { num: '02', title: 'Personnalisez', desc: 'Vos tarifs, votre véhicule, vos disponibilités — depuis votre tableau de bord.' },
  { num: '03', title: 'Partagez', desc: 'Envoyez votre lien à vos clients. Ils réservent. Vous conduisez.' },
]

const ROI_ROWS = [
  { courses: 5,   eco: 19,  net: -55, positive: false },
  { courses: 10,  eco: 37,  net: -37, positive: false },
  { courses: 20,  eco: 75,  net:   1, positive: true, highlight: true },
  { courses: 30,  eco: 112, net:  38, positive: true },
  { courses: 50,  eco: 187, net: 113, positive: true },
  { courses: 100, eco: 374, net: 300, positive: true },
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
          <Link href="/connexion" className="text-white/60 hover:text-white text-[13px] font-medium transition-colors">
            Connexion
          </Link>
          <a href="mailto:damiendambassador@gmail.com?subject=Je veux ma page D-VTC"
            className="bg-[#C9A84C] text-[#0A1628] px-4 py-2 rounded-[8px] text-[13px] font-bold hover:opacity-90 transition-opacity">
            Démarrer — 74€/mois
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-[#0A1628] text-white px-8 pt-20 pb-24 text-center">
        <div className="max-w-[620px] mx-auto">
          <span className="inline-block text-[11px] font-bold tracking-[.2em] uppercase text-[#C9A84C] mb-6 border border-[#C9A84C]/30 rounded-full px-4 py-1.5">
            Chauffeurs VTC indépendants
          </span>
          <h1 className="font-serif text-[48px] font-bold leading-[1.1] mb-5 tracking-[-0.02em]">
            Vos clients.<br />
            <span className="text-[#C9A84C]">Votre liberté.</span>
          </h1>
          <p className="text-[16px] text-white/65 leading-[1.7] mb-8 max-w-[460px] mx-auto">
            Une page de réservation à votre nom. Vos clients réservent sans intermédiaire, vous gardez 100%.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="mailto:damiendambassador@gmail.com?subject=Je veux ma page D-VTC"
              className="bg-[#C9A84C] text-[#0A1628] px-8 py-4 rounded-[10px] text-[15px] font-bold hover:opacity-90 transition-opacity">
              Je veux ma page
            </a>
            <Link href="/r/patrick-vtc"
              className="bg-white/10 text-white px-8 py-4 rounded-[10px] text-[15px] font-semibold hover:bg-white/20 transition-colors border border-white/20">
              Voir un exemple live
            </Link>
          </div>
          <p className="text-[12px] text-white/35 mt-5">74€/mois · Rentable dès 20 courses directes · Réponse sous 24h</p>
        </div>
      </section>

      {/* Comparatif */}
      <section className="px-8 py-20 bg-white">
        <div className="max-w-[860px] mx-auto">
          <h2 className="font-serif text-[34px] font-bold text-[#0A1628] text-center mb-3">
            Ce que les plateformes vous coûtent
          </h2>
          <p className="text-[15px] text-[#6B7280] text-center mb-12 max-w-[400px] mx-auto">
            200 courses/mois à 17€. La différence est brutale.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="border-2 border-[#E8EDF5] rounded-2xl overflow-hidden">
              <div className="bg-[#F4F6FA] px-6 py-4 flex items-center justify-between">
                <span className="font-bold text-[#3A4456] text-[15px]">Via plateforme</span>
                <span className="text-[11px] text-[#8A94A6] bg-white border border-[#E8EDF5] px-3 py-1 rounded-full">Aujourd'hui</span>
              </div>
              <div className="px-6 py-5 flex flex-col gap-4">
                <div className="flex justify-between">
                  <span className="text-[14px] text-[#6B7280]">CA brut (200 × 17€)</span>
                  <span className="font-bold text-[#0A1628]">3 400€</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[14px] text-[#6B7280]">Commission (22%)</span>
                  <span className="font-bold text-red-500">- 748€</span>
                </div>
                <div className="border-t border-[#E8EDF5] pt-4 flex justify-between">
                  <span className="text-[14px] font-semibold text-[#0A1628]">Vous encaissez</span>
                  <span className="text-[22px] font-bold text-[#0A1628]">2 652€</span>
                </div>
              </div>
            </div>

            <div className="border-2 border-[#C9A84C] rounded-2xl overflow-hidden">
              <div className="bg-[#C9A84C] px-6 py-4 flex items-center justify-between">
                <span className="font-bold text-[#0A1628] text-[15px]">Avec D-VTC</span>
                <span className="text-[11px] text-[#0A1628] bg-white/50 px-3 py-1 rounded-full font-semibold">Liberté</span>
              </div>
              <div className="px-6 py-5 flex flex-col gap-4">
                <div className="flex justify-between">
                  <span className="text-[14px] text-[#6B7280]">140 courses via plateforme</span>
                  <span className="font-bold text-[#0A1628]">1 856€</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[14px] text-[#6B7280]">60 courses directes (0%)</span>
                  <span className="font-bold text-green-600">+ 1 020€</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[14px] text-[#6B7280]">Abonnement D-VTC</span>
                  <span className="text-[#6B7280]">- 74€</span>
                </div>
                <div className="border-t border-[#E8EDF5] pt-4 flex justify-between">
                  <span className="text-[14px] font-semibold text-[#0A1628]">Vous encaissez</span>
                  <span className="text-[22px] font-bold text-green-600">2 802€</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ROI table */}
      <section className="bg-[#F4F6FA] px-8 py-20">
        <div className="max-w-[680px] mx-auto">
          <h2 className="font-serif text-[34px] font-bold text-[#0A1628] text-center mb-3">
            À partir de quand<br />êtes-vous rentable ?
          </h2>
          <p className="text-[14px] text-[#6B7280] text-center mb-10">
            Économie par course directe : <strong className="text-[#0A1628]">3,74€</strong>
          </p>

          <div className="bg-white rounded-2xl border border-[#E8EDF5] overflow-hidden">
            <div className="grid grid-cols-4 px-6 py-3 bg-[#F8F9FC] border-b border-[#E8EDF5]">
              <span className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-[.08em]">Courses directes</span>
              <span className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-[.08em] text-right">Économie</span>
              <span className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-[.08em] text-right">D-VTC</span>
              <span className="text-[11px] font-bold text-[#8A94A6] uppercase tracking-[.08em] text-right">Gain net</span>
            </div>
            {ROI_ROWS.map((row) => (
              <div key={row.courses}
                className={['grid grid-cols-4 px-6 py-4 border-b border-[#E8EDF5] last:border-0 items-center',
                  row.highlight ? 'bg-[#FBF7EC] border-l-4 border-l-[#C9A84C]' : ''].join(' ')}>
                <div className="flex items-center gap-2">
                  <span className={`text-[15px] font-bold ${row.highlight ? 'text-[#C9A84C]' : 'text-[#0A1628]'}`}>
                    {row.courses} courses
                  </span>
                  {row.highlight && <span className="text-[10px] bg-[#C9A84C] text-[#0A1628] font-bold px-2 py-0.5 rounded-full">SEUIL</span>}
                </div>
                <span className="text-[15px] font-semibold text-green-600 text-right">+ {row.eco}€</span>
                <span className="text-[14px] text-[#8A94A6] text-right">- 74€</span>
                <span className={`text-[15px] font-bold text-right ${row.positive ? 'text-green-600' : 'text-red-400'}`}>
                  {row.positive ? '+' : ''}{row.net}€
                </span>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <p className="text-[13px] text-[#6B7280]">
              20 courses directes = <strong className="text-[#0A1628]">10% de votre activité</strong>. Le reste continue normalement.
            </p>
            <p className="text-[13px] text-[#6B7280] mt-1">
              Au-delà du seuil, chaque course directe vous rapporte <strong className="text-[#0A1628]">3,74€ de plus</strong> — sans rien changer à votre façon de travailler.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-8 py-20">
        <div className="max-w-[1000px] mx-auto">
          <h2 className="font-serif text-[34px] font-bold text-[#0A1628] text-center mb-3">Tout ce qu'il vous faut</h2>
          <p className="text-[15px] text-[#6B7280] text-center mb-12 max-w-[340px] mx-auto">Tout ce dont vous avez besoin, sans la complexité.</p>
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

      {/* Steps */}
      <section className="bg-[#F4F6FA] px-8 py-20">
        <div className="max-w-[800px] mx-auto">
          <h2 className="font-serif text-[34px] font-bold text-[#0A1628] text-center mb-12">Comment ça fonctionne</h2>
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

      {/* CTA */}
      <section className="bg-[#0A1628] px-8 py-20 text-center">
        <div className="max-w-[540px] mx-auto">
          <h2 className="font-serif text-[38px] font-bold text-white mb-4">
            Vos clients fidèles.<br />
            <span className="text-[#C9A84C]">Votre agenda libre.</span>
          </h2>
          <p className="text-[15px] text-white/55 mb-10 leading-[1.6]">
            20 courses directes par mois suffisent. Au-delà, chaque course est du gain pur — sans rendre de comptes à personne.
          </p>
          <a href="mailto:damiendambassador@gmail.com?subject=Je veux ma page D-VTC"
            className="inline-block bg-[#C9A84C] text-[#0A1628] px-10 py-4 rounded-[10px] text-[15px] font-bold hover:opacity-90 transition-opacity">
            Je veux ma page — 74€/mois
          </a>
          <p className="text-[12px] text-white/30 mt-5">Réponse sous 24h · damiendambassador@gmail.com</p>
        </div>
      </section>

      <footer className="bg-[#06101E] text-white/30 text-center py-6 text-[12px]">
        D-VTC · Service propulsé par D Embassy · {new Date().getFullYear()}
      </footer>
    </div>
  )
}
