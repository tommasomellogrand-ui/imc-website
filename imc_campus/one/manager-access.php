<?php
declare(strict_types=1);
function one_manager(PDO $db,string $id): ?string {
    $q=$db->prepare("SELECT full_name FROM `IMC Manager Assignment Global` WHERE manager_id=? AND start_date<=CURRENT_DATE AND (end_date IS NULL OR end_date>=CURRENT_DATE) LIMIT 1");
    $q->execute([$id]);
    return $q->fetchColumn() ?: null;
}
function one_issue(PDO $db,string $id): string {
    if ($id!=='MNG001' || !one_manager($db,$id)) throw new RuntimeException('Manager non abilitato alla prova.');
    $token=bin2hex(random_bytes(32));
    $db->beginTransaction();
    $db->prepare("INSERT INTO `IMC ONE Accounts` (manager_id) VALUES (?) ON DUPLICATE KEY UPDATE manager_id=VALUES(manager_id)")->execute([$id]);
    $q=$db->prepare("SELECT activated_at FROM `IMC ONE Accounts` WHERE manager_id=? FOR UPDATE");
    $q->execute([$id]);
    $purpose=$q->fetchColumn()?'recovery':'activation';
    $db->prepare("INSERT INTO `IMC ONE Access Tokens` (manager_id,token_hash,purpose,expires_at) VALUES (?,?,?,UTC_TIMESTAMP()+INTERVAL 24 HOUR) ON DUPLICATE KEY UPDATE token_hash=VALUES(token_hash),purpose=VALUES(purpose),expires_at=VALUES(expires_at),used_at=NULL")->execute([$id,hash('sha256',$token),$purpose]);
    $db->commit();
    return 'https://www.italianmastersclub.it/imc_campus/one/?access=activate#'.$token;
}
function one_authenticate(PDO $db,string $username,string $password,?string $token,string $birth): bool {
    if($token!==null){
        if(!preg_match('/^[a-f0-9]{64}$/D',$token))return false;
        $lookup=$db->prepare("SELECT manager_id FROM `IMC ONE Access Tokens` WHERE token_hash=? AND used_at IS NULL AND expires_at>UTC_TIMESTAMP()");
        $lookup->execute([hash('sha256',$token)]);
    }else{
        $lookup=$db->prepare("SELECT manager_id FROM `IMC ONE Accounts` WHERE username=? OR (username IS NULL AND manager_id=?)");
        $lookup->execute([$username,$username]);
    }
    $id=$lookup->fetchColumn();
    if ($id!=='MNG001' || !one_manager($db,$id) || strlen($password)>72) return false;
    $db->beginTransaction();
    try {
        $q=$db->prepare("SELECT *,failed_since>UTC_TIMESTAMP()-INTERVAL 10 MINUTE AS recent FROM `IMC ONE Accounts` WHERE manager_id=? FOR UPDATE");
        $q->execute([$id]); $a=$q->fetch();
        if (!$a){$db->rollBack();return false;}
        $version=(int)$a['auth_version'];
        if ($token!==null){
            if(!preg_match('/^[a-f0-9]{64}$/D',$token)||strlen($password)<12){$db->rollBack();return false;}
            $q=$db->prepare("UPDATE `IMC ONE Access Tokens` SET used_at=UTC_TIMESTAMP() WHERE manager_id=? AND token_hash=? AND used_at IS NULL AND expires_at>UTC_TIMESTAMP()");
            $q->execute([$id,hash('sha256',$token)]);
            if($q->rowCount()!==1){$db->rollBack();return false;}
            if(!preg_match('/^[a-zA-Z0-9._-]{3,32}$/D',$username))throw new DomainException('Usa da 3 a 32 lettere, numeri, punti, trattini o underscore per lo username.');
            if($birth!==''){
                $date=DateTimeImmutable::createFromFormat('!Y-m-d',$birth);
                if(!$date || $date->format('Y-m-d')!==$birth || $birth>date('Y-m-d') || $birth<'1000-01-01')throw new DomainException('Verifica la data di nascita.');
            }
            $db->prepare("UPDATE `IMC ONE Accounts` SET username=?,birth_date=COALESCE(birth_date,?),password_hash=?,activated_at=COALESCE(activated_at,UTC_TIMESTAMP()),auth_version=auth_version+1 WHERE manager_id=?")->execute([$username,$birth===''?null:$birth,password_hash($password,PASSWORD_DEFAULT),$id]);
            $version++;
        }else{
            if($a['recent'] && $a['failed_count']>=8){$db->rollBack();return false;}
            if(!$a['password_hash'] || !password_verify($password,$a['password_hash'])){
                $db->prepare("UPDATE `IMC ONE Accounts` SET failed_count=?,failed_since=IF(?,failed_since,UTC_TIMESTAMP()) WHERE manager_id=?")->execute([$a['recent']?(int)$a['failed_count']+1:1,(int)$a['recent'],$id]);
                $db->commit();return false;
            }
        }
        $db->prepare("UPDATE `IMC ONE Accounts` SET last_login_at=UTC_TIMESTAMP(),failed_count=0,failed_since=NULL WHERE manager_id=?")->execute([$id]);
        $db->commit();
    } catch(Throwable $e){if($db->inTransaction())$db->rollBack();throw $e;}
    session_regenerate_id(true);
    $_SESSION=['manager'=>$id,'version'=>$version,'token'=>bin2hex(random_bytes(24))];
    return true;
}
