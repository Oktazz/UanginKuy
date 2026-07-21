import * as React from "react"

// Standard Button UI combining docs/design.md rules
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", ...props }, ref) => {
    
    // Base styles: height 44px, radius 10px, padding 0 16px, font medium
    let baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-[44px] px-[16px] w-full sm:w-auto active:scale-[0.98] transition-transform"
    
    // Variant styles
    let variantStyles = ""
    switch(variant) {
      case "primary":
        variantStyles = "bg-primary text-white hover:bg-primary-dark shadow-sm"
        break
      case "secondary":
        variantStyles = "bg-secondary text-primary hover:bg-[#d6d09e]"
        break
      case "outline":
        variantStyles = "border border-gray-300 bg-transparent hover:bg-gray-100 text-gray-700"
        break
      case "ghost":
        variantStyles = "hover:bg-gray-100 hover:text-gray-900 text-gray-700"
        break
    }

    return (
      <button
        className={`${baseStyles} ${variantStyles} ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
