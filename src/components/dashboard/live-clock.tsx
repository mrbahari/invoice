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
    <div className="flex items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>{currentDateTime.date}</span>
        </div>
         <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>{currentDateTime.time}</span>
        </div>
    </div>
  );
}
