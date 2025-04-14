'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

// 定義預設頭像選項
export const DEFAULT_AVATARS = [
  {
    id: 'default1',
    bgColor: '#EBEAEA',
    fgColor: '#B6B3B3'
  },
  {
    id: 'default2',
    bgColor: '#FFE70C',
    fgColor: '#EBEAEA'
  },
  {
    id: 'default3',
    bgColor: '#1B1A1A',
    fgColor: '#FFE70C'
  },
  {
    id: 'default4',
    bgColor: '#78BE9D',
    fgColor: '#EBEAEA'
  },
  {
    id: 'default5',
    bgColor: '#8C54A4',
    fgColor: '#EBEAEA'
  },
  {
    id: 'default6',
    bgColor: '#E66060',
    fgColor: '#EBEAEA'
  }
]

// 產生頭像元素
export function generateAvatarElement(avatarStyle: typeof DEFAULT_AVATARS[0], size = 'w-10 h-10') {
  return (
    <div className={`${size} rounded-full overflow-hidden flex items-center justify-center`} style={{ backgroundColor: avatarStyle.bgColor }}>
      <div className="w-full h-full flex flex-col">
        <div className="w-full h-1/2 rounded-t-full" style={{ backgroundColor: avatarStyle.fgColor }} />
        <div className="w-full h-1/2" style={{ backgroundColor: avatarStyle.fgColor }} />
      </div>
    </div>
  )
}

interface AvatarOptionsProps {
  value: string;
  onChange: (value: string) => void;
}

export function AvatarOptions({ value, onChange }: AvatarOptionsProps) {
  return (
    <div className="grid grid-cols-3 gap-4 p-4">
      {DEFAULT_AVATARS.map((avatar) => (
        <motion.button
          key={avatar.id}
          className="relative flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onChange(avatar.id)}
        >
          {generateAvatarElement(avatar, 'w-16 h-16')}
          
          {value === avatar.id && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-full">
              <Check className="text-white w-6 h-6" />
            </div>
          )}
        </motion.button>
      ))}
    </div>
  )
}

// 透過 ID 獲取頭像樣式
export function getAvatarStyleById(id: string) {
  return DEFAULT_AVATARS.find(avatar => avatar.id === id) || DEFAULT_AVATARS[0];
}
