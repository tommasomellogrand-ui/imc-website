(function(){
"use strict";
var s=document.createElement("script");
s.src="v1/public-app.js?v=20260916-public";
s.async=false;
s.onerror=function(){var host=document.getElementById("moduleHost");var login=document.getElementById("loginView");var app=document.getElementById("appView");if(login)login.hidden=true;if(app)app.hidden=false;if(host)host.innerHTML='<div class="gw-shell-empty">Nexus non disponibile.</div>'};
document.body.appendChild(s);
})();
