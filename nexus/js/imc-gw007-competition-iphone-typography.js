(function(){
"use strict";
if(window.__IMC_GW007_COMPETITION_IPHONE_TYPOGRAPHY__)return;
window.__IMC_GW007_COMPETITION_IPHONE_TYPOGRAPHY__=true;

const STYLE_ID="imcGw007CompetitionIphoneTypographyCss";
function install(){
  if(document.getElementById(STYLE_ID))return;
  const s=document.createElement("style");
  s.id=STYLE_ID;
  s.textContent=`
.imc-competitions-all-worlds[data-imc-competitions-world="GW007"]{
  font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;
}
.imc-competitions-all-worlds[data-imc-competitions-world="GW007"] button,
.imc-competitions-all-worlds[data-imc-competitions-world="GW007"] input,
.imc-competitions-all-worlds[data-imc-competitions-world="GW007"] select{
  font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;
}
.imc-competitions-all-worlds[data-imc-competitions-world="GW007"] .imc-comp-filter{
  font-size:9px!important;
  min-height:40px!important;
}
.imc-competitions-all-worlds[data-imc-competitions-world="GW007"] .imc-comp-section-head strong{
  font-size:16px!important;
}
.imc-competitions-all-worlds[data-imc-competitions-world="GW007"] .imc-comp-section-head span{
  font-size:10px!important;
}
.imc-competitions-all-worlds[data-imc-competitions-world="GW007"] .imc-comp-card{
  min-height:90px!important;
}
.imc-competitions-all-worlds[data-imc-competitions-world="GW007"] .imc-comp-copy strong{
  font-size:11px!important;
  line-height:1.12!important;
}
.imc-competitions-all-worlds[data-imc-competitions-world="GW007"] .imc-comp-copy small{
  font-size:8.5px!important;
  line-height:1.3!important;
}
.imc-comp-detail[data-imc-competitions-world="GW007"] .imc-comp-back{
  font-size:13px!important;
}
.imc-comp-detail[data-imc-competitions-world="GW007"] .imc-comp-detail-head h1{
  font-size:27px!important;
  line-height:1.02!important;
}
.imc-comp-detail[data-imc-competitions-world="GW007"] .imc-comp-detail-head p{
  font-size:10.5px!important;
  line-height:1.3!important;
}
.imc-comp-detail[data-imc-competitions-world="GW007"] .imc-comp-tabs button{
  font-size:9.5px!important;
  line-height:1.05!important;
  min-height:42px!important;
}
.imc-comp-detail[data-imc-competitions-world="GW007"] .imc-matchday-head strong{
  font-size:12px!important;
  line-height:1.1!important;
}
.imc-comp-detail[data-imc-competitions-world="GW007"] .imc-matchday-head span{
  font-size:10px!important;
  line-height:1.2!important;
}
.imc-comp-detail[data-imc-competitions-world="GW007"] .imc-match-row{
  min-height:66px!important;
  grid-template-columns:minmax(0,1fr) 56px minmax(0,1fr)!important;
  gap:6px!important;
}
.imc-comp-detail[data-imc-competitions-world="GW007"] .imc-team-logo{
  width:31px!important;
  height:31px!important;
  flex-basis:31px!important;
}
.imc-comp-detail[data-imc-competitions-world="GW007"] .imc-team-name{
  font-size:10.5px!important;
  line-height:1.16!important;
  font-weight:900!important;
}
.imc-comp-detail[data-imc-competitions-world="GW007"] .imc-score{
  min-height:38px!important;
  font-size:16px!important;
}
.imc-comp-detail[data-imc-competitions-world="GW007"] .imc-score small{
  font-size:7.5px!important;
}
.imc-comp-detail[data-imc-competitions-world="GW007"] .imc-time{
  font-size:10.5px!important;
  min-height:34px!important;
}
.imc-comp-detail[data-imc-competitions-world="GW007"] .imc-standings-head{
  font-size:7px!important;
  line-height:1!important;
}
.imc-comp-detail[data-imc-competitions-world="GW007"] .imc-standing-row{
  min-height:52px!important;
  font-size:8.5px!important;
  line-height:1.05!important;
}
.imc-comp-detail[data-imc-competitions-world="GW007"] .imc-standing-pos{
  font-size:10.5px!important;
}
.imc-comp-detail[data-imc-competitions-world="GW007"] .imc-standing-team strong{
  font-size:8.5px!important;
  line-height:1.08!important;
}
.imc-comp-detail[data-imc-competitions-world="GW007"] .imc-standing-pts{
  font-size:10px!important;
  min-height:30px!important;
}
.imc-comp-detail[data-imc-competitions-world="GW007"] .imc-comp-loading,
.imc-comp-detail[data-imc-competitions-world="GW007"] .imc-comp-error{
  font-size:11px!important;
  line-height:1.35!important;
}
@media(min-width:600px){
  .imc-competitions-all-worlds[data-imc-competitions-world="GW007"] .imc-comp-filter{font-size:10px!important}
  .imc-competitions-all-worlds[data-imc-competitions-world="GW007"] .imc-comp-copy strong{font-size:12px!important}
  .imc-competitions-all-worlds[data-imc-competitions-world="GW007"] .imc-comp-copy small{font-size:9px!important}
  .imc-comp-detail[data-imc-competitions-world="GW007"] .imc-comp-tabs button{font-size:10.5px!important}
  .imc-comp-detail[data-imc-competitions-world="GW007"] .imc-team-name{font-size:11px!important}
  .imc-comp-detail[data-imc-competitions-world="GW007"] .imc-standing-row{font-size:9px!important}
  .imc-comp-detail[data-imc-competitions-world="GW007"] .imc-standing-team strong{font-size:9px!important}
}
`;
  document.head.appendChild(s);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
window.IMC_GW007_COMPETITION_IPHONE_TYPOGRAPHY={version:"1.0.0",refresh:install};
})();
