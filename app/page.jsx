'use client';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users, Mail, TriangleAlert, Clock, LogOut } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    checkUser();
    getPatients();
  }, []);
  function getDaysSinceResponse(lastResponseDate) {
    if (!lastResponseDate) return 'No response';
    const today = new Date();
    const responseDate = new Date(lastResponseDate);
    const diffInMs = today - responseDate;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    if (diffInDays === 0) return 'Today';
    return `${diffInDays} hari yang lalu`;
  }

  async function getPatients() {
    const res = await fetch('/api/patients');
    const data = await res.json();
    console.log(data);
    setPatients(data);
  }

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
    <div className="min-h-screen w-full pb-4 bg-gray-200">
      <nav className="bg-white p-7 flex items-center justify-between relative">
        {/* Centered title container */}
        <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
          <p className="font-medium text-3xl">Therapy CRM</p>
          <p className="font-normal text-gray-500">Patient Dashboard</p>
        </div>
        {/* Empty div to balance flex space */}
        <div className="w-6" />{' '}
        {/* This can match the width of the LogOut icon */}
        {/* Log out icon on the right */}
        <LogOut className="cursor-pointer" onClick={logOut} />
      </nav>
      <div className="mx-16 mt-8">
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex flex-row gap-6 items-center">
              <Users size={48} />
              <div>
                <p className="text-2xl text-gray-500">Total Pasien</p>
                <p className="text-3xl font-medium">{patients.length}</p>
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
        <div className="mt-8">
          <p className="text-gray-900 font-medium text-2xl">List Pasien</p>
        </div>
        <div className="mt-8">
          <div className="grid grid-cols-3 gap-4">
            {patients.map((patient) => {
              return (
                <Card className="hover:shadow-md" key={patient.id}>
                  <CardContent>
                    <p className="text-2xl font-medium">{patient.name}</p>
                    <p className="text-gray-500">{patient.email}</p>

                    <div className="bg-lime-200 w-fit h-fit rounded-3xl my-2">
                      <p className="p-2 text-green-500">
                        Current well being: Excellent
                      </p>
                    </div>
                    <div className="flex flex-row items-center gap-2">
                      <Clock size={12} />
                      <p>{getDaysSinceResponse(patient.last_response_date)}</p>
                    </div>
                    <div className="mt-2">
                      <p>
                        Making Excellent Progress with anxiety management issues
                      </p>
                    </div>
                    <Button variant={'outline'} className="mt-2">
                      Contact
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
