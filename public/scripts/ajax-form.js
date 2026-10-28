/* =============================================================
   Envío AJAX de formularios Formspree (contacto y cotización).
   Evita el salto de página en caso de éxito/error; redirige en éxito.
   ============================================================= */

/**
 * @param {string} formId
 * @param {{ redirectTo: string, errorMsg: string, networkErrorMsg: string }} opts
 */
export function wireAjaxForm(formId, { redirectTo, errorMsg, networkErrorMsg }) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type=submit]');
    if (btn) btn.disabled = true;
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });
      if (res.ok) {
        location.href = redirectTo;
      } else {
        alert(errorMsg);
        if (btn) btn.disabled = false;
      }
    } catch (e2) {
      alert(networkErrorMsg);
      if (btn) btn.disabled = false;
    }
  });
}
