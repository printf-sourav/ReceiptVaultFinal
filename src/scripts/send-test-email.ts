import "dotenv/config";
import nodemailer from "nodemailer";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function main() {
  const smtpUser = requireEnv("TEST_SMTP_USER");
  const smtpPass = requireEnv("TEST_SMTP_APP_PASSWORD");
  const toEmail = requireEnv("TEST_EMAIL_TO");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const subject = process.env.TEST_EMAIL_SUBJECT || "Order confirmation: Sunrise Mart";
  const body = process.env.TEST_EMAIL_BODY || [
    "SUNRISE MART",
    "Order Confirmation",
    "Receipt #A10293",
    "Date: 2026-05-07",
    "",
    "Milk 2 x 45.00 = 90.00",
    "Bread 1 x 35.00 = 35.00",
    "Bananas 6 x 8.00 = 48.00",
    "",
    "Total INR 188.57",
    "Return window: 7 days",
  ].join("\n");

  const result = await transporter.sendMail({
    from: smtpUser,
    to: toEmail,
    subject,
    text: body,
  });

  console.log(`Test email sent: ${result.messageId}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});