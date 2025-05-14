import { supabaseAdmin } from '../../../lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const patient_id = searchParams.get('id');

  if (!patient_id) {
    return NextResponse.json(
      { error: 'Patient ID is required' },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from('form_submissions')
    .select('id, offline_session_requested, response_data, submitted_at')
    .eq('patient_id', patient_id)
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
