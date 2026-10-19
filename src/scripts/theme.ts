/**
 * Theme switch (design.md → Theme): System → Light → Dark.
 * "System" removes data-theme so the CSS follows prefers-color-scheme. The choice is a per-device convenience
 * in localStorage; every access is wrapped in try/catch (private windows, blocked storage) and the page works without it.
 */
type Mode = 'system' | 'light' | 'dark';
const KEY = 'theme';
const order: Mode[] = ['system', 'light', 'dark'];
const root = document.documentElement;

function read(): Mode {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch { return 'system'; }
}

function apply(mode: Mode) {
  if (mode === 'system') delete root.dataset.theme;
  else root.dataset.theme = mode;
  try {
    if (mode === 'system') localStorage.removeItem(KEY); else localStorage.setItem(KEY, mode);
  } catch { /* storage unavailable: the choice lasts for this page only */ }
  document.querySelectorAll<HTMLButtonElement>('[data-theme-switch]').forEach((btn) => {
    const label = btn.dataset[`label${mode[0].toUpperCase()}${mode.slice(1)}` as 'labelSystem'] ?? mode;
    btn.dataset.mode = mode;
    btn.setAttribute('aria-label', `${btn.dataset.labelPrefix ?? 'Theme'}: ${label}`);
    const text = btn.querySelector('.theme-switch__label');
    if (text) text.textContent = label;
  });
}

let current = read(); // kept in memory too, so the switch still cycles when storage is blocked
document.querySelectorAll<HTMLButtonElement>('[data-theme-switch]').forEach((btn) => {
  btn.hidden = false; // without JS the switch stays hidden and the system setting applies
  btn.addEventListener('click', () => {
    current = order[(order.indexOf(current) + 1) % order.length];
    apply(current);
  });
});
apply(current);
