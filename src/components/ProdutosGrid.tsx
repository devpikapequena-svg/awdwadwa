'use client'

import Link from 'next/link'
import { produtosNovidades } from '@/data/produtosnovidades'
import { useCart } from '@/context/CartContext'
import { useState } from 'react'

export default function ProdutosGrid() {
  const { addToCart } = useCart()
  const [adding, setAdding] = useState<string | null>(null)

  const parsePreco = (preco: string) =>
    parseFloat(preco.replace('R$', '').replace(',', '.').trim())

  // 🟢 Adicionar ao carrinho
  const handleAddToCart = (produto: any) => {
    setAdding(produto.slug)
    addToCart({ ...produto, quantity: 1 })
    setTimeout(() => setAdding(null), 800)
  }

  return (
    <section className="w-full bg-[#f7f7f7] py-16">
      <div className="max-w-[1300px] mx-auto px-6">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {produtosNovidades.map((p, i) => {
            const preco = parsePreco(p.price)
            const pagueLeve = preco > 35

            return (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition relative flex flex-col overflow-hidden"
              >
                {/* 🎁 Tag “Pague 1 Leve 2” */}
                {pagueLeve && (
                  <div className="absolute left-0 top-3 bg-[#ff007a] text-white text-[12px] font-bold py-[2px] px-3 rounded-r-md shadow-sm z-[2]">
                    🎁 Pague 1 Leve 2
                  </div>
                )}

                {/* ❤️ Ícone favorito */}
                <button className="absolute right-3 top-3 bg-white w-7 h-7 rounded-full shadow-sm border border-gray-200 flex items-center justify-center hover:bg-gray-100 z-[3]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.6"
                    stroke="#555"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 8.25c0-2.485-2.239-4.5-5-4.5-1.74 0-3.31.906-4 
                      2.292A4.48 4.48 0 008 3.75c-2.761 
                      0-5 2.015-5 4.5 0 7.25 9 12 9 
                      12s9-4.75 9-12z"
                    />
                  </svg>
                </button>

                {/* 🧸 Imagem */}
                <Link href={`/produto/${p.slug}`}>
                  <div className="flex justify-center items-center h-[200px] mt-6">
                    <img
                      src={p.img}
                      alt={p.title}
                      className="w-[160px] h-[160px] object-contain"
                    />
                  </div>
                </Link>

                {/* ⭐ Avaliação */}
                <div className="flex items-center px-4 mt-2 mb-1">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <svg
                        key={i}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="#FFD700"
                        className="w-4 h-4"
                      >
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 
                        9.24l-7.19-.61L12 2 9.19 
                        8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    ))}
                </div>

                {/* 🏷️ Nome e preço */}
                <div className="px-4 flex flex-col justify-between flex-grow">
                  <h3 className="text-[14.5px] font-semibold text-[#1a1a1a] leading-snug mt-1">
                    {p.title}
                  </h3>
                  <div className="mt-[10px]">
                    <div className="flex items-center justify-between">
                      <p className="text-[18px] font-bold text-[#00a650]">
                        {p.price}
                      </p>
                      <span className="bg-[#e53935] text-white text-[12px] font-bold py-[1px] px-2 rounded">
                        {p.discount}
                      </span>
                    </div>
                    <p className="text-[13px] text-gray-700 mt-[2px]">
                      ou 10x sem juros
                    </p>
                  </div>
                </div>

                {/* ➕ Botão adicionar */}
                <div className="border-t border-gray-100 mt-2 p-3">
                  <button
                    onClick={() => handleAddToCart(p)}
                    disabled={adding === p.slug}
                    className={`flex items-center justify-center gap-2 ${
                      adding === p.slug
                        ? 'bg-[#2fa53f]'
                        : 'bg-[#39b54a] hover:bg-[#2fa53f]'
                    } text-white font-semibold px-5 py-[7px] rounded-md text-[14px] transition shadow-sm w-full`}
                  >
                    {adding === p.slug ? (
                      <>
                        <svg
                          className="w-4 h-4 animate-spin"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4l3.5-3.5L12 1v4a8 8 0 11-8 8z"
                          ></path>
                        </svg>
                        <span>Adicionando...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                          className="w-[17px] h-[17px]"
                        >
                          <path
                            d="M7 18c-1.1 0-1.99.9-1.99 
                            2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 
                            0c-1.1 0-1.99.9-1.99 
                            2S15.9 22 17 22s2-.9 2-2-.9-2-2-2zM7.16 
                            14l.84-2h8.6c.75 0 1.41-.41 
                            1.75-1.03l3.58-6.49A.996.996 0 
                            0019.07 3H5.21l-.94-2H1v2h2l3.6 
                            7.59-1.35 2.44C4.52 
                            13.37 5.48 15 7 15h12v-2H7.42c-.14 
                            0-.25-.11-.26-.24z"
                          />
                        </svg>
                        <span>Adicionar</span>
                      </>
                    )}
                  </button>

                  <p className="text-[12.5px] text-[#3a3a3a] mt-3 text-center">
                    Vendido e entregue por{' '}
                    <span className="font-semibold">RiHappy</span>
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
