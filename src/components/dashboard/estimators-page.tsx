
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Box, Grid, MinusSquare, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { GridCeilingForm } from './estimators/grid-ceiling-form';
import { BoxCeilingForm } from './estimators/box-ceiling-form';
import type { Invoice } from '@/lib/definitions';

type EstimatorType = 'grid-ceiling' | 'box' | 'flat-ceiling';

const estimatorTypes = [
    {
        id: 'box' as EstimatorType,
        title: 'محاسبه مصالح باکس و نورمخفی',
        description: 'طول باکس را وارد کرده و لیست مصالح مورد نیاز را دریافت کنید.',
        icon: Box,
        component: BoxCeilingForm,
    },
    {
        id: 'grid-ceiling' as EstimatorType,
        title: 'محاسبه مصالح سقف مشبک',
        description: 'مساحت سقف را وارد کرده و لیست مصالح لازم را مشاهده کنید.',
        icon: Grid,
        component: GridCeilingForm,
    },
    {
        id: 'flat-ceiling' as EstimatorType,
        title: 'محاسبه مصالح سقف فلت',
        description: 'مساحت سقف را وارد کرده و برآورد مصالح لازم را دریافت کنید.',
        icon: MinusSquare,
        component: null, // Placeholder for future component
    }
];

type EstimatorsPageProps = {
    onNavigate: (tab: 'invoices', data?: { invoice: Invoice }) => void;
};

export default function EstimatorsPage({ onNavigate }: EstimatorsPageProps) {
  const [activeEstimator, setActiveEstimator] = useState<EstimatorType | null>(null);

  const handleCardClick = (estimatorId: EstimatorType) => {
    const estimator = estimatorTypes.find(e => e.id === estimatorId);
    if (estimator?.component) {
        setActiveEstimator(estimatorId);
    }
  };

  const handleBack = () => {
    setActiveEstimator(null);
  };

  if (activeEstimator) {
    const ActiveComponent = estimatorTypes.find(e => e.id === activeEstimator)?.component;
    if (ActiveComponent) {
        return (
            <div className="max-w-4xl mx-auto">
                 <div className="mb-4">
                    <Button onClick={handleBack} variant="outline">
                        <ArrowRight className="ml-2 h-4 w-4" />
                        بازگشت به لیست برآوردها
                    </Button>
                </div>
                <ActiveComponent onNavigate={onNavigate} />
            </div>
        );
    }
  }

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
            {estimatorTypes.map((estimator) => (
                <Card 
                    key={estimator.id}
                    onClick={() => handleCardClick(estimator.id)}
                    className={`flex flex-col transition-all hover:shadow-lg hover:-translate-y-1 ${estimator.component ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                >
                    <CardHeader className="flex-row gap-4 items-center">
                        <estimator.icon className="h-10 w-10 text-primary" />
                        <div>
                            <CardTitle>{estimator.title}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <CardDescription>{estimator.component ? estimator.description : 'این محاسبه‌گر به زودی اضافه خواهد شد.'}</CardDescription>
                    </CardContent>
                </Card>
            ))}
        </div>
    </div>
  );
}
