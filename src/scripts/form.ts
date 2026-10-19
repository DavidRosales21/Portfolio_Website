/**
 * AJAX form submission (Netlify Forms) with tracking.
 * Without JS the form still posts normally and lands on /thank-you.
 * Loading / success / error states follow UI-STATES-PROTOCOL.md §3:
 * busy button (aria-busy, never shrinks, no double send), every wait ends, the typed data survives an error.
 * form[data-state] = loading | success | error is the style hook for the client's design.
 */
import { track } from './track';

const TIMEOUT_MS = 15000; // after this the visitor gets the error message (with another way to reach the business)

document.querySelectorAll<HTMLFormElement>('form[data-ajax]').forEach((form) => {
  const status = form.querySelector<HTMLElement>('.form-status');
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const formId = form.id || form.getAttribute('name') || 'form';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (form.dataset.state === 'loading') return; // never send twice
    if (!form.checkValidity()) {
      track('form_error', { form_id: formId, reason: 'validation' });
      form.reportValidity();
      return;
    }
    form.dataset.state = 'loading';
    form.setAttribute('aria-busy', 'true');
    if (status) { status.textContent = ''; delete status.dataset.state; } // no stale error while sending again
    const label = button ? [...button.childNodes] : [];
    if (button) {
      button.style.minWidth = `${button.offsetWidth}px`; // a shorter busy label never makes the button jump
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
      button.textContent = form.dataset.sending || 'Sending…';
    }

    try {
      const body = new URLSearchParams(new FormData(form) as any).toString();
      const res = await fetch(form.getAttribute('action') || '/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(String(res.status));
      track('form_submit', { form_id: formId });
      form.reset();
      form.dataset.state = 'success';
      if (status) { status.dataset.state = 'success'; status.textContent = form.dataset.success || 'Thank you!'; }
    } catch (err) {
      const reason = err instanceof DOMException && err.name === 'TimeoutError' ? 'timeout' : String(err);
      track('form_error', { form_id: formId, reason });
      form.dataset.state = 'error';
      if (status) { status.dataset.state = 'error'; status.textContent = form.dataset.error || 'Error'; }
    } finally {
      form.removeAttribute('aria-busy');
      if (button) {
        button.replaceChildren(...label);
        button.disabled = false;
        button.removeAttribute('aria-busy');
        button.style.minWidth = '';
      }
      status?.focus();
    }
  });
});
