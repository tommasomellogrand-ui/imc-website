const fs=require('node:fs');
const rows=[
[94078889,'Eleonora Incardona',true],[94079171,'Giorgia Cenni',true],[94079408,'Valentina Caruso',true],[94079188,'Nicola Roggero',true],[94078906,'Giancarlo Marocchi',true],[94078878,'Matteo Petrucci',true],[94080273,'Stefania Pinna',true],[94079501,'Francesco Repice',true],[94078863,'Massimo Nebuloni',true],[94079159,'Federica Lodi',true],[94079037,'Veronica Brunati',true],[94078892,'Gianluca Di Marzio',true],[94079165,'Sarah Castellana',true],[94079117,'Anna Billò',true],[94079172,'Giorgia Rossi',true],
[94078890,'Paolo Assogna',true],[94082591,'Valentina Ciarlante',true],[94079049,'Stefano Borghi',true],[94079097,'Maurizio Compagnoni',true],[94078939,'Vanessa Leonardi',true],
[94079182,'Pietro Nicolodi'],[94078981,'Antonio Nucera'],[94079139,'Gianluigi Bagnulo'],[94078865,'Francesco Cosatti'],[94079202,'Filippo Benincampi'],[94079161,'Dario Massara'],[94079114,'Marco Bovicelli'],[94079162,'Matteo Barzaghi'],[94078959,'Riccardo Gentile'],[94079061,'Peppe Di Stefano'],[94078875,'Riccardo Re'],[94078884,'Bruno Palermo'],[94079067,'Luca Cilli'],[94078885,'Marco Nosotti'],[94079148,'Giovanni Guardalà'],[94079073,'Marina Presello'],[94079115,'Alessandro Sugoni'],[94078843,'Valentina Mariani'],[94078895,'Paolo Aghemo'],[94078847,'Massimo Marianella']];
const women=new Set(['Eleonora Incardona','Giorgia Cenni','Valentina Caruso','Stefania Pinna','Federica Lodi','Veronica Brunati','Sarah Castellana','Anna Billò','Giorgia Rossi','Valentina Ciarlante','Vanessa Leonardi','Marina Presello','Valentina Mariani']);
function apply(data){
 const clubs=new Map(data.divisions.flatMap(d=>d.fixtures.flatMap(f=>[['home',f],['away',f]]).map(([side,f])=>[Number(f[side+'_table'].id),f[side]])));
 const assignments=rows.map(([id,name,confirmed])=>({club_id:id,club:clubs.get(id),name,status:confirmed?'confirmed':'trial',label:confirmed?'Assegnazione confermata':(women.has(name)?'Inviata in prova':'Inviato in prova')}));
 if(assignments.some(a=>!a.club)||new Set(assignments.map(a=>a.name)).size!==40)throw Error('Invalid assignments');
 data.assignments={effective_from:'2026-10-22',items:assignments};
 for(const d of data.divisions)for(const f of d.fixtures){
  f.reporters=['home','away'].map(side=>({...assignments.find(a=>a.club_id===Number(f[side+'_table'].id)),side}));
  f.home_reporter=f.reporters[0];
  const trial=f.home_reporter.status==='trial';
  f.reporter_intro=trial?'Sono ancora in prova: sto imparando a conoscere la squadra e non sono ancora sul pezzo come vorrei. Per ora parto dai dati verificati, senza spacciarvi retroscena.':'Vi racconto come arrivano le due squadre a questa partita, partendo dagli ultimi impegni registrati.';
 }
 return data;
}
module.exports={apply,rows};
if(require.main===module){const path=__dirname+'/2026-10-22-coffee.json';const data=apply(JSON.parse(fs.readFileSync(path,'utf8')));fs.writeFileSync(path,JSON.stringify(data,null,2)+'\n');fs.writeFileSync(__dirname+'/correspondents.json',JSON.stringify(data.assignments,null,2)+'\n');console.log('40 assignments: 20 confirmed, 20 trial');}
