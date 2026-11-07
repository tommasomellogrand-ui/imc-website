'use strict';
function adminWorldSelect() {
 const select = document.getElementById('world');
 for (let i = 1; i <= 10; i++) {
  const code = 'IMC' + String(i).padStart(3, '0');
  select.add(new Option(code, code));
 }
 const requested = new URLSearchParams(location.search).get('world');
 if (/^IMC00[1-9]$|^IMC010$/.test(requested || '')) select.value = requested;
}
function adminWorldNames(catalog) {
 if (!catalog) return;
 for (const option of document.getElementById('world').options) {
  const name = catalog[option.value];
  option.textContent = option.value + ' · ' + (name || 'Non assegnato');
  option.disabled = !name;
 }
}
