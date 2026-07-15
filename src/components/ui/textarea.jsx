import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, dir = "auto", ...props }, ref) => {
  return (
    <textarea
      dir={dir}
      className={cn(
        "flex min-h-[80px] w-full rounded-xl border border-white/60 bg-white/60 backdrop-blur-md px-3.5 py-2.5 text-sm shadow-sm ring-offset-background transition-all placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-primary/60 focus-visible:bg-white/80 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
