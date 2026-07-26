const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

export function buildMessage(submission, requestId, submittedAt, config) {
  const lines = [
    `Request ID: ${requestId}`, `Submitted: ${submittedAt}`, `Service: ${submission.service}`,
    `Page: ${submission.pageUrl}`, `Name: ${submission.name}`, `Phone: ${submission.phone}`,
    `Email: ${submission.email || 'Not provided'}`, '', 'Project details:', submission.projectDetails,
  ];
  return {
    from: config.sender,
    to: config.recipient,
    ...(submission.email ? { replyTo: submission.email } : {}),
    subject: `New RK Reno website enquiry: ${submission.service}`,
    text: lines.join('\n'),
    html: `<p><strong>Request ID:</strong> ${escapeHtml(requestId)}</p>`
      + `<p><strong>Submitted:</strong> ${escapeHtml(submittedAt)}</p>`
      + `<p><strong>Service:</strong> ${escapeHtml(submission.service)}</p>`
      + `<p><strong>Page:</strong> ${escapeHtml(submission.pageUrl)}</p>`
      + `<p><strong>Name:</strong> ${escapeHtml(submission.name)}</p>`
      + `<p><strong>Phone:</strong> ${escapeHtml(submission.phone)}</p>`
      + `<p><strong>Email:</strong> ${escapeHtml(submission.email || 'Not provided')}</p>`
      + `<p><strong>Project details:</strong><br>${escapeHtml(submission.projectDetails).replace(/\n/g, '<br>')}</p>`,
  };
}

export class TestCaptureMailAdapter {
  constructor({ accept = true, exception = false } = {}) {
    this.accept = accept;
    this.exception = exception;
    this.messages = [];
  }
  async deliver(message) {
    if (this.exception) throw new Error('simulated adapter exception');
    if (!this.accept) return { accepted: false, category: 'rejected' };
    this.messages.push(message);
    return { accepted: true, category: 'test_capture' };
  }
}

export class DryRunMailAdapter {
  async deliver() {
    return { accepted: false, category: 'dry_run' };
  }
}

export class SmtpMailAdapter {
  constructor(transport) { this.transport = transport; }
  async deliver(message) {
    const result = await this.transport.sendMail(message);
    return { accepted: Array.isArray(result.accepted) && result.accepted.length > 0, category: 'smtp' };
  }
}
