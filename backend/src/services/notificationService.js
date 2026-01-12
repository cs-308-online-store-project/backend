const knex = require('../db/knex');
const nodemailer = require('nodemailer');

const hasEmailConfig = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);
const transporter = hasEmailConfig
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
  : null;

class NotificationService {
  static async notifyDiscount({ userIds, productId, productName, discountRate }) {
    if (!userIds || userIds.length === 0) return { inserted: 0 };

    const title = 'Discount Alert';
    const message = `${productName} is now ${discountRate}% off.`;

    const rows = userIds.map((uid) => ({
      user_id: uid,
      type: 'DISCOUNT',
      title,
      message,
      data: JSON.stringify({ productId, discountRate, productName }),
      is_read: false,
      created_at: knex.fn.now(),
    }));

    await knex('notifications').insert(rows);

    let emailed = 0;
    if (transporter) {
      const users = await knex('users')
        .whereIn('id', userIds)
        .select('email', 'username');

      const mailResults = await Promise.allSettled(
        users
          .filter((user) => Boolean(user.email))
          .map((user) =>
            transporter.sendMail({
              from: `"Urban Threads" <${process.env.EMAIL_USER}>`,
              to: user.email,
              subject: `Discount on ${productName}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #333;">Hello ${user.username || user.email},</h2>
                  <p>${productName} is now <strong>${discountRate}% off</strong>.</p>
                  <p>Check the product detail page for the latest price.</p>
                  <br>
                  <p>Thanks for shopping with us!</p>
                  <p><strong>Urban Threads Team</strong></p>
                </div>
              `,
            })
          )
      );

      emailed = mailResults.filter((result) => result.status === 'fulfilled').length;
    } else {
      console.warn('DISCOUNT_EMAIL_SKIPPED', {
        reason: 'EMAIL_USER/EMAIL_PASS not configured',
      });
    }

    console.log('NOTIFY_DISCOUNT', {
      productId,
      discountRate,
      userCount: userIds.length,
      emailed,
    });
    return { inserted: rows.length, emailed };
  }
}

module.exports = NotificationService;
