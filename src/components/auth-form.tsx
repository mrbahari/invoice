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
import { useActionState, useState } from 'react';
import type { AuthFormValues } from '@/lib/definitions';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AuthFormProps {
  formType: 'login' | 'signup' | 'forgot-password';
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

const forgotPasswordSchema = z.object({
  email: z.string().email('ایمیل نامعتبر است'),
});


export function AuthForm({ formType, onSubmit }: AuthFormProps) {
  const [currentTab, setCurrentTab] = useState(formType);
  const isLogin = currentTab === 'login';
  const isSignup = currentTab === 'signup';
  const isForgotPassword = currentTab === 'forgot-password';

  const getSchema = () => {
    switch (currentTab) {
      case 'signup':
        return signupSchema;
      case 'forgot-password':
        return forgotPasswordSchema;
      case 'login':
      default:
        return loginSchema;
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormValues>({
    resolver: zodResolver(getSchema()),
  });

  const [state, formAction, isPending] = useActionState(onSubmit, {
    message: '',
    success: false,
  });

  const titles = {
    login: 'ورود به حساب کاربری',
    signup: 'ایجاد حساب کاربری',
    'forgot-password': 'بازیابی کلمه عبور',
  };

  const descriptions = {
    login: 'ایمیل و کلمه عبور خود را برای ورود وارد کنید',
    signup: 'اطلاعات خود را برای ساخت حساب جدید وارد کنید',
    'forgot-password': 'ایمیل خود را برای ارسال لینک بازیابی وارد کنید',
  };

  const buttonLabels = {
    login: 'ورود',
    signup: 'ایجاد حساب',
    'forgot-password': 'ارسال لینک بازیابی',
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted">
      <Card className="mx-auto max-w-sm w-full">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <CardHeader>
             <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">ورود</TabsTrigger>
                <TabsTrigger value="signup">ثبت نام</TabsTrigger>
            </TabsList>
            <CardTitle className="text-2xl pt-4">
              {titles[currentTab]}
            </CardTitle>
            <CardDescription>
              {descriptions[currentTab]}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TabsContent value="login">
              <form action={formAction} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email-login">ایمیل</Label>
                  <Input
                    id="email-login"
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
                    <Label htmlFor="password-login">کلمه عبور</Label>
                    <button
                      type="button"
                      onClick={() => setCurrentTab('forgot-password')}
                      className="mr-auto inline-block text-sm underline"
                    >
                      کلمه عبور خود را فراموش کرده‌اید؟
                    </button>
                  </div>
                  <Input
                    id="password-login"
                    type="password"
                    {...register('password')}
                  />
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password.message}</p>
                  )}
                </div>
                 <Button type="submit" className="w-full" disabled={isPending}>
                  {buttonLabels[currentTab]}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
               <form action={formAction} className="grid gap-4">
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
                  <div className="grid gap-2">
                    <Label htmlFor="email-signup">ایمیل</Label>
                    <Input
                      id="email-signup"
                      type="email"
                      placeholder="m@example.com"
                      {...register('email')}
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive">{errors.email.message}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password-signup">کلمه عبور</Label>
                    <Input
                      id="password-signup"
                      type="password"
                      {...register('password')}
                    />
                    {errors.password && (
                      <p className="text-xs text-destructive">{errors.password.message}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={isPending}>
                    {buttonLabels[currentTab]}
                  </Button>
               </form>
            </TabsContent>

             <TabsContent value="forgot-password">
                <form action={formAction} className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email-forgot">ایمیل</Label>
                    <Input
                      id="email-forgot"
                      type="email"
                      placeholder="m@example.com"
                      {...register('email')}
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive">{errors.email.message}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={isPending}>
                    {buttonLabels[currentTab]}
                  </Button>
                   <Button
                      type="button"
                      variant="link"
                      onClick={() => setCurrentTab('login')}
                    >
                      بازگشت به صفحه ورود
                    </Button>
                </form>
            </TabsContent>

             {state?.message && !isPending && (
              <p
                className={`mt-4 text-sm text-center ${
                  state.success ? 'text-green-600' : 'text-destructive'
                }`}
              >
                {state.message}
              </p>
            )}
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
