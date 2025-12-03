'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useIsMobile } from '@/hooks/use-mobile'

interface ContentVoaaProps {
  categoria: string
}

export default function ContentVoaa({ categoria }: ContentVoaaProps) {
  const isMobile = useIsMobile()

  const cards = [
              {
      link: '/vitoria',
      img: '//img.tribunahoje.com/nCdjoKvkMXTBH48ZKcGYJ5XvXRk=/840x520/smart/s3.tribunahoje.com/uploads/imagens/cancer-infantil-01.jpg',
      titulo:
        'Ajude a Vitória a Vencer a Batalha Contra o Câncer',
      tag: 'SAÚDE',
      dias: 20,
      progresso: 3,
      arrecadado: '3.231,23',
      meta: '120.000,00',
    },
    {
      img: 'https://d3lujmlpk1c85b.cloudfront.net/f8c6b057-cde2-4241-9b51-99f565e77732/1512ff55-5d0f-4d91-adc9-a29aee3c1080.jpeg?format=auto&height=200',
      titulo:
        'Sem comida e sem casa, pai dá água aos filhos para enganar a fome e tentarem dormir',
      tag: 'MORADIA',
      dias: 20,
      progresso: 3,
      arrecadado: '3.584,66',
      meta: '120.000,00',
      link: '/seuluis', // ✅ rota interna
    },
    {
      img: 'https://d3lujmlpk1c85b.cloudfront.net/0d171f70-ec58-498c-82a6-eff26ed5446f/4c90f56a-2eeb-486d-ba86-3137e41ae158.jpeg?format=auto&height=200',
      titulo:
        'Vaquinha para bebê que ficou cego e com paralisia cerebral por conta de erros médicos, segundo a mãe',
      tag: 'SAÚDE',
      dias: 20,
      progresso: 3,
      arrecadado: '1.877,88',
      meta: '60.000,00',
      link: '/pedro',
    },
    {
      img: 'https://d3lujmlpk1c85b.cloudfront.net/03060064-d1b9-4bf2-9b49-0a30cd3283c4/e14af6fb-d22c-422f-afbc-433b4c826492.jpeg?format=auto&height=200',
      titulo:
        'Sem banheiro há anos, mãe com câncer sonha com um chuveiro para tomar banho quentinho',
      tag: 'MORADIA',
      dias: 20,
      progresso: 3,
      arrecadado: '1.859,78',
      meta: '70.000,00',
      link: '/gehyza',
    },

    {
      img: 'https://d3lujmlpk1c85b.cloudfront.net/01b521f9-29db-4064-b768-02dd35bf4ece/630322cb-6c62-4bc5-baa2-c120be81dc81.jpeg?format=auto&height=200',
      titulo:
        '“Se minha mãe estivesse viva, eu não estaria sujo”: criança de 7 anos precisa de ajuda depois de ter sua mãe assassinada pelo pai no Maranhão',
      tag: 'EMERGENCIAIS',
      dias: 17,
      progresso: 235,
      arrecadado: '199.796,34',
      meta: '85.000,00',
      link: '/luisfernando',
    },
    {
      img: 'https://d3lujmlpk1c85b.cloudfront.net/19e7ee4b-0f4a-4981-bf88-86bc45823ee8/8a43c853-f16c-4eac-bc95-21907d89915b.jpeg?format=auto&height=200',
      titulo:
        'Por causa da epilepsia grave e da fotossensibilidade, Brunno convulsiona com a luz do sol, e o irmão também enfrenta crises constantes.',
      tag: 'SAÚDE',
      dias: 17,
      progresso: 43,
      arrecadado: '32.470,39',
      meta: '75.000,00',
      link: '/brunnoebenicio',
    },
  ]

  const cardsFiltrados =
    categoria === 'Todos'
      ? cards
      : cards.filter((c) =>
          c.tag.toLowerCase().includes(categoria.toLowerCase())
        )

  return (
    <section
      className={`max-w-[1200px] mx-auto ${
        isMobile ? 'px-3 my-6' : 'px-6 my-12'
      }`}
    >
      {/* 🔹 Grid de Cards */}
      <div
        className={`grid ${
          isMobile
            ? 'grid-cols-2 gap-3'
            : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6'
        }`}
      >
        {cardsFiltrados.map((c, i) => (
          <Link
            key={i}
            href={c.link}
            className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-200 block"
          >
            {/* 🖼️ Imagem */}
            <div
              className={`relative ${
                isMobile ? 'h-[130px]' : 'aspect-[16/9]'
              } bg-gray-100`}
            >
              <Image
                src={c.img}
                alt={c.titulo}
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
            </div>

            {/* 📋 Conteúdo */}
            <div className={`p-3 ${isMobile ? 'pb-2' : 'pb-4'}`}>
              <span
                className={`text-[#d2336e] uppercase font-semibold ${
                  isMobile ? 'text-[10px]' : 'text-xs'
                }`}
              >
                {c.tag}
              </span>

              <h3
                className={`font-semibold mt-1 leading-snug line-clamp-2 ${
                  isMobile ? 'text-[12.5px]' : 'text-[15px]'
                }`}
              >
                {c.titulo}
              </h3>

              {/* 🔸 Progresso */}
              <div className={`mt-3 ${isMobile ? 'mt-2' : ''}`}>
                <div
                  className={`flex justify-between text-gray-500 mb-1 ${
                    isMobile ? 'text-[10px]' : 'text-[12px]'
                  }`}
                >
                  <span>{c.dias} dias restantes</span>
                  <span>{c.progresso}%</span>
                </div>

                <div className="w-full h-[6px] bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#d2336e] rounded-full transition-all duration-700"
                    style={{ width: `${c.progresso}%` }}
                  ></div>
                </div>

                <div className={`mt-3 ${isMobile ? 'mt-2' : ''}`}>
                  <p
                    className={`text-[#d2336e] font-bold ${
                      isMobile ? 'text-[13px]' : 'text-[17px]'
                    }`}
                  >
                    R$ {c.arrecadado}
                  </p>
                  <p
                    className={`text-gray-500 font-medium ${
                      isMobile ? 'text-[11px]' : 'text-[13px]'
                    }`}
                  >
                    Meta de R$ {c.meta}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* 🪶 Caso não haja resultados */}
      {cardsFiltrados.length === 0 && (
        <p
          className={`text-center text-gray-500 ${
            isMobile ? 'mt-4 text-sm' : 'mt-10'
          }`}
        >
          Nenhuma vaquinha nessa categoria.
        </p>
      )}
    </section>
  )
}
