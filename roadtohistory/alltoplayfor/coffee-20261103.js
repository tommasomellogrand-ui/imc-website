(()=>{
 const nav=document.querySelector('.cn-tabs');
 const buttons=[...document.querySelectorAll('.cn-tabs button')];
 const groups=[...document.querySelectorAll('.cn-group')];
 function choose(i){
  buttons.forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));
  groups.forEach((g,j)=>g.hidden=i!==j);
  const heading=groups[i]?.querySelector('h2');
  if(!heading)return;
  requestAnimationFrame(()=>{
   const topInset=Math.max(0,parseFloat(getComputedStyle(nav).top)||0);
   const target=heading.getBoundingClientRect().top+window.scrollY-nav.getBoundingClientRect().height-topInset-16;
   window.scrollTo({top:Math.max(0,target),behavior:'instant'});
  });
 }
 buttons.forEach((b,i)=>b.addEventListener('click',()=>choose(i)));
})();
