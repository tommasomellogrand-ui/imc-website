IMC PUBLICATION BRIDGE 2.0

1) Crea (o usa) questa cartella sul dominio:
   /www.italianmastersclub.it/bridge/

2) Carica DENTRO la cartella bridge questi due file:
   publication-bridge.php
   publication-config.php

3) Non spostare publication-config.php fuori dalla cartella bridge.

4) Il bridge userà come ROOT:
   /www.italianmastersclub.it
   quindi può creare, leggere, sovrascrivere, importare, spostare e cancellare file/cartelle ovunque sotto il dominio.

5) Endpoint previsto:
   https://www.italianmastersclub.it/bridge/publication-bridge.php

AZIONI DISPONIBILI
health, list, read, write, upload, import, delete, mkdir, rmdir, move, copy, stat, exists, history

AUTORIZZAZIONE
Header:
Authorization: Bearer <TOKEN>

oppure:
X-IMC-Bridge-Token: <TOKEN>

ESEMPIO JSON SCRITTURA
{
  "action": "write",
  "path": "gw001/test.txt",
  "content": "ciao"
}

ESEMPIO IMPORT BINARIO BASE64
{
  "action": "import",
  "path": "gw001/assets/file.bin",
  "encoding": "base64",
  "content": "..."
}

ESEMPIO CANCELLAZIONE
{
  "action": "delete",
  "path": "gw001/test.txt"
}

IMPORTANTE
Il bridge è intenzionalmente dotato di pieni poteri sotto la root del dominio per il chiamante autorizzato dal token.
Non rimuovere l'autenticazione e non pubblicare il token.
