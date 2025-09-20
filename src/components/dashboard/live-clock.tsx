
'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns-jalali';
import { Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LiveClock() {
  const [currentDateTime, setCurrentDateTime] = useState({ date: '', time: ''});

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const date = format(now, 'eeee, d MMMM yyyy');
      const time = format(now, 'HH:mm');
      setCurrentDateTime({ date, time });
    };

    updateDateTime();
    const timerId = setInterval(updateDateTime, 60000); // Update every minute

    return () => clearInterval(timerId);
  }, []);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{currentDateTime.date}</span>
        </div>
         <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{currentDateTime.time}</span>
        </div>
    </div>
  );
}
