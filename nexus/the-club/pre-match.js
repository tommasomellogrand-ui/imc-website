(()=>{'use strict';
function story(f){
 const p=f.preview||{},h=p.home_table||{},a=p.away_table||{},hf=p.home_form||[],af=p.away_form||[];
 const names=[f.home_name,f.away_name],first=!h.played&&!a.played;
 const run=rows=>{let n=0;for(const r of rows){if(r.outcome!==rows[0]?.outcome)break;n++}return n};
 let title=first?'Si apre il campionato. Il primo segnale conta.':h.points===a.points?'A pari punti, non a pari ambizioni.':'La classifica mette qualcosa in palio.';
 if(!first&&run(hf)>=2&&hf[0].outcome==='V')title=f.home_name+': la continuità passa da questa sfida.';
 else if(!first&&run(af)>=2&&af[0].outcome==='P')title=f.away_name+': una risposta da cercare sul campo.';
 const lead=first?'Per '+names.join(' e ')+' è il debutto in questo campionato. Nessuna forma ereditata dalla stagione passata: il primo confronto va costruito sul campo.':f.home_name+' arriva con '+h.points+' punti in '+h.played+' partite; '+f.away_name+' con '+a.points+' in '+a.played+'. Il distacco è di '+Math.abs(h.points-a.points)+' punti prima della giornata.';
 const moment=rows=>!rows.length?'Nessuna partita di campionato ancora disputata.':rows.filter(r=>r.outcome==='V').length+' vittorie, '+rows.filter(r=>r.outcome==='N').length+' pareggi e '+rows.filter(r=>r.outcome==='P').length+' sconfitte nelle ultime '+rows.length+' di campionato.';
 const themes=[{label:'IL MOMENTO',text:f.home_name+': '+moment(hf)+' '+f.away_name+': '+moment(af)}];
 const venue=(rows,n)=>rows?.length?n+': '+rows.length+' partite, '+rows.reduce((v,r)=>v+Number(r.gf),0)+' gol fatti e '+rows.reduce((v,r)=>v+Number(r.ga),0)+' subiti.':n+': nessun precedente stagionale in questa situazione.';
 themes.push({label:'CASA E TRASFERTA',text:venue(p.home_venue,f.home_name+' in casa')+' '+venue(p.away_venue,f.away_name+' fuori')});
 const leaders=['home','away'].flatMap(s=>(p[s+'_players']||[]).filter(x=>x.goals>0||x.assists>0).map(x=>({...x,club:f[s+'_name']}))).sort((x,y)=>y.goals-x.goals||y.assists-x.assists);
 themes.push({label:'I PROTAGONISTI',text:leaders.length?leaders.slice(0,2).map(x=>x.name+' ('+x.club+'): '+x.goals+' gol e '+x.assists+' assist in '+x.played+' presenze di campionato.').join(' '):'Il campionato non offre ancora contributi offensivi registrati nei report precedenti alla giornata. Sarà il campo a indicare i protagonisti.'});
 const mh=p.manager_h2h,hn=f.home_imc_manager_name,an=f.away_imc_manager_name;
 const duel=mh?.available&&hn&&an?(mh.played===0?'PRIMO CONFRONTO DOCUMENTATO — '+hn+' e '+an+' non hanno precedenti identificati nell’archivio prima di questa giornata.':hn+' contro '+an+': '+mh.played+' precedenti documentati, '+mh.home_wins+' vittorie del primo, '+mh.away_wins+' del secondo e '+mh.draws+' pareggi.'):'Storico tra i manager non disponibile con identificazione sufficiente.';
 let question='Chi darà il primo segnale nel nuovo campionato?',kind='opening';
 if(!first){kind='points';question=h.points===a.points?'Quale delle due riuscirà a rompere la parità in classifica?':'Chi saprà far pesare il confronto diretto nella corsa ai punti?';if(run(hf)>=2&&hf[0].outcome==='V'){kind='home-run';question=f.home_name+' riuscirà ad allungare la serie di '+run(hf)+' vittorie in campionato?';}else if(run(af)>=2&&af[0].outcome==='P'){kind='away-response';question=f.away_name+' riuscirà a interrompere la serie di '+run(af)+' sconfitte?';}}
 return {title,lead,themes,duel,question,kind};
}
function response(f){const s=story(f),h=Number(f.home_score),a=Number(f.away_score);let answer=h===a?'Il campo non separa le due squadre: '+h+'–'+a+', un punto a testa.':(h>a?f.home_name:f.away_name)+' chiude davanti: '+h+'–'+a+'.';
 if(s.kind==='home-run')answer=(h>a?'Sì: la serie di vittorie prosegue.':'No: la serie di vittorie si interrompe.')+' '+answer;
 if(s.kind==='away-response')answer=(a>=h?'Sì: arriva un risultato utile.':'No: arriva un’altra sconfitta.')+' '+answer;
 return {question:s.question,answer};
}
window.ClubPreMatch={story,response};
})();