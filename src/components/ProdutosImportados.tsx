'use client'

import { useCart } from '@/context/CartContext'
import Link from 'next/link'
import { produtos } from '@/data/produtos'

interface Produto {
  slug: string
  title: string
  img: string
  price: string
  discount: string
}

export default function ProdutosImportados() {
  const { addToCart } = useCart()

  return (
    <section className="w-full bg-[#f7f7f7] py-16">
      <div className="max-w-[1300px] mx-auto px-6">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {produtos.map((p, i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition flex flex-col overflow-hidden"
            >
              <Link href={`/produto/${p.slug}`} className="block">
                <div className="flex justify-center items-center h-[200px] mt-6">
                  <img src={p.img} alt={p.title} className="w-[160px] h-[160px] object-contain" />
                </div>

                <div className="px-4 flex flex-col justify-between flex-grow">
                  <h3 className="text-[14.5px] font-semibold text-[#1a1a1a] leading-snug mt-1">
                    {p.title}
                  </h3>
                  <div className="mt-[10px]">
                    <div className="flex items-center justify-between">
                      <p className="text-[18px] font-bold text-[#00a650]">{p.price}</p>
                      <span className="bg-[#e53935] text-white text-[12px] font-bold py-[1px] px-2 rounded">
                        {p.discount}
                      </span>
                    </div>
                    <p className="text-[13px] text-gray-700 mt-[2px]">ou 10x sem juros</p>
                  </div>
                </div>
              </Link>

              <div className="border-t border-gray-100 mt-2 p-3">
                <button
                  onClick={() => addToCart(p)}
                  className="flex items-center justify-center gap-2 bg-[#39b54a] hover:bg-[#2fa53f] text-white font-semibold px-5 py-[7px] rounded-md text-[14px] transition shadow-sm w-full"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-[17px] h-[17px]">
                    <path d="M7 18c-1.1 0-1.99.9-1.99 
                      2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 
                      0c-1.1 0-1.99.9-1.99 
                      2S15.9 22 17 22s2-.9 2-2-.9-2-2-2zM7.16 
                      14l.84-2h8.6c.75 0 1.41-.41 
                      1.75-1.03l3.58-6.49A.996.996 0 
                      0019.07 3H5.21l-.94-2H1v2h2l3.6 
                      7.59-1.35 2.44C4.52 
                      13.37 5.48 15 7 15h12v-2H7.42c-.14 
                      0-.25-.11-.26-.24z" />
                  </svg>
                  <span>Adicionar</span>
                </button>

                <p className="text-[12.5px] text-[#3a3a3a] mt-3 text-center">
                  Vendido e entregue por <span className="font-semibold">RiHappy</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
