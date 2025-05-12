import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  const headersList = headers();
  const authHeader = headersList.get('authorization');

  if (!authHeader) {
    return NextResponse.json(
      { error: 'Unauthorized: No token provided' },
      { status: 401 }
    );
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid or expired token' },
      { status: 401 }
    );
  }

  const response = await fetch(
    'https://dlsuvtzbiniqqiemxxdh.supabase.co/functions/v1/send-emails-new',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );

  const result = await response.json();
  return NextResponse.json(result, { status: response.status });
}
