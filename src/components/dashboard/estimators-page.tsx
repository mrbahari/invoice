
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Box, Grid, MinusSquare } from 'lucide-react';

const estimatorTypes = [
    {
        title: 'محاسبه مصالح باکس و نورمخفی',
        description: 'طول باکس را وارد کرده و لیست مصالح مورد نیاز را دریافت کنید.',
        icon: Box,
        link: '/estimators/box'
    },
    {
        title: 'محاسبه مصالح سقف مشبک',
        description: 'مساحت سقف را وارد کرده و لیست مصالح لازم را مشاهده کنید.',
        icon: Grid,
        link: '/estimators/grid-ceiling'
    },
    {
        title: 'محاسبه مصالح سقف فلت',
        description: 'مساحت سقف را وارد کرده و برآورد مصالح لازم را دریافت کنید.',
        icon: MinusSquare,
        link: '/estimators/flat-ceiling'
    }
];

export default function EstimatorsPage() {
  return (
    <div className='grid gap-8'>
        <Card className="animate-fade-in-up">
            <CardHeader>
                <CardTitle>برآورد مصالح</CardTitle>
                <CardDescription>
                نوع محاسبه مورد نظر خود را برای برآورد مصالح انتخاب کنید.
                </CardDescription>
            </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            {estimatorTypes.map((estimator, index) => (
                <Card 
                    key={index}
                    className="flex flex-col transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                >
                    <CardHeader className="flex-row gap-4 items-center">
                        <estimator.icon className="h-10 w-10 text-primary" />
                        <div>
                            <CardTitle>{estimator.title}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <CardDescription>{estimator.description}</CardDescription>
                    </CardContent>
                </Card>
            ))}
        </div>
    </div>
  );
}
