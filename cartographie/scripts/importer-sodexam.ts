/**
 * Importe un fichier CSV de relevés SODEXAM et l'envoie au back-end :
 *   npm run sodexam:importer -- data/exemples/sodexam-pluie-exemple.csv
 */
import { readFileSync } from 'node:fs';
import { backend } from '../src/backend.js';
import { chargerStations, lireCsvSodexam } from '../src/sodexam/import.js';

const fichier = process.argv[2];
if (!fichier) {
  console.error('Usage : npm run sodexam:importer -- <fichier.csv>');
  process.exit(1);
}
const { observations, erreurs } = lireCsvSodexam(readFileSync(fichier, 'utf8'), chargerStations());
erreurs.forEach((e) => console.warn(`ligne ${e.ligne} : ${e.message}`));
console.log(`${observations.length} observation(s) lue(s), ${erreurs.length} erreur(s)`);
if (observations.length) {
  const res = await backend.envoyerObservations(observations);
  console.log(`✔ back-end : ${res.importees} importée(s), ${res.ignorees} déjà présente(s)`);
}
