import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

// Configure transporter - using Gmail or any SMTP
const getTransporter = () => {
  const gmailUser = process.env.GMAIL_USER
  const gmailPass = process.env.GOOGLE_APP_PASSWORD
  
  if (!gmailUser || !gmailPass) {
    console.error("GMAIL_USER or GOOGLE_APP_PASSWORD not configured")
    return null
  }
  
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const { email, userName, oldTenantName, newTenantName } = await request.json()

    if (!email || !oldTenantName || !newTenantName) {
      return NextResponse.json(
        { error: "Email e nomes das empresas são obrigatórios" },
        { status: 400 }
      )
    }

    const transporter = getTransporter()
    
    if (!transporter) {
      return NextResponse.json(
        { error: "Serviço de email não configurado. Configure GMAIL_USER e GOOGLE_APP_PASSWORD no Vercel." },
        { status: 500 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://axioncred.vercel.app"

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f9fa; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #1E3A8A; margin: 0; font-size: 32px;">AXION<span style="color: #22C55E;">Cred</span></h1>
    </div>
    
    <h2 style="color: #374151; margin-bottom: 20px;">Olá, ${userName || 'Usuário'}!</h2>
    
    <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
      Informamos que você foi movido para uma nova empresa no sistema AXION Cred.
    </p>
    
    <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">De:</td>
          <td style="padding: 8px 0; color: #ef4444; font-weight: 600; font-size: 14px;">${oldTenantName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Para:</td>
          <td style="padding: 8px 0; color: #22C55E; font-weight: 600; font-size: 14px;">${newTenantName}</td>
        </tr>
      </table>
    </div>
    
    <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
      Agora você faz parte da <strong>${newTenantName}</strong>. Faça login para acessar o sistema.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${appUrl}/login" style="display: inline-block; background-color: #22C55E; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
        Acessar Sistema
      </a>
    </div>
    
    <p style="color: #9ca3af; font-size: 14px; text-align: center; margin-top: 30px;">
      Esta é uma mensagem automática do sistema AXION Cred.<br>
      Não responda este email.
    </p>
  </div>
</body>
</html>
    `

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: "🏢 Você foi movido para uma nova empresa - AXION Cred",
      html: htmlContent,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sending tenant change email:", error)
    return NextResponse.json(
      { error: "Erro ao enviar email" },
      { status: 500 }
    )
  }
}