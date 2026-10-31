import type { Modele } from '../config.ts';
import { euros } from '../euros.ts';
import type { Offre } from '../offre.ts';
import { telechargerPage } from './http.ts';

const RECHERCHE = 'https://www.dealabs.com/search?sortBy=new&q=';
const TAILLE_65 = /\b65\s*("|”|''|pouces)/i;
const MONTANT = /(\d[\d\s.,]*)\s?€/g;
const AVANTAGE_A_DEDUIRE = /^\+\s*(\d[\d\s.,]*)\s?€\s*(de\s+)?(cagnott|en carte cadeau|en bon|offert|rembours)/i;

interface ThreadDealabs {
  threadId: string;
  title: string;
  titleSlug: string;
  price: number | null;
  status: string;
  isExpired: boolean;
  merchant: { merchantName: string } | null;
}

export async function lireOffresDealabs(modele: Modele): Promise<Offre[]> {
  const pages = await Promise.all(
    modele.recherchesDealabs.map((terme) => telechargerPage(RECHERCHE + encodeURIComponent(terme))),
  );
  const threads = pages.flatMap(extraireThreads);
  if (threads.length === 0) {
    throw new Error('Aucune offre lue sur Dealabs : la page a peut-être changé de format');
  }
  const sansDoublons = new Map(threads.map((thread) => [thread.threadId, thread]));
  return [...sansDoublons.values()].filter((thread) => concerne(modele, thread.title)).map(versOffre);
}

function extraireThreads(html: string): ThreadDealabs[] {
  return [...html.matchAll(/data-vue3='([^']*ThreadMainListItemNormalizer[^']*)'/g)].map(
    ([, attribut]) => JSON.parse(decoderEntitesHtml(attribut)).props.thread,
  );
}

function decoderEntitesHtml(texte: string): string {
  return texte.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&');
}

function concerne({ gamme }: Modele, titre: string): boolean {
  return new RegExp(`65${gamme}`, 'i').test(titre) || (new RegExp(`\\b${gamme}\\b`, 'i').test(titre) && TAILLE_65.test(titre));
}

function versOffre(thread: ThreadDealabs): Offre {
  const prixAffiche = thread.price ?? 0;
  const prix = prixApresRemises(prixAffiche, thread.title);
  return {
    source: 'Dealabs',
    id: thread.threadId,
    titre: thread.title,
    vendeur: thread.merchant?.merchantName ?? 'marchand inconnu',
    prix,
    detailPrix: prix < prixAffiche ? `prix affiché ${euros(prixAffiche)}` : undefined,
    disponible: thread.status === 'Activated' && !thread.isExpired,
    url: `https://www.dealabs.com/bons-plans/${thread.titleSlug}-${thread.threadId}`,
  };
}

/**
 * Le prix Dealabs inclut déjà les remises immédiates et les ODR.
 * Le titre peut en plus annoncer un prix sous condition (« 2022.41€ nouveau client »)
 * ou un avantage cumulable (« +165€ en carte cadeau », « +65,96€ cagnotté ») : on retient le plus bas.
 */
function prixApresRemises(prixAffiche: number, titre: string): number {
  const prixSousCondition = [...titre.matchAll(MONTANT)]
    .map(([, montant]) => lireMontant(montant))
    .filter((montant) => montant >= prixAffiche / 2 && montant < prixAffiche);
  const avantages = [...titre.matchAll(/\+[^)]*/g)]
    .map(([texte]) => texte.match(AVANTAGE_A_DEDUIRE)?.[1])
    .filter((montant) => montant !== undefined)
    .map(lireMontant);
  const prixApresAvantages = prixAffiche - avantages.reduce((total, montant) => total + montant, 0);
  return Math.min(prixAffiche, prixApresAvantages, ...prixSousCondition);
}

function lireMontant(texte: string): number {
  const sansEspaces = texte.replace(/\s/g, '');
  const decimalAVirgule = /,\d{1,2}$/.test(sansEspaces);
  return Number(decimalAVirgule ? sansEspaces.replace(/\./g, '').replace(',', '.') : sansEspaces.replace(/,/g, ''));
}
