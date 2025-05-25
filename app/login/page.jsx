'use client';
import { createClient } from '@supabase/supabase-js';
import { useState } from 'react';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { redirect } from 'next/navigation';
import { motion } from 'framer-motion';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
      setPassword('');
      setIsLoading(false);
    } else {
      setIsLoading(false);
      redirect('/');
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#FFE4E1] to-[#FFD1CC] flex justify-center items-center p-4 font-poppins">
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md"
      >
        <Card className="bg-gradient-to-br from-white to-[#E6FFFA] border-none shadow-xl rounded-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-semibold text-teal-800">
              Login Dokter
            </CardTitle>
            <CardDescription className="text-base font-normal text-teal-600 leading-relaxed">
              Silakan masukkan email dan kata sandi untuk masuk
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-teal-700 font-medium text-base">
                E-mail
              </Label>
              <Input
                disabled={isLoading}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Masukkan email"
                className="border-teal-300 focus:border-teal-500 focus:ring-teal-500 rounded-lg text-base font-normal"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-teal-700 font-medium text-base">
                Kata Sandi
              </Label>
              <Input
                disabled={isLoading}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi"
                className="border-teal-300 focus:border-teal-500 focus:ring-teal-500 rounded-lg text-base font-normal"
              />
            </div>
            {error && (
              <p className="text-red-600 text-base font-normal leading-relaxed text-center">
                {error}
              </p>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button
              disabled={isLoading}
              onClick={(e) => handleLogin(e)}
              className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white rounded-full py-3 text-base font-medium"
            >
              {isLoading ? 'Memproses...' : 'Masuk'}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}

export default Login;
