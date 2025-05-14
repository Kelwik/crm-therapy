import { supabaseAdmin } from '../../../lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  const { data, error } = id
    ? await supabaseAdmin.from('patients').select('*').eq('id', id)
    : await supabaseAdmin.from('patients').select('*');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(request) {
  const {
    newPatientName: name,
    newPatientEmail: email,
    date: last_response_date,
  } = await request.json();

  if (!name || !email) {
    return NextResponse.json(
      { error: 'Name and email are required' },
      { status: 400 }
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { error: 'Invalid email format' },
      { status: 400 }
    );
  }

  // Check for duplicate email
  const { data: existingPatient, error: checkError } = await supabaseAdmin
    .from('patients')
    .select('id')
    .eq('email', email)
    .single();
  if (existingPatient) {
    return NextResponse.json(
      { error: 'Patient with this email already exists' },
      { status: 400 }
    );
  }
  if (checkError && checkError.code !== 'PGRST116') {
    console.error('Error checking email:', checkError);
    return NextResponse.json({ error: checkError.message }, { status: 500 });
  }

  const { error } = await supabaseAdmin
    .from('patients')
    .insert([{ name, email, last_response_date }]);

  if (error) {
    console.error('Error adding patient:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Patient added' }, { status: 200 });
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'Patient ID is required' },
      { status: 400 }
    );
  }

  // Delete related data (if no ON DELETE CASCADE)
  const { error: submissionsError } = await supabaseAdmin
    .from('form_submissions')
    .delete()
    .eq('patient_id', id);
  if (submissionsError) {
    console.error('Error deleting submissions:', submissionsError);
    return NextResponse.json(
      { error: submissionsError.message },
      { status: 500 }
    );
  }

  const { error: notesError } = await supabaseAdmin
    .from('patient_notes')
    .delete()
    .eq('patient_id', id);
  if (notesError) {
    console.error('Error deleting notes:', notesError);
    return NextResponse.json({ error: notesError.message }, { status: 500 });
  }

  const { error: sessionsError } = await supabaseAdmin
    .from('sessions')
    .delete()
    .eq('patient_id', id);
  if (sessionsError) {
    console.error('Error deleting sessions:', sessionsError);
    return NextResponse.json({ error: sessionsError.message }, { status: 500 });
  }

  const { error: tokensError } = await supabaseAdmin
    .from('tokens')
    .delete()
    .eq('patient_id', id);
  if (tokensError) {
    console.error('Error deleting tokens:', tokensError);
    return NextResponse.json({ error: tokensError.message }, { status: 500 });
  }

  const { error } = await supabaseAdmin.from('patients').delete().eq('id', id);

  if (error) {
    console.error('Error deleting patient:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Patient deleted' }, { status: 200 });
}
