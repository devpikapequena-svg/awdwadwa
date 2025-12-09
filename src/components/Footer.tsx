"use client"

import Link from "next/link"

export default function Footer() {
  return (
    <footer className="mt-32 border-t border-white/10 bg-[#0a0a0a]">
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        
        {/* LOGO + DESCRIÇÃO */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-12">
          
          {/* BLOCO ESQUERDO */}
          <div className="max-w-sm">
            <h3 className="text-lg font-semibold tracking-wide text-white">
              EQP Finance
            </h3>
            <p className="mt-3 text-sm text-white/55">
              Plataforma inteligente para controle financeiro, conciliação,
              integrações e automações avançadas — tudo em um único ecossistema.
            </p>

            {/* SOCIALS */}
            <div className="mt-6 flex gap-4">
              <a href="#" className="text-white/40 hover:text-white transition">Twitter</a>
              <a href="#" className="text-white/40 hover:text-white transition">LinkedIn</a>
              <a href="#" className="text-white/40 hover:text-white transition">Instagram</a>
            </div>
          </div>

          {/* LINKS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 text-sm">
            
            <div className="space-y-3">
              <p className="font-medium text-white/80">Produto</p>
              <Link href="#features" className="block text-white/45 hover:text-white transition">Recursos</Link>
              <Link href="#conciliation" className="block text-white/45 hover:text-white transition">Conciliação</Link>
              <Link href="#mobile-app" className="block text-white/45 hover:text-white transition">App Mobile</Link>
              <Link href="#integrations" className="block text-white/45 hover:text-white transition">Integrações</Link>
            </div>

            <div className="space-y-3">
              <p className="font-medium text-white/80">Empresa</p>
              <Link href="#" className="block text-white/45 hover:text-white transition">Sobre nós</Link>
              <Link href="#" className="block text-white/45 hover:text-white transition">Carreiras</Link>
              <Link href="#" className="block text-white/45 hover:text-white transition">Blog</Link>
              <Link href="#" className="block text-white/45 hover:text-white transition">Contato</Link>
            </div>

            <div className="space-y-3">
              <p className="font-medium text-white/80">Legal</p>
              <Link href="#" className="block text-white/45 hover:text-white transition">Privacidade</Link>
              <Link href="#" className="block text-white/45 hover:text-white transition">Termos de uso</Link>
              <Link href="#" className="block text-white/45 hover:text-white transition">Segurança</Link>
            </div>

          </div>
        </div>

{/* LINHA FULL WIDTH */}
<div className="mt-12 w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] h-px bg-white/10"></div>

        {/* COPYRIGHT */}
        <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} EQP Finance — Todos os direitos reservados.
          </p>

          <div className="flex gap-4 text-xs text-white/40">
            <Link href="#" className="hover:text-white transition">Status</Link>
            <Link href="#" className="hover:text-white transition">Roadmap</Link>
            <Link href="#" className="hover:text-white transition">Suporte</Link>
          </div>
        </div>

      </div>
    </footer>
  )
}
