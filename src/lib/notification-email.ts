/**
 * Email notification service using Resend API
 * 
 * This module handles sending email notifications based on user preferences.
 * It integrates with the existing /api/email endpoint.
 */

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send an email notification
 * Uses the internal API route which uses Resend
 */
async function sendEmail({ to, subject, html }: EmailParams): Promise<boolean> {
  try {
    const response = await fetch("/api/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, html }),
    });

    const result = await response.json();
    
    if (result.error) {
      console.error("Email error:", result.error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

/**
 * Generate HTML for notification email based on type
 */
function generateEmailHtml(
  notificationType: string,
  title: string,
  message: string,
  data: Record<string, any>
): string {
  const getIconAndColor = (type: string) => {
    switch (type) {
      case "payment_received":
        return { icon: "💰", color: "#22C55E", bg: "#DCFCE7" };
      case "payment_overdue":
        return { icon: "⚠️", color: "#EF4444", bg: "#FEE2E2" };
      case "loan_created":
        return { icon: "📝", color: "#3B82F6", bg: "#DBEAFE" };
      case "loan_approved":
        return { icon: "✅", color: "#22C55E", bg: "#DCFCE7" };
      case "loan_rejected":
        return { icon: "❌", color: "#EF4444", bg: "#FEE2E2" };
      case "customer_created":
        return { icon: "👤", color: "#8B5CF6", bg: "#EDE9FE" };
      case "new_user":
        return { icon: "🆕", color: "#F59E0B", bg: "#FEF3C7" };
      case "reminder_sent":
        return { icon: "⏰", color: "#F59E0B", bg: "#FEF3C7" };
      default:
        return { icon: "🔔", color: "#6B7280", bg: "#F3F4F6" };
    }
  };

  const { icon, color, bg } = getIconAndColor(notificationType);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f9fa; padding: 20px;">
  <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #1E3A8A; font-size: 28px; margin: 0;">AXION<span style="color: #22C55E;">Cred</span></h1>
      <p style="color: #6b7280; margin-top: 8px;">Sistema de Gestão de Crédito</p>
    </div>

    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 64px; height: 64px; background: ${bg}; border-radius: 50%; line-height: 64px; font-size: 32px;">
        ${icon}
      </div>
    </div>

    <h2 style="color: ${color}; margin-bottom: 16px; text-align: center;">
      ${title}
    </h2>

    <p style="color: #374151; line-height: 1.6; text-align: center; font-size: 16px;">
      ${message}
    </p>

    ${data.customerName || data.amount || data.daysLate ? `
    <div style="background: #F9FAFB; border-radius: 8px; padding: 16px; margin: 20px 0;">
      ${data.amount ? `
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #6B7280;">Valor:</span>
        <span style="color: #111827; font-weight: 600;">R$ ${Number(data.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
      </div>
      ` : ""}
      ${data.daysLate ? `
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #6B7280;">Dias em atraso:</span>
        <span style="color: #EF4444; font-weight: 600;">${data.daysLate} dia${data.daysLate > 1 ? "s" : ""}</span>
      </div>
      ` : ""}
      ${data.customerName ? `
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #6B7280;">Cliente:</span>
        <span style="color: #111827; font-weight: 600;">${data.customerName}</span>
      </div>
      ` : ""}
    </div>
    ` : ""}

    <div style="text-align: center; margin-top: 24px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard" 
         style="display: inline-block; background: #22C55E; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
        Acessar Dashboard
      </a>
    </div>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

    <p style="color: #9ca3af; font-size: 12px; text-align: center;">
      © ${new Date().getFullYear()} AXION Cred. Todos os direitos reservados.
    </p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send notification email to a user
 */
export async function sendNotificationEmail(
  userEmail: string,
  notificationType: string,
  title: string,
  message: string,
  data: Record<string, any> = {}
): Promise<boolean> {
  const html = generateEmailHtml(notificationType, title, message, data);
  return sendEmail({ to: userEmail, subject: title, html });
}
