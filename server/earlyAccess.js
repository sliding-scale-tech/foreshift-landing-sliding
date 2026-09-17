import { Resend } from 'resend'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_LEN = 256

const NAVY = '#011342'
const BLUE = '#1a73e8'
const LABEL = '#444444'
const MUTED = '#5f6570'
const BORDER = '#e4e4e4'
const PAGE = '#eef4ff'
const CARD = '#ffffff'

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function firstValue(body, keys) {
  for (const key of keys) {
    if (body[key] != null && String(body[key]).trim()) return String(body[key]).trim()
  }
  return ''
}

function clip(value) {
  return value.slice(0, MAX_LEN)
}

export function parseEarlyAccess(body = {}) {
  const email = clip(firstValue(body, ['email', 'Email']))
  const city = clip(firstValue(body, ['city', 'Phone-Number', 'Phone Number']))
  const restaurantName = clip(firstValue(body, ['restaurantName', 'Company-Name', 'Company Name']))

  if (!email || !EMAIL_RE.test(email)) return { error: 'A valid work email is required.' }
  if (!city) return { error: 'City is required.' }
  return { email, city, restaurantName }
}

function fieldRow(label, value, last = false) {
  const border = last ? '0' : `1px solid ${BORDER}`
  return `
    <tr>
      <td style="padding:16px 0;border-bottom:${border};">
        <div style="font-family:Montserrat,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${LABEL};margin:0 0 6px;">
          ${escapeHtml(label)}
        </div>
        <div style="font-family:Inter,Arial,sans-serif;font-size:16px;line-height:24px;color:${NAVY};margin:0;">
          ${escapeHtml(value || '—')}
        </div>
      </td>
    </tr>`
}

export function buildEarlyAccessEmail({ email, city, restaurantName }) {
  const subject = restaurantName
    ? `ForeShift early access: ${restaurantName} (${city})`
    : `ForeShift early access from ${city}`

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${PAGE};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAGE};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td style="background:${NAVY};border-radius:16px 16px 0 0;padding:28px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-family:Poppins,Arial,sans-serif;font-size:22px;font-weight:600;letter-spacing:-0.02em;color:#ffffff;">
                    Fore<span style="color:${BLUE};">Shift</span>
                  </td>
                  <td align="right" style="font-family:Montserrat,Arial,sans-serif;font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#9ec4ff;">
                    Early access
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="height:4px;background:${BLUE};font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="background:${CARD};padding:36px 32px 28px;border-left:1px solid #f0f0f0;border-right:1px solid #f0f0f0;">
              <p style="font-family:Poppins,Arial,sans-serif;font-size:26px;line-height:1.25;font-weight:600;letter-spacing:-0.02em;color:#000000;margin:0 0 8px;">
                New early access request
              </p>
              <p style="font-family:Inter,Arial,sans-serif;font-size:16px;line-height:26px;color:${NAVY};margin:0 0 28px;">
                Someone filled the ForeShift form. Reply directly to reach them at
                <a href="mailto:${escapeHtml(email)}" style="color:${BLUE};text-decoration:none;font-weight:600;">${escapeHtml(email)}</a>.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafbff;border:1px solid ${BORDER};border-radius:10px;padding:8px 24px;">
                ${fieldRow('Work Email', email)}
                ${fieldRow('City', city)}
                ${fieldRow('Restaurant Name', restaurantName, true)}
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:${CARD};border-radius:0 0 16px 16px;border:1px solid #f0f0f0;border-top:0;padding:0 32px 32px;">
              <p style="font-family:Inter,Arial,sans-serif;font-size:14px;line-height:22px;color:${MUTED};margin:20px 0 0;">
                Get ahead of next <span style="color:${BLUE};font-weight:600;">week</span>. Submitted from the ForeShift landing page.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const text = [
    'New ForeShift early access request',
    '',
    `Work Email: ${email}`,
    `City: ${city}`,
    `Restaurant Name: ${restaurantName || '—'}`,
    '',
    'Submitted from the ForeShift landing page.',
  ].join('\n')

  return { subject, html, text }
}

export async function handleEarlyAccess(body, env = process.env) {
  const parsed = parseEarlyAccess(body)
  if (parsed.error) return { status: 400, body: { error: parsed.error } }

  const apiKey = env.RESEND_API_KEY
  if (!apiKey) return { status: 500, body: { error: 'Email is not configured.' } }

  const from = `ForeShift <hello@${'sliding' + 'scale.xyz'}>`
  const to = 'anthony@foreshift.ai'
  const { subject, html, text } = buildEarlyAccessEmail(parsed)
  const resend = new Resend(apiKey)
  const { data, error } = await resend.emails.send({
    from,
    to,
    replyTo: parsed.email,
    subject,
    html,
    text,
  })

  if (error) {
    console.error('Resend error:', error)
    return { status: 502, body: { error: 'Could not send the request. Please try again.' } }
  }

  return { status: 200, body: { ok: true, id: data?.id } }
}
