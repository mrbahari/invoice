
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, FilePen, CheckCircle, Trash2 } from 'lucide-react';
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

const statusStyles: Record<InvoiceStatus, string> = {
  Paid: 'text-green-600 bg-green-500/10',
  Pending: 'text-orange-600 bg-orange-500/10',
  Overdue: 'text-red-600 bg-red-500/10',
};
const statusTranslation: Record<InvoiceStatus, string> = {
    Paid: 'پرداخت شده',
    Pending: 'در انتظار',
    Overdue: 'سررسید گذشته',
};

type InvoiceTableProps = {
  invoiceList: Invoice[];
  customers: Customer[];
  onStatusChange: (invoiceId: string, status: InvoiceStatus) => void;
  onDeleteInvoice: (invoiceId: string) => void;
};

export function InvoiceTable({ invoiceList, customers, onStatusChange, onDeleteInvoice }: InvoiceTableProps) {
  const router = useRouter();

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
              return (
              <TableRow 
                key={invoice.id} 
                onClick={() => router.push(`/dashboard/invoices/${invoice.id}/edit`)}
                className="cursor-pointer transition-all hover:shadow-md hover:-translate-y-1"
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
                  <Badge className={`capitalize ${statusStyles[invoice.status]}`} variant="outline">
                    {statusTranslation[invoice.status]}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {new Date(invoice.date).toLocaleDateString('fa-IR')}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(invoice.total)}
                </TableCell>
                <TableCell className="text-left" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1 justify-end">
                      <Button asChild size="icon" variant="ghost" className="h-8 w-8">
                          <Link href={`/dashboard/invoices/${invoice.id}`}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">مشاهده</span>
                          </Link>
                      </Button>
                      {invoice.status !== 'Paid' && (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-600" onClick={() => onStatusChange(invoice.id, 'Paid')}>
                          <CheckCircle className="h-4 w-4" />
                          <span className="sr-only">پرداخت</span>
                        </Button>
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
          نمایش <strong>1-{invoiceList.length}</strong> از <strong>{invoiceList.length}</strong> فاکتور
        </div>
      </CardFooter>
    </Card>
  );
}
