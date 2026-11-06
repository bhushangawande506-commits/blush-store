/**
 * =============================================================================
 * BLUSH PUNE — RESEND EMAIL SERVICE ADAPTER
 * File: server/email.js
 * =============================================================================
 *
 * Requirements:
 * 1. Read API key only from process.env.RESEND_API_KEY.
 * 2. Never hardcode or expose the API key.
 * 3. Default sender: 'Blush <onboarding@resend.dev>'.
 * 4. Idempotent: Prevent duplicate emails for the same order.
 * 5. Safe: Failure must never cancel or crash the order flow.
 */

const { Resend } = require('resend');

// Track order IDs that have already received confirmation emails in-memory
const sentOrders = new Set();

/**
 * Lazily gets an initialized Resend client if RESEND_API_KEY is configured.
 * @returns {Resend|null}
 */
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    return null;
  }
  return new Resend(apiKey.trim());
}

const SENDER_EMAIL = process.env.RESEND_FROM_EMAIL || 'Blush <onboarding@resend.dev>';

/**
 * Builds clean, responsive HTML for the order confirmation email.
 */
function buildOrderConfirmationHtml({ orderId, customerName, items, subtotal, shippingFee, discount, totalAmount, shippingAddress, city, state, pincode }) {
  const formattedSubtotal = Number(subtotal || 0).toLocaleString('en-IN');
  const formattedShipping = Number(shippingFee || 0) === 0 ? 'FREE' : `₹${Number(shippingFee).toLocaleString('en-IN')}`;
  const formattedTotal = Number(totalAmount || 0).toLocaleString('en-IN');

  const itemRowsHtml = (items || []).map(item => `
    <tr>
      <td style="padding: 12px 8px; border-bottom: 1px solid #f0f0f0;">
        <strong style="color: #1a1a1a;">${escapeHtml(item.product_name || 'Product')}</strong>
        <div style="font-size: 12px; color: #666; margin-top: 4px;">
          ${item.size ? `Size: ${escapeHtml(item.size)}` : ''}
          ${item.color ? `| Color: ${escapeHtml(item.color)}` : ''}
        </div>
      </td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #f0f0f0; text-align: center; color: #555;">
        ${item.quantity}
      </td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #f0f0f0; text-align: right; color: #1a1a1a;">
        ₹${Number(item.price || 0).toLocaleString('en-IN')}
      </td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #f0f0f0; text-align: right; color: #1a1a1a; font-weight: 600;">
        ₹${(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString('en-IN')}
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Order Confirmation - ${orderId}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #faf8f7; color: #2d2d2d;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf8f7; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color: #1a1a1a; padding: 24px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; letter-spacing: 3px; font-weight: 300;">BLUSH</h1>
              <p style="margin: 4px 0 0; color: #d4a373; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Pune • Est. 2014</p>
            </td>
          </tr>

          <!-- Banner -->
          <tr>
            <td style="padding: 30px 30px 20px;">
              <h2 style="margin: 0 0 10px; font-size: 20px; color: #1a1a1a;">Thank you for your order!</h2>
              <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #555;">
                Hello <strong>${escapeHtml(customerName)}</strong>, your order has been successfully placed. We're getting your pieces ready with love and attention to detail.
              </p>
              <div style="background-color: #f9f6f3; padding: 12px 16px; border-radius: 6px; margin-top: 16px; display: inline-block;">
                <span style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Order ID:</span>
                <strong style="font-size: 14px; color: #1a1a1a; margin-left: 6px;">${orderId}</strong>
              </div>
            </td>
          </tr>

          <!-- Items Table -->
          <tr>
            <td style="padding: 10px 30px 20px;">
              <h3 style="margin: 0 0 12px; font-size: 15px; text-transform: uppercase; letter-spacing: 1px; color: #444; border-bottom: 2px solid #1a1a1a; padding-bottom: 6px;">Order Summary</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px;">
                <thead>
                  <tr style="color: #888; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">
                    <th align="left" style="padding-bottom: 8px;">Item</th>
                    <th align="center" style="padding-bottom: 8px;">Qty</th>
                    <th align="right" style="padding-bottom: 8px;">Price</th>
                    <th align="right" style="padding-bottom: 8px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRowsHtml}
                </tbody>
              </table>

              <!-- Totals -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 16px; font-size: 13px;">
                <tr>
                  <td align="right" style="padding: 4px 8px; color: #666;">Subtotal:</td>
                  <td align="right" width="100" style="padding: 4px 0; color: #1a1a1a;">₹${formattedSubtotal}</td>
                </tr>
                <tr>
                  <td align="right" style="padding: 4px 8px; color: #666;">Shipping:</td>
                  <td align="right" width="100" style="padding: 4px 0; color: #1a1a1a;">${formattedShipping}</td>
                </tr>
                ${Number(discount || 0) > 0 ? `
                <tr>
                  <td align="right" style="padding: 4px 8px; color: #2e7d32;">Discount:</td>
                  <td align="right" width="100" style="padding: 4px 0; color: #2e7d32;">-₹${Number(discount).toLocaleString('en-IN')}</td>
                </tr>
                ` : ''}
                <tr>
                  <td align="right" style="padding: 10px 8px 0; border-top: 1px solid #ddd; font-weight: 700; font-size: 15px; color: #1a1a1a;">Total:</td>
                  <td align="right" width="100" style="padding: 10px 0 0; border-top: 1px solid #ddd; font-weight: 700; font-size: 15px; color: #1a1a1a;">₹${formattedTotal}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Shipping Address -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <h3 style="margin: 0 0 10px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #444;">Shipping To</h3>
              <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #555;">
                <strong>${escapeHtml(customerName)}</strong><br>
                ${escapeHtml(shippingAddress)}<br>
                ${escapeHtml(city)}, ${escapeHtml(state)} - ${escapeHtml(pincode)}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f7f5f2; padding: 20px 30px; text-align: center; border-top: 1px solid #eee; font-size: 12px; color: #888;">
              <p style="margin: 0 0 4px;">Blush Fashion Boutique, Pune, Maharashtra, India</p>
              <p style="margin: 0;">Need assistance? Reply directly to this email or visit our store.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Builds plain-text fallback content.
 */
function buildOrderConfirmationText({ orderId, customerName, items, subtotal, shippingFee, totalAmount, shippingAddress, city, state, pincode }) {
  const itemList = (items || []).map(i => `- ${i.product_name} (Qty: ${i.quantity}, Price: ₹${i.price})`).join('\n');
  return `
Thank you for your order, ${customerName}!

Order ID: ${orderId}

Items:
${itemList}

Subtotal: ₹${subtotal}
Shipping: ₹${shippingFee}
Total: ₹${totalAmount}

Shipping Address:
${customerName}
${shippingAddress}
${city}, ${state} - ${pincode}

Blush Fashion Boutique, Pune, Maharashtra, India.
  `.trim();
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sends an order confirmation email to the customer.
 *
 * Safety & Reliability Guarantees:
 * 1. Checks process.env.RESEND_API_KEY. If missing, skips cleanly with log message.
 * 2. Idempotent: Checks sentOrders Set and passes X-Entity-Ref-ID header.
 * 3. Never throws unhandled exceptions; safely catches and logs failures.
 *
 * @param {Object} orderData
 * @returns {Promise<{success: boolean, messageId?: string, skipped?: boolean, error?: string}>}
 */
async function sendOrderConfirmationEmail(orderData) {
  const {
    orderId,
    customerEmail,
    customerName,
    items,
    subtotal,
    shippingFee,
    discount,
    totalAmount,
    shippingAddress,
    city,
    state,
    pincode
  } = orderData;

  if (!orderId || !customerEmail) {
    console.warn('[Email] Skipping confirmation email: missing orderId or customerEmail');
    return { success: false, skipped: true, error: 'Missing required email fields' };
  }

  // Duplicate check
  if (sentOrders.has(orderId)) {
    console.log(`[Email] Confirmation email already sent for order ${orderId}. Skipping duplicate.`);
    return { success: true, skipped: true, reason: 'duplicate' };
  }

  const resend = getResendClient();
  if (!resend) {
    console.warn('[Email] RESEND_API_KEY is not set. Skipping confirmation email.');
    return { success: false, skipped: true, error: 'RESEND_API_KEY not configured' };
  }

  try {
    const htmlContent = buildOrderConfirmationHtml({
      orderId,
      customerName: customerName || 'Valued Customer',
      items: items || [],
      subtotal,
      shippingFee,
      discount,
      totalAmount,
      shippingAddress,
      city,
      state,
      pincode
    });

    const textContent = buildOrderConfirmationText({
      orderId,
      customerName: customerName || 'Valued Customer',
      items: items || [],
      subtotal,
      shippingFee,
      totalAmount,
      shippingAddress,
      city,
      state,
      pincode
    });

    const response = await resend.emails.send({
      from: SENDER_EMAIL,
      to: customerEmail.trim(),
      subject: `Order Confirmation - ${orderId} | Blush Fashion`,
      html: htmlContent,
      text: textContent,
      headers: {
        'X-Entity-Ref-ID': orderId
      }
    });

    if (response.error) {
      console.error(`[Email Error] Resend API error for ${orderId}:`, response.error.message);
      return { success: false, error: response.error.message };
    }

    // Mark as sent to prevent duplicate dispatch
    sentOrders.add(orderId);
    if (sentOrders.size > 10000) {
      const first = sentOrders.values().next().value;
      sentOrders.delete(first);
    }

    console.log(`✓ [Email] Confirmation email dispatched via Resend for order ${orderId} to ${customerEmail} (ID: ${response.data?.id})`);
    return { success: true, messageId: response.data?.id };
  } catch (err) {
    // Crucial: Email failure must NOT crash the app or throw
    console.error(`[Email Error] Failed sending confirmation email for ${orderId}:`, err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  sendOrderConfirmationEmail,
  getResendClient,
  sentOrders
};
