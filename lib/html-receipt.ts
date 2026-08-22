import { formatPrice } from './utils';

export function generateHTMLReceipt(order: any, user: any): string {
  const status = String(order.status || 'pending').toLowerCase();
  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
  };
  const escapeHtml = (value: unknown) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt - ${order.orderNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: A5 portrait; margin: 0; }
    body {
      font-family: Arial, sans-serif;
      width: 148mm;
      min-height: 210mm;
      padding: 12mm;
      margin: 0 auto;
      background: white;
      color: #333;
      font-size: 11px;
    }
    .header { text-align: center; margin-bottom: 14px; }
    .logo { width: 52px; height: 52px; object-fit: contain; vertical-align: middle; }
    .header h1 { color: #276749; font-size: 24px; margin: 5px 0 2px; }
    .header p { color: #666; font-size: 10px; }
    .receipt-title {
      text-align: center; 
      font-size: 17px;
      font-weight: bold; 
      margin: 10px 0;
      padding: 7px;
      background: #edf7ed;
      color: #276749;
    }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .info-section { margin: 12px 0; }
    .info-section h2 { 
      font-size: 11px;
      font-weight: bold; 
      margin-bottom: 5px;
      border-bottom: 1px solid #276749;
      padding-bottom: 3px;
    }
    .info-section p { 
      margin: 5px 0; 
      line-height: 1.4;
      font-size: 10px;
    }
    .items-table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 14px 0;
    }
    .items-table th { 
      background: #f5f5f5; 
      padding: 6px 4px;
      text-align: left; 
      font-weight: bold;
      border-bottom: 2px solid #ddd;
    }
    .items-table td { 
      padding: 6px 4px;
      border-bottom: 1px solid #eee;
    }
    .items-table tr:hover { background: #fafafa; }
    .summary { 
      margin-top: 12px;
      border-top: 2px solid #ddd;
      padding-top: 8px;
    }
    .summary-row { 
      display: flex; 
      justify-content: space-between; 
      padding: 4px 0;
      font-size: 11px;
    }
    .summary-row.total { 
      font-size: 15px;
      font-weight: bold; 
      border-top: 2px solid #333;
      margin-top: 10px;
      padding-top: 8px;
    }
    .footer { 
      text-align: center; 
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #ddd;
      color: #666;
      font-size: 12px;
    }
    .verified { 
      display: inline-block;
      background: #22c55e;
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      margin-left: 5px;
    }
    .pending { 
      display: inline-block;
      background: #eab308;
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      margin-left: 5px;
    }
    .status { display: inline-block; padding: 4px 10px; border-radius: 999px; font-weight: bold; color: white; background: #d97706; }
    .status.confirmed, .status.processing { background: #2563eb; }
    .status.shipped { background: #7c3aed; }
    .status.delivered { background: #15803d; }
    .status.cancelled, .status.refunded { background: #b91c1c; }
    @media print {
      body { width: 148mm; min-height: 210mm; padding: 12mm; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <img class="logo" src="/logo.png" alt="Edau Farm logo">
    <h1>EDAU FARM</h1>
    <p>West Pokot's Premier Sustainable Farm</p>
  </div>

  <div class="receipt-title">ORDER RECEIPT</div>

  <p style="text-align:center; margin: 8px 0;"><strong>Order status:</strong> <span class="status ${escapeHtml(status)}">${escapeHtml(statusLabels[status] || status)}</span></p>

  <div class="info-section">
    <h2>Order Information</h2>
    <p><strong>Order Number:</strong> ${escapeHtml(order.orderNumber)}</p>
    <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString('en-KE', { dateStyle: 'long', timeStyle: 'short' })}</p>
    <p><strong>Payment Method:</strong> ${escapeHtml(String(order.paymentMethod || 'N/A').toUpperCase())}</p>
    ${order.mpesaCode ? `<p><strong>M-Pesa Code:</strong> ${escapeHtml(order.mpesaCode)}</p>` : ''}
    <p><strong>Payment Status:</strong> ${order.mpesaVerified ? '<span class="verified">Verified ✓</span>' : '<span class="pending">Pending Verification</span>'}</p>
  </div>

  <div class="info-section">
    <h2>Customer Information</h2>
    <p><strong>Name:</strong> ${escapeHtml(user.name || 'N/A')}</p>
    <p><strong>Email:</strong> ${escapeHtml(user.email || 'N/A')}</p>
    <p><strong>Phone:</strong> ${escapeHtml(order.shippingAddress.phone)}</p>
  </div>

  <div class="info-section">
    <h2>Shipping Address</h2>
    <p>${escapeHtml(order.shippingAddress.fullName)}</p>
    <p>${escapeHtml(order.shippingAddress.address)}</p>
    <p>${escapeHtml(order.shippingAddress.city)}, ${escapeHtml(order.shippingAddress.county)}</p>
    ${order.shippingAddress.postalCode ? `<p>Postal Code: ${escapeHtml(order.shippingAddress.postalCode)}</p>` : ''}
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th>Item</th>
        <th style="text-align: center;">Quantity</th>
        <th style="text-align: right;">Price</th>
        <th style="text-align: right;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${order.items.map((item: any) => `
        <tr>
          <td>${escapeHtml(item.title)}</td>
          <td style="text-align: center;">${escapeHtml(item.quantity)}</td>
          <td style="text-align: right;">${formatPrice(item.price)}</td>
          <td style="text-align: right;">${formatPrice(item.price * item.quantity)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="summary">
    <div class="summary-row">
      <span>Subtotal:</span>
      <span>${formatPrice(order.subtotal)}</span>
    </div>
    <div class="summary-row">
      <span>Shipping:</span>
      <span>${order.shipping === 0 ? 'FREE' : formatPrice(order.shipping)}</span>
    </div>
    <div class="summary-row">
      <span>VAT (16%):</span>
      <span>${formatPrice(order.tax)}</span>
    </div>
    <div class="summary-row total">
      <span>TOTAL:</span>
      <span>${formatPrice(order.total)}</span>
    </div>
  </div>

  <div class="footer">
    <p>Thank you for shopping with Edau Farm!</p>
    <p>For support, contact us at support@updates.loopnet.tech | +254 727 690 165</p>
    <p style="margin-top: 10px;" class="no-print">
      <button onclick="window.print()" style="background: #f68b1e; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 14px;">Print Receipt</button>
    </p>
  </div>
</body>
</html>
  `;
}
