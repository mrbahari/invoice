
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

export function LoginForm() {
    const { signInWithGoogle, signInWithEmail, resetPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            toast({
                variant: 'destructive',
                title: 'خطا در ورود',
                description: 'لطفا ایمیل و رمز عبور را وارد کنید.',
            });
            return;
        }

        setIsLoading(true);
        try {
            await signInWithEmail({ email, password });
        } catch (error) {
            const authError = error as AuthError;
            let description = 'خطایی در هنگام ورود رخ داد. لطفا دوباره تلاش کنید.';
            if (authError.code === 'auth/user-not-found' || authError.code === 'auth/wrong-password' || authError.code === 'auth/invalid-credential') {
                description = 'ایمیل یا رمز عبور وارد شده صحیح نمی‌باشد.';
            }
            toast({
                variant: 'destructive',
                title: 'خطا در ورود',
                description,
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handlePasswordReset = async () => {
        if (!email) {
            toast({
                variant: 'destructive',
                title: 'ایمیل را وارد کنید',
                description: 'برای بازیابی رمز عبور، لطفا ابتدا ایمیل خود را در کادر مربوطه وارد کنید.',
            });
            return;
        }
        try {
            await resetPassword(email);
            toast({
                title: 'ایمیل بازیابی ارسال شد',
                description: 'یک لینک برای بازیابی رمز عبور به ایمیل شما ارسال شد. لطفا پوشه Spam را نیز بررسی کنید.',
            });
        } catch (error) {
            const authError = error as AuthError;
            let description = 'خطایی در ارسال ایمیل بازیابی رخ داد.';
             if (authError.code === 'auth/invalid-email') {
                description = 'فرمت ایمیل وارد شده صحیح نمی‌باشد.';
            } else if (authError.code === 'auth/user-not-found') {
                description = 'کاربری با این ایمیل یافت نشد.';
            }
            toast({
                variant: 'destructive',
                title: 'خطا',
                description,
            });
        }
    };

  return (
    <Card className="mx-auto max-w-sm w-full">
      <CardHeader className="items-center text-center">
        <Link href="/" className="mb-4">
            <Package2 className="h-8 w-8 text-primary" />
        </Link>
        <CardTitle className="text-2xl">خوش آمدید</CardTitle>
        <CardDescription>
          برای دسترسی به حساب کاربری خود وارد شوید
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
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
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">رمز عبور</Label>
                 <Button
                    type="button"
                    variant="link"
                    className="mr-auto h-auto p-0 text-sm underline"
                    onClick={handlePasswordReset}
                    disabled={isLoading}
                  >
                   رمز عبور خود را فراموش کرده‌اید؟
                 </Button>
              </div>
              <Input 
                  id="password" 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full mt-2" disabled={isLoading}>
              {isLoading ? 'در حال ورود...' : 'ورود'}
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
          <Button variant="outline" className="w-full" onClick={signInWithGoogle} disabled={isLoading}>
            ورود با گوگل
          </Button>
        </div>
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
