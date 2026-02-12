const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

let browserPromise = null;

// Launch or return existing browser (singleton)
async function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      // headless: "new" or true depending on puppeteer version
      headless: true,
    });
    // if the browser fails to launch, clear promise so next call can retry
    browserPromise.catch(() => (browserPromise = null));
  }
  return browserPromise;
}

function invoiceHtmlTemplate(order, options = {}) {
  // options.logoDataUri can be a data URI for a logo
  const logo = options.logoDataUri
    ? `<img src="${options.logoDataUri}" style="height:60px;" />`
    : `<div style="font-weight:700; font-size:18px;">${
        options.companyName || "Your Company"
      }</div>`;
  const itemsRows = order.items
    .map(
      (i) => `
    <tr>
      <td style="padding:8px 4px;">${escapeHtml(i.name)}</td>
      <td style="padding:8px 4px; text-align:right;">${i.qty}</td>
      <td style="padding:8px 4px; text-align:right;">${Number(i.rate).toFixed(
        2
      )}</td>
      <td style="padding:8px 4px; text-align:right;">${(i.qty * i.rate).toFixed(
        2
      )}</td>
    </tr>
  `
    )
    .join("");

  return `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8"/>
    <title>Invoice ${order.invoiceNumber}</title>
    <style>
      body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 24px; color: #222; font-size: 12px; }
      .header { display:flex; justify-content:space-between; align-items:center; }
      .company-block { text-align:left; }
      .invoice-meta { text-align:right; }
      .invoice-box { margin-top:16px; border: 1px solid #e6e6e6; padding:16px; }
      table { width:100%; border-collapse:collapse; margin-top:12px; }
      th, td { padding:8px; border-bottom:1px solid #f0f0f0; }
      th { text-align:left; font-weight:600; }
      .right { text-align:right; }
      .totals { width:300px; margin-left:auto; margin-top:12px; }
      .small { font-size:11px; color:#666; }
      .footer { margin-top:20px; font-size:11px; color:#666; text-align:center; }
      @media print {
        body { -webkit-print-color-adjust: exact; }
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="company-block">
        ${logo}
        <div class="small">${escapeHtml(
          options.companyAddress || "Company address line 1"
        )}<br/>${escapeHtml(options.companyAddress2 || "")}</div>
      </div>
      <div class="invoice-meta">
        <div style="font-size:18px; font-weight:700;">Invoice</div>
        <div>#: ${escapeHtml(order.invoiceNumber)}</div>
        <div class="small">Date: ${escapeHtml(order.date)}</div>
      </div>
    </div>

    <div class="invoice-box">
      <div style="display:flex; justify-content:space-between;">
        <div>
          <div style="font-weight:600;">Bill To:</div>
          <div>${escapeHtml(order.customer.name || "")}</div>
          <div class="small">${escapeHtml(order.customer.email || "")}</div>
        </div>
        <div style="text-align:right;">
          <div class="small">Order ID</div>
          <div style="font-weight:600;">${escapeHtml(order.orderId || "")}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width:55%;">Item</th>
            <th style="width:15%;" class="right">Qty</th>
            <th style="width:15%;" class="right">Rate</th>
            <th style="width:15%;" class="right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <div class="totals">
        <div style="display:flex; justify-content:space-between;"><div>Subtotal</div><div>${order.subtotal.toFixed(
          2
        )}</div></div>
        <div style="display:flex; justify-content:space-between;"><div>Tax</div><div>${order.tax.toFixed(
          2
        )}</div></div>
        <div style="display:flex; justify-content:space-between; margin-top:8px; font-weight:700;"><div>Total</div><div>${order.total.toFixed(
          2
        )}</div></div>
      </div>

      <div style="margin-top:16px;" class="small">
        ${escapeHtml(options.paymentNote || "Payment is due within 15 days.")}
      </div>
    </div>

    <div class="footer">
      ${escapeHtml(options.footerText || "Thank you for your business.")}
    </div>
  </body>
  </html>
  `;
}

