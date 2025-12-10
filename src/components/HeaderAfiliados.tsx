'use client'

import Link from 'next/link'
import { useState } from 'react'
import { HiArrowRight } from 'react-icons/hi'
import Image from 'next/image'

export default function HeaderAfiliados() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/10">
      
      {/* Glow suave atrás do header */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),transparent_70%)] opacity-50" />

      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:py-5">
        
{/* LOGO */}
<Link href="/" className="flex items-center gap-3 select-none">
  <div className="relative h-8 w-8">
    <Image
      src="/logo.png"
      alt="Logo"
      fill
      className="object-contain"
      priority
    />
  </div>

          <div className="flex flex-col leading-tight">
            <span className="text-[14px] font-medium text-white">
              EQP Dashboard
            </span>
            <span className="text-[11px] text-white/40">
              Financial overview
            </span>
          </div>
        </Link>



        {/* BOTÃO LOGIN DESKTOP */}
        <Link
          href="/login"
          className="
            hidden md:inline-flex items-center gap-1 h-9 px-4 rounded-full
            bg-white/10 border border-white/20 text-white/80
            hover:bg-white hover:text-black hover:border-white
            transition-all text-[13px]
          "
        >
          Entrar
          <HiArrowRight className="h-4 w-4" />
        </Link>

        {/* BOTÃO MOBILE */}
        <button
          className="md:hidden h-9 w-9 flex items-center justify-center rounded-full border border-white/15 text-white/80"
          onClick={() => setOpen(!open)}
        >
          <div className="space-y-1.5">
            <span className="block h-[2px] w-5 rounded bg-white transition-all" />
            <span className="block h-[2px] w-5 rounded bg-white transition-all" />
          </div>
        </button>
      </div>

   {/* MENU MOBILE */}
{open && (
  <div className="absolute left-0 top-full w-full border-b border-white/10 bg-black/95 backdrop-blur-xl md:hidden">
    <nav className="flex flex-col gap-1 px-5 py-4 text-sm text-white/70">


      <Link
        href="/login"
        onClick={() => setOpen(false)}
        className="mt-3 inline-flex items-center gap-1 py-2 text-white hover:text-white"
      >
        Entrar
        <HiArrowRight className="h-4 w-4" />
      </Link>
    </nav>
  </div>
)}
    </header>
  )
}
