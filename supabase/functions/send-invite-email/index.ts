import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

interface InviteEmailRequest {
  email: string
  inviteToken: string
  tenantName: string
  role: string
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    })
  }

  try {
    const { email, inviteToken, tenantName, role }: InviteEmailRequest = await req.json()

    if (!email || !inviteToken) {
      return new Response(
        JSON.stringify({ error: "Email and invite token are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
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
    const inviteUrl = `${process.env.APP_URL || "https://axioncred.com"}/invite?token=${inviteToken}`

    // Send email using Resend
    if (RESEND_API_KEY) {
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "AXION Cred <axion@resend.dev>",
          to: email,
          subject: `Você foi convidado para participar da ${tenantName} no AXION Cred`,
          html: `
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
          `,
        }),
      })

      if (!resendResponse.ok) {
        const error = await resendResponse.text()
        console.error("Resend error:", error)
        // Continue anyway, invite is created
      }
    } else {
      console.log("RESEND_API_KEY not configured, skipping email send")
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Error in send-invite-email function:", error)
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})