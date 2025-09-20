
'use client';

import { Eye, CheckCircle, TriangleAlert, Hourglass, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import type { Invoice, InvoiceStatus, Customer } from '@/lib/definitions';
import { cn } from '@/lib/utils';

const statusStyles: Record<InvoiceStatus, string> = {
  Paid: 'text-green-600',
  Pending: 'text-orange-600',
  Overdue: 'text-red-600',
};
const statusTranslation: Record<InvoiceStatus, string> = {
    Paid: 'پرداخت شده',
    Pending: 'در انتظار',
    Overdue: 'سررسید گذشته',
};

const statusIcons: Record<InvoiceStatus, React.ElementType> = {
  Paid: CheckCircle2,
  Pending: Hourglass,
  Overdue: TriangleAlert,
};

type InvoiceTableProps = {
  invoiceList: Invoice[];
  customers: Customer[];
  onStatusChange: (invoiceId: string, status: InvoiceStatus) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onPreviewInvoice: (invoiceId: string) => void;
};

export function InvoiceTable({ invoiceList, customers, onStatusChange, onEditInvoice, onPreviewInvoice }: InvoiceTableProps) {
  return (
     <Card className="animate-fade-in-up">
      <CardHeader className="px-7">
        <CardTitle>فاکتورها</CardTitle>
        <CardDescription>
          فاکتورهای اخیر فروشگاه شما.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>مشتری</TableHead>
              <TableHead className="hidden sm:table-cell">
                شماره فاکتور
              </TableHead>
              <TableHead className="hidden sm:table-cell">وضعیت</TableHead>
              <TableHead className="hidden md:table-cell">تاریخ</TableHead>
              <TableHead className="text-right">مبلغ</TableHead>
              <TableHead>
                <span className="sr-only">اقدامات</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoiceList.map((invoice) => {
              const customer = customers.find(c => c.id === invoice.customerId);
              const StatusIcon = statusIcons[invoice.status];
              return (
              <TableRow 
                key={invoice.id} 
                onClick={() => onEditInvoice(invoice)}
                className="cursor-pointer transition-colors hover:bg-muted/60"
              >
                <TableCell>
                  <div className="font-medium">{invoice.customerName}</div>
                  <div className="hidden text-sm text-muted-foreground md:inline">
                    {customer?.phone || 'شماره ثبت نشده'}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {invoice.invoiceNumber}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                   <div className={cn("flex items-center gap-2 font-medium", statusStyles[invoice.status])}>
                      <StatusIcon className="h-4 w-4" />
                      <span>{statusTranslation[invoice.status]}</span>
                   </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {new Date(invoice.date).toLocaleDateString('fa-IR')}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(invoice.total)}
                </TableCell>
                <TableCell className="text-left" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1 justify-end">
                      <Button onClick={(e) => { e.stopPropagation(); onPreviewInvoice(invoice.id); }} size="icon" variant="ghost" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">مشاهده</span>
                      </Button>
                      {invoice.status === 'Paid' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <TriangleAlert className={`h-5 w-5 ${invoice.status === 'Pending' ? 'text-orange-500' : 'text-red-600'}`} />
                      )}
                    </div>
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
      </CardContent>
       <CardFooter>
        <div className="text-xs text-muted-foreground">
          نمایش <strong>{invoiceList.length}</strong> از <strong>{invoiceList.length}</strong> فاکتور
        </div>
      </CardFooter>
    </Card>
  );
}
