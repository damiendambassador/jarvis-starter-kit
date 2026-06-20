import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conditions Générales de Vente — D-VTC',
  description: 'Conditions générales de vente de la plateforme D-VTC.',
}

export default function CGVPage() {
  return (
    <div className="min-h-screen bg-[#F4F6FA] py-12 px-4">
      <div className="max-w-[760px] mx-auto bg-white rounded-2xl border border-[#E8EDF5] px-8 py-10">
        <div className="mb-8 border-b border-[#F0F3F8] pb-6">
          <p className="text-[11px] font-semibold text-[#C9A84C] uppercase tracking-widest mb-2">D-VTC</p>
          <h1 className="text-[28px] font-bold text-[#0A1628]">Conditions Générales de Vente</h1>
          <p className="text-[13px] text-[#8A94A6] mt-2">Version 1.0 — en vigueur à compter du 1er juin 2026</p>
        </div>

        <div className="space-y-8 text-[14px] leading-[1.7] text-[#3A4456]">

          <section>
            <h2 className="text-[16px] font-bold text-[#0A1628] mb-3">Article 1 — Objet</h2>
            <p>
              Les présentes Conditions Générales de Vente (CGV) régissent les relations contractuelles entre D Embassy, micro-entrepreneur, et toute personne physique ou morale (ci-après "le Chauffeur") souscrivant à la plateforme numérique D-VTC.
            </p>
            <p className="mt-2">
              D-VTC est une plateforme SaaS permettant aux chauffeurs VTC indépendants de gérer leurs réservations directes, leur clientèle et leur tarification, afin de s'affranchir des commissions des plateformes tierces.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-[#0A1628] mb-3">Article 2 — Identification du prestataire</h2>
            <div className="bg-[#F4F6FA] rounded-xl p-4 text-[13px] space-y-1">
              <p><span className="font-semibold">Raison sociale :</span> D Embassy</p>
              <p><span className="font-semibold">Statut :</span> Micro-entrepreneur</p>
              <p><span className="font-semibold">SIRET :</span> 10073363300018</p>
              <p><span className="font-semibold">Code APE/NAF :</span> 7022Z</p>
              <p><span className="font-semibold">Adresse :</span> Ivry-sur-Seine (94200), France</p>
              <p><span className="font-semibold">Email :</span> damiendambassador@gmail.com</p>
            </div>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-[#0A1628] mb-3">Article 3 — Prix et facturation</h2>
            <p>
              L'abonnement à la plateforme D-VTC est facturé <strong>74,00 € TTC par mois</strong> par chauffeur.
            </p>
            <p className="mt-2">
              La TVA n'est pas applicable en vertu de l'article 293B du Code Général des Impôts (régime micro-entrepreneur).
            </p>
            <p className="mt-2">
              Une facture est émise automatiquement à chaque paiement mensuel réussi et envoyée par email au Chauffeur. Elle est également accessible depuis le tableau de bord, section "Mes factures".
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-[#0A1628] mb-3">Article 4 — Modalités de paiement</h2>
            <p>
              Le paiement est effectué par prélèvement automatique mensuel sur carte bancaire, via la plateforme sécurisée Stripe. Le Chauffeur renseigne ses coordonnées bancaires une seule fois lors de l'activation de son abonnement.
            </p>
            <p className="mt-2">
              En cas d'échec de paiement, le prestataire tentera deux nouvelles tentatives de prélèvement selon le calendrier Stripe. À l'issue de trois échecs consécutifs, l'accès à la plateforme sera suspendu jusqu'à régularisation.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-[#0A1628] mb-3">Article 5 — Durée et résiliation</h2>
            <p>
              L'abonnement est souscrit sans engagement de durée minimale. Il est renouvelé automatiquement chaque mois.
            </p>
            <p className="mt-2">
              Le Chauffeur peut résilier son abonnement à tout moment en contactant le prestataire par email à <strong>damiendambassador@gmail.com</strong>. La résiliation prend effet à la fin de la période mensuelle en cours, sans remboursement au prorata.
            </p>
            <p className="mt-2">
              Le prestataire se réserve le droit de suspendre ou résilier l'accès en cas de non-paiement, d'utilisation abusive ou contraire aux présentes CGV.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-[#0A1628] mb-3">Article 6 — Obligations du prestataire</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Mise à disposition de la plateforme 24h/24, 7j/7, avec une disponibilité cible de 99% par mois calendaire.</li>
              <li>Maintenance planifiée communiquée par email au moins 48h à l'avance.</li>
              <li>Support par email sous 48h ouvrées (du lundi au vendredi).</li>
              <li>Sécurité des données conformément au RGPD (voir Article 8).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-[#0A1628] mb-3">Article 7 — Obligations du Chauffeur</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Utiliser la plateforme conformément à la législation française en vigueur et à son statut de chauffeur VTC.</li>
              <li>Être responsable de l'exactitude des informations renseignées (tarification, coordonnées, etc.).</li>
              <li>Ne pas céder, louer ou transférer son accès à un tiers.</li>
              <li>Ne pas tenter de contourner les mécanismes de sécurité de la plateforme.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-[#0A1628] mb-3">Article 8 — Protection des données personnelles</h2>
            <p>
              Le prestataire traite les données personnelles du Chauffeur et de ses clients dans le strict respect du Règlement Général sur la Protection des Données (RGPD — Règlement UE 2016/679).
            </p>
            <p className="mt-2">
              Les données sont hébergées au sein de l'Union Européenne (Supabase EU). Le Chauffeur dispose d'un droit d'accès, de rectification et d'effacement de ses données personnelles, exercable par email.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-[#0A1628] mb-3">Article 9 — Limitation de responsabilité</h2>
            <p>
              La responsabilité du prestataire est limitée au montant des abonnements versés au cours des 12 derniers mois. Le prestataire ne peut être tenu responsable des pertes de revenus du Chauffeur, des annulations de courses ou de tout préjudice indirect.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-[#0A1628] mb-3">Article 10 — Droit applicable et litiges</h2>
            <p>
              Les présentes CGV sont soumises au droit français. En cas de litige, les parties s'efforceront de trouver une solution amiable. À défaut, le litige sera soumis aux tribunaux compétents du ressort d'Ivry-sur-Seine (94200).
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-[#0A1628] mb-3">Article 11 — Modification des CGV</h2>
            <p>
              Le prestataire se réserve le droit de modifier les présentes CGV à tout moment. Le Chauffeur sera informé par email avec un préavis minimum de 30 jours. La poursuite de l'utilisation de la plateforme après ce délai vaut acceptation des nouvelles CGV.
            </p>
          </section>

        </div>

        <div className="mt-10 pt-6 border-t border-[#F0F3F8] text-[12px] text-[#A7B0BF]">
          <p>D Embassy — SIRET : 10073363300018 — TVA non applicable, art. 293B du CGI</p>
          <p>Micro-entrepreneur dispensé d'immatriculation au RCS et au répertoire des métiers</p>
        </div>
      </div>
    </div>
  )
}
