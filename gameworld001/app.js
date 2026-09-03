const title = document.querySelector('#competition-title');
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelector('.tab.active')?.classList.remove('active');
    tab.classList.add('active');
    title.textContent = tab.dataset.competition.toUpperCase();
  });
});

document.querySelectorAll('.bottom-nav button').forEach((item) => {
  item.addEventListener('click', () => {
    document.querySelector('.bottom-nav .active')?.classList.remove('active');
    item.classList.add('active');
    if (item.textContent.includes('MATCHES')) document.querySelector('.next-panel')?.scrollIntoView({behavior:'smooth'});
    if (item.textContent.includes('STORIES')) document.querySelector('.stories')?.scrollIntoView({behavior:'smooth'});
    if (item.textContent.includes('OVERVIEW')) window.scrollTo({top:0,behavior:'smooth'});
  });
});
