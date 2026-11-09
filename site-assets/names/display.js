(() => {
  'use strict';
  if(window.imcPersonDisplayActive)return;
  window.imcPersonDisplayActive=true;
  const normalize=s=>s.normalize('NFC').toLocaleLowerCase('it');
  const display=s=>normalize(s).replace(/(^|[\s'’\p{Pd}])(\p{L})/gu,(_,p,c)=>p+c.toLocaleUpperCase('it'));
  const token=/[\p{L}\p{M}\p{N}]+(?:[.'’\p{Pd}][\p{L}\p{M}\p{N}]+)*/gu;
  const ignore='script,style,textarea,input,code,pre,[contenteditable=true],.passport-mrz,.mrz,[data-imc-person]';
  const named='.scorer,.player-name,.manager-name,.nc-name,[data-player-name],[data-manager-name]';
  const start=async()=>{
    const result=await fetch('/site-assets/names/list.php');
    if(!result.ok)return;
    const data=await result.json();
    const clubs=new Set(data.clubs.map(normalize));
    const names=new Set(data.names.filter(Boolean).map(x=>normalize(x.trim())));
    const first=new Set(), lengths=new Map();
    for(const name of names){
      const parts=name.split(/\s+/);
      first.add(parts[0]);lengths.set(parts[0],Math.max(lengths.get(parts[0])||0,parts.length));
    }
    function format(node){
      const parent=node.parentElement;
      if(!parent||parent.closest(ignore))return;
      const raw=node.data;
      const words=[...raw.matchAll(token)];
      if(!words.length)return;
      let end=0;const fragments=[];
      for(let i=0;i<words.length;i++){
        const key=normalize(words[i][0]);if(!first.has(key))continue;
        const from=words[i].index;
        for(let n=Math.min(lengths.get(key),words.length-i);n>0;n--){
          const last=words[i+n-1],to=last.index+last[0].length;
          const text=raw.slice(from,to),canonical=normalize(text).replace(/\s+/g,' ');
          if(!names.has(canonical)||clubs.has(canonical)&&!parent.closest(named))continue;
          if(n===1&&!parent.closest(named)&&raw.trim()!==text)continue;
          if(text!==display(text)||getComputedStyle(parent).textTransform==='uppercase'){
            fragments.push(raw.slice(end,from),display(text));end=to;
          }
          i+=n-1;break;
        }
      }
      if(!fragments.length)return;
      fragments.push(raw.slice(end));
      if(parent.closest('option,title,svg')){
        if(parent.tagName==='OPTION'&&!parent.hasAttribute('value'))parent.value=parent.value;
        const updated=fragments.join('');if(node.data!==updated)node.data=updated;return;
      }
      const replacement=document.createDocumentFragment();
      fragments.forEach((part,i)=>{
        if(i%2===0){replacement.append(part);return;}
        const label=document.createElement('span');label.dataset.imcPerson='';label.style.setProperty('text-transform','none','important');label.textContent=part;replacement.append(label);
      });
      node.replaceWith(replacement);
    }
    function scan(root){
      if(root.nodeType===3){format(root);return;}
      if(root.nodeType!==1||root.closest(ignore))return;
      const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
      const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
      nodes.forEach(format);
    }
    scan(document.body);
    new MutationObserver(records=>{
      for(const record of records){
        if(record.type==='characterData')format(record.target);
        else for(const node of record.addedNodes)scan(node);
      }
    }).observe(document.body,{subtree:true,childList:true,characterData:true});
  };
  const run=()=>start().catch(()=>{});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();
