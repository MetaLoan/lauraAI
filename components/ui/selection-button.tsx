'use client'

import React from 'react'

interface SelectionButtonProps {
  label: string
  isSelected: boolean
  onClick: () => void
  className?: string
}

export function SelectionButton({
  label,
  isSelected,
  onClick,
  className = '',
}: SelectionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-xl text-left text-lg font-medium transition-all ${
        isSelected
          ? 'bg-white/20 border border-white/40'
          : 'bg-white/5 border border-white/10 hover:border-white/20'
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <span>{label}</span>
        {isSelected && <span className="text-xl">✓</span>}
      </div>
    </button>
  )
}
