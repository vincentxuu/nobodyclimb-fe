import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-[#1B1A1A] text-white hover:bg-[#292827] focus:ring-[#ffe70c]",
        secondary: "border border-[#1B1A1A] bg-transparent text-[#1B1A1A] hover:bg-[#f0f0f0] focus:ring-[#ffe70c]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        md: "h-10 px-6 py-2 text-sm",
        lg: "h-12 px-8 py-3 text-base",
        icon: "h-10 w-10",
      },
      hasIcon: {
        true: "gap-2",
        false: ""
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
      hasIcon: false
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  icon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, icon, hasIcon, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const hasIconValue = icon ? true : hasIcon
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, hasIcon: hasIconValue, className }))}
        ref={ref}
        {...props}
      >
        {props.children}
        {icon && icon}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
