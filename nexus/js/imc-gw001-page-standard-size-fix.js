(function(){
"use strict";
if(window.__IMC_GW001_PAGE_STANDARD_SIZE_FIX__)return;
window.__IMC_GW001_PAGE_STANDARD_SIZE_FIX__=true;

const VERSION="1.0.3";
const STYLE_ID="imcGw001PageStandardSizeFixCss";

function install(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement("style");
  style.id=STYLE_ID;
  style.textContent=`
#pageRoot:has(> .imc-clean-competitions[data-imc-gw001-competitions-clean="1"]){padding-top:0!important}
.imc-gw001-page-hero{
  width:100%!important;
  min-height:0!important;
  height:auto!important;
  aspect-ratio:800/203!important;
  margin:6px 0 18px!important;
  border-radius:19px!important;
  grid-template-columns:minmax(88px,34%) 1px minmax(0,1fr)!important;
  box-sizing:border-box!important;
}
.imc-clean-competitions .imc-clean-competition-hero{margin-top:4px!important}
.imc-gw001-page-hero .imc-gw001-hero-orb{width:58px!important;height:58px!important}
.imc-gw001-page-hero .imc-gw001-hero-orb svg{width:37px!important;height:37px!important}
.imc-gw001-page-hero .imc-gw001-hero-copy{padding:9px 38px 9px 13px!important}
.imc-gw001-page-hero .imc-gw001-hero-copy span{min-height:19px!important;font-size:7px!important}
.imc-gw001-page-hero .imc-gw001-hero-copy strong{margin-top:5px!important;font-size:17px!important}
.imc-gw001-page-hero .imc-gw001-hero-copy small{margin-top:4px!important;font-size:8px!important}
.imc-gw001-page-hero .imc-gw001-hero-art i{top:13px!important;width:17px!important;height:31px!important}
@media(max-width:390px){
  .imc-gw001-page-hero{
    aspect-ratio:800/203!important;
    margin-top:4px!important;
    margin-bottom:16px!important;
    border-radius:17px!important;
    grid-template-columns:minmax(82px,34%) 1px minmax(0,1fr)!important;
  }
  .imc-clean-competitions .imc-clean-competition-hero{margin-top:2px!important}
  .imc-gw001-page-hero .imc-gw001-hero-orb{width:50px!important;height:50px!important}
  .imc-gw001-page-hero .imc-gw001-hero-orb svg{width:32px!important;height:32px!important}
  .imc-gw001-page-hero .imc-gw001-hero-copy{padding:7px 30px 7px 11px!important}
  .imc-gw001-page-hero .imc-gw001-hero-copy span{min-height:17px!important;font-size:6.5px!important}
  .imc-gw001-page-hero .imc-gw001-hero-copy strong{font-size:15px!important}
  .imc-gw001-page-hero .imc-gw001-hero-copy small{font-size:7px!important}
  .imc-gw001-page-hero .imc-gw001-hero-art i{top:11px!important;width:15px!important;height:27px!important}
}
`;
  document.head.appendChild(style);
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
window.IMC_GW001_PAGE_STANDARD_SIZE_FIX={version:VERSION};
})();
