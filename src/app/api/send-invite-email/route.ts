import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

// Configure transporter - using Gmail or any SMTP
const getTransporter = () => {
  // Use existing Vercel environment variables
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
    const { email, inviteToken, tenantName, role } = await request.json()

    if (!email || !inviteToken) {
      return NextResponse.json(
        { error: "Email e token são obrigatórios" },
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

    const roleLabels: Record<string, string> = {
      owner: "Proprietário",
      admin: "Administrador",
      manager: "Gerente",
      operator: "Operador",
      viewer: "Visualizador",
    }

    // Build invite URL
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://axioncred.vercel.app"}/invite?token=${inviteToken}`

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
    
    <h2 style="color: #374151; margin-bottom: 20px;">Olá!</h2>
    
    <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
      Você foi convidado para participar da <strong>${tenantName}</strong> como <strong>${roleLabels[role] || role}</strong>.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${inviteUrl}" style="display: inline-block; background-color: #22C55E; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
        Aceitar Convite
      </a>
    </div>
    
    <p style="color: #9ca3af; font-size: 14px; text-align: center;">
      Este convite expira em 7 dias.
    </p>
    
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="color: #9ca3af; font-size: 12px;">
        © ${new Date().getFullYear()} AXION Cred - Gestão de Crédito Inteligente
      </p>
    </div>
  </div>
</body>
</html>
    `

    // Send email
    const info = await transporter.sendMail({
      from: '"AXION Cred" <noreply@axioncred.com>',
      to: email,
      subject: `Você foi convidado para participar da ${tenantName} no AXION Cred`,
      html: htmlContent,
    })

    console.log("Email sent:", info.messageId)

    return NextResponse.json({ success: true, messageId: info.messageId })
  } catch (error: any) {
    console.error("Send invite email error:", error)
    return NextResponse.json(
      { error: "Erro ao enviar email: " + error.message },
      { status: 500 }
    )
  }
}