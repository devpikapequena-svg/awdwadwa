// components/SidebarItem.tsx
'use client'

import Link from 'next/link'
import { LucideIcon } from 'lucide-react'

interface Props {
  href: string
  icon: LucideIcon
  label: string
  active?: boolean
  onClick?: () => void
}

export default function SidebarItem({ href, icon: Icon, label, active, onClick }: Props) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        flex items-center gap-3 px-3 py-2 rounded-lg
        transition-colors duration-200
        ${active
          ? 'bg-[#0f0f0f] text-white'
          : 'text-white/55 hover:text-white hover:bg-[#0c0c0c]'
        }
      `}
    >
      <Icon
        className={`
          h-4 w-4 transition-colors
          ${active ? 'text-white' : 'text-white/45'}
        `}
      />

      <span className="text-sm font-medium">{label}</span>
    </Link>
  )
}
