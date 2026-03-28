const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: Number(process.env.EMAIL_PORT) === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  if (process.env.NODE_ENV === 'test') return;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'StreamForge <noreply@streamforge.com>',
    to,
    subject,
    html,
  });
};

const withLayout = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>StreamForge</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width: 560px; margin: 40px auto; background-color: #1e293b; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 28px 32px; }
    .header-title { color: #fff; font-size: 22px; font-weight: 700; margin: 0; }
    .body { padding: 28px 32px; color: #cbd5e1; font-size: 15px; line-height: 1.6; }
    .highlight { color: #a5b4fc; font-weight: 600; }
    .quote { background-color: #0f172a; border-left: 3px solid #4f46e5; border-radius: 6px; padding: 12px 16px; margin: 16px 0; font-size: 14px; color: #94a3b8; font-style: italic; }
    .footer { padding: 18px 32px; text-align: center; font-size: 12px; color: #475569; border-top: 1px solid #334155; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header"><p class="header-title">StreamForge</p></div>
    <div class="body">${content}</div>
    <div class="footer">You received this email because you have notifications enabled on StreamForge.</div>
  </div>
</body>
</html>
`;

const sendNewSubscriberEmail = async (creatorEmail, subscriberUsername) => {
  const html = withLayout(`
    <p>Great news! <span class="highlight">${subscriberUsername}</span> just subscribed to your channel.</p>
    <p>Keep creating great content to grow your audience on StreamForge.</p>
  `);
  await sendEmail({ to: creatorEmail, subject: `${subscriberUsername} subscribed to your channel!`, html });
};

const sendNewCommentEmail = async (videoOwnerEmail, commenterUsername, videoTitle, commentText) => {
  const html = withLayout(`
    <p><span class="highlight">${commenterUsername}</span> left a comment on your video
    <span class="highlight">"${videoTitle}"</span>:</p>
    <div class="quote">${commentText}</div>
    <p>Head over to StreamForge to reply and keep the conversation going.</p>
  `);
  await sendEmail({ to: videoOwnerEmail, subject: `New comment on "${videoTitle}"`, html });
};

const sendCommentReplyEmail = async (originalCommenterEmail, replierUsername, videoTitle) => {
  const html = withLayout(`
    <p><span class="highlight">${replierUsername}</span> replied to your comment on
    <span class="highlight">"${videoTitle}"</span>.</p>
    <p>Jump back to StreamForge to see what they said.</p>
  `);
  await sendEmail({ to: originalCommenterEmail, subject: `${replierUsername} replied to your comment`, html });
};

module.exports = { sendEmail, sendNewSubscriberEmail, sendNewCommentEmail, sendCommentReplyEmail };
