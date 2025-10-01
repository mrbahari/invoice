
'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { Customer, Product, Category, InvoiceItem, InvoiceStatus, Store } from '@/lib/definitions';
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
import { PlusCircle, Trash2, Search, X, Eye, ArrowRight, Save, GripVertical, UserPlus, Pencil, Shuffle, WandSparkles, LoaderCircle, CheckCircle2, ChevronsUpDown } from 'lucide-react';
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
  DialogDescription,
  DialogTrigger,
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
import { DragDropContext, Droppable, Draggable as DndDraggable, type DropResult, type DragStart, type DraggableProvided } from '@hello-pangea/dnd';
import { useData } from '@/context/data-context';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import Draggable from 'react-draggable';
import { CustomerForm } from './customer-form';
import { Badge } from '@/components/ui/badge';
import { useDraggableScroll } from '@/hooks/use-draggable-scroll';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';


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


function InvoiceItemRow({ item, index, onRemove, onUpdate, onUnitChange, products, isDragging }: { item: InvoiceItem, index: number, onRemove: (index: number) => void, onUpdate: (index: number, field: keyof InvoiceItem, value: any) => void, onUnitChange: (index: number, newUnit: string) => void, products: Product[], isDragging: boolean }) {
    
    const [displayPrice, setDisplayPrice] = useState(() => formatNumber(item.unitPrice));
    const [displayQuantity, setDisplayQuantity] = useState(() => formatNumber(item.quantity));
    
    const product = products.find(p => p.id === item.productId);
    const availableUnits = product ? [product.unit, product.subUnit].filter(Boolean) as string[] : [item.unit];

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const num = parseFormattedNumber(val);
        onUpdate(index, 'quantity', num === '' ? 0 : num);
        setDisplayQuantity(formatNumber(num));
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const num = parseFormattedNumber(val);
        onUpdate(index, 'unitPrice', num === '' ? 0 : num);
        setDisplayPrice(formatNumber(num));
    };
    
    useEffect(() => {
        setDisplayPrice(formatNumber(item.unitPrice));
        setDisplayQuantity(formatNumber(item.quantity));
    }, [item.unitPrice, item.quantity]);


    return (
        <Collapsible defaultOpen={false}>
            <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300", isDragging && "h-16")}>
                <div className="p-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                             <div className="cursor-grab">
                                <GripVertical className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <span className="font-semibold truncate">{item.productName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                             <Button variant="ghost" size="icon" className={cn("h-8 w-8 flex-shrink-0 text-destructive", isDragging && "hidden")} onClick={() => onRemove(index)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <ChevronsUpDown className="h-4 w-4" />
                                </Button>
                            </CollapsibleTrigger>
                        </div>
                    </div>
                </div>
                <CollapsibleContent>
                    <div className="p-3 pt-0">
                        <div className={cn("pl-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3", isDragging && "hidden")}>
                            <div className="grid gap-1.5">
                                <Label htmlFor={`quantity-${index}`} className="text-xs">مقدار</Label>
                                <Input type="text" id={`quantity-${index}`} value={displayQuantity} onChange={handleQuantityChange} placeholder="مقدار" className="font-mono" />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor={`unit-${index}`} className="text-xs">واحد</Label>
                                <Select value={item.unit} onValueChange={(value) => onUnitChange(index, value)} disabled={availableUnits.length <= 1}>
                                    <SelectTrigger id={`unit-${index}`}><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {availableUnits.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor={`price-${index}`} className="text-xs">مبلغ واحد</Label>
                                <Input id={`price-${index}`} value={displayPrice} onChange={handlePriceChange} placeholder="مبلغ" className="font-mono" />
                            </div>
                            <div className="grid gap-1.5">
                                <Label className="text-xs">مبلغ کل</Label>
                                <p className="font-semibold font-mono text-sm flex items-center h-10">{formatCurrency(item.totalPrice)}</p>
                            </div>
                        </div>
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
}

export function InvoiceEditor({ invoiceId, initialUnsavedInvoice, onSaveSuccess, onPreview, onCancel }: InvoiceEditorProps) {
  const { data, setData } = useData();
  const { customers: customerList, products, categories, stores, invoices, units: unitsOfMeasurement, toolbarPosition } = data;
  const { toast } = useToast();
  const isClient = useIsClient();
  const draggableToolbarRef = useRef(null);
  const productsScrollRef = useRef<HTMLDivElement>(null);
  useDraggableScroll(productsScrollRef, { direction: 'horizontal' });
  
  const isEditMode = !!invoiceId;

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
        // Add new product to the beginning of the list
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

  const handleItemChange = useCallback((index: number, field: keyof InvoiceItem, value: any) => {
    setInvoice(prev => {
        const newItems = prev.items ? [...prev.items] : [];
        if (newItems[index]) {
            const updatedItem = { ...newItems[index], [field]: value };
            updatedItem.totalPrice = (updatedItem.quantity || 0) * (updatedItem.unitPrice || 0);
            newItems[index] = updatedItem;
        }
        return { ...prev, items: newItems };
    });
  }, []);

  
  const handleUnitChange = useCallback((index: number, newUnit: string) => {
    setInvoice(prev => {
      const newItems = prev.items ? [...prev.items] : [];
      const item = newItems[index];
      if (item) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const unitPrice = newUnit === product.subUnit ? (product.subUnitPrice || 0) : product.price;
          item.unit = newUnit;
          item.unitPrice = unitPrice;
          item.totalPrice = (item.quantity || 0) * unitPrice;
        }
      }
      return {...prev, items: newItems};
    });
  }, [products]);

  const handleRemoveItem = useCallback((index: number) => {
    setInvoice(prev => ({
        ...prev,
        items: prev.items?.filter((_, i) => i !== index)
    }));
  }, []);

  const handleDragEnd = (result: DropResult) => {
    document.body.classList.remove('dragging-invoice-item');
    setIsDragging(false);
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


    const AddProductsComponent = React.memo(() => (
        <Card className="sticky top-20">
        <CardHeader>
            <CardTitle>افزودن محصولات</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
            <div className="grid grid-cols-1 gap-4">
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
                <div className="relative">
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
                
                <div
                    ref={productsScrollRef}
                    className="overflow-x-auto cursor-grab"
                    style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                >
                    <div className="grid grid-rows-2 grid-flow-col gap-2 auto-cols-[100px] sm:auto-cols-[120px] pb-2">
                        {filteredProducts.length > 0 ? (filteredProducts).map(product => {
                            const invoiceItem = invoice.items?.find(item => item.productId === product.id);
                            const isInInvoice = !!invoiceItem;

                            return (
                            <div key={product.id} className="group flex flex-col">
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
                                <div className="p-1.5 text-center">
                                    <p className="text-xs font-semibold truncate">{product.name}</p>
                                    <p className="text-xs text-muted-foreground font-mono">{formatCurrency(product.price)}</p>
                                </div>
                            </div>
                            )
                        }) : (
                            <div className="col-span-full row-span-2 text-center py-10 text-muted-foreground flex items-center justify-center w-full">
                                محصولی یافت نشد.
                            </div>
                        )}
                    </div>
                </div>
                
        </CardContent>
        </Card>
    ));
    AddProductsComponent.displayName = 'AddProductsComponent';

  
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
    <div className="mx-auto grid max-w-full flex-1 auto-rows-max gap-4 pb-28">
      <Draggable
          handle=".drag-handle"
          position={toolbarPosition}
          nodeRef={draggableToolbarRef}
          onStop={(e, dragData) => {
              setData(prev => ({...prev, toolbarPosition: { x: dragData.x, y: dragData.y }}));
          }}
      >
        <div 
          ref={draggableToolbarRef}
          style={{position: 'fixed', zIndex: 40}}
        >
          <div 
            className="flex items-center gap-2 p-2 bg-card/90 border rounded-lg shadow-lg backdrop-blur-sm"
          >
             <div className="drag-handle cursor-move p-2 -ml-2 -my-2 rounded-l-md hover:bg-muted">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
             </div>
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
                          className="w-14 h-14 bg-green-600 text-white hover:bg-green-700"
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

        <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 grid auto-rows-max gap-4">
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
                    <DialogContent className="max-w-md w-[90vw] bg-background">
                      {customerDialogView === 'select' ? (
                        <>
                           <DialogHeader className="text-right">
                              <DialogTitle>انتخاب مشتری</DialogTitle>
                              <DialogDescription>
                                  مشتری مورد نظر خود را جستجو و انتخاب کنید.
                              </DialogDescription>
                          </DialogHeader>
                          <div className="py-4 grid gap-4">
                                <div className="relative flex items-center">
                                    <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="جستجوی مشتری با نام یا شماره..." className="pr-8" value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} />
                                    {customerSearch && filteredCustomers.length === 0 && (
                                        <Button size="sm" className="absolute left-1.5 h-7 bg-green-600 hover:bg-green-700" onClick={() => {
                                            setCustomerDialogView('create');
                                        }}>
                                            <UserPlus className="ml-1 h-4 w-4" />
                                            افزودن
                                        </Button>
                                    )}
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
                                                      setCustomerSearch('');
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
                             <DialogHeader className="text-right">
                                <DialogTitle>افزودن مشتری جدید</DialogTitle>
                                <DialogDescription>
                                    اطلاعات مشتری جدید را وارد کرده و ذخیره کنید.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="pt-4">
                                <CustomerForm 
                                    onSave={() => {
                                        const newCustomer = data.customers[0];
                                        if(newCustomer){
                                            setSelectedCustomer(newCustomer);
                                        }
                                        setIsCustomerDialogOpen(false);
                                        setCustomerDialogView('select');
                                        setCustomerSearch('');
                                    }} 
                                    onCancel={() => setCustomerDialogView('select')}
                                />
                            </div>
                         </div>
                      )}
                  </DialogContent>
                </Dialog>
                
                <div className="block lg:hidden">
                    <AddProductsComponent />
                </div>

                <Card 
                  ref={invoiceItemsCardRef}
                  className={cn("overflow-hidden")}
                >
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
                                        {(invoice.items || []).length > 0 ? (invoice.items || []).map((item, index) => (
                                            <DndDraggable key={item.productId + item.unit + index} draggableId={item.productId + item.unit + index} index={index}>
                                                {(provided, snapshot) => (
                                                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                                        <InvoiceItemRow
                                                            item={item}
                                                            index={index}
                                                            onRemove={handleRemoveItem}
                                                            onUpdate={handleItemChange}
                                                            onUnitChange={handleUnitChange}
                                                            products={products}
                                                            isDragging={snapshot.isDragging}
                                                        />
                                                     </div>
                                                )}
                                            </DndDraggable>
                                            )) : (
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

            <div className="hidden lg:block lg:col-span-1">
                <AddProductsComponent />
            </div>
        </div>
    </div>
    </TooltipProvider>
  );
}
