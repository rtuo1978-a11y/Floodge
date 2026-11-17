/**
 * Données de démonstration : npm run seed
 * Comptes créés (mot de passe : FlowManage2026!) :
 *   admin@flowmanage.ci, autorite@flowmanage.ci, secours@flowmanage.ci, citoyen1@flowmanage.ci … citoyen3@flowmanage.ci
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client.js';
import type { MomentConseil, NiveauRisque, Role } from '../src/generated/prisma/enums.js';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

/** Carré d'environ `demiCoteM` mètres autour d'un point (GeoJSON Polygon). */
function carre(lat: number, lng: number, demiCoteM: number) {
  const dLat = demiCoteM / 111_320;
  const dLng = demiCoteM / (111_320 * Math.cos((lat * Math.PI) / 180));
  return {
    type: 'Polygon',
    coordinates: [
      [
        [lng - dLng, lat - dLat],
        [lng + dLng, lat - dLat],
        [lng + dLng, lat + dLat],
        [lng - dLng, lat + dLat],
        [lng - dLng, lat - dLat],
      ],
    ],
  };
}

// ⚠️ Zones de DÉMONSTRATION : emplacements et niveaux indicatifs, à remplacer
// par les données du service cartographie (branche cartographie-donnees).
const ZONES: { code: string; nom: string; commune: string; lat: number; lng: number; niveau: NiveauRisque; score: number }[] = [
  { code: 'ABJ-COCODY-PALMERAIE', nom: 'Riviera Palmeraie (bas-fonds)', commune: 'Cocody', lat: 5.3705, lng: -3.9625, niveau: 'ELEVE', score: 70 },
  { code: 'ABJ-ATTECOUBE-MOSSIKRO', nom: 'Mossikro', commune: 'Attécoubé', lat: 5.3485, lng: -4.0405, niveau: 'TRES_ELEVE', score: 85 },
  { code: 'ABJ-YOPOUGON-NIANGON', nom: 'Niangon (bas-fonds)', commune: 'Yopougon', lat: 5.3295, lng: -4.0875, niveau: 'MODERE', score: 50 },
  { code: 'ABJ-ABOBO-GARE', nom: 'Abobo Gare', commune: 'Abobo', lat: 5.4175, lng: -4.0195, niveau: 'MODERE', score: 45 },
  { code: 'ABJ-PLATEAU-CENTRE', nom: 'Plateau centre', commune: 'Plateau', lat: 5.3235, lng: -4.0205, niveau: 'FAIBLE', score: 15 },
];

const CONSEILS: { moment: MomentConseil; titre: string; contenu: string }[] = [
  { moment: 'AVANT', titre: 'Préparer un kit d’urgence', contenu: 'Eau potable, lampe torche, piles, médicaments, copies des papiers importants dans un sac étanche.' },
  { moment: 'AVANT', titre: 'Dégager les caniveaux', contenu: 'Ne jetez pas d’ordures dans les caniveaux : bouchés, ils provoquent la montée des eaux dans le quartier.' },
  { moment: 'AVANT', titre: 'Surveiller la météo', contenu: 'Suivez les bulletins de la SODEXAM et les alertes FlowManage pendant la saison des pluies.' },
  { moment: 'AVANT', titre: 'Repérer un lieu en hauteur', contenu: 'Identifiez à l’avance un endroit sûr et surélevé où vous réfugier avec votre famille.' },
  { moment: 'PENDANT', titre: 'Se mettre en hauteur', contenu: 'Montez à l’étage ou rejoignez un lieu élevé. Ne restez pas dans un sous-sol ou un bas-fond.' },
  { moment: 'PENDANT', titre: 'Couper l’électricité', contenu: 'Coupez le courant au disjoncteur si vous pouvez le faire sans toucher l’eau.' },
  { moment: 'PENDANT', titre: 'Ne pas traverser l’eau', contenu: '30 cm d’eau suffisent à emporter une voiture, 15 cm à faire tomber un adulte. Ne traversez pas à pied ni en véhicule.' },
  { moment: 'PENDANT', titre: 'Appeler les secours', contenu: 'Sapeurs-pompiers : 180 — SAMU : 185 — Police : 110 / 111 / 170. Utilisez aussi le bouton SOS de FlowManage.' },
  { moment: 'APRES', titre: 'Attendre l’autorisation', contenu: 'Ne rentrez chez vous que lorsque les autorités l’autorisent. Méfiez-vous des murs et sols fragilisés.' },
  { moment: 'APRES', titre: 'Eau et hygiène', contenu: 'Ne buvez pas l’eau du robinet avant confirmation. Lavez-vous les mains : l’eau de crue est souvent contaminée.' },
  { moment: 'APRES', titre: 'Signaler les dégâts', contenu: 'Photographiez les dégâts et signalez les zones encore inondées dans FlowManage pour aider les autres.' },
];

const BADGES = [
  { code: 'SENTINELLE', nom: 'Sentinelle', description: 'Premier signalement envoyé', icone: 'eye' },
  { code: 'VIGIE_QUARTIER', nom: 'Vigie du quartier', description: '5 signalements confirmés par les autorités', icone: 'shield' },
  { code: 'SOLIDAIRE', nom: 'Solidaire', description: '10 signalements d’autres habitants confirmés', icone: 'people' },
  { code: 'MEILLEUR_CITOYEN', nom: 'Meilleur citoyen du mois', description: 'Premier du classement mensuel', icone: 'trophy' },
];

async function main() {
  const motDePasse = await bcrypt.hash('FlowManage2026!', 10);
  const comptes: { email: string; nom: string; role: Role; commune: string }[] = [
    { email: 'admin@flowmanage.ci', nom: 'Admin FlowManage', role: 'ADMIN', commune: 'Plateau' },
    { email: 'autorite@flowmanage.ci', nom: 'Agent Mairie Cocody', role: 'AUTORITE', commune: 'Cocody' },
    { email: 'secours@flowmanage.ci', nom: 'Équipe GSPM', role: 'SECOURISTE', commune: 'Cocody' },
    { email: 'citoyen1@flowmanage.ci', nom: 'Awa Koné', role: 'CITOYEN', commune: 'Cocody' },
    { email: 'citoyen2@flowmanage.ci', nom: 'Yao Kouassi', role: 'CITOYEN', commune: 'Cocody' },
    { email: 'citoyen3@flowmanage.ci', nom: 'Fatou Traoré', role: 'CITOYEN', commune: 'Yopougon' },
  ];
  for (const c of comptes) {
    await prisma.user.upsert({ where: { email: c.email }, create: { ...c, motDePasse }, update: { role: c.role } });
  }

  for (const z of ZONES) {
    const data = {
      code: z.code,
      nom: z.nom,
      commune: z.commune,
      niveau: z.niveau,
      score: z.score,
      geometrie: carre(z.lat, z.lng, 450),
      source: 'démonstration',
      estDemo: true,
    };
    await prisma.zoneRisque.upsert({ where: { code: z.code }, create: data, update: data });
  }

  if ((await prisma.conseil.count()) === 0) {
    await prisma.conseil.createMany({ data: CONSEILS.map((c, i) => ({ ...c, ordre: i })) });
  }

  for (const b of BADGES) {
    await prisma.badge.upsert({ where: { code: b.code }, create: b, update: b });
  }

  console.log(`✔ ${comptes.length} comptes, ${ZONES.length} zones, ${CONSEILS.length} conseils, ${BADGES.length} badges`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
