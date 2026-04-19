// Pré-lancement : empêche l'indexation de toutes les réponses (HTML + API) tant que le site vit sur irekiak.art.
// Supprimer ce fichier au basculement vers irekiak.eus.
export default defineEventHandler((event) => {
  setResponseHeader(event, 'X-Robots-Tag', 'noindex, nofollow')
})
