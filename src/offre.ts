export type Source = 'LG' | 'Dealabs';

export interface Offre {
  source: Source;
  id: string;
  titre: string;
  vendeur: string;
  prix: number;
  detailPrix?: string;
  disponible: boolean;
  url: string;
}

export function cleOffre(offre: Offre): string {
  return `${offre.source}:${offre.id}`;
}
