export function bootEnquiryForms(selector = '[data-enquiry-form]') {
  for (const form of document.querySelectorAll<HTMLFormElement>(selector)) {
    const endpoint = form.dataset.endpoint || '';
    const configured = form.dataset.configured === 'true';
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const status = form.querySelector<HTMLElement>('[data-form-status]');
    const startedAt = form.elements.namedItem('startedAt') as HTMLInputElement | null;
    const pageUrl = form.elements.namedItem('pageUrl') as HTMLInputElement | null;
    if (startedAt) startedAt.value = new Date().toISOString();
    if (pageUrl) pageUrl.value = location.pathname;
    let submitting = false;
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!configured || !endpoint || !button || !status || submitting || !form.reportValidity()) return;
      document.dispatchEvent(new CustomEvent('rkreno:analytics', {
        detail: { name: 'enquiry_submit_attempt', parameters: { page_path: location.pathname } },
      }));
      const formData = new FormData(form);
      const turnstileToken = String(formData.get('cf-turnstile-response') || '');
      if (!turnstileToken) {
        status.dataset.state = 'error';
        status.textContent = 'Please complete the security check and try again.';
        return;
      }
      const payload = Object.fromEntries(formData.entries());
      delete payload['cf-turnstile-response'];
      payload.turnstileToken = turnstileToken;
      payload.consent = formData.get('consent') === 'on';
      submitting = true;
      button.disabled = true;
      status.textContent = 'Sending your enquiry securely\u2026';
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error('request_failed');
        document.dispatchEvent(new CustomEvent('rkreno:lead-accepted', {
          detail: { requestId: result.requestId },
        }));
        location.assign(`${import.meta.env.BASE_URL}thank-you/`);
      } catch {
        status.dataset.state = 'error';
        status.textContent = 'We could not send the enquiry. Please try again or use WhatsApp.';
        window.turnstile?.reset();
        submitting = false;
        button.disabled = false;
      }
    });
  }
}
