import { supabaseAdmin } from '../../../lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const { token, message, mood, stress } = await request.json();

  if (!token || !message || !mood || !stress) {
    return NextResponse.json(
      { error: 'All fields are required' },
      { status: 400 }
    );
  }

  const { data: tokenData, error: tokenError } = await supabaseAdmin
    .from('tokens')
    .select('patient_id, used')
    .eq('token', token)
    .single();

  if (tokenError || !tokenData || tokenData.used) {
    return NextResponse.json(
      { error: 'Invalid or used token' },
      { status: 400 }
    );
  }

  const { error: responseError } = await supabaseAdmin
    .from('responses')
    .insert([{ patient_id: tokenData.patient_id, message, mood, stress }]);

  if (responseError) {
    return NextResponse.json({ error: responseError.message }, { status: 500 });
  }

  const { error: tokenUpdateError } = await supabaseAdmin
    .from('tokens')
    .update({ used: true })
    .eq('token', token);

  if (tokenUpdateError) {
    return NextResponse.json(
      { error: tokenUpdateError.message },
      { status: 500 }
    );
  }

  const { error: patientUpdateError } = await supabaseAdmin
    .from('patients')
    .update({ last_response_date: new Date().toISOString() })
    .eq('id', tokenData.patient_id);

  if (patientUpdateError) {
    return NextResponse.json(
      { error: patientUpdateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: 'Response submitted' }, { status: 200 });
}
