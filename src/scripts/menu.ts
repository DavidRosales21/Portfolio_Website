/** Mobile menu on native <dialog>: focus trap + Esc come free. Pauses smooth scroll while open. */
const dialog = document.getElementById('mobile-menu') as HTMLDialogElement | null;
const openBtn = document.querySelector<HTMLButtonElement>('[data-menu-open]');

openBtn?.addEventListener('click', () => {
  dialog?.showModal();
  openBtn.setAttribute('aria-expanded', 'true');
  window.lenis?.stop();
});

dialog?.querySelector('[data-menu-close]')?.addEventListener('click', () => dialog.close());
dialog?.addEventListener('close', () => {
  openBtn?.setAttribute('aria-expanded', 'false');
  window.lenis?.start();
});
// Close on backdrop click and when a link is chosen
dialog?.addEventListener('click', (e) => {
  if (e.target === dialog || (e.target as Element).closest('a')) dialog.close();
});
