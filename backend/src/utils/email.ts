/**
 * Email 發送工具
 *
 * 使用 Resend API 發送驗證信等系統郵件
 * 環境變數：RESEND_API_KEY（透過 wrangler secret 設定）
 */

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * 透過 Resend API 發送郵件
 */
export async function sendEmail(
  apiKey: string,
  options: SendEmailOptions
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'NobodyClimb <noreply@nobodyclimb.cc>',
        to: [options.to],
        subject: options.subject,
        html: options.html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Resend API error:', response.status, errorData);
      return { success: false, error: `Email sending failed: ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown email error',
    };
  }
}

/**
 * 產生驗證信 HTML 內容
 */
export function buildVerificationEmailHtml(verifyUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;background:#ffffff;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:32px 32px 24px;text-align:center;">
              <h1 style="margin:0 0 8px;font-size:22px;color:#1b1a1a;">驗證你的電子信箱</h1>
              <p style="margin:0;font-size:14px;color:#6d6c6c;">感謝你加入 NobodyClimb！請點擊下方按鈕完成信箱驗證。</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px;text-align:center;">
              <a href="${verifyUrl}" style="display:inline-block;padding:12px 32px;background:#1b1a1a;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
                驗證信箱
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#8e8c8c;">此連結將於 24 小時後失效。如果你沒有註冊 NobodyClimb，請忽略此信。</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * 產生驗證 token（隨機 32 bytes hex）
 */
export function generateVerificationToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