// Basic HTML escaping
function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * generateInvoicePdf(order, options)
 * - order: { orderId, invoiceNumber, date, customer:{name,email,phone}, items:[{name,qty,rate}], subtotal, tax, total }
 * - options: { format, margin, landscape, logoDataUri, companyName, companyAddress... }
 *
 * returns: Buffer (PDF)
 */
async function generateInvoicePdf(order, options = {}) {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    const html = invoiceHtmlTemplate(order, options);
    await page.setContent(html, { waitUntil: "networkidle0" });
    // Optional: set media type to print for CSS print rules
    await page.emulateMediaType("screen");

    const pdfOptions = {
      format: options.format || "A4",
      printBackground: true,
      margin: options.margin || {
        top: "20mm",
        bottom: "20mm",
        left: "12mm",
        right: "12mm",
      },
    };

    const buffer = await page.pdf(pdfOptions);
    await page.close();
    return buffer;
  } catch (err) {
    // ensure page closed on error
    try {
      await page.close();
    } catch (_) {}
    throw err;
  }
}

// Graceful shutdown helper - call on process exit
async function closeBrowser() {
  if (browserPromise) {
    try {
      const b = await browserPromise;
      await b.close();
    } catch (_) {}
    browserPromise = null;
  }
}

function makeInvoiceNumber() {
  const ts = Date.now().toString();
  return `INV-${ts.slice(-10)}`;
}

function calculateTotals(order) {
  const subtotal = (order.items || []).reduce(
    (s, it) => s + Number(it.qty) * Number(it.rate),
    0
  );
  const tax = order.taxPercent
    ? (subtotal * order.taxPercent) / 100
    : order.tax || 0;
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

module.exports.createInvoice = async (req, res) => {
  try {
    // Example payload shape: { order: { orderId, customerName, customerEmail, items: [], taxPercent } }
    const payload = req.body;
    const orderPayload = payload.order || payload;

    const order = {
      orderId: orderPayload.orderId || orderPayload.id || "",
      invoiceNumber: makeInvoiceNumber(),
      date: new Date().toISOString().slice(0, 10),
      customer: {
        name:
          orderPayload.customerName ||
          orderPayload.customer?.name ||
          "Niraj sanjay Patil",
        email:
          orderPayload.customerEmail ||
          orderPayload.customer?.email ||
          "dev.nirajpatil@gmail.com",
        phone: orderPayload.customerPhone || "+91 8485090521",
      },
      items: orderPayload.items || [
        {
          name: "Reshimgathi Maratha Matrimony Gold Membership",
          qty: 1,
          rate: 5000,
        },
      ],
      taxPercent: orderPayload.taxPercent || 18,
    };

    const totals = calculateTotals(order);
    order.subtotal = totals.subtotal;
    order.tax = totals.tax;
    order.total = totals.total;

    // options: you can pass logo data URI and other texts
    const options = {
      companyName: process.env.COMPANY_NAME || "My Company",
      companyAddress: process.env.COMPANY_ADDRESS || "Address line 1, City",
      footerText: process.env.FOOTER_TEXT || "Thank you for your business.",
      // logoDataUri: 'data:image/png;base64,...' if you have logo
    };

    const pdfBuffer = await generateInvoicePdf(order, options);

    // Example A: save to local disk (ensure directory exists)
    const outDir = path.join(__dirname, "invoices");
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const filename = `${order.invoiceNumber}.pdf`;
    fs.writeFileSync(path.join(outDir, filename), pdfBuffer);

    // Example B: upload to S3 (uncomment if configured)
    // const s3Key = `invoices/${filename}`;
    // const s3Uri = await uploadPdfBufferToS3(pdfBuffer, s3Key);

    // Return PDF to caller for immediate download (optional)
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Error creating invoice", err);
    res
      .status(500)
      .json({ error: "Invoice generation failed", message: err.message });
  }
};

// graceful shutdown: close puppeteer browser
process.on("SIGINT", async () => {
  console.log("Shutting down...");
  await closeBrowser();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  console.log("Shutting down...");
  await closeBrowser();
  process.exit(0);
});
