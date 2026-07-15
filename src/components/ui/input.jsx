import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, dir = "auto", ...props }, ref) => {
  return (
    <input
      type={type}
      dir={dir}
      className={cn(
        "flex h-10 w-full rounded-xl border border-white/60 bg-white/60 backdrop-blur-md px-3.5 py-2 text-sm shadow-sm ring-offset-background transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-primary/60 focus-visible:bg-white/80 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }