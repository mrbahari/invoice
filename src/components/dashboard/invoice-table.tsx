
'use client';

import { Eye, CheckCircle2, TriangleAlert, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import type { Invoice, InvoiceStatus } from '@/lib/definitions';
import { cn } from '@/lib/utils';
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
  Pending: TriangleAlert,
  Overdue: TriangleAlert,
};

type InvoiceTableProps = {
  invoiceList: Invoice[];
  onEdit: (invoiceId: string) => void;
  onPreview: (invoiceId: string) => void;
  onDelete: (invoiceId: string) => void;
};

export function InvoiceTable({ invoiceList, onEdit, onPreview, onDelete }: InvoiceTableProps) {
  return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>مشتری</TableHead>
              <TableHead className="hidden sm:table-cell">شماره فاکتور</TableHead>
              <TableHead className="hidden sm:table-cell">وضعیت</TableHead>
              <TableHead className="hidden md:table-cell">تاریخ</TableHead>
              <TableHead className="text-right">مبلغ</TableHead>
              <TableHead><span className="sr-only">اقدامات</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoiceList.map((invoice) => {
              const StatusIcon = statusIcons[invoice.status];
              return (
              <TableRow key={invoice.id}>
                <TableCell>
                  <div className="font-medium">{invoice.customerName}</div>
                  <div className="hidden text-sm text-muted-foreground md:inline">
                    {invoice.customerEmail}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">{invoice.invoiceNumber}</TableCell>
                <TableCell className="hidden sm:table-cell">
                   <div className={cn("flex items-center gap-2 font-medium", statusStyles[invoice.status])}>
                      <StatusIcon className="h-4 w-4" />
                      <span>{statusTranslation[invoice.status]}</span>
                   </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{new Date(invoice.date).toLocaleDateString('fa-IR')}</TableCell>
                <TableCell className="text-right">{formatCurrency(invoice.total)}</TableCell>
                <TableCell className="text-left">
                    <div className="flex items-center gap-1 justify-end">
                      <Button onClick={() => onEdit(invoice.id)} size="icon" variant="ghost" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">ویرایش</span>
                      </Button>
                      <Button onClick={() => onPreview(invoice.id)} size="icon" variant="ghost" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">مشاهده</span>
                      </Button>
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive/80">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">حذف</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>حذف فاکتور</AlertDialogTitle><AlertDialogDescription>آیا از حذف فاکتور «{invoice.invoiceNumber}» مطمئن هستید؟ این عمل غیرقابل بازگشت است.</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>انصراف</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDelete(invoice.id)}>حذف</AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                    </div>
                </TableCell>
              </TableRow>
            )})}
             {invoiceList.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                        هیچ فاکتوری یافت نشد.
                    </TableCell>
                </TableRow>
             )}
          </TableBody>
        </Table>
  );
}
