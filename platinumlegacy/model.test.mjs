import assert from 'node:assert/strict';
import {people,players} from './model.mjs';
const stints=[{player_id:1,season:1,club_name:'A',appearances:2,goals:1,assists:0,mom:0,minutes:180,average_rating:8,rated_matches:2},{player_id:1,season:2,club_name:'B',appearances:1,goals:2,assists:1,mom:1,minutes:null,average_rating:5,rated_matches:1}];
const p=players(stints,{1:{id:1,name:'One'}})[0];assert.equal(p.played,3);assert.equal(p.goals,3);assert.equal(p.teams.size,2);assert.equal(p.minutes,null);assert.equal(p.average,7);assert.equal(p.history.length,2);
const m=[{season:1,home_id:'A',home_name:'A',away_id:'B',away_name:'B',home_score:2,away_score:0,home_manager:'old',away_manager:null},{season:2,home_id:'A',home_name:'A',away_id:'B',away_name:'B',home_score:0,away_score:1,home_manager:'new',away_manager:null}];
const r=people(m,[{winner_id:'A',winner:'A',manager:'old'}],'manager',{old:'Old',new:'New'});assert.equal(r[0].titles,1);assert.equal(r.find(x=>x.id==='new').titles,0);assert.equal(r.length,2);console.log('Transfer stints, weighted ratings, missing minutes and historical manager titles verified.');
