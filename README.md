# Compétence SEO + GEO — Web En Direct

Une compétence Claude Code qui transforme Claude en agent SEO et GEO opérationnel : il
audite le projet, corrige ce qui est sûr, valide, puis produit un rapport chiffré.

GEO signifie *Generative Engine Optimization* : rendre le contenu compréhensible et
citable par les moteurs de recherche IA (ChatGPT Search, Copilot, aperçus génératifs),
sans jamais chercher à les manipuler.

## Ce qu'elle fait

- Inspecte le projet réel (framework, routes, metadata, sitemap, robots, JSON-LD) avant
  toute modification.
- Audite le SEO technique, le contenu, le GEO, la performance, l'accessibilité et le SEO local.
- Applique directement les corrections sûres et réversibles ; demande confirmation pour le reste.
- Vérifie que rien n'a cassé : build, lint, typecheck, tests, sitemap, JSON-LD, robots.
- Rend un rapport avec six scores sur 100, la liste des fichiers modifiés, les problèmes
  restants et les actions à faire à la main.

## Installation

Copier le dossier dans les compétences de Claude Code :

```bash
git clone https://github.com/webendirect/seo-geo-skill.git ~/.claude/skills/seo-geo
```

Sur Windows, la destination est `C:\Users\<vous>\.claude\skills\seo-geo`.

Pour ne l'activer que sur un projet précis, copier le dossier dans `.claude/skills/seo-geo`
à la racine de ce projet.

## Utilisation

Une fois installée, elle se déclenche d'elle-même sur une demande du type :

- « fais l'audit SEO du site »
- « optimise le SEO et le GEO »
- « vérifie le robots.txt et le sitemap »
- « pourquoi cette page n'est pas indexée ? »

Ou explicitement :

```
/seo-geo
```

## Structure

| Fichier | Contenu |
| --- | --- |
| `SKILL.md` | Identité, philosophie, workflow, crawlers IA, anti-spam, rapport final |
| `references/audit-technique.md` | SEO technique, robots.txt, sitemap, architecture, images, performance, accessibilité |
| `references/contenu-et-geo.md` | Intention, keywords, title, meta, headings, GEO, entités, Schema.org, local, E-E-A-T |
| `references/mesure-et-outils.md` | Bing AI Performance, IndexNow, Search Console, Analytics |
| `references/search-console.md` | Procedure de branchement de Google Search Console, commandes, depannage |
| `tools/gsc.mjs` | Pont Search Console en Node, sans dependance npm |

## Mesurer avec Search Console

Sans donnees reelles, l'agent ne fait que deduire. Le pont `tools/gsc.mjs` lui donne acces
aux requetes, aux pages, au CTR, aux positions et a l'etat d'indexation reels.

Branchement en une fois, environ dix minutes : voir
[references/search-console.md](references/search-console.md).

Verification :

```bash
node tools/gsc.mjs sites
```

Tant que la cle n'est pas en place, le script repond `OUTIL NON DISPONIBLE` et l'agent
poursuit l'audit sans inventer de chiffres.

## Principes non négociables

La compétence refuse par construction : le bourrage de mots-clés, le contenu de masse, les
pages locales clonées, les faux avis, les faux backlinks, les fausses certifications, le
texte caché et la manipulation des données structurées.

Elle ne promet jamais « première position Google » ni « citation garantie dans ChatGPT ».
L'objectif est une augmentation durable de l'éligibilité, de la compréhension et de la
capacité du contenu à être sélectionné comme source.
