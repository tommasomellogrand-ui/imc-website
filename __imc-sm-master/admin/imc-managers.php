<?php
declare(strict_types=1);

function smm_seed_imc_managers(): array {
    $db=smm_db();
    $db->exec("CREATE TABLE IF NOT EXISTS imc_managers (
      manager_id VARCHAR(16) NOT NULL,
      full_name VARCHAR(160) NOT NULL,
      imc_join_date DATE NULL,
      sm_manager_id BIGINT UNSIGNED NULL,
      sm_username VARCHAR(160) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (manager_id),
      UNIQUE KEY uq_imc_managers_sm_manager_id (sm_manager_id),
      KEY idx_imc_managers_name (full_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $rows = [
['MNG001','Tommaso Mello','2026-06-15',13051324],['MNG002','Max Palace',null,5249538],['MNG003','Matteo Sartori',null,20670677],['MNG004','Luciano Catalano',null,1494690],['MNG005','Sir Simone',null,7235173],['MNG006','Pep Buitre',null,20881721],['MNG007','Vincenzo Martorano',null,4774576],['MNG008','Giorgio Grugni',null,3702536],['MNG009','Luca Nudo',null,3750517],['MNG010','Mattia Bertonati',null,10762592],['MNG011','Alessandro Berardi',null,7639079],['MNG012','Federico Bonzi',null,22321164],['MNG013','Giovanni Cabrioli',null,8006256],['MNG014','Giovanni Iodice',null,1052349],['MNG015','Marco Fioretti',null,1796567],['MNG016','Saverio Cordiano',null,3166489],['MNG017','Ringhio Gattuso',null,1411779],['MNG018','Andrea Meneghini',null,23081158],['MNG019','Davide Rapisarda',null,5537229],['MNG020','Francesco Senesi',null,3403379],['MNG021','Tommaso Prisco',null,23150225],['MNG022','Oleksandr Medvid',null,1284739],['MNG023','Max Zanoni',null,5143835],['MNG024','Raffaele Manzo',null,23150398],['MNG025','Nicolae Sasarman',null,2982514],['MNG026','Clemente Liggi',null,6496793],['MNG027','Danilo FC 1908',null,7279515],['MNG028','Fabio Ferrini',null,2909837],['MNG029','Al Zubeidi',null,4455966],['MNG030','Lauro Crasti',null,20338205],['MNG031','Lorenzo Errico',null,2254039],['MNG032','Vardan Minasyan',null,8100894],['MNG033','Simone Campanella',null,1794994],['MNG034','Igor Zanotto',null,19303946],['MNG035','Matteo Giovi',null,9887891],['MNG036','Emanuele Delli Calici',null,20605515],['MNG037','Marco Catalozzo',null,20395773],['MNG038','Armando De Giulio',null,3493065],['MNG039','Attilio Bonnici',null,7923128],['MNG040','Mathieu Pioche',null,3122610],['MNG041','Rosario Giamundo',null,1993750],['MNG042','Nick Keyen',null,2614539],['MNG043','Francesco Rossi',null,3619783],['MNG044','Niccolò Querci',null,null],['MNG045','Gianluca Ghio',null,4666505],['MNG046','Alessio Gambato','2026-07-30',3417962],['MNG047','Giorgio Pucci',null,1919333],['MNG048','Giuseppe Trovato',null,5053060],['MNG049','Diego Diegone',null,20853126],['MNG050','Gionni Arena',null,2953532],['MNG051','Luciano Tana',null,329090],['MNG052','Carlo Colombo',null,5765320],['MNG053','Chicco Belin',null,723153],['MNG054','Chris Fenech',null,2144164],['MNG055','Manlio Bosco',null,1892534],['MNG056','Nicky Pepe','2026-08-09',11302214],['MNG057','Daniele Ravanini','2026-08-13',13937401],['MNG058','Giuseppe Esposito','2026-08-15',4383575],['MNG059','Marco Aloisi','2026-08-16',3794483],['MNG060','Cosimo Lonoce','2026-08-17',1926818]
    ];

    $sql="INSERT INTO imc_managers (manager_id,full_name,imc_join_date,sm_manager_id,sm_username) VALUES (?,?,?,?,NULL)
          ON DUPLICATE KEY UPDATE full_name=VALUES(full_name), imc_join_date=VALUES(imc_join_date), sm_manager_id=VALUES(sm_manager_id)";
    $stmt=$db->prepare($sql);
    foreach($rows as $r){$stmt->execute($r);}
    $count=(int)$db->query("SELECT COUNT(*) FROM imc_managers")->fetchColumn();
    $missing=(int)$db->query("SELECT COUNT(*) FROM imc_managers WHERE sm_manager_id IS NULL")->fetchColumn();
    return ['count'=>$count,'missing_sm_manager_id'=>$missing];
}
