import type { Offre } from '../offre.ts';
import { telechargerPage } from './http.ts';

const EN_STOCK = /InStock|LimitedAvailability|OnlineOnly/;

interface ProduitStructure {
  '@type': string;
  name: string;
  mpn?: string;
  sku?: string;
  offers?: { price: string; availability: string };
}

export async function lireOffresLg(urls: string[]): Promise<Offre[]> {
  return Promise.all(urls.map(lireOffreLg));
}

async function lireOffreLg(url: string): Promise<Offre> {
  const produit = extraireProduit(await telechargerPage(url));
  if (!produit?.offers) {
    throw new Error(`Prix introuvable sur ${url}`);
  }
  return {
    source: 'LG',
    id: produit.sku ?? url,
    titre: produit.mpn ?? produit.name,
    vendeur: 'LG',
    prix: Number(produit.offers.price),
    disponible: EN_STOCK.test(produit.offers.availability),
    url,
  };
}

function extraireProduit(html: string): ProduitStructure | undefined {
  return [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)]
    .map(([, json]) => lireJson(json))
    .find((bloc) => bloc?.['@type'] === 'Product');
}

function lireJson(json: string): ProduitStructure | undefined {
  try {
    return JSON.parse(json);
  } catch {
    return undefined;
  }
}
