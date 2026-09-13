<?php
declare(strict_types=1);
require_once __DIR__.'/seasons.php';
function check(bool $condition, string $message): void {
    if (!$condition) throw new RuntimeException($message);
}
function season(int $id, ?string $start, ?string $end): array {
    return ['game_world_id'=>'GW001','imc_season'=>$id,'soccer_manager_season'=>null,'imc_season_start_date'=>$start,'imc_season_end_date'=>$end];
}
$rows=[season(1,'2026-07-12','2026-09-20'),season(2,'2026-09-21','2026-12-01'),season(3,null,null)];
foreach ([['2026-07-11T21:59:59Z',null],['2026-07-11T22:00:00Z',1],['2026-09-20T21:59:59Z',1],['2026-09-20T22:00:00Z',2],['2026-12-01T23:00:00Z',null]] as [$instant,$expected]) {
    $state=gw001_season_state($rows,new DateTimeImmutable($instant));
    check(($state['current_season']['imc_season']??null)===$expected,'Rome boundary: '.$instant);
    check(count($state['seasons'])===3,'Future and undated rows remain available');
    check($state['seasons'][2]['is_current']===false,'No inferred dates');
    check($state['seasons'][0]['soccer_manager_season']===null,'NULL SM season preserved');
}
$now=new DateTimeImmutable('2026-09-13T12:00:00Z');
$state=gw001_season_state([$rows[0],season(2,'2026-09-01','2026-10-01')],$now);
check($state['current_season']===null && $state['current_status']==='ambiguous','No arbitrary choice for overlapping seasons');
check(gw001_season_state([],$now)['current_status']==='empty','No invented season for empty table');
$state=gw001_season_state([season(7,'2027-01-01','2027-03-01')],new DateTimeImmutable('2027-02-01'));
check($state['current_season']['imc_season']===7,'No hardcoded season number');
foreach ([season(1,'2026-02-30','2026-09-20'),season(1,'2026-09-20','2026-07-12'),[...$rows[0],'game_world_id'=>'GW007']] as $bad) {
    try {gw001_season_state([$bad],$now);throw new LogicException('Invalid row accepted');}
    catch (RuntimeException $e) {check(!($e instanceof LogicException),'Invalid data must be rejected');}
}
echo "PASS: live season selection, Rome/DST boundaries, future rows, NULL dates, overlaps and invalid data\n";
