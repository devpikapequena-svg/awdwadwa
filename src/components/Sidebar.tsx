// components/Sidebar.tsx
'use client'

import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  ReceiptText,
  BarChart3,
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
  const avatarUrl = user?.image || '/avatar.jpg'

  return (
    <>
      {/* BOTÃO MOBILE */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 bg-[#0b0b0b] border border-[#151515] backdrop-blur-md p-2 rounded-xl"
      >
        <Menu className="h-5 w-5 text-white" />
      </button>

      {/* OVERLAY MOBILE */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          w-64 flex flex-col
          border-r border-[#151515]
          bg-[#070707]
          px-5 py-6
          transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* FECHAR MOBILE */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden absolute top-3 right-3 p-2 rounded-xl bg-[#111111] border border-[#1f1f1f] z-[9999]"
        >
          <X className="h-5 w-5 text-white" />
        </button>

        {/* TOPO / LOGO + NOME DO PRODUTO */}
        <div className="mb-6 flex items-center gap-2">
          <div className="relative h-8 w-8 overflow-hidden rounded-xl bg-[#111111]">
            <Image
              src="/logo.png"
              alt="Exec EQP"
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-white/40">EQP Dashboard</span>
            <span className="text-sm font-semibold text-white/90">
              Área do gestor
            </span>
          </div>
        </div>

        {/* NAV LINKS */}
        <nav className="flex-1 space-y-8 text-sm overflow-y-auto pr-1">
          {/* BLOCO: NAVEGAÇÃO */}
          <div className="space-y-3">
            <p className="px-1 text-[11px] font-medium text-white/45">
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
              href="/vendas"
              icon={ShoppingBag}
              label="Vendas"
              active={pathname.startsWith('/vendas')}
              onClick={() => setMobileOpen(false)}
            />
          </div>

          {/* BLOCO: GESTÃO */}
          <div className="space-y-3">
            <p className="px-1 text-[11px] font-medium text-white/45">
              Gestão
            </p>

            <SidebarItem
              href="/projetos"
              icon={Users}
              label="Parceiros & sites"
              active={pathname.startsWith('/projetos')}
              onClick={() => setMobileOpen(false)}
            />
          </div>

          {/* BLOCO: FINANCEIRO */}
          <div className="space-y-3">
            <p className="px-1 text-[11px] font-medium text-white/45">
              Financeiro
            </p>

            <SidebarItem
              href="/ads"
              icon={BarChart3}
              label="Gastos"
              active={pathname.startsWith('/ads')}
              onClick={() => setMobileOpen(false)}
            />

            <SidebarItem
              href="/notas"
              icon={ReceiptText}
              label="Comissões"
              active={pathname.startsWith('/notas')}
              onClick={() => setMobileOpen(false)}
            />
          </div>
        </nav>

        {/* FOOTER DO SIDEBAR / USER + AMBIENTE */}
        <div className="mt-6 border-t border-[#151515] pt-4">
          {/* User mini-card */}
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-8 rounded-full overflow-hidden border border-white/10 bg-[#111111]">
              <Image
                src={avatarUrl}
                alt={user?.name || user?.email || 'Usuário'}
                fill
                className="object-cover"
              />
            </div>

            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium text-white/90 truncate">
                {user?.name || user?.email || 'Usuário'}
              </span>
              <div className="mt-[2px] flex items-center gap-2 text-[11px] text-white/40">
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>{roleLabel}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[10px] text-white/35">
            <span>EQP Dashboard</span>
            <span className="inline-flex items-center rounded-full border border-[#202020] bg-[#101010] px-2 py-[2px] text-[10px] text-white/55">
              v2.4.1
            </span>
          </div>
        </div>
      </aside>
    </>
  )
}
