"use client"

import React, { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion"
import Link from "next/link"

interface PopoverProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  closeOnClick?: boolean
}

interface PopoverTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  align?: "start" | "center" | "end"
  sideOffset?: number
  ref?: React.RefObject<HTMLDivElement> | ((node: HTMLDivElement | null) => void)
}

// 簡易版彈出菜單根元素
interface PopoverContextType {
  open: boolean;
  setOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  triggerRef: React.RefObject<HTMLElement>;
  closeOnClick?: boolean;
}

const PopoverContext = React.createContext<PopoverContextType>({
  open: false,
  setOpen: () => {},
  triggerRef: { current: null },
  closeOnClick: true
});

const Popover = ({ 
  children, 
  open: controlledOpen, 
  onOpenChange,
  closeOnClick = true
}: PopoverProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const triggerRef = useRef<HTMLElement>(null);
  
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  
  const setOpen = (value: boolean | ((prev: boolean) => boolean)) => {
    if (!isControlled) {
      setUncontrolledOpen(value);
    }
    if (onOpenChange) {
      const newValue = typeof value === "function" ? value(open) : value;
      onOpenChange(newValue);
    }
  };

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef, closeOnClick }}>
      {children}
    </PopoverContext.Provider>
  );
};

// 觸發器
const PopoverTrigger: React.FC<PopoverTriggerProps> = ({ 
  children, 
  asChild = false
}) => {
  const { open, setOpen, triggerRef } = React.useContext(PopoverContext);
  
  // 檢查是否已經是按鈕元素
  const isButton = asChild || 
    (React.isValidElement(children) && (
      children.type === 'button' || 
      (typeof children.type === 'string' && children.type.toLowerCase() === 'button') ||
      (typeof children.type === 'function' && 'displayName' in children.type && children.type.displayName === 'Button')
    ));

  // 如果指定asChild或者子元素已經是按鈕，則直接使用子元素
  // 否則再包裝成按鈕
  const child = isButton ? 
    React.Children.only(children) as React.ReactElement : 
    <button type="button">{children}</button>;
    
  return React.cloneElement(child, {
    ref: triggerRef,
    onClick: (e: React.MouseEvent) => {
      setOpen(!open);
      if (child.props.onClick) {
        child.props.onClick(e);
      }
    }
  });
};

// 內容
// Add type definitions for cloned elements
type CloneElementType = React.ReactElement<{
  onClick?: (e: React.MouseEvent) => void;
  href?: string;
  children?: React.ReactNode;
}>;

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(({
  children,
  align = "center",
  sideOffset = 4,
  className,
  ...props
}, ref) => {
  const { open, setOpen, triggerRef, closeOnClick } = React.useContext(PopoverContext);
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  
  // 計算位置
  const calcPosition = () => {
    if (!triggerRef.current || !contentRef.current) {
      return { top: 0, left: 0 };
    }
    
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();
    
    let left = triggerRect.left; // 預設為觸發器的左側
    
    // 部落格按鈕特別處理
    const isColumnArticleButton = triggerRef.current.id === 'column-article-button';
    if (isColumnArticleButton) {
      // 將下拉選單放在「部落格」按鈕正下方
      left = triggerRect.left;
    }
    else if (align === "center") {
      left = triggerRect.left + (triggerRect.width / 2) - (contentRect.width / 2);
    } else if (align === "end") {
      left = triggerRect.right - contentRect.width;
    }
    
    // 確保不會超出視窗左側
    if (left < 10) {
      left = 10;
    }
    
    // 確保不會超出視窗右側
    const viewportWidth = window.innerWidth;
    if (left + contentRect.width > viewportWidth - 10) {
      left = viewportWidth - contentRect.width - 10;
    }
    
    const top = triggerRect.bottom + sideOffset + 5; // 增加額外的垂直空間，避開跟底線重疊
    
    return { top, left };
  };
  
  useEffect(() => {
    // 當內容顯示時，計算位置
    if (open && contentRef.current) {
      setPosition(calcPosition());
    }
  }, [open]);
  
  useEffect(() => {
    // 重新計算位置（為了解決初始寬度計算問題）
    const handleResize = () => {
      if (open && contentRef.current) {
        setPosition(calcPosition());
      }
    };
    
    // 添加一個小延遲，確保內容已經渲染
    const timer = setTimeout(() => {
      if (open && contentRef.current) {
        setPosition(calcPosition());
      }
    }, 10);
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [open]);
  
  useEffect(() => {
    // 點擊外部關閉
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contentRef.current && 
        !contentRef.current.contains(event.target as Node) &&
        triggerRef.current && 
        !triggerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, setOpen, triggerRef]);
  
  // 處理子元素點擊關閉功能
  const wrapChildrenWithClickHandler = (children: React.ReactNode): React.ReactNode => {
    return React.Children.map(children, (child) => {
      if (!React.isValidElement(child)) return child;

      // 處理連結元素
      if (child.type === 'a' || 
          (typeof child.type === 'string' && child.type.toLowerCase() === 'a') || 
          child.type === Link) {
        return React.cloneElement(child as CloneElementType, {
          onClick: (e: React.MouseEvent) => {
            if (closeOnClick) setOpen(false);
            if (child.props.onClick) child.props.onClick(e);
          },
        });
      } 
      // 遞迴處理子元素中的連結
      else if (child.props.children) {
        return React.cloneElement(child as CloneElementType, {
          children: wrapChildrenWithClickHandler(child.props.children)
        });
      }

      return child;
    });
  };
  
  const wrappedChildren = closeOnClick ? wrapChildrenWithClickHandler(children) : children;
  
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ 
            duration: 0.25,
            ease: [0.16, 1, 0.3, 1] // 使用自定義 cubic-bezier 曲線，讓動畫更流暢
          }}
          ref={(node) => {
            // 處理 forwarded ref
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
            }
            // 處理內部 ref
            contentRef.current = node;
          }}
          style={{
            position: 'fixed',
            top: position.top,
            left: position.left,
            zIndex: 100
          }}
          className={cn(
            "min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 text-popover-foreground shadow-md outline-none",
            className
          )}
          {...props as HTMLMotionProps<"div">}
        >
          {wrappedChildren}
        </motion.div>
      )}
    </AnimatePresence>
  );
});

PopoverContent.displayName = "PopoverContent";

export { Popover, PopoverTrigger, PopoverContent };
