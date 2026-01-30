'use client'

import React from 'react'
import { Button } from './button'
import { X } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
  variant?: 'danger' | 'warning' | 'default'
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '確認',
  cancelText = '取消',
  isLoading = false,
  variant = 'default',
}: ConfirmDialogProps) {
  if (!isOpen) return null

  const confirmButtonClass =
    variant === 'danger'
      ? 'bg-red-600 text-white hover:bg-red-700'
      : variant === 'warning'
        ? 'bg-yellow-600 text-white hover:bg-yellow-700'
        : 'bg-[#1B1A1A] text-white hover:bg-[#3F3D3D]'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          disabled={isLoading}
        >
          <X size={20} />
        </button>

        {/* Title */}
        <h2 className="mb-2 text-xl font-medium text-[#1B1A1A]">{title}</h2>

        {/* Message */}
        <p className="mb-6 text-[#6D6C6C]">{message}</p>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="border-[#B6B3B3] text-[#3F3D3D] hover:bg-[#F5F5F5]"
          >
            {cancelText}
          </Button>
          <Button onClick={onConfirm} disabled={isLoading} className={confirmButtonClass}>
            {isLoading ? '處理中...' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
