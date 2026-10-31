export interface Modele {
  nom: string;
  gamme: string;
  seuilPrix: number;
  recherchesDealabs: string[];
  pagesLg: string[];
}

export const config = {
  ntfyTopic: process.env.NTFY_TOPIC ?? '',
  notificationDeTest: process.env.NOTIFICATION_DE_TEST === 'true',
  echecsAvantAlerte: 3,
  modeles: [
    {
      nom: 'G5 65"',
      gamme: 'G5',
      seuilPrix: 1500,
      recherchesDealabs: ['OLED65G5', 'lg g5 65'],
      pagesLg: ['https://www.lg.com/fr/tv-barres-de-son/oled-evo/lg-oled65g54lw-oled-tv-g5-4k/'],
    },
    {
      nom: 'G6 65"',
      gamme: 'G6',
      seuilPrix: 2000,
      recherchesDealabs: ['OLED65G6', 'lg g6 65'],
      pagesLg: [
        'https://www.lg.com/fr/tv-barres-de-son/oled-evo/oled65g66ls/',
        'https://www.lg.com/fr/tv-barres-de-son/oled-evo/lg-oled65g64lw/',
      ],
    },
  ] satisfies Modele[],
};
