'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useActionState, useState, useEffect } from 'react';
import type { AuthFormValues } from '@/lib/definitions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@/context/user-context';
import { Loader2 } from 'lucide-react';

interface AuthFormProps {
  formType: 'login' | 'signup';
  onSubmit: (
    values: AuthFormValues,
    formType: 'login' | 'signup'
  ) => Promise<{ message: string; success: boolean }>;
  onGoogleSignIn: () => Promise<{ success: boolean; error?: string }>;
  onPasswordReset: (
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

export function AuthForm({ formType: initialFormType, onSubmit, onGoogleSignIn, onPasswordReset }: AuthFormProps) {
  const { user, isUserLoading } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<'login' | 'signup' | 'forgot-password'>(initialFormType);
  const [isPending, setIsPending] = useState(false);
  const [formState, setFormState] = useState<{ message: string, success: boolean } | null>(null);
  
  useEffect(() => {
    if (!isUserLoading && user) {
      setIsOpen(false);
    }
  }, [user, isUserLoading]);
  
  const getSchema = () => {
    switch (currentTab) {
      case 'signup': return signupSchema;
      case 'forgot-password': return forgotPasswordSchema;
      case 'login': default: return loginSchema;
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AuthFormValues>({
    resolver: zodResolver(getSchema()),
  });

  const [resetState, resetAction, isResetPending] = useActionState(onPasswordReset, { message: '', success: false });

  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleClick = async () => {
    setGoogleLoading(true);
    const { success, error } = await onGoogleSignIn();
    if (!success) {
      // You might want to show a toast message here
      console.error(error);
    }
    setGoogleLoading(false);
  };
  
  useEffect(() => {
    // Reset form fields and errors when tab changes
    reset();
    setFormState(null);
  }, [currentTab, reset]);
  
  const handleFormSubmit = async (data: AuthFormValues) => {
    setIsPending(true);
    setFormState(null);
    const result = await onSubmit(data, currentTab as 'login' | 'signup');
    setFormState(result);
    setIsPending(false);
  };

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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {initialFormType === 'login' ? <Button variant="ghost" size="sm">ورود</Button> : <Button size="sm" variant="outline">ثبت نام</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as any)} className="w-full">
          <DialogHeader>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">ورود</TabsTrigger>
              <TabsTrigger value="signup">ثبت نام</TabsTrigger>
            </TabsList>
            <DialogTitle className="text-2xl pt-4 text-center">
              {titles[currentTab]}
            </DialogTitle>
            <DialogDescription className="text-center">
              {descriptions[currentTab]}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6">
            <TabsContent value="login">
              <form onSubmit={handleSubmit(handleFormSubmit)} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email-login">ایمیل</Label>
                  <Input id="email-login" type="email" placeholder="m@example.com" {...register('email')} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password-login">کلمه عبور</Label>
                    <button type="button" onClick={() => setCurrentTab('forgot-password')} className="mr-auto inline-block text-sm underline">
                      کلمه عبور خود را فراموش کرده‌اید؟
                    </button>
                  </div>
                  <Input id="password-login" type="password" {...register('password')} />
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>
                {formState?.message && !isPending && <p className={`text-sm text-center ${formState.success ? 'text-green-600' : 'text-destructive'}`}>{formState.message}</p>}
                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white dark:bg-white dark:text-black" disabled={isPending}>
                  {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                  {buttonLabels.login}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSubmit(handleFormSubmit)} className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="firstName">نام</Label>
                    <Input id="firstName" placeholder="مثال: علی" {...register('firstName')} />
                    {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="lastName">نام خانوادگی</Label>
                    <Input id="lastName" placeholder="مثال: محمدی" {...register('lastName')} />
                    {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email-signup">ایمیل</Label>
                  <Input id="email-signup" type="email" placeholder="m@example.com" {...register('email')} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password-signup">کلمه عبور</Label>
                  <Input id="password-signup" type="password" {...register('password')} />
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>
                {formState?.message && !isPending && <p className={`text-sm text-center ${formState.success ? 'text-green-600' : 'text-destructive'}`}>{formState.message}</p>}
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                  {buttonLabels.signup}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="forgot-password">
              <form action={resetAction} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email-forgot">ایمیل</Label>
                  <Input id="email-forgot" type="email" placeholder="m@example.com" name="email" />
                </div>
                {resetState?.message && !isResetPending && <p className={`text-sm text-center ${resetState.success ? 'text-green-600' : 'text-destructive'}`}>{resetState.message}</p>}
                <Button type="submit" className="w-full" disabled={isResetPending}>
                  {isResetPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                  {buttonLabels['forgot-password']}
                </Button>
                <Button type="button" variant="link" onClick={() => setCurrentTab('login')}>
                  بازگشت به صفحه ورود
                </Button>
              </form>
            </TabsContent>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">یا ادامه با</span>
              </div>
            </div>
            
            <Button variant="outline" className="w-full" onClick={handleGoogleClick} disabled={googleLoading}>
              {googleLoading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <svg className="ml-2 h-4 w-4" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.75 8.36,4.73 12.19,4.73C15.28,4.73 17.27,6.08 18.24,7.03L20.44,4.95C18.42,3.15 15.4,2 12.19,2C6.92,2 2.73,6.33 2.73,11.5C2.73,16.67 6.92,21 12.19,21C17.7,21 21.54,17.29 21.54,11.83C21.54,11.53 21.46,11.3 21.35,11.1Z"></path></svg>}
              Google
            </Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
