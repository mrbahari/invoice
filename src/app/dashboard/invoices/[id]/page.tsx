import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { invoices } from '@/lib/data';
import { notFound } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import type { InvoiceStatus } from '@/lib/definitions';
import { Printer, CreditCard } from 'lucide-react';
import { Package2 } from 'lucide-react';

const statusStyles: Record<InvoiceStatus, string> = {
  Paid: 'text-green-600 bg-green-500/10',
  Pending: 'text-orange-600 bg-orange-500/10',
  Overdue: 'text-red-600 bg-red-500/10',
};

export default function InvoicePreviewPage({ params }: { params: { id: string } }) {
  const invoice = invoices.find((inv) => inv.id === params.id);

  if (!invoice) {
    notFound();
  }

  return (
    <Card className="overflow-hidden" id="invoice-preview">
        <CardHeader className="flex flex-row items-start bg-muted/50">
            <div className="grid gap-0.5">
            <CardTitle className="group flex items-center gap-2 text-lg">
                <Package2 className="h-6 w-6" />
                Hisaabgar
            </CardTitle>
            <CardDescription>Invoice {invoice.invoiceNumber}</CardDescription>
            </div>
            <div className="ml-auto flex items-center gap-2 no-print">
            <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => typeof window !== 'undefined' && window.print()}>
                <Printer className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Print / PDF
                </span>
            </Button>
            <Button size="sm" className="h-8 gap-1">
                <CreditCard className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Pay Now
                </span>
            </Button>
            </div>
        </CardHeader>
        <CardContent className="p-6 text-sm">
            <div className="grid gap-3">
            <div className="font-semibold">Invoice Details</div>
            <ul className="grid gap-3">
                <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Billed to</span>
                <span>{invoice.customerName}</span>
                </li>
                <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Date</span>
                <span>{new Date(invoice.date).toLocaleDateString()}</span>
                </li>
                <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Due Date</span>
                <span>{new Date(invoice.dueDate).toLocaleDateString()}</span>
                </li>
                <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge className={`capitalize ${statusStyles[invoice.status]}`} variant="outline">
                    {invoice.status}
                </Badge>
                </li>
            </ul>
            </div>
            <Separator className="my-4" />
            <div className="grid gap-3">
            <div className="font-semibold">Description</div>
            <p className="text-muted-foreground">{invoice.description}</p>
            </div>
            <Separator className="my-4" />
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="hidden sm:table-cell text-center">Qty</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {invoice.items.map((item, index) => (
                <TableRow key={index}>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell className="hidden sm:table-cell text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.totalPrice)}</TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </CardContent>
        <CardFooter className="flex flex-row items-center border-t bg-muted/50 px-6 py-3">
            <div className="ml-auto text-right text-sm text-muted-foreground">
            <div className="flex justify-end gap-x-4">
                <span>Subtotal</span>
                <span className="font-medium w-24 text-foreground">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-end gap-x-4">
                <span>Discount</span>
                <span className="font-medium w-24 text-foreground">{formatCurrency(invoice.discount)}</span>
            </div>
            <div className="flex justify-end gap-x-4">
                <span>Tax</span>
                <span className="font-medium w-24 text-foreground">{formatCurrency(invoice.tax)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-end gap-x-4 font-semibold text-base">
                <span>Total</span>
                <span className="w-24 text-foreground">{formatCurrency(invoice.total)}</span>
            </div>
            </div>
        </CardFooter>
    </Card>
  );
}
