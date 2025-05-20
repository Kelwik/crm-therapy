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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

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
    <div className="w-screen h-screen flex justify-center items-center">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Login Admin</CardTitle>
          <CardDescription>Silahkan Melakukan Login</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Label>E-mail:</Label>
          <Input
            disabled={isLoading}
            type={'email'}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
          />
          <Label>Password:</Label>
          <Input
            disabled={isLoading}
            type={'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
          />
          {error && <p className="text-red-400">{error}</p>}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button disabled={isLoading} onClick={(e) => handleLogin(e)}>
            Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default Login;
