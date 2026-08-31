# Brancher Bing Webmaster Tools

Search Console mesure Google. Elle ne dit **rien** de ce que les moteurs IA citent.

Bing Webmaster Tools le dit, via son rapport **AI Performance** : pages citées, volume de
citations, tendances, requêtes de grounding. Comme Bing alimente Copilot et sert d'index à
plusieurs assistants, c'est aujourd'hui la seule mesure accessible de la moitié GEO du travail.

Le pont est `tools/bing.mjs`, même forme que `gsc.mjs` : Node, aucune dépendance npm.

## Installation, une seule fois

Le branchement est nettement plus simple que celui de Google : une clé d'API, pas de compte
de service ni de projet cloud.

### 1. Créer le compte et importer la propriété

1. Ouvrir [bing.com/webmasters](https://www.bing.com/webmasters) et se connecter.
2. Choisir **Importer depuis Google Search Console**, autoriser, sélectionner la propriété.

L'import reprend la vérification déjà faite côté Google : pas de fichier à déposer ni
d'enregistrement DNS à créer. C'est la raison pour laquelle il faut brancher Search Console
en premier — voir `search-console.md`.

À défaut, la vérification manuelle classique (balise meta, fichier XML ou enregistrement DNS)
reste disponible.

### 2. Générer la clé d'API

Dans Bing Webmaster Tools : **Paramètres → Accès à l'API → Clé d'API → Générer**.

Copier la clé.

### 3. Ranger la clé

Coller la clé, seule, dans un fichier texte :

```
~/.claude/bing-api-key.txt
```

Sous Windows : `C:\Users\<vous>\.claude\bing-api-key.txt`

Comme la clé Google, elle ne va **jamais** dans le dépôt. Le `.gitignore` bloque déjà les
`.json`, `.pem`, `.key` et `.env` ; ce fichier vit hors du dépôt, dans `~/.claude/`.

La variable d'environnement `BING_API_KEY` est prioritaire si elle est définie.

### 4. Vérifier

```bash
node tools/bing.mjs sites
```

La propriété doit apparaître. Si c'est le cas, le branchement est terminé.

## Commandes

| Commande | Ce qu'elle donne |
| --- | --- |
| `sites` | Les propriétés accessibles avec cette clé |
| `ai <site>` | **Citations IA** : ce que les moteurs génératifs reprennent du site |
| `traffic <site>` | Impressions et clics jour par jour |
| `index <site>` | URLs connues, dernier crawl, erreurs, 404, blocages robots.txt |
| `sitemaps <site>` | Sitemaps déclarés, nombre d'URLs, dernier téléchargement |
| `keywords <site>` | Requêtes, impressions, clics, position moyenne |

L'identifiant `<site>` est l'URL exacte affichée par `sites`, slash final compris.

### Exemples

```bash
node tools/bing.mjs ai https://exemple.com/
node tools/bing.mjs keywords https://exemple.com/ --limit 50
node tools/bing.mjs index https://exemple.com/
```

## Ce que l'agent doit en faire

`ai` est la commande qui compte pour le GEO. Elle répond à une question qu'aucun autre outil
ne traite : **de quoi le site est-il déjà considéré comme une source crédible ?**

Croiser avec Search Console :

- **Cité par les IA mais mal classé sur Google** → le contenu est clair et extractible, mais
  le socle SEO est faible. Travailler le technique et le maillage.
- **Bien classé sur Google mais jamais cité** → le contenu est trouvable mais pas extractible.
  Travailler les passages autonomes, les définitions, les tableaux, les FAQ.
- **Ni l'un ni l'autre sur un sujet stratégique** → sujet à créer, pas à optimiser.

Les sujets déjà cités indiquent où le site fait autorité : c'est là qu'approfondir rapporte
le plus.

## Règles

**Ne jamais confondre une citation IA et une position Google.** Ce sont deux mesures
différentes, avec des mécaniques différentes.

Si la clé est absente, le script répond `OUTIL NON DISPONIBLE` et sort en erreur. L'agent
signale le manque, poursuit l'audit avec le reste, et **n'invente aucun chiffre**.

Sur une propriété récente, Bing met plusieurs jours à produire ses premiers rapports. Une
réponse vide n'est pas une erreur : c'est `NON DISPONIBLE`, pas `zéro`.

## IndexNow

Bing propose aussi **IndexNow**, qui prévient les moteurs dès qu'une URL change au lieu
d'attendre le crawl. À mettre en place après une création de page, une modification
importante, une suppression ou un changement d'URL — jamais en masse sur des milliers d'URLs
inutiles.

## Si ça ne marche pas

| Message | Cause | Correctif |
| --- | --- | --- |
| `cle API Bing introuvable` | Fichier absent | Vérifier `~/.claude/bing-api-key.txt` |
| `ERROR!!! InvalidApiKey` | Clé erronée ou révoquée | Regénérer dans Paramètres → Accès à l'API |
| `Acces refuse` | Le compte n'a pas accès à la propriété | Vérifier la propriété dans l'interface |
| `(aucune donnee)` | Propriété récente | Attendre quelques jours, ce n'est pas une erreur |
