
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

export function SignupForm() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // This is a mock signup. In a real app, you'd create a new user.
        if (email && password) {
            login(email);
        } else {
            toast({
                variant: 'destructive',
                title: 'خطا در ثبت نام',
                description: 'لطفا تمام فیلدها را پر کنید.',
            })
        }
    };


  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">ثبت نام</CardTitle>
        <CardDescription>
          برای ایجاد حساب کاربری اطلاعات خود را وارد کنید
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
              <Label htmlFor="first-name">نام</Label>
              <Input id="first-name" placeholder="ماکس" required />
          </div>
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
            <Label htmlFor="password">رمز عبور</Label>
            <Input 
                id="password" 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full">
            ایجاد حساب کاربری
          </Button>
          <Button variant="outline" className="w-full">
            ثبت نام با گوگل
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          قبلا ثبت نام کرده‌اید؟{' '}
          <Link href="/login" className="underline">
            ورود
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
