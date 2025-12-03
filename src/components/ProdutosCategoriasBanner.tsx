'use client'

import { useState } from 'react'

export default function ProdutosCategoriasBanner() {
  const categorias = ['lego', 'aventura', 'bonecas', 'hora do jogo', 'blind box']
  const [ativa, setAtiva] = useState('lego')

  const produtosPorCategoria: Record<
    string,
    { img: string; title: string; price: string; discount: string }[]
  > = {
    lego: [
      { img: 'https://rihappynovo.vtexassets.com/arquivos/ids/8372777-175-175?v=638856937050430000', title: 'LEGO - City Police - Perseguição Com Motocicleta', price: 'R$ 69,90', discount: '-80%' },
      { img: 'https://rihappynovo.vtexassets.com/arquivos/ids/8372757-175-175?v=638856936644270000', title: 'LEGO - Speed Champions - Porsche 911 GT3 RS', price: 'R$ 70,90', discount: '-80%' },
      { img: 'https://rihappynovo.vtexassets.com/arquivos/ids/8372806-175-175?v=638856937612270000', title: 'LEGO - Hipercarro Esportivo Bugatti', price: 'R$ 34,90', discount: '-80%' },
      { img: 'https://rihappynovo.vtexassets.com/arquivos/ids/8372761-175-175?v=638856936833600000', title: 'LEGO - Ninjago - Duelo de Carros Rogue vs. Drix', price: 'R$ 29,90', discount: '-80%' },
    ],
    aventura: [
      { img: 'https://rihappynovo.vtexassets.com/arquivos/ids/9002734-175-175?v=638937138056530000', title: 'Bicicleta Barbie Aro 14 - Bandeirante', price: 'R$ 130,90', discount: '-37%' },
      { img: 'https://rihappynovo.vtexassets.com/arquivos/ids/9002740-175-175?v=638937139014430000', title: 'Bicicleta Hulk Aro 14 - Bandeirante', price: 'R$ 155,90', discount: '-37%' },
      { img: 'https://rihappynovo.vtexassets.com/arquivos/ids/9002743-175-175?v=638937140121730000', title: 'Bicicleta Hot Wheels Aro 14 - Bandeirante', price: 'R$ 139,90', discount: '-37%' },
      { img: 'https://rihappynovo.vtexassets.com/arquivos/ids/9002749-175-175?v=638937140728500000', title: 'Bicicleta Princesas Ariel Aro 14 - Bandeirante', price: 'R$ 140,90', discount: '-37%' },
    ],
    bonecas: [
      { img: 'https://rihappynovo.vtexassets.com/arquivos/ids/8361488-175-175?v=638852683355030000', title: 'Boneca Barbie Ursinhos Carinhosos - Mattel', price: 'R$ 39,90', discount: '-80%' },
      { img: 'https://rihappynovo.vtexassets.com/arquivos/ids/7816183-175-175?v=638773014097500000', title: 'Boneca Barbie Fadas Mágicas - Sortido', price: 'R$ 24,90', discount: '-80%' },
      { img: 'https://rihappynovo.vtexassets.com/arquivos/ids/9051959-175-175?v=638941622679700000', title: 'Boneca Articulada Emilly Vick Rosa - Novabrink', price: 'R$ 19,90', discount: '-80%' },
      { img: 'https://rihappynovo.vtexassets.com/arquivos/ids/8359547-175-175?v=638931059001670000', title: 'Boneca Baby Alive Bebe Cresce Lala - Hasbro', price: 'R$ 69,90', discount: '-80%' },
    ],
    'hora do jogo': [
      { img: 'https://rihappynovo.vtexassets.com/arquivos/ids/8469482-175-175?v=638875060271000000', title: 'Jogo Taco Gato Cabra Queijo Pizza - Edição 8', price: 'R$ 49,90', discount: '-80%' },
      { img: 'https://rihappynovo.vtexassets.com/arquivos/ids/8831379-175-175?v=638919995318200000', title: 'Jogo Brick Like This - Galápagos', price: 'R$ 29,90', discount: '-80%' },
      { img: 'https://rihappynovo.vtexassets.com/arquivos/ids/9056915-175-175?v=638942363663470000', title: 'Jogo Ludo Patrulha Canina - Grow', price: 'R$ 19,90', discount: '-80%' },
      { img: 'https://rihappynovo.vtexassets.com/arquivos/ids/9119375-175-175?v=638948549846230000', title: 'Jogo Tira Varetas Rosa - Elka', price: 'R$ 34,90', discount: '-80%' },
    ],
    'blind box': [
      { img: 'https://rihappynovo.vtexassets.com/arquivos/ids/8142416-175-175?v=638797372148870000', title: 'Boneca Katlen Roxo - Novabrink', price: 'R$ 29,90', discount: '-80%' },
      { img: 'https://rihappynovo.vtexassets.com/arquivos/ids/8283853-175-175?v=638835361957100000', title: 'Playset Barbie Barbieland Miniatura', price: 'R$ 69,90', discount: '-80%' },
      { img: 'https://rihappynovo.vtexassets.com/arquivos/ids/8136450-175-175?v=638796449494430000', title: 'Maleta de Maquiagem Barbie Glam Rosa', price: 'R$ 49,90', discount: '-80%' },
      { img: 'https://rihappynovo.vtexassets.com/arquivos/ids/7433478-175-175?v=638750509692300000', title: 'Boneca Disney Princesas Vestido de Festa', price: 'R$ 25,90', discount: '-80%' },
    ],
  }

  const produtos = produtosPorCategoria[ativa]

  const parsePreco = (preco: string) =>
    parseFloat(preco.replace('R$', '').replace(',', '.').trim())

  // 🛒 Função para enviar produto e quantidade ao checkout
  const enviarParaCheckout = (produto: any, quantidade: number) => {
    const produtoParam = encodeURIComponent(JSON.stringify(produto))
    window.location.href = `/checkout/cart?produto=${produtoParam}&quantidade=${quantidade}`
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-end pb-10 z-[5] pointer-events-auto">
      {/* Botões de categoria */}
      <div className="flex justify-center mt-6 mb-8 z-[10]">
        <div className="flex flex-wrap justify-center gap-5 w-full max-w-[1400px]">
          {categorias.map((cat) => (
            <button
              key={cat}
              onClick={() => setAtiva(cat)}
              className={`${
                ativa === cat
                  ? 'bg-[#6a5acd] text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } 
              px-12 py-[9px] rounded-full text-[15px] font-semibold 
              flex-1 min-w-[250px] transition-all duration-200 shadow-sm capitalize cursor-pointer`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Produtos */}
      <div className="max-w-[1300px] mx-auto px-6 z-[10]">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {produtos.map((p, i) => {
            const preco = parsePreco(p.price)
            const pagueLeve = preco > 35

            return (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition relative flex flex-col overflow-hidden cursor-default"
              >
                {/* ❤️ Ícone favorito */}
                <button className="absolute right-3 top-3 bg-white w-7 h-7 rounded-full shadow-sm border border-gray-200 flex items-center justify-center hover:bg-gray-100 z-[3]">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.6" stroke="#555" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.239-4.5-5-4.5-1.74 0-3.31.906-4 2.292A4.48 4.48 0 008 3.75c-2.761 0-5 2.015-5 4.5 0 7.25 9 12 9 12s9-4.75 9-12z"/>
                  </svg>
                </button>

                {/* 🏷️ Tag “Pague 1 Leve 2” */}
                {pagueLeve && (
                  <div className="absolute left-0 top-3 bg-[#ff007a] text-white text-[12px] font-bold py-[2px] px-3 rounded-r-md shadow-sm z-[2]">
                    🎁 Pague 1 Leve 2
                  </div>
                )}

                {/* 🧸 Imagem */}
                <div className="flex justify-center items-center h-[200px] mt-6 relative z-[1]">
                  <img src={p.img} alt={p.title} className="w-[160px] h-[160px] object-contain" />
                </div>

                {/* ⭐ Avaliação */}
                <div className="flex items-center px-4 mt-2 mb-1">
                  {Array(5).fill(0).map((_, i) => (
                    <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FFD700" className="w-4 h-4">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 
                      9.24l-7.19-.61L12 2 9.19 
                      8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>

                {/* 🏷️ Nome e preço */}
                <div className="px-4 flex flex-col justify-between flex-grow">
                  <h3 className="text-[14.5px] font-semibold text-[#1a1a1a] leading-snug mt-1">{p.title}</h3>
                  <div className="mt-[10px] flex items-center justify-between">
                    <p className="text-[18px] font-bold text-[#00a650]">{p.price}</p>
                    <span className="bg-[#e53935] text-white text-[12px] font-bold py-[1px] px-2 rounded">{p.discount}</span>
                  </div>
                  <p className="text-[13px] text-gray-700 mt-[2px]">ou 10x sem juros</p>
                </div>

                {/* ➕ Botão adicionar */}
                <div className="border-t border-gray-100 mt-2 p-3">
                  <button
                    onClick={() => enviarParaCheckout(p, 1)}
                    className="flex items-center justify-center gap-2 bg-[#39b54a] hover:bg-[#2fa53f] text-white font-semibold px-5 py-[7px] rounded-md text-[14px] transition shadow-sm w-full"
                  >
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
                  </button>

                  <p className="text-[12.5px] text-[#3a3a3a] mt-3 text-center">
                    Vendido e entregue por <span className="font-semibold text-[#3a3a3a]">RiHappy</span>
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
