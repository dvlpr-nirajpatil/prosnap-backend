const fs = require("fs-extra");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");
const { PutObjectCommand } = require("@aws-sdk/client-s3");

const s3Client = require("../config/aws");

/**
 * Generate Invoice PDF & upload to S3
 * @param {Object} data
 * @returns {Promise<string>} S3 file URL
 */
async function generateInvoicePDF(data) {
  if (!data?.invoiceNumber) {
    throw new Error("invoiceNumber is required");
  }

  const templatePath = path.join(__dirname, "../templates/invoice.html");

  // 1️⃣ Compile HTML
  const html = await fs.readFile(templatePath, "utf8");
  const template = Handlebars.compile(html);
  const finalHtml = template(data);

  // 2️⃣ Puppeteer
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setContent(finalHtml, {
    waitUntil: "networkidle0",
  });

  // 3️⃣ Generate PDF buffer
  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    // margin: {
    //   top: "20mm",
    //   bottom: "20mm",
    //   left: "5mm",
    //   right: "5mm",
    // },
  });

  await browser.close();

  // 4️⃣ Upload to S3 (SDK v3)
  const key = `invoices/${data.invoiceNumber}.pdf`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      Body: pdfBuffer,
      ContentType: "application/pdf",
    })
  );

  // 5️⃣ Return public URL
  return `https://cdn.reshimgathimarathamatrimony.com/${key}`;
}

module.exports = {
  generateInvoicePDF,
};
