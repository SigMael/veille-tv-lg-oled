# Veille TV LG OLED

Vérifie toutes les 20 minutes (GitHub Actions) les prix des TV LG OLED evo **G5 65"** et **G6 65"**, et envoie une notification sur le téléphone via [ntfy](https://ntfy.sh) quand une offre passe sous le seuil.

## Seuils

| Modèle | Alerte si prix ≤ |
|---|---|
| G5 65" | 1 500 € |
| G6 65" | 2 000 € |

Modifiables dans `src/config.ts`.

## Sources

| Source | Comment | Alerte quand |
|---|---|---|
| Dealabs | nouvelles offres des recherches « OLED65G5 », « lg g5 65 », « OLED65G6 », « lg g6 65 », tous marchands | offre active ≤ seuil |
| LG.fr | pages produit (prix et stock lus dans les données de la page) | en stock et prix ≤ seuil |

**Remises cumulées (Dealabs)** : le prix d'une offre Dealabs inclut déjà les remises immédiates et les ODR. Le script retient en plus le prix le plus bas annoncé dans le titre :
un prix sous condition (« 2022.41€ nouveau client ») ou un avantage à déduire (« +165€ en carte cadeau », « +65,96€ cagnotté », « +12,90€ offert »).

La Fnac n'est pas lue directement : sa protection anti-robots bloque tout navigateur automatisé. Ses promos remontent via Dealabs.

## Notifications

- Une offre n'est signalée qu'une fois. Elle l'est de nouveau si son prix baisse, ou si elle expire puis revient.
- Si une source échoue 3 fois d'affilée (environ 1 h), une notification « Veille … en panne » est envoyée, puis « rétablie » quand elle refonctionne.
- Canal ntfy : secret de dépôt `NTFY_TOPIC`. S'abonner au même nom dans l'appli ntfy.

## Lancer à la main

- Sur GitHub : onglet Actions → « Veille TV LG OLED » → Run workflow. Cocher « Envoyer une notification de test » pour vérifier que le téléphone reçoit bien.
- En local (Node 26) : `npm run veille`. Sans `NTFY_TOPIC`, rien n'est envoyé, les alertes s'affichent seulement.

`etat.json` garde la liste des offres déjà signalées ; le workflow le met à jour tout seul.
