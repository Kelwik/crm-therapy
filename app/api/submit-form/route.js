import { supabaseAdmin } from '../../../lib/supabase';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request) {
  try {
    const { token, message, mood, stress, offline_session_requested } =
      await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Validate token
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('tokens')
      .select('id, patient_id, used')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    if (tokenData.used) {
      return NextResponse.json(
        { error: 'Token has already been used' },
        { status: 400 }
      );
    }

    // Insert form submission
    const response_data = { message, mood, stress };
    const { error: submissionError } = await supabaseAdmin
      .from('form_submissions')
      .insert({
        patient_id: tokenData.patient_id,
        token_id: tokenData.id,
        response_data,
        offline_session_requested,
      });

    if (submissionError) {
      console.error('Submission error:', submissionError);
      return NextResponse.json(
        { error: submissionError.message },
        { status: 500 }
      );
    }

    // Mark token as used
    const { error: tokenUpdateError } = await supabaseAdmin
      .from('tokens')
      .update({ used: true })
      .eq('id', tokenData.id);

    if (tokenUpdateError) {
      console.error('Token update error:', tokenUpdateError);
      return NextResponse.json(
        { error: tokenUpdateError.message },
        { status: 500 }
      );
    }

    // Update patient's last_response_date
    const { error: patientUpdateError } = await supabaseAdmin
      .from('patients')
      .update({ last_response_date: new Date().toISOString() })
      .eq('id', tokenData.patient_id);

    if (patientUpdateError) {
      console.error('Patient update error:', patientUpdateError);
      return NextResponse.json(
        { error: patientUpdateError.message },
        { status: 500 }
      );
    }

    // Notify therapist
    const { data: patientData, error: patientError } = await supabaseAdmin
      .from('patients')
      .select('name, email')
      .eq('id', tokenData.patient_id)
      .single();

    if (patientError || !patientData) {
      console.error('Patient fetch error:', patientError);
      return NextResponse.json(
        { error: 'Failed to fetch patient data' },
        { status: 500 }
      );
    }

    // Validate email credentials
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.warn(
        'Missing Gmail credentials: GMAIL_USER or GMAIL_PASS not set'
      );
      return NextResponse.json(
        {
          message: 'Form submitted successfully',
          warning:
            'Therapist notification failed due to missing email credentials',
        },
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

    // Email content
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: 'alwikasim456@gmail.com', // Therapist email
      subject: `New Form Submission from ${patientData.name}`,
      text: `
        Patient: ${patientData.name}
        Email: ${patientData.email}
        Message: ${response_data.message || 'None'}
        Mood: ${response_data.mood || 'Not provided'}
        Stress: ${response_data.stress || 'Not provided'}
        Offline Session Requested: ${offline_session_requested ? 'Yes' : 'No'}
      `,
      html: `
        <h2>New Form Submission</h2>
        <p><strong>Patient:</strong> ${patientData.name}</p>
        <p><strong>Email:</strong> ${patientData.email}</p>
        <p><strong>Message:</strong> ${response_data.message || 'None'}</p>
        <p><strong>Mood:</strong> ${response_data.mood || 'Not provided'}</p>
        <p><strong>Stress:</strong> ${response_data.stress || 'Not provided'}</p>
        <p><strong>Offline Session Requested:</strong> ${offline_session_requested ? 'Yes' : 'No'}</p>
      `,
    };

    // Send email
    try {
      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.warn('Therapist notification failed:', emailError);
      return NextResponse.json(
        {
          message: 'Form submitted successfully',
          warning: 'Therapist notification failed: ' + emailError.message,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { message: 'Form submitted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Form submission error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
