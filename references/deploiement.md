# Déployer les correctifs

Un correctif SEO écrit mais non déployé ne vaut rien. Cette page décrit comment mettre les
corrections en ligne sans reconstruire le projet et sans rien casser.

Le déploiement en production reste une **action à confirmer** : l'appliquer seulement quand
le propriétaire l'a demandé explicitement.

## Étape 1 — Comment le serveur traite-t-il les fichiers absents ?

Cette question détermine toute la suite. Un seul test :

```bash
curl -sS -o /dev/null -w "%{http_code} %{content_type}\n" https://DOMAIN.TLD/fichier-qui-nexiste-pas
curl -sS -o /dev/null -w "%{http_code} %{content_type}\n" https://DOMAIN.TLD/robots.txt
curl -sS -o /dev/null -w "%{http_code} %{content_type}\n" https://DOMAIN.TLD/un-fichier-reel.png
```

Deux cas :

**404 sur les absents, 200 sur les réels** — il n'y a pas de réécriture attrape-tout. Déposer
`robots.txt` et `sitemap.xml` dans la racine web suffit, sans build ni configuration. C'est
le cas le plus simple et le plus fréquent.

**200 avec du HTML sur les absents** — l'application intercepte toutes les URL. Les fichiers
statiques seront masqués par la réécriture. Il faut alors exclure explicitement `robots.txt`
et `sitemap.xml` dans la configuration du serveur avant de les déposer.

Ne jamais supposer : le même framework se comporte différemment selon l'hébergeur.

## Étape 2 — Corriger le HTML d'une application monopage sans build

Sur un site React, Vue ou Svelte, la page servie est un fichier **construit**. Le fichier
source dans `public/` n'est pas celui qui est en ligne : le build y injecte les balises
d'assets et minifie les scripts en ligne.

Reconstruire le projet demande d'installer toutes les dépendances, ce qui est souvent
impossible ou disproportionné pour trois balises `<meta>`.

**La méthode sûre : patcher chirurgicalement le fichier réellement en ligne.**

1. Télécharger le fichier servi :

   ```bash
   curl -sS https://DOMAIN.TLD/ -o live-index.html
   ```

2. N'y remplacer que les balises du `<head>` : `lang`, `<title>`, `description`, `canonical`,
   Open Graph, JSON-LD. Ne jamais toucher au `<body>`, ni aux balises `<script>` et `<link>`
   pointant vers `/static/`.

3. **Vérifier avant de livrer** que le corps et les scripts sont restés identiques :

   ```js
   const norm = s => s.replace(/\s+/g, ' ').trim();
   const corps = s => norm((s.match(/<body[\s\S]*<\/body>/) || [''])[0]);
   const scripts = s => (s.match(/src="[^"]+"/g) || []).sort().join(' ');
   console.log(corps(live) === corps(neuf), scripts(live) === scripts(neuf));
   ```

   Les deux doivent afficher `true`. Sinon, le fichier est à jeter.

4. Vérifier aussi que les scripts d'analytics et de suivi sont intacts, et que le JSON-LD se
   parse. Ouvrir le fichier dans un vrai navigateur : un parseur réel attrape ce qu'une
   expression régulière laisse passer.

**Ne pas régénérer le fichier depuis les sources** pour le déposer tel quel : le corps
différera de la version minifiée en ligne, et la différence sera invisible à l'œil.

## Étape 3 — Déposer les fichiers

### Avec le connecteur Hostinger

Les outils utiles, dans l'ordre :

| Outil | Usage |
| --- | --- |
| `hosting_listWebsitesV1` | Trouver le `username` et la racine du site |
| `hosting_listWebsiteFilesAndDirectoriesV1` | Voir ce qui est en place avant de toucher |
| `hosting_getWebsiteFileContentV1` | Lire un fichier existant avant de l'écraser |
| `hosting_generateUploadURLV1` | Obtenir une URL TUS pour l'envoi |
| `hosting_clearWebsiteCacheV1` | Purger le cache après le dépôt |

`hosting_listWebsitesV1` rend aussi `website_type` — `nodejs`, `wordpress`, `builder` ou
`other`. Un type `nodejs` n'implique pas que les fichiers statiques ne sont pas servis
directement : le test de l'étape 1 fait foi, pas le type déclaré.

L'envoi par URL TUS se fait en deux appels par fichier. Séquence vérifiée :

