import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function POST(request: Request) {
    try {
        const payload = await request.json();
        const { name, email, subject, message } = payload;

        if (!name || !email || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject || 'No Subject'}</p>
            <p><strong>Message:</strong></p>
            <blockquote style="background: #f4f4f4; padding: 10px; border-left: 5px solid #ccc; white-space: pre-wrap;">${message}</blockquote>
        </body>
        </html>
        `;

        if (!resend) {
            console.warn('Email skipped — RESEND_API_KEY not configured');
            return NextResponse.json({ success: true, message: 'Email skipped — RESEND_API_KEY not configured' });
        }

        const data = await resend.emails.send({
            from: 'Shelfcure <info@shelfcure.com>',
            to: 'info@shelfcure.com',
            replyTo: email,
            subject: `Contact Form: ${subject || 'New Message'}`,
            html: htmlContent,
        });

        if (data.error) {
            console.error('Resend Error:', data.error);
            return NextResponse.json({ error: data.error }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Error handling contact form:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
