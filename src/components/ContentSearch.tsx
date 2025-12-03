'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useIsMobile } from '@/hooks/use-mobile'

interface ContentSearchProps {
  busca: string
  categoria: string
}

export default function ContentSearch({ busca, categoria }: ContentSearchProps) {
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
      link: '/seuluis',
      img: 'https://d3lujmlpk1c85b.cloudfront.net/f8c6b057-cde2-4241-9b51-99f565e77732/1512ff55-5d0f-4d91-adc9-a29aee3c1080.jpeg?format=auto&height=200',
      titulo:
        'Sem comida e sem casa, pai dá água aos filhos para enganar a fome e tentarem dormir',
      tag: 'MORADIA',
      dias: 20,
      progresso: 3,
      arrecadado: '3.584,66',
      meta: '120.000,00',
    },
    {
      link: '/pedro',
      img: 'https://d3lujmlpk1c85b.cloudfront.net/0d171f70-ec58-498c-82a6-eff26ed5446f/4c90f56a-2eeb-486d-ba86-3137e41ae158.jpeg?format=auto&height=200',
      titulo:
        'Vaquinha para bebê que ficou cego e com paralisia cerebral por conta de  erros médicos, segundo a mãe',
      tag: 'SAÚDE',
      dias: 20,
      progresso: 3,
      arrecadado: '1.877,88',
      meta: '60.000,00',
    },
    {
      link: '/gehyza',
      img: 'https://d3lujmlpk1c85b.cloudfront.net/03060064-d1b9-4bf2-9b49-0a30cd3283c4/e14af6fb-d22c-422f-afbc-433b4c826492.jpeg?format=auto&height=200',
      titulo:
        'Sem banheiro há anos, mãe com câncer sonha com um chuveiro para tomar banho quentinho',
      tag: 'MORADIA',
      dias: 20,
      progresso: 3,
      arrecadado: '1.859,78',
      meta: '70.000,00',
    },
  {
    link: '/luisfernando',
    img: 'https://d3lujmlpk1c85b.cloudfront.net/01b521f9-29db-4064-b768-02dd35bf4ece/630322cb-6c62-4bc5-baa2-c120be81dc81.jpeg?format=auto&height=200',
    titulo:
      '“Se minha mãe estivesse viva, eu não estaria sujo”: criança de 7 anos precisa de ajuda depois de ter sua mãe assassinada pelo pai no Maranhão',
    tag: 'EMERGENCIAIS',
    dias: 17,
    progresso: 235,
    arrecadado: '199.796,34',
    meta: '85.000,00',
  },
  {
    link: '/alanearthur',
    img: 'https://d3lujmlpk1c85b.cloudfront.net/2c1896c5-651f-4af2-b820-1e4a1cea091f/be9afe9e-3777-405a-931c-fe69f053cec6.jpeg?format=auto&height=200',
    titulo:
      'Gêmeos com doença rara, acamados e sem visão, precisam de fisioterapia diária para não atrofiarem.',
    tag: 'SAÚDE',
    dias: 17,
    progresso: 29,
    arrecadado: '17.597,42',
    meta: '60.000,00',
  },
  {
    link: '/brunnoebenicio',
    img: 'https://d3lujmlpk1c85b.cloudfront.net/19e7ee4b-0f4a-4981-bf88-86bc45823ee8/8a43c853-f16c-4eac-bc95-21907d89915b.jpeg?format=auto&height=200',
    titulo:
      'Por causa da epilepsia grave e da fotossensibilidade, Brunno convulsiona com a luz do sol, e o irmão também enfrenta crises constantes.',
    tag: 'SAÚDE',
    dias: 17,
    progresso: 43,
    arrecadado: '32.470,39',
    meta: '75.000,00',
  },
    {
    link: '/leticia',
    img: 'https://d3lujmlpk1c85b.cloudfront.net/e33d0c7a-3160-4144-8c05-524d389cf038/4b904b29-351e-4981-818c-c5fa5f3e3364.jpeg?format=auto&height=200',
    titulo:
      'Menina de 6 anos, com síndrome de down e leucemia,  sobrevive a duas paradas cardíacas e precisa de ajuda para se recuperar',
    tag: 'EMERGENCIAIS',
    dias: 17,
    progresso: 43,
    arrecadado: '21.265,89',
    meta: '50.000,00',
  },
  {
    link: '/frank',
    img: 'https://d3lujmlpk1c85b.cloudfront.net/fdae1ac7-3f2a-4923-86b6-47baf39dd02d/8ba0697e-a6ea-4f67-859f-1aa0de6aee97.jpeg?format=auto&height=200',
    titulo:
      'Com 214 kg e problemas de saúde graves, homem vive isolado e sem apoio da família',
    tag: 'SAÚDE',
    dias: 17,
    progresso: 7,
    arrecadado: '3.380,03',
    meta: '45.000,00',
  },
  {
    link: '/arthur',
    img: 'https://d3lujmlpk1c85b.cloudfront.net/0166306f-cb15-42fe-8f93-6e55439ae5b5/2a7682fa-aed5-4623-b615-840e4054b73a.jpeg?format=auto&height=200',
    titulo:
      'Criança com má formação na mandíbula não consegue nem abrir a boca e sonha em comer churrasco',
    tag: 'SAÚDE',
    dias: 17,
    progresso: 46,
    arrecadado: '31.855,41',
    meta: '70.000,00',
  },
  {
    link: '/jukinha',
    img: 'https://d3lujmlpk1c85b.cloudfront.net/b1ac9941-2ae9-4ce0-bb4c-5b1b65660338/30a0df5b-6fee-4576-8938-e54fee4c724d.jpeg?format=auto&height=200',
    titulo:
      '“Tenho medo de dormir e ele partir”, diz mãe de menino de 12 anos em cuidados paliativos que precisa de ajuda para sustento.',
    tag: 'EMERGENCIAIS',
    dias: 10,
    progresso: 98,
    arrecadado: '83.069,96',
    meta: '85.000,00',
  },
  {
    link: '/thamires',
    img: 'https://d3lujmlpk1c85b.cloudfront.net/22cb51ae-4f7a-4ab2-a8c9-7af635036bfc/4a27fa3d-6fb5-4cb3-91b9-353f90f5323e.jpeg?format=auto&height=200',
    titulo: 'Filha doente cuida sozinha da mãe com câncer e do filho autista',
    tag: 'SAÚDE',
    dias: 10,
    progresso: 59,
    arrecadado: '40.980,58',
    meta: '37.500,00',
  },
  {
    link: '/ruth',
    img: 'https://d3lujmlpk1c85b.cloudfront.net/1c96cba4-e642-48e1-b320-dddca6c4b3a6/22912ff3-8223-4119-aebf-0a8d06aca61e.jpeg?format=auto&height=200',
    titulo:
      'Tetraplégica após acidente, Ruth luta para criar os quatro filhos e manter o tratamento',
    tag: 'EMERGENCIAIS',
    dias: 10,
    progresso: 14,
    arrecadado: '7.737,73',
    meta: '55.000,00',
  },
  {
    link: '/kauatratamento',
    img: 'https://d3lujmlpk1c85b.cloudfront.net/47e09d08-0a2a-44f1-af2b-395f2d353f3d/71a6dd9e-2728-4be0-920a-cd91ee61b300.jpeg?format=auto&height=200',
    titulo:
      'Família luta para que jovem de 19 anos volte a andar depois de dez anos acamado',
    tag: 'EMERGENCIAIS',
    dias: 10,
    progresso: 11,
    arrecadado: '7.119,45',
    meta: '65.000,00',
  },
  {
    link: '/nico',
    img: 'https://d3lujmlpk1c85b.cloudfront.net/85e7745f-cbc2-4d8c-a2d6-2e1ca4976505/e7e5e5d0-6561-46ae-a8cf-6352cd3c2f71.jpeg?format=auto&height=200',
    titulo:
      'Nico luta contra câncer raro e várias metástases, além disso, ainda corre risco de ser despejado da casa onde mora com a mãe',
    tag: 'SAÚDE',
    dias: 10,
    progresso: 60,
    arrecadado: '33.087,01',
    meta: '55.000,00',
  },
  {
    link: '/matteo',
    img: 'https://d3lujmlpk1c85b.cloudfront.net/f3763268-3b4e-44e0-a362-25b880ac7b9f/03286fd5-c911-4db4-9d38-0ebe49a74673.jpeg?format=auto&height=200',
    titulo:
      'Matteo é apenas um bebê e precisa de ajuda para continuar lutando contra leucemia mieloide aguda',
    tag: 'SAÚDE',
    dias: 10,
    progresso: 51,
    arrecadado: '25.277,06',
    meta: '50.000,00',
  },
  {
    link: '/donajussara',
    img: 'https://d3lujmlpk1c85b.cloudfront.net/924ee749-cbf5-4338-904f-4cfd51b56102/152fc24b-b667-44f9-b3a2-f39d55b6a4f4.jpeg?format=auto&height=200',
    titulo:
      'Avó de 64 anos que perdeu neto e cria um outro com depressão pede ajuda para sair do morro',
    tag: 'SAÚDE',
    dias: 10,
    progresso: 16,
    arrecadado: '12.591,38',
    meta: '80.000,00',
  },
  {
    link: '/ajudeasandra',
    img: 'https://d3lujmlpk1c85b.cloudfront.net/6c8c8a22-957b-45fe-835f-0abea9cc0081/b8bc138f-4a00-47b8-a5ec-224f9dde2368.jpeg?format=auto&height=200',
    titulo:
      'Após amputar as pernas por causa de um câncer agressivo, Dona Sandra sonha em deixar a casa que está condenada',
    tag: 'SAÚDE',
    dias: 10,
    progresso: 24,
    arrecadado: '16.668,83',
    meta: '70.000,00',
  },
  {
    link: '/leandroportella',
    img: 'https://d3lujmlpk1c85b.cloudfront.net/9678e064-6de2-41f5-93b9-512b25b59c10/178ae6db-d8a6-41d8-bc23-25d9a7f261b3.jpeg?format=auto&height=200',
    titulo:
      'Tetraplégico, Leandro Portella transformou a vida em arte pintando com a boca. Agora precisa de um guincho para ser transportado com segurança',
    tag: 'EMERGENCIAIS',
    dias: 10,
    progresso: 16,
    arrecadado: '8.131,12',
    meta: '50.000,00',
  },
  {
    link: '/martinhabrito',
    img: 'https://d3lujmlpk1c85b.cloudfront.net/220bd463-5a8d-4eed-97fb-814507b7d10b/ec262398-6f8c-4ce9-8cf3-6643eb92c766.jpeg?format=auto&height=200',
    titulo:
      'Martinha vive numa prisão de ossos e luta para manter cuidadora e alimentação especial',
    tag: 'SAÚDE',
    dias: 10,
    progresso: 23,
    arrecadado: '9.277,74',
    meta: '40.000,00',
  },
  {
    link: '/luisero',
    img: 'https://d3lujmlpk1c85b.cloudfront.net/7e61350d-b761-4267-911a-4c91a8ccdce0/b2c6bf6f-90e1-44fe-92a2-be3faa716f09.jpeg?format=auto&height=200',
    titulo: 'Marido abandonou tudo para cuidar dia e noite do amor de sua vida',
    tag: 'SAÚDE',
    dias: 10,
    progresso: 29,
    arrecadado: '12.902,96',
    meta: '45.000,00',
  },
  {
    link: '/estevao2fase',
    img: 'https://d3lujmlpk1c85b.cloudfront.net/17888a3d-342a-48f2-a018-acd19b533666/26440a91-a1b2-49ef-b1fb-441bd85f152f.jpeg?format=auto&height=200',
    titulo:
      'Urgente: Estevão, bebê de 7 meses, agora precisa de cirurgia para separar os dedinhos',
    tag: 'EMERGENCIAIS',
    dias: 3,
    progresso: 51,
    arrecadado: '92.585,89',
    meta: '180.000,00',
  },
  {
    link: '/karine2fase',
    img: 'https://d3lujmlpk1c85b.cloudfront.net/60dc39c0-cc2a-49dd-981b-2b94746eb371/d99800ef-9974-4e4d-bbe7-09ab9dcf0597.jpeg?format=auto&height=200',
    titulo:
      'Continuação do tratamento para a Karine, que tem doença rara e pode vir a perder o rosto',
    tag: 'SAÚDE',
    dias: 3,
    progresso: 11,
    arrecadado: '52.348,16',
    meta: '480.000,00',
  },
    {
      link: '/samela',
    img: 'https://d3lujmlpk1c85b.cloudfront.net/1b4d3885-8c8f-47c6-9c63-3bf5ac25b077/4e978ddd-8843-4806-a254-ce8f1a6f032c.jpeg?format=auto&height=200',
    titulo:
      'Vaquinha para menina de 13 anos que saiu da escola por sofrer bullying poder comprar uma cadeira motorizada',
    tag: 'SAÚDE',
    dias: 3,
    progresso: 78,
    arrecadado: '62.595,41',
    meta: '80.000,00',
  },
  {
    link: '/davi',
    img: 'https://d3lujmlpk1c85b.cloudfront.net/d6fcca32-d45b-4352-9e85-1fef4627013f/22ca4449-5ae8-4bff-88f5-c7922e42a21b.jpeg?format=auto&height=200',
    titulo:
      'Urgente: Davi teve uma piora grave e está sedado por causa de crises convulsivas. Ele precisa de ajuda para sobreviver!',
    tag: 'EMERGENCIAIS',
    dias: 17,
    progresso: 83,
    arrecadado: '748.026,33',
    meta: '900.00.00',
  },
]

  // 🔍 filtro por busca e categoria
  const filtrados = cards.filter((c) => {
    const textoMatch = c.titulo.toLowerCase().includes(busca.toLowerCase())
    const categoriaMatch =
      categoria === 'Todos' || c.tag.toLowerCase().includes(categoria.toLowerCase())
    return textoMatch && categoriaMatch
  })

  return (
    <section
      className={`max-w-[1200px] mx-auto ${isMobile ? 'px-3 my-6' : 'px-6 my-12'}`}
    >
      <div
        className={`grid ${
          isMobile
            ? 'grid-cols-2 gap-3'
            : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6'
        }`}
      >
        {filtrados.map((c, i) => (
          <Link
            key={i}
            href={c.link}
            className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-all duration-200"
          >
            <div
              className={`relative ${isMobile ? 'h-[130px]' : 'aspect-[16/9]'} bg-gray-100`}
            >
              <Image
                src={c.img}
                alt={c.titulo}
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
            </div>

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

        {filtrados.length === 0 && (
          <p
            className={`text-center text-gray-500 ${
              isMobile ? 'mt-4 text-sm' : 'mt-10'
            }`}
          >
            Nenhuma vaquinha encontrada.
          </p>
        )}
      </div>
    </section>
  )
}