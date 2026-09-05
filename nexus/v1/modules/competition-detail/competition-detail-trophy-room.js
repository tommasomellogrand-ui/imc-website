(function(){
"use strict";
if(window.IMC_COMPETITION_TROPHY_ROOM_LABEL)return;
const VERSION="1.0.0";
function sync(){
  document.querySelectorAll('.cd-tabs [data-cd-tab="history"]').forEach(button=>{
    if(button.textContent!=="TROPHY ROOM")button.textContent="TROPHY ROOM";
  });
}
const observer=new MutationObserver(sync);
observer.observe(document.documentElement,{childList:true,subtree:true});
sync();
window.IMC_COMPETITION_TROPHY_ROOM_LABEL={version:VERSION,sync};
})();