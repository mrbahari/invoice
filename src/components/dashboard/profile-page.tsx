
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

const ProfileInfoSection = ({ user, profile }: { user: any, profile: any }) => (
  <div className="grid gap-8">
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-sm text-muted-foreground">Full Name</p><p>{user.displayName}</p></div>
          <div><p className="text-sm text-muted-foreground">Email</p><p>{user.email}</p></div>
          <div><p className="text-sm text-muted-foreground">Phone</p><p>{profile?.phone || 'N/A'}</p></div>
          <div><p className="text-sm text-muted-foreground">Gender</p><p>N/A</p></div>
          <div><p className="text-sm text-muted-foreground">Join Date</p><p>{new Date(user.metadata.creationTime).toLocaleDateString()}</p></div>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Address & Contact</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div><p className="text-sm text-muted-foreground">Shipping Address</p><p>{profile?.address || 'No address set'}</p></div>
        <div><p className="text-sm text-muted-foreground">Billing Address</p><p>{profile?.address || 'No address set'}</p></div>
      </CardContent>
    </Card>
  </div>
);

const MyStoreSection = ({ store, products }: { store: any, products: any[] }) => {
    if (!store) return <Card><CardContent><p className="py-8 text-center text-muted-foreground">You do not have a store configured.</p></CardContent></Card>;

    const storeProducts = products.filter(p => p.storeId === store.id);

    return (
        <div className="space-y-8">
            <Card className="overflow-hidden">
                <div className="relative h-48 w-full">
                    <Image src="https://picsum.photos/seed/store-banner/1200/300" alt="Store Banner" layout="fill" objectFit="cover" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <h2 className="text-4xl font-bold text-white">{store.name}</h2>
                    </div>
                </div>
                <CardContent className="p-6 grid grid-cols-3 gap-4 text-center">
                    <div><p className="text-2xl font-bold">{storeProducts.length}</p><p className="text-sm text-muted-foreground">Total Products</p></div>
                    <div><p className="text-2xl font-bold">{formatCurrency(12450)}</p><p className="text-sm text-muted-foreground">Monthly Revenue</p></div>
                    <div><p className="text-2xl font-bold">4.8 (1.2k)</p><p className="text-sm text-muted-foreground">Customer Reviews</p></div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle>Products</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {storeProducts.slice(0, 4).map(product => (
                        <Card key={product.id} className="group overflow-hidden">
                            <div className="relative aspect-square">
                                <Image src={product.imageUrl} alt={product.name} layout="fill" objectFit="cover" className="transition-transform group-hover:scale-105" />
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
        <AccordionTrigger>Account Settings</AccordionTrigger>
        <AccordionContent className="space-y-4 px-1">
          <div className="flex items-center justify-between p-3 rounded-lg border"><span>Change Password</span><Button variant="outline">Change</Button></div>
          <div className="flex items-center justify-between p-3 rounded-lg border"><span>Two-Factor Authentication (2FA)</span><Button variant="outline">Enable</Button></div>
          <div className="flex items-center justify-between p-3 rounded-lg border"><span>Notifications</span><Button variant="outline">Manage</Button></div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Vendor Tools</AccordionTrigger>
        <AccordionContent className="space-y-4 px-1">
           <div className="flex items-center justify-between p-3 rounded-lg border"><span>Store Policies</span><Button variant="outline">Edit</Button></div>
           <div className="flex items-center justify-between p-3 rounded-lg border"><span>Payout Methods</span><Button variant="outline">Setup</Button></div>
           <div className="flex items-center justify-between p-3 rounded-lg border"><span>Inventory Sync</span><Button variant="outline">Connect</Button></div>
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
                    <p className="py-16 text-center text-muted-foreground">Please log in to view your profile.</p>
                </CardContent>
            </Card>
        );
    }
    
    // Assuming the user is a vendor and has one store for this example
    const userProfile = userProfiles.find(p => p.id === user.uid);
    const userStore = stores[0]; 

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 p-4 md:p-6 animate-fade-in-up">
            {/* Left Sidebar */}
            <div className="md:col-span-1 space-y-8">
                <Card className="hover:shadow-lg hover:scale-[1.02] transition-all">
                    <CardContent className="p-6 text-center">
                        <Avatar className="w-24 h-24 mx-auto mb-4 border-2 border-primary">
                            <AvatarImage src={user.photoURL || `https://avatar.vercel.sh/${user.uid}.png`} alt={user.displayName || ''} />
                            <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <h2 className="text-xl font-bold">{user.displayName}</h2>
                        <Badge variant="secondary" className="mt-2">Vendor</Badge>
                        <div className="flex justify-center items-center gap-1 mt-2">
                            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                            <span className="font-semibold">4.8</span>
                            <span className="text-sm text-muted-foreground">(1.2k)</span>
                        </div>
                        <div className="mt-6 flex flex-col gap-2">
                            <Button>Edit Profile</Button>
                            <Button variant="outline">View Store</Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Performance Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-2 text-center">
                        <Card className="p-2"><p className="font-bold">{formatCurrency(12450)}</p><p className="text-xs text-muted-foreground">Sales</p></Card>
                        <Card className="p-2"><p className="font-bold">{products.length}</p><p className="text-xs text-muted-foreground">Products</p></Card>
                        <Card className="p-2"><p className="font-bold">1.2K</p><p className="text-xs text-muted-foreground">Followers</p></Card>
                    </CardContent>
                </Card>
            </div>

            {/* Right Content */}
            <div className="md:col-span-3">
                <Tabs defaultValue="profile" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="profile"><UserIcon className="w-4 h-4 mr-2" />Profile Info</TabsTrigger>
                        <TabsTrigger value="store"><ShoppingBag className="w-4 h-4 mr-2" />My Store</TabsTrigger>
                        <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-2" />Settings</TabsTrigger>
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
