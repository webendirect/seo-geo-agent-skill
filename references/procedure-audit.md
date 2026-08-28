# Procédure d'audit

Comment mener l'audit concrètement, phase par phase. La doctrine (quoi optimiser) est dans
`audit-technique.md` et `contenu-et-geo.md` ; ce fichier dit **comment procéder**.

## Règle principale

**NE JAMAIS faire un audit uniquement théorique.**

Combiner : analyse du code ; commandes terminal ; inspection du site réel ; données de
performance ; données Search Console si disponibles ; données Bing Webmaster si disponibles ;
validation Schema ; analyse SEO/GEO ; tests après modification.

Si un outil n'est pas connecté → signaler clairement `OUTIL NON DISPONIBLE`.
**NE JAMAIS inventer son résultat.**

## Phase 0 — Détection des outils

Au début de chaque mission, déterminer quels outils sont **réellement** disponibles.
Chercher notamment :

- terminal ;
- Git ;
- GitHub ;
- navigateur / web ;
- Lighthouse ;
- PageSpeed Insights ;
- Google Search Console (`node tools/gsc.mjs sites`) ;
- Bing Webmaster Tools ;
- Schema.org / validator ;
- accès au domaine ;
- accès au serveur ;
- accès au CMS ;
- analytics.

**NE JAMAIS prétendre avoir utilisé un outil auquel tu n'as pas accès.**

Établir la liste avant de commencer, et la reporter telle quelle dans le rapport final.

## Phase 1 — Inspection du projet avec le terminal

Commencer par inspecter le dépôt. Utiliser les commandes adaptées au système.

```bash
pwd
ls -la
find . -maxdepth 2 -type f
git status
git branch --show-current
git remote -v
```

Puis identifier le projet :

```bash
cat package.json
```

Et selon le gestionnaire : `npm run`, `pnpm run`, `yarn`, ou `bun run`.

Identifier : framework ; version ; scripts ; dépendances ; build ; lint ; tests ;
génération statique ; SSR ; CMS ; système de routes.

## Phase 2 — Git et GitHub

Si le projet utilise GitHub, inspecter : repository ; branche actuelle ; remote ;
historique récent ; commits ; fichiers de configuration ; workflow CI/CD ; déploiement.

```bash
git status
git remote -v
git log --oneline -10
git branch -a
```

Si GitHub CLI est disponible :

```bash
gh auth status
gh repo view
```

### Règles de sécurité Git

- Avant une modification importante : `git status`.
- Après modification : `git diff`.
- Avant commit : `git status`.
- Créer si nécessaire un commit de sécurité ou une branche dédiée.

**Ne jamais** exécuter `git reset --hard`, ni supprimer une branche ou un fichier important
sans autorisation explicite. **Ne jamais** modifier ou supprimer une branche distante sans
autorisation. **Ne jamais** pousser automatiquement vers la production sans avoir vérifié le
workflow de déploiement.

## Phase 3 — Audit du code SEO

Chercher automatiquement dans le projet :

```
robots.txt          sitemap.xml         sitemap.ts / sitemap.js
metadata            generateMetadata    canonical
alternate           hreflang            application/ld+json
schema.org          noindex             nofollow
og:title            og:description      twitter:
```

Examiner : layout ; pages ; routes ; composants ; metadata ; fichiers publics ; images ;
liens ; navigation.

Identifier les pages importantes, puis construire une carte avec, pour chacune :

```
URL | Intent | Title | Meta | H1 | Canonical | Indexable | Schema
    | Internal links | Images | CTA | Local relevance | GEO potential
```

## Phase 4 — Audit du site en live

Si le domaine est connu, inspecter le site réel avec les outils web disponibles.

Vérifier : HTTP/HTTPS ; redirects ; www / non-www ; status codes ; canonical ; robots ;
sitemap ; pages indexables ; contenu ; liens ; titres ; headings ; JSON-LD ; Open Graph ;
images ; données locales.

Tester notamment :

```
https://DOMAIN.TLD/
https://DOMAIN.TLD/robots.txt
https://DOMAIN.TLD/sitemap.xml
```

**Ne pas supposer que les fichiers locaux correspondent à la version réellement déployée.**

## Phase 5 — Lighthouse

Lorsque Lighthouse est disponible, lancer un audit sur mobile, et sur desktop lorsque
pertinent.

Mesurer : Performance ; Accessibility ; Best Practices ; SEO.

Analyser particulièrement : LCP ; CLS ; INP ; ressources bloquant le rendu ; JavaScript ;
images ; fonts ; scripts tiers ; réponse du document ; liens crawlables ; metadata.

**Ne pas chercher uniquement un score de 100.** Prioriser les problèmes ayant un impact réel.

## Phase 6 — PageSpeed Insights

Lorsque PageSpeed Insights est disponible, analyser l'URL réelle.

Séparer **LAB DATA** et **FIELD DATA**. Lorsque les données terrain existent, leur donner une
importance particulière.

Comparer mobile, desktop et pages stratégiques. Identifier les causes principales.

Ne pas modifier inutilement le code pour gagner quelques points sans bénéfice utilisateur réel.

## Phase 7 — Google Search Console

Voir `search-console.md` pour le branchement et les commandes.

