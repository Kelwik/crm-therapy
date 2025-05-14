import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST() {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Step 1: Get patient IDs with unused tokens
    const { data: unusedTokens, error: tokenError } = await supabase
      .from('tokens')
      .select('patient_id')
      .eq('used', false);

    if (tokenError) {
      console.error('Error fetching unused tokens:', tokenError);
      return NextResponse.json(
        { error: 'Failed to fetch tokens', details: tokenError.message },
        { status: 500 }
      );
    }

    // Extract patient IDs with unused tokens
    const excludedPatientIds = unusedTokens.map((token) => token.patient_id);

    // Step 2: Fetch patients, excluding those with unused tokens
    let query = supabase
      .from('patients')
      .select('id, name, email, last_response_date')
      .or(
        `last_response_date.is.null,last_response_date.lte.${sevenDaysAgo.toISOString()}`
      );

    if (excludedPatientIds.length > 0) {
      query = query.not('id', 'in', `(${excludedPatientIds.join(',')})`);
    }

    const { data: patients, error } = await query;

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

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'crm.therapy.test@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const sentEmails = [];
    for (const patient of patients) {
      const token = crypto.randomUUID();

      const { error: tokenError } = await supabase
        .from('tokens')
        .insert([{ patient_id: patient.id, token, used: false }]);
      if (tokenError) {
        console.error(
          'Error creating token for patient',
          patient.id,
          ':',
          tokenError
        );
        continue;
      }

      const formUrl = `https://crm-therapy.vercel.app/form/${token}`;
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
          <p><small>If you no longer wish to receive these emails, <a href="https://crm-therapy-d6wks3bkj-alwikasim456-gmailcoms-projects.vercel.app/unsubscribe">unsubscribe here</a>.</small></p>
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
