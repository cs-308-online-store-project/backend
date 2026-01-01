const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendRefundApprovedEmail = async ({ to, amount }) => {
  await transporter.sendMail({
    from: `"Urban Threads" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Refund Approved",
    html: `
      <h2>Refund Approved</h2>
      <p>Your refund has been approved.</p>
      <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
      <p>The amount has been returned to your original payment method.</p>
    `,
  });
};
