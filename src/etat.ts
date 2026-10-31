import { readFile, writeFile } from 'node:fs/promises';

export interface Etat {
  echecs: Record<string, number>;
  offresSignalees: Record<string, number>;
}

const FICHIER = new URL('../etat.json', import.meta.url);

export async function chargerEtat(): Promise<Etat> {
  try {
    return JSON.parse(await readFile(FICHIER, 'utf8'));
  } catch {
    return { echecs: {}, offresSignalees: {} };
  }
}

export async function sauvegarderEtat(etat: Etat): Promise<void> {
  const trie: Etat = { echecs: trierCles(etat.echecs), offresSignalees: trierCles(etat.offresSignalees) };
  await writeFile(FICHIER, `${JSON.stringify(trie, null, 2)}\n`);
}

function trierCles(valeurs: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(valeurs).sort(([a], [b]) => a.localeCompare(b)));
}
