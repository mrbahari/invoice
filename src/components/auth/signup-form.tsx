
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
import { Package2 } from 'lucide-react';

export function SignupForm() {
    const { signInWithGoogle } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // This is a mock signup. In a real app, you'd create a new user.
        if (email && password) {
            toast({
                title: 'ثبت‌نام با ایمیل',
                description: 'این قابلیت هنوز پیاده‌سازی نشده است. لطفا با گوگل ثبت‌نام کنید.',
            })
        } else {
            toast({
                variant: 'destructive',
                title: 'خطا در ثبت نام',
                description: 'لطفا تمام فیلدها را پر کنید.',
            })
        }
    };


  return (
    <Card className="mx-auto max-w-sm w-full">
       <CardHeader className="items-center text-center">
        <Link href="/" className="mb-4">
            <Package2 className="h-8 w-8 text-primary" />
        </Link>
        <CardTitle className="text-xl">ثبت نام</CardTitle>
        <CardDescription>
          برای ایجاد حساب کاربری اطلاعات خود را وارد کنید
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
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
            </form>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                    یا ادامه با
                </span>
                </div>
            </div>

            <Button variant="outline" className="w-full" onClick={signInWithGoogle}>
                ثبت نام با گوگل
            </Button>
        </div>
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
