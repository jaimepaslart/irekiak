<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

definePageMeta({ layout: 'default' })

useSeoMeta({
  title: 'Irekiak — Politique de confidentialité',
  description: 'Politique de confidentialité Irekiak Gallery Weekend Donostia / San Sebastián. Conforme RGPD.',
  robots: 'index, follow',
})
</script>

<template>
  <div class="max-w-3xl mx-auto px-6 md:px-12 py-24 pt-28">
    <NuxtLink :to="localePath('/')" class="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mb-8">
      &larr; Retour
    </NuxtLink>

    <h1 class="mb-2">Politique de confidentialité</h1>
    <p class="text-sm text-white/50 mb-12 font-mono">Irekiak Gallery Weekend — Donostia / San Sebastián</p>

    <div class="prose-invert space-y-8 text-white/85 text-[15px] leading-relaxed">
      <section>
        <h2 class="text-xl font-semibold text-white mb-3">1. Responsable du traitement</h2>
        <p>
          <strong>DAGGE</strong> (Donostiako Arte Galeria Guztien Elkartea) et Tabakalera, co-organisateurs d'Irekiak Gallery Weekend. Contact :
          <a href="mailto:irekiak@irekiak.eus" class="underline hover:text-white">irekiak@irekiak.eus</a>.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-semibold text-white mb-3">2. Données collectées</h2>
        <p>Via le formulaire de réservation des visites guidées, nous collectons :</p>
        <ul class="list-disc pl-6 space-y-1 mt-2">
          <li><strong>Nom</strong> et <strong>prénom</strong> (identification à la visite)</li>
          <li><strong>Adresse email</strong> (envoi de la confirmation et rappel)</li>
          <li><strong>Téléphone</strong> (optionnel, contact en cas de changement)</li>
          <li><strong>Nombre de participants</strong> et <strong>langue</strong> choisie</li>
          <li><strong>Besoins spécifiques</strong> (optionnel, ex: accessibilité)</li>
        </ul>
      </section>

      <section>
        <h2 class="text-xl font-semibold text-white mb-3">3. Finalités et base légale</h2>
        <ul class="list-disc pl-6 space-y-2">
          <li><strong>Gestion de la réservation</strong> (base légale : exécution du contrat) — confirmation, rappel, annulation.</li>
          <li><strong>Notification aux galeries</strong> du parcours (base légale : intérêt légitime) — pour qu'elles sachent qui vient.</li>
          <li><strong>Communication des prochaines éditions</strong> (base légale : consentement opt-in séparé) — uniquement si coche explicite.</li>
        </ul>
      </section>

      <section>
        <h2 class="text-xl font-semibold text-white mb-3">4. Destinataires</h2>
        <p>Vos données sont accessibles à :</p>
        <ul class="list-disc pl-6 space-y-1 mt-2">
          <li>L'équipe organisatrice Irekiak (DAGGE)</li>
          <li>Les galeries du parcours réservé (nom, prénom, nb participants, langue, besoins)</li>
          <li>Resend (hébergeur email, conforme RGPD, UE)</li>
          <li>Hostinger (hébergeur du site, UE)</li>
        </ul>
        <p class="mt-2">Aucune donnée n'est vendue ni transmise à des tiers non listés.</p>
      </section>

      <section>
        <h2 class="text-xl font-semibold text-white mb-3">5. Durée de conservation</h2>
        <ul class="list-disc pl-6 space-y-1">
          <li><strong>Réservations</strong> : 90 jours après l'événement (31 mai 2026 → purge automatique fin août 2026).</li>
          <li><strong>Consentement marketing</strong> : jusqu'à retrait via lien de désabonnement.</li>
          <li><strong>Logs d'audit</strong> : 12 mois (obligations légales, sécurité).</li>
        </ul>
      </section>

      <section>
        <h2 class="text-xl font-semibold text-white mb-3">6. Vos droits</h2>
        <p>Conformément au RGPD (UE 2016/679), vous avez les droits suivants :</p>
        <ul class="list-disc pl-6 space-y-1 mt-2">
          <li><strong>Accès</strong> et <strong>portabilité</strong> : obtenir une copie de vos données.</li>
          <li><strong>Rectification</strong> : corriger une information incorrecte.</li>
          <li><strong>Effacement</strong> ("droit à l'oubli") : supprimer vos données.</li>
          <li><strong>Opposition</strong> au traitement et <strong>retrait du consentement</strong>.</li>
          <li>Déposer une réclamation auprès de l'<a href="https://www.aepd.es/" target="_blank" rel="noopener" class="underline hover:text-white">AEPD</a> (Espagne) ou la <a href="https://www.cnil.fr/" target="_blank" rel="noopener" class="underline hover:text-white">CNIL</a> (France).</li>
        </ul>
        <p class="mt-3">
          Pour exercer vos droits : contactez
          <a href="mailto:irekiak@irekiak.eus" class="underline hover:text-white">irekiak@irekiak.eus</a>.
          Depuis votre page de confirmation de réservation (<code class="text-sm bg-white/10 px-1.5 py-0.5 rounded">/bookings/[token]</code>) vous pouvez directement annuler votre réservation.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-semibold text-white mb-3">7. Sécurité</h2>
        <p>
          Les données sont stockées sur un serveur Hostinger (UE), chiffrées en transit via TLS 1.3, et accessibles uniquement par l'équipe organisatrice via authentification. Les mots de passe et tokens d'administration sont rotés régulièrement. Un journal d'audit trace toutes les actions administratives.
        </p>
      </section>

      <section>
        <h2 class="text-xl font-semibold text-white mb-3">8. Cookies</h2>
        <p>
          Irekiak utilise uniquement un cookie technique <code class="text-sm bg-white/10 px-1.5 py-0.5 rounded">irekiak_locale</code> pour mémoriser votre choix de langue. Aucun cookie publicitaire ni traceur tiers n'est installé.
        </p>
      </section>

      <section>
        <p class="text-sm text-white/50">
          Dernière mise à jour : 15 avril 2026
        </p>
      </section>
    </div>
  </div>
</template>
