import * as React from "react"

export interface ToasterProps {
  className?: string
}

const Toaster = React.forwardRef<HTMLDivElement, ToasterProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={className}
        {...props}
      />
    )
  }
)
Toaster.displayName = "Toaster"

export { Toaster }