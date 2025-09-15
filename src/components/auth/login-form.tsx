
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from './auth-provider';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function LoginForm() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // This is a mock login. In a real app, you'd validate credentials.
        if (email && password) {
            login(email);
        } else {
            toast({
                variant: 'destructive',
                title: 'خطا در ورود',
                description: 'لطفا ایمیل و رمز عبور را وارد کنید.',
            })
        }
    };

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">ورود</CardTitle>
        <CardDescription>
          برای دسترسی به حساب کاربری خود، ایمیل و رمز عبور را وارد کنید
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">ایمیل</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password">رمز عبور</Label>
              <Link href="#" className="mr-auto inline-block text-sm underline">
                رمز عبور خود را فراموش کرده‌اید؟
              </Link>
            </div>
            <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full">
            ورود
          </Button>
          <Button variant="outline" className="w-full">
            ورود با گوگل
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          حساب کاربری ندارید؟{' '}
          <Link href="/signup" className="underline">
            ثبت نام
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
