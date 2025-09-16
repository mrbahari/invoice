
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Customer, Product, Category, InvoiceItem, UnitOfMeasurement, Invoice } from '@/lib/definitions';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Trash2, Search, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { categories, invoices, customers } from '@/lib/data';

type InvoiceItemState = {
  product: Product;
  quantity: number;
  unit: UnitOfMeasurement;
};

const unitsOfMeasurement: UnitOfMeasurement[] = ['عدد', 'متر طول', 'متر مربع', 'بسته'];

type InvoiceEditorProps = {
    customers: Customer[];
    products: Product[];
    invoice?: Invoice;
}

export function InvoiceEditor({ customers: initialCustomersProp, products, invoice }: InvoiceEditorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEditMode = !!invoice;

  const [customerList, setCustomerList] = useState<Customer[]>(initialCustomersProp);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(
    isEditMode ? customerList.find(c => c.id === invoice.customerId) : undefined
  );
  
  const [items, setItems] = useState<InvoiceItemState[]>(() => {
    if (!isEditMode || !invoice) {
        return [];
    }
    return invoice.items.map(item => {
        const product = products.find(p => p.id === item.productId);
        if (!product) return null;
        return {
          product,
          quantity: item.quantity,
          unit: item.unit,
        }
      }).filter((item): item is InvoiceItemState => item !== null);
  });
  
  const [description, setDescription] = useState(invoice?.description || '');
  const [discount, setDiscount] = useState(invoice?.discount || 0);
  const [tax, setTax] = useState(invoice && invoice.subtotal > 0 ? (invoice.tax / (invoice.subtotal - invoice.discount)) * 100 : 0);
  
  const [isProcessing, setIsProcessing] = useState(false);

  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => selectedCategory === 'all' || p.categoryId === selectedCategory)
      .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));
  }, [products, productSearch, selectedCategory]);

  const filteredCustomers = useMemo(() =>
    customerList.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase())),
    [customerList, customerSearch]
  );
  
  const handleAddNewCustomer = () => {
    const newCustomer: Customer = {
        id: `cust-${Math.random().toString(36).substr(2, 9)}`,
        name: customerSearch,
        email: 'ایمیل ثبت نشده',
        phone: 'شماره ثبت نشده',
        address: 'آدرس ثبت نشده',
        purchaseHistory: 'مشتری جدید',
    };
    setCustomerList(prev => [...prev, newCustomer]);
    setSelectedCustomer(newCustomer);
    setCustomerSearch(''); // Clear search after adding
    toast({ title: 'مشتری جدید اضافه شد', description: `${newCustomer.name} به لیست مشتریان شما اضافه شد.`});
  };

  const subtotal = useMemo(
    () => items.reduce((acc, item) => acc + item.product.price * item.quantity, 0),
    [items]
  );

  const taxAmount = useMemo(() => {
    const discountedSubtotal = subtotal - discount;
    return discountedSubtotal * (tax / 100);
  }, [subtotal, discount, tax]);

  const total = useMemo(() => {
    return subtotal - discount + taxAmount;
  }, [subtotal, discount, taxAmount]);

  const handleAddProduct = (product: Product) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.product.id === product.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { product, quantity: 1, unit: 'عدد' }];
    });
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
        handleRemoveItem(productId);
        return;
    };
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleUnitChange = (productId: string, newUnit: UnitOfMeasurement) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId ? { ...item, unit: newUnit } : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.product.id !== productId));
  };

  const handleProcessInvoice = () => {
    if (!selectedCustomer) {
      toast({ variant: 'destructive', title: 'مشتری انتخاب نشده است', description: 'لطفاً یک مشتری برای این فاکتور انتخاب کنید.' });
      return;
    }
    if (items.length === 0) {
      toast({ variant: 'destructive', title: 'فاکتور خالی است', description: 'لطفاً حداقل یک محصول به فاکتور اضافه کنید.' });
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
        if (isEditMode) {
            // Update existing invoice
            const invoiceIndex = invoices.findIndex(inv => inv.id === invoice.id);
            if (invoiceIndex > -1) {
                invoices[invoiceIndex] = {
                    ...invoices[invoiceIndex],
                    customerId: selectedCustomer.id,
                    customerName: selectedCustomer.name,
                    customerEmail: selectedCustomer.email,
                    items: items.map(item => ({
                        productId: item.product.id,
                        productName: item.product.name,
                        quantity: item.quantity,
                        unit: item.unit,
                        unitPrice: item.product.price,
                        totalPrice: item.product.price * item.quantity,
                    })),
                    subtotal,
                    discount,
                    tax: taxAmount,
                    total,
                    description: description || 'فاکتور ویرایش شده',
                };
            }
             toast({ title: 'فاکتور با موفقیت ویرایش شد', description: `فاکتور شماره ${invoice.invoiceNumber} به‌روزرسانی شد.` });
        } else {
            // Create new invoice
            const newInvoice: Invoice = {
                id: `inv-${Math.random().toString(36).substr(2, 9)}`,
                invoiceNumber: `HIS-${(invoices.length + 1).toString().padStart(3, '0')}`,
                customerId: selectedCustomer.id,
                customerName: selectedCustomer.name,
                customerEmail: selectedCustomer.email,
                date: new Date().toISOString(),
                status: 'Pending',
                items: items.map(item => ({
                    productId: item.product.id,
                    productName: item.product.name,
                    quantity: item.quantity,
                    unit: item.unit,
                    unitPrice: item.product.price,
                    totalPrice: item.product.price * item.quantity,
                })),
                subtotal,
                discount,
                tax: taxAmount,
                total,
                description: description || 'فاکتور ایجاد شده',
            };
            invoices.unshift(newInvoice);
            toast({ title: 'فاکتور با موفقیت ایجاد شد', description: `فاکتور شماره ${newInvoice.invoiceNumber} ایجاد شد.` });
        }
        
        const customerExists = customers.some(c => c.id === selectedCustomer.id);
        if (!customerExists) {
            customers.push(selectedCustomer);
        }

        setIsProcessing(false);
        router.push('/dashboard/invoices');
    }, 1000);
  };


  return (
    <div className="grid gap-4 md:gap-8 lg:grid-cols-3">
      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>{isEditMode ? `ویرایش فاکتور ${invoice.invoiceNumber}` : 'فاکتور جدید'}</CardTitle>
            <CardDescription>
                اقلام فاکتور، توضیحات و جزئیات پرداخت را ویرایش کنید.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] hidden md:table-cell">تصویر</TableHead>
                  <TableHead>محصول</TableHead>
                  <TableHead className="w-[110px]">واحد</TableHead>
                  <TableHead className="w-[100px] text-center">تعداد</TableHead>
                  <TableHead className="w-[120px] text-left">قیمت واحد</TableHead>
                  <TableHead className="w-[120px] text-left">جمع کل</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length > 0 ? (
                  items.map((item) => (
                    <TableRow key={item.product.id}>
                      <TableCell className="hidden md:table-cell">
                        <Image
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            width={64}
                            height={64}
                            className="rounded-md object-cover"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{item.product.name}</TableCell>
                      <TableCell>
                          <Select
                            value={item.unit}
                            onValueChange={(value: UnitOfMeasurement) => handleUnitChange(item.product.id, value)}
                          >
                            <SelectTrigger className="w-[100px]">
                              <SelectValue placeholder="واحد" />
                            </SelectTrigger>
                            <SelectContent>
                              {unitsOfMeasurement.map(unit => (
                                <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.product.id, parseInt(e.target.value, 10))}
                          className="w-20 text-center mx-auto"
                        />
                      </TableCell>
                      <TableCell className="text-left">{formatCurrency(item.product.price)}</TableCell>
                      <TableCell className="text-left">{formatCurrency(item.product.price * item.quantity)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.product.id)}>
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      برای افزودن محصول به این فاکتور، از لیست محصولات انتخاب کنید.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="grid gap-2">
                <div className="flex justify-between items-center">
                    <Label htmlFor="description">توضیحات</Label>
                </div>
                <Textarea id="description" placeholder="فاکتور برای..." value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>پرداخت</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="discount">تخفیف (تومان)</Label>
                    <Input id="discount" type="number" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tax">مالیات (%)</Label>
                    <Input id="tax" type="number" value={tax} onChange={(e) => setTax(parseFloat(e.target.value) || 0)} />
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span>جمع جزء</span>
                        <span>{formatCurrency(subtotal)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between">
                          <span>تخفیف</span>
                          <span className="text-destructive">-{formatCurrency(discount)}</span>
                      </div>
                    )}
                    {tax > 0 && (
                      <div className="flex justify-between">
                          <span>مالیات ({tax}%)</span>
                          <span>{formatCurrency(taxAmount)}</span>
                      </div>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between font-semibold text-base pt-2">
                        <span>جمع کل</span>
                        <span>{formatCurrency(total)}</span>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full" onClick={handleProcessInvoice} disabled={isProcessing}>
                    {isProcessing ? (isEditMode ? 'در حال ذخیره...' : 'در حال ایجاد...') : (isEditMode ? 'ذخیره تغییرات' : 'ایجاد فاکتور')}
                </Button>
            </CardFooter>
        </Card>
      </div>

      <div className="grid auto-rows-max items-start gap-4 md:gap-8">
        <Card>
            <CardHeader>
                <CardTitle>مشتریان</CardTitle>
                <CardDescription>یک مشتری برای این فاکتور انتخاب کنید.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <div className="relative">
                    <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="جستجو یا افزودن مشتری..." className="pr-8" value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} />
                </div>
                 {selectedCustomer && (
                     <Card className="bg-muted/50">
                        <CardContent className="p-3 flex items-center gap-3">
                             <Avatar className="h-9 w-9">
                                <AvatarImage src={`https://picsum.photos/seed/${selectedCustomer.id}/36/36`} alt="آواتار" />
                                <AvatarFallback>{selectedCustomer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <p className="text-sm font-medium">{selectedCustomer.name}</p>
                                <p className="text-xs text-muted-foreground">{selectedCustomer.email}</p>
                            </div>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setSelectedCustomer(undefined)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </CardContent>
                     </Card>
                )}
                <ScrollArea className="h-48">
                    <div className="grid gap-2">
                    {filteredCustomers.map(customer => (
                        <Button
                            key={customer.id}
                            variant={selectedCustomer?.id === customer.id ? 'secondary' : 'ghost'}
                            className="justify-start"
                            onClick={() => setSelectedCustomer(customer)}
                            disabled={!!selectedCustomer}
                        >
                            {customer.name}
                        </Button>
                    ))}
                     {filteredCustomers.length === 0 && customerSearch && !selectedCustomer && (
                        <Button
                            variant="ghost"
                            className="justify-start"
                            onClick={handleAddNewCustomer}
                        >
                           <PlusCircle className="ml-2 h-4 w-4" />
                           افزودن مشتری جدید: "{customerSearch}"
                        </Button>
                    )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>محصولات</CardTitle>
                <CardDescription>یک محصول برای افزودن به فاکتور انتخاب کنید.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="جستجوی محصول..." className="pr-8" value={productSearch} onChange={e => setProductSearch(e.target.value)} />
                    </div>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                            <SelectValue placeholder="انتخاب دسته‌بندی" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">همه دسته‌بندی‌ها</SelectItem>
                            {categories.map((cat: Category) => (
                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <ScrollArea className="h-96">
                    <div className="grid gap-4">
                    {filteredProducts.map(product => (
                        <div key={product.id} className="flex items-center gap-4">
                            <Image
                                src={product.imageUrl}
                                alt={product.name}
                                width={64}
                                height={64}
                                className="rounded-md object-cover"
                            />
                            <div className="flex-1 text-sm">
                                <p className="font-medium">{product.name}</p>
                                <p className="text-muted-foreground">{formatCurrency(product.price)}</p>
                            </div>
                            <Button size="icon" variant="outline" onClick={() => handleAddProduct(product)}>
                                <PlusCircle className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
