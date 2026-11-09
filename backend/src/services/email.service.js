import env from '../config/env.js'

const BREVO_BASE = 'https://api.brevo.com/v3'

export async function brevoRequest(path, body) {
  if (!env.brevo.apiKey) {
    throw new Error('BREVO_API_KEY is not configured')
  }
  const res = await fetch(`${BREVO_BASE}${path}`, {
    method: 'POST',
    headers: {
      'api-key': env.brevo.apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.message || `Brevo request failed (${res.status})`)
  }
  return data
}

export async function sendEmail({ to, subject, htmlContent, textContent, sender }) {
  return brevoRequest('/smtp/email', {
    sender: sender || { name: env.brevo.senderName, email: env.brevo.senderEmail },
    to: Array.isArray(to) ? to : [{ email: to }],
    subject,
    htmlContent,
    textContent,
  })
}

export async function sendOrderConfirmationEmail(order) {
  if (!env.brevo.apiKey) return
  const itemsHtml = order.order_items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px">${item.product_name}</td>
        <td style="padding:8px" align="right">× ${item.quantity}</td>
        <td style="padding:8px" align="right">₦${Number(item.unit_price).toLocaleString()}</td>
        <td style="padding:8px" align="right">₦${Number(item.line_total).toLocaleString()}</td>
      </tr>
    `,
    )
    .join('')

  return sendEmail({
    to: order.contact.email,
    subject: `Your SavorBite order ${order.order_number} is confirmed`,
    htmlContent: `
      <h2>Order Confirmed — ${order.order_number}</h2>
      <p>Hi ${order.contact.name},</p>
      <p>Thank you for your order. It has been confirmed and is being prepared.</p>
      <table style="width:100%; border-collapse:collapse; margin:16px 0">
        <thead>
          <tr style="text-align:left">
            <th style="padding:8px">Item</th>
            <th style="padding:8px" align="right">Qty</th>
            <th style="padding:8px" align="right">Unit</th>
            <th style="padding:8px" align="right">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <p><strong>Total:</strong> ₦${Number(order.total).toLocaleString()}</p>
      <p><strong>Delivery to:</strong> ${order.delivery.address}, ${order.delivery.city}</p>
      <p>Track your order: ${env.clientUrls?.[0] || 'https://savorbite.ng'}/orders</p>
    `,
    textContent: `Your SavorBite order ${order.order_number} is confirmed. Total: ₦${Number(order.total).toLocaleString()}. Delivery to ${order.delivery.address}, ${order.delivery.city}.`,
  })
}

export async function sendNewOrderAlert(order) {
  if (!env.brevo.apiKey || !env.brevo.ownerEmail) return
  return sendEmail({
    to: env.brevo.ownerEmail,
    subject: `New order ${order.order_number} — ₦${Number(order.total).toLocaleString()}`,
    htmlContent: `
      <h2>New Order — ${order.order_number}</h2>
      <p><strong>Customer:</strong> ${order.contact.name} (${order.contact.email})</p>
      <p><strong>Phone:</strong> ${order.contact.phone}</p>
      <p><strong>Total:</strong> ₦${Number(order.total).toLocaleString()}</p>
      <p><strong>Delivery:</strong> ${order.delivery.address}, ${order.delivery.city}</p>
      ${order.delivery.instructions ? `<p><strong>Note:</strong> ${order.delivery.instructions}</p>` : ''}
    `,
    textContent: `New order ${order.order_number} from ${order.contact.name}. Total: ₦${Number(order.total).toLocaleString()}.`,
  })
}

export async function sendSupportTicketAlert(ticket) {
  if (!env.brevo.apiKey || !env.brevo.ownerEmail) return
  return sendEmail({
    to: env.brevo.ownerEmail,
    subject: `New support ticket — ${ticket.subject}`,
    htmlContent: `
      <h2>New Support Ticket</h2>
      <p><strong>Name:</strong> ${ticket.name}</p>
      <p><strong>Email:</strong> ${ticket.email}</p>
      <p><strong>Subject:</strong> ${ticket.subject}</p>
      <p>${ticket.message}</p>
    `,
    textContent: `New support ticket: ${ticket.subject} from ${ticket.name} (${ticket.email})`,
  })
}
