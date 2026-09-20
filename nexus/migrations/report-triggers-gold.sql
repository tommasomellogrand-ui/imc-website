CREATE FUNCTION imc_report_players_v2(p_players JSON, p_commentary JSON)
RETURNS JSON DETERMINISTIC NO SQL
RETURN (WITH
ps AS (SELECT jt.*, TRIM(REGEXP_REPLACE(pname, '^[^ ]+ +', '')) AS surname
 FROM JSON_TABLE(IF(JSON_TYPE(p_players)='ARRAY',p_players,JSON_ARRAY()), '$[*]' COLUMNS (
 ord FOR ORDINALITY, item JSON PATH '$', pname VARCHAR(255) PATH '$.player_name',
 starter INT PATH '$.starter', rating DECIMAL(6,2) PATH '$.rating', goals INT PATH '$.goals', assists INT PATH '$.assists',
 direct_on VARCHAR(16) PATH '$.sub_on_minute', direct_off VARCHAR(16) PATH '$.sub_off_minute')) jt),
cs AS (SELECT * FROM JSON_TABLE(IF(JSON_TYPE(p_commentary)='ARRAY',p_commentary,JSON_ARRAY()), '$[*]' COLUMNS (
 txt TEXT PATH '$.commentary_text', m VARCHAR(16) PATH '$.minute')) c WHERE REGEXP_LIKE(m,'^[0-9]{1,3}([+][0-9]{1,2})?$')),
clauses AS (
 SELECT m,'off' kind, REGEXP_REPLACE(REGEXP_SUBSTR(txt,'[^.!]+ (sta|stanno) uscendo dal campo'), ' (sta|stanno) uscendo dal campo$','') names FROM cs
 UNION ALL SELECT m,'off',REGEXP_REPLACE(REGEXP_SUBSTR(txt,'[^.!]+ (are|is) leaving the action'),' (are|is) leaving the action$','') FROM cs
 UNION ALL SELECT m,'off',REGEXP_REPLACE(REGEXP_SUBSTR(txt,'[^.!]+ (esce|lasciano) (dal |il )campo per la squadra [^.!]+'),' (esce|lasciano) (dal |il )campo per la squadra .*$','') FROM cs
 UNION ALL SELECT m,'on',REGEXP_REPLACE(REGEXP_SUBSTR(txt,'(Sarà|Saranno|Viene|Vengono) sostituit[oi] da [^.!]+'),'^(Sarà|Saranno|Viene|Vengono) sostituit[oi] da ','') FROM cs
 UNION ALL SELECT m,'on',REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_SUBSTR(txt,'(Sarà|Saranno) [^.!]+ a sostituirl[oi]'),'^(Sarà|Saranno) ',''),' a sostituirl[oi]$','') FROM cs
 UNION ALL SELECT m,'off',REGEXP_REPLACE(REGEXP_SUBSTR(txt,'[^.!]+ leave the action for [^.!]+'),' leave the action for .*$','') FROM cs
 UNION ALL SELECT m,'off',REGEXP_REPLACE(REGEXP_SUBSTR(txt,'[^.!]+ viene sostituito per la squadra [^.!]+'),' viene sostituito per la squadra .*$','') FROM cs
 UNION ALL SELECT m,'on',REGEXP_REPLACE(REGEXP_SUBSTR(txt,'[^.!]+ li sostituiscono'),' li sostituiscono$','') FROM cs
 UNION ALL SELECT m,'on',REGEXP_REPLACE(REGEXP_SUBSTR(txt,'[^.!]+ are their replacements'),' are their replacements$','') FROM cs
 UNION ALL SELECT m,'on',REGEXP_REPLACE(REGEXP_SUBSTR(txt,'[^.!]+ entra in campo'),' entra in campo$','') FROM cs
 UNION ALL SELECT m,'on',REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_SUBSTR(txt,'It will be [^.!]+ to replace (them|him)'),'It will be ',''),' to replace (them|him)$','') FROM cs
),
lists AS (SELECT m,kind,CONCAT('|',REGEXP_REPLACE(TRIM(REGEXP_REPLACE(names,'^[0-9]+ *','')),' *, *| +(e|and) +','|'),'|') names FROM clauses WHERE names IS NOT NULL),
hits AS (SELECT p.ord,l.kind,l.m FROM ps p JOIN lists l ON
 LOCATE(CONCAT('|',p.surname,'|') COLLATE utf8mb4_0900_ai_ci,l.names COLLATE utf8mb4_0900_ai_ci)>0
 WHERE p.surname<>'' AND (SELECT COUNT(*) FROM ps q WHERE q.surname COLLATE utf8mb4_0900_ai_ci=p.surname COLLATE utf8mb4_0900_ai_ci)=1),
