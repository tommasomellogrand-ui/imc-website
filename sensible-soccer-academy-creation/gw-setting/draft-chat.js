(()=>{
  const API='../draw-waiting-room/chat.php';
  const mode=(new URLSearchParams(location.search).get('mode')||'host').toLowerCase()==='manager'?'manager':'host';
  const scene=document.getElementById('draftScene');
  const sceneBox=document.querySelector('#draftScene .sceneBox');
  const matrix=document.querySelector('.matrix');
  if(!sceneBox||!matrix||document.getElementById('gw010DraftChat')) return;

  if(mode==='manager'){
    const draftBtn=document.getElementById('draftBtn');
    if(draftBtn) draftBtn.style.display='none';
  }

  const style=document.createElement('style');
  style.id='gw010-draft-chat-style';
  style.textContent=`
  .gw010DraftChat{margin:0 0 16px;background:#071629;border:4px solid #f0e6b4;box-shadow:4px 4px #000;overflow:hidden}
  #draftScene .gw010DraftChat{margin:12px 0 0}
  .gw010DraftChatHead{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;padding:9px;background:#06111f;color:#f4c93d;border-bottom:3px solid #000;font-weight:900}
  .gw010OnlineBadge{display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border:2px solid #42e47a;background:#082216;color:#42e47a;font-size:11px;line-height:1;box-shadow:2px 2px #000}
  .gw010OnlineDot{width:8px;height:8px;background:#42e47a;display:inline-block;animation:gw010Pulse 1.2s steps(2,end) infinite}
  .gw010ChatJoin,.gw010ChatComposer{padding:9px;background:#0b213e}.gw010ChatJoin{border-bottom:3px solid #000}.gw010ChatComposer{border-top:3px solid #000}
  .gw010ChatRow{display:grid;grid-template-columns:1fr auto;gap:8px}
  .gw010DraftChat input{width:100%;background:#02070e;color:#fff;border:3px solid #35557e;padding:10px;font:900 13px "Courier New",monospace;outline:none}.gw010DraftChat input:focus{border-color:#f4c93d}
  .gw010ChatBtn{background:#198247;color:#fff;border:3px solid #fff;box-shadow:3px 3px #000;padding:9px 13px;font:900 11px "Courier New",monospace}.gw010ChatBtn:disabled{opacity:.4}
  .gw010ChatStatus{margin-top:7px;font-size:10px;color:#9eb9db}.gw010ChatMessages{padding:9px;overflow-y:auto;min-height:150px;max-height:220px;background:linear-gradient(#071629,#06111f)}
  .gw010Msg{margin:0 0 7px;padding:7px;border-left:4px solid #3d83e6;background:#0b213e;box-shadow:2px 2px #000}.gw010Msg.mine{border-left-color:#f4c93d}.gw010MsgHead{display:flex;justify-content:space-between;gap:8px;font-size:9px;color:#9eb9db}.gw010MsgName{font-weight:900;color:#fff}.gw010MsgText{margin-top:4px;font-size:12px;white-space:pre-wrap;overflow-wrap:anywhere}
  @keyframes gw010Pulse{50%{opacity:.45}}@media(max-width:650px){.gw010ChatRow{grid-template-columns:1fr}.gw010ChatMessages{max-height:180px}}
  `;
  document.head.appendChild(style);

  const root=document.createElement('section');
  root.id='gw010DraftChat'; root.className='gw010DraftChat';
  root.innerHTML=`<div class="gw010DraftChatHead">MANAGER CHAT <span class="gw010OnlineBadge"><span class="gw010OnlineDot"></span><span id="gw010OnlineCount">0 ONLINE</span></span></div><div class="gw010ChatJoin"><div class="gw010ChatRow"><input id="gw010NameInput" maxlength="40" autocomplete="name" placeholder="INSERISCI IL TUO NOME"><button class="gw010ChatBtn" id="gw010JoinBtn" type="button">ENTRA</button></div><div class="gw010ChatStatus" id="gw010ChatStatus">Non sei ancora entrato nella chat.</div></div><div class="gw010ChatMessages" id="gw010ChatMessages" aria-live="polite"></div><div class="gw010ChatComposer"><div class="gw010ChatRow"><input id="gw010MessageInput" maxlength="500" autocomplete="off" placeholder="SCRIVI UN MESSAGGIO..." disabled><button class="gw010ChatBtn" id="gw010SendBtn" type="button" disabled>INVIA</button></div></div>`;

  const moveHome=()=>{if(root.parentElement!==matrix.parentElement||root.nextElementSibling!==matrix)matrix.parentElement.insertBefore(root,matrix);};
  const moveLive=()=>{if(root.parentElement!==sceneBox)sceneBox.appendChild(root);};
  moveHome();
  if(scene){
    new MutationObserver(()=>scene.classList.contains('show')?moveLive():moveHome()).observe(scene,{attributes:true,attributeFilter:['class']});
  }
  window.addEventListener('gw010:home',moveHome);

  const $=id=>document.getElementById(id),nameInput=$('gw010NameInput'),joinBtn=$('gw010JoinBtn'),status=$('gw010ChatStatus'),messages=$('gw010ChatMessages'),messageInput=$('gw010MessageInput'),sendBtn=$('gw010SendBtn'),onlineCount=$('gw010OnlineCount');
  let manager=(localStorage.getItem('imc_gw010_waiting_name')||'').trim(),lastSig='';let clientId=localStorage.getItem('imc_gw010_waiting_client')||'';
  if(!clientId){clientId=(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2));localStorage.setItem('imc_gw010_waiting_client',clientId);}
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const setOnline=n=>onlineCount.textContent=Math.max(0,Number(n)||0)+' ONLINE';
  function applyJoin(){const ok=!!manager;messageInput.disabled=!ok;sendBtn.disabled=!ok;status.textContent=ok?'Connesso come '+manager+'.':'Non sei ancora entrato nella chat.';if(ok){nameInput.value=manager;joinBtn.textContent='CAMBIA NOME';}}
  function render(list){const sig=JSON.stringify(list);if(sig===lastSig)return;lastSig=sig;messages.innerHTML=list.map(m=>`<div class="gw010Msg ${m.name===manager?'mine':''}"><div class="gw010MsgHead"><span class="gw010MsgName">${esc(m.name)}</span><span>${esc(m.time)}</span></div><div class="gw010MsgText">${esc(m.text)}</div></div>`).join('');messages.scrollTop=messages.scrollHeight;}
  async function heartbeat(){if(!manager)return;try{const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'presence',client_id:clientId,name:manager}),cache:'no-store'});const j=await r.json();if(j.ok)setOnline(j.online);}catch(e){}}
  async function load(){try{const r=await fetch(API+'?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error();const j=await r.json();if(j.ok){render(j.messages||[]);setOnline(j.online);}}catch(e){status.textContent='Connessione chat in attesa...';}}
  async function send(){const text=messageInput.value.trim();if(!manager||!text)return;sendBtn.disabled=true;try{const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:manager,text})});const j=await r.json();if(j.ok){messageInput.value='';render(j.messages||[]);setOnline(j.online);}else status.textContent=j.error||'Messaggio non inviato.';}catch(e){status.textContent='Errore di connessione durante l\'invio.';}finally{sendBtn.disabled=!manager;}}
  joinBtn.addEventListener('click',()=>{const n=nameInput.value.trim().replace(/\s+/g,' ').slice(0,40);if(!n){status.textContent='Inserisci un nome.';return;}manager=n;localStorage.setItem('imc_gw010_waiting_name',manager);applyJoin();heartbeat();messageInput.focus();});
  sendBtn.addEventListener('click',send);messageInput.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}});
  if(manager)nameInput.value=manager;applyJoin();load();heartbeat();setInterval(load,1500);setInterval(heartbeat,7000);
})();
