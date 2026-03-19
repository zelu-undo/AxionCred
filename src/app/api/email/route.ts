import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

// Configure this with your own domain after adding it in Resend
// Example: "AXION Cred <noreply@yourdomain.com>"
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "AXION Cred <onboarding@resend.dev>"

// Only initialize Resend if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function POST(request: NextRequest) {
  try {
    // Check if Resend is configured
    if (!resend) {
      return NextResponse.json(
        { error: "Email service not configured. Please add RESEND_API_KEY in Vercel settings." },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { to, subject, html } = body

    if (!to || !subject) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject" },
        { status: 400 }
      )
    }

    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html: html || "",
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Email error:", error)
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    )
  }
}
