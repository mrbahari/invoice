
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
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
import { PlusCircle, Trash2, Search, X, Eye, ArrowRight, Save, GripVertical, UserPlus, Pencil, Copy } from 'lucide-react';
import { formatCurrency, getStorePrefix } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { cn } from '@/lib/utils';
import { useDraggableScroll } from '@/hooks/use-draggable-scroll';


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

  // Draggable scroll setup
  const productsRef = useRef<HTMLDivElement>(null);
  const { events: draggableEvents } = useDraggableScroll(productsRef);

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
        invoiceNumber: `${getStorePrefix('INV')}-${(invoices.length + 1).toString().padStart(4, '0')}`,
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
          invoiceNumber: `${getStorePrefix('INV')}-${(invoices.length + 1).toString().padStart(4, '0')}`,
      });
      setSelectedCustomer(undefined);
    }
  }, [invoiceId, invoiceToEdit, initialUnsavedInvoice, isEditMode, customerList, invoices.length]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
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
    return customerList.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.toLowerCase().includes(customerSearch.toLowerCase()));
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
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
        <div className="flex items-center gap-4 sticky top-0 bg-background/80 backdrop-blur-sm z-10 py-4 -mx-4 px-4 md:-mx-6 md:px-6 border-b">
            <div className="flex-1">
                <h1 className="text-xl font-semibold tracking-tight">
                    {isEditMode ? `ویرایش فاکتور ${invoice.invoiceNumber}` : 'فاکتور جدید'}
                </h1>
            </div>
            <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                    <ArrowRight className="ml-2 h-4 w-4" />
                    بازگشت
                </Button>
                <Button onClick={handleSaveAndExit} disabled={isProcessing} className="bg-green-600 hover:bg-green-700">
                    <Save className="ml-2 h-4 w-4" />
                    {isProcessing ? 'در حال ذخیره...' : isEditMode ? 'ذخیره تغییرات' : 'ایجاد فاکتور'}
                </Button>
            </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
             <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
                <Card>
                    <CardHeader>
                        <CardTitle>اطلاعات مشتری</CardTitle>
                    </CardHeader>
                    <CardContent>
                       {selectedCustomer ? (
                            <div className="flex items-center justify-between gap-4 p-4 border rounded-lg bg-muted/30">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-12 w-12 border">
                                        <AvatarImage src={`https://picsum.photos/seed/${selectedCustomer.id}/48/48`} />
                                        <AvatarFallback>{selectedCustomer.name?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{selectedCustomer.name}</p>
                                        <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                                    </div>
                                </div>
                                <DialogTrigger asChild>
                                    <Button variant="outline">
                                        <Pencil className="ml-1 h-3 w-3" />
                                        تغییر
                                    </Button>
                                </DialogTrigger>
                            </div>
                        ) : (
                            <DialogTrigger asChild>
                                <Button variant="outline" className="w-full h-20 border-dashed">
                                    <UserPlus className="ml-2 h-5 w-5" />
                                    انتخاب مشتری از لیست
                                </Button>
                            </DialogTrigger>
                        )}
                    </CardContent>
                </Card>

                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>انتخاب مشتری</DialogTitle>
                         <DialogDescription>
                            مشتری مورد نظر خود را جستجو و انتخاب کنید.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 grid gap-4">
                        <div className="relative">
                            <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="جستجوی مشتری..." className="pr-8" value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} />
                        </div>
                        <ScrollArea className="h-[60vh]">
                            <div className="grid gap-2 pr-4">
                                {(filteredCustomers || []).map(customer => {
                                    return(
                                        <Button
                                            key={customer.id}
                                            variant={selectedCustomer?.id === customer.id ? 'default' : 'ghost'}
                                            className="h-16 justify-start text-right"
                                            onClick={() => {
                                                setSelectedCustomer(customer);
                                                setIsCustomerDialogOpen(false);
                                            }}
                                        >
                                            <div className="flex items-center gap-4 text-right w-full">
                                                <Avatar className="h-10 w-10 border">
                                                    <AvatarImage src={`https://picsum.photos/seed/${customer.id}/40/40`} />
                                                    <AvatarFallback>{customer.name[0]}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className='text-base font-semibold'>{customer.name}</p>
                                                    <p className="text-xs text-muted-foreground">{customer.phone}</p>
                                                </div>
                                            </div>
                                        </Button>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>

             <Card>
                <CardHeader>
                    <CardTitle>پرداخت</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                     <div className="space-y-2 text-sm">
                        <div className="flex justify-between font-semibold text-lg pt-2">
                            <span>جمع کل</span>
                            <span>{formatCurrency(invoice.total || 0)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>


        <Card>
        <CardHeader>
            <CardTitle>آیتم‌های فاکتور</CardTitle>
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
                                const availableUnits = product ? [product.unit, product.subUnit].filter(Boolean) as string[] : [item.unit];
                                const isProductFound = !!product;

                                return (
                                <Draggable key={item.productId + item.unit + index} draggableId={item.productId + item.unit + index} index={index}>
                                    {(provided) => (
                                        <Card ref={provided.innerRef} {...provided.draggableProps} className="overflow-hidden bg-muted/30">
                                            <CardContent className="p-2">
                                                <div className="grid grid-cols-12 items-center gap-2">
                                                    <div {...provided.dragHandleProps} className="cursor-grab p-2 flex items-center justify-center border-l col-span-1">
                                                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                                                    </div>
                                                    <div className="col-span-11 sm:col-span-3">
                                                        <p className="font-semibold truncate">{item.productName}</p>
                                                    </div>
                                                    <div className="col-span-full sm:col-span-6 grid grid-cols-2 md:grid-cols-4 gap-2">
                                                        <Input type="number" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))} placeholder="مقدار" />
                                                        {isProductFound && availableUnits.length > 1 ? (
                                                            <Select value={item.unit} onValueChange={(newUnit) => handleUnitChange(index, newUnit)}>
                                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    {availableUnits.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                                                </SelectContent>
                                                            </Select>
                                                        ) : (
                                                            <Input value={item.unit} disabled className="bg-background/50" />
                                                        )}
                                                         <Input type="number" value={item.unitPrice} onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))} placeholder="مبلغ واحد" />
                                                         <Input value={formatCurrency(item.totalPrice)} disabled placeholder="مبلغ کل" className="bg-background/50 font-mono" />
                                                    </div>
                                                    <div className="col-span-full sm:col-span-2 flex items-center justify-end gap-2">
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
        </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>افزودن محصولات</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
                <div className="relative">
                    <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="جستجوی محصول..." className="pr-8" value={productSearch} onChange={e => setProductSearch(e.target.value)} />
                </div>
                 <div
                    ref={productsRef}
                    className="flex select-none overflow-x-auto gap-3 pb-4 cursor-grab"
                    {...draggableEvents}
                >
                    {(filteredProducts || []).map(product => (
                        <Card
                            key={product.id}
                            onClick={() => handleAddProduct(product)}
                            className="w-32 flex-shrink-0"
                        >
                            <CardContent className="p-2">
                                <div className="relative w-full aspect-square mb-2">
                                    <Image 
                                        src={product.imageUrl} 
                                        alt={product.name} 
                                        fill 
                                        className="rounded-md object-cover"
                                        draggable="false"
                                    />
                                </div>
                                <h3 className="text-xs font-semibold truncate text-center">{product.name}</h3>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>توضیحات</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-3">
                    <Textarea id="description" value={invoice.description} onChange={(e) => {setInvoice(prev => ({...prev, description: e.target.value}));}} />
                </div>
            </CardContent>
        </Card>
    </div>
    <div className="sticky bottom-[90px] md:bottom-0 z-50 p-4 bg-card border-t mt-4">
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
