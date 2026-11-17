<?php
declare(strict_types=1);

/** Canonical persisted identity. Old IDs are accepted only at compatibility edges. */
const IMC_WORLD_ALIASES = ['GW001'=>'IMC001','GW005'=>'IMC002','GW009'=>'IMC003','GW010'=>'IMC004','GW011'=>'IMC005','GW004'=>'IMC006','GW006'=>'IMC007','IMC-008'=>'IMC008'];
function imc_world_id(string $value): string {
    if (isset(IMC_WORLD_ALIASES[$value])) return IMC_WORLD_ALIASES[$value];
    if (preg_match('/^IMC-(00[1-9]|010)$/D',$value,$m)) return 'IMC'.$m[1];
    return $value;
}
function imc_world_route(string $value): string {
    $canonical=imc_world_id($value);
    return array_search($canonical,IMC_WORLD_ALIASES,true) ?: $value;
}
function imc_world_value(mixed $value): mixed {
    if (!is_string($value)) return $value;
    if (preg_match('/^(GW\d{3}|IMC-?\d{3})(?=$|[|_])/D',$value,$m)) return imc_world_id($m[1]).substr($value,strlen($m[1]));
    return $value;
}
function imc_world_payload(mixed $value): mixed {
    if (!is_array($value)) return imc_world_value($value);
    $out=[];
    foreach($value as $k=>$v)$out[is_string($k)?imc_world_value($k):$k]=imc_world_payload($v);
    return $out;
}
/** Definition lookup at the legacy UI edge; persisted edition keys stay intact. */
function imc_competition_definition_key(string $key): string {
    $key=preg_replace('/^((?:IMC-?|GW)\d{3})\|S\d+\|/','$1|',$key);
    // These two CORE definitions retain their original underscore identifiers.
    return preg_replace('/^((?:IMC-?|GW)\d{3})\|IMC\|(COPA_LIBERTADORES|COPPA_DEI_CAMPIONI)$/','$1_$2',$key);
}
function imc_world_compat_rows(array $rows): array {
    foreach($rows as &$row)foreach($row as $key=>&$value){
        if(in_array($key,['game_world_id','source_game_world_id','Game World','IMC GW','gw','id'],true)&&is_string($value))$value=imc_world_route($value);
        if($key==='competition_key'&&is_string($value)){
            $value=imc_competition_definition_key($value);
            if(preg_match('/^(IMC\d{3})(?=[|_])/',$value,$m))$value=imc_world_route($m[1]).substr($value,strlen($m[1]));
        }
    }
    unset($row,$value);return $rows;
}
function imc_world_sql_value(string $column,bool $key=false): string {
    if($key){
        $column="REGEXP_REPLACE($column,'[|]S[0-9]+[|]','|')";
        foreach(['COPA_LIBERTADORES','COPPA_DEI_CAMPIONI'] as $slug)$column="REPLACE($column,'|IMC|$slug','_$slug')";
    }
    $cases=[];$aliases=IMC_WORLD_ALIASES;
    foreach(range(1,10) as $n)$aliases[sprintf('IMC-%03d',$n)]=sprintf('IMC%03d',$n);
    foreach($aliases as $old=>$new){
        if($key){$length=strlen($old);$cases[]="WHEN LEFT($column,".($length+1).") IN ('$old|','{$old}_') THEN CONCAT('$new',SUBSTRING($column,".($length+1)."))";}
        else $cases[]="WHEN $column='$old' THEN '$new'";
    }
    return '(CASE '.implode(' ',$cases).' ELSE '.$column.' END)';
}
/** Dual-read aliases during migration; only canonical values are bound/written. */
function imc_world_sql(string $sql): string {
    if(!preg_match('/^\s*SELECT\b/i',$sql))return $sql;
    $sql=preg_replace_callback("/'(?:''|[^'])*'/",static function($m){$s=substr($m[0],1,-1);return "'".imc_world_value(imc_competition_definition_key($s))."'";},$sql);
    $column='(?:[a-zA-Z_][a-zA-Z0-9_]*\.)?(?:`?(?:game_world_id|source_game_world_id|competition_key)`?|`(?:IMC GW|Game World)`)';
    $sql=preg_replace_callback('/(?<![a-zA-Z0-9_`])('.$column.')\s*(=|IN\s*\(|LIKE\b|BETWEEN\b)\s*('.$column.')?/i',static function($m){
        $right=isset($m[3])&&$m[3]!==''?imc_world_sql_value($m[3],stripos($m[3],'competition_key')!==false):'';
        return imc_world_sql_value($m[1],stripos($m[1],'competition_key')!==false).' '.$m[2].' '.$right;
    },$sql);
    return $sql;
}
class IMCWorldStatement extends PDOStatement {
    protected function __construct() {}
    public function execute(?array $params=null): bool {
        $read=preg_match('/^\s*SELECT\b/i',$this->queryString)===1;
        return parent::execute($params===null?null:array_map(static fn($value)=>imc_world_value($read&&is_string($value)?imc_competition_definition_key($value):$value),$params));
    }
}
class IMCWorldPDO extends PDO {
    public function __construct(string $dsn,?string $username=null,?string $password=null,?array $options=null){
        $options??=[];$options[PDO::ATTR_STATEMENT_CLASS]=[IMCWorldStatement::class,[]];parent::__construct($dsn,$username,$password,$options);
    }
    public function prepare(string $query,array $options=[]): PDOStatement|false{return parent::prepare(imc_world_sql($query),$options);}
    public function query(string $query,?int $fetchMode=null,mixed ...$fetchModeArgs): PDOStatement|false{
        return $fetchMode===null?parent::query(imc_world_sql($query)):parent::query(imc_world_sql($query),$fetchMode,...$fetchModeArgs);
    }
}
