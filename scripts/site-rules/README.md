# check-site rules

Each `.mjs` file here is loaded by `scripts/check-site.mjs` after its built-in
checks. Export a default function; it receives `{ ROOT, fail, walk, htmlFiles,
jsonFiles }` and calls `fail(message)` once per problem. One file per class of
bug, named after what it guards (e.g. `advertised-counts.mjs`), with a comment
saying which audit finding it stops from coming back.
