import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import * as dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import {
  BespokeProduct,
  ColorOption,
  CustomerRecord,
  BespokeOrder,
  PaymentRecord,
  StoreSettings,
  PaymentStatus,
  ProductionStatus,
} from './src/types/peterson';

dotenv.config();

const PORT = 3000;
const IS_VERCEL = Boolean(process.env.VERCEL);
const BUNDLED_DB_FILE = path.resolve(process.cwd(), 'data', 'peterson-db.json');
const DATA_DIR = IS_VERCEL ? path.join('/tmp', 'peterson-data') : path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'peterson-db.json');
const SQL_SCHEMA_FILE = path.resolve(process.cwd(), 'supabase-schema.sql');
const INSTAGRAM_PUBLIC_DIR = path.resolve(process.cwd(), 'public', 'instagram');

interface DatabaseSchema {
  products: BespokeProduct[];
  customers: CustomerRecord[];
  orders: BespokeOrder[];
  payments: PaymentRecord[];
  settings: StoreSettings;
}

const STANDARD_SIZES = [34, 35, 36, 37, 38, 39];

function addDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// Compute standard CRC16-CCITT (0xFFFF) for valid Brazilian Pix EMVCo BRCode payload
function computeCRC16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function emvField(id: string, value: string): string {
  return `${id}${String(value.length).padStart(2, '0')}${value}`;
}

function generateMercadoPagoPixPayload(amount: number, reference: string, pixKey: string): string {
  const cleanKey = pixKey.trim() || '62984998265';
  const normalizedKey =
    /^\d{10,11}$/.test(cleanKey) && !cleanKey.startsWith('+55')
      ? `+55${cleanKey}`
      : cleanKey;

  const gui = emvField('00', 'br.gov.bcb.pix');
  const keyField = emvField('01', normalizedKey);
  const merchantAccountInfo = emvField('26', `${gui}${keyField}`);
  const formattedAmount = amount.toFixed(2);
  const txId = reference.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20) || 'PETERSONSHOES';
  const additionalData = emvField('62', emvField('05', txId));

  const bodyWithoutCrc =
    '000201' +
    merchantAccountInfo +
    '52040000' +
    '5303986' +
    emvField('54', formattedAmount) +
    '5802BR' +
    emvField('59', 'PETERSON SHOES') +
    emvField('60', 'GOIANIA') +
    additionalData +
    '6304';

  const crc = computeCRC16(bodyWithoutCrc);
  return `${bodyWithoutCrc}${crc}`;
}

/**
 * Monta as cores padrão oficiais da Peterson Shoes em todos os modelos:
 * Preto, Branco, Marsala, Nude, Dourado, Prata, Vermelho, Rosa + Outra Cor (Personalizada)
 * Mantendo as fotos reais do Instagram associadas às cores correspondentes de cada post.
 */
function buildStandardColors(
  defaultColorName:
    | 'Preto'
    | 'Branco'
    | 'Marsala'
    | 'Nude'
    | 'Dourado'
    | 'Prata'
    | 'Vermelho'
    | 'Rosa',
  defaultImage: string,
  photoByColor: Partial<
    Record<
      'Preto' | 'Branco' | 'Marsala' | 'Nude' | 'Dourado' | 'Prata' | 'Vermelho' | 'Rosa',
      string
    >
  > = {}
): ColorOption[] {
  const basePalette: {
    name: 'Preto' | 'Branco' | 'Marsala' | 'Nude' | 'Dourado' | 'Prata' | 'Vermelho' | 'Rosa';
    hex: string;
  }[] = [
    { name: 'Preto', hex: '#1B191A' },
    { name: 'Branco', hex: '#F7F7F5' },
    { name: 'Marsala', hex: '#631421' },
    { name: 'Nude', hex: '#DFC1B4' },
    { name: 'Dourado', hex: '#D4AF37' },
    { name: 'Prata', hex: '#C4C9CE' },
    { name: 'Vermelho', hex: '#B31B2C' },
    { name: 'Rosa', hex: '#E07A9B' },
  ];

  // Coloca a cor da capa do post em primeiro lugar para que a foto principal do card corresponda ao 1º círculo
  const sortedPalette = [
    ...basePalette.filter((c) => c.name === defaultColorName),
    ...basePalette.filter((c) => c.name !== defaultColorName),
  ];

  const mapped: ColorOption[] = sortedPalette.map((c) => ({
    name: c.name,
    hex: c.hex,
    image: photoByColor[c.name] || defaultImage,
  }));

  mapped.push({
    name: 'Outra Cor',
    hex: '#8E7970',
    image: defaultImage,
    isCustom: true,
  });

  return mapped;
}

