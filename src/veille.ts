import { config, type Modele } from './config.ts';
import { chargerEtat, sauvegarderEtat, type Etat } from './etat.ts';
import { euros } from './euros.ts';
import { notifier, type Notification } from './notification.ts';
import { cleOffre, type Offre } from './offre.ts';
import { lireOffresDealabs } from './sources/dealabs.ts';
import { lireOffresLg } from './sources/lg.ts';

interface Surveillance {
  nom: string;
  modele: Modele;
  lire: () => Promise<Offre[]>;
}

const SURVEILLANCES: Surveillance[] = config.modeles.flatMap((modele) => [
  { nom: `LG.fr ${modele.nom}`, modele, lire: () => lireOffresLg(modele.pagesLg) },
  { nom: `Dealabs ${modele.nom}`, modele, lire: () => lireOffresDealabs(modele) },
]);

const etatPrecedent = await chargerEtat();
const etat: Etat = { echecs: {}, offresSignalees: {} };
let envoiEnEchec = false;

if (config.notificationDeTest) {
  await envoyer({
    titre: 'Test veille TV LG',
    message: `Les notifications arrivent bien. Seuils : ${config.modeles.map((modele) => `${modele.nom} ≤ ${euros(modele.seuilPrix)}`).join(', ')}.`,
    urgente: false,
  });
}

for (const surveillance of SURVEILLANCES) {
  const { nom, modele } = surveillance;
  try {
    const offres = await surveillance.lire();
    console.log(`${nom} : ${offres.length} offre(s), seuil ${euros(modele.seuilPrix)}`);
    offres.forEach((offre) =>
      console.log(`  ${offre.disponible ? 'dispo  ' : 'indispo'} ${euros(offre.prix)} | ${offre.vendeur} | ${offre.titre}`),
    );
    if ((etatPrecedent.echecs[nom] ?? 0) >= config.echecsAvantAlerte) {
      await envoyer({ titre: `Veille ${nom} rétablie`, message: 'La surveillance fonctionne de nouveau.', urgente: false });
    }
    for (const offre of offres.filter((offre) => estInteressante(offre, modele))) {
      await signalerSiNouvelle(offre, modele);
    }
  } catch (erreur) {
    const message = erreur instanceof Error ? erreur.message : String(erreur);
    console.error(`${nom} en échec : ${message}`);
    conserverOffresSignalees(nom);
    etat.echecs[nom] = (etatPrecedent.echecs[nom] ?? 0) + 1;
    if (etat.echecs[nom] === config.echecsAvantAlerte) {
      await envoyer({ titre: `Veille ${nom} en panne`, message: `${config.echecsAvantAlerte} échecs d'affilée. ${message}`, urgente: false });
    }
  }
}

await sauvegarderEtat(etat);
if (envoiEnEchec) {
  process.exitCode = 1;
}

function estInteressante(offre: Offre, modele: Modele): boolean {
  return offre.disponible && offre.prix > 0 && offre.prix <= modele.seuilPrix;
}

async function signalerSiNouvelle(offre: Offre, modele: Modele): Promise<void> {
  const cle = cleOffre(offre);
  const prixDejaSignale = etatPrecedent.offresSignalees[cle];
  if (prixDejaSignale !== undefined && offre.prix >= prixDejaSignale) {
    etat.offresSignalees[cle] = prixDejaSignale;
    return;
  }
  if (await envoyer(alerte(offre, modele))) {
    etat.offresSignalees[cle] = offre.prix;
  }
}

function alerte(offre: Offre, modele: Modele): Notification {
  const detail = offre.detailPrix ? ` (${offre.detailPrix})` : '';
  const provenance = offre.source === 'Dealabs' ? `Repéré sur Dealabs chez ${offre.vendeur}` : 'En stock sur LG.fr';
  return {
    titre: `${modele.nom} à ${euros(offre.prix)} – ${offre.vendeur}`,
    message: `${provenance}${detail}\n${offre.titre}`,
    url: offre.url,
    urgente: true,
  };
}

function conserverOffresSignalees(nomSurveillance: string): void {
  const source = nomSurveillance.startsWith('LG') ? 'LG' : 'Dealabs';
  Object.entries(etatPrecedent.offresSignalees)
    .filter(([cle]) => cle.startsWith(`${source}:`))
    .forEach(([cle, prix]) => (etat.offresSignalees[cle] = prix));
}

async function envoyer(notification: Notification): Promise<boolean> {
  try {
    await notifier(config.ntfyTopic, notification);
    return true;
  } catch (erreur) {
    console.error(`Envoi impossible : ${erreur instanceof Error ? erreur.message : erreur}`);
    envoiEnEchec = true;
    return false;
  }
}
