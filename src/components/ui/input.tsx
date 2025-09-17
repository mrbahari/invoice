
import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, value, ...props }, ref) => {
    
    const isRtl = true; // Or determine this from a context/prop

    const formatValue = (val: any) => {
      if (type === 'number' && typeof val === 'number' && isRtl) {
        try {
          return new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(val);
        } catch (e) {
          return val;
        }
      }
      return val;
    };

    return (
      <input
        type={type}
        value={formatValue(value)}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-right",
          "dir-rtl",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
