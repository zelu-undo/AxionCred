// Email utility using Resend API

const API_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export async function sendConfirmationEmail(email: string, name: string, confirmationToken: string) {
  const confirmationUrl = `${API_URL}/auth/confirm?token=${confirmationToken}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f9fa; padding: 20px;">
      <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #7c3aed; font-size: 32px; margin: 0;">AXION Cred</h1>
          <p style="color: #6b7280; margin-top: 8px;">Sistema de Gestão de Crédito</p>
        </div>
        
        <h2 style="color: #111827; margin-bottom: 20px;">Bem-vindo, ${name}!</h2>
        
        <p style="color: #374151; line-height: 1.6;">
          Obrigado por se cadastrar no AXION Cred. Para confirmar seu e-mail e ativar sua conta, clique no botão abaixo:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${confirmationUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Confirmar E-mail
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
          Se o botão não funcionar, copie e cole este link no seu navegador:<br>
          <a href="${confirmationUrl}" style="color: #7c3aed;">${confirmationUrl}</a>
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          © ${new Date().getFullYear()} AXION Cred. Todos os direitos reservados.
        </p>
      </div>
    </body>
    </html>
  `

  try {
    const response = await fetch("/api/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: email,
        subject: "Bem-vindo ao AXION Cred - Confirme seu e-mail",
        html
      })
    })
    
    const result = await response.json()
    console.log("Email sent:", result)
    return result
  } catch (error) {
    console.error("Error sending email:", error)
    return { error }
  }
}

export async function sendWelcomeEmail(email: string, name: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f9fa; padding: 20px;">
      <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #7c3aed; font-size: 32px; margin: 0;">AXION Cred</h1>
          <p style="color: #6b7280; margin-top: 8px;">Sistema de Gestão de Crédito</p>
        </div>
        
        <h2 style="color: #111827; margin-bottom: 20px;">🎉 Conta confirmada!</h2>
        
        <p style="color: #374151; line-height: 1.6;">
          Olá, ${name}!
        </p>
        
        <p style="color: #374151; line-height: 1.6;">
          Sua conta foi confirmada com sucesso. Agora você pode começar a usar o AXION Cred para gerenciar seus clientes e empréstimos.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${API_URL}/dashboard" style="display: inline-block; background: #7c3aed; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
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
  `

  try {
    const response = await fetch("/api/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: email,
        subject: "Bem-vindo ao AXION Cred!",
        html
      })
    })
    
    return await response.json()
  } catch (error) {
    console.error("Error sending email:", error)
    return { error }
  }
}
