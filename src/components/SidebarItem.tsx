// components/SidebarItem.tsx
'use client'

import Link from 'next/link'

export default function SidebarItem({
  href,
  icon: Icon,
  label,
  active = false,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  active?: boolean
}) {
  return (
    <Link href={href} className="block">
      <div
        className={[
          'flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-[13px] transition-all',
          active
            ? 'bg-white text-black shadow-sm'
            : 'text-white/65 hover:bg-white/10',
        ].join(' ')}
      >
        <Icon
          className={
            active
              ? 'h-4 w-4 text-black/80'
              : 'h-4 w-4 text-white/55'
          }
        />
        <span className="truncate">{label}</span>
      </div>
    </Link>
  )
}
