import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createEvent } from 'ics';
import { format } from 'date-fns';

export async function POST(request) {
  try {
    const { patient_id, patient_name, patient_email, session_date } =
      await request.json();

    // Validate input
    if (!patient_id || !patient_name || !patient_email || !session_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email credentials
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.warn('Missing Gmail credentials');
      return NextResponse.json(
        {
          message:
            'Session scheduled, but email notification failed due to missing credentials',
        },
        { status: 200 }
      );
    }

    // Create .ics event
    const eventDate = new Date(session_date);
    const event = {
      start: [
        eventDate.getFullYear(),
        eventDate.getMonth() + 1,
        eventDate.getDate(),
        eventDate.getHours(),
        eventDate.getMinutes(),
      ],
      duration: { hours: 1 },
      title: 'Therapy Session',
      description: `Therapy session with therapist for ${patient_name}.`,
      location: 'Therapy Clinic or Online',
      organizer: { name: 'Therapy CRM', email: process.env.GMAIL_USER },
      status: 'CONFIRMED',
      busyStatus: 'BUSY',
    };

    const { error: icsError, value: icsValue } = await createEvent(event);
    if (icsError || !icsValue) {
      console.warn('ICS creation failed:', icsError);
      return NextResponse.json(
        { message: 'Session scheduled, but calendar invite failed' },
        { status: 200 }
      );
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // Email with .ics attachment
    const mailOptions = {
      from: '"CRM Therapy" <crm.therapy.test@gmail.com>',
      to: patient_email,
      subject: 'Your Therapy Session Appointment',
      text: `
        Dear ${patient_name},
        Your therapy session has been scheduled.
        Date: ${format(eventDate, 'PPPP, p')}
        Please add the attached calendar event to your calendar.
        Best regards,
        Therapy CRM Team
      `,
      html: `
        <h2>Therapy Session Appointment</h2>
        <p>Dear ${patient_name},</p>
        <p>Your therapy session has been scheduled:</p>
        <ul>
          <li><strong>Date:</strong> ${format(eventDate, 'PPPP, p')}</li>
        </ul>
        <p>Please add the attached calendar event to your calendar.</p>
        <p>Best regards,<br/>Therapy CRM Team</p>
      `,
      attachments: [
        {
          filename: 'session.ics',
          content: icsValue,
          contentType: 'text/calendar',
        },
      ],
    };

    // Send email
    try {
      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.warn('Email sending failed:', emailError);
      return NextResponse.json(
        { message: 'Sesi ditetapkan tetapi notifikasi email gagal' },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { message: 'Sesi berhasil ditetapkan dan pasien telah diberitahu' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Notification error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
