'use client';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Users, Mail, TriangleAlert } from 'lucide-react';

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
    <div className="w-screen h-screen bg-gray-200">
      <nav className="bg-white p-4 flex flex-col items-center shadow">
        <p className="font-medium text-3xl">Therapy CRM</p>
        <p className="font-normal text-gray-500">Patient Dashboard</p>
      </nav>
      <div className="mx-16 mt-4">
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex flex-row gap-6 items-center">
              <Users size={48} />
              <div>
                <p className="text-2xl text-gray-500">Total Pasien</p>
                <p className="text-3xl font-medium">42</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-row gap-6 items-center">
              <Mail size={48} />
              <div>
                <p className="text-2xl text-gray-500">Email Belum Direspons</p>
                <p className="text-3xl font-medium">42</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-row gap-6 items-center">
              <TriangleAlert size={48} />
              <div>
                <p className="text-2xl text-gray-500">Pasien Butuh Follow Up</p>
                <p className="text-3xl font-medium">42</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
