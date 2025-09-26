
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import type { Customer, Product, Category, InvoiceItem, UnitOfMeasurement, Invoice, InvoiceStatus, Store } from '@/lib/definitions';
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
import { PlusCircle, Trash2, Search, X, Eye, ArrowRight, Save, GripVertical, UserPlus, Pencil, Copy, Shuffle, CheckCircle } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

const formatNumber = (num: number | ''): string => {
    if (num === '' || num === null || isNaN(Number(num))) return '';
    return new Intl.NumberFormat('fa-IR').format(Number(num));
};

const parseFormattedNumber = (str: string): number | '' => {
    if (!str) return '';
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    const englishDigits = '0123456789';
    let numericString = str;
    for (let i = 0; i < 10; i++) {
        numericString = numericString.replace(new RegExp(persianDigits[i], 'g'), englishDigits[i]);
    }
    numericString = numericString.replace(/[^0-9]/g, '');
    const number = parseInt(numericString, 10);
    return isNaN(number) ? '' : number;
};


export function InvoiceEditor({ invoiceId, initialUnsavedInvoice, onSaveSuccess, onPreview, onCancel }: InvoiceEditorProps) {
  const { data, setData } = useData();
  const { customers: customerList, products, categories, stores, invoices, units: unitsOfMeasurement } = data;
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
  const [storeId, setStoreId] = useState<string>(stores?.[0]?.id || '');


  // Display state for formatted numbers
  const [displayDiscount, setDisplayDiscount] = useState('');
  const [displayAdditions, setDisplayAdditions] = useState('');
  const [displayTax, setDisplayTax] = useState('');
  
  // This effect initializes the form for creating a new invoice or editing an existing one
  useEffect(() => {
    let currentInvoice: Partial<Invoice>;
    if (isEditMode && invoiceToEdit) {
      // Editing an existing invoice
      currentInvoice = invoiceToEdit;
      const customer = customerList.find(c => c.id === invoiceToEdit.customerId);
      setSelectedCustomer(customer);
    } else if (initialUnsavedInvoice) {
      // Creating a new invoice from an estimator
      currentInvoice = {
        ...initialUnsavedInvoice,
        invoiceNumber: `${getStorePrefix('INV')}-${(invoices.length + 1).toString().padStart(4, '0')}`,
      };
      setSelectedCustomer(undefined);
    } else {
      // Creating a brand new invoice
      currentInvoice = {
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
      };
      setSelectedCustomer(undefined);
    }

    setInvoice(currentInvoice);
    // Initialize display values
    setDisplayDiscount(formatNumber(currentInvoice.discount || 0));
    setDisplayAdditions(formatNumber(currentInvoice.additions || 0));
    setDisplayTax(formatNumber(currentInvoice.tax || 0));

  }, [invoiceId, invoiceToEdit, initialUnsavedInvoice, isEditMode, customerList, invoices.length]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string | 'all'>('all');


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
  
    let availableProducts = products;
    
    // Filter by store first
    if (storeId) {
      availableProducts = products.filter(p => p.storeId === storeId);
    }
  
    // Then filter by sub-category if one is selected
    if (selectedSubCategoryId && selectedSubCategoryId !== 'all') {
      availableProducts = availableProducts.filter(p => p.subCategoryId === selectedSubCategoryId);
    }
    
    // Finally, apply search term
    if (productSearch) {
      availableProducts = availableProducts.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));
    }
  
    return availableProducts;
  }, [products, productSearch, selectedSubCategoryId, storeId]);
  
  const subCategories = useMemo(() => {
    // Get all products of the selected store
    const storeProducts = products.filter(p => p.storeId === storeId);
    // Get unique subcategory IDs from those products
    const storeSubCategoryIds = new Set(storeProducts.map(p => p.subCategoryId));
    // Return the category objects
    return categories.filter(c => storeSubCategoryIds.has(c.id));
  }, [products, categories, storeId]);


  
  const invoiceProductIds = useMemo(() => new Set(invoice.items?.map(item => item.productId)), [invoice.items]);
  
  const getSimilarProducts = (productId: string) => {
    const currentProduct = products.find(p => p.id === productId);
    if (!currentProduct) return [];
    return products.filter(p => p.subCategoryId === currentProduct.subCategoryId && p.id !== currentProduct.id);
  };

  const filteredCustomers = useMemo(() => {
    if (!customerList) return [];
    return customerList.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.toLowerCase().includes(customerSearch.toLowerCase()));
  }, [customerList, customerSearch]);
  
  const handleAddProduct = (product: Product) => {
    setInvoice(prev => {
      const items = prev.items ? [...prev.items] : [];
      const existingItemIndex = items.findIndex(item => item.productId === product.id && item.unit === product.unit);
      
      if (existingItemIndex > -1) {
        // If product already exists, maybe just give feedback or do nothing
        toast({ title: 'محصول در فاکتور موجود است', variant: 'default' });
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
            const numericValue = typeof value === 'string' ? parseFormattedNumber(value) : value;
            (items[index] as any)[field] = numericValue === '' ? 0 : numericValue;
            
            if (field === 'quantity' || field === 'unitPrice') {
                const item = items[index];
                item.totalPrice = (item.quantity || 0) * (item.unitPrice || 0);
            }
        }
        return { ...prev, items };
    });
  };

  const handleItemDisplayChange = (
    index: number,
    field: 'quantity' | 'unitPrice',
    displaySetter: React.Dispatch<React.SetStateAction<Record<string, string>>>,
    value: string
  ) => {
      const numericValue = parseFormattedNumber(value);
      handleItemChange(index, field, numericValue);
      displaySetter(prev => ({...prev, [`${field}-${index}`]: formatNumber(numericValue)}));
  }
  
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
  
  const handleFinancialFieldChange = (
    field: 'discount' | 'additions' | 'tax',
    setter: React.Dispatch<React.SetStateAction<string>>,
    value: string
  ) => {
    const numericValue = parseFormattedNumber(value);
    setInvoice(prev => ({...prev, [field]: numericValue === '' ? 0 : numericValue}));
    setter(formatNumber(numericValue));
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
        const updatedId = handleProcessInvoice(); // This saves any pending pending changes
        if(updatedId) {
          onPreview(updatedId);
        }
    }
  };

  const renderItemPriceInputs = (index: number) => {
    const item = invoice.items?.[index];
    if (!item) return null;

    return (
        <>
            <Input 
                value={formatNumber(item.unitPrice)}
                onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                placeholder="مبلغ واحد"
                className="text-right font-mono"
            />
             <Input 
                value={formatCurrency(item.totalPrice)} 
                disabled 
                placeholder="مبلغ کل" 
                className="bg-background/50 font-mono text-right" 
            />
        </>
    );
  };
  
   return (
    <>
    <div className="mx-auto grid max-w-6xl flex-1 auto-rows-max gap-4 pb-32">
        <div className="flex items-center gap-4 sticky top-0 bg-background/80 backdrop-blur-sm z-10 py-4 -mx-4 px-4 md:-mx-6 md:px-6 border-b">
            <div className="flex-1">
                <h1 className="text-xl font-semibold tracking-tight">
                    {isEditMode ? `ویرایش فاکتور ${invoice.invoiceNumber}` : 'فاکتور جدید'}
                </h1>
            </div>
        </div>

        <div className="grid gap-4 md:gap-8">
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
                  <CardTitle>افزودن محصولات</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Select value={storeId} onValueChange={(val) => { setStoreId(val); setSelectedSubCategoryId('all'); }}>
                        <SelectTrigger><SelectValue placeholder="انتخاب فروشگاه" /></SelectTrigger>
                        <SelectContent>
                          {stores?.map((s: Store) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
                        </SelectContent>
                      </Select>
                      <Select value={selectedSubCategoryId} onValueChange={(val) => setSelectedSubCategoryId(val)} disabled={!storeId}>
                        <SelectTrigger><SelectValue placeholder="انتخاب زیردسته" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">همه زیردسته‌ها</SelectItem>
                            {subCategories.map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}
                        </SelectContent>
                      </Select>
                      <div className="relative lg:col-span-1">
                          <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="جستجوی محصول..." className="pr-8" value={productSearch} onChange={e => setProductSearch(e.target.value)} />
                      </div>
                  </div>
                  <div
                    ref={productsRef}
                    className="flex w-full space-x-4 overflow-x-auto pb-4 cursor-grab"
                    {...draggableEvents}
                  >
                    <div className="flex flex-row gap-4">
                      {(filteredProducts || []).map(product => {
                        const isInInvoice = invoiceProductIds.has(product.id);
                        return (
                          <div key={product.id} className="w-32 flex-shrink-0 group">
                              <Card className="overflow-hidden">
                                  <div className="relative aspect-square w-full">
                                      <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                                       <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                          <Button size="icon" variant="ghost" className="text-white hover:bg-white/20 hover:text-white" onClick={() => handleAddProduct(product)} disabled={isInInvoice}>
                                            {isInInvoice ? <CheckCircle className="h-6 w-6" /> : <PlusCircle className="h-6 w-6" />}
                                          </Button>
                                      </div>
                                      {isInInvoice && (
                                          <div className="absolute top-2 left-2 bg-green-500 text-white rounded-full p-1">
                                              <CheckCircle className="h-4 w-4" />
                                          </div>
                                      )}
                                  </div>
                                  <div className="p-2 text-center">
                                      <p className="font-semibold text-sm truncate">{product.name}</p>
                                      <p className="text-xs text-muted-foreground">{formatCurrency(product.price)}</p>
                                  </div>
                              </Card>
                          </div>
                        )
                      })}
                      {filteredProducts.length === 0 && (
                          <div className="w-full text-center py-10 text-muted-foreground">
                              محصولی یافت نشد.
                          </div>
                      )}
                    </div>
                  </div>
              </CardContent>
            </Card>
            
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
                                    <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-col gap-3">
                                    {(invoice.items || []).length > 0 ? (invoice.items || []).map((item, index) => {
                                        const product = products.find(p => p.id === item.productId);
                                        const availableUnits = product ? [product.unit, product.subUnit].filter(Boolean) as string[] : [item.unit];
                                        const isProductFound = !!product;
                                        const similarProducts = getSimilarProducts(item.productId);

                                        return (
                                        <Draggable key={item.productId + item.unit + index} draggableId={item.productId + item.unit + index} index={index}>
                                            {(provided) => (
                                                <div ref={provided.innerRef} {...provided.draggableProps} className="rounded-lg border bg-card text-card-foreground shadow-sm p-3">
                                                  <div className="grid grid-cols-12 items-center gap-x-4 gap-y-2">
                                                    <div {...provided.dragHandleProps} className="cursor-grab p-2 flex items-center justify-center col-span-1">
                                                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                                                    </div>
                                            
                                                    <div className="col-span-11 sm:col-span-5 flex items-center gap-2">
                                                      <div className="flex-grow">
                                                        <DropdownMenu>
                                                          <DropdownMenuTrigger asChild>
                                                            <button className="font-semibold truncate text-right w-full hover:underline">{item.productName}</button>
                                                          </DropdownMenuTrigger>
                                                          <DropdownMenuContent className="w-64" align="start">
                                                            <DropdownMenuLabel>محصولات مشابه</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            <ScrollArea className="h-[200px]">
                                                              {similarProducts.length > 0 ? similarProducts.map(p => (
                                                                <DropdownMenuItem key={p.id} className="gap-2" onSelect={(e) => { e.preventDefault(); handleAddProduct(p); }}>
                                                                  <div className="relative w-16 h-16 rounded-md overflow-hidden">
                                                                    <Image src={p.imageUrl} alt={p.name} layout="fill" objectFit="cover" />
                                                                  </div>
                                                                  <span className="flex-grow truncate text-xs">{p.name}</span>
                                                                </DropdownMenuItem>
                                                              )) : <p className="text-xs text-muted-foreground p-4 text-center">محصول مشابهی یافت نشد.</p>}
                                                            </ScrollArea>
                                                          </DropdownMenuContent>
                                                        </DropdownMenu>
                                                        <p className="text-xs text-muted-foreground text-right">{`واحد: ${item.unit}`}</p>
                                                      </div>
                                                       <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 text-destructive" onClick={() => handleRemoveItem(index)}>
                                                          <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                            
                                                     <div className="col-span-6 sm:col-span-3 grid grid-cols-2 gap-2">
                                                        <div className="grid gap-1">
                                                          <Label htmlFor={`quantity-${index}`} className="text-xs">مقدار</Label>
                                                          <Input type="number" id={`quantity-${index}`} value={item.quantity || ''} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} placeholder="مقدار" />
                                                        </div>
                                                        <div className="grid gap-1">
                                                            <Label htmlFor={`unit-${index}`} className="text-xs">واحد</Label>
                                                            <Select value={item.unit} onValueChange={(value) => handleUnitChange(index, value)} disabled={availableUnits.length <= 1}>
                                                              <SelectTrigger id={`unit-${index}`}><SelectValue /></SelectTrigger>
                                                              <SelectContent>
                                                                {availableUnits.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                                              </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>

                                                     <div className="col-span-6 sm:col-span-3 grid grid-cols-2 gap-2">
                                                        <div className="grid gap-1">
                                                            <Label htmlFor={`price-${index}`} className="text-xs">مبلغ واحد</Label>
                                                            <Input id={`price-${index}`} value={formatNumber(item.unitPrice)} onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)} placeholder="مبلغ" className="font-mono" />
                                                        </div>
                                                        <div className="grid gap-1">
                                                          <Label className="text-xs">مبلغ کل</Label>
                                                          <p className="font-semibold font-mono text-sm flex items-center h-10">{formatCurrency(item.totalPrice)}</p>
                                                        </div>
                                                    </div>
                                                  </div>
                                                </div>
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
                    <CardTitle>خلاصه مالی و توضیحات</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                    <div className="grid gap-4">
                         <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="discount">تخفیف (ریال)</Label>
                                <Input id="discount" value={displayDiscount} onChange={(e) => handleFinancialFieldChange('discount', setDisplayDiscount, e.target.value)} className="font-mono" />
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="additions">اضافات (ریال)</Label>
                                <Input id="additions" value={displayAdditions} onChange={(e) => handleFinancialFieldChange('additions', setDisplayAdditions, e.target.value)} className="font-mono" />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="tax">مالیات و ارزش افزوده (ریال)</Label>
                            <Input id="tax" value={displayTax} onChange={(e) => handleFinancialFieldChange('tax', setDisplayTax, e.target.value)} className="font-mono" />
                        </div>
                        <Separator />
                        <div className="grid gap-2">
                            <Label>جمع جزء</Label>
                            <Input value={formatCurrency(invoice.subtotal || 0)} disabled className="font-mono h-11" />
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-base">جمع کل</Label>
                            <Input value={formatCurrency(invoice.total || 0)} disabled className="font-mono text-xl h-14 font-bold" />
                        </div>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="description">توضیحات</Label>
                        <Textarea id="description" value={invoice.description} onChange={(e) => {setInvoice(prev => ({...prev, description: e.target.value}));}} className="min-h-[240px]" />
                    </div>
                </CardContent>
            </Card>

        </div>
    </div>
    <div className="fixed bottom-20 left-0 right-0 z-50 px-4">
        <div className="max-w-6xl mx-auto flex flex-col-reverse sm:flex-row justify-between items-center gap-2 p-2 bg-card border rounded-lg shadow-lg">
            <div className="flex w-full sm:w-auto items-center gap-1">
                <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
                    <ArrowRight className="ml-2 h-4 w-4" />
                    بازگشت
                </Button>
                {isEditMode && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button type="button" variant="destructive" className="w-full sm:w-auto" disabled={isProcessing}><Trash2 className="ml-2 h-4 w-4" />حذف</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>آیا مطمئن هستید؟</AlertDialogTitle><AlertDialogDescription>این عمل غیرقابل بازگشت است و فاکتور را برای همیشه حذف می‌کند.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter className="grid grid-cols-2 gap-2">
                                <AlertDialogCancel>انصراف</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteInvoice} className='bg-destructive hover:bg-destructive/90'>حذف</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" className="flex-1" onClick={handlePreviewClick}>
                    <Eye className="ml-2 h-4 w-4" />
                    پیش‌نمایش
                </Button>
                <Button onClick={handleSaveAndExit} size="lg" className="w-full sm:w-auto flex-1 bg-green-600 hover:bg-green-700">
                    <Save className="ml-2 h-4 w-4" />
                    {isEditMode ? 'ذخیره تغییرات' : 'ایجاد فاکتور'}
                </Button>
            </div>
        </div>
    </div>
    </>
  );
}

    

    
