
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
import { PlusCircle, Trash2, Search, X, Eye, ArrowRight, Save, GripVertical } from 'lucide-react';
import { formatCurrency, getStorePrefix } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { useData } from '@/context/data-context';

type InvoiceEditorProps = {
    invoiceId?: string;
    initialData?: Omit<Invoice, 'id'>;
    onSave: (invoiceId: string) => void;
    onCancel: () => void;
    onSaveAndPreview: (invoiceId: string) => void;
}

const useIsClient = () => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);
  return isClient;
};

export function InvoiceEditor({ invoiceId, initialData, onSave, onCancel, onSaveAndPreview }: InvoiceEditorProps) {
  const { data, setData } = useData();
  const { customers: customerList, products, categories, invoices, units: unitsOfMeasurement } = data;
  const { toast } = useToast();
  const isClient = useIsClient();

  const isEditMode = !!invoiceId;
  const originalInvoice = useMemo(() => invoices.find(inv => inv.id === invoiceId), [invoices, invoiceId]);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(undefined);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [description, setDescription] = useState('');
  const [overallDiscount, setOverallDiscount] = useState(0);
  const [additions, setAdditions] = useState(0);
  const [tax, setTax] = useState(0);
  const [status, setStatus] = useState<InvoiceStatus>('Pending');

  const [isProcessing, setIsProcessing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const dataToLoad = isEditMode ? originalInvoice : initialData;
    if (dataToLoad) {
      if ('customerId' in dataToLoad && dataToLoad.customerId) {
        setSelectedCustomer(customerList.find(c => c.id === dataToLoad.customerId));
      }
      setItems(dataToLoad.items || []);
      setDescription(dataToLoad.description || '');
      setOverallDiscount(dataToLoad.discount || 0);
      setAdditions(dataToLoad.additions || 0);
      const sub = dataToLoad.subtotal || 0;
      const disc = dataToLoad.discount || 0;
      setTax(sub - disc > 0 ? (dataToLoad.tax / (sub - disc)) * 100 : 0);
      setStatus(dataToLoad.status || 'Pending');
    }
  }, [originalInvoice, initialData, customerList, isEditMode]);

  const { subtotal, taxAmount, total } = useMemo(() => {
    const sub = items.reduce((acc, item) => acc + item.totalPrice, 0);
    const disc = overallDiscount;
    const totalBeforeTax = sub - disc;
    const taxAmt = totalBeforeTax * (tax / 100);
    const total = totalBeforeTax + taxAmt + additions;
    return { subtotal: sub, taxAmount: taxAmt, total };
  }, [items, overallDiscount, tax, additions]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));
  }, [products, productSearch]);

  const filteredCustomers = useMemo(() => {
    return customerList.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()));
  }, [customerList, customerSearch]);

  const handleAddProduct = (product: Product) => {
    setItems(prev => {
      const existingItem = prev.find(item => item.productId === product.id && item.unit === product.unit);
      if (existingItem) {
        return prev.map(item =>
          item.productId === product.id && item.unit === product.unit
            ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
            : item
        );
      }
      const newItem: InvoiceItem = {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unit: product.unit,
        unitPrice: product.price,
        totalPrice: product.price,
      };
      return [...prev, newItem];
    });
  };

  const handleItemChange = (productId: string, unit: string, field: 'quantity' | 'unitPrice', value: number) => {
    setItems(prev => prev.map(item => {
      if (item.productId === productId && item.unit === unit) {
        const newItem = { ...item, [field]: value };
        newItem.totalPrice = newItem.quantity * newItem.unitPrice;
        return newItem;
      }
      return item;
    }));
  };

  const handleUnitChange = (productId: string, oldUnit: string, newUnit: string) => {
    setItems(prev => {
      const product = products.find(p => p.id === productId);
      if (!product) return prev;

      const unitPrice = newUnit === product.subUnit ? (product.subUnitPrice || 0) : product.price;

      return prev.map(item => {
        if (item.productId === productId && item.unit === oldUnit) {
          const newItem = { ...item, unit: newUnit, unitPrice };
          newItem.totalPrice = newItem.quantity * newItem.unitPrice;
          return newItem;
        }
        return item;
      });
    });
  };

  const handleRemoveItem = (productId: string, unit: string) => {
    setItems(prev => prev.filter(item => !(item.productId === productId && item.unit === unit)));
  };

  const handleProcessInvoice = async (andPreview: boolean = false) => {
    if (!selectedCustomer) {
      toast({ variant: 'destructive', title: 'مشتری انتخاب نشده است' });
      return;
    }
    if (items.length === 0) {
      toast({ variant: 'destructive', title: 'فاکتور خالی است' });
      return;
    }
    
    setIsProcessing(true);

    const invoiceData = {
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerEmail: selectedCustomer.email,
      date: originalInvoice?.date || new Date().toISOString(),
      status,
      items,
      subtotal,
      discount: overallDiscount,
      additions,
      tax: taxAmount,
      total,
      description,
      invoiceNumber: originalInvoice?.invoiceNumber || `${getStorePrefix('INV')}-${(invoices.length + 1548).toString().padStart(3, '0')}`,
    };

    let processedId: string;

    if (isEditMode && originalInvoice) {
      processedId = originalInvoice.id;
      setData(prev => ({
        ...prev,
        invoices: prev.invoices.map(inv => inv.id === processedId ? { ...invoiceData, id: processedId } : inv)
      }));
      toast({ variant: 'success', title: 'فاکتور ویرایش شد' });
    } else {
      processedId = `inv-${Math.random().toString(36).substr(2, 9)}`;
      setData(prev => ({
        ...prev,
        invoices: [{ ...invoiceData, id: processedId }, ...prev.invoices]
      }));
      toast({ variant: 'success', title: 'فاکتور ایجاد شد' });
    }

    setIsProcessing(false);
    if (andPreview) {
      onSaveAndPreview(processedId);
    } else {
      onSave(processedId);
    }
  };
  
   const handleDeleteInvoice = () => {
    if (!originalInvoice) return;
    setData(prev => ({ ...prev, invoices: prev.invoices.filter(inv => inv.id !== originalInvoice.id) }));
    toast({ title: 'فاکتور حذف شد' });
    onCancel();
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const reorderedItems = Array.from(items);
    const [removed] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, removed);
    setItems(reorderedItems);
  };
  
   return (
    <>
    <div className="grid gap-4 md:gap-8 lg:grid-cols-3">
        <div className="grid auto-rows-max items-start gap-4 md:gap-8">
             <Card className="animate-fade-in-up">
                <CardHeader>
                    <CardTitle>محصولات</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="relative">
                        <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="جستجوی محصول..." className="pr-8" value={productSearch} onChange={e => setProductSearch(e.target.value)} />
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
                                        <Image src={product.imageUrl} alt={product.name} fill className="rounded-md object-cover" />
                                    </div>
                                    <h3 className="text-xs font-semibold truncate text-center">{product.name}</h3>
                                </CardContent>
                            </Card>
                        ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            <Card className="animate-fade-in-up">
                <CardHeader>
                    <CardTitle>مشتریان</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="relative">
                        <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="جستجوی مشتری..." className="pr-8" value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} />
                    </div>
                    {selectedCustomer && (
                        <Card className="bg-muted/50">
                            <CardContent className="p-3 flex items-center gap-3">
                                <Avatar className="h-9 w-9"><AvatarImage src={selectedCustomer.avatarUrl} /><AvatarFallback>{selectedCustomer.name[0]}</AvatarFallback></Avatar>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">{selectedCustomer.name}</p>
                                    <p className="text-xs text-muted-foreground">{selectedCustomer.phone}</p>
                                </div>
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setSelectedCustomer(undefined)}><X className="h-4 w-4" /></Button>
                            </CardContent>
                        </Card>
                    )}
                    <ScrollArea className="h-48">
                        <div className="grid gap-2">
                            {filteredCustomers.map(customer => (
                                <Button key={customer.id} variant={selectedCustomer?.id === customer.id ? 'secondary' : 'ghost'} className="justify-start" onClick={() => setSelectedCustomer(customer)} disabled={!!selectedCustomer}>
                                    {customer.name}
                                </Button>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>

        <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
            <Card className="animate-fade-in-up">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>{isEditMode ? `ویرایش فاکتور ${originalInvoice?.invoiceNumber}` : 'فاکتور جدید'}</CardTitle>
                    </div>
                    <Button type="button" variant="ghost" onClick={onCancel}><ArrowRight className="ml-2 h-4 w-4" />انصراف</Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>نام کالا</TableHead>
                                <TableHead className="w-[110px]">واحد</TableHead>
                                <TableHead className="w-[100px] text-center">مقدار</TableHead>
                                <TableHead className="w-[120px] text-left">قیمت</TableHead>
                                <TableHead className="w-[120px] text-left">جمع کل</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        {isClient ? (
                        <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable droppableId="invoice-items">
                            {(provided) => (
                                <TableBody ref={provided.innerRef} {...provided.droppableProps}>
                                {items.length > 0 ? items.map((item, index) => {
                                    const product = products.find(p => p.id === item.productId);
                                    const availableUnits = [product?.unit];
                                    if (product?.subUnit) availableUnits.push(product.subUnit);

                                    return (
                                    <Draggable key={`${item.productId}-${item.unit}`} draggableId={`${item.productId}-${item.unit}`} index={index}>
                                        {(provided) => (
                                        <TableRow ref={provided.innerRef} {...provided.draggableProps}>
                                            <TableCell {...provided.dragHandleProps} className="cursor-grab"><GripVertical className="h-5 w-5 text-muted-foreground" /></TableCell>
                                            <TableCell className="font-medium">{item.productName}</TableCell>
                                            <TableCell>
                                            <Select value={item.unit} onValueChange={(newUnit) => handleUnitChange(item.productId, item.unit, newUnit)}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                {availableUnits.filter(u => u).map(u => <SelectItem key={u} value={u!}>{u}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Input type="number" value={item.quantity} onChange={(e) => handleItemChange(item.productId, item.unit, 'quantity', parseFloat(e.target.value))} className="w-full text-center" />
                                            </TableCell>
                                            <TableCell className="text-left">{formatCurrency(item.unitPrice)}</TableCell>
                                            <TableCell className="text-left">{formatCurrency(item.totalPrice)}</TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.productId, item.unit)}><Trash2 className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                        )}
                                    </Draggable>
                                    );
                                }) : (
                                    <TableRow><TableCell colSpan={7} className="text-center py-10">محصولی اضافه نشده است.</TableCell></TableRow>
                                )}
                                {provided.placeholder}
                                </TableBody>
                            )}
                            </Droppable>
                        </DragDropContext>
                        ) : (
                             <TableBody><TableRow><TableCell colSpan={7} className="text-center py-10">در حال بارگذاری...</TableCell></TableRow></TableBody>
                        )}
                    </Table>
                </div>
                <div className="grid gap-2 mt-6">
                    <Label htmlFor="description">توضیحات</Label>
                    <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
            </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>پرداخت</CardTitle></CardHeader>
                <CardContent className="grid gap-4">
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="grid gap-2"><Label htmlFor="additions">اضافات</Label><Input id="additions" type="number" value={additions} onChange={(e) => setAdditions(parseFloat(e.target.value) || 0)} /></div>
                        <div className="grid gap-2"><Label htmlFor="discount">تخفیف</Label><Input id="discount" type="number" value={overallDiscount} onChange={(e) => setOverallDiscount(parseFloat(e.target.value) || 0)} /></div>
                        <div className="grid gap-2"><Label htmlFor="tax">مالیات (%)</Label><Input id="tax" type="number" value={tax} onChange={(e) => setTax(parseFloat(e.target.value) || 0)} /></div>
                    </div>
                     <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span>جمع جزء</span><span>{formatCurrency(subtotal)}</span></div>
                        {overallDiscount > 0 && <div className="flex justify-between"><span>تخفیف</span><span className="text-destructive">-{formatCurrency(overallDiscount)}</span></div>}
                        {additions > 0 && <div className="flex justify-between"><span>اضافات</span><span>{formatCurrency(additions)}</span></div>}
                        {tax > 0 && <div className="flex justify-between"><span>مالیات ({tax}%)</span><span>{formatCurrency(taxAmount)}</span></div>}
                        <Separator className="my-2" />
                        <div className="flex justify-between font-semibold text-base pt-2"><span>جمع کل</span><span>{formatCurrency(total)}</span></div>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
    <div className="sticky bottom-0 z-50 p-4 bg-card border-t mt-4 lg:col-span-3">
        <div className="max-w-5xl mx-auto flex flex-col-reverse sm:flex-row justify-between items-center gap-4">
            <div className="w-full sm:w-auto">
            {isEditMode && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button type="button" variant="destructive" className="w-full" disabled={isProcessing}><Trash2 className="ml-2 h-4 w-4" />حذف فاکتور</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>آیا مطمئن هستید؟</AlertDialogTitle><AlertDialogDescription>این عمل غیرقابل بازگشت است.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>انصراف</AlertDialogCancel><AlertDialogAction onClick={handleDeleteInvoice} className='bg-destructive hover:bg-destructive/90'>حذف</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto">
                {isEditMode && (
                    <div className="grid gap-2">
                        <Label htmlFor="status" className="sr-only">وضعیت</Label>
                        <Select value={status} onValueChange={(value: InvoiceStatus) => setStatus(value)}>
                            <SelectTrigger id="status" className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="Pending">در انتظار</SelectItem><SelectItem value="Paid">پرداخت شده</SelectItem><SelectItem value="Overdue">سررسید گذشته</SelectItem></SelectContent>
                        </Select>
                    </div>
                )}
                <Button onClick={() => handleProcessInvoice(true)} variant="outline" size="lg" className="flex-1"><Eye className="ml-2 h-4 w-4" />پیش‌نمایش</Button>
                <Button onClick={() => handleProcessInvoice(false)} size="lg" className="w-full sm:w-auto flex-1 bg-green-600 hover:bg-green-700"><Save className="ml-2 h-4 w-4" />{isEditMode ? 'ذخیره تغییرات' : 'ایجاد فاکتور'}</Button>
            </div>
        </div>
    </div>
    </>
  );
}
