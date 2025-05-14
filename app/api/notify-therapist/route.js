import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { patient_id, offline_session_requested, response_data } =
      await request.json();

    const { data: patient, error } = await supabase
      .from('patients')
      .select('name, email')
      .eq('id', patient_id)
      .single();
    if (error) throw error;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'crm.therapy.test@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: '"CRM Therapy" <crm.therapy.test@gmail.com>',
      to: 'alwikasim456@gmail.com', // Replace with your email
      subject: `New Form Submission from ${patient.name}`,
      html: `
        <p>Patient: ${patient.name} (${patient.email})</p>
        <p>Message: ${response_data.message || 'None'}</p>
        <p>Mood: ${response_data.mood || 'Not provided'}</p>
        <p>Stress: ${response_data.stress || 'Not provided'}</p>
        <p>Offline Session Requested: ${offline_session_requested ? 'Yes' : 'No'}</p>
        <p>View details at: <a href="https://crm-therapy-d6wks3bkj-alwikasim456-gmailcoms-projects.vercel.app/patient/${patient_id}">Patient Dashboard</a></p>
      `,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json(
      { message: 'Therapist notified' },
      { status: 200 }
    );
  } catch (err) {
    console.error('Error notifying therapist:', err);
    return NextResponse.json(
      { error: 'Failed to notify therapist', details: err.message },
      { status: 500 }
    );
  }
}
