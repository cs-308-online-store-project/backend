const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const knex = require('../db/knex'); 

const invoicesDir = path.join(__dirname, '../../invoices');

// Invoices klasörünü oluştur
if (!fs.existsSync(invoicesDir)) {
  fs.mkdirSync(invoicesDir, { recursive: true });
}

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// PDF Generate & Email
exports.generateAndEmailInvoice = async (req, res) => {
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

    // 2. User bilgisini al
    const user = await knex('users').where({ id: userId }).first();

    // 3. Order items al
    const orderItems = await knex('order_items as oi')
      .join('products as p', 'oi.product_id', 'p.id')
      .where('oi.order_id', orderId)
      .select('p.name', 'oi.quantity', 'oi.price');

    // 4. PDF oluştur - UTF-8 encoding ile
    const doc = new PDFDocument({ 
      margin: 50,
      bufferPages: true
    });

    const arialPath = '/System/Library/Fonts/Supplemental/Arial.ttf';
    if (fs.existsSync(arialPath)) {
      doc.registerFont('Arial', arialPath);
      doc.font('Arial');
    } else {
      // Fallback to Helvetica
      doc.font('Helvetica');
    }

    const filename = `invoice_${orderId}_${Date.now()}.pdf`;
    const filepath = path.join(invoicesDir, filename);
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
    doc.text(`Date: ${new Date(order.created_at).toLocaleDateString('en-US')}`);
    doc.text(`Status: ${order.status.toUpperCase()}`);
    doc.moveDown();

    // Shipping address - Türkçe karakterler burada olabilir
    doc.fontSize(12).text('Shipping Address:', { underline: true });
    doc.fontSize(10).text(order.address || 'Not specified');
    doc.moveDown();

    // Items table
    doc.fontSize(12).text('Items:', { underline: true });
    doc.moveDown(0.5);

    let y = doc.y;
    doc.fontSize(10);
    doc.text('Product', 50, y);
    doc.text('Qty', 300, y);
    doc.text('Price', 370, y);
    doc.text('Total', 470, y);
    
    y += 20;
    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 10;

    // Items - Ürün isimleri Türkçe olabilir
    orderItems.forEach((item) => {
      doc.text(item.name, 50, y, { width: 240 });
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
    doc.text('TOTAL:', 370, y);
    doc.text(`$${Number(order.total_price).toFixed(2)}`, 470, y);

    // Footer
    doc.moveDown(3);
    doc.fontSize(10).text('Thank you for shopping with Urban Threads!', { align: 'center' });

    doc.end();

    // 5. PDF oluştuktan sonra email gönder
    writeStream.on('finish', async () => {
      try {
        // Email gönder
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: `Urban Threads - Invoice #${orderId}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Hello ${user.username || user.email},</h2>
              <p>Your invoice for order <strong>#${orderId}</strong> is ready!</p>
              <p>You can find the invoice attached to this email.</p>
              <br>
              <p>Thank you for shopping with us!</p>
              <p><strong>Urban Threads Team</strong></p>
            </div>
          `,
          attachments: [{
            filename: filename,
            path: filepath
          }]
        });

        // Database'e kaydet
        await knex('orders')
          .where({ id: orderId })
          .update({ invoice_pdf: filename });

        res.json({ 
          success: true, 
          message: 'Invoice has been sent to your email!',
          filename 
        });

      } catch (emailError) {
        console.error('Email sending error:', emailError);
        res.status(500).json({ 
          message: 'Invoice generated but could not be sent via email',
          error: emailError.message 
        });
      }
    });

  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ 
      message: 'Failed to generate invoice',
      error: error.message 
    });
  }
};