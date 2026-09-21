# IMC — Comandi dati dalla chat

## Percorso operativo
ChatGPT con strumento Supabase collegato → progetto IMC Nexus `toanuzojdkfjgucztpze` → `private.imc_aruba_request(jsonb)` → Database Manager Aruba → MySQL.

MySQL Aruba è autoritativo. Supabase inoltra soltanto la richiesta.
Il Database Manager v1.6.0 espone direttamente read, count, insert, update, delete, delete_one, clear_repository anche tramite MCP.
Una chat senza strumenti collegati non può eseguire operazioni attraverso le sole istruzioni.

## Regole per la chat
- Una richiesta esplicita e sufficientemente determinata autorizza l'operazione richiesta. Eseguire lettura preliminare, operazione e verifica nella stessa lavorazione; non chiedere all'utente di copiare SQL.
- Rispettare le autorizzazioni e le eventuali conferme richieste dalla piattaforma. Questa guida non le disabilita.
- Non dedurre un intero database da “cancella tutto” senza contesto: individuare il repository richiesto.
- Non eseguire le cancellazioni contenute negli esempi finché non richieste.
- Se GW è noto, il Database Manager ricava il target. Se target e GW sono discordanti, correggere la richiesta.
- Leggere schema/righe correnti prima di inserire, modificare o cancellare. Usare identificatori univoci per delete_one.
- Non dichiarare successo sulla sola ricezione di request_id. Leggere la risposta HTTP, controllare status_code=200 e ok=true, poi rileggere MySQL.
- In caso di timeout o risposta mancante non ripetere automaticamente una scrittura: verificare lo stato e history prima di decidere.
- update e delete richiedono where non vuoto, con condizioni di uguaglianza combinate in AND; null corrisponde a IS NULL. clear_repository svuota l'intera tabella e non accetta filtri.
- clear_repository usa cancellazione dei record: mantiene tabella e trigger e non azzera AUTO_INCREMENT.
- Le risposte before_count/after_count si riferiscono allo stesso filtro; dopo update un record può uscire dal filtro. Verificare la modifica usando la chiave stabile.
- read restituisce al massimo 500 righe e segnala truncated. Per query più articolate usare action=query (SELECT/SHOW/DESCRIBE/EXPLAIN).
- insert inserisce una riga; non è un upsert. row e set accettano valori scalari/null; inviare JSON delle colonne come stringa JSON.
- Per modifiche a schema/trigger usare il percorso esistente plan_migration → execute_migration → verifica; il confirmation_token è generato dal server e si inoltra senza chiedere all'utente di copiarlo.
- Le transazioni dipendono dal motore delle tabelle e dei trigger. Dopo qualsiasi errore di scrittura verificare lo stato reale.
- Per la situazione globale degli import leggere esclusivamente IMC Repository Report da gold e custom.

## Invio e ricezione
Inviare mediante execute_sql di Supabase sul progetto indicato:

```sql
SELECT private.imc_aruba_request(
  '{"action":"count","game_world_id":"GW004","repository":"IMC Match Report"}'::jsonb
) AS request_id;
```

In una seconda chiamata, dopo l'invio:
```sql
SELECT id,status_code,content
FROM net._http_response
WHERE id=<request_id restituito>;
```

Se la risposta non è ancora presente, rileggere lo stesso ID senza inviare nuovamente l'operazione.

## Operazioni
| Richiesta | Corpo JSON da inoltrare |
|---|---|
| Conta i Match Report GW004 | {"action":"count","game_world_id":"GW004","repository":"IMC Match Report"} |
| Leggi i Match Report GW004 | {"action":"read","game_world_id":"GW004","repository":"IMC Match Report","limit":100} |
| Svuota i Match Report GW004 | {"action":"clear_repository","game_world_id":"GW004","repository":"IMC Match Report"} |
| Leggi una riga | {"action":"read","target":"core","table":"TABELLA","where":{"id":123}} |
| Inserisci una riga | {"action":"insert","target":"core","table":"TABELLA","row":{"id":123,"nome":"Esempio"}} |
| Modifica una riga | {"action":"update","target":"core","table":"TABELLA","where":{"id":123},"set":{"nome":"Nuovo valore"}} |
| Elimina una riga | {"action":"delete_one","target":"core","table":"TABELLA","where":{"id":123}} |
| Elimina un gruppo di righe | {"action":"delete","target":"custom","table":"TABELLA","where":{"imc_season":2}} |

TABELLA, colonne e valori negli esempi sono segnaposto da risolvere leggendo lo schema.

## Routing
CORE: core / Sql1956795_1.
GW002, GW003, GW007, GW008: gold / Sql1956795_2.
GW001, GW004, GW005, GW006, GW009, GW010: custom / Sql1956795_3.
Il routing automatico v1.6.0 copre GW001–GW010; per ulteriori GW aggiornare la mappa dopo verifica.

## Collegamento in un'altra chat
Con Supabase già disponibile, usare questo flusso e il project ref sopra. Non serve GitHub per ogni operazione.
Con un client MCP già autenticato al Database Manager, gli strumenti sono pubblicati in tools/list; aggiornare la lista se il client conserva quella precedente.
Non distribuire chiavi in prompt o file pubblici. Il ponte esistente usa la chiave custodita in Vault.
Non è stata configurata automaticamente alcuna nuova connessione nelle altre chat/account.

Endpoint autenticato: https://www.italianmastersclub.it/__imc-sm-master/admin/database-manager/
