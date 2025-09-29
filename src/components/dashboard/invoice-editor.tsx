
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
import { PlusCircle, Trash2, Search, X, Eye, ArrowRight, Save, GripVertical, UserPlus, Pencil, Copy, Shuffle, CheckCircle, WandSparkles, LoaderCircle, CheckCircle2 } from 'lucide-react';
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
import { DragDropContext, Droppable, Draggable, type DropResult, type DragStart } from '@hello-pangea/dnd';
import { useData } from '@/context/data-context';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '../ui/badge';
import { CustomerForm } from './customer-form';
import Draggable from 'react-draggable';


type InvoiceEditorProps = {
    invoiceId?: string; // Can be a new invoice (undefined) or an existing one
    initialUnsavedInvoice?: Omit<Invoice, 'id'> | null; // For invoices coming from estimators
    onSaveSuccess: (invoiceId: string) => void;
    onPreview: (invoiceId: string) => void;
    onCancel: () => void;
};

type FlyingProduct = {
  id: string;
  x: number;
  y: number;
  imageUrl: string;
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

  // Find the invoice to edit from the main data source if an ID is provided
  const invoiceToEdit = useMemo(() => 
    isEditMode ? invoices.find(inv => inv.id === invoiceId) : undefined
  , [invoices, invoiceId, isEditMode]);

  // State for the invoice being edited
  const [invoice, setInvoice] = useState<Partial<Invoice>>({});
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(undefined);
  const [storeId, setStoreId] = useState<string>('');


  // Display state for formatted numbers
  const [displayDiscount, setDisplayDiscount] = useState('');
  const [displayAdditions, setDisplayAdditions] = useState('');
  const [displayTax, setDisplayTax] = useState('');
  
  const [flyingProduct, setFlyingProduct] = useState<FlyingProduct | null>(null);
  const invoiceItemsCardRef = useRef<HTMLDivElement>(null);
  
  const [customerDialogView, setCustomerDialogView] = useState<'select' | 'create'>('select');
  const [isDragging, setIsDragging] = useState(false);


  // This effect initializes the form for creating a new invoice or editing an existing one
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);
  
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

    // Set initial store based on products or default
    const initialStoreId =
      currentInvoice.items && currentInvoice.items.length > 0
        ? products.find((p) => p.id === currentInvoice.items![0].productId)
            ?.storeId || stores?.[0]?.id || ''
        : stores?.[0]?.id || '';
    
    setInvoice(currentInvoice);
    setStoreId(initialStoreId);

    // Initialize display values
    setDisplayDiscount(formatNumber(currentInvoice.discount || 0));
    setDisplayAdditions(formatNumber(currentInvoice.additions || 0));
    setDisplayTax(formatNumber(currentInvoice.tax || 0));

  }, [invoiceId, invoiceToEdit, initialUnsavedInvoice, isEditMode, customerList, products, stores, invoices.length]);
  
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
    if (!storeId) {
        return categories;
    }
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
  
 const handleAddProduct = (product: Product, e: React.MouseEvent<HTMLButtonElement>) => {
    const buttonEl = e.currentTarget;
    const rect = buttonEl.getBoundingClientRect();
    
    const targetEl = invoiceItemsCardRef.current;
    if (targetEl) {
        const targetRect = targetEl.getBoundingClientRect();
        setFlyingProduct({
            id: product.id,
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            imageUrl: product.imageUrl
        });

        setTimeout(() => {
            setFlyingProduct(null);
        }, 800); // Animation duration
    }

    setInvoice(prev => {
      const items = prev.items ? [...prev.items] : [];
      const existingItemIndex = items.findIndex(item => item.productId === product.id && item.unit === product.unit);
      
      if (existingItemIndex > -1) {
        // If product already exists, increment quantity
        items[existingItemIndex].quantity += 1;
        items[existingItemIndex].totalPrice = items[existingItemIndex].quantity * items[existingItemIndex].unitPrice;
      } else {
        items.unshift({
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
    setIsDragging(false);
    document.body.classList.remove('dragging-invoice-item');
    if (!result.destination) return;
    setInvoice(prev => {
      const items = Array.from(prev.items || []);
      const [removed] = items.splice(result.source.index, 1);
      items.splice(result.destination!.index, 0, removed);
      return {...prev, items};
    });
  };

  const handleDragStart = (start: DragStart) => {
    setIsDragging(true);
    document.body.classList.add('dragging-invoice-item');
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
    if (!selectedCustomer) {
      toast({ variant: 'destructive', title: 'مشتری انتخاب نشده است', description: 'لطفا یک مشتری برای فاکتور انتخاب کنید.' });
      setIsCustomerDialogOpen(true);
      return null;
    }
    if (!invoice.items || invoice.items.length === 0) {
      toast({ variant: 'destructive', title: 'فاکتور خالی است', description: 'حداقل یک آیتم به فاکتور اضافه کنید.' });
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
    <TooltipProvider>
      <AnimatePresence>
        {flyingProduct && (
          <motion.div
            className="fixed z-50 rounded-lg overflow-hidden"
            initial={{ x: flyingProduct.x, y: flyingProduct.y, width: 80, height: 80, opacity: 1 }}
            animate={{
              x: invoiceItemsCardRef.current ? invoiceItemsCardRef.current.getBoundingClientRect().left + 20 : 0,
              y: invoiceItemsCardRef.current ? invoiceItemsCardRef.current.getBoundingClientRect().top + 20 : 0,
              width: 20,
              height: 20,
              opacity: 0,
              transition: { duration: 0.8, ease: "easeInOut" }
            }}
            onAnimationComplete={() => setFlyingProduct(null)}
          >
            <Image src={flyingProduct.imageUrl} alt="flying product" layout="fill" objectFit="cover" unoptimized/>
          </motion.div>
        )}
      </AnimatePresence>
    <div className={cn("mx-auto grid max-w-6xl flex-1 auto-rows-max gap-4 pb-28", isDragging && 'dragging-active')}>
        <Draggable handle=".handle">
            <div className="fixed top-24 left-4 z-40 handle cursor-move">
               <div className="flex items-center gap-2 p-2 bg-card/90 border rounded-lg shadow-lg backdrop-blur-sm">
                  <div className="flex items-center gap-1">
                      <Tooltip>
                          <TooltipTrigger asChild>
                             <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                onClick={onCancel}
                                className="text-muted-foreground w-12 h-12"
                             >
                                <ArrowRight className="h-5 w-5" />
                             </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>بازگشت</p></TooltipContent>
                      </Tooltip>
                       {isEditMode && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          disabled={isProcessing} 
                                          className="text-destructive hover:bg-destructive/10 hover:text-destructive w-12 h-12"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>حذف فاکتور</p></TooltipContent>
                                </Tooltip>
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
                   <Separator orientation="vertical" className="h-8" />
                   <div className="flex items-center gap-1">
                      <Tooltip>
                          <TooltipTrigger asChild>
                               <Button variant="ghost" size="icon" onClick={handlePreviewClick} className="w-12 h-12">
                                  <Eye className="h-5 w-5" />
                              </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>پیش‌نمایش</p></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <Button 
                                onClick={handleSaveAndExit} 
                                variant="ghost" 
                                size="icon"
                                className="w-12 h-12 bg-green-600 text-white hover:bg-green-700"
                              >
                                  <Save className="h-5 w-5" />
                              </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>ذخیره تغییرات</p></TooltipContent>
                      </Tooltip>
                   </div>
                </div>
            </div>
        </Draggable>

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
                                    <Button variant="outline" onClick={() => setCustomerDialogView('select')}>
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

                <DialogContent className="max-w-3xl">
                  {customerDialogView === 'select' ? (
                    <>
                      <DialogHeader>
                          <DialogTitle>انتخاب مشتری</DialogTitle>
                          <DialogDescription>
                              مشتری مورد نظر خود را جستجو و انتخاب کنید.
                          </DialogDescription>
                      </DialogHeader>
                      <div className="py-4 grid gap-4">
                          <div className="flex justify-between items-center gap-4">
                              <div className="relative flex-grow">
                                  <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                  <Input placeholder="جستجوی مشتری..." className="pr-8" value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} />
                              </div>
                              <Button onClick={() => setCustomerDialogView('create')}>
                                  <UserPlus className="ml-2 h-4 w-4" />
                                  افزودن مشتری جدید
                              </Button>
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
                    </>
                  ) : (
                     <div className="pt-8">
                        <CustomerForm 
                          onSave={() => {
                            // Find the newly added customer (usually the last one)
                            const newCustomer = data.customers[0];
                            if(newCustomer){
                                setSelectedCustomer(newCustomer);
                            }
                            setIsCustomerDialogOpen(false);
                            setCustomerDialogView('select'); // Reset view for next time
                          }} 
                          onCancel={() => setCustomerDialogView('select')}
                        />
                     </div>
                  )}
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
                           {productSearch && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                    onClick={() => setProductSearch('')}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                          <Input placeholder="جستجوی محصول..." className="pr-8 pl-8" value={productSearch} onChange={e => setProductSearch(e.target.value)} />
                      </div>
                  </div>
                  <div className="w-full">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                        {(filteredProducts || []).map(product => {
                           const invoiceItem = invoice.items?.find(item => item.productId === product.id);
                           const isInInvoice = !!invoiceItem;

                          return (
                            <div key={product.id} className="w-full flex-shrink-0 group">
                                <Card className="overflow-hidden">
                                    <div className="relative aspect-square w-full">
                                        <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                                         <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <motion.button whileTap={{ scale: 0.95 }} className="text-white h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/20" onClick={(e) => handleAddProduct(product, e)}>
                                              <PlusCircle className="h-6 w-6" />
                                            </motion.button>
                                        </div>
                                        {isInInvoice && (
                                          <Badge className="absolute top-1 right-1 rounded-full h-5 w-5 flex items-center justify-center text-xs bg-green-600 text-white">
                                            {invoiceItem?.quantity}
                                          </Badge>
                                        )}
                                    </div>
                                </Card>
                            </div>
                          )
                        })}
                        {filteredProducts.length === 0 && (
                            <div className="col-span-full w-full text-center py-10 text-muted-foreground">
                                محصولی یافت نشد.
                            </div>
                        )}
                      </div>
                  </div>
              </CardContent>
            </Card>
            
            <Card ref={invoiceItemsCardRef}>
                <CardHeader>
                    <CardTitle>آیتم‌های فاکتور</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4">
                        {isClient ? (
                            <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
                                            {(provided, snapshot) => (
                                                <div ref={provided.innerRef} {...provided.draggableProps} className="rounded-lg border bg-card text-card-foreground shadow-sm p-3">
                                                  <div className={cn("grid grid-cols-12 items-start gap-x-4 gap-y-3 transition-all duration-300", isDragging && !snapshot.isDragging && "h-10 overflow-hidden opacity-50")}>
                                                    <div {...provided.dragHandleProps} className="col-span-1 flex h-full items-center justify-center cursor-grab">
                                                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                                                    </div>
                                            
                                                    <div className="col-span-11 sm:col-span-5 flex flex-col gap-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-semibold truncate">{item.productName}</span>
                                                             <div className={cn(isDragging && snapshot.isDragging ? "hidden" : "")}>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                                                            <Shuffle className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent className="w-64" align="start">
                                                                        <DropdownMenuLabel>محصولات مشابه</DropdownMenuLabel>
                                                                        <DropdownMenuSeparator />
                                                                        <ScrollArea className="h-[200px]">
                                                                            {similarProducts.length > 0 ? similarProducts.map(p => (
                                                                                <DropdownMenuItem key={p.id} className="gap-2" onSelect={(e) => { e.preventDefault(); handleAddProduct(p, e as any); }}>
                                                                                    <div className="relative w-16 h-16 rounded-md overflow-hidden">
                                                                                        <Image src={p.imageUrl} alt={p.name} layout="fill" objectFit="cover" unoptimized/>
                                                                                    </div>
                                                                                    <span className="flex-grow truncate text-xs">{p.name}</span>
                                                                                </DropdownMenuItem>
                                                                            )) : <p className="text-xs text-muted-foreground p-4 text-center">محصول مشابهی یافت نشد.</p>}
                                                                        </ScrollArea>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                             </div>
                                                        </div>
                                                        <p className={cn("text-xs text-muted-foreground", isDragging && !snapshot.isDragging && "hidden")}>{`واحد: ${item.unit}`}</p>
                                                    </div>
                                            
                                                     <div className={cn("col-start-2 col-span-11 sm:col-start-auto sm:col-span-6 grid grid-cols-2 md:grid-cols-4 gap-3", isDragging && !snapshot.isDragging && "hidden")}>
                                                        <div className="grid gap-1.5">
                                                          <Label htmlFor={`quantity-${index}`} className="text-xs">مقدار</Label>
                                                          <Input type="number" id={`quantity-${index}`} value={item.quantity || ''} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} placeholder="مقدار" />
                                                        </div>
                                                        <div className="grid gap-1.5">
                                                            <Label htmlFor={`unit-${index}`} className="text-xs">واحد</Label>
                                                            <Select value={item.unit} onValueChange={(value) => handleUnitChange(index, value)} disabled={availableUnits.length <= 1}>
                                                              <SelectTrigger id={`unit-${index}`}><SelectValue /></SelectTrigger>
                                                              <SelectContent>
                                                                {availableUnits.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                                              </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="grid gap-1.5">
                                                            <Label htmlFor={`price-${index}`} className="text-xs">مبلغ واحد</Label>
                                                            <Input id={`price-${index}`} value={formatNumber(item.unitPrice)} onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)} placeholder="مبلغ" className="font-mono" />
                                                        </div>
                                                        <div className="grid gap-1.5">
                                                          <Label className="text-xs">مبلغ کل</Label>
                                                          <p className="font-semibold font-mono text-sm flex items-center h-10">{formatCurrency(item.totalPrice)}</p>
                                                        </div>
                                                    </div>

                                                    <div className={cn("col-span-12 flex justify-end -mt-10 sm:mt-0 sm:col-span-1 sm:col-start-12", isDragging && !snapshot.isDragging && "hidden")}>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 text-destructive" onClick={() => handleRemoveItem(index)}>
                                                          <Trash2 className="h-4 w-4" />
                                                        </Button>
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
    </TooltipProvider>
  );
}
