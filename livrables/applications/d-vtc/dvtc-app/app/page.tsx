import Link from 'next/link'

const BENEFITS = [
  { icon: '💶', title: 'Zéro commission', desc: 'Ce que vous facturez, vous le gardez entièrement. Aucun pourcentage prélevé.' },
  { icon: '📲', title: 'Notification immédiate', desc: 'Chaque demande arrive en temps réel. Vous acceptez ou refusez en un clic.' },
  { icon: '🤝', title: 'Opérationnel en 24h', desc: 'Votre lien est actif le jour même. On s'occupe de tout.' },
]

const STEPS = [
  { num: '01', title: 'Contactez-nous', desc: 'Un email suffit. Votre espace est prêt en quelques minutes.' },
  { num: '02', title: 'Personnalisez', desc: 'Vos tarifs, votre véhicule, vos disponibilités — depuis votre tableau de bord.' },
  { num: '03', title: 'Partagez', desc: 'Envoyez votre lien à vos clients. Ils réservent. Vous conduisez.' },
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
            Une page de réservation à votre nom. Vos clients réservent en direct — sans commission.
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
          <p className="text-[13px] text-[#6B7280] text-center">
            Rentable dès <strong className="text-[#0A1628]">20 courses directes par mois</strong> — soit 10% de votre activité. Le reste continue normalement.
          </p>

        </div>
      </section>

      {/* Benefits */}
      <section className="px-8 py-16 bg-[#F4F6FA]">
        <div className="max-w-[860px] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {BENEFITS.map(b => (
              <div key={b.title} className="bg-white border border-[#E8EDF5] rounded-2xl px-6 py-6">
                <div className="text-[28px] mb-3">{b.icon}</div>
                <h3 className="text-[15px] font-bold text-[#0A1628] mb-2">{b.title}</h3>
                <p className="text-[13px] text-[#6B7280] leading-[1.6]">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="bg-white px-8 py-16">
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
