
'use client';

import React from 'react';
import { useUser } from '@/firebase';
import { useData } from '@/context/data-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Edit, Package, Settings, ShoppingBag, Star, User as UserIcon, Users, Wallet } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Image from 'next/image';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { UserProfile, Store, Product } from '@/lib/definitions';

const ProfileInfoSection = ({ user, profile }: { user: any, profile?: UserProfile }) => (
  <div className="grid gap-8">
    <Card>
      <CardHeader>
        <CardTitle>اطلاعات شخصی</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-sm text-muted-foreground">نام کامل</p><p>{user.displayName || 'ثبت نشده'}</p></div>
          <div><p className="text-sm text-muted-foreground">ایمیل</p><p>{user.email || 'ثبت نشده'}</p></div>
          <div><p className="text-sm text-muted-foreground">تلفن</p><p>{profile?.phone || 'ثبت نشده'}</p></div>
          <div><p className="text-sm text-muted-foreground">تاریخ عضویت</p><p>{new Date(user.metadata.creationTime).toLocaleDateString('fa-IR')}</p></div>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>آدرس و تماس</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div><p className="text-sm text-muted-foreground">آدرس ارسال</p><p>{profile?.address || 'آدرسی ثبت نشده است'}</p></div>
        <div><p className="text-sm text-muted-foreground">آدرس صورتحساب</p><p>{profile?.address || 'آدرسی ثبت نشده است'}</p></div>
      </CardContent>
    </Card>
  </div>
);

const MyStoreSection = ({ store, products }: { store?: Store, products: Product[] }) => {
    if (!store) return <Card><CardContent><p className="py-8 text-center text-muted-foreground">شما هنوز فروشگاهی ایجاد نکرده‌اید.</p></CardContent></Card>;

    const storeProducts = products.filter(p => p.storeId === store.id);

    return (
        <div className="space-y-8">
            <Card className="overflow-hidden">
                <div className="relative h-48 w-full">
                    <Image src="https://picsum.photos/seed/store-banner/1200/300" alt="بنر فروشگاه" fill className="object-cover" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <h2 className="text-4xl font-bold text-white">{store.name}</h2>
                    </div>
                </div>
                <CardContent className="p-6 grid grid-cols-3 gap-4 text-center">
                    <div><p className="text-2xl font-bold">{storeProducts.length.toLocaleString('fa-IR')}</p><p className="text-sm text-muted-foreground">تعداد محصولات</p></div>
                    <div><p className="text-2xl font-bold">{formatCurrency(12450)}</p><p className="text-sm text-muted-foreground">درآمد ماهانه</p></div>
                    <div><p className="text-2xl font-bold">۴.۸ <span className="text-base"> (۱.۲ هزار)</span></p><p className="text-sm text-muted-foreground">نظرات مشتریان</p></div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle>محصولات</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {storeProducts.slice(0, 4).map(product => (
                        <Card key={product.id} className="group overflow-hidden">
                            <div className="relative aspect-square">
                                <Image src={product.imageUrl} alt={product.name} fill className="object-cover transition-transform group-hover:scale-105" />
                            </div>
                            <div className="p-2">
                                <h3 className="text-sm font-semibold truncate">{product.name}</h3>
                                <p className="text-sm text-muted-foreground">{formatCurrency(product.price)}</p>
                            </div>
                        </Card>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
};

const SettingsSection = () => (
     <Accordion type="multiple" defaultValue={['item-1']} className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger>تنظیمات حساب کاربری</AccordionTrigger>
        <AccordionContent className="space-y-4 px-1">
          <div className="flex items-center justify-between p-3 rounded-lg border"><span>تغییر رمز عبور</span><Button variant="outline">تغییر</Button></div>
          <div className="flex items-center justify-between p-3 rounded-lg border"><span>احراز هویت دو مرحله‌ای</span><Button variant="outline">فعال‌سازی</Button></div>
          <div className="flex items-center justify-between p-3 rounded-lg border"><span>اعلان‌ها</span><Button variant="outline">مدیریت</Button></div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>ابزارهای فروشنده</AccordionTrigger>
        <AccordionContent className="space-y-4 px-1">
           <div className="flex items-center justify-between p-3 rounded-lg border"><span>سیاست‌های فروشگاه</span><Button variant="outline">ویرایش</Button></div>
           <div className="flex items-center justify-between p-3 rounded-lg border"><span>روش‌های پرداخت</span><Button variant="outline">تنظیم</Button></div>
           <div className="flex items-center justify-between p-3 rounded-lg border"><span>همگام‌سازی موجودی</span><Button variant="outline">اتصال</Button></div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
)

export default function ProfilePage() {
    const { user } = useUser();
    const { data } = useData();
    const { stores, products, userProfiles } = data;

    if (!user) {
        return (
            <Card>
                <CardContent>
                    <p className="py-16 text-center text-muted-foreground">لطفا برای مشاهده پروفایل خود وارد شوید.</p>
                </CardContent>
            </Card>
        );
    }
    
    const userProfile = userProfiles.find(p => p.id === user.uid);
    const userStore = stores[0]; 

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 p-4 md:p-6 animate-fade-in-up" data-main-page="true">
            {/* Left Sidebar */}
            <div className="md:col-span-1 space-y-8">
                <Card className="hover:shadow-lg hover:scale-[1.02] transition-all">
                    <CardContent className="p-6 text-center">
                        <Avatar className="w-24 h-24 mx-auto mb-4 border-2 border-primary">
                            <AvatarImage src={user.photoURL || `https://avatar.vercel.sh/${user.uid}.png`} alt={user.displayName || 'آواتار'} />
                            <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <h2 className="text-xl font-bold">{user.displayName}</h2>
                        <Badge variant="secondary" className="mt-2">فروشنده</Badge>
                        <div className="flex justify-center items-center gap-1 mt-2">
                            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                            <span className="font-semibold">۴.۸</span>
                            <span className="text-sm text-muted-foreground">(۱.۲ هزار)</span>
                        </div>
                        <div className="mt-6 flex flex-col gap-2">
                            <Button>ویرایش پروفایل</Button>
                            <Button variant="outline">مشاهده فروشگاه</Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>نمای کلی عملکرد</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-2 text-center">
                        <Card className="p-2"><p className="font-bold">{formatCurrency(12450)}</p><p className="text-xs text-muted-foreground">فروش</p></Card>
                        <Card className="p-2"><p className="font-bold">{products.length.toLocaleString('fa-IR')}</p><p className="text-xs text-muted-foreground">محصولات</p></Card>
                        <Card className="p-2"><p className="font-bold">۱.۲ هزار</p><p className="text-xs text-muted-foreground">دنبال‌کننده</p></Card>
                    </CardContent>
                </Card>
            </div>

            {/* Right Content */}
            <div className="md:col-span-3">
                <Tabs defaultValue="profile" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="profile"><UserIcon className="w-4 h-4 ml-2" />اطلاعات پروفایل</TabsTrigger>
                        <TabsTrigger value="store"><ShoppingBag className="w-4 h-4 ml-2" />فروشگاه من</TabsTrigger>
                        <TabsTrigger value="settings"><Settings className="w-4 h-4 ml-2" />تنظیمات</TabsTrigger>
                    </TabsList>
                    <TabsContent value="profile" className="mt-6">
                        <ProfileInfoSection user={user} profile={userProfile} />
                    </TabsContent>
                    <TabsContent value="store" className="mt-6">
                        <MyStoreSection store={userStore} products={products} />
                    </TabsContent>
                    <TabsContent value="settings" className="mt-6">
                        <SettingsSection />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
