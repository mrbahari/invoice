
'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns-jalali';
import { Calendar, Clock } from 'lucide-react';

export function LiveClock() {
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const formattedDateTime = format(now, 'eeee, d MMMM yyyy, HH:mm', {
        // No need for locale: faIR here, date-fns-jalali handles it
      });
      setCurrentDateTime(formattedDateTime);
    };

    updateDateTime();
    const timerId = setInterval(updateDateTime, 60000); // Update every minute

    return () => clearInterval(timerId);
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Calendar className="h-4 w-4" />
      <span>{currentDateTime.split(',')[0]}, {currentDateTime.split(',')[1]}</span>
      <Clock className="h-4 w-4 mr-2" />
      <span>{currentDateTime.split(',')[2]}</span>
    </div>
  );
}
