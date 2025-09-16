
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { initialCategories, initialCustomers, initialInvoices, initialProducts } from '@/lib/data';
import type { Category, Customer, Invoice, Product } from '@/lib/definitions';

export default function SettingsPage() {
  const { toast } = useToast();
  
  const [, setCategories] = useLocalStorage<Category[]>('categories', initialCategories);
  const [, setCustomers] = useLocalStorage<Customer[]>('customers', initialCustomers);
  const [, setProducts] = useLocalStorage<Product[]>('products', initialProducts);
  const [, setInvoices] = useLocalStorage<Invoice[]>('invoices', initialInvoices);

  const handleResetData = () => {
    setCategories(initialCategories);
    setCustomers(initialCustomers);
    setProducts(initialProducts);
    setInvoices(initialInvoices);

    toast({
      title: 'اطلاعات بازنشانی شد',
      description: 'تمام داده‌های نمونه برنامه به حالت اولیه بازگشتند.',
    });
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>تنظیمات</CardTitle>
          <CardDescription>
            تنظیمات کلی برنامه را مدیریت کنید.
          </CardDescription>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>مدیریت داده‌ها</CardTitle>
          <CardDescription>
            عملیات مربوط به داده‌های برنامه را انجام دهید.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-semibold">بازنشانی اطلاعات برنامه</h3>
              <p className="text-sm text-muted-foreground">
                تمام داده‌های برنامه (مشتریان، محصولات، فاکتورها) به حالت اولیه بازگردانده می‌شود. این عمل غیرقابل بازگشت است.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">بازنشانی اطلاعات</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>آیا مطمئن هستید؟</AlertDialogTitle>
                  <AlertDialogDescription>
                    این عمل، تمام دسته‌بندی‌ها، محصولات، مشتریان و فاکتورهای شما را به حالت اولیه بازنشانی می‌کند.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>انصراف</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetData} className='bg-destructive hover:bg-destructive/90'>بازنشانی</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
