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
import { Users, Mail, TriangleAlert, Clock } from 'lucide-react';

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
    <div className="w-fit h-fit pb-4 bg-gray-200">
      <nav className="bg-white p-4 flex flex-col items-center shadow">
        <p className="font-medium text-3xl">Therapy CRM</p>
        <p className="font-normal text-gray-500">Patient Dashboard</p>
      </nav>
      <div className="mx-16 mt-8">
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
        <div className="mt-8">
          <p className="text-gray-900 font-medium text-2xl">List Pasien</p>
        </div>
        <div className="mt-8">
          <div className="grid grid-cols-3 gap-4">
            <Card className="hover:shadow-md">
              <CardContent>
                <p className="text-2xl font-medium">Sarah Johnson</p>
                <p className="text-gray-500">sarahjohnson@gmail.com</p>

                <div className="bg-lime-200 w-fit h-fit rounded-3xl my-2">
                  <p className="p-2 text-green-500">
                    Current well being: Excellent
                  </p>
                </div>
                <div className="flex flex-row items-center gap-2">
                  <Clock size={12} />
                  <p>2 days since last respond</p>
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
            <Card className="hover:shadow-md">
              <CardContent>
                <p className="text-2xl font-medium">Sarah Johnson</p>
                <p className="text-gray-500">sarahjohnson@gmail.com</p>

                <div className="bg-lime-200 w-fit h-fit rounded-3xl my-2">
                  <p className="p-2 text-green-500">
                    Current well being: Excellent
                  </p>
                </div>
                <div className="flex flex-row items-center gap-2">
                  <Clock size={12} />
                  <p>2 days since last respond</p>
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
            <Card className="hover:shadow-md">
              <CardContent>
                <p className="text-2xl font-medium">Sarah Johnson</p>
                <p className="text-gray-500">sarahjohnson@gmail.com</p>

                <div className="bg-lime-200 w-fit h-fit rounded-3xl my-2">
                  <p className="p-2 text-green-500">
                    Current well being: Excellent
                  </p>
                </div>
                <div className="flex flex-row items-center gap-2">
                  <Clock size={12} />
                  <p>2 days since last respond</p>
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
            <Card className="hover:shadow-md">
              <CardContent>
                <p className="text-2xl font-medium">Sarah Johnson</p>
                <p className="text-gray-500">sarahjohnson@gmail.com</p>

                <div className="bg-lime-200 w-fit h-fit rounded-3xl my-2">
                  <p className="p-2 text-green-500">
                    Current well being: Excellent
                  </p>
                </div>
                <div className="flex flex-row items-center gap-2">
                  <Clock size={12} />
                  <p>2 days since last respond</p>
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
          </div>
        </div>
      </div>
    </div>
  );
}