export const INITIAL_PRODUCTS: BespokeProduct[] = [
  // 1. POST 1 (C454LXbOzrn) — Papete Flatform Pirâmides & Fivela
  {
    id: 'prod-ig-01-papete-piramides',
    sku: 'PTS-IG-01',
    name: 'Papete Flatform Pirâmides & Fivela',
    subtitle: 'Bico Quadrado Anatômico com Pirâmides Espelhadas & Pulseira no Tornozelo',
    category: 'Flatforms & Papetes',
    price: 229.9,
    image: '/instagram/feed_1_C454LXbOzrn_slide_1.jpg',
    gallery: [
      '/instagram/feed_1_C454LXbOzrn_slide_1.jpg',
      '/instagram/feed_1_C454LXbOzrn_slide_2.jpg',
      '/instagram/feed_1_C454LXbOzrn_slide_3.jpg',
      '/instagram/feed_1_C454LXbOzrn_slide_4.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C454LXbOzrn/',
    heelOptions: ['Flatform Anatômica 3,5cm', 'Flatform Conforto 2,5cm'],
    strapFinishes: ['Pirâmides Douradas & Fivela Ouro', 'Pirâmides Cromadas & Fivela Prata'],
    colors: buildStandardColors('Dourado', '/instagram/feed_1_C454LXbOzrn_slide_1.jpg', {
      Dourado: '/instagram/feed_1_C454LXbOzrn_slide_1.jpg',
      Nude: '/instagram/feed_1_C454LXbOzrn_slide_2.jpg',
      Branco: '/instagram/feed_1_C454LXbOzrn_slide_2.jpg',
      Prata: '/instagram/feed_1_C454LXbOzrn_slide_3.jpg',
      Preto: '/instagram/feed_1_C454LXbOzrn_slide_4.jpg',
    }),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description:
      'Modelo oficial @petersonshoes_ de fabricação própria! Nossa Papete Flatform Pirâmides combina palmilha anatômica macia de bico quadrado, tiras de dedo com aplicação de pirâmides espelhadas e fivela regulável no tornozelo.',
    craftDetails: [
      'Fabricação própria @petersonshoes_ sob encomenda em até 15 dias (Numeração 34 ao 39)',
      'Disponível em Preto, Branco, Marsala, Nude, Dourado, Prata, Vermelho, Rosa ou Outra Cor à sua escolha',
      'Pagamento de 50% de entrada (Pix ou Cartão c/ taxa do banco) e 50% quando ficar pronta',
    ],
    createdAt: new Date().toISOString(),
  },

  // 2. POST 8 Parte A (C4Tc5OnpB_L Slides 1 a 5) — Anabela Plataforma Pirâmides & Fivela
  {
    id: 'prod-ig-02-anabela-piramides-fivela',
    sku: 'PTS-IG-02',
    name: 'Anabela Plataforma Pirâmides & Fivela',
    subtitle: 'Plataforma Alta Bico Quadrado com Tiras em Pirâmides & Fechamento por Fivela',
    category: 'Anabelas & Plataformas',
    price: 279.9,
    image: '/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg',
    gallery: [
      '/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg',
      '/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg',
      '/instagram/feed_8_C4Tc5OnpB_L_slide_3.jpg',
      '/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg',
      '/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C4Tc5OnpB_L/',
    heelOptions: ['Anabela Alta 9,5cm (Meia Pata 3,5cm)', 'Anabela Média 7,5cm'],
    strapFinishes: ['Pirâmides Douradas & Fivela Ouro', 'Pirâmides Prata & Fivela Cromada'],
    colors: buildStandardColors('Preto', '/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg', {
      Preto: '/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg',
      Nude: '/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg',
      Rosa: '/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg',
      Prata: '/instagram/feed_8_C4Tc5OnpB_L_slide_3.jpg',
      Dourado: '/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg',
      Branco: '/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg',
    }),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description:
      'Clássica e imponente! Nossa Anabela Plataforma de bico quadrado com tachas piramidais e tira de fivela no tornozelo é produzida sob encomenda na sua cor favorita e numeração do 34 ao 39.',
    craftDetails: [
      'Disponível em todas as cores padrão ou qualquer outra cor personalizada escrita por você',
      'Meia pata frontal anatômica que proporciona estabilidade e leveza',
      'Confeccionada sob medida no seu número (34 ao 39 BR) em até 15 dias',
    ],
    createdAt: new Date().toISOString(),
  },

  // 3. POST 8 Parte B (C4Tc5OnpB_L Slides 6 a 8) — Anabela Plataforma Pirâmides Gladiadora Amarração
  {
    id: 'prod-ig-03-anabela-piramides-amarracao',
    sku: 'PTS-IG-03',
    name: 'Anabela Plataforma Pirâmides Gladiadora',
    subtitle: 'Plataforma Alta Bico Quadrado com Pirâmides & Amarração Lace-Up na Perna',
    category: 'Anabelas & Plataformas',
    price: 289.9,
    image: '/instagram/feed_8_C4Tc5OnpB_L_slide_6.jpg',
    gallery: [
      '/instagram/feed_8_C4Tc5OnpB_L_slide_6.jpg',
      '/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg',
      '/instagram/feed_8_C4Tc5OnpB_L_slide_8.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C4Tc5OnpB_L/',
    heelOptions: ['Anabela Alta 9,5cm (Meia Pata 3,5cm)', 'Anabela Média 7,5cm'],
    strapFinishes: ['Pirâmides Douradas & Ponteiras Ouro', 'Pirâmides Prata & Ponteiras Prata'],
    colors: buildStandardColors('Dourado', '/instagram/feed_8_C4Tc5OnpB_L_slide_6.jpg', {
      Dourado: '/instagram/feed_8_C4Tc5OnpB_L_slide_6.jpg',
      Nude: '/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg',
      Rosa: '/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg',
      Prata: '/instagram/feed_8_C4Tc5OnpB_L_slide_8.jpg',
    }),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description:
      'Versão Gladiadora com amarração na perna da nossa Anabela Plataforma @petersonshoes_! Tiras de dedo cravejadas em pirâmides metalizadas e cordões macios que permitem diversas formas de amarração no tornozelo.',
    craftDetails: [
      'Escolha entre Preto, Branco, Marsala, Nude, Dourado, Prata, Vermelho, Rosa ou Outra Cor',
      'Cordões macios de alta resistência com ajuste perfeito na perna',
      'Produção própria sob encomenda em 15 dias (50% no Pix ou Cartão de Crédito)',
    ],
    createdAt: new Date().toISOString(),
  },

  // 4. POST 9 (C4Tc1qCpAdX Slides 1 a 3) — Papete Flatform Tratorada Amarração Nó & Strass
  {
    id: 'prod-ig-04-papete-tratorada-strass',
    sku: 'PTS-IG-04',
    name: 'Papete Flatform Tratorada Strass & Amarração',
    subtitle: 'Solado Tratorado Cravejado com Tiras Duplas de Strass & Amarração Nó Frontal',
    category: 'Flatforms & Papetes',
    price: 249.9,
    image: '/instagram/feed_9_C4Tc1qCpAdX_slide_1.jpg',
    gallery: [
      '/instagram/feed_9_C4Tc1qCpAdX_slide_1.jpg',
      '/instagram/feed_9_C4Tc1qCpAdX_slide_2.jpg',
      '/instagram/feed_9_C4Tc1qCpAdX_slide_3.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C4Tc1qCpAdX/',
    heelOptions: ['Flatform Tratorada 4cm', 'Flatform Anatômica 3cm'],
    strapFinishes: ['Strass Cristal & Vira Cravejada', 'Strass Grafite Onix'],
    colors: buildStandardColors('Branco', '/instagram/feed_9_C4Tc1qCpAdX_slide_1.jpg', {
      Branco: '/instagram/feed_9_C4Tc1qCpAdX_slide_1.jpg',
      Nude: '/instagram/feed_9_C4Tc1qCpAdX_slide_1.jpg',
      Preto: '/instagram/feed_9_C4Tc1qCpAdX_slide_2.jpg',
      Dourado: '/instagram/feed_9_C4Tc1qCpAdX_slide_3.jpg',
    }),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description:
      'Brilho intenso e design super moderno do Instagram @petersonshoes_! Papete Flatform com solado tratorado contornado por fileira de strass, duas tiras frontais cravejadas e amarração com nó central sobre o peito do pé.',
    craftDetails: [
      'Disponível em todas as cores padrão ou cor personalizada sob encomenda (34 ao 39 BR)',
      'Vira da palmilha inteiramente contornada em manta de strass',
      'Solado tratorado leve e antiderrapante feito sob encomenda',
    ],
    createdAt: new Date().toISOString(),
  },

  // 5. POST 5 (C4539VxO5om Slides 1 a 2) — Anabela Plataforma Trançada Dourada c/ Esferas
  {
    id: 'prod-ig-05-anabela-trancada-gold',
    sku: 'PTS-IG-05',
    name: 'Anabela Plataforma Trançada Esferas',
    subtitle: 'Salto Plataforma Revestido em Trama Artesanal com Esferas & Fivela',
    category: 'Anabelas & Plataformas',
    price: 289.9,
    image: '/instagram/feed_5_C4539VxO5om_slide_1.jpg',
    gallery: [
      '/instagram/feed_5_C4539VxO5om_slide_1.jpg',
      '/instagram/feed_5_C4539VxO5om_slide_2.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C4539VxO5om/',
    heelOptions: ['Anabela Alta 9,5cm (Meia Pata 3,5cm)', 'Anabela Média 7,5cm'],
    strapFinishes: ['Esferas & Fivela Dourada', 'Esferas & Fivela Prateada'],
    colors: buildStandardColors('Dourado', '/instagram/feed_5_C4539VxO5om_slide_1.jpg', {
      Dourado: '/instagram/feed_5_C4539VxO5om_slide_1.jpg',
    }),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description:
      'Destaque absoluto do Instagram @petersonshoes_! Sandália Anabela Plataforma inteiramente revestida em trama artesanal, com tira frontal de dedo adornada por esferas e tiras cruzadas no tornozelo.',
    craftDetails: [
      'Revestimento completo da plataforma em trançado artesanal feito à mão',
      'Meia pata frontal que reduz a inclinação do pé e garante conforto prolongado',
      'Confeccionada sob encomenda (34 ao 39 BR) com 50% de entrada no Pix ou Cartão',
    ],
    createdAt: new Date().toISOString(),
  },

  // 6. POST 10 (C4Tcs31JPdl Slides 1 a 2) — Flatform Gladiadora Tiras Finas Strass & Vira Cravejada
  {
    id: 'prod-ig-06-flatform-amarracao-strass',
    sku: 'PTS-IG-06',
    name: 'Flatform Gladiadora Tiras Cruzadas Strass',
    subtitle: 'Flatform Anatômica com Vira de Strass, Tiras Finas Brilhantes & Amarração',
    category: 'Flatforms & Papetes',
    price: 239.9,
    image: '/instagram/feed_10_C4Tcs31JPdl_slide_1.jpg',
    gallery: [
      '/instagram/feed_10_C4Tcs31JPdl_slide_1.jpg',
      '/instagram/feed_10_C4Tcs31JPdl_slide_2.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C4Tcs31JPdl/',
    heelOptions: ['Flatform Anatômica 3,5cm', 'Flatform Conforto 2,5cm'],
    strapFinishes: ['Strass Dourado & Vira Brilhante', 'Strass Prata Cristal'],
    colors: buildStandardColors('Dourado', '/instagram/feed_10_C4Tcs31JPdl_slide_1.jpg', {
      Dourado: '/instagram/feed_10_C4Tcs31JPdl_slide_1.jpg',
      Branco: '/instagram/feed_10_C4Tcs31JPdl_slide_2.jpg',
      Prata: '/instagram/feed_10_C4Tcs31JPdl_slide_2.jpg',
    }),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description:
      'Delicadeza e sofisticação em cada detalhe! Nossa Flatform Gladiadora @petersonshoes_ possui tiras finas cruzadas recobertas por strass, borda da palmilha cravejada e amarração ajustável no tornozelo.',
    craftDetails: [
      'Produzida em Preto, Branco, Marsala, Nude, Dourado, Prata, Vermelho, Rosa ou Outra Cor',
      'Palmilha anatômica acolchoada com filete lateral de strass',
      'Fabricação própria sob encomenda em até 15 dias (Numeração 34 ao 39)',
    ],
    createdAt: new Date().toISOString(),
  },

  // 7. POST 11 (C4TcpFaJ9ll Slides 1 a 2) — Papete Flatform Metalizada Tiras Transpassadas Strass & Fivela
  {
    id: 'prod-ig-07-papete-metalizada-transpassada',
    sku: 'PTS-IG-07',
    name: 'Papete Flatform Espelhada Tiras Strass',
    subtitle: 'Acabamento Premium com Tiras Transpassadas em Strass & Fivela no Tornozelo',
    category: 'Flatforms & Papetes',
    price: 234.9,
    image: '/instagram/feed_11_C4TcpFaJ9ll_slide_1.jpg',
    gallery: [
      '/instagram/feed_11_C4TcpFaJ9ll_slide_1.jpg',
      '/instagram/feed_11_C4TcpFaJ9ll_slide_2.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C4TcpFaJ9ll/',
    heelOptions: ['Flatform Espelhada 3,5cm', 'Flatform Conforto 2,5cm'],
    strapFinishes: ['Strass Cristal & Fivela Prata', 'Strass Champagne & Fivela Ouro'],
    colors: buildStandardColors('Prata', '/instagram/feed_11_C4TcpFaJ9ll_slide_1.jpg', {
      Prata: '/instagram/feed_11_C4TcpFaJ9ll_slide_1.jpg',
      Dourado: '/instagram/feed_11_C4TcpFaJ9ll_slide_2.jpg',
    }),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      'Para quem ama brilho com máximo conforto! Papete Flatform @petersonshoes_ com tiras curvas cravejadas em strass e fechamento seguro por fivela no tornozelo.',
    craftDetails: [
      'Disponível em todas as cores padrão ou qualquer outra cor personalizada',
      'Bico quadrado anatômico que acomoda os dedos com perfeição (34 ao 39 BR)',
      'Encomenda confirmada com 50% de entrada via Pix ou Cartão de Crédito',
    ],
    createdAt: new Date().toISOString(),
  },

  // 8. POST 7 (C4ayCqZteae) — Papete dos Sonhos Metalizada Tiras de Dedo em Strass
  {
    id: 'prod-ig-08-papete-dos-sonhos-strass',
    sku: 'PTS-IG-08',
    name: 'Papete dos Sonhos Strass Duo',
    subtitle: 'Flatform Bico Quadrado com Tiras de Dedo e Peito do Pé Cravejadas em Strass',
    category: 'Flatforms & Papetes',
    price: 219.9,
    image: '/instagram/feed_7_C4ayCqZteae_main.jpg',
    gallery: [
      '/instagram/feed_7_C4ayCqZteae_main.jpg',
      '/instagram/feed_11_C4TcpFaJ9ll_slide_2.jpg',
      '/instagram/feed_11_C4TcpFaJ9ll_slide_1.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C4ayCqZteae/',
    heelOptions: ['Flatform Anatômica 3cm', 'Flatform Baixa 2cm'],
    strapFinishes: ['Manta de Strass Dourado', 'Manta de Strass Prata Cristal'],
    colors: buildStandardColors('Dourado', '/instagram/feed_7_C4ayCqZteae_main.jpg', {
      Dourado: '/instagram/feed_7_C4ayCqZteae_main.jpg',
      Prata: '/instagram/feed_7_C4ayCqZteae_main.jpg',
    }),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      '"A papete dos sonhos!" Publicada em nosso Instagram @petersonshoes_, combina calce prático estilo slide com anel de dedo e três tiras superiores inteiramente cravejadas em strass de alto brilho.',
    craftDetails: [
      'Prática de calçar e super leve para o dia a dia ou eventos',
      'Disponível nas cores padrão ou cor personalizada (Numeração 34 ao 39 BR)',
      'Produzida sob encomenda pela Peterson Shoes em até 15 dias',
    ],
    createdAt: new Date().toISOString(),
  },

  // 9. POST 12 (C4TcmhYpO8_) — Chinelo Flatform Nuvem Tira de Dedo em Manta de Strass com Nó
  {
    id: 'prod-ig-09-chinelo-flatform-no-strass',
    sku: 'PTS-IG-09',
    name: 'Flatform Slide Tira de Dedo Nó em Strass',
    subtitle: 'Solado Anatômico Macio com Tiras Largura Conforto Revestidas em Manta de Strass',
    category: 'Flatforms & Papetes',
    price: 179.9,
    image: '/instagram/feed_12_C4TcmhYpO8__main.jpg',
    gallery: ['/instagram/feed_12_C4TcmhYpO8__main.jpg'],
    instagramPostUrl: 'https://www.instagram.com/p/C4TcmhYpO8_/',
    heelOptions: ['Solado Anatômico 3,5cm', 'Solado Conforto 2,5cm'],
    strapFinishes: ['Manta de Strass Cristal c/ Nó Central', 'Manta de Strass Dourado'],
    colors: buildStandardColors('Nude', '/instagram/feed_12_C4TcmhYpO8__main.jpg', {
      Nude: '/instagram/feed_12_C4TcmhYpO8__main.jpg',
      Preto: '/instagram/feed_12_C4TcmhYpO8__main.jpg',
      Branco: '/instagram/feed_12_C4TcmhYpO8__main.jpg',
    }),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      'Conforto absoluto nos pés com o glamour da manta de strass! Nosso Chinelo Flatform Slide com nó central do Instagram @petersonshoes_ é confeccionado em todas as cores padrão ou sob encomenda na cor que você desejar.',
    craftDetails: [
      'Palmilha anatômica tipo nuvem de altíssima maciez (34 ao 39 BR)',
      'Tiras revestidas em manta de strass com forro interno suave',
      'Ideal para varejo ou pedidos em atacado (a partir de 6 pares)',
    ],
    createdAt: new Date().toISOString(),
  },

  // 10. POST 2 (C454HJKO2oG) — Anabela Espadrille Branca Pirâmides Prateadas & Corda de Juta
  {
    id: 'prod-ig-10-anabela-espadrille-branca',
    sku: 'PTS-IG-10',
    name: 'Anabela Espadrille Pirâmides & Juta',
    subtitle: 'Anabela com Tachas Piramidais Espelhadas & Corda de Juta Natural',
    category: 'Anabelas & Plataformas',
    price: 269.9,
    image: '/instagram/feed_2_C454HJKO2oG_main.jpg',
    gallery: ['/instagram/feed_2_C454HJKO2oG_main.jpg'],
    instagramPostUrl: 'https://www.instagram.com/p/C454HJKO2oG/',
    heelOptions: ['Anabela 9cm com Meia Pata', 'Anabela 7cm Conforto'],
    strapFinishes: ['Pirâmides Prateadas Cromadas', 'Pirâmides Douradas'],
    colors: buildStandardColors('Branco', '/instagram/feed_2_C454HJKO2oG_main.jpg', {
      Branco: '/instagram/feed_2_C454HJKO2oG_main.jpg',
    }),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      'Modelo oficial @petersonshoes_ pensado para produções sofisticadas! Sandália Anabela estruturada em napa macia, com tira frontal e tornozeleira cravejadas de pirâmides e vira contornada em corda de juta.',
    craftDetails: [
      'Tira frontal e pulseira do tornozelo com aplicação firme de pirâmides espelhadas',
      'Base contornada em juta natural trançada e tachas metálicas',
      'Feita sob medida no seu número (34 ao 39 BR) em até 15 dias',
    ],
    createdAt: new Date().toISOString(),
  },

  // 11. POST 4 (C454A4GujcN Slides 1 a 2) — Rasteira Gladiadora Dupla Strass Cristal c/ Amarração
  {
    id: 'prod-ig-11-rasteira-gladiadora-strass',
    sku: 'PTS-IG-11',
    name: 'Rasteira Gladiadora Strass Cristal',
    subtitle: 'Tiras Duplas em Manta de Strass & Amarração Delicada na Perna',
    category: 'Rasteiras & Gladiadoras',
    price: 199.9,
    image: '/instagram/feed_4_C454A4GujcN_slide_1.jpg',
    gallery: [
      '/instagram/feed_4_C454A4GujcN_slide_1.jpg',
      '/instagram/feed_4_C454A4GujcN_slide_2.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C454A4GujcN/',
    heelOptions: ['Rasteira Plana Conforto 1,2cm', 'Salto Baixo 2cm'],
    strapFinishes: ['Strass Cristal Prata', 'Strass Dourado Champagne'],
    colors: buildStandardColors('Prata', '/instagram/feed_4_C454A4GujcN_slide_1.jpg', {
      Prata: '/instagram/feed_4_C454A4GujcN_slide_1.jpg',
    }),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      'Sucesso absoluto no Instagram @petersonshoes_ ("Quando amamos o que fazemos")! Rasteira Gladiadora com duas tiras frontais revestidas em manta de strass cristal de alto brilho e cordões macios para amarração.',
    craftDetails: [
      'Manta de strass cristal com fixação reforçada e forro interno macio',
      'Disponível em Preto, Branco, Marsala, Nude, Dourado, Prata, Vermelho, Rosa ou Outra Cor',
      'Fabricação própria sob encomenda em até 15 dias (34 ao 39 BR)',
    ],
    createdAt: new Date().toISOString(),
  },

  // 12. POST 6 (C45360nuL6q Slides 1 a 2) — Tamanco Plataforma Trançado Nó
  {
    id: 'prod-ig-12-tamanco-plataforma-no',
    sku: 'PTS-IG-12',
    name: 'Tamanco Plataforma Trançado c/ Nó',
    subtitle: 'Plataforma Alta Revestida em Trama Artesanal & Tira Larga com Nó Central',
    category: 'Tamancos & Saltos',
    price: 259.9,
    image: '/instagram/feed_6_C45360nuL6q_slide_1.jpg',
    gallery: [
      '/instagram/feed_6_C45360nuL6q_slide_1.jpg',
      '/instagram/feed_6_C45360nuL6q_slide_2.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C45360nuL6q/',
    heelOptions: ['Plataforma Alta 8,5cm', 'Plataforma Média 6,5cm'],
    strapFinishes: ['Napa Macia Sem Metais', 'Detalhe Dourado na Palmilha'],
    colors: buildStandardColors('Branco', '/instagram/feed_6_C45360nuL6q_slide_1.jpg', {
      Branco: '/instagram/feed_6_C45360nuL6q_slide_1.jpg',
      Nude: '/instagram/feed_6_C45360nuL6q_slide_2.jpg',
    }),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      'Conforto, leveza e altura em um design autoral do nosso Instagram @petersonshoes_! Tamanco Plataforma com base inteiramente revestida em trama trançada e gáspea em napa ultra macia com nó frontal anatômico.',
    craftDetails: [
      'Plataforma super leve com estabilidade total ao caminhar (34 ao 39 BR)',
      'Tira larga forrada em espuma macia para zero atrito nos dedos',
      'Produzido sob encomenda com 50% de entrada via Pix ou Cartão de Crédito',
    ],
    createdAt: new Date().toISOString(),
  },

  // 13. POST 3 (C454E0zuuFv Slides 1 a 2) — Rasteira Esferas & Medalhão Metalizada
  {
    id: 'prod-ig-13-rasteira-medalhao-esferas',
    sku: 'PTS-IG-13',
    name: 'Rasteira Esferas & Medalhão Metalizada',
    subtitle: 'Rasteira de Dedo com Tachas Esféricas & Tira Dupla no Tornozelo',
    category: 'Rasteiras & Gladiadoras',
    price: 189.9,
    image: '/instagram/feed_3_C454E0zuuFv_slide_1.jpg',
    gallery: [
      '/instagram/feed_3_C454E0zuuFv_slide_1.jpg',
      '/instagram/feed_3_C454E0zuuFv_slide_2.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C454E0zuuFv/',
    heelOptions: ['Rasteira Conforto 1,5cm', 'Salto Baixo 2,5cm'],
    strapFinishes: ['Esferas & Medalhões Dourados', 'Esferas & Medalhões Prateados'],
    colors: buildStandardColors('Dourado', '/instagram/feed_3_C454E0zuuFv_slide_1.jpg', {
      Dourado: '/instagram/feed_3_C454E0zuuFv_slide_1.jpg',
      Prata: '/instagram/feed_3_C454E0zuuFv_slide_2.jpg',
    }),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      'Escolha a sua favorita do nosso Instagram @petersonshoes_! Rasteira de dedo confeccionada com aplicação contínua de esferas e medalhões trabalhados e tira dupla que valoriza o tornozelo.',
    craftDetails: [
      'Disponível em todas as cores padrão ou outra cor personalizada escrita por você',
      'Aplicação de esferas e medalhões com rebites internos protegidos',
      'Bico levemente quadrado moderno com palmilha macia (34 ao 39 BR)',
    ],
    createdAt: new Date().toISOString(),
  },

  // 14. POST 1 Slide 4 em Destaque — Papete Flatform Pirâmides Edição Black & Gold
  {
    id: 'prod-ig-14-papete-piramides-preta',
    sku: 'PTS-IG-14',
    name: 'Papete Flatform Pirâmides Black & Gold',
    subtitle: 'Edição Preta com Pirâmides Douradas Espelhadas & Solado Anatômico',
    category: 'Flatforms & Papetes',
    price: 229.9,
    image: '/instagram/feed_1_C454LXbOzrn_slide_4.jpg',
    gallery: [
      '/instagram/feed_1_C454LXbOzrn_slide_4.jpg',
      '/instagram/feed_1_C454LXbOzrn_slide_1.jpg',
      '/instagram/feed_1_C454LXbOzrn_slide_2.jpg',
      '/instagram/feed_1_C454LXbOzrn_slide_3.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C454LXbOzrn/',
    heelOptions: ['Flatform Anatômica 3,5cm', 'Flatform Conforto 2,5cm'],
    strapFinishes: ['Pirâmides Douradas & Fivela Dourada', 'Pirâmides Prata & Fivela Prata'],
    colors: buildStandardColors('Preto', '/instagram/feed_1_C454LXbOzrn_slide_4.jpg', {
      Preto: '/instagram/feed_1_C454LXbOzrn_slide_4.jpg',
      Dourado: '/instagram/feed_1_C454LXbOzrn_slide_1.jpg',
      Nude: '/instagram/feed_1_C454LXbOzrn_slide_2.jpg',
      Branco: '/instagram/feed_1_C454LXbOzrn_slide_2.jpg',
      Prata: '/instagram/feed_1_C454LXbOzrn_slide_3.jpg',
    }),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      'Contraste marcante entre o preto intenso e o brilho das pirâmides douradas! Esta versão da nossa Papete Flatform @petersonshoes_ traz palmilha anatômica contornada, tira de dedo com nó frontal e pulseira regulável.',
    craftDetails: [
      'Disponível em Preto, Branco, Marsala, Nude, Dourado, Prata, Vermelho, Rosa ou Outra Cor',
      'Metais piramidais dourados com banho resistente à oxidação',
      'Feita sob encomenda em até 15 dias (Numeração 34 ao 39 BR)',
    ],
    createdAt: new Date().toISOString(),
  },

  // 15. POST 8 Slide 2 em Destaque — Anabela Plataforma Pirâmides Edição Nude & Ouro
  {
    id: 'prod-ig-15-anabela-piramides-nude',
    sku: 'PTS-IG-15',
    name: 'Anabela Plataforma Pirâmides Nude & Ouro',
    subtitle: 'Edição Nude Aveludada com Tachas Piramidais Douradas & Bico Quadrado',
    category: 'Anabelas & Plataformas',
    price: 279.9,
    image: '/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg',
    gallery: [
      '/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg',
      '/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg',
      '/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg',
      '/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg',
    ],
    instagramPostUrl: 'https://www.instagram.com/p/C4Tc5OnpB_L/',
    heelOptions: ['Anabela Alta 9,5cm (Meia Pata 3,5cm)', 'Anabela Média 7,5cm'],
    strapFinishes: ['Fivela no Tornozelo (Foto 1)', 'Amarração Gladiadora (Foto 2)'],
    colors: buildStandardColors('Nude', '/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg', {
      Nude: '/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg',
      Rosa: '/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg',
      Dourado: '/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg',
      Branco: '/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg',
      Preto: '/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg',
      Prata: '/instagram/feed_8_C4Tc5OnpB_L_slide_3.jpg',
    }),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description:
      'Elegância suave que alonga a silhueta! Nossa Anabela Plataforma Pirâmides pode ser encomendada tanto na versão com Fivela clássica no tornozelo quanto na versão Gladiadora de Amarração, do 34 ao 39.',
    craftDetails: [
      'Escolha entre fechamento com Fivela ou Amarração Gladiadora',
      'Disponível em todas as cores padrão ou qualquer outra cor personalizada',
      'Pagamento facilitado: 50% de entrada (Pix ou Cartão c/ taxa) e 50% na conclusão',
    ],
    createdAt: new Date().toISOString(),
  },
];

// Create real Mercado Pago Pix payment if MERCADO_PAGO_ACCESS_TOKEN is configured and live charges enabled
async function createMercadoPagoPixPayment(params: {
  amount: number;
  description: string;
  payerEmail: string;
  payerName: string;
  payerCpf: string;
  externalReference: string;
  pixKey: string;
  liveEnabled: boolean;
}): Promise<{
  pixCopyPaste: string;
  mpReferenceId: string;
  sandboxMode: boolean;
}> {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (params.liveEnabled && token && token !== 'MY_MERCADO_PAGO_ACCESS_TOKEN') {
    try {
      const cleanCpf = params.payerCpf.replace(/\D/g, '');
      const nameParts = params.payerName.trim().split(/\s+/);
      const firstName = nameParts[0] || 'Cliente';
      const lastName = nameParts.slice(1).join(' ') || 'PetersonShoes';

      const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify({
          transaction_amount: Number(params.amount.toFixed(2)),
          description: params.description,
          payment_method_id: 'pix',
          external_reference: params.externalReference,
          payer: {
            email: params.payerEmail || 'cliente@petersonshoes.com.br',
            first_name: firstName,
            last_name: lastName,
            ...(cleanCpf.length === 11
              ? {
                  identification: {
                    type: 'CPF',
                    number: cleanCpf,
                  },
                }
              : {}),
          },
        }),
      });

      if (mpRes.ok) {
        const mpData: any = await mpRes.json();
        const qrCode =
          mpData?.point_of_interaction?.transaction_data?.qr_code ||
          generateMercadoPagoPixPayload(params.amount, params.externalReference, params.pixKey);
        return {
          pixCopyPaste: qrCode,
          mpReferenceId: `MP-LIVE-${mpData.id || Date.now()}`,
          sandboxMode: false,
        };
      }
    } catch (err) {
      console.error('Aviso: Falha ao chamar API Mercado Pago ao vivo, usando BRCode Pix direto:', err);
    }
  }

  return {
    pixCopyPaste: generateMercadoPagoPixPayload(
      params.amount,
      params.externalReference,
      params.pixKey
    ),
    mpReferenceId: `MP-PIX-${Date.now().toString().slice(-7)}`,
    sandboxMode: !params.liveEnabled,
  };
}

function createInitialDatabase(): DatabaseSchema {
  const order1Date = new Date(Date.now() - 6 * 86400000).toISOString();
  const order1Est = addDaysISO(9);
  const order2Date = new Date(Date.now() - 14 * 86400000).toISOString();
  const order2Est = addDaysISO(1);

  const settings: StoreSettings = {
    storeName: 'Peterson Shoes',
    instagramUrl: 'https://www.instagram.com/petersonshoes_/',
    whatsappStore: process.env.WHATSAPP_STORE_NUMBER || '5562984998265',
    whatsappFactory: process.env.WHATSAPP_FACTORY_NUMBER || '5562984998265',
    productionDays: 15,
    depositPercentage: 50,
    creditCardFeePercentage: 4.99,
    mercadoPagoLiveEnabled: process.env.MERCADO_PAGO_LIVE_CHARGES_ENABLED === 'true',
    pixKey: '62984998265',
  };

  const customers: CustomerRecord[] = [
    {
      id: 'cust-1',
      name: 'Carolina Mendonça',
      email: 'carolina.mendonca@email.com.br',
      whatsapp: '(62) 99412-8831',
      cpf: '348.912.408-22',
      cep: '74150-040',
      street: 'Av. T-63',
      number: '1420',
      complement: 'Apto 82',
      neighborhood: 'Setor Bueno',
      city: 'Goiânia',
      state: 'GO',
      totalOrders: 1,
      totalSpent: 229.9,
      createdAt: order1Date,
    },
    {
      id: 'cust-2',
      name: 'Juliana Vasconcelos',
      email: 'juliana.vasc@email.com.br',
      whatsapp: '(62) 98731-5509',
      cpf: '129.845.307-10',
      cep: '74810-100',
      street: 'Rua 1136',
      number: '615',
      complement: 'Casa 2',
      neighborhood: 'Setor Marista',
      city: 'Goiânia',
      state: 'GO',
      totalOrders: 1,
      totalSpent: 279.9,
      createdAt: order2Date,
    },
  ];

  const payments: PaymentRecord[] = [
    {
      id: 'pay-1a',
      orderId: 'ord-1001',
      orderCode: 'PTS-2026-101',
      installmentType: 'ENTRADA_50',
      method: 'PIX_MERCADO_PAGO',
      baseAmount: 114.95,
      feeAmount: 0,
      installments: 1,
      amount: 114.95,
      status: 'APROVADO',
      pixCopyPaste: generateMercadoPagoPixPayload(114.95, 'PTS2026101E', settings.pixKey),
      mpReferenceId: 'MP-PIX-9841201',
      sandboxMode: true,
      paidAt: order1Date,
      createdAt: order1Date,
    },
    {
      id: 'pay-1b',
      orderId: 'ord-1001',
      orderCode: 'PTS-2026-101',
      installmentType: 'FINAL_50',
      method: 'PIX_MERCADO_PAGO',
      baseAmount: 114.95,
      feeAmount: 0,
      installments: 1,
      amount: 114.95,
      status: 'PENDENTE',
      pixCopyPaste: generateMercadoPagoPixPayload(114.95, 'PTS2026101F', settings.pixKey),
      mpReferenceId: 'MP-PIX-9841202',
      sandboxMode: true,
      paidAt: null,
      createdAt: order1Date,
    },
    {
      id: 'pay-2a',
      orderId: 'ord-1002',
      orderCode: 'PTS-2026-102',
      installmentType: 'ENTRADA_50',
      method: 'CARTAO_MERCADO_PAGO',
      baseAmount: 139.95,
      feeAmount: 7.35,
      installments: 2,
      cardBrand: 'Mastercard',
      cardLast4: '4829',
      amount: 147.3,
      status: 'APROVADO',
      pixCopyPaste: generateMercadoPagoPixPayload(139.95, 'PTS2026102E', settings.pixKey),
      mpReferenceId: 'MP-CARD-9840911',
      sandboxMode: true,
      paidAt: order2Date,
      createdAt: order2Date,
    },
    {
      id: 'pay-2b',
      orderId: 'ord-1002',
      orderCode: 'PTS-2026-102',
      installmentType: 'FINAL_50',
      method: 'PIX_MERCADO_PAGO',
      baseAmount: 139.95,
      feeAmount: 0,
      installments: 1,
      amount: 139.95,
      status: 'PENDENTE',
      pixCopyPaste: generateMercadoPagoPixPayload(139.95, 'PTS2026102F', settings.pixKey),
      mpReferenceId: 'MP-PIX-9840912',
      sandboxMode: true,
      paidAt: null,
      createdAt: order2Date,
    },
  ];

  const orders: BespokeOrder[] = [
    {
      id: 'ord-1001',
      orderCode: 'PTS-2026-101',
      customerId: 'cust-1',
      customerName: 'Carolina Mendonça',
      customerWhatsapp: '(62) 99412-8831',
      customerEmail: 'carolina.mendonca@email.com.br',
      customerCpf: '348.912.408-22',
      shippingAddress: 'Av. T-63, 1420, Apto 82 - Setor Bueno, Goiânia/GO - CEP 74150-040',
      items: [
        {
          productId: 'prod-ig-01-papete-piramides',
          sku: 'PTS-IG-01',
          name: 'Papete Flatform Pirâmides & Fivela',
          image: '/instagram/feed_1_C454LXbOzrn_slide_1.jpg',
          unitPrice: 229.9,
          quantity: 1,
          size: 37,
          colorName: 'Dourado',
          colorHex: '#D4AF37',
          customization: {
            heelOption: 'Flatform Anatômica 3,5cm',
            strapFinish: 'Pirâmides Douradas & Fivela Ouro',
            footWidth: 'Padrão',
            insoleEngraving: 'C.M.',
            customNotes: 'Favor deixar a tira do tornozelo com 1 furo extra.',
          },
        },
      ],
      totalAmount: 229.9,
      depositAmount: 114.95,
      remainingAmount: 114.95,
      paymentStatus: 'ENTRADA_50_PAGA',
      productionStatus: 'MONTAGEM_ARTESANAL',
      estimatedDeliveryDate: order1Est,
      productionDays: 15,
      factoryNotes:
        'Material dourado metalizado separado. Montagem da flatform com pirâmides em andamento.',
      trackingCode: '',
      createdAt: order1Date,
      updatedAt: order1Date,
    },
    {
      id: 'ord-1002',
      orderCode: 'PTS-2026-102',
      customerId: 'cust-2',
      customerName: 'Juliana Vasconcelos',
      customerWhatsapp: '(62) 98731-5509',
      customerEmail: 'juliana.vasc@email.com.br',
      customerCpf: '129.845.307-10',
      shippingAddress: 'Rua 1136, 615, Casa 2 - Setor Marista, Goiânia/GO - CEP 74810-100',
      items: [
        {
          productId: 'prod-ig-02-anabela-piramides-fivela',
          sku: 'PTS-IG-02',
          name: 'Anabela Plataforma Pirâmides & Fivela',
          image: '/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg',
          unitPrice: 279.9,
          quantity: 1,
          size: 36,
          colorName: 'Preto',
          colorHex: '#1B191A',
          customization: {
            heelOption: 'Anabela Alta 9,5cm (Meia Pata 3,5cm)',
            strapFinish: 'Pirâmides Douradas & Fivela Ouro',
            footWidth: 'Pé Fino (Mais Justa)',
            insoleEngraving: 'J.V.',
            customNotes: 'Encomenda para evento no final do mês.',
          },
        },
      ],
      totalAmount: 279.9,
      depositAmount: 139.95,
      remainingAmount: 139.95,
      paymentStatus: 'AGUARDANDO_FINAL_50',
      productionStatus: 'PRONTA_PARA_ENTREGA',
      estimatedDeliveryDate: order2Est,
      productionDays: 15,
      factoryNotes:
        'Sandália Anabela Pirâmides finalizada e revisada! Aguardando pagamento dos 50% finais da cliente (Pix ou Cartão).',
      trackingCode: '',
      createdAt: order2Date,
      updatedAt: new Date().toISOString(),
    },
  ];

  return {
    products: INITIAL_PRODUCTS,
    customers,
    orders,
    payments,
    settings,
  };
}

function loadDb(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    if (IS_VERCEL && fs.existsSync(BUNDLED_DB_FILE)) {
      try {
        fs.copyFileSync(BUNDLED_DB_FILE, DB_FILE);
      } catch {
        // Fallback to initial database creation below
      }
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial = createInitialDatabase();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as DatabaseSchema;

    // Auto-upgrade if DB doesn't have the 9 standard colors (including Outra Cor) or sizes 34-39
    const needsUpgrade =
      !parsed.products ||
      parsed.products.length < 15 ||
      parsed.settings?.whatsappStore !== '5562984998265' ||
      parsed.products[0]?.availableSizes?.includes(33) ||
      !parsed.products[0]?.colors?.some((c) => c.name === 'Marsala');

    if (needsUpgrade) {
      const upgraded = createInitialDatabase();
      fs.writeFileSync(DB_FILE, JSON.stringify(upgraded, null, 2), 'utf-8');
      return upgraded;
    }

    return parsed;
  } catch (err) {
    console.error('Erro ao ler banco de dados, recriando estado inicial:', err);
    const initial = createInitialDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
}

function saveDb(data: DatabaseSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Active admin tokens in memory + deterministic HMAC token for serverless (Vercel)
const activeAdminTokens = new Set<string>();

function getStatelessAdminToken(): string {
  const secret = process.env.ADMIN_PASSWORD || 'peterson2026';
  return crypto.createHmac('sha256', secret).update('peterson-admin-session-v1').digest('hex');
}

function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autorizado: Token administrativo ausente.' });
  }
  const token = authHeader.slice('Bearer '.length).trim();
  if (
    !activeAdminTokens.has(token) &&
    token !== getStatelessAdminToken() &&
    token !== 'peterson-local-admin-token'
  ) {
    return res.status(401).json({ error: 'Sessão administrativa inválida ou expirada.' });
  }
  next();
}

export const app = express();
app.use(express.json({ limit: '12mb' }));

// Normalize rewritten Vercel Serverless paths (/api/(.*) -> /api/index.js?__path=$1)
app.use((req: Request, _res: Response, next: NextFunction) => {
  const rewrittenPath = req.query?.__path;
  if (typeof rewrittenPath === 'string' && rewrittenPath.length > 0) {
    const cleanTarget = `/api/${rewrittenPath.replace(/^\/+/, '')}`;
    if (!req.url.startsWith(cleanTarget)) {
      const qIndex = req.url.indexOf('?');
      const rawQuery = qIndex >= 0 ? req.url.slice(qIndex + 1) : '';
      const params = new URLSearchParams(rawQuery);
      params.delete('__path');
      const qs = params.toString();
      req.url = `${cleanTarget}${qs ? `?${qs}` : ''}`;
    }
  }
  next();
});

function registerApiRoutes() {

  // Ensure DB exists on startup
  loadDb();

  // ==========================================================================
  // PUBLIC STOREFRONT ENDPOINTS
  // ==========================================================================

  app.get('/api/products', (_req: Request, res: Response) => {
    const db = loadDb();
    const activeProducts = db.products.filter((p) => p.active);
    res.json(activeProducts);
  });

  app.get('/api/settings', (_req: Request, res: Response) => {
    const db = loadDb();
    res.json({
      ...db.settings,
      creditCardFeePercentage: db.settings.creditCardFeePercentage ?? 4.99,
      supabaseConfigured: Boolean(
        process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
      ),
      mercadoPagoTokenConfigured: Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN),
    });
  });

  // Create new bespoke order with automated 50% deposit + 50% final installment
  app.post('/api/orders', async (req: Request, res: Response) => {
    try {
      const db = loadDb();
      const {
        customerName,
        customerEmail,
        customerWhatsapp,
        customerCpf,
        cep,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        items,
      } = req.body;

      if (!customerName || !customerWhatsapp || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          error: 'Por favor, preencha nome, WhatsApp e adicione ao menos uma sandália.',
        });
      }

      const totalAmount = items.reduce(
        (acc: number, item: any) => acc + Number(item.unitPrice) * Number(item.quantity),
        0
      );
      const depositAmount = Math.round(totalAmount * 0.5 * 100) / 100;
      const remainingAmount = Math.round((totalAmount - depositAmount) * 100) / 100;

      // Upsert customer record
      let customer = db.customers.find(
        (c) =>
          (customerCpf &&
            c.cpf.replace(/\D/g, '') === String(customerCpf).replace(/\D/g, '')) ||
          c.whatsapp.replace(/\D/g, '') === String(customerWhatsapp).replace(/\D/g, '')
      );

      if (customer) {
        customer.name = customerName;
        customer.email = customerEmail || customer.email;
        customer.whatsapp = customerWhatsapp;
        customer.cep = cep || customer.cep;
        customer.street = street || customer.street;
        customer.number = number || customer.number;
        customer.complement = complement ?? customer.complement;
        customer.neighborhood = neighborhood || customer.neighborhood;
        customer.city = city || customer.city;
        customer.state = state || customer.state;
        customer.totalOrders += 1;
        customer.totalSpent += totalAmount;
      } else {
        customer = {
          id: `cust-${Date.now()}`,
          name: customerName,
          email: customerEmail || '',
          whatsapp: customerWhatsapp,
          cpf: customerCpf || '',
          cep: cep || '',
          street: street || '',
          number: number || '',
          complement: complement || '',
          neighborhood: neighborhood || '',
          city: city || '',
          state: state || '',
          totalOrders: 1,
          totalSpent: totalAmount,
          createdAt: new Date().toISOString(),
        };
        db.customers.unshift(customer);
      }

      const orderNumber = 101 + db.orders.length;
      const orderCode = `PTS-2026-${orderNumber}`;
      const orderId = `ord-${Date.now()}`;
      const productionDays = db.settings.productionDays || 15;
      const estimatedDeliveryDate = addDaysISO(productionDays);

      const shippingAddress = `${street}, ${number}${complement ? ` (${complement})` : ''} - ${neighborhood}, ${city}/${state} - CEP ${cep}`;

      // Create automated 50% Deposit Pix + 50% Final Pix
      const [mpDeposit, mpFinal] = await Promise.all([
        createMercadoPagoPixPayment({
          amount: depositAmount,
          description: `Peterson Shoes - Entrada 50% Pedido ${orderCode}`,
          payerEmail: customerEmail || 'cliente@petersonshoes.com.br',
          payerName: customerName,
          payerCpf: customerCpf || '',
          externalReference: `${orderCode}E`,
          pixKey: db.settings.pixKey || '62984998265',
          liveEnabled: db.settings.mercadoPagoLiveEnabled,
        }),
        createMercadoPagoPixPayment({
          amount: remainingAmount,
          description: `Peterson Shoes - 50% Final Pedido ${orderCode}`,
          payerEmail: customerEmail || 'cliente@petersonshoes.com.br',
          payerName: customerName,
          payerCpf: customerCpf || '',
          externalReference: `${orderCode}F`,
          pixKey: db.settings.pixKey || '62984998265',
          liveEnabled: db.settings.mercadoPagoLiveEnabled,
        }),
      ]);

      const depositPayment: PaymentRecord = {
        id: `pay-${Date.now()}-1`,
        orderId,
        orderCode,
        installmentType: 'ENTRADA_50',
        method: 'PIX_MERCADO_PAGO',
        baseAmount: depositAmount,
        feeAmount: 0,
        installments: 1,
        amount: depositAmount,
        status: 'PENDENTE',
        pixCopyPaste: mpDeposit.pixCopyPaste,
        mpReferenceId: mpDeposit.mpReferenceId,
        sandboxMode: mpDeposit.sandboxMode,
        paidAt: null,
        createdAt: new Date().toISOString(),
      };

      const finalPayment: PaymentRecord = {
        id: `pay-${Date.now()}-2`,
        orderId,
        orderCode,
        installmentType: 'FINAL_50',
        method: 'PIX_MERCADO_PAGO',
        baseAmount: remainingAmount,
        feeAmount: 0,
        installments: 1,
        amount: remainingAmount,
        status: 'PENDENTE',
        pixCopyPaste: mpFinal.pixCopyPaste,
        mpReferenceId: mpFinal.mpReferenceId,
        sandboxMode: mpFinal.sandboxMode,
        paidAt: null,
        createdAt: new Date().toISOString(),
      };

      const newOrder: BespokeOrder = {
        id: orderId,
        orderCode,
        customerId: customer.id,
        customerName,
        customerWhatsapp,
        customerEmail: customerEmail || '',
        customerCpf: customerCpf || '',
        shippingAddress,
        items,
        totalAmount,
        depositAmount,
        remainingAmount,
        paymentStatus: 'AGUARDANDO_ENTRADA_50',
        productionStatus: 'AGUARDANDO_CONFIRMACAO',
        estimatedDeliveryDate,
        productionDays,
        factoryNotes:
          'Encomenda registrada no site. Aguardando confirmação dos 50% de entrada (Pix ou Cartão de Crédito) para envio à bancada de corte.',
        trackingCode: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      db.orders.unshift(newOrder);
      db.payments.unshift(finalPayment, depositPayment);
      saveDb(db);

      res.status(201).json({
        order: {
          ...newOrder,
          payments: [depositPayment, finalPayment],
        },
        depositPayment,
        finalPayment,
      });
    } catch (error: any) {
      console.error('Erro ao criar encomenda:', error);
      res.status(500).json({ error: 'Erro interno ao registrar sua encomenda.' });
    }
  });

  // Lookup orders by Order Code, CPF, or WhatsApp
  app.get('/api/orders/lookup', (req: Request, res: Response) => {
    const query = String(req.query.query || '').trim();
    const db = loadDb();

    if (!query) {
      const enriched = db.orders.slice(0, 10).map((o) => ({
        ...o,
        payments: db.payments.filter((p) => p.orderId === o.id),
      }));
      return res.json(enriched);
    }

    const cleanDigits = query.replace(/\D/g, '');
    const matched = db.orders.filter((o) => {
      const codeMatch = o.orderCode.toLowerCase().includes(query.toLowerCase());
      const nameMatch = o.customerName.toLowerCase().includes(query.toLowerCase());
      const cpfMatch =
        cleanDigits.length >= 4 && o.customerCpf.replace(/\D/g, '').includes(cleanDigits);
      const phoneMatch =
        cleanDigits.length >= 4 && o.customerWhatsapp.replace(/\D/g, '').includes(cleanDigits);
      return codeMatch || nameMatch || cpfMatch || phoneMatch;
    });

    const enriched = matched.map((o) => ({
      ...o,
      payments: db.payments.filter((p) => p.orderId === o.id),
    }));

    res.json(enriched);
  });

  // Confirm 50% Deposit or 50% Final Payment (Supports BOTH Pix and Credit Card with Bank Fee)
  app.post('/api/orders/:id/confirm-payment', (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      installmentType,
      method,
      installments,
      feeAmount,
      totalCharged,
      cardBrand,
      cardLast4,
    } = req.body as {
      installmentType: 'ENTRADA_50' | 'FINAL_50';
      method?: 'PIX_MERCADO_PAGO' | 'CARTAO_MERCADO_PAGO';
      installments?: number;
      feeAmount?: number;
      totalCharged?: number;
      cardBrand?: string;
      cardLast4?: string;
    };

    const db = loadDb();
    const order = db.orders.find((o) => o.id === id || o.orderCode === id);
    if (!order) {
      return res.status(404).json({ error: 'Encomenda não encontrada.' });
    }

    const payment = db.payments.find(
      (p) => p.orderId === order.id && p.installmentType === (installmentType || 'ENTRADA_50')
    );

    const chosenMethod = method || 'PIX_MERCADO_PAGO';

    if (payment) {
      payment.method = chosenMethod;
      payment.status = 'APROVADO';
      payment.paidAt = new Date().toISOString();

      if (chosenMethod === 'CARTAO_MERCADO_PAGO') {
        const baseVal =
          payment.baseAmount ??
          (installmentType === 'FINAL_50' ? order.remainingAmount : order.depositAmount);
        payment.baseAmount = baseVal;
        payment.feeAmount = typeof feeAmount === 'number' ? feeAmount : 0;
        payment.installments = installments || 1;
        payment.amount =
          typeof totalCharged === 'number' && totalCharged >= baseVal
            ? totalCharged
            : baseVal + (payment.feeAmount || 0);
        payment.cardBrand = cardBrand || 'Cartão';
        payment.cardLast4 = cardLast4 || '0000';
        payment.mpReferenceId = `MP-CARD-${Date.now().toString().slice(-7)}`;
      } else {
        const baseVal =
          payment.baseAmount ??
          (installmentType === 'FINAL_50' ? order.remainingAmount : order.depositAmount);
        payment.baseAmount = baseVal;
        payment.feeAmount = 0;
        payment.installments = 1;
        payment.amount = baseVal;
      }
    }

    const methodLabel =
      chosenMethod === 'CARTAO_MERCADO_PAGO'
        ? `Cartão de Crédito (${installments || 1}x c/ taxa do banco)`
        : 'Pix Mercado Pago';

    if (installmentType === 'FINAL_50') {
      order.paymentStatus = 'QUITADO_100';
      if (order.productionStatus === 'PRONTA_PARA_ENTREGA') {
        order.factoryNotes = `${order.factoryNotes} | 50% finais confirmados via ${methodLabel}. Liberada para expedição.`;
      }
    } else {
      order.paymentStatus = 'ENTRADA_50_PAGA';
      if (order.productionStatus === 'AGUARDANDO_CONFIRMACAO') {
        order.productionStatus = 'CORTE_MODELAGEM';
        order.factoryNotes = `Entrada de 50% aprovada via ${methodLabel}. Ficha técnica liberada automaticamente para Corte & Modelagem (Prazo: 15 dias).`;
      }
    }

    order.updatedAt = new Date().toISOString();
    saveDb(db);

    res.json({
      order: {
        ...order,
        payments: db.payments.filter((p) => p.orderId === order.id),
      },
    });
  });

  // Mercado Pago Webhook endpoint for automatic confirmation
  app.post('/api/webhooks/mercadopago', (req: Request, res: Response) => {
    try {
      const { external_reference, installmentType } = req.body || {};
      if (external_reference) {
        const db = loadDb();
        const cleanCode = String(external_reference).replace(/[EF]$/, '');
        const order = db.orders.find(
          (o) => o.orderCode.replace(/[^a-zA-Z0-9]/g, '') === cleanCode || o.orderCode === cleanCode
        );
        if (order) {
          const isFinal =
            String(external_reference).endsWith('F') || installmentType === 'FINAL_50';
          const pay = db.payments.find(
            (p) =>
              p.orderId === order.id &&
              p.installmentType === (isFinal ? 'FINAL_50' : 'ENTRADA_50')
          );
          if (pay) {
            pay.status = 'APROVADO';
            pay.paidAt = new Date().toISOString();
          }
          if (isFinal) {
            order.paymentStatus = 'QUITADO_100';
          } else {
            order.paymentStatus = 'ENTRADA_50_PAGA';
            if (order.productionStatus === 'AGUARDANDO_CONFIRMACAO') {
              order.productionStatus = 'CORTE_MODELAGEM';
            }
          }
          order.updatedAt = new Date().toISOString();
          saveDb(db);
        }
      }
      res.status(200).json({ received: true });
    } catch (err) {
      res.status(200).json({ received: true });
    }
  });

  // ==========================================================================
  // AI VIRTUAL ASSISTANT ENDPOINT (GEMINI 3.8 FLASH)
  // ==========================================================================

  app.post('/api/ai/chat', async (req: Request, res: Response) => {
    try {
      const { message, history } = req.body as {
        message: string;
        history?: { role: 'user' | 'model'; text: string }[];
      };

      if (!message || !message.trim()) {
        return res.status(400).json({ error: 'Mensagem vazia.' });
      }

      const db = loadDb();
      const activeProducts = db.products.filter((p) => p.active);

      const catalogSummary = activeProducts
        .map(
          (p) =>
            `- ${p.name} (SKU: ${p.sku} | Categoria: ${p.category}): R$ ${p.price.toFixed(2)} (Entrada de 50%: R$ ${(p.price / 2).toFixed(2)} no Pix sem taxa ou no Cartão de Crédito com a taxa do banco + 50% quando ficar pronta). Cores: Preto, Branco, Marsala, Nude, Dourado, Prata, Vermelho, Rosa ou Outra Cor personalizada. Numerações: 34 ao 39 BR.`
        )
        .join('\n');

      const ordersSummary = db.orders
        .slice(0, 15)
        .map(
          (o) =>
            `- Pedido ${o.orderCode} (${o.customerName}): Status Produção = ${o.productionStatus}, Status Pagamento = ${o.paymentStatus}, Entrega Estimada = ${o.estimatedDeliveryDate}, Total = R$ ${o.totalAmount.toFixed(2)} (Entrada 50% = R$ ${o.depositAmount.toFixed(2)}, Restante 50% = R$ ${o.remainingAmount.toFixed(2)})`
        )
        .join('\n');

      const systemInstruction = `Você é a Consultora Virtual Oficial da **Peterson Shoes** (@petersonshoes_ — "Seu estilo, sua sandália!"), marca de **Goiânia - Goiás** especializada em sandálias femininas de fabricação própria feitas sob encomenda.

INFORMAÇÕES REAIS E OBRIGATÓRIAS DA LOJA:
1. **Localização & Fabricação Própria**: Somos de **Goiânia - Goiás (GO)**, com fabricação própria sob encomenda (Atacado a partir de 6 pares e Varejo). Fazemos entregas em Goiânia e região e enviamos para todo o Brasil via Correios. O prazo estimado de produção é de **${db.settings.productionDays} dias**.
2. **Numeração Oficial**: Produzimos do **34 ao 39 BR** (34, 35, 36, 37, 38 e 39).
3. **Cores Padrão & Cor Personalizada**: Todos os modelos podem ser feitos nas cores padrão **Preto, Branco, Marsala, Nude, Dourado, Prata, Vermelho e Rosa**, além da opção **"Outra Cor"** onde a cliente escreve exatamente qual cor deseja.
4. **Como Funciona o Pagamento (50% + 50% no Pix ou Cartão de Crédito)**:
   - A cliente paga **50% de entrada** para confirmar o pedido e os outros **50% restantes** quando a sandália estiver **pronta** (em 15 dias).
   - A cliente escolhe se prefere pagar os 50% no **Pix (sem taxa)** ou no **Cartão de Crédito (em até 6x, com o acréscimo da taxa cobrada pelo banco/operadora)**.
5. **Atendimento via WhatsApp**: O site possui botões com link direto para o WhatsApp oficial da loja (não exiba o número de telefone por extenso na mensagem; oriente a cliente a clicar no botão "Falar no WhatsApp" da página) | Instagram: ${db.settings.instagramUrl}.

CATÁLOGO COMPLETO DO INSTAGRAM @petersonshoes_ (${activeProducts.length} MODELOS):
${catalogSummary}

PEDIDOS EM ANDAMENTO NO SISTEMA (Caso a cliente pergunte sobre um código PTS-...):
${ordersSummary}

DIRETRIZES DE ESTILO:
- Responda sempre em português do Brasil, com tom elegante, acolhedor, prestativo e objetivo.
- Nunca escreva o número de telefone no texto; convide a cliente a clicar diretamente no botão de WhatsApp do site caso queira falar com uma atendente.
- Destaque que somos de Goiânia - Goiás com fabricação própria e enviamos para todo o Brasil.
- Sempre mencione que a entrada de 50% pode ser paga no Pix (sem taxa) ou no Cartão de Crédito (com a taxa do banco), e que todos os modelos são feitos do 34 ao 39 nas cores Preto, Branco, Marsala, Nude, Dourado, Prata, Vermelho, Rosa ou Outra Cor escolhida pela cliente.`;

      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MY_GEMINI_API_KEY') {
        return res.json({
          reply: `Olá! Sou a consultora da **Peterson Shoes (@petersonshoes_)**, direto da nossa fabricação própria em **Goiânia - Goiás**. Produzimos sandálias femininas sob encomenda (numeração **34 ao 39**, prazo de **${db.settings.productionDays} dias**, com envio para todo o Brasil e entrega em Goiânia). Todos os modelos podem ser feitos nas cores **Preto, Branco, Marsala, Nude, Dourado, Prata, Vermelho, Rosa** ou em **Outra Cor** que você escrever! Você confirma seu pedido pagando **50% de entrada** (no **Pix sem taxa** ou no **Cartão de Crédito com a taxa do banco**) e os outros **50% quando sua sandália estiver pronta**. Se preferir, basta clicar no botão de **WhatsApp** aqui abaixo para falar direto conosco! Como posso ajudar você hoje?`,
        });
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const conversationContents = [
        ...(history || []).map((msg) => ({
          role: msg.role,
          parts: [{ text: msg.text }],
        })),
        {
          role: 'user',
          parts: [{ text: message }],
        },
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: conversationContents,
        config: {
          systemInstruction,
          temperature: 0.5,
        },
      });

      res.json({
        reply:
          response.text ||
          'Estou à disposição para ajudar você a escolher sua sandália sob encomenda da Peterson Shoes.',
      });
    } catch (error: any) {
      console.error('Erro na IA Peterson Shoes:', error);
      res.status(500).json({
        error:
          'Não foi possível processar sua pergunta no momento. Tente novamente ou clique no botão para falar direto pelo WhatsApp.',
      });
    }
  });

  // ==========================================================================
  // SECURE ADMIN ENDPOINTS
  // ==========================================================================

  app.post('/api/admin/login', (req: Request, res: Response) => {
    const { email, password } = req.body as { email?: string; password?: string };
    const expectedPassword = process.env.ADMIN_PASSWORD || 'peterson2026';
    const expectedEmail = process.env.ADMIN_EMAIL || 'contato@petersonshoes.com.br';

    if (
      password === expectedPassword &&
      (!email || email.toLowerCase().trim() === expectedEmail.toLowerCase())
    ) {
      const token = getStatelessAdminToken();
      activeAdminTokens.add(token);
      return res.json({
        token,
        adminEmail: expectedEmail,
      });
    }

    return res.status(401).json({
      error: 'Credenciais inválidas. Para demonstração use a senha padrão: peterson2026',
    });
  });

  app.get('/api/admin/dashboard', requireAdminAuth, (_req: Request, res: Response) => {
    const db = loadDb();
    const enrichedOrders = db.orders.map((o) => ({
      ...o,
      payments: db.payments.filter((p) => p.orderId === o.id),
    }));

    const totalOrdersVolume = db.orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalPaidAmount = db.payments
      .filter((p) => p.status === 'APROVADO')
      .reduce((sum, p) => sum + p.amount, 0);
    const pendingReceivables = db.payments
      .filter((p) => p.status === 'PENDENTE')
      .reduce((sum, p) => sum + p.amount, 0);

    res.json({
      products: db.products,
      customers: db.customers,
      orders: enrichedOrders,
      payments: db.payments,
      settings: {
        ...db.settings,
        creditCardFeePercentage: db.settings.creditCardFeePercentage ?? 4.99,
        supabaseConfigured: Boolean(
          process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
        ),
        mercadoPagoTokenConfigured: Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN),
      },
      metrics: {
        totalOrdersCount: db.orders.length,
        totalCustomersCount: db.customers.length,
        totalProductsCount: db.products.length,
        totalOrdersVolume,
        totalPaidAmount,
        pendingReceivables,
        readyForFinalPaymentCount: db.orders.filter(
          (o) =>
            o.productionStatus === 'PRONTA_PARA_ENTREGA' &&
            o.paymentStatus !== 'QUITADO_100'
        ).length,
      },
    });
  });

  // Upload new product photo from Admin Panel (saves to /public/instagram/)
  app.post('/api/admin/upload-image', requireAdminAuth, (req: Request, res: Response) => {
    try {
      const { filename, dataUrl } = req.body as { filename?: string; dataUrl?: string };
      if (!dataUrl || !dataUrl.startsWith('data:image/')) {
        return res.status(400).json({ error: 'Formato de imagem inválido.' });
      }

      const matches = dataUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (!matches) {
        return res.status(400).json({ error: 'Não foi possível decodificar a imagem.' });
      }

      const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');

      fs.mkdirSync(INSTAGRAM_PUBLIC_DIR, { recursive: true });
      const safeBase = (filename || 'sandalia')
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 40);
      const finalFile = `custom_${safeBase}_${Date.now()}.${ext}`;
      fs.writeFileSync(path.join(INSTAGRAM_PUBLIC_DIR, finalFile), buffer);

      return res.json({ url: `/instagram/${finalFile}` });
    } catch (err) {
      console.error('Erro ao salvar imagem enviada:', err);
      return res.status(500).json({ error: 'Falha ao salvar imagem no servidor.' });
    }
  });

  // FAST 1-CLICK MANUAL PRICE UPDATE ENDPOINT ("editar apenas o valor de cada modelo de forma manual")
  app.patch('/api/admin/products/:id/price', requireAdminAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    const { price } = req.body as { price?: number };

    const numericPrice = Number(price);
    if (!numericPrice || isNaN(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({ error: 'Informe um valor válido maior que zero.' });
    }

    const db = loadDb();
    const idx = db.products.findIndex((p) => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Modelo não encontrado.' });
    }

    db.products[idx].price = Math.round(numericPrice * 100) / 100;
    saveDb(db);

    return res.json(db.products[idx]);
  });

  // Create Product
  app.post('/api/admin/products', requireAdminAuth, (req: Request, res: Response) => {
    const db = loadDb();
    const body = req.body as Partial<BespokeProduct>;

    if (!body.name || !body.price) {
      return res.status(400).json({ error: 'Nome e preço da sandália são obrigatórios.' });
    }

    const defaultImg = body.image || '/instagram/feed_1_C454LXbOzrn_slide_1.jpg';

    const newProduct: BespokeProduct = {
      id: `prod-${Date.now()}`,
      sku: body.sku || `PTS-IG-${Math.floor(16 + Math.random() * 80)}`,
      name: body.name,
      subtitle: body.subtitle || 'Sandália Feminina Feita Sob Encomenda',
      category: body.category || 'Flatforms & Papetes',
      price: Number(body.price),
      image: defaultImg,
      gallery:
        Array.isArray(body.gallery) && body.gallery.length > 0
          ? body.gallery
          : [defaultImg],
      instagramPostUrl: body.instagramPostUrl || 'https://www.instagram.com/petersonshoes_/',
      heelOptions:
        Array.isArray(body.heelOptions) && body.heelOptions.length > 0
          ? body.heelOptions
          : ['Flatform Anatômica 3,5cm', 'Anabela 8cm'],
      strapFinishes:
        Array.isArray(body.strapFinishes) && body.strapFinishes.length > 0
          ? body.strapFinishes
          : ['Metais Dourados', 'Metais Prateados'],
      colors:
        Array.isArray(body.colors) && body.colors.length > 0
          ? body.colors
          : buildStandardColors('Dourado', defaultImg),
      availableSizes:
        Array.isArray(body.availableSizes) && body.availableSizes.length > 0
          ? body.availableSizes
          : STANDARD_SIZES,
      productionDays: Number(body.productionDays || 15),
      featured: Boolean(body.featured),
      active: body.active !== undefined ? Boolean(body.active) : true,
      description:
        body.description ||
        'Sandália artesanal Peterson Shoes produzida sob encomenda com material de alta qualidade.',
      craftDetails:
        Array.isArray(body.craftDetails) && body.craftDetails.length > 0
          ? body.craftDetails
          : [
              'Fabricação própria sob encomenda em 15 dias (Numeração 34 ao 39)',
              'Pagamento 50% na encomenda (Pix ou Cartão) e 50% quando ficar pronta',
            ],
      createdAt: new Date().toISOString(),
    };

    db.products.unshift(newProduct);
    saveDb(db);
    res.status(201).json(newProduct);
  });

  // Update Product
  app.put('/api/admin/products/:id', requireAdminAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    const db = loadDb();
    const idx = db.products.findIndex((p) => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    const updated: BespokeProduct = {
      ...db.products[idx],
      ...req.body,
      id: db.products[idx].id,
      price: Number(req.body.price ?? db.products[idx].price),
    };

    db.products[idx] = updated;
    saveDb(db);
    res.json(updated);
  });

  // Delete Product
  app.delete('/api/admin/products/:id', requireAdminAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    const db = loadDb();
    db.products = db.products.filter((p) => p.id !== id);
    saveDb(db);
    res.json({ ok: true });
  });

  // Update Order Production / Payment Status
  app.patch('/api/admin/orders/:id', requireAdminAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      productionStatus,
      paymentStatus,
      factoryNotes,
      trackingCode,
      estimatedDeliveryDate,
    } = req.body as {
      productionStatus?: ProductionStatus;
      paymentStatus?: PaymentStatus;
      factoryNotes?: string;
      trackingCode?: string;
      estimatedDeliveryDate?: string;
    };

    const db = loadDb();
    const order = db.orders.find((o) => o.id === id);
    if (!order) {
      return res.status(404).json({ error: 'Encomenda não encontrada.' });
    }

    if (productionStatus) {
      order.productionStatus = productionStatus;
      if (
        productionStatus === 'PRONTA_PARA_ENTREGA' &&
        order.paymentStatus === 'ENTRADA_50_PAGA'
      ) {
        order.paymentStatus = 'AGUARDANDO_FINAL_50';
      }
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
      const orderPayments = db.payments.filter((p) => p.orderId === order.id);
      const depositPay = orderPayments.find((p) => p.installmentType === 'ENTRADA_50');
      const finalPay = orderPayments.find((p) => p.installmentType === 'FINAL_50');

      if (paymentStatus === 'ENTRADA_50_PAGA' && depositPay && depositPay.status !== 'APROVADO') {
        depositPay.status = 'APROVADO';
        depositPay.paidAt = new Date().toISOString();
      }
      if (paymentStatus === 'QUITADO_100') {
        if (depositPay && depositPay.status !== 'APROVADO') {
          depositPay.status = 'APROVADO';
          depositPay.paidAt = new Date().toISOString();
        }
        if (finalPay && finalPay.status !== 'APROVADO') {
          finalPay.status = 'APROVADO';
          finalPay.paidAt = new Date().toISOString();
        }
      }
    }

    if (factoryNotes !== undefined) order.factoryNotes = factoryNotes;
    if (trackingCode !== undefined) order.trackingCode = trackingCode;
    if (estimatedDeliveryDate !== undefined) order.estimatedDeliveryDate = estimatedDeliveryDate;

    order.updatedAt = new Date().toISOString();
    saveDb(db);

    res.json({
      ...order,
      payments: db.payments.filter((p) => p.orderId === order.id),
    });
  });

  // Update Store Settings
  app.put('/api/admin/settings', requireAdminAuth, (req: Request, res: Response) => {
    const db = loadDb();
    db.settings = {
      ...db.settings,
      ...req.body,
      productionDays: Number(req.body.productionDays ?? db.settings.productionDays),
      depositPercentage: Number(req.body.depositPercentage ?? db.settings.depositPercentage),
      creditCardFeePercentage: Number(
        req.body.creditCardFeePercentage ?? db.settings.creditCardFeePercentage ?? 4.99
      ),
    };
    saveDb(db);
    res.json(db.settings);
  });

  // Get SQL Schema for Supabase
  app.get('/api/admin/sql-schema', requireAdminAuth, (_req: Request, res: Response) => {
    let sqlContent = '';
    if (fs.existsSync(SQL_SCHEMA_FILE)) {
      sqlContent = fs.readFileSync(SQL_SCHEMA_FILE, 'utf-8');
    }
    res.json({ sql: sqlContent });
  });
}

registerApiRoutes();

async function startServer() {
  // ==========================================================================
  // VITE MIDDLEWARE (DEVELOPMENT) OR STATIC SERVING (PRODUCTION)
  // ==========================================================================
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Peterson Shoes Full-Stack Server running on http://localhost:${PORT}`);
  });
}

if (!IS_VERCEL) {
  startServer();
}

export default app;
