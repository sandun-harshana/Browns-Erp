import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { to, subject, htmlContent } = await request.json();

    const data = await resend.emails.send({
      from: 'Browns ERP <onboarding@resend.dev>', // නොමිලේ දෙන Domain එක
      to: [to],
      subject: subject,
      html: htmlContent,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
