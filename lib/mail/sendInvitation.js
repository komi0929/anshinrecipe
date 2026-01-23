/**
 * Email Sending Module for Owner Invitations
 *
 * Supports multiple providers: Resend, SendGrid, or console logging (dev mode)
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * Send owner invitation email
 * @param {string} to - Recipient email
 * @param {string} restaurantName - Restaurant name
 * @param {string} token - Invitation token
 * @param {string} inviterName - Name of person who requested the invitation
 */
export async function sendOwnerInvitation(
  to,
  restaurantName,
  token,
  inviterName = "ユーザー",
) {
  const inviteUrl = `${APP_URL}/owner/accept?token=${token}`;

  const subject = `【${restaurantName}】あんしんマップへのご招待`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: white; border-radius: 24px; padding: 40px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    .logo { text-align: center; margin-bottom: 32px; }
    .logo-text { font-size: 24px; font-weight: 800; color: #f97316; }
    h1 { font-size: 22px; font-weight: 700; color: #1e293b; margin: 0 0 16px; }
    p { font-size: 15px; color: #64748b; line-height: 1.7; margin: 0 0 16px; }
    .highlight { background: linear-gradient(135deg, #fff7ed, #ffedd5); border-radius: 16px; padding: 20px; margin: 24px 0; }
    .highlight-title { font-weight: 700; color: #c2410c; font-size: 14px; margin-bottom: 8px; }
    .restaurant-name { font-size: 18px; font-weight: 700; color: #1e293b; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #f97316, #ea580c); color: white; font-weight: 700; font-size: 16px; padding: 16px 32px; border-radius: 12px; text-decoration: none; margin: 24px 0; }
    .benefits { background: #f8fafc; border-radius: 16px; padding: 20px; margin: 24px 0; }
    .benefit-item { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .benefit-icon { width: 24px; height: 24px; background: #dbeafe; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; }
    .benefit-text { font-size: 14px; color: #475569; }
    .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #94a3b8; }
    .expire-note { font-size: 13px; color: #94a3b8; text-align: center; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <div class="logo-text">🍽️ あんしんマップ</div>
      </div>

      <h1>オーナー様へのご招待</h1>

      <p>
        ${inviterName}様より、貴店の情報充実のリクエストがありました。
        あんしんマップでオーナー登録をして、正確な情報を掲載しませんか？
      </p>

      <div class="highlight">
        <div class="highlight-title">対象店舗</div>
        <div class="restaurant-name">${restaurantName}</div>
      </div>

      <div class="benefits">
        <div class="benefit-item">
          <div class="benefit-icon">✓</div>
          <div class="benefit-text">公認バッチが付与され、信頼性がアップ</div>
        </div>
        <div class="benefit-item">
          <div class="benefit-icon">✓</div>
          <div class="benefit-text">メニュー・アレルギー情報を自由に編集</div>
        </div>
        <div class="benefit-item">
          <div class="benefit-icon">✓</div>
          <div class="benefit-text">マップ上で優先表示</div>
        </div>
        <div class="benefit-item">
          <div class="benefit-icon">✓</div>
          <div class="benefit-text">完全無料でご利用可能</div>
        </div>
      </div>

      <div style="text-align: center;">
        <a href="${inviteUrl}" class="cta-button">
          今すぐ無料で登録する
        </a>
      </div>

      <p class="expire-note">
        ※ このリンクは7日間有効です
      </p>
    </div>

    <div class="footer">
      <p>このメールはあんしんマップから自動送信されています。</p>
      <p>心当たりがない場合は、このメールを無視してください。</p>
    </div>
  </div>
</body>
</html>
  `;

  const textContent = `
【${restaurantName}】あんしんマップへのご招待

${inviterName}様より、貴店の情報充実のリクエストがありました。

あんしんマップでオーナー登録をして、正確な情報を掲載しませんか？

▼ 今すぐ登録（無料）
${inviteUrl}

【オーナー登録のメリット】
✓ 公認バッチが付与され、信頼性がアップ
✓ メニュー・アレルギー情報を自由に編集
✓ マップ上で優先表示
✓ 完全無料でご利用可能

※ このリンクは7日間有効です

---
このメールはあんしんマップから自動送信されています。
心当たりがない場合は、このメールを無視してください。
  `;

  // Try Resend first
  if (RESEND_API_KEY) {
    return sendViaResend(to, subject, htmlContent, textContent);
  }

  // Try SendGrid
  if (SENDGRID_API_KEY) {
    return sendViaSendGrid(to, subject, htmlContent, textContent);
  }

  // Dev mode: Log to console
  console.log("[Email] Development mode - logging email:");
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Invite URL: ${inviteUrl}`);
  return { success: true, mode: "dev", message: "Email logged to console" };
}

/**
 * Send via Resend
 */
async function sendViaResend(to, subject, html, text) {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "あんしんマップ <noreply@anshin-map.jp>",
        to: [to],
        subject,
        html,
        text,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to send email");
    }

    return { success: true, provider: "resend", id: data.id };
  } catch (error) {
    console.error("[Email] Resend error:", error);
    throw error;
  }
}

/**
 * Send via SendGrid
 */
async function sendViaSendGrid(to, subject, html, text) {
  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: "noreply@anshin-map.jp", name: "あんしんマップ" },
        subject,
        content: [
          { type: "text/plain", value: text },
          { type: "text/html", value: html },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SendGrid error: ${errorText}`);
    }

    return { success: true, provider: "sendgrid" };
  } catch (error) {
    console.error("[Email] SendGrid error:", error);
    throw error;
  }
}

/**
 * Generate secure random token for invitation
 */
export function generateInviteToken() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
