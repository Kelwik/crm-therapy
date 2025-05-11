'use client';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect('/login');
    else setIsLoading(false);
  }

  async function logOut() {
    const { error } = await supabase.auth.signOut();
    redirect('/login');
  }

  if (isLoading) return <p>Loading...</p>;
  return (
    <div>
      <p>This is the dashboard</p>
      <Button onClick={logOut}>Log out</Button>
    </div>
  );
}
