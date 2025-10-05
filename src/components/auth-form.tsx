'use client';

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
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useActionState } from 'react';
import type { AuthFormValues } from '@/lib/definitions';
import Link from 'next/link';

interface AuthFormProps {
  formType: 'login' | 'signup';
  onSubmit: (
    state: any,
    formData: FormData
  ) => Promise<{ message: string; success: boolean }>;
}

const loginSchema = z.object({
  email: z.string().email('ایمیل نامعتبر است'),
  password: z.string().min(1, 'کلمه عبور الزامی است'),
});

const signupSchema = z.object({
  firstName: z.string().min(1, 'نام الزامی است'),
  lastName: z.string().min(1, 'نام خانوادگی الزامی است'),
  email: z.string().email('ایمیل نامعتبر است'),
  password: z.string().min(6, 'کلمه عبور باید حداقل ۶ کاراکتر باشد'),
});

export function AuthForm({ formType, onSubmit }: AuthFormProps) {
  const isLogin = formType === 'login';
  const schema = isLogin ? loginSchema : signupSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormValues>({
    resolver: zodResolver(schema),
  });

  const [state, formAction] = useActionState(onSubmit, {
    message: '',
    success: false,
  });

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-2xl">
            {isLogin ? 'ورود به حساب کاربری' : 'ایجاد حساب کاربری'}
          </CardTitle>
          <CardDescription>
            {isLogin
              ? 'ایمیل و کلمه عبور خود را برای ورود وارد کنید'
              : 'اطلاعات خود را برای ساخت حساب جدید وارد کنید'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="grid gap-4">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">نام</Label>
                  <Input
                    id="firstName"
                    placeholder="مثال: علی"
                    {...register('firstName')}
                  />
                  {errors.firstName && (
                    <p className="text-xs text-destructive">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">نام خانوادگی</Label>
                  <Input
                    id="lastName"
                    placeholder="مثال: محمدی"
                    {...register('lastName')}
                  />
                  {errors.lastName && (
                    <p className="text-xs text-destructive">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="email">ایمیل</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">کلمه عبور</Label>
                {isLogin && (
                  <Link
                    href="#"
                    className="mr-auto inline-block text-sm underline"
                  >
                    کلمه عبور خود را فراموش کرده‌اید؟
                  </Link>
                )}
              </div>
              <Input
                id="password"
                type="password"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full">
              {isLogin ? 'ورود' : 'ایجاد حساب'}
            </Button>
            {state?.message && (
              <p
                className={`text-sm ${
                  state.success ? 'text-green-600' : 'text-destructive'
                }`}
              >
                {state.message}
              </p>
            )}
          </form>
          <div className="mt-4 text-center text-sm">
            {isLogin ? 'حساب کاربری ندارید؟ ' : 'قبلاً ثبت‌نام کرده‌اید؟ '}
            <Link href={isLogin ? '/signup' : '/login'} className="underline">
              {isLogin ? 'ثبت نام' : 'ورود'}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
