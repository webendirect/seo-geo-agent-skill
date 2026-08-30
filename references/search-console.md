# Brancher Google Search Console

Search Console est la seule source qui dit ce que les gens **cherchent réellement** avant
d'arriver sur le site, et ce que Google a réellement indexé. Sans elle, l'agent déduit ;
avec elle, il mesure.

Le pont est `tools/gsc.mjs` : un script Node sans aucune dépendance npm. Il s'authentifie
avec un compte de service Google, en lecture seule.

## Pourquoi un compte de service

Un compte de service est un « robot » Google avec sa propre adresse e-mail. On lui donne
accès à la propriété Search Console comme à un collègue. Aucun mot de passe, aucune
connexion à renouveler, aucune fenêtre de navigateur : le script fonctionne seul,
indéfiniment.

## Installation, une seule fois

### 1. Créer le projet et la clé

1. Ouvrir [console.cloud.google.com](https://console.cloud.google.com) et se connecter.
2. Créer un projet (nom libre, par exemple `seo-agent`).
3. Menu **APIs & Services → Library**, chercher **Google Search Console API**, cliquer **Enable**.
4. Menu **APIs & Services → Credentials → Create credentials → Service account**.
   - Nom : `agent-seo`. Aucun rôle à attribuer, aucun accès utilisateur à ajouter.
5. Ouvrir le compte de service créé, onglet **Keys → Add key → Create new key → JSON**.
   Un fichier `.json` se télécharge.

### 2. Ranger la clé

Déplacer le fichier téléchargé ici, sous ce nom exact :

```
~/.claude/gsc-service-account.json
```

Sous Windows : `C:\Users\<vous>\.claude\gsc-service-account.json`

Ce fichier est une **clé privée**. Elle ne va jamais dans le dépôt : ni commitée, ni poussée
sur GitHub — même sur un dépôt privé — ni collée dans une conversation, un ticket ou un
message. Elle vit uniquement sur la machine qui fait tourner l'agent.

Le `.gitignore` de ce dépôt bloque tous les `.json`, `.pem`, `.key` et `.env` par précaution,
quel que soit leur nom.

Si une clé a été exposée : la révoquer dans Google Cloud (**IAM et administration → Comptes de
service → l'ouvrir → onglet Keys → supprimer**), puis en générer une nouvelle. Une clé révoquée
ne sert plus à rien, même si quelqu'un la détient.

Pour utiliser un autre emplacement, définir la variable `GSC_KEY_FILE`.

### 3. Donner accès à la propriété

Dans le fichier JSON, copier la valeur de `client_email` — elle ressemble à :

```
agent-seo@seo-agent-123456.iam.gserviceaccount.com
```

Puis, dans [Search Console](https://search.google.com/search-console) :

**Paramètres → Utilisateurs et autorisations → Ajouter un utilisateur**
→ coller cette adresse → autorisation **Complète** → Ajouter.

L'autorisation *Complète* est nécessaire pour l'inspection d'URL. *Restreinte* suffit si on
se limite aux performances et aux sitemaps.

### 4. Vérifier

```bash
node tools/gsc.mjs sites
```

La propriété doit apparaître dans la liste. Si c'est le cas, le branchement est terminé.

## Commandes

| Commande | Ce qu'elle donne |
| --- | --- |
| `sites` | Les propriétés accessibles et le niveau d'autorisation |
| `query <site>` | Clics, impressions, CTR, position — par requête, page, pays, appareil |
| `opportunities <site>` | Les deux analyses de la phase Search Console, prêtes à lire |
| `sitemaps <site>` | URLs soumises, indexées, erreurs, dernier téléchargement |
| `inspect <site> <url>` | Verdict d'indexation, couverture, robots, canonique retenue par Google |

L'identifiant `<site>` est celui affiché par `sites`, à la lettre près :

- `sc-domain:exemple.com` pour une propriété de domaine ;
- `https://exemple.com/` pour un préfixe d'URL, slash final compris.

### Exemples

```bash
node tools/gsc.mjs opportunities sc-domain:exemple.com
node tools/gsc.mjs query sc-domain:exemple.com --dim page,query --days 90 --limit 100
node tools/gsc.mjs inspect sc-domain:exemple.com https://exemple.com/services
node tools/gsc.mjs sitemaps sc-domain:exemple.com
```

## Ce que l'agent doit en faire

`opportunities` produit directement les deux analyses attendues :

**1. Opportunités CTR** — pages avec beaucoup d'impressions, une position correcte et un
CTR faible. Le contenu se classe mais le titre ne donne pas envie de cliquer. Action :
réécrire le title et la meta description, en visant l'intention réelle de la requête.

**2. Opportunités SEO** — requêtes en position 4 à 20 avec du volume. Le site est déjà
jugé pertinent mais n'est pas assez fort. Action : enrichir la page existante ou en créer
une qui traite précisément le sujet.

Croiser ensuite avec `inspect` sur les pages stratégiques : une page qui devrait ranker et
n'est pas indexée est un problème `CRITIQUE`, à traiter avant toute optimisation de contenu.

## Règles

Les données Search Console accusent environ **deux jours de latence** — le script en tient
compte et n'interroge jamais les deux derniers jours.

Le compte de service est en **lecture seule** (`webmasters.readonly`). Le script ne peut ni
soumettre un sitemap, ni demander une indexation, ni modifier quoi que ce soit.

Si la clé est absente, le script répond `OUTIL NON DISPONIBLE` et sort en erreur. C'est
voulu : l'agent doit signaler l'absence de l'outil, poursuivre l'audit avec ce dont il
dispose, et **ne jamais inventer un chiffre Search Console**.

Toujours distinguer, dans le rapport : `MESURÉ` / `DÉDUIT` / `NON DISPONIBLE` / `À VÉRIFIER`.

## Si ça ne marche pas

| Message | Cause | Correctif |
| --- | --- | --- |
| `cle de compte de service introuvable` | Fichier absent ou mal nommé | Vérifier le chemin exact `~/.claude/gsc-service-account.json` |
| `invalid_grant: account not found` | Clé d'un compte supprimé | Regénérer une clé JSON |
| `Search Console API has not been used` | API non activée | Étape 1.3, cliquer **Enable** |
| `Acces refuse (403)` | Compte de service pas ajouté à la propriété | Étape 3 |
| `Aucune propriete accessible` | Ajouté sur une autre propriété que celle voulue | Vérifier domaine vs préfixe d'URL |

## Bing Webmaster Tools

Search Console ne dit rien de ce que les IA citent. **Bing Webmaster Tools** le dit, via son
rapport **AI Performance** : pages citées, volume de citations, tendances, requêtes de
grounding. C'est la moitié GEO de la mesure, et elle alimente Copilot comme ChatGPT.

L'inscription est gratuite et permet d'**importer directement les propriétés vérifiées
depuis Search Console**, sans revérifier le domaine. À faire dans la foulée.
