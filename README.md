# Agent SEO + GEO — Web En Direct

Une compétence Claude Code qui transforme Claude en agent SEO et GEO opérationnel : il
détecte les outils dont il dispose, audite le projet, corrige ce qui est sûr, teste, refait
les vérifications critiques, puis produit un rapport chiffré et justifié.

GEO signifie *Generative Engine Optimization* : rendre le contenu compréhensible et
citable par les moteurs de recherche IA (ChatGPT Search, Copilot, aperçus génératifs),
sans jamais chercher à les manipuler.

## Ce qu'elle fait

- **Détecte les outils réellement disponibles** avant de commencer, et ne prétend jamais
  avoir utilisé un outil auquel elle n'a pas accès.
- Inspecte le projet réel (framework, routes, metadata, sitemap, robots, JSON-LD) et le site
  en ligne, sans supposer que les deux correspondent.
- Audite le SEO technique, le contenu, le GEO, la performance, l'accessibilité, le SEO local
  et l'indexation.
- Mesure avec Google Search Console quand la clé est en place, sinon le signale.
- Applique directement les corrections sûres et réversibles ; demande confirmation pour tout
  ce qui peut casser le site, toucher une donnée métier ou partir en production.
- Vérifie que rien n'a cassé : `git diff`, build, lint, typecheck, tests, sitemap, JSON-LD,
  robots — puis refait les audits critiques et compare avant/après.
- Rend un rapport en dix parties : résumé, sept scores sur 100, corrections, fichiers
  modifiés, résultats outil par outil, problèmes restants classés par gravité, actions
  humaines, opportunités SEO, opportunités GEO, et les dix actions au meilleur ratio
  impact/effort.

## Installation

```bash
git clone https://github.com/webendirect/seo-geo-agent-skill.git ~/.claude/skills/seo-geo-agent
```

Sur Windows, la destination est `C:\Users\<vous>\.claude\skills\seo-geo-agent`.

Pour ne l'activer que sur un projet précis, cloner dans `.claude/skills/seo-geo-agent` à la
racine de ce projet.

## Utilisation

Une fois installée, elle se déclenche d'elle-même sur une demande du type :

- « fais l'audit SEO du site »
- « optimise le SEO et le GEO »
- « vérifie le robots.txt et le sitemap »
- « pourquoi cette page n'est pas indexée ? »

Ou explicitement :

```
/seo-geo-agent
```

Elle ne demande pas quoi vérifier : elle audite, analyse, corrige, teste, puis rapporte.

## Structure

| Fichier | Contenu |
| --- | --- |
| `SKILL.md` | Identité, philosophie, mode automatique, priorisation, crawlers IA, anti-spam, rapport final, commande de lancement |
| `references/procedure-audit.md` | Comment procéder : détection des outils, terminal, Git, audit du code, site en live, Lighthouse, PageSpeed, Schema, content gap, maillage, validation, second audit |
| `references/audit-technique.md` | SEO technique, robots.txt, sitemap, architecture, images, performance, accessibilité |
| `references/contenu-et-geo.md` | Intention, keywords, title, meta, headings, GEO, entités, Schema.org, local, E-E-A-T |
| `references/mesure-et-outils.md` | Bing AI Performance, IndexNow, Search Console, Analytics |
| `references/search-console.md` | Procédure de branchement de Search Console, commandes, dépannage |
| `references/bing-webmaster.md` | Procédure de branchement de Bing Webmaster, citations IA, IndexNow |
| `references/deploiement.md` | Mettre les correctifs en ligne : patch sans build, dépôt, vérification, déclaration du sitemap |
| `tools/gsc.mjs` | Pont Search Console en Node, sans dépendance npm |
| `tools/bing.mjs` | Pont Bing Webmaster en Node, sans dépendance npm |

`SKILL.md` porte la doctrine et le workflow ; `procedure-audit.md` porte l'exécution. Les
deux se lisent ensemble.

## Mesurer avec Search Console

Sans données réelles, l'agent ne fait que déduire. Le pont `tools/gsc.mjs` lui donne accès
aux requêtes, aux pages, au CTR, aux positions et à l'état d'indexation réels.

Branchement en une fois, environ dix minutes : voir
[references/search-console.md](references/search-console.md).

Vérification :

```bash
node tools/gsc.mjs sites
```

Tant que la clé n'est pas en place, le script répond `OUTIL NON DISPONIBLE` et l'agent
poursuit l'audit sans inventer de chiffres.

## Mesurer les citations IA avec Bing

Search Console ne mesure que Google. Le rapport **AI Performance** de Bing Webmaster est la
seule source accessible sur ce que les moteurs génératifs citent réellement — et Bing importe
les propriétés déjà vérifiées dans Search Console, sans revérification.

```bash
node tools/bing.mjs ai <site>
```

Branchement : [references/bing-webmaster.md](references/bing-webmaster.md). Plus simple que
celui de Google — une clé d'API, pas de compte de service ni de projet cloud.

## Mettre les correctifs en ligne

Un correctif écrit mais non déployé ne vaut rien. Sur une application monopage, le HTML servi
est un fichier construit : le fichier source n'est pas celui qui est en ligne, et reconstruire
tout le projet pour trois balises `<meta>` est rarement possible.

[references/deploiement.md](references/deploiement.md) décrit la méthode retenue : détecter
comment le serveur traite les fichiers absents, patcher chirurgicalement le HTML réellement en
ligne, vérifier que le corps et les scripts n'ont pas bougé, déposer, contrôler, puis déclarer
le sitemap aux deux moteurs.

La mise en production reste une action que l'agent **fait confirmer**, jamais une initiative.

## Règle anti-hallucination

Chaque constat du rapport est étiqueté `MESURÉ` / `DÉDUIT` / `NON DISPONIBLE` / `À VÉRIFIER`.

Une déduction n'est jamais présentée comme une mesure, un outil non exécuté n'est jamais
présenté comme exécuté, et un résultat Search Console, Bing, Lighthouse ou PageSpeed n'est
jamais inventé.

## Principes non négociables

La compétence refuse par construction : le bourrage de mots-clés, le contenu de masse, les
pages locales clonées, les faux avis, les faux backlinks, les fausses certifications, le
texte caché et la manipulation des données structurées.

Côté Git, elle n'exécute jamais `git reset --hard`, ne supprime ni branche ni fichier
important, et ne pousse jamais en production sans autorisation explicite.

Elle ne promet jamais « première position Google » ni « citation garantie dans ChatGPT ».
L'objectif est une augmentation durable de l'éligibilité, de la compréhension et de la
capacité du contenu à être sélectionné comme source.
