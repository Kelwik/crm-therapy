import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { supabaseAdmin } from '@/lib/supabase';

// Initialize Supabase client

export async function POST() {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Query patients
    const { data: patients, error } = await supabaseAdmin
      .from('patients')
      .select('id, name, email, last_response_date')
      .or(
        `last_response_date.is.null,last_response_date.lte.${sevenDaysAgo.toISOString()}`
      );

    if (error) {
      console.error('Error fetching patients:', error);
      return NextResponse.json(
        { error: 'Failed to fetch patients', details: error.message },
        { status: 500 }
      );
    }

    if (!patients || patients.length === 0) {
      console.log('No eligible patients found');
      return NextResponse.json(
        { message: 'No patients need reminders' },
        { status: 200 }
      );
    }

    // Set up Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'crm.therapy.test@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD, // Use App Password
      },
    });

    const sentEmails = [];
    for (const patient of patients) {
      const token = crypto.randomUUID();

      // Insert token
      const { error: tokenError } = await supabaseAdmin
        .from('tokens')
        .insert([{ patient_id: patient.id, token }]);
      if (tokenError) {
        console.error(
          'Error creating token for patient',
          patient.id,
          ':',
          tokenError
        );
        continue;
      }

      // Send email
      const formUrl = `https://crm-therapy.vercel.app/form/${token}`; // Replace with Vercel URL in production
      const mailOptions = {
        from: '"CRM Therapy" <crm.therapy.test@gmail.com>',
        to: patient.email,
        replyTo: 'crm.therapy.test@gmail.com',
        subject: `Hi ${patient.name}, How Are You Feeling?`,
        html: `
          <p>Dear ${patient.name},</p>
          <p>We haven't heard from you in a while. Please take a moment to share how you're feeling.</p>
          <p><a href="${formUrl}">Complete the Form</a></p>
          <p>If you have any questions, reply to this email.</p>
          <p>Best regards,<br>CRM Therapy Team</p>
          <p><small>If you no longer wish to receive these emails, <a href="http://localhost:3000/unsubscribe">unsubscribe here</a>.</small></p>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent to', patient.email);
        sentEmails.push(patient.email);
      } catch (emailError) {
        console.error('Error sending email to', patient.email, ':', emailError);
        continue;
      }
    }

    return NextResponse.json(
      { message: 'Emails sent', sentTo: sentEmails },
      { status: 200 }
    );
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json(
      { error: 'Failed to send emails', details: err.message },
      { status: 500 }
    );
  }
}
