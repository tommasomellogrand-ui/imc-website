(() => {
  const root = document.getElementById('app');
  const config = window.IMC_GAME_WORLD || {};
  if (!root) return;
  const title = document.createElement('h1');
  title.textContent = config.name || '';
  root.replaceChildren(title);
})();
