import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

const getTransporter = () => {
  const gmailUser = process.env.GMAIL_USER
  const gmailPass = process.env.GOOGLE_APP_PASSWORD
  
  if (!gmailUser || !gmailPass) {
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
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      )
    }

    const transporter = getTransporter()
    
    if (!transporter) {
      return NextResponse.json(
        { 
          status: "error", 
          message: "Email não configurado. Configure GMAIL_USER e GOOGLE_APP_PASSWORD no Vercel." 
        },
        { status: 500 }
      )
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: sans-serif; padding: 20px;">
  <h2>✅ Teste de Email - AXION Cred</h2>
  <p>Se você recebeu este email, a configuração de email está funcionando corretamente!</p>
</body>
</html>
    `

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: "🧪 Teste de Email - AXION Cred",
      html: htmlContent,
    })

    return NextResponse.json({ 
      status: "success", 
      message: `Email enviado com sucesso para ${email}` 
    })
  } catch (error) {
    console.error("Error sending test email:", error)
    return NextResponse.json(
      { 
        status: "error", 
        message: "Erro ao enviar email. Verifique as configurações." 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Check if email is configured
  const gmailUser = process.env.GMAIL_USER
  const gmailPass = process.env.GOOGLE_APP_PASSWORD
  
  const isConfigured = !!(gmailUser && gmailPass)
  
  return NextResponse.json({ 
    status: isConfigured ? "configured" : "not_configured",
    message: isConfigured 
      ? "Email configurado. Use POST com email para testar." 
      : "Email não configurado. Configure GMAIL_USER e GOOGLE_APP_PASSWORD no Vercel."
  })
}