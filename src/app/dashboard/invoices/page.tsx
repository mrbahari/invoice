import { MoreHorizontal, PlusCircle, File } from 'lucide-react';
import Link from 'next/link';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { invoices } from '@/lib/data';
import { formatCurrency } from '@/lib/utils';
import type { Invoice, InvoiceStatus } from '@/lib/definitions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

function InvoiceTable({ invoiceList }: { invoiceList: Invoice[] }) {
  return (
     <Card>
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
              <TableHead className="text-left">مبلغ</TableHead>
              <TableHead>
                <span className="sr-only">اقدامات</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoiceList.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>
                  <div className="font-medium">{invoice.customerName}</div>
                  <div className="hidden text-sm text-muted-foreground md:inline">
                    {invoice.customerEmail}
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
                <TableCell className="text-left">
                  {formatCurrency(invoice.total)}
                </TableCell>
                <TableCell className="text-left">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">باز کردن منو</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                       <DropdownMenuItem asChild>
                        <Link href={`/dashboard/invoices/${invoice.id}`} className="w-full cursor-pointer">
                          مشاهده جزئیات
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>ویرایش</DropdownMenuItem>
                      <DropdownMenuItem>علامت‌گذاری به عنوان پرداخت شده</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-500">
                        حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
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


export default function InvoicesPage() {
  const paidInvoices = invoices.filter(inv => inv.status === 'Paid');
  const pendingInvoices = invoices.filter(inv => inv.status === 'Pending');
  const overdueInvoices = invoices.filter(inv => inv.status === 'Overdue');

  return (
    <Tabs defaultValue="all">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">همه</TabsTrigger>
          <TabsTrigger value="paid">پرداخت شده</TabsTrigger>
          <TabsTrigger value="pending">در انتظار</TabsTrigger>
          <TabsTrigger value="overdue" className="hidden sm:flex">
            سررسید گذشته
          </TabsTrigger>
        </TabsList>
        <div className="mr-auto flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              خروجی
            </span>
          </Button>
          <Link href="/dashboard/invoices/new">
            <Button size="sm" className="h-8 gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                ایجاد فاکتور
              </span>
            </Button>
          </Link>
        </div>
      </div>
      <TabsContent value="all">
        <InvoiceTable invoiceList={invoices} />
      </TabsContent>
       <TabsContent value="paid">
        <InvoiceTable invoiceList={paidInvoices} />
      </TabsContent>
      <TabsContent value="pending">
        <InvoiceTable invoiceList={pendingInvoices} />
      </TabsContent>
      <TabsContent value="overdue">
        <InvoiceTable invoiceList={overdueInvoices} />
      </TabsContent>
    </Tabs>
  );
}
