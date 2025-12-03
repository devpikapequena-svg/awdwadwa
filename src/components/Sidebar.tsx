// components/Sidebar.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Wallet2,
  ReceiptText,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import SidebarItem from './SidebarItem'

export default function Sidebar({ user }: { user: any }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isBruxin =
    user &&
    (String(user.name || '').toLowerCase().includes('bruxin') ||
      String(user.email || '').toLowerCase() === 'bruxin@exec.gg')

  const roleLabel = isBruxin ? 'Owner' : 'Member'
  const avatarUrl = user?.image || '/exec-avatar.png'

  return (
    <>
      {/* BOTÃO MOBILE */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 bg-black/40 backdrop-blur-md p-2 rounded-lg border border-white/10"
      >
        <Menu className="h-5 w-5 text-white" />
      </button>

      {/* OVERLAY MOBILE */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed z-50 md:static
          h-screen w-64 flex flex-col          /* AQUI: h-full -> h-screen */
          border-r border-[#151515]
          bg-gradient-to-b from-[#050505] via-[#050505] to-[#02040a]
          px-5 py-6
          transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* FECHAR MOBILE */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden absolute top-3 right-3 p-2 rounded-lg bg-white/10 z-[9999]"
        >
          <X className="h-5 w-5 text-white" />
        </button>

        {/* USER CARD */}
        <div className="mb-8 flex items-center gap-3 rounded-2xl border border-white/5 px-4 py-3 backdrop-blur-sm shadow-[0_0_25px_rgba(0,0,0,0.45)]">
          <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-[#0f172a]">
            <Image
              src={avatarUrl}
              alt={user?.name || 'Avatar Exec'}
              fill
              className="object-cover"
            />
          </div>

          <div className="flex flex-col flex-1">
            <span className="truncate text-sm font-semibold text-white">
              {user?.name || 'Gestor(a)'}
            </span>
            <span className="text-[11px] text-white/45">{roleLabel}</span>
          </div>
        </div>

        {/* MENU */}
        <nav className="flex-1 space-y-8 text-sm overflow-y-auto">
          <div className="space-y-3">
            <p className="px-1 text-[11px] uppercase tracking-[0.16em] text-white/35">
              Navegação
            </p>

            <SidebarItem
              href="/dashboard"
              icon={LayoutDashboard}
              label="Visão geral"
              active={pathname === '/dashboard'}
              onClick={() => setMobileOpen(false)}
            />

            <SidebarItem
              href="/projetos"
              icon={Users}
              label="Parceiros & sites"
              active={pathname.startsWith('/projetos')}
              onClick={() => setMobileOpen(false)}
            />

            <SidebarItem
              href="/vendas"
              icon={ShoppingBag}
              label="Vendas"
              active={pathname.startsWith('/vendas')}
              onClick={() => setMobileOpen(false)}
            />
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <div className="space-y-3">
            <p className="px-1 text-[11px] uppercase tracking-[0.16em] text-white/35">
              Integrações & financeiro
            </p>

            <SidebarItem
              href="/financeiro"
              icon={Wallet2}
              label="Resumo financeiro"
              active={pathname.startsWith('/financeiro')}
              onClick={() => setMobileOpen(false)}
            />

            <SidebarItem
              href="/notas"
              icon={ReceiptText}
              label="Comissões & repasses"
              active={pathname.startsWith('/notas')}
              onClick={() => setMobileOpen(false)}
            />
          </div>
        </nav>

        <div className="mt-8 rounded-2xl border border-white/10 px-4 py-4 text-center">
          <p className="text-[10px] tracking-wide text-white/40">
            Powered by{' '}
            <span className="font-semibold text-emerald-400">
              Exec v2.4.1
            </span>
          </p>
        </div>
      </aside>
    </>
  )
}
