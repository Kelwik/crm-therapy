import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    console.error('Error triggering emails:', err);
    return NextResponse.json(
      { error: 'Failed to trigger emails', details: err.message },
      { status: 500 }
    );
  }
}