Si connecté, l'utiliser systématiquement pour le diagnostic :

- **Performance** : clics ; impressions ; CTR ; position ; requêtes ; pages ; pays ; appareils.
- **Opportunités CTR** : pages avec beaucoup d'impressions, position correcte, CTR faible
  → proposer un nouveau title, une nouvelle meta description, une meilleure adéquation à
  l'intention, un enrichissement du contenu.
- **Opportunités SEO** : requêtes en positions 4–20 avec des impressions importantes et une
  intention pertinente → créer ou améliorer les contenus correspondants.
- **Indexation** : pages indexées ; pages exclues ; erreurs ; canonique choisie ; duplicate ;
  *crawled but not indexed* ; *discovered but not indexed*.
- **Sitemap** : URLs envoyées ; URLs indexées ; erreurs.

**NE JAMAIS prétendre avoir accès à Search Console si l'intégration n'est pas disponible.**

## Phase 8 — Bing Webmaster Tools

Si connecté, analyser : indexation ; crawl ; erreurs ; sitemap ; SEO reports ; backlinks ;
mots-clés lorsque disponibles ; recommandations.

Utiliser également **AI Performance** lorsque disponible : citations ; URLs citées ; requêtes
de grounding ; évolution des citations ; pages sélectionnées.

Ces données identifient ce que les systèmes IA comprennent déjà, ce qui est cité, les sujets
à approfondir et les pages à améliorer.

**NE PAS confondre citation IA et position Google.**

## Phase 9 — Validation Schema

Rechercher tous les JSON-LD. Identifier les types présents : Organization ; LocalBusiness ;
WebSite ; BreadcrumbList ; Service ; Product ; Article ; Person ; FAQPage ; autres types
pertinents.

Vérifier : syntaxe JSON ; `@context` ; `@type` ; propriétés ; cohérence ; correspondance avec
les données visibles ; correspondance avec les données réelles.

Utiliser un validateur Schema.org lorsque disponible. Sinon → analyser localement le JSON-LD
et le signaler comme tel.

**NE JAMAIS créer :** faux avis ; fausse note ; faux prix ; fausse disponibilité ; fausse
certification ; fausse adresse.

## Phase 10 — Content gap

Comparer le site avec les concurrents lorsque la recherche web est disponible.

Identifier : sujets manquants ; questions non couvertes ; services non détaillés ; intentions
commerciales absentes ; recherches locales ; comparaisons ; guides ; FAQ ; longue traîne.

Créer un plan classé :

```
PAGE EXISTANTE À OPTIMISER
PAGE À CRÉER
CONTENU À ENRICHIR
QUESTION À TRAITER
ENTITÉ À RENFORCER
```

**NE PAS copier les concurrents.**

## Phase 11 — Maillage interne

Analyser le graphe de liens. Identifier : pages orphelines ; pages importantes mal liées ;
pages trop profondes ; ancres faibles ; opportunités de liens contextuels.

Créer des liens logiques :

```
Service → Guide → FAQ → Service associé → Contact
```

## Phase 12 — Modifications automatiques

Après audit, corriger automatiquement les problèmes **sûrs** :

- metadata manquante ;
- title manquant ;
- canonical manquante ;
- sitemap mal configuré ;
- robots incorrect ;
- JSON-LD valide manquant ;
- ALT manquants ;
- liens internes évidents ;
- erreurs de structure ;
- optimisation d'images ;
- éléments HTML inutiles.

Pour les modifications à risque → **demander confirmation**.

## Phase 13 — Validation après modification

Après chaque série de modifications :

```bash
git diff
git status
```

Puis les outils du projet :

```bash
npm run lint
npm run build
npm run test
```

Ou leurs équivalents. Si le projet est en TypeScript et que c'est compatible :

```bash
npx tsc --noEmit
```

Vérifier toutes les routes importantes.

## Phase 14 — Second audit

Après les modifications, recommencer : robots ; sitemap ; metadata ; canonical ; JSON-LD ;
headings ; liens ; Lighthouse ; PageSpeed ; routes ; status HTTP.

Comparer **AVANT** et **APRÈS**, chiffres à l'appui.

## Gestion des outils manquants

Si un outil n'est pas disponible, **ne pas arrêter la mission**. Continuer avec ce qui est
disponible et documenter précisément le manque.

```
Search Console : NON CONNECTÉ
→ analyse impossible des requêtes et des données d'indexation
→ fournir les actions manuelles nécessaires

Bing Webmaster : NON CONNECTÉ
→ analyse AI Performance impossible

PageSpeed : NON DISPONIBLE
→ Lighthouse local utilisé

Schema Validator : NON DISPONIBLE
→ validation JSON-LD locale utilisée
```

Toujours distinguer : `MESURÉ` / `DÉDUIT` / `NON DISPONIBLE` / `À VÉRIFIER`.

## Priorisation

Toujours utiliser :

```
IMPACT × CONFIANCE ÷ EFFORT
```

Priorité maximale aux corrections critiques, simples, sûres et mesurables.

Ne pas passer deux heures sur une optimisation mineure avant d'avoir corrigé : un `noindex`
accidentel ; un sitemap cassé ; un robots bloquant ; une canonical erronée ; des pages 404 ;
du contenu inaccessible ; un problème majeur de performance.
