
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
import { AuthError } from 'firebase/auth';

export function SignupForm() {
    const { signInWithGoogle, signUpWithEmail } = useAuth();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password || !firstName) {
            toast({
                variant: 'destructive',
                title: 'خطا در ثبت نام',
                description: 'لطفا تمام فیلدهای لازم را پر کنید.',
            });
            return;
        }
        if (password.length < 6) {
            toast({
                variant: 'destructive',
                title: 'رمز عبور ضعیف',
                description: 'رمز عبور باید حداقل ۶ کاراکتر باشد.',
            });
            return;
        }

        setIsLoading(true);
        try {
            await signUpWithEmail({ email, password, firstName, lastName });
            // AuthProvider will handle redirect
        } catch (error) {
            const authError = error as AuthError;
            let description = 'خطایی در هنگام ثبت‌نام رخ داد. لطفا دوباره تلاش کنید.';
            if (authError.code === 'auth/email-already-in-use') {
                description = 'این ایمیل قبلاً ثبت‌نام کرده است.';
            } else if (authError.code === 'auth/invalid-email') {
                description = 'فرمت ایمیل وارد شده صحیح نمی‌باشد.';
            } else if (authError.code === 'auth/weak-password') {
                description = 'رمز عبور باید حداقل ۶ کاراکتر باشد.';
            } else if (authError.code === 'auth/configuration-not-found') {
                description = 'ثبت نام با ایمیل و رمزعبور در پروژه شما فعال نشده است. لطفا تنظیمات Firebase را بررسی کنید.';
            }
            toast({
                variant: 'destructive',
                title: 'خطا در ثبت نام',
                description,
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleGoogleSignIn = async () => {
        setIsGoogleLoading(true);
        try {
            await signInWithGoogle();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'خطا در ثبت نام با گوگل',
                description: 'مشکلی در فرآیند ثبت نام با گوگل پیش آمد. لطفا دوباره تلاش کنید.',
            });
            setIsGoogleLoading(false);
        }
    }


  return (
    <Card className="mx-auto max-w-sm w-full bg-card/80 backdrop-blur-sm">
       <CardHeader className="items-center text-center">
        <Link href="/" className="mb-4">
            <Package2 className="h-8 w-8 text-primary" />
        </Link>
        <CardTitle className="text-2xl">ایجاد حساب</CardTitle>
        <CardDescription>
          برای شروع اطلاعات خود را وارد کنید
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
            <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="first-name">نام</Label>
                    <Input 
                      id="first-name" 
                      placeholder="ماکس" 
                      required 
                      disabled={isLoading || isGoogleLoading}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="last-name">نام خانوادگی</Label>
                    <Input 
                      id="last-name" 
                      placeholder="رابینسون" 
                      disabled={isLoading || isGoogleLoading}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                </div>
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
                disabled={isLoading || isGoogleLoading}
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
                    disabled={isLoading || isGoogleLoading}
                />
            </div>
            <Button type="submit" className="w-full mt-2" disabled={isLoading || isGoogleLoading}>
                {isLoading ? 'در حال ایجاد حساب...' : 'ایجاد حساب کاربری'}
            </Button>
            </form>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                    یا ادامه با
                </span>
                </div>
            </div>

            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
                 {isGoogleLoading ? 'در حال انتقال...' : 'ثبت نام با گوگل'}
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