resolved AS (SELECT p.*,
 COALESCE(IF(REGEXP_LIKE(direct_on,'^[0-9]{1,3}([+][0-9]{1,2})?$'),direct_on,NULL),(SELECT IF(COUNT(DISTINCT m)=1,MIN(m),NULL) FROM hits h WHERE h.ord=p.ord AND h.kind='on')) onset,
 COALESCE(IF(REGEXP_LIKE(direct_off,'^[0-9]{1,3}([+][0-9]{1,2})?$'),direct_off,NULL),(SELECT IF(COUNT(DISTINCT m)=1,MIN(m),NULL) FROM hits h WHERE h.ord=p.ord AND h.kind='off')) offset_min
 FROM ps p)
SELECT COALESCE(JSON_ARRAYAGG(JSON_SET(item,
 '$.sub_on_minute',onset,'$.sub_off_minute',offset_min,
 '$.sub_on',IF(onset IS NOT NULL OR (starter=0 AND (rating>0 OR goals>0 OR assists>0)),1,0),
 '$.sub_off',IF(offset_min IS NOT NULL,1,0),
 '$.sub_on_minute_source',IF(onset IS NULL,NULL,IF(direct_on IS NOT NULL,'report','commentary')),
 '$.sub_off_minute_source',IF(offset_min IS NULL,NULL,IF(direct_off IS NOT NULL,'report','commentary')))),p_players)
FROM resolved);
CREATE TRIGGER imc_report_normalize_gw002_bi BEFORE INSERT ON `GW002_IMC Match Report` FOR EACH ROW SET NEW.players_json = imc_report_players_v2(NEW.players_json,NEW.commentary_json);
CREATE TRIGGER imc_report_normalize_gw002_bu BEFORE UPDATE ON `GW002_IMC Match Report` FOR EACH ROW SET NEW.players_json = imc_report_players_v2(NEW.players_json,NEW.commentary_json);
CREATE TRIGGER imc_report_normalize_gw003_bi BEFORE INSERT ON `GW003_IMC Match Report` FOR EACH ROW SET NEW.players_json = imc_report_players_v2(NEW.players_json,NEW.commentary_json);
CREATE TRIGGER imc_report_normalize_gw003_bu BEFORE UPDATE ON `GW003_IMC Match Report` FOR EACH ROW SET NEW.players_json = imc_report_players_v2(NEW.players_json,NEW.commentary_json);
CREATE TRIGGER imc_report_normalize_gw007_bi BEFORE INSERT ON `GW007_IMC Match Report` FOR EACH ROW SET NEW.players_json = imc_report_players_v2(NEW.players_json,NEW.commentary_json);
CREATE TRIGGER imc_report_normalize_gw007_bu BEFORE UPDATE ON `GW007_IMC Match Report` FOR EACH ROW SET NEW.players_json = imc_report_players_v2(NEW.players_json,NEW.commentary_json);
CREATE TRIGGER imc_report_normalize_gw008_bi BEFORE INSERT ON `GW008_IMC Match Report` FOR EACH ROW SET NEW.players_json = imc_report_players_v2(NEW.players_json,NEW.commentary_json);
CREATE TRIGGER imc_report_normalize_gw008_bu BEFORE UPDATE ON `GW008_IMC Match Report` FOR EACH ROW SET NEW.players_json = imc_report_players_v2(NEW.players_json,NEW.commentary_json);
