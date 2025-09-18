
'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Customer, Product, Category, InvoiceItem, UnitOfMeasurement, Invoice, InvoiceStatus } from '@/lib/definitions';
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
import { PlusCircle, Trash2, Search, X, Eye, Copy, ArrowRight, Save, GripVertical } from 'lucide-react';
import { formatCurrency, getStorePrefix } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { initialData } from '@/lib/data';
import { useLocalStorage } from '@/hooks/use-local-storage';
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
import { DragDropContext, Droppable, Draggable, type DropResult } from 'react-beautiful-dnd';

const useIsClient = () => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  return isClient;
};

type InvoiceItemState = {
  product: Product;
  quantity: number;
  unit: string;
};

type InvoiceEditorProps = {
    invoice?: Invoice;
    onCancel: () => void;
    onSaveAndPreview: (invoiceId: string) => void;
}

export function InvoiceEditor({ invoice, onCancel, onSaveAndPreview }: InvoiceEditorProps) {
  const { toast } = useToast();
  const isEditMode = !!invoice;
  const isClient = useIsClient();

  const [customerList, setCustomerList, reloadCustomers] = useLocalStorage<Customer[]>('customers', initialData.customers);
  const [products, , reloadProducts] = useLocalStorage<Product[]>('products', initialData.products);
  const [categories] = useLocalStorage<Category[]>('categories', initialData.categories);
  const [invoices, setInvoices] = useLocalStorage<Invoice[]>('invoices', initialData.invoices);
  const [unitsOfMeasurement] = useLocalStorage<UnitOfMeasurement[]>('units', initialData.units);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(undefined);
  
  const [items, setItems] = useState<InvoiceItemState[]>([]);
  
  const [description, setDescription] = useState(invoice?.description || '');
  const [overallDiscount, setOverallDiscount] = useState(invoice?.discount || 0);
  const [additions, setAdditions] = useState(invoice?.additions || 0);
  const [tax, setTax] = useState(invoice && invoice.subtotal > 0 ? (invoice.tax / (invoice.subtotal - invoice.discount)) * 100 : 0);
  const [status, setStatus] = useState<InvoiceStatus>(invoice?.status || 'Pending');

  const [isProcessing, setIsProcessing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);


  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Track changes to mark the form as dirty
  useEffect(() => {
    if (!isEditMode) {
      // For new invoices, any item or customer selection makes it dirty
      if (items.length > 0 || selectedCustomer) {
        setIsDirty(true);
      }
      return;
    }

    if (!invoice) return;

    const originalItemsOrder = invoice.items.map(i => ({ p: i.productId, q: i.quantity, u: i.unit }));
    const currentItemsOrder = items.map(i => ({ p: i.product.id, q: i.quantity, u: i.unit }));

    // Compare initial state with current state for edit mode
    const itemsChanged = JSON.stringify(currentItemsOrder) !== JSON.stringify(originalItemsOrder);
    const customerChanged = selectedCustomer?.id !== invoice.customerId;
    const descriptionChanged = description !== invoice.description;
    const discountChanged = overallDiscount !== invoice.discount;
    const additionsChanged = additions !== (invoice.additions || 0);
    const taxChanged = tax !== (invoice.subtotal > 0 ? (invoice.tax / (invoice.subtotal - invoice.discount)) * 100 : 0);
    const statusChanged = status !== invoice.status;

    if (itemsChanged || customerChanged || descriptionChanged || discountChanged || additionsChanged || taxChanged || statusChanged) {
      setIsDirty(true);
    } else {
      setIsDirty(false);
    }
  }, [items, selectedCustomer, description, overallDiscount, additions, tax, status, invoice, isEditMode]);


  useEffect(() => {
    reloadProducts();
    reloadCustomers();
  }, [reloadProducts, reloadCustomers]);
  
  useEffect(() => {
    if (isEditMode && invoice && customerList.length > 0 && !selectedCustomer) {
      const customerForInvoice = customerList.find(c => c.id === invoice.customerId);
      setSelectedCustomer(customerForInvoice);
    }
  }, [invoice, isEditMode, customerList, selectedCustomer]);

  useEffect(() => {
    if (isEditMode && invoice && products.length > 0 && items.length === 0) {
        const initialItems = invoice.items.map(item => {
            const product = products.find(p => p.id === item.productId);
            if (!product) return null;
            return {
                product,
                quantity: item.quantity,
                unit: item.unit,
            };
        }).filter((item): item is InvoiceItemState => item !== null);
        setItems(initialItems);
    }
  }, [invoice, isEditMode, products, items.length]);



  const filteredProducts = useMemo(() => {
    return products
      .filter(p => selectedCategory === 'all' || p.categoryId === selectedCategory)
      .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));
  }, [products, productSearch, selectedCategory]);

  const filteredCustomers = useMemo(() =>
    customerList.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase())),
    [customerList, customerSearch]
  );
  
  const getUnitPrice = (item: InvoiceItemState): number => {
      if (item.unit === item.product.subUnit && item.product.subUnitPrice !== undefined) {
          return item.product.subUnitPrice;
      }
      return item.product.price;
  };

  const handleAddNewCustomer = () => {
    const customerName = customerSearch.trim() || `مشتری جدید ${Math.floor(Math.random() * 1000)}`;
    const newCustomer: Customer = {
        id: `cust-${Math.random().toString(36).substr(2, 9)}`,
        name: customerName,
        email: 'ایمیل ثبت نشده',
        phone: 'شماره ثبت نشده',
        address: 'آدرس ثبت نشده',
        purchaseHistory: 'مشتری جدید',
    };
    setCustomerList(prev => [newCustomer, ...prev]);
    setSelectedCustomer(newCustomer);
    setCustomerSearch('');
    toast({ title: 'مشتری جدید اضافه شد', description: `${newCustomer.name} به لیست مشتریان شما اضافه شد.`});
  };

  const calculateItemTotal = (item: InvoiceItemState): number => {
    const unitPrice = getUnitPrice(item);
    return item.quantity * unitPrice;
  };

  const subtotal = useMemo(
    () => items.reduce((acc, item) => acc + (item.quantity * getUnitPrice(item)), 0),
    [items]
  );

  const totalBeforeTax = subtotal - overallDiscount;

  const taxAmount = useMemo(() => {
    return totalBeforeTax * (tax / 100);
  }, [totalBeforeTax, tax]);

  const total = useMemo(() => {
    return totalBeforeTax + taxAmount + additions;
  }, [totalBeforeTax, taxAmount, additions]);

  const handleAddProduct = (product: Product) => {
    const initialQuantity = 1;

    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.product.id === product.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + initialQuantity } : item
        );
      }
      return [...prevItems, { product, quantity: initialQuantity, unit: product.unit }];
    });
  };
  
  const handleItemFieldChange = (productId: string, field: 'quantity', value: number) => {
    if (value < 0) return;

    if (field === 'quantity' && value === 0) {
        handleRemoveItem(productId);
        return;
    }

    setItems(prevItems => prevItems.map(item =>
        item.product.id === productId ? { ...item, [field]: value } : item
    ));
  };


  const handleUnitChange = (productId: string, newUnit: string) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId ? { ...item, unit: newUnit } : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.product.id !== productId));
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const reorderedItems = Array.from(items);
    const [removed] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, removed);

    setItems(reorderedItems);
  };
  
  const categoriesById = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  const getRootParent = (categoryId: string): Category | undefined => {
    let current = categoriesById.get(categoryId);
    while (current && current.parentId) {
      const parent = categoriesById.get(current.parentId);
      if (!parent) return current;
      current = parent;
    }
    return current;
  };


  const handleProcessInvoice = (navigateToPreview: boolean = false) => {
    if (!selectedCustomer) {
      toast({ variant: 'destructive', title: 'مشتری انتخاب نشده است', description: 'لطفاً یک مشتری برای این فاکتور انتخاب کنید.' });
      return;
    }
    if (items.length === 0) {
      toast({ variant: 'destructive', title: 'فاکتور خالی است', description: 'لطفاً حداقل یک محصول به فاکتور اضافه کنید.' });
      return;
    }

    setIsProcessing(true);

    const invoiceItems: InvoiceItem[] = items.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: getUnitPrice(item),
        totalPrice: calculateItemTotal(item),
    }));
    
    const finalSubtotal = invoiceItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const finalTotal = finalSubtotal - overallDiscount + (totalBeforeTax * (tax/100)) + additions;

    let processedInvoiceId = '';

    if (isEditMode && invoice) {
        processedInvoiceId = invoice.id;
        const updatedInvoice: Invoice = {
            ...invoice,
            customerId: selectedCustomer.id,
            customerName: selectedCustomer.name,
            customerEmail: selectedCustomer.email,
            items: invoiceItems,
            subtotal: finalSubtotal,
            discount: overallDiscount,
            additions: additions,
            tax: taxAmount,
            total: finalTotal,
            description: description || 'فاکتور ویرایش شده',
            status,
        };
        setInvoices(prev => prev.map(inv => inv.id === invoice.id ? updatedInvoice : inv));
          toast({ title: 'فاکتور با موفقیت ویرایش شد', description: `فاکتور شماره ${invoice.invoiceNumber} به‌روزرسانی شد.` });
    } else {
        const firstItemCategory = items[0].product.categoryId ? getRootParent(items[0].product.categoryId) : undefined;
        const storeName = firstItemCategory?.storeName || 'Store';
        const prefix = getStorePrefix(storeName);

        const newInvoice: Invoice = {
            id: `inv-${Math.random().toString(36).substr(2, 9)}`,
            invoiceNumber: `${prefix}-${(invoices.length + 1546).toString().padStart(3, '0')}`,
            customerId: selectedCustomer.id,
            customerName: selectedCustomer.name,
            customerEmail: selectedCustomer.email,
            date: new Date().toISOString(),
            status: 'Pending',
            items: invoiceItems,
            subtotal: finalSubtotal,
            discount: overallDiscount,
            additions: additions,
            tax: taxAmount,
            total: finalTotal,
            description: description || 'فاکتور ایجاد شده',
        };
        processedInvoiceId = newInvoice.id;
        setInvoices(prev => [newInvoice, ...prev]);
        toast({ title: 'فاکتور با موفقیت ایجاد شد', description: `فاکتور شماره ${newInvoice.invoiceNumber} ایجاد شد.` });
    }

    setIsProcessing(false);
    if (navigateToPreview && processedInvoiceId) {
          onSaveAndPreview(processedInvoiceId);
    } else {
          onCancel();
    }
  };
  
  const handleDeleteInvoice = () => {
    if (!invoice) return;

    setInvoices(prev => prev.filter(inv => inv.id !== invoice.id));
    toast({
        title: 'فاکتور حذف شد',
        description: `فاکتور شماره "${invoice.invoiceNumber}" با موفقیت حذف شد.`,
    });

    onCancel();
  };


  return (
    <div className="grid gap-4 md:gap-8 lg:grid-cols-3">
      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
        <Card className="animate-fade-in-up">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{isEditMode ? `ویرایش فاکتور ${invoice.invoiceNumber}` : 'فاکتور جدید'}</CardTitle>
                <CardDescription>
                    اقلام فاکتور، توضیحات و جزئیات پرداخت را ویرایش کنید.
                </CardDescription>
              </div>
               <div className='flex items-center gap-2'>
                  <Button type="button" variant="outline" onClick={onCancel}>
                    <ArrowRight className="ml-2 h-4 w-4" />
                    بازگشت به لیست
                  </Button>
                  {isDirty && (
                    <Button onClick={() => handleProcessInvoice(true)} variant="outline" size="sm" className="h-10 gap-1">
                      <Eye className="ml-2 h-3.5 w-3.5" />
                      <span>ثبت و پیش‌نمایش</span>
                    </Button>
                  )}
               </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6">
            {isClient && (
            <DragDropContext onDragEnd={handleDragEnd}>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[30px] p-2"></TableHead>
                    <TableHead className="w-[80px] hidden md:table-cell">تصویر</TableHead>
                    <TableHead>نام کالا</TableHead>
                    <TableHead className="w-[110px]">واحد</TableHead>
                    <TableHead className="w-[100px] text-center">مقدار</TableHead>
                    <TableHead className="w-[120px] text-right">قیمت</TableHead>
                    <TableHead className="w-[120px] text-right">جمع کل</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <Droppable droppableId="invoiceItems">
                    {(provided) => (
                    <TableBody ref={provided.innerRef} {...provided.droppableProps}>
                        {items.length > 0 ? (
                        items.map((item, index) => {
                            const availableUnits = [item.product.unit];
                            if (item.product.subUnit) {
                                availableUnits.push(item.product.subUnit);
                            }

                            return (
                                <Draggable key={item.product.id} draggableId={item.product.id} index={index}>
                                {(provided) => (
                                <TableRow ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                <TableCell className="p-2">
                                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                                </TableCell>
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
                                        onValueChange={(value: string) => handleUnitChange(item.product.id, value)}
                                    >
                                        <SelectTrigger className="w-[100px]">
                                        <SelectValue placeholder="واحد" />
                                        </SelectTrigger>
                                        <SelectContent>
                                        {availableUnits.map(unit => (
                                            <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                                        ))}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell>
                                    <Input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => handleItemFieldChange(item.product.id, 'quantity', parseFloat(e.target.value))}
                                    step="0.01"
                                    className="w-20 text-center mx-auto"
                                    />
                                </TableCell>
                                <TableCell className="text-right">{formatCurrency(getUnitPrice(item))}</TableCell>
                                <TableCell className="text-right">{formatCurrency(calculateItemTotal(item))}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.product.id)}>
                                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </TableCell>
                                </TableRow>
                                )}
                                </Draggable>
                            )
                            })
                        ) : (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                            برای افزودن محصول به این فاکتور، از لیست محصولات انتخاب کنید.
                            </TableCell>
                        </TableRow>
                        )}
                        {provided.placeholder}
                    </TableBody>
                    )}
                </Droppable>
                </Table>
            </DragDropContext>
            )}
            <div className="grid gap-2">
                <div className="flex justify-between items-center">
                    <Label htmlFor="description">توضیحات</Label>
                </div>
                <Textarea id="description" placeholder="فاکتور برای..." value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </CardContent>
        </Card>
        <Card className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
                <CardTitle>پرداخت</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="additions">اضافات (ریال)</Label>
                    <Input id="additions" type="number" value={additions} onChange={(e) => setAdditions(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="overall-discount">تخفیف کلی (ریال)</Label>
                    <Input id="overall-discount" type="number" value={overallDiscount} onChange={(e) => setOverallDiscount(parseFloat(e.target.value) || 0)} />
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
                    {overallDiscount > 0 && (
                      <div className="flex justify-between">
                          <span>تخفیف کلی</span>
                          <span className="text-destructive">-{formatCurrency(overallDiscount)}</span>
                      </div>
                    )}
                     {additions > 0 && (
                      <div className="flex justify-between">
                          <span>اضافات</span>
                          <span>{formatCurrency(additions)}</span>
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
            <CardFooter className="flex justify-between items-center">
                <div>
                  {isEditMode && (
                      <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button type="button" variant="destructive" disabled={isProcessing}>
                                  <Trash2 className="ml-2 h-4 w-4" />
                                  حذف فاکتور
                              </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>آیا مطمئن هستید؟</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      این عمل غیرقابل بازگشت است و فاکتور شماره «{invoice?.invoiceNumber}» را برای همیشه حذف می‌کند.
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>انصراف</AlertDialogCancel>
                                  <AlertDialogAction onClick={handleDeleteInvoice} className='bg-destructive hover:bg-destructive/90'>حذف</AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                  )}
                </div>
                
                <div className="flex items-center gap-4">
                    {isEditMode && (
                        <div className="grid gap-2">
                            <Label htmlFor="status" className="sr-only">وضعیت</Label>
                            <Select value={status} onValueChange={(value: InvoiceStatus) => setStatus(value)}>
                                <SelectTrigger id="status" className="w-[180px]">
                                    <SelectValue placeholder="تغییر وضعیت" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Pending">در انتظار</SelectItem>
                                    <SelectItem value="Paid">پرداخت شده</SelectItem>
                                    <SelectItem value="Overdue">سررسید گذشته</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <Button className="min-w-[120px]" onClick={() => handleProcessInvoice(false)} disabled={isProcessing || !isDirty}>
                        {isProcessing ? (isEditMode ? 'در حال ذخیره...' : 'در حال ایجاد...') : (isEditMode ? 'ذخیره تغییرات' : 'ایجاد فاکتور')}
                    </Button>
                </div>
            </CardFooter>
        </Card>
      </div>

      <div className="grid auto-rows-max items-start gap-4 md:gap-8">
        <Card className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
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
                    <div className="grid grid-cols-3 gap-3">
                    {filteredProducts.map(product => (
                        <Card 
                            key={product.id} 
                            onClick={() => handleAddProduct(product)}
                            className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1"
                        >
                            <CardContent className="p-2">
                                <div className="relative w-full aspect-square mb-2">
                                    <Image
                                        src={product.imageUrl}
                                        alt={product.name}
                                        fill
                                        className="rounded-md object-cover"
                                    />
                                </div>
                                <h3 className="text-xs font-semibold truncate text-center">{product.name}</h3>
                            </CardContent>
                        </Card>
                    ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>

        <Card className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
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
      </div>
    </div>
  );
}

    