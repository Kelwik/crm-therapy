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
  const { newPatientName: name, newPatientEmail: email } = await request.json();

  if (!name || !email) {
    return NextResponse.json(
      { error: 'Name and email are required' },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from('patients')
    .insert([{ name, email }]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Patient added' }, { status: 200 });
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  const { error } = id;
  await supabaseAdmin.from('patients').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Patient Deleted' }, { status: 200 });
}
