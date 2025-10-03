
'use client';

export function LoadingSpinner() {
  
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative h-20 w-20">
        <div className="absolute left-0 top-0 h-8 w-8 animate-[spin_1.5s_linear_infinite] rounded-sm bg-primary" style={{ animationDelay: '-0.8s' }}></div>
        <div className="absolute right-0 top-0 h-8 w-8 animate-[spin_1.5s_linear_infinite] rounded-sm bg-primary" style={{ animationDelay: '-0.4s' }}></div>
        <div className="absolute bottom-0 right-0 h-8 w-8 animate-[spin_1.5s_linear_infinite] rounded-sm bg-primary" style={{ animationDelay: '0s' }}></div>
        <div className="absolute bottom-0 left-0 h-8 w-8 animate-[spin_1.5s_linear_infinite] rounded-sm bg-primary" style={{ animationDelay: '-1.2s' }}></div>
      </div>
      <p className="mt-8 text-lg font-medium text-foreground tracking-wider">
        درحال بارگذاری...
      </p>
    </div>
  );
}
