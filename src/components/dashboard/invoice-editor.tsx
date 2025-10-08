'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { Customer, Product, Category, InvoiceItem, Invoice, InvoiceStatus, Store } from '@/lib/definitions';
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



function InvoiceItemRow({ item, index, onRemove, onUpdate, onUnitChange, onReplace, products, isDragging, isOpen, onToggleOpen }: { item: InvoiceItem, index: number, onRemove: (index: number) => void, onUpdate: (index: number, field: keyof InvoiceItem, value: any) => void, onUnitChange: (index: number, newUnit: string) => void, onReplace: (index: number, newProduct: Product) => void, products: Product[], isDragging: boolean, isOpen: boolean, onToggleOpen: () => void }) {
    
    // Internal state for input fields to allow for debounced updates
    const [localQuantity, setLocalQuantity] = useState<string>(() => formatNumber(item.quantity));
    const [localPrice, setLocalPrice] = useState<string>(() => formatNumber(item.unitPrice));
    const [localTotalPrice, setLocalTotalPrice] = useState<string>(() => formatNumber(item.totalPrice));

    const product = products.find(p => p.id === item.productId);
    const availableUnits = product ? [product.unit, product.subUnit].filter(Boolean) as string[] : [item.unit];

    // Click vs Drag detection state
    const isDraggingRef = useRef(false);
    const mouseDownPos = useRef({ x: 0, y: 0 });


    const similarProducts = useMemo(() => {
        if (!product) return [];
        return products.filter(p => p.subCategoryId === product.subCategoryId && p.id !== product.id);
    }, [product, products]);

    // When the real item data from the parent changes, update the local state
    useEffect(() => {
        setLocalQuantity(formatNumber(item.quantity));
        setLocalPrice(formatNumber(item.unitPrice));
        setLocalTotalPrice(formatNumber(item.totalPrice));
    }, [item.quantity, item.unitPrice, item.totalPrice]);

    // Debounce effect for auto-updating
    useEffect(() => {
        const handler = setTimeout(() => {
            const newQuantity = parseFormattedNumber(localQuantity);
            const newPrice = parseFormattedNumber(localPrice);
            const newTotalPrice = parseFormattedNumber(localTotalPrice);
            
            const quantityChanged = newQuantity !== '' && newQuantity !== item.quantity;
            const priceChanged = newPrice !== '' && newPrice !== item.unitPrice;
            const totalPriceChanged = newTotalPrice !== '' && newTotalPrice !== item.totalPrice;
    
            let finalQuantity = item.quantity;
            let finalUnitPrice = item.unitPrice;
    
            if (totalPriceChanged && newTotalPrice !== '') {
                finalQuantity = quantityChanged && newQuantity !== '' ? newQuantity : item.quantity;
                if (finalQuantity > 0) {
                    finalUnitPrice = Math.round(newTotalPrice / finalQuantity);
                }
                onUpdate(index, 'totalPrice', newTotalPrice);
                onUpdate(index, 'unitPrice', finalUnitPrice);
                if (quantityChanged) onUpdate(index, 'quantity', finalQuantity);
            } else if (quantityChanged || priceChanged) {
                finalQuantity = quantityChanged && newQuantity !== '' ? newQuantity : item.quantity;
                finalUnitPrice = priceChanged && newPrice !== '' ? newPrice : item.unitPrice;
                const finalTotalPrice = finalQuantity * finalUnitPrice;
                
                if (quantityChanged) onUpdate(index, 'quantity', finalQuantity);
                if (priceChanged) onUpdate(index, 'unitPrice', finalUnitPrice);
                onUpdate(index, 'totalPrice', finalTotalPrice);
            }
        }, 2000); // 2-second delay

        // Cleanup function to cancel the timeout if the user keeps typing
        return () => {
            clearTimeout(handler);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [localQuantity, localPrice, localTotalPrice]);
    

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
                                    {item.imageUrl ? (
                                        <Image src={item.imageUrl} alt={item.productName} fill className="object-cover rounded-md border" />
                                    ) : (
                                        <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center">
                                            <Package className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                                <div className="grid gap-0.5 overflow-hidden">
                                  <p className="font-semibold truncate">{item.productName}</p>
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
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={(e) => e.stopPropagation()}>
                                            <Shuffle className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuLabel>جایگزینی با محصول مشابه</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {similarProducts.length > 0 ? (
                                            similarProducts.map(p => (
                                                <DropdownMenuItem key={p.id} onClick={() => onReplace(index, p)}>
                                                    {p.name}
                                                </DropdownMenuItem>
                                            ))
                                        ) : (
                                            <DropdownMenuItem disabled>محصول مشابهی یافت نشد.</DropdownMenuItem>
                                        )}
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
                    <div className="p-3 pt-0 relative">
                        <div className={cn("grid grid-cols-2 gap-x-4 gap-y-3", isDragging && "hidden")}>
                            <div className="grid gap-1.5">
                                <Label htmlFor={`quantity-${index}`} className="text-xs">مقدار</Label>
                                <Input type="text" id={`quantity-${index}`} value={localQuantity} onChange={(e) => setLocalQuantity(e.target.value)} placeholder="مقدار" className="h-9 font-mono" />
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
                                <Input id={`price-${index}`} value={localPrice} onChange={(e) => setLocalPrice(e.target.value)} placeholder="مبلغ" className="h-9 font-mono" />
                            </div>
                             <div className="grid gap-1.5">
                                <Label htmlFor={`total-price-${index}`} className="text-xs">مبلغ کل</Label>
                                <Input id={`total-price-${index}`} value={localTotalPrice} onChange={(e) => setLocalTotalPrice(e.target.value)} placeholder="مبلغ کل" className="h-9 font-mono" />
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
    onRemoveProduct,
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
    onAddProduct: (product: Product) => void;
    onRemoveProduct: (product: Product) => void;
}) => {
    const draggableScrollRef = useRef<HTMLDivElement>(null);
    useDraggableScroll(draggableScrollRef, { direction: 'horizontal' });
    
    // States to detect click vs. drag
    const isDraggingRef = useRef(false);
    const startPos = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        isDraggingRef.current = false;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        startPos.current = { x: clientX, y: clientY };
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const dx = Math.abs(clientX - startPos.current.x);
        const dy = Math.abs(clientY - startPos.current.y);
        if (dx > 5 || dy > 5) {
            isDraggingRef.current = true;
        }
    };
    
    const handleMouseUp = (action: 'add' | 'remove', product: Product) => {
        if (!isDraggingRef.current) {
            if (action === 'add') onAddProduct(product);
            else onRemoveProduct(product);
        }
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
                            <div key={product.id} className="group flex flex-col">
                                <Card className="overflow-hidden">
                                    <div className="relative aspect-square w-full">
                                        <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                                        <div 
                                          className="absolute inset-0 flex"
                                          onMouseDown={handleMouseDown}
                                          onTouchStart={handleMouseDown}
                                          onMouseMove={handleMouseMove}
                                          onTouchMove={handleMouseMove}
                                        >
                                            <div 
                                                className="w-1/2 h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/20 hover:bg-red-500/40"
                                                onMouseUp={() => handleMouseUp('remove', product)}
                                                onTouchEnd={() => handleMouseUp('remove', product)}
                                            >
                                                <Minus className="h-6 w-6 text-white" />
                                            </div>
                                            <div 
                                                className="w-1/2 h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-green-500/20 hover:bg-green-500/40"
                                                onMouseUp={() => handleMouseUp('add', product)}
                                                onTouchEnd={() => handleMouseUp('add', product)}
                                            >
                                                <Plus className="h-6 w-6 text-white" />
                                            </div>
                                        </div>
                                        {isInInvoice && (
                                            <Badge className="absolute top-1 right-1 rounded-full h-5 w-5 flex items-center justify-center text-xs bg-green-600 text-white select-none pointer-events-none">
                                                {formatNumber(invoiceItem?.quantity)}
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
    );
});
AddProductsComponent.displayName = 'AddProductsComponent';


export function InvoiceEditor({ invoice, setInvoice, onSaveSuccess, onPreview, onCancel, onDirtyChange }: InvoiceEditorProps) {
  const { data, addDocument, updateDocument, deleteDocument } = useData();
  const { customers: customerList, products, categories, stores, invoices, units: unitsOfMeasurement } = data;
  const isClient = useIsClient();
  const isMobile = useIsMobile();


  const productsScrollRef = useRef<HTMLDivElement>(null);
  
  const isEditMode = !!invoice.id;
  const [initialState, setInitialState] = useState<string | null>(null);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(undefined);
  const [storeId, setStoreId] = useState<string>('');
  const [openItemId, setOpenItemId] = useState<string | null>(null);

  // Display state for formatted numbers
  const [displayDiscount, setDisplayDiscount] = useState('');
  const [displayAdditions, setDisplayAdditions] = useState('');
  const [displayTax, setDisplayTax] = useState('');
  
  const [flyingProduct, setFlyingProduct] = useState<FlyingProduct | null>(null);
  const invoiceItemsCardRef = useRef<HTMLDivElement>(null);
  
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

    // Initialize display values
    setDisplayDiscount(formatNumber(invoice.discount || 0));
    setDisplayAdditions(formatNumber(invoice.additions || 0));
    setDisplayTax(formatNumber(invoice.tax || 0));

  }, [invoice.customerId, invoice.items, invoice.discount, invoice.additions, invoice.tax, customerList, products, stores]);
  
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
    const discount = Number(invoice.discount) || 0;
    const additions = Number(invoice.additions) || 0;
    const tax = Number(invoice.tax) || 0;
    const total = subtotal - discount + additions + tax;

    if (invoice.subtotal !== subtotal || invoice.total !== total) {
        setInvoice({ ...invoice, subtotal, total });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Logic for showing the "Add Customer" button
  useEffect(() => {
    const isPhoneNumber = /^\d{11}$/.test(customerSearch);
    if (isPhoneNumber && filteredCustomers.length === 0) {
      setShowAddCustomerButton(true);
    } else {
      setShowAddCustomerButton(false);
    }
  }, [customerSearch, filteredCustomers]);

  
  const handleAddProduct = (product: Product) => {
      const currentItems = invoice.items ? [...invoice.items] : [];
      const existingItemIndex = currentItems.findIndex(item => item.productId === product.id && item.unit === product.unit);
      
      let newItems;

      if (existingItemIndex > -1) {
        // Item exists, update quantity and ensure image is preserved
        newItems = currentItems.map((item, index) => {
          if (index === existingItemIndex) {
            const newQuantity = item.quantity + 1;
            return {
              ...item,
              imageUrl: product.imageUrl, // IMPORTANT: Ensure image is preserved
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
          quantity: 1,
          unit: product.unit,
          unitPrice: product.price,
          totalPrice: product.price,
          imageUrl: product.imageUrl, // Make sure to add the imageUrl
        };
        newItems = [newItem, ...currentItems];
      }
      
      setInvoice({...invoice, items: newItems});
  };

  const handleRemoveProduct = (product: Product) => {
      if (!invoice.items) return invoice;

      const existingItemIndex = invoice.items.findIndex(item => item.productId === product.id);

      if (existingItemIndex === -1) {
        return invoice; // Product not in invoice, do nothing
      }

      const itemToUpdate = invoice.items[existingItemIndex];
      let newItems;

      if (itemToUpdate.quantity > 1) {
        // Decrease quantity
        newItems = invoice.items.map((item, index) => {
          if (index === existingItemIndex) {
            const newQuantity = item.quantity - 1;
            return {
              ...item,
              quantity: newQuantity,
              totalPrice: newQuantity * item.unitPrice,
            };
          }
          return item;
        });
      } else {
        // Remove item if quantity is 1
        newItems = invoice.items.filter((_, index) => index !== existingItemIndex);
      }

      setInvoice({ ...invoice, items: newItems });
  };


  const handleItemChange = useCallback((index: number, field: keyof InvoiceItem, value: any) => {
        const newItems = invoice.items ? [...invoice.items] : [];
        if (newItems[index]) {
            const updatedItem = { ...newItems[index], [field]: value };
            newItems[index] = updatedItem;
        }
        setInvoice({ ...invoice, items: newItems });
  }, [invoice, setInvoice]);

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
  
  const handleFinancialFieldChange = (
    field: 'discount' | 'additions' | 'tax',
    value: string
  ) => {
    const numericValue = parseFormattedNumber(value);
    const displayValue = value === '' ? '' : formatNumber(numericValue);
    
    switch(field) {
        case 'discount': setDisplayDiscount(displayValue); break;
        case 'additions': setDisplayAdditions(displayValue); break;
        case 'tax': setDisplayTax(displayValue); break;
    }

    setInvoice({...invoice, [field]: numericValue === '' ? 0 : numericValue});
  };

  const handleProcessInvoice = async (): Promise<string | null> => {
    if (!selectedCustomer) {
      setIsCustomerSelectorOpen(true);
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
        processedInvoiceId = await addDocument('invoices', finalInvoiceData);
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
                <Collapsible open={isCustomerSelectorOpen} onOpenChange={setIsCustomerSelectorOpen}>
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
                                        <Button variant="outline" onClick={() => setCustomerDialogView('select')}>
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
                      onRemoveProduct={handleRemoveProduct}
                    />
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
                                    <Input id="discount" value={displayDiscount} onChange={(e) => handleFinancialFieldChange('discount', e.target.value)} className="font-mono" />
                                </div>
                                 <div className="grid gap-2">
                                    <Label htmlFor="additions">اضافات (ریال)</Label>
                                    <Input id="additions" value={displayAdditions} onChange={(e) => handleFinancialFieldChange('additions', e.target.value)} className="font-mono" />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="tax">مالیات و ارزش افزوده (ریال)</Label>
                                <Input id="tax" value={displayTax} onChange={(e) => handleFinancialFieldChange('tax', e.target.value)} className="font-mono" />
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
                    onRemoveProduct={handleRemoveProduct}
                  />
            </div>
        </div>
    </div>
    </TooltipProvider>
  );
}
