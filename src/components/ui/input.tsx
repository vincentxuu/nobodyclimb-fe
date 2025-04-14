import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  state?: "default" | "hover" | "focus" | "disabled" | "error"
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  device?: "desktop" | "mobile"
  textStatus?: "placeholder" | "filled"
  variant?: "default" | "outline"
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    state = "default", 
    leftIcon,
    rightIcon,
    device = "desktop",
    textStatus = "placeholder",
    variant = "default",
    ...props 
  }, ref) => {
    let baseClasses = "w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none";

    // 根據狀態設置樣式
    if (state === "default") {
      if (variant === "default") {
        baseClasses += " bg-white border-transparent";
      } else {
        baseClasses += " bg-white border-[#D3D3D3]";
      }
    } else if (state === "hover") {
      if (variant === "default") {
        baseClasses += " bg-[#F0F0F0] border-transparent";
      } else {
        baseClasses += " bg-[#F0F0F0] border-[#1B1A1A]";
      }
    } else if (state === "focus") {
      if (variant === "default") {
        baseClasses += " bg-[#F0F0F0] border-[#ffe70c]";
      } else {
        baseClasses += " bg-[#F0F0F0] border-[#ffe70c]";
      }
    } else if (state === "disabled") {
      baseClasses += " bg-[#F0F0F0] border-[#D3D3D3] opacity-50 cursor-not-allowed";
    } else if (state === "error") {
      baseClasses += " bg-[#FEE] border-[#ff4d4f]";
    }

    // 根據文字狀態設置樣式
    if (textStatus === "placeholder") {
      baseClasses += " text-[#9D9D9D]";
    } else {
      baseClasses += " text-[#1B1A1A]";
    }

    // 根據是否有圖標設置內邊距
    if (leftIcon && rightIcon) {
      baseClasses += " pl-9 pr-9";
    } else if (leftIcon) {
      baseClasses += " pl-9";
    } else if (rightIcon) {
      baseClasses += " pr-9";
    }

    return (
      <div className={cn("relative", className)}>
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            {leftIcon}
          </div>
        )}
        <input
          className={cn(baseClasses)}
          ref={ref}
          disabled={state === "disabled"}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightIcon}
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
