// backend/src/controllers/invoice.controller.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const knex = require('../db/knex');

// Invoice klasörünü oluştur (yoksa)
const invoicesDir = path.join(__dirname, '../../invoices');
if (!fs.existsSync(invoicesDir)) {
  fs.mkdirSync(invoicesDir, { recursive: true });
}

// PDF Invoice oluştur
exports.generateInvoice = async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user?.id || req.user?.sub;

  try {
    // 1. Order'ı al
    const order = await knex('orders')
      .where({ id: orderId, user_id: userId })
      .first();

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // 2. Order items al
    const orderItems = await knex('order_items as oi')
      .join('products as p', 'oi.product_id', 'p.id')
      .where('oi.order_id', orderId)
      .select('p.name', 'oi.quantity', 'oi.price');

    // 3. PDF oluştur
    const doc = new PDFDocument({ margin: 50 });
    const filename = `invoice_${orderId}_${Date.now()}.pdf`;
    const filepath = path.join(invoicesDir, filename);

    // File stream
    const writeStream = fs.createWriteStream(filepath);
    doc.pipe(writeStream);

    // Header
    doc.fontSize(25).text('URBAN THREADS', { align: 'center' });
    doc.fontSize(10).text('Premium Clothing for Modern Life', { align: 'center' });
    doc.moveDown();

    // Invoice title
    doc.fontSize(20).text('INVOICE', { align: 'center' });
    doc.moveDown();

    // Order info
    doc.fontSize(12);
    doc.text(`Order Number: #${order.id}`);
    doc.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`);
    doc.text(`Status: ${order.status.toUpperCase()}`);
    doc.moveDown();

    // Shipping address
    doc.fontSize(12).text('Shipping Address:', { underline: true });
    doc.fontSize(10).text(order.address);
    doc.moveDown();

    // Items table header
    doc.fontSize(12).text('Items:', { underline: true });
    doc.moveDown(0.5);

    // Table
    let y = doc.y;
    doc.fontSize(10);
    doc.text('Product', 50, y);
    doc.text('Qty', 300, y);
    doc.text('Price', 370, y);
    doc.text('Total', 470, y);
    
    y += 20;
    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 10;

    // Items
    orderItems.forEach((item) => {
      doc.text(item.name, 50, y);
      doc.text(item.quantity.toString(), 300, y);
      doc.text(`$${Number(item.price).toFixed(2)}`, 370, y);
      doc.text(`$${(Number(item.price) * item.quantity).toFixed(2)}`, 470, y);
      y += 20;
    });

    // Total
    y += 10;
    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 15;
    doc.fontSize(12);
    doc.text('TOTAL:', 370, y, { bold: true });
    doc.text(`$${Number(order.total_price).toFixed(2)}`, 470, y, { bold: true });

    // Footer
    doc.moveDown(3);
    doc.fontSize(10).text('Thank you for shopping with Urban Threads!', { align: 'center' });

    // Finalize PDF
    doc.end();

    // ✅ YENİ - Promise ile bekle
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    // Database'i güncelle (await ile)
    await knex('orders')
      .where({ id: orderId })
      .update({ invoice_pdf: filename });

    console.log(`✅ Invoice generated: ${filename}`);

    res.json({ 
      success: true, 
      message: 'Invoice generated',
      filename 
    });

  } catch (error) {
    console.error('❌ Error generating invoice:', error);
    res.status(500).json({ message: 'Failed to generate invoice' });
  }
};

// PDF Download
exports.downloadInvoice = async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user?.id || req.user?.sub;

  try {
    const order = await knex('orders')
      .where({ id: orderId, user_id: userId })
      .first();

    if (!order || !order.invoice_pdf) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const filepath = path.join(invoicesDir, order.invoice_pdf);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ message: 'Invoice file not found' });
    }

    res.download(filepath);
  } catch (error) {
    console.error('Error downloading invoice:', error);
    res.status(500).json({ message: 'Failed to download invoice' });
  }
};