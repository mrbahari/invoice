

'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { Customer, Product, Category, InvoiceItem, Invoice, InvoiceStatus, Store, PriceHistory } from '@/lib/definitions';
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
import { Plus, Minus, Trash2, Search, X, Eye, ArrowRight, Save, GripVertical, UserPlus, Pencil, Shuffle, WandSparkles, LoaderCircle, CheckCircle2, ChevronsUpDown, Package, Check } from 'lucide-react';
import { formatCurrency, getStorePrefix, formatNumber, parseFormattedNumber } from '@/lib/utils';
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
import { FloatingToolbar } from './floating-toolbar';
import { CustomerForm } from './customer-form';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { useDraggableScroll } from '@/hooks/use-draggable-scroll';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc } from 'firebase/firestore';
import { useUser, useFirestore } from '@/firebase';


type InvoiceEditorProps = {
    invoice: Partial<Invoice>;
    setInvoice: (invoice: Partial<Invoice> | null) => void;
    onSaveSuccess: (invoiceId: string) => void;
    onPreview: (invoiceId: string) => void;
    onCancel: () => void;
    onDirtyChange: (isDirty: boolean) => void;
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

const useInterval = (callback: () => void, delay: number | null) => {
  const savedCallback = useRef<() => void>();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      savedCallback.current?.();
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
};

const normalizeName = (name: string) => {
    return name
      .replace(/کی پلاس|کناف ایران|باتیس/gi, '')
      .replace(/ي/g, 'ی') 
      .replace(/ك/g, 'ک') 
      .replace(/\s+/g, '') 
      .toLowerCase();
};

function InvoiceItemRow({ item, index, onRemove, onUpdate, onUnitChange, onReplace, products, isDragging, isOpen, onToggleOpen, onPriceBlur }: { item: InvoiceItem, index: number, onRemove: (index: number) => void, onUpdate: (index: number, field: keyof InvoiceItem, value: any) => void, onUnitChange: (index: number, newUnit: string) => void, onReplace: (index: number, newProduct: Product) => void, onPriceBlur: (item: InvoiceItem) => void, products: Product[], isDragging: boolean, isOpen: boolean, onToggleOpen: () => void }) {
    
    // Internal state for input fields to allow for debounced updates
    const [localQuantity, setLocalQuantity] = useState<string>(() => formatNumber(item.quantity));
    const [localTotalPrice, setLocalTotalPrice] = useState<string>(() => formatNumber(item.totalPrice));

    const product = products.find(p => p.id === item.productId);
    const availableUnits = product ? [product.unit, product.subUnit].filter(Boolean) as string[] : [item.unit];
    const brandType = item.productName.includes('کی پلاس') ? 'کی پلاس' : 'متفرقه';


    // Click vs Drag detection state
    const isDraggingRef = useRef(false);
    const mouseDownPos = useRef({ x: 0, y: 0 });

    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    const similarProducts = useMemo(() => {
        if (!product) return [];
        const currentBaseName = normalizeName(product.name);
        
        const equivalents = products.filter(p => {
             if (p.id === product.id) return false;
             const candidateBaseName = normalizeName(p.name);
             return candidateBaseName === currentBaseName;
        });

        const categoryMates = products.filter(p => 
            p.subCategoryId === product.subCategoryId && 
            p.id !== product.id &&
            !equivalents.some(e => e.id === p.id) // Exclude already found equivalents
        );

        return [...equivalents, ...categoryMates];
    }, [product, products]);
    
    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setLocalQuantity(value); // Update display immediately
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => {
            const newQuantity = parseFormattedNumber(value);
            if (newQuantity !== '') {
                onUpdate(index, 'quantity', newQuantity);
            }
        }, 500);
    };
    
    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
         onUpdate(index, 'unitPrice', parseFormattedNumber(e.target.value));
    };

    const handleTotalPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setLocalTotalPrice(value);
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => {
            const newTotal = parseFormattedNumber(value);
            if (newTotal !== '' && item.quantity > 0) {
                const newUnitPrice = Math.round(newTotal / item.quantity);
                onUpdate(index, 'unitPrice', newUnitPrice);
            }
        }, 500);
    };

    useEffect(() => {
        setLocalQuantity(formatNumber(item.quantity));
        setLocalTotalPrice(formatNumber(item.totalPrice));
    }, [item.quantity, item.totalPrice]);

    const handleHeaderMouseDown = (e: React.MouseEvent) => {
        isDraggingRef.current = false;
        mouseDownPos.current = { x: e.clientX, y: e.clientY };
    };

    const handleHeaderMouseMove = (e: React.MouseEvent) => {
        const dx = Math.abs(e.clientX - mouseDownPos.current.x);
        const dy = Math.abs(e.clientY - mouseDownPos.current.y);
        if (dx > 5 || dy > 5) {
            isDraggingRef.current = true;
        }
    };
    
    const handleHeaderMouseUp = () => {
        if (!isDraggingRef.current) {
            onToggleOpen();
        }
        isDraggingRef.current = false;
    };
    
    const imageUrl = item.imageUrl || products.find(p => p.id === item.productId)?.imageUrl;


    return (
        <Collapsible open={isOpen}>
            <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300", isDragging && "h-16")}>
                 <CollapsibleTrigger asChild>
                    <div
                        className="p-3 cursor-pointer"
                        onMouseDown={handleHeaderMouseDown}
                        onMouseMove={handleHeaderMouseMove}
                        onMouseUp={handleHeaderMouseUp}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                <div className="cursor-grab">
                                    <GripVertical className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <div className="relative h-12 w-12 flex-shrink-0">
                                    {imageUrl ? (
                                        <Image src={imageUrl} alt={item.productName} fill className="object-cover rounded-md border" />
                                    ) : (
                                        <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center">
                                            <Package className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                                <div className="grid gap-0.5 overflow-hidden">
                                  <div className="flex items-center gap-2">
                                     <p className="font-semibold truncate">{item.productName}</p>
                                     <Badge variant={brandType === 'کی پلاس' ? 'default' : 'secondary'} className="h-4 px-1.5 text-[10px] whitespace-nowrap">
                                        {brandType}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground font-mono truncate">
                                    {formatNumber(item.quantity)} {item.unit} &times; {formatCurrency(item.unitPrice)}
                                  </p>
                                  <p className="text-sm font-semibold font-mono truncate">{formatCurrency(item.totalPrice)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className={cn("h-8 w-8 flex-shrink-0 text-destructive", isDragging && "hidden")} onClick={(e) => { e.stopPropagation(); onRemove(index); }}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={(e) => e.stopPropagation()}>
                                            <Shuffle className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-64">
                                        <DropdownMenuLabel>جایگزینی با محصول مشابه</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <ScrollArea className="h-[200px]">
                                        {similarProducts.length > 0 ? similarProducts.map(p => (
                                            <DropdownMenuItem key={p.id} onSelect={() => onReplace(index, p)} className="flex items-center gap-2">
                                                <Image src={p.imageUrl} alt={p.name} width={32} height={32} className="rounded-md object-cover" />
                                                <div className="flex-1">
                                                    <p className="text-xs font-semibold truncate">{p.name}</p>
                                                    <p className="text-xs text-muted-foreground font-mono">{formatCurrency(p.price)}</p>
                                                </div>
                                            </DropdownMenuItem>
                                        )) : <p className="p-4 text-center text-xs text-muted-foreground">محصول مشابهی یافت نشد.</p>}
                                        </ScrollArea>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <div className="h-8 w-8 flex items-center justify-center">
                                    <ChevronsUpDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                                </div>
                            </div>
                        </div>
                    </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="p-3 pt-0 relative space-y-3">
                         <div className={cn("grid grid-cols-2 gap-x-4 gap-y-3", isDragging && "hidden")}>
                            <div className="grid gap-1.5">
                                <Label htmlFor={`quantity-${index}`} className="text-xs">مقدار</Label>
                                <Input type="text" id={`quantity-${index}`} value={localQuantity} onChange={handleQuantityChange} placeholder="مقدار" className="h-9 font-mono" />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor={`unit-${index}`} className="text-xs">واحد</Label>
                                <Select value={item.unit} onValueChange={(value) => onUnitChange(index, value)} disabled={availableUnits.length <= 1}>
                                    <SelectTrigger id={`unit-${index}`} className="h-9"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {availableUnits.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="grid gap-1.5">
                                <Label htmlFor={`price-${index}`} className="text-xs">مبلغ واحد</Label>
                                <Input id={`price-${index}`} value={formatNumber(item.unitPrice)} onBlur={() => onPriceBlur(item)} onChange={handlePriceChange} placeholder="مبلغ" className="h-9 font-mono" />
                            </div>
                             <div className="grid gap-1.5">
                                <Label htmlFor={`total-price-${index}`} className="text-xs">مبلغ کل</Label>
                                <Input id={`total-price-${index}`} value={localTotalPrice} onChange={handleTotalPriceChange} placeholder="مبلغ کل" className="h-9 font-mono" />
                            </div>
                        </div>
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
}

const AddProductsComponent = React.memo(({
    storeId,
    setStoreId,
    stores,
    subCategories,
    selectedSubCategoryId,
    setSelectedSubCategoryId,
    productSearch,
    setProductSearch,
    filteredProducts,
    invoiceItems,
    onAddProduct,
}: {
    storeId: string;
    setStoreId: (id: string) => void;
    stores: Store[];
    subCategories: Category[];
    selectedSubCategoryId: string;
    setSelectedSubCategoryId: (id: string) => void;
    productSearch: string;
    setProductSearch: (term: string) => void;
    filteredProducts: Product[];
    invoiceItems: InvoiceItem[];
    onAddProduct: (product: Product, quantity: number) => void;
}) => {
    const draggableScrollRef = useRef<HTMLDivElement>(null);
    useDraggableScroll(draggableScrollRef, { direction: 'horizontal' });

    const [activeInput, setActiveInput] = useState<string | null>(null);
    const [quantity, setQuantity] = useState<string>('1');
    const [isHolding, setIsHolding] = useState<null | 'inc' | 'dec'>(null);
    
    useInterval(() => {
        if (isHolding) {
            handleQuantityChange(isHolding === 'inc' ? 1 : -1);
        }
    }, isHolding ? 100 : null);
    
    const handleProductClick = (productId: string) => {
        if (activeInput === productId) {
            setActiveInput(null);
            setQuantity('1');
        } else {
            setActiveInput(productId);
            setQuantity('1');
        }
    };
    
    const handleQuantityChange = (value: number) => {
        const newQuantity = Math.max(1, (parseFormattedNumber(quantity) || 0) + value);
        setQuantity(formatNumber(newQuantity));
    };

    const handleConfirm = (e: React.MouseEvent, productId: string) => {
        e.stopPropagation();
        const numQuantity = parseFormattedNumber(quantity);
        if (numQuantity > 0) {
            const product = filteredProducts.find(p => p.id === productId);
            if (product) onAddProduct(product, numQuantity);
        }
        setActiveInput(null);
        setQuantity('1');
    };
    
    return (
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
                    ref={draggableScrollRef}
                    className="overflow-x-auto cursor-grab active:cursor-grabbing"
                >
                    <div className="grid grid-rows-2 grid-flow-col gap-2 auto-cols-[100px] sm:auto-cols-[120px] pb-2">
                        {filteredProducts.length > 0 ? (filteredProducts).map(product => {
                            const invoiceItem = invoiceItems?.find(item => item.productId === product.id);
                            const isInInvoice = !!invoiceItem;

                            return (
                            <div key={product.id} className="group flex flex-col items-center">
                                <Card className="overflow-hidden w-full cursor-pointer" onClick={() => handleProductClick(product.id)}>
                                    <div className="relative aspect-square w-full">
                                        <Image src={product.imageUrl} alt={product.name} fill className="object-cover pointer-events-none" draggable="false" />
                                        {isInInvoice && activeInput !== product.id && (
                                            <Badge className="absolute top-1 right-1 rounded-full h-5 w-5 flex items-center justify-center text-xs bg-green-600 text-white select-none pointer-events-none">
                                                {formatNumber(invoiceItem?.quantity)}
                                            </Badge>
                                        )}
                                    </div>
                                </Card>
                                <AnimatePresence>
                                {activeInput === product.id && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="w-full flex flex-col gap-1 items-center mt-2"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="flex items-center justify-center gap-1 w-full">
                                             <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-7 w-7 bg-red-600 text-white hover:bg-red-700"
                                                onMouseDown={() => { handleQuantityChange(-1); setIsHolding('dec'); }}
                                                onMouseUp={() => setIsHolding(null)}
                                                onMouseLeave={() => setIsHolding(null)}
                                            >
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                            <Input
                                                className="h-7 w-12 text-center font-mono text-sm p-1"
                                                value={quantity}
                                                onChange={(e) => setQuantity(formatNumber(parseFormattedNumber(e.target.value)))}
                                                autoFocus
                                                onFocus={(e) => e.target.select()}
                                            />
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-7 w-7 bg-green-600 text-white hover:bg-green-700"
                                                onMouseDown={() => { handleQuantityChange(1); setIsHolding('inc'); }}
                                                onMouseUp={() => setIsHolding(null)}
                                                onMouseLeave={() => setIsHolding(null)}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                         <Button size="sm" className="h-7 px-2 text-xs w-full bg-green-600 hover:bg-green-700" onClick={(e) => handleConfirm(e, product.id)}>
                                            <Check className="ml-1 h-3 w-3" />
                                            افزودن
                                        </Button>
                                    </motion.div>
                                )}
                                </AnimatePresence>
                                <div className="p-1.5 text-center w-full">
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
    );
});
AddProductsComponent.displayName = 'AddProductsComponent';


export function InvoiceEditor({ invoice, setInvoice, onSaveSuccess, onPreview, onCancel, onDirtyChange }: InvoiceEditorProps) {
  const { data, updateDocument, deleteDocument, addDocument } = useData();
  const { customers: customerList, products, categories, stores, invoices, units: unitsOfMeasurement } = data;
  const { toast } = useToast();
  const isClient = useIsClient();
  const isMobile = useIsMobile();
  const { user } = useUser();
  const firestore = useFirestore();


  const productsScrollRef = useRef<HTMLDivElement>(null);
  
  const isEditMode = !!invoice.id;
  const [initialState, setInitialState] = useState<string | null>(null);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(undefined);
  const [storeId, setStoreId] = useState<string>('');
  const [openItemId, setOpenItemId] = useState<string | null>(null);

  // Debounced values
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const [debouncedDiscount, setDebouncedDiscount] = useState<number>(invoice.discount || 0);
  const [debouncedAdditions, setDebouncedAdditions] = useState<number>(invoice.additions || 0);
  const [debouncedTax, setDebouncedTax] = useState<number>(invoice.tax || 0);
  
  const [flyingProduct, setFlyingProduct] = useState<FlyingProduct | null>(null);
  const invoiceItemsCardRef = useRef<HTMLDivElement>(null);
  
  const customerCollapsibleRef = useRef<HTMLDivElement>(null);
  const [customerDialogView, setCustomerDialogView] = useState<'select' | 'create'>('select');
  const [isCustomerSelectorOpen, setIsCustomerSelectorOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const isDirty = useMemo(() => {
    if (initialState === null) return false;
    return JSON.stringify(invoice) !== initialState;
  }, [invoice, initialState]);

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setInitialState(JSON.stringify(invoice));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useEffect(() => {
    const customer = invoice.customerId ? customerList.find(c => c.id === invoice.customerId) : undefined;
    setSelectedCustomer(customer);
    
    // Set initial store based on products or default
    const initialStoreId =
      invoice.items && invoice.items.length > 0
        ? products.find((p) => p.id === invoice.items![0].productId)
            ?.storeId || stores?.[0]?.id || ''
        : stores?.[0]?.id || ''
    
    setStoreId(initialStoreId);

  }, [invoice.customerId, invoice.items, customerList, products, stores]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string | 'all'>('all');
  const [showAddCustomerButton, setShowAddCustomerButton] = useState(false);


  // When customer changes, update invoice details
  useEffect(() => {
    if (selectedCustomer) {
      setInvoice({
        ...invoice,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerEmail: selectedCustomer.email
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCustomer]);

  // Recalculate totals whenever items or financial fields change
  useEffect(() => {
    const subtotal = invoice.items?.reduce((acc, item) => acc + item.totalPrice, 0) || 0;
    const total = subtotal - debouncedDiscount + debouncedAdditions + debouncedTax;

    if (invoice.subtotal !== subtotal || invoice.total !== total) {
        setInvoice({ ...invoice, subtotal, total });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice.items, debouncedDiscount, debouncedAdditions, debouncedTax]);

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

  // Logic for showing the "Add Customer" button
  useEffect(() => {
    const isPhoneNumber = /^\d{11}$/.test(customerSearch);
    if (isPhoneNumber && filteredCustomers.length === 0) {
      setShowAddCustomerButton(true);
    } else {
      setShowAddCustomerButton(false);
    }
  }, [customerSearch, filteredCustomers]);

  
  const handleAddProduct = (product: Product, quantity: number) => {
      const currentItems = invoice.items ? [...invoice.items] : [];
      const existingItemIndex = currentItems.findIndex(item => item.productId === product.id && item.unit === product.unit);
      
      let newItems;

      if (existingItemIndex > -1) {
        // Item exists, update quantity
        newItems = currentItems.map((item, index) => {
          if (index === existingItemIndex) {
            const newQuantity = item.quantity + quantity;
            return {
              ...item,
              imageUrl: product.imageUrl,
              quantity: newQuantity,
              totalPrice: newQuantity * item.unitPrice,
            };
          }
          return item;
        });
      } else {
        // Item doesn't exist, add it with full details
        const newItem: InvoiceItem = {
          productId: product.id,
          productName: product.name,
          quantity: quantity,
          unit: product.unit,
          unitPrice: product.price,
          totalPrice: product.price * quantity,
          imageUrl: product.imageUrl, // Make sure to add the imageUrl
        };
        newItems = [newItem, ...currentItems];
      }
      
      setInvoice({...invoice, items: newItems});
  };


  const handleItemChange = useCallback((index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = invoice.items ? [...invoice.items] : [];
    if (newItems[index]) {
        const updatedItem = { ...newItems[index], [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
            updatedItem.totalPrice = (updatedItem.quantity || 0) * (updatedItem.unitPrice || 0);
        }
        newItems[index] = updatedItem;
    }
    setInvoice({ ...invoice, items: newItems });
  }, [invoice, setInvoice]);

  const handlePriceBlur = async (item: InvoiceItem) => {
    if (!user || !firestore) return;
    const product = products.find(p => p.id === item.productId);
    if (!product || product.price === item.unitPrice) {
      return; // No change or no product found
    }

    // Update the product price in the database
    await updateDocument('products', item.productId, { price: item.unitPrice });

    // Add the new price to the priceHistory subcollection
    const newPriceHistoryEntry: Omit<PriceHistory, 'id'> = {
      price: item.unitPrice,
      date: new Date().toISOString(),
    };
    
    // Directly use firestore functions for subcollection
    const priceHistoryRef = collection(firestore, 'users', user.uid, 'products', item.productId, 'priceHistory');
    await addDoc(priceHistoryRef, newPriceHistoryEntry);

    toast({
        variant: 'success',
        title: 'قیمت محصول به‌روز شد',
        description: `قیمت محصول «${item.productName}» به ${formatCurrency(item.unitPrice)} تغییر یافت.`,
    });
  };

  const handleReplaceItem = useCallback((index: number, newProduct: Product) => {
        const newItems = invoice.items ? [...invoice.items] : [];
        if (newItems[index]) {
            const oldItem = newItems[index];
            newItems[index] = {
                ...oldItem,
                productId: newProduct.id,
                productName: newProduct.name,
                unit: newProduct.unit,
                unitPrice: newProduct.price,
                totalPrice: oldItem.quantity * newProduct.price,
                imageUrl: newProduct.imageUrl
            };
        }
        setInvoice({ ...invoice, items: newItems });
  }, [invoice, setInvoice]);
  
  const handleUnitChange = useCallback((index: number, newUnit: string) => {
      const newItems = invoice.items ? [...invoice.items] : [];
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
      setInvoice({...invoice, items: newItems});
  }, [invoice, products, setInvoice]);

  const handleRemoveItem = useCallback((index: number) => {
    setInvoice({
        ...invoice,
        items: invoice.items?.filter((_, i) => i !== index)
    });
  }, [invoice, setInvoice]);

  const handleDragEnd = (result: DropResult) => {
    document.body.classList.remove('dragging-invoice-item');
    setIsDragging(false);
    if (!result.destination) return;
      const items = Array.from(invoice.items || []);
      const [removed] = items.splice(result.source.index, 1);
      items.splice(result.destination!.index, 0, removed);
      setInvoice({...invoice, items});
  };

  const handleDragStart = (start: DragStart) => {
    setIsDragging(true);
    setOpenItemId(null); // Close any open item when dragging starts
    document.body.classList.add('dragging-invoice-item');
  };
  
  const handleFinancialFieldChange = useCallback(
    (field: 'discount' | 'additions' | 'tax', value: string) => {
      const numericValue = parseFormattedNumber(value);
      const setter = 
        field === 'discount' ? setDebouncedDiscount :
        field === 'additions' ? setDebouncedAdditions :
        setDebouncedTax;
      
      setInvoice(prev => ({ ...prev, [field]: numericValue === '' ? 0 : numericValue }));

      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
      debounceTimeout.current = setTimeout(() => {
        setter(numericValue === '' ? 0 : numericValue);
      }, 500);
    }, [setInvoice]
  );

  const handleProcessInvoice = async (): Promise<string | null> => {
    if (!selectedCustomer) {
      toast({
          variant: 'destructive',
          title: 'مشتری انتخاب نشده است',
          description: 'لطفاً قبل از ذخیره یا پیش‌نمایش، یک مشتری برای فاکتور انتخاب کنید.',
      });
      setIsCustomerSelectorOpen(true);
      setTimeout(() => {
          customerCollapsibleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return null;
    }
    
    setIsProcessing(true);
    let processedInvoiceId: string | undefined = invoice.id;

    const finalInvoiceData = {
        ...invoice,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerEmail: selectedCustomer.email
    } as Omit<Invoice, 'id'>;

    if (isEditMode && processedInvoiceId) {
        await updateDocument('invoices', processedInvoiceId, finalInvoiceData);
    } else {
        const newId = await addDocument('invoices', finalInvoiceData);
        processedInvoiceId = newId;
    }
    setInitialState(JSON.stringify({ ...invoice, id: processedInvoiceId }));
    setIsProcessing(false);
    return processedInvoiceId || null;
  };
  
  const handleDeleteInvoice = async () => {
    if (!isEditMode || !invoice.id) return;
    await deleteDocument('invoices', invoice.id);
    onCancel();
  };

  const handleSaveAndExit = async () => {
      const processedId = await handleProcessInvoice();
      if (processedId) {
          onSaveSuccess(processedId);
      }
  };
  
  const handlePreviewClick = async () => {
    const processedId = await handleProcessInvoice();
    if (processedId) {
        onPreview(processedId);
    }
  };

  const handleAddNewCustomer = async () => {
    if (!/^\d{11}$/.test(customerSearch)) return;

    const newCustomerData: Omit<Customer, 'id' | 'purchaseHistory'> = {
      name: `مشتری جدید`,
      phone: customerSearch.trim(),
      email: 'ایمیل ثبت نشده',
      address: 'آدرس ثبت نشده',
    };
    
    const newId = await addDocument('customers', newCustomerData);
    if(newId) {
        const newCustomer = { ...newCustomerData, id: newId, purchaseHistory: 'مشتری جدید' };
        setSelectedCustomer(newCustomer);
        setIsCustomerSelectorOpen(false);
        setCustomerSearch('');
    }
  };
    
  const handleBrandSwap = useCallback(() => {
    if (!invoice.items || invoice.items.length === 0) return;

    const isCurrentlyKPlus = invoice.items.some(item => item.productName.includes('کی پلاس'));
    const targetBrand = isCurrentlyKPlus ? 'miscellaneous' : 'k-plus';
    let updatedCount = 0;

    const newItems = invoice.items.map(item => {
      const currentProduct = products.find(p => p.id === item.productId);
      if (!currentProduct) return item;

      const baseName = normalizeName(currentProduct.name);

      const equivalentProduct = products.find(p => {
        if (p.id === currentProduct.id) return false;
        
        const candidateBaseName = normalizeName(p.name);
        if (candidateBaseName !== baseName) return false;

        const isCandidateKPlus = p.name.includes('کی پلاس');
        
        if (targetBrand === 'k-plus') return isCandidateKPlus;
        if (targetBrand === 'miscellaneous') return !isCandidateKPlus;
        
        return false;
      });

      if (equivalentProduct) {
        updatedCount++;
        return {
          ...item,
          productId: equivalentProduct.id,
          productName: equivalentProduct.name,
          unitPrice: equivalentProduct.price,
          imageUrl: equivalentProduct.imageUrl,
          totalPrice: item.quantity * equivalentProduct.price,
        };
      }
      return item;
    });

    setInvoice({ ...invoice, items: newItems });
    if (updatedCount > 0) {
      toast({
          variant: 'success',
          title: 'تعویض برند انجام شد',
          description: `${updatedCount} محصول به برند ${targetBrand === 'k-plus' ? 'کی پلاس' : 'متفرقه'} تغییر کرد.`
      });
    } else {
      toast({
          variant: 'default',
          title: 'محصولی تعویض نشد',
          description: `هیچ معادل با برند ${targetBrand === 'k-plus' ? 'کی پلاس' : 'متفرقه'} یافت نشد.`
      });
    }
  }, [invoice, products, setInvoice, toast]);

  const invoiceBrandType = useMemo(() => {
    if (!invoice.items || invoice.items.length === 0) return null;
    return invoice.items.some(item => item.productName.includes('کی پلاس')) ? 'کی پلاس' : 'متفرقه';
  }, [invoice.items]);

   return (
    <TooltipProvider>
      <AnimatePresence>
        {flyingProduct && (
          <motion.div
            key={flyingProduct.id}
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
      
       <FloatingToolbar pageKey="invoice-editor">
            <div className="flex flex-col items-center gap-1">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" onClick={onCancel} className="text-muted-foreground w-8 h-8">
                        <ArrowRight className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left"><p>بازگشت</p></TooltipContent>
                </Tooltip>
                {isEditMode && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" disabled={isProcessing} className="text-destructive hover:bg-destructive/10 hover:text-destructive w-8 h-8">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left"><p>حذف فاکتور</p></TooltipContent>
                        </Tooltip>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>آیا مطمئن هستید؟</AlertDialogTitle><AlertDialogDescription>این عمل غیرقابل بازگشت است و فاکتور را برای همیشه حذف می‌کند.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>انصراف</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteInvoice} className='bg-destructive hover:bg-destructive/90'>حذف</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                )}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" onClick={handlePreviewClick} className="w-8 h-8">
                        <Eye className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left"><p>پیش‌نمایش</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" onClick={handleBrandSwap} className="w-8 h-8">
                        <Shuffle className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left"><p>تعویض برند (کی پلاس/متفرقه)</p></TooltipContent>
                </Tooltip>
            </div>
            <Separator orientation="horizontal" className="w-6" />
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button onClick={handleSaveAndExit} disabled={isProcessing} variant="ghost" size="icon" className="w-10 h-10 bg-green-600 text-white hover:bg-green-700">
                        <Save className="h-5 w-5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="left"><p>ذخیره تغییرات</p></TooltipContent>
            </Tooltip>
       </FloatingToolbar>

        <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 grid auto-rows-max gap-4">
                <Collapsible ref={customerCollapsibleRef} open={isCustomerSelectorOpen} onOpenChange={(isOpen) => {
                    setIsCustomerSelectorOpen(isOpen);
                    if (isOpen) {
                        setCustomerDialogView('select');
                    }
                }}>
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
                                            <AvatarFallback>{selectedCustomer.phone?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold text-lg">{selectedCustomer.phone}</p>
                                            <p className="text-sm text-muted-foreground">{selectedCustomer.name}</p>
                                        </div>
                                    </div>
                                    <CollapsibleTrigger asChild>
                                        <Button variant="outline">
                                            <Pencil className="ml-1 h-3 w-3" />
                                            تغییر
                                        </Button>
                                    </CollapsibleTrigger>
                                </div>
                            ) : (
                               <CollapsibleTrigger asChild>
                                    <Button variant="outline" className="w-full h-20 border-dashed">
                                        <UserPlus className="ml-2 h-5 w-5" />
                                        انتخاب مشتری از لیست
                                    </Button>
                                </CollapsibleTrigger>
                            )}
                        </CardContent>
                        <CollapsibleContent>
                            <AnimatePresence>
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                >
                                <Separator />
                                <div className="p-4">
                                {customerDialogView === 'select' ? (
                                    <div className="grid gap-4">
                                        <div className="relative flex items-center">
                                            <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="جستجوی مشتری با نام یا شماره..."
                                                className="pr-8"
                                                value={customerSearch}
                                                onChange={e => setCustomerSearch(e.target.value)}
                                                maxLength={11}
                                            />
                                            {showAddCustomerButton && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={handleAddNewCustomer}
                                                    className="absolute left-1 top-1/2 -translate-y-1/2 h-8 bg-green-500 text-white hover:bg-green-600 flex items-center gap-1 px-3"
                                                >
                                                   <Plus className="h-4 w-4" />
                                                    افزودن
                                                </Button>
                                            )}
                                        </div>
                                        <div className="border rounded-md p-2 grid grid-cols-2 md:grid-cols-4 gap-1">
                                            {filteredCustomers.length > 0 ? (filteredCustomers || []).slice(0, isMobile ? 4 : 8).map(customer => (
                                                <Button
                                                    key={customer.id}
                                                    variant={'ghost'}
                                                    className="h-auto justify-start text-right p-2"
                                                    onClick={() => {
                                                        setSelectedCustomer(customer);
                                                        setIsCustomerSelectorOpen(false);
                                                        setCustomerSearch('');
                                                    }}
                                                >
                                                    <div className="flex items-center gap-2 text-right w-full overflow-hidden">
                                                        <Avatar className="h-9 w-9 border flex-shrink-0">
                                                            <AvatarImage src={`https://picsum.photos/seed/${customer.id}/36/36`} />
                                                            <AvatarFallback>{customer.phone[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="overflow-hidden">
                                                            <p className='text-sm font-semibold truncate'>{customer.phone}</p>
                                                            <p className="text-xs text-muted-foreground truncate">{customer.name}</p>
                                                        </div>
                                                    </div>
                                                </Button>
                                            )) : (
                                                <div className="col-span-full text-center py-10 text-sm text-muted-foreground">
                                                    <p>مشتری‌ای یافت نشد.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="pt-4">
                                        <CustomerForm 
                                            onSave={() => {
                                                const newCustomer = data.customers[0];
                                                if(newCustomer){
                                                    setSelectedCustomer(newCustomer);
                                                }
                                                setIsCustomerSelectorOpen(false);
                                                setCustomerDialogView('select');
                                                setCustomerSearch('');
                                            }} 
                                            onCancel={() => setCustomerDialogView('select')}
                                        />
                                    </div>
                                )}
                                </div>
                                </motion.div>
                            </AnimatePresence>
                        </CollapsibleContent>
                    </Card>
                </Collapsible>
                
                <div className="block lg:hidden">
                    <AddProductsComponent
                      storeId={storeId}
                      setStoreId={setStoreId}
                      stores={stores}
                      subCategories={subCategories}
                      selectedSubCategoryId={selectedSubCategoryId}
                      setSelectedSubCategoryId={setSelectedSubCategoryId}
                      productSearch={productSearch}
                      setProductSearch={setProductSearch}
                      filteredProducts={filteredProducts}
                      invoiceItems={invoice.items || []}
                      onAddProduct={handleAddProduct}
                    />
                </div>

                <Card 
                  ref={invoiceItemsCardRef}
                  className={cn("overflow-hidden")}
                >
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>آیتم‌های فاکتور</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4">
                            {isClient ? (
                                <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                                    <Droppable droppableId="invoice-items">
                                    {(provided) => (
                                        <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-col gap-3">
                                        {(invoice.items || []).length > 0 ? (invoice.items || []).map((item, index) => {
                                            const uniqueId = item.productId + index;
                                            return (
                                                <DndDraggable key={uniqueId} draggableId={uniqueId} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                                            <InvoiceItemRow
                                                                item={item}
                                                                index={index}
                                                                onRemove={handleRemoveItem}
                                                                onUpdate={handleItemChange}
                                                                onUnitChange={handleUnitChange}
                                                                onReplace={handleReplaceItem}
                                                                onPriceBlur={handlePriceBlur}
                                                                products={products}
                                                                isDragging={snapshot.isDragging}
                                                                isOpen={openItemId === uniqueId}
                                                                onToggleOpen={() => setOpenItemId(prev => prev === uniqueId ? null : uniqueId)}
                                                            />
                                                        </div>
                                                    )}
                                                </DndDraggable>
                                            )
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
                                    <Input id="discount" value={formatNumber(invoice.discount)} onChange={(e) => handleFinancialFieldChange('discount', e.target.value)} className="font-mono" />
                                </div>
                                 <div className="grid gap-2">
                                    <Label htmlFor="additions">اضافات (ریال)</Label>
                                    <Input id="additions" value={formatNumber(invoice.additions)} onChange={(e) => handleFinancialFieldChange('additions', e.target.value)} className="font-mono" />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="tax">مالیات و ارزش افزوده (ریال)</Label>
                                <Input id="tax" value={formatNumber(invoice.tax)} onChange={(e) => handleFinancialFieldChange('tax', e.target.value)} className="font-mono" />
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
                            <Textarea id="description" value={invoice.description} onChange={(e) => {setInvoice({...invoice, description: e.target.value});}} className="min-h-[240px]" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="hidden lg:block lg:col-span-1">
                 <AddProductsComponent
                    storeId={storeId}
                    setStoreId={setStoreId}
                    stores={stores}
                    subCategories={subCategories}
                    selectedSubCategoryId={selectedSubCategoryId}
                    setSelectedSubCategoryId={setSelectedSubCategoryId}
                    productSearch={productSearch}
                    setProductSearch={setProductSearch}
                    filteredProducts={filteredProducts}
                    invoiceItems={invoice.items || []}
                    onAddProduct={handleAddProduct}
                  />
            </div>
        </div>
    </div>
    </TooltipProvider>
  );
}

