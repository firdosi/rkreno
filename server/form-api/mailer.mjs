import nodemailer from 'nodemailer';

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#039;',
})[character]);

export function createMailer(config) {
  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: { user: config.smtp.user, pass: config.smtp.pass },
    pool: true,
    maxConnections: 2,
    maxMessages: 50,
  });

  return {
    async sendEnquiry(data, requestId) {
      const replyTo = data.email || undefined;
      const subject = `Website enquiry: ${data.service} - ${data.name}`;
      const lines = [
        `Name: ${data.name}`,
        `Phone: ${data.phone}`,
        `Email: ${data.email || 'Not provided'}`,
        `Service: ${data.service}`,
        `Page: ${data.pageUrl || 'Not provided'}`,
        `Request ID: ${requestId}`,
        '',
        data.message,
      ];
      await transporter.sendMail({
        disableFileAccess: true,
        disableUrlAccess: true,
        from: config.enquiryFrom,
        to: config.enquiryTo,
        replyTo,
        subject,
        text: lines.join('\n'),
        html: `<h2>New RK Reno website enquiry</h2>
          <p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
          <p><strong>Phone:</strong> ${escapeHtml(data.phone)}</p>
          <p><strong>Email:</strong> ${escapeHtml(data.email || 'Not provided')}</p>
          <p><strong>Service:</strong> ${escapeHtml(data.service)}</p>
          <p><strong>Page:</strong> ${escapeHtml(data.pageUrl || 'Not provided')}</p>
          <p><strong>Request ID:</strong> ${escapeHtml(requestId)}</p>
          <hr><p>${escapeHtml(data.message).replace(/\n/g, '<br>')}</p>`,
      });
    },
  };
}
