# Rendu des documents partagés

Les documents accessibles via un lien de partage ne sont **jamais servis dans
leur format d'origine**. Chaque page est rasterisée à la demande par
[`lib/document-render.ts`](../lib/document-render.ts) et servie en JPEG par
`app/api/view/[token]/documents/[documentId]/page/[number]/route.ts`.

Un lien de partage pointe soit vers un document, soit vers une dataroom
(`ShareLink.documentId` / `ShareLink.dataroomId`, jamais les deux). C'est
pour ça que la route de rendu prend `documentId` dans l'URL plutôt que de le
déduire du lien : [`lib/share-link-document.ts`](../lib/share-link-document.ts)
vérifie que le document demandé est bien celui du lien, ou qu'il appartient à
la dataroom du lien, avant de rendre quoi que ce soit.

Cela évite d'exposer le fichier source, ses métadonnées (EXIF, y compris les
coordonnées GPS sur les photos) et sa pleine résolution, et permet d'incruster
le filigrane directement dans les pixels — donc non supprimable depuis le DOM.

> ⚠️ Il ne doit exister **aucune route côté visiteur qui renvoie le blob
> d'origine**. Une telle route contournerait à elle seule toutes les
> protections décrites ici. C'est pour cette raison que `/api/view/[token]/file`
> a été supprimée.

## Cache du rendu de base

Télécharger et re-parser le fichier source à chaque vue de page ne passe pas
à l'échelle : un PDF de plusieurs dizaines de pages consulté une fois coûtait
un téléchargement complet du blob par page.

`renderDocumentPage` sépare donc le rendu en deux étapes. Le rendu **de base**
(sans filigrane) d'une page est mis en cache dans Vercel Blob à un chemin
déterministe (`organizations/{orgId}/documents/{documentId}/render-cache/{n}.jpg`)
la première fois qu'elle est demandée, peu importe le visiteur. Les requêtes
suivantes pour cette page — même visiteur ou un autre, même lien ou un autre
lien pointant vers le même document — relisent ce cache au lieu de retélécharger
et re-parser la source ; seul un décodage JPEG est nécessaire pour y appliquer
un filigrane, bien moins coûteux que le rendu initial.

L'écriture dans le cache se fait après l'envoi de la réponse HTTP, via
[`after()`](https://nextjs.org/docs/app/api-reference/functions/after) : le
visiteur qui déclenche le tout premier rendu d'une page reçoit sa réponse dès
que l'image est prête, sans attendre l'upload vers le cache.

Le filigrane, lui, n'est jamais mis en cache : il est spécifique à chaque
visiteur (nom/email/date), donc toujours brûlé à la volée sur le rendu de base
(qu'il vienne du cache ou d'un rendu frais) avant d'être renvoyé.

## Limites connues

### 1. Le bord long est plafonné à 1600 px

`MAX_EDGE` dans [`lib/document-render.ts`](../lib/document-render.ts) borne la
plus grande dimension d'une page rendue, ce qui limite le coût du rendu et le
poids des images.

Ce plafond peut rendre illisibles les petits caractères d'un document dense
(tableaux, mentions légales, plans). C'est une simple constante : l'augmenter
améliore la netteté au prix du temps de rendu et de la bande passante.
`JPEG_QUALITY`, juste en dessous, joue sur le même compromis.

## Note d'exploitation

`mupdf` est un module WASM chargé à l'exécution. Il est déclaré dans
`serverExternalPackages` ([`next.config.ts`](../next.config.ts)) car le bundler
casse ce chargement — sans cette déclaration, les routes qui l'importent
échouent à l'initialisation du module, avant tout `try`/`catch`, et renvoient
une erreur 500 opaque.
