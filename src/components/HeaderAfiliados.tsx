'use client'

import Link from 'next/link'
import { useState } from 'react'
import { HiArrowRight } from 'react-icons/hi'

export default function HeaderAfiliados() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-[#05070d]/70 backdrop-blur-xl border-b border-white/5">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">

        {/* LOGO */}
        <div className="flex flex-col leading-tight select-none">
          <span className="text-[13px] font-semibold tracking-[0.28em] text-white/80 uppercase">
            EQP
          </span>
          <span className="text-[11px] text-white/35 mt-0">Dashboard</span>
        </div>

        {/* NAV DESKTOP */}
        <nav className="hidden md:flex items-center gap-8 text-[14px] font-medium text-white/50">
          <Link href="#servicos" className="transition hover:text-white">
            Serviços
          </Link>
          <Link href="#sobre" className="transition hover:text-white">
            Sobre
          </Link>
          <Link href="#contato" className="transition hover:text-white">
            Contato
          </Link>
        </nav>

        {/* BOTÃO LOGIN */}
        <Link
          href="/login"
          className="
            hidden md:inline-flex h-9 items-center justify-center px-4 
            rounded-full bg-emerald-500/10 text-emerald-400 
            ring-1 ring-emerald-400/40 
            hover:bg-emerald-400 hover:text-black hover:ring-emerald-300
            transition-all
          "
        >
          Entrar
          <HiArrowRight className="ml-1 h-4 w-4" />
        </Link>

        {/* BOTÃO MOBILE */}
        <button
          className="inline-flex md:hidden h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/70"
          onClick={() => setOpen(!open)}
        >
          <span className="sr-only">Abrir menu</span>
          <div className="space-y-1.5">
            <span className="block h-[2px] w-5 rounded bg-white" />
            <span className="block h-[2px] w-5 rounded bg-white" />
          </div>
        </button>
      </div>

      {/* MENU MOBILE */}
      {open && (
        <div className="absolute left-0 top-full w-full border-b border-white/10 bg-[#05070d]/95 backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-1 px-5 py-4 text-sm text-white/70">

            <Link
              href="#servicos"
              onClick={() => setOpen(false)}
              className="py-2 hover:text-white"
            >
              Serviços
            </Link>

            <Link
              href="#planos"
              onClick={() => setOpen(false)}
              className="py-2 hover:text-white"
            >
              Planos
            </Link>

            <Link
              href="#sobre"
              onClick={() => setOpen(false)}
              className="py-2 hover:text-white"
            >
              Sobre
            </Link>

            <Link
              href="#contato"
              onClick={() => setOpen(false)}
              className="py-2 hover:text-white"
            >
              Contato
            </Link>

            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="mt-2 py-2 text-emerald-400 hover:text-emerald-300"
            >
              Entrar
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
