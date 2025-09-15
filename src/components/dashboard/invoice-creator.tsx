'use client';

import { useState, useMemo } from 'react';
import type { Customer, Product } from '@/lib/definitions';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { PlusCircle, Sparkles, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { generateInvoiceDescription, GenerateInvoiceDescriptionInput } from '@/ai/flows/generate-invoice-description';
import { suggestOptimalDiscounts, SuggestOptimalDiscountsInput, SuggestOptimalDiscountsOutput } from '@/ai/flows/suggest-optimal-discounts';
import { useToast } from '@/hooks/use-toast';

type InvoiceItem = {
  product: Product;
  quantity: number;
};

export function InvoiceCreator({ customers, products }: { customers: Customer[]; products: Product[] }) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>();
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(8); // 8% tax rate
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestedDiscounts, setSuggestedDiscounts] = useState<SuggestOptimalDiscountsOutput | null>(null);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId),
    [selectedCustomerId, customers]
  );

  const subtotal = useMemo(
    () => items.reduce((acc, item) => acc + item.product.price * item.quantity, 0),
    [items]
  );

  const total = useMemo(() => {
    const discountedSubtotal = subtotal - discount;
    const taxAmount = discountedSubtotal * (tax / 100);
    return discountedSubtotal + taxAmount;
  }, [subtotal, discount, tax]);

  const handleAddProduct = (product: Product) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.product.id === product.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { product, quantity: 1 }];
    });
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.product.id !== productId));
  };
  
  const handleGenerateDescription = async () => {
    if (items.length === 0) {
      toast({
        variant: 'destructive',
        title: 'هیچ آیتمی در فاکتور وجود ندارد',
        description: 'لطفاً برای تولید توضیحات، محصولات را اضافه کنید.',
      });
      return;
    }
    setIsGenerating(true);
    try {
      const input: GenerateInvoiceDescriptionInput = {
        products: items.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
        })),
      };
      const result = await generateInvoiceDescription(input);
      setDescription(result.description);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'خطای هوش مصنوعی',
        description: 'تولید توضیحات با شکست مواجه شد.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSuggestDiscounts = async () => {
    if (!selectedCustomer || items.length === 0) {
      toast({
        variant: 'destructive',
        title: 'اطلاعات ناقص',
        description: 'لطفا برای پیشنهاد تخفیف، یک مشتری انتخاب کرده و محصولات را اضافه کنید.',
      });
      return;
    }
    setIsGenerating(true);
    try {
      const input: SuggestOptimalDiscountsInput = {
        customerId: selectedCustomer.id,
        customerPurchaseHistory: selectedCustomer.purchaseHistory,
        products: items.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.product.price,
        })),
      };
      const result = await suggestOptimalDiscounts(input);
      setSuggestedDiscounts(result);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'خطای هوش مصنوعی',
        description: 'پیشنهاد تخفیف با شکست مواجه شد.',
      });
    } finally {
      setIsGenerating(false);
    }
  };


  return (
    <div className="grid gap-4 md:grid-cols-3 md:gap-8">
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>اقلام فاکتور</CardTitle>
            <CardDescription>محصولات را به فاکتور اضافه کنید.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>محصول</TableHead>
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
                      <TableCell className="font-medium">{item.product.name}</TableCell>
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
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      هنوز محصولی اضافه نشده است.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="justify-start">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <PlusCircle className="ml-2 h-4 w-4" />
                  افزودن محصول
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput placeholder="جستجوی محصول..." />
                  <CommandList>
                    <CommandEmpty>محصولی یافت نشد.</CommandEmpty>
                    <CommandGroup>
                      {products.map((product) => (
                        <CommandItem
                          key={product.id}
                          value={product.name}
                          onSelect={() => {
                            handleAddProduct(product);
                            setOpen(false);
                          }}
                        >
                          {product.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </CardFooter>
        </Card>
      </div>
      <div>
        <Card>
          <CardHeader>
            <CardTitle>جزئیات فاکتور</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-2">
              <Label>مشتری</Label>
              <Select onValueChange={setSelectedCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="یک مشتری انتخاب کنید" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
             <div className="grid gap-2">
                <div className="flex justify-between items-center">
                    <Label htmlFor="description">توضیحات</Label>
                    <Button variant="ghost" size="sm" onClick={handleGenerateDescription} disabled={isGenerating}>
                        <Sparkles className="ml-2 h-4 w-4" />
                        {isGenerating ? 'در حال تولید...' : 'تولید با هوش مصنوعی'}
                    </Button>
                </div>
                <Textarea id="description" placeholder="فاکتور برای..." value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="discount">تخفیف (تومان)</Label>
                <Input id="discount" type="number" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tax">مالیات (%)</Label>
                <Input id="tax" type="number" value={tax} onChange={(e) => setTax(parseFloat(e.target.value))} />
              </div>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full" onClick={handleSuggestDiscounts} disabled={isGenerating}>
                    <Sparkles className="ml-2 h-4 w-4" />
                    {isGenerating ? 'در حال تحلیل...' : 'پیشنهاد تخفیف با هوش مصنوعی'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                  {suggestedDiscounts ? (
                     <div className="grid gap-4">
                        <div className="space-y-2">
                            <h4 className="font-medium leading-none">پیشنهادات تخفیف</h4>
                            <p className="text-sm text-muted-foreground">
                                بر اساس سابقه مشتری و اقلام سبد خرید.
                            </p>
                        </div>
                        {suggestedDiscounts.suggestedDiscounts.length > 0 ? (
                             <ul className="grid gap-2">
                                {suggestedDiscounts.suggestedDiscounts.map((s, i) => (
                                    <li key={i} className="text-sm border-r-2 pr-3 border-primary">
                                        <p className="font-semibold">{s.discountPercentage}% تخفیف</p>
                                        <p className="text-muted-foreground">{s.reason}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground">در حال حاضر تخفیف خاصی پیشنهاد نمی‌شود.</p>
                        )}
                     </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">برای دریافت پیشنهادات تخفیف مبتنی بر هوش مصنوعی کلیک کنید.</div>
                  )}
              </PopoverContent>
            </Popover>


            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span>جمع جزء</span>
                    <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                    <span>تخفیف</span>
                    <span className="text-destructive">-{formatCurrency(discount)}</span>
                </div>
                <div className="flex justify-between">
                    <span>مالیات ({tax}%)</span>
                    <span>{formatCurrency(subtotal * (tax/100) - (discount > 0 ? discount * (tax/100) : 0))}</span>
                </div>
                <div className="flex justify-between font-semibold text-base pt-2 border-t">
                    <span>جمع کل</span>
                    <span>{formatCurrency(total)}</span>
                </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full">ایجاد فاکتور</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
