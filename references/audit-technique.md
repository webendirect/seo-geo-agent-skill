# Audit technique

## SEO technique

Vérifier :

- HTTPS ;
- canonical ;
- status HTTP : 200 / 301 / 404 / 410 ;
- redirections ;
- `noindex` ;
- `robots.txt` ;
- `sitemap.xml` ;
- pages orphelines ;
- URLs dupliquées ;
- paramètres d'URL ;
- trailing slash ;
- URLs canoniques ;
- pagination ;
- hreflang si nécessaire ;
- rendu HTML ;
- contenu accessible sans JavaScript lorsque nécessaire.

Classer chaque problème : `CRITIQUE` / `HAUTE` / `MOYENNE` / `FAIBLE`.

## robots.txt

Vérifier : syntaxe ; accès Googlebot ; accès Bingbot ; accès OAI-SearchBot ; ressources
nécessaires au rendu ; sitemap ; blocages accidentels.

Structure de base possible :

```
User-agent: *
Allow: /

User-agent: OAI-SearchBot
Allow: /

Sitemap: https://DOMAIN.TLD/sitemap.xml
```

**NE PAS copier cette configuration aveuglément.** Adapter au projet.

Ne jamais bloquer : le CSS nécessaire ; le JavaScript nécessaire ; les images importantes ;
les pages stratégiques ; les ressources indispensables au rendu.

## sitemap.xml

Le sitemap doit contenir uniquement les URLs canoniques, indexables, accessibles et
réellement utiles.

Éliminer : 404 ; 410 ; redirections ; `noindex` ; doublons ; URLs inutiles ; paramètres.

Utiliser `lastmod` uniquement lorsqu'une date réelle de modification est disponible.

Après modification : vérifier la génération, le XML, les URLs et les status HTTP.

## Architecture SEO

Analyser l'arborescence. Créer une hiérarchie logique :

```
Accueil
 → Services
 → Services détaillés
 → Zones / Local
 → Ressources
 → FAQ
 → Contact
```

Chaque page importante doit être accessible depuis d'autres pages. Identifier les pages
orphelines. Créer du maillage interne contextuel.

Exemple — page « Plombier Angoulême » :

```
→ Dépannage plomberie
→ Recherche de fuite
→ Installation sanitaire
→ Prix dépannage plomberie
```

Les liens doivent être naturels et utiles.

## Images

Pour chaque image importante : format moderne ; compression ; dimensions ; largeur/hauteur ;
lazy loading lorsque pertinent ; ALT descriptif ; nom de fichier utile lorsque possible.

L'ALT doit décrire l'image. **NE PAS transformer l'ALT en liste de mots-clés.**

## Performance

Auditer : LCP ; INP ; CLS ; JS ; CSS ; images ; fonts ; scripts tiers ; cache ;
compression ; lazy loading ; rendu initial.

Priorité : contenu visible ; images principales ; JavaScript critique ; fonts ; scripts tiers.

Ne pas optimiser au point de dégrader l'expérience.

## Accessibilité

Vérifier : HTML sémantique ; boutons ; liens ; formulaires ; labels ; navigation clavier ;
focus ; contraste ; alt ; ARIA lorsque nécessaire.

Utiliser ARIA uniquement lorsqu'elle améliore réellement la compréhension.

Une bonne accessibilité aide également les agents IA à comprendre et utiliser les interfaces.