```bash
U="<url rendue par generateUploadURL>"      # .../api/tus/public_html
A="<auth_key>"; R="<rest_auth_key>"

for F in robots.txt sitemap.xml index.html; do
  SZ=$(stat -c%s "$F")
  curl -sS -o /dev/null -w "%{http_code} " -X POST "$U/$F?override=true" \
    -H "X-Auth: $A" -H "X-Auth-Rest: $R" -H "Tus-Resumable: 1.0.0" \
    -H "Upload-Length: $SZ" -H "Upload-Offset: 0"          # attendu 201
  curl -sS -o /dev/null -w "%{http_code}\n" -X PATCH "$U/$F?override=true" \
    -H "X-Auth: $A" -H "X-Auth-Rest: $R" -H "Tus-Resumable: 1.0.0" \
    -H "Content-Type: application/offset+octet-stream" \
    -H "Upload-Offset: 0" --data-binary "@$F"              # attendu 204
done
```

`201` puis `204` pour chaque fichier : tout autre code signale un échec, même silencieux. Les
dossiers se créent automatiquement à partir du chemin. Cette voie est préférable à l'envoi
d'une archive — voir les pièges de compression sous Windows.

Purger le cache ensuite avec `hosting_clearWebsiteCacheV1`, sans quoi l'ancienne version peut
continuer à être servie quelques minutes.

### Sans connecteur

Fournir les fichiers au propriétaire avec le chemin de destination exact, et lui demander de
**renommer l'ancien fichier plutôt que de l'écraser** (`index.html.bak`). Le retour arrière
prend alors trente secondes.

## Étape 4 — Vérifier après le dépôt

```bash
curl -sS -o /dev/null -w "%{http_code} %{content_type}\n" https://DOMAIN.TLD/robots.txt
curl -sS -o /dev/null -w "%{http_code} %{content_type}\n" https://DOMAIN.TLD/sitemap.xml
curl -sS https://DOMAIN.TLD/ | grep -oE "<title>[^<]*</title>"
```

Puis charger la page dans un navigateur et vérifier que l'application se monte toujours —
un `<div id="root">` vide et une console en erreur signent un déploiement raté.

## Étape 5 — Reporter le correctif dans les sources

**C'est l'étape qu'on oublie, et elle annule tout le reste.**

Patcher le fichier en ligne corrige le site *maintenant*. Mais ce fichier est un artefact de
build : au prochain `npm run build` suivi d'un déploiement, il sera régénéré depuis les
sources — et le gabarit reviendra, effaçant silencieusement le correctif.

Le patch en ligne est donc un **dépannage**, jamais la correction. Toujours enchaîner :

1. porter les mêmes changements dans les fichiers sources (`public/index.html`,
   `public/robots.txt`, `public/sitemap.xml` ou l'équivalent du framework) ;
2. commiter sur une branche dédiée ;
3. fusionner dans la branche principale.

Vérifier ensuite que la branche principale contient bien la correction, plutôt que de le
supposer :

```bash
gh api "repos/OWNER/REPO/contents/frontend/public/index.html?ref=main" --jq '.content' \
  | tr -d '\n' | base64 -d | grep -oiE "<html lang=\"[^\"]*\"|<title>[^<]*</title>"
```

Tant que cette vérification n'est pas passée, considérer le correctif comme **temporaire** et
le signaler comme tel dans le rapport.

## Étape 6 — Déclarer le sitemap

Un sitemap déposé n'est pas un sitemap déclaré — mais la nuance mérite d'être comprise.

**Il est déjà découvrable** si le `robots.txt` porte la ligne :

```
Sitemap: https://DOMAIN.TLD/sitemap.xml
```

Les deux moteurs le trouveront seuls à leur prochain passage. La soumission manuelle n'est
donc pas obligatoire ; elle apporte deux choses :

- une prise en compte immédiate, au lieu d'attendre le crawl naturel ;
- le rapport « URLs envoyées / URLs indexées », qui reste vide sans elle — c'est précisément
  ce que lit la commande `sitemaps` des deux ponts.

**L'agent ne peut pas soumettre lui-même.** Les deux clés sont volontairement en lecture
seule (`webmasters.readonly` côté Google) : un agent qui audite n'a pas à écrire chez les
moteurs. La soumission est donc une **action humaine**, à inscrire comme telle dans le
rapport :

- **Search Console** → Sitemaps → `sitemap.xml`
- **Bing Webmaster** → Sitemaps → l'URL complète

Ne jamais soumettre un sitemap avant de l'avoir vu répondre `200` : déclarer une URL en 404
fait perdre du temps aux deux moteurs et à soi-même.

Une fois soumis, vérifier que les moteurs l'ont réellement **téléchargé** — c'est plus
probant qu'un simple accusé de soumission :

```bash
node "$PONTS/gsc.mjs" sitemaps <site>
node "$PONTS/bing.mjs" sitemaps <site>
```

Un `indexees 0` juste après la soumission est normal : le re-crawl prend quelques jours.

## Étape 7 — Second audit

Relancer les vérifications critiques et comparer **AVANT** / **APRÈS**, chiffres à l'appui.
Sans ce passage, on ne sait pas si le déploiement a fonctionné — on l'espère seulement.
