
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
import { PlusCircle, Trash2, Search, X, Eye, ArrowRight, Save, GripVertical, UserPlus, Pencil } from 'lucide-react';
import { formatCurrency, getStorePrefix } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
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
import { InvoiceActions } from './invoice-actions';

type InvoiceEditorProps = {
    invoiceId?: string; // Can be a new invoice (undefined) or an existing one
    initialUnsavedInvoice?: Omit<Invoice, 'id'> | null; // For invoices coming from estimators
    onSaveSuccess: (invoiceId: string) => void;
    onPreview: (invoiceId: string) => void;
    onCancel: () => void;
};


const useIsClient = () => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);
  return isClient;
};

export function InvoiceEditor({ invoiceId, initialUnsavedInvoice, onSaveSuccess, onPreview, onCancel }: InvoiceEditorProps) {
  const { data, setData } = useData();
  const { customers: customerList, products, categories, invoices, units: unitsOfMeasurement } = data;
  const { toast } = useToast();
  const isClient = useIsClient();
  
  const isEditMode = !!invoiceId;

  // Find the invoice to edit from the main data source if an ID is provided
  const invoiceToEdit = useMemo(() => 
    isEditMode ? invoices.find(inv => inv.id === invoiceId) : undefined
  , [invoices, invoiceId, isEditMode]);

  // State for the invoice being edited
  const [invoice, setInvoice] = useState<Partial<Invoice>>({});
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(undefined);
  
  // This effect initializes the form for creating a new invoice or editing an existing one
  useEffect(() => {
    if (isEditMode && invoiceToEdit) {
      // Editing an existing invoice
      setInvoice(invoiceToEdit);
      const customer = customerList.find(c => c.id === invoiceToEdit.customerId);
      setSelectedCustomer(customer);
    } else if (initialUnsavedInvoice) {
      // Creating a new invoice from an estimator
      setInvoice({
        ...initialUnsavedInvoice,
        invoiceNumber: `${getStorePrefix('INV')}-${(invoices.length + 1548).toString().padStart(3, '0')}`,
      });
      setSelectedCustomer(undefined);
    } else if (!isEditMode) {
      // Creating a brand new invoice
      setInvoice({
          date: new Date().toISOString(),
          status: 'Pending',
          items: [],
          subtotal: 0,
          discount: 0,
          additions: 0,
          tax: 0,
          total: 0,
          description: '',
          invoiceNumber: `${getStorePrefix('INV')}-${(invoices.length + 1548).toString().padStart(3, '0')}`,
      });
      setSelectedCustomer(undefined);
    }
  }, [invoiceId, invoiceToEdit, initialUnsavedInvoice, isEditMode, customerList, invoices.length]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCustomerSheetOpen, setIsCustomerSheetOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  // When customer changes, update invoice details
  useEffect(() => {
    if (selectedCustomer) {
      setInvoice(prev => ({
        ...prev,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerEmail: selectedCustomer.email
      }));
    }
  }, [selectedCustomer]);

  // Recalculate totals whenever items or financial fields change
  useEffect(() => {
    const subtotal = invoice.items?.reduce((acc, item) => acc + item.totalPrice, 0) || 0;
    const discount = Number(invoice.discount) || 0;
    const additions = Number(invoice.additions) || 0;
    const tax = Number(invoice.tax) || 0;
    const total = subtotal - discount + additions + tax;

    setInvoice(prev => ({ ...prev, subtotal, total }));
  }, [invoice.items, invoice.discount, invoice.additions, invoice.tax]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));
  }, [products, productSearch]);

  const filteredCustomers = useMemo(() => {
    if (!customerList) return [];
    return customerList.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()));
  }, [customerList, customerSearch]);

  const handleAddProduct = (product: Product) => {
    setInvoice(prev => {
      const items = prev.items ? [...prev.items] : [];
      const existingItemIndex = items.findIndex(item => item.productId === product.id && item.unit === product.unit);
      
      if (existingItemIndex > -1) {
        items[existingItemIndex].quantity += 1;
        items[existingItemIndex].totalPrice = items[existingItemIndex].quantity * items[existingItemIndex].unitPrice;
      } else {
        items.push({
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unit: product.unit,
          unitPrice: product.price,
          totalPrice: product.price,
        });
      }
      return {...prev, items};
    });
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    setInvoice(prev => {
        const items = prev.items ? [...prev.items] : [];
        if (items[index]) {
            (items[index] as any)[field] = value;
            if (field === 'quantity' || field === 'unitPrice') {
                items[index].totalPrice = (items[index].quantity || 0) * (items[index].unitPrice || 0);
            }
        }
        return { ...prev, items };
    });
  };
  
  const handleUnitChange = (index: number, newUnit: string) => {
    setInvoice(prev => {
      const items = prev.items ? [...prev.items] : [];
      const item = items[index];
      if (item) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const unitPrice = newUnit === product.subUnit ? (product.subUnitPrice || 0) : product.price;
          item.unit = newUnit;
          item.unitPrice = unitPrice;
          item.totalPrice = (item.quantity || 0) * unitPrice;
        }
      }
      return {...prev, items};
    });
  };

  const handleRemoveItem = (index: number) => {
    setInvoice(prev => ({
        ...prev,
        items: prev.items?.filter((_, i) => i !== index)
    }));
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    setInvoice(prev => {
      const items = Array.from(prev.items || []);
      const [removed] = items.splice(result.source.index, 1);
      items.splice(result.destination!.index, 0, removed);
      return {...prev, items};
    });
  };
  
  const handleProcessInvoice = (): string | null => {
    if (!selectedCustomer || !invoice.items || invoice.items.length === 0) {
      toast({ variant: 'destructive', title: 'مشتری یا آیتم‌های فاکتور انتخاب نشده است.' });
      return null;
    }
    
    setIsProcessing(true);
    let processedInvoiceId: string;

    if (isEditMode) {
        processedInvoiceId = invoiceToEdit!.id;
        const finalInvoice = { ...invoice, id: processedInvoiceId } as Invoice;
        setData(prev => ({ ...prev, invoices: prev.invoices.map(inv => inv.id === processedInvoiceId ? finalInvoice : inv) }));
        toast({ variant: 'success', title: 'فاکتور ویرایش شد' });
    } else {
        processedInvoiceId = `inv-${Math.random().toString(36).substr(2, 9)}`;
        const finalInvoice = { ...invoice, id: processedInvoiceId } as Invoice;
        setData(prev => ({ ...prev, invoices: [finalInvoice, ...prev.invoices] }));
        toast({ variant: 'success', title: 'فاکتور ایجاد شد' });
    }

    setIsProcessing(false);
    return processedInvoiceId;
  };
  
  const handleDeleteInvoice = () => {
    if (!isEditMode) return;
    setData(prev => ({ ...prev, invoices: prev.invoices.filter(inv => inv.id !== (invoiceToEdit as Invoice).id) }));
    toast({ title: 'فاکتور حذف شد' });
    onCancel();
  };

  const handleSaveAndExit = () => {
      const processedId = handleProcessInvoice();
      if (processedId) {
          onSaveSuccess(processedId);
      }
  };
  
  const handlePreviewClick = () => {
    // If it's a new invoice that hasn't been saved, save it first.
    if (!isEditMode) {
        const newId = handleProcessInvoice();
        if (newId) {
            onPreview(newId);
        }
    } else {
        // If it's an existing invoice, just save any current changes and then preview.
        const updatedId = handleProcessInvoice(); // This saves any pending changes
        if(updatedId) {
          onPreview(updatedId);
        }
    }
  };
  
   return (
    <>
    <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-5">
        <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
             <Card className="animate-fade-in-up">
                <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>محصولات</CardTitle>
                      <Button 
                          type="button" 
                          variant="outline" 
                          onClick={onCancel}
                          className="dark:bg-white dark:text-black dark:animate-pulse-slow"
                        >
                          <ArrowRight className="ml-2 h-4 w-4" />
                          بازگشت
                      </Button>
                    </div>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="relative">
                        <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="جستجوی محصول..." className="pr-8" value={productSearch} onChange={e => setProductSearch(e.target.value)} />
                    </div>
                    <ScrollArea className="h-96">
                        <div className="grid grid-cols-3 gap-3">
                        {(filteredProducts || []).map(product => (
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

            <Sheet open={isCustomerSheetOpen} onOpenChange={setIsCustomerSheetOpen}>
                <Card className="animate-fade-in-up">
                    <CardHeader>
                        <CardTitle>مشتری</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {selectedCustomer ? (
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10 border">
                                        <AvatarImage src={selectedCustomer.avatarUrl} />
                                        <AvatarFallback>{selectedCustomer.name?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex items-baseline gap-2">
                                        <p className="font-medium">{selectedCustomer.name}</p>
                                        <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                                    </div>
                                </div>
                                <SheetTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Pencil className="ml-1 h-3 w-3" />
                                        تغییر
                                    </Button>
                                </SheetTrigger>
                            </div>
                        ) : (
                            <SheetTrigger asChild>
                                <Button variant="outline" className="w-full">
                                    <UserPlus className="ml-2 h-4 w-4" />
                                    افزودن مشتری به فاکتور
                                </Button>
                            </SheetTrigger>
                        )}
                    </CardContent>
                </Card>

                <SheetContent className="w-[350px] sm:w-[450px]">
                    <SheetHeader>
                        <SheetTitle>انتخاب مشتری</SheetTitle>
                    </SheetHeader>
                    <div className="py-4 grid gap-4">
                        <div className="relative">
                            <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="جستجوی مشتری..." className="pr-8" value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} />
                        </div>
                        <ScrollArea className="h-[calc(100vh-12rem)]">
                            <div className="grid gap-2 pr-4">
                                {(filteredCustomers || []).map(customer => (
                                    <Button
                                        key={customer.id}
                                        variant={selectedCustomer?.id === customer.id ? 'default' : 'ghost'}
                                        className="justify-start h-14"
                                        onClick={() => {
                                            setSelectedCustomer(customer);
                                            setIsCustomerSheetOpen(false);
                                        }}
                                    >
                                        <div className="flex items-center gap-3 text-right">
                                            <Avatar className="h-9 w-9 border">
                                                <AvatarImage src={customer.avatarUrl} />
                                                <AvatarFallback>{customer.name?.[0]}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p>{customer.name}</p>
                                                <p className="text-xs text-muted-foreground">{customer.phone}</p>
                                            </div>
                                        </div>
                                    </Button>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </SheetContent>
            </Sheet>
        </div>

        <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-3">
            <Card className="animate-fade-in-up">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>{isEditMode ? `ویرایش فاکتور ${invoice.invoiceNumber}` : 'فاکتور جدید'}</CardTitle>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4">
                    {isClient ? (
                        <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable droppableId="invoice-items">
                            {(provided) => (
                                <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-col gap-2">
                                {(invoice.items || []).length > 0 ? (invoice.items || []).map((item, index) => {
                                    const product = products.find(p => p.id === item.productId);
                                    const availableUnits = [product?.unit];
                                    if (product?.subUnit) availableUnits.push(product.subUnit);

                                    return (
                                    <Draggable key={item.productId + item.unit + index} draggableId={item.productId + item.unit + index} index={index}>
                                        {(provided) => (
                                            <Card ref={provided.innerRef} {...provided.draggableProps} className="overflow-hidden bg-muted/30">
                                                <CardContent className="p-2">
                                                    <div className="grid grid-cols-1 sm:grid-cols-5 items-center gap-2">
                                                        <div {...provided.dragHandleProps} className="cursor-grab p-2 flex items-center justify-center sm:border-l">
                                                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                                                        </div>
                                                        <div className="sm:col-span-2">
                                                            <p className="font-semibold truncate">{item.productName}</p>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2 sm:col-span-2">
                                                            <Input type="number" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))} placeholder="مقدار" />
                                                            <Select value={item.unit} onValueChange={(newUnit) => handleUnitChange(index, newUnit)}>
                                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    {(availableUnits || []).filter(u => u).map(u => <SelectItem key={u} value={u!}>{u}</SelectItem>)}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="flex items-center justify-between sm:justify-end gap-2">
                                                             <p className="font-semibold sm:hidden">{formatCurrency(item.totalPrice)}</p>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveItem(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </Draggable>
                                    );
                                }) : (
                                    <div className="text-center py-10 text-muted-foreground">محصولی اضافه نشده است.</div>
                                )}
                                {provided.placeholder}
                                </div>
                            )}
                            </Droppable>
                        </DragDropContext>
                        ) : (
                             <div className="text-center py-10">در حال بارگذاری...</div>
                        )}
                </div>
                <div className="grid gap-2 mt-6">
                    <Label htmlFor="description">توضیحات</Label>
                    <Textarea id="description" value={invoice.description} onChange={(e) => {setInvoice(prev => ({...prev, description: e.target.value}));}} />
                </div>
            </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>پرداخت</CardTitle></CardHeader>
                <CardContent className="grid gap-4">
                     <div className="space-y-2 text-sm">
                        <div className="flex justify-between font-semibold text-lg pt-2"><span>جمع کل</span><span>{formatCurrency(invoice.total || 0)}</span></div>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
    <div className="sticky bottom-[90px] md:bottom-0 z-50 p-4 bg-card border-t mt-4 lg:col-span-5">
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
                <Button variant="outline" className="flex-1" onClick={handlePreviewClick}>
                    <Eye className="ml-2 h-4 w-4" />
                    پیش‌نمایش
                </Button>
                {isEditMode && (
                    <div className="grid gap-2">
                        <Label htmlFor="status" className="sr-only">وضعیت</Label>
                        <Select value={invoice.status} onValueChange={(value: InvoiceStatus) => {setInvoice(prev => ({...prev, status: value}));}}>
                            <SelectTrigger id="status" className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="Pending">در انتظار</SelectItem><SelectItem value="Paid">پرداخت شده</SelectItem><SelectItem value="Overdue">سررسید گذشته</SelectItem></SelectContent>
                        </Select>
                    </div>
                )}
                
                <Button onClick={handleSaveAndExit} size="lg" className="w-full sm:w-auto flex-1 bg-green-600 hover:bg-green-700"><Save className="ml-2 h-4 w-4" />{isEditMode ? 'ذخیره تغییرات' : 'ایجاد فاکتور'}</Button>
            </div>
        </div>
    </div>
    </>
  );
}
