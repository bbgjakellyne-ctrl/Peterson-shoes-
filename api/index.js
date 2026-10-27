// server.ts
import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import * as dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

// src/data/storeData.ts
var STANDARD_SIZES = [34, 35, 36, 37, 38, 39];
function buildStandardColors(defaultColorName, defaultImage, photoByColor = {}) {
  const basePalette = [
    { name: "Preto", hex: "#1B191A" },
    { name: "Branco", hex: "#F7F7F5" },
    { name: "Marsala", hex: "#631421" },
    { name: "Nude", hex: "#DFC1B4" },
    { name: "Dourado", hex: "#D4AF37" },
    { name: "Prata", hex: "#C4C9CE" },
    { name: "Vermelho", hex: "#B31B2C" },
    { name: "Rosa", hex: "#E07A9B" }
  ];
  const sortedPalette = [
    ...basePalette.filter((c) => c.name === defaultColorName),
    ...basePalette.filter((c) => c.name !== defaultColorName)
  ];
  const mapped = sortedPalette.map((c) => ({
    name: c.name,
    hex: c.hex,
    image: photoByColor[c.name] || defaultImage
  }));
  mapped.push({
    name: "Outra Cor",
    hex: "#8E7970",
    image: defaultImage,
    isCustom: true
  });
  return mapped;
}
var INITIAL_PRODUCTS = [
  // 1. POST 1 (C454LXbOzrn Slide 1) — Papete Flatform Pirâmides & Fivela (Dourada) — R$ 130,00
  {
    id: "prod-ig-01-papete-piramides",
    sku: "PTS-IG-01",
    name: "Papete Flatform Pir\xE2mides & Fivela (Dourada)",
    subtitle: "Bico Quadrado Anat\xF4mico com Pir\xE2mides Espelhadas & Pulseira no Tornozelo",
    category: "Flatforms & Papetes",
    price: 130,
    image: "/instagram/feed_1_C454LXbOzrn_slide_1.jpg",
    gallery: [
      "/instagram/feed_1_C454LXbOzrn_slide_1.jpg",
      "/instagram/feed_1_C454LXbOzrn_slide_2.jpg",
      "/instagram/feed_1_C454LXbOzrn_slide_3.jpg",
      "/instagram/feed_1_C454LXbOzrn_slide_4.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C454LXbOzrn/",
    heelOptions: ["Flatform Anat\xF4mica 3,5cm", "Flatform Conforto 2,5cm"],
    strapFinishes: [
      "Pir\xE2mides Douradas & Fivela Ouro",
      "Pir\xE2mides Cromadas & Fivela Prata"
    ],
    colors: buildStandardColors(
      "Dourado",
      "/instagram/feed_1_C454LXbOzrn_slide_1.jpg",
      {
        Dourado: "/instagram/feed_1_C454LXbOzrn_slide_1.jpg",
        Nude: "/instagram/feed_1_C454LXbOzrn_slide_2.jpg",
        Branco: "/instagram/feed_1_C454LXbOzrn_slide_2.jpg",
        Prata: "/instagram/feed_1_C454LXbOzrn_slide_3.jpg",
        Preto: "/instagram/feed_1_C454LXbOzrn_slide_4.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description: "Modelo oficial @petersonshoes_ de fabrica\xE7\xE3o pr\xF3pria em Goi\xE2nia - GO! Nossa Papete Flatform Pir\xE2mides combina palmilha anat\xF4mica macia de bico quadrado, tiras de dedo com aplica\xE7\xE3o de pir\xE2mides espelhadas e fivela regul\xE1vel no tornozelo.",
    craftDetails: [
      "Fabrica\xE7\xE3o pr\xF3pria @petersonshoes_ sob encomenda em at\xE9 15 dias (Numera\xE7\xE3o 34 ao 39)",
      "Dispon\xEDvel em Preto, Branco, Marsala, Nude, Dourado, Prata, Vermelho, Rosa ou Outra Cor \xE0 sua escolha",
      "Pagamento de 50% de entrada (Pix sem taxa ou Cart\xE3o c/ taxa do banco) e 50% quando ficar pronta"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 2. POST 8 Parte A (C4Tc5OnpB_L Slide 1) — Anabela Plataforma Pirâmides & Fivela (Preta) — R$ 150,00
  {
    id: "prod-ig-02-anabela-piramides-fivela",
    sku: "PTS-IG-02",
    name: "Anabela Plataforma Pir\xE2mides & Fivela (Preta)",
    subtitle: "Plataforma Alta Bico Quadrado com Tiras em Pir\xE2mides & Fechamento por Fivela",
    category: "Anabelas & Plataformas",
    price: 150,
    image: "/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg",
    gallery: [
      "/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_3.jpg",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C4Tc5OnpB_L/",
    heelOptions: ["Anabela Alta 9,5cm (Meia Pata 3,5cm)", "Anabela M\xE9dia 7,5cm"],
    strapFinishes: [
      "Pir\xE2mides Douradas & Fivela Ouro",
      "Pir\xE2mides Prata & Fivela Cromada"
    ],
    colors: buildStandardColors(
      "Preto",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg",
      {
        Preto: "/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg",
        Nude: "/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg",
        Rosa: "/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg",
        Prata: "/instagram/feed_8_C4Tc5OnpB_L_slide_3.jpg",
        Dourado: "/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg",
        Branco: "/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description: "Cl\xE1ssica e imponente! Nossa Anabela Plataforma de bico quadrado com tachas piramidais e tira de fivela no tornozelo \xE9 produzida sob encomenda na sua cor favorita e numera\xE7\xE3o do 34 ao 39.",
    craftDetails: [
      "Dispon\xEDvel em todas as cores padr\xE3o ou qualquer outra cor personalizada escrita por voc\xEA",
      "Meia pata frontal anat\xF4mica que proporciona estabilidade e leveza",
      "Confeccionada sob medida no seu n\xFAmero (34 ao 39 BR) em at\xE9 15 dias"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 3. POST 8 Parte B (C4Tc5OnpB_L Slide 6) — Anabela Plataforma Pirâmides Gladiadora (Dourada) — R$ 150,00
  {
    id: "prod-ig-03-anabela-piramides-amarracao",
    sku: "PTS-IG-03",
    name: "Anabela Plataforma Pir\xE2mides Gladiadora (Dourada)",
    subtitle: "Plataforma Alta Bico Quadrado com Pir\xE2mides & Amarra\xE7\xE3o Lace-Up na Perna",
    category: "Anabelas & Plataformas",
    price: 150,
    image: "/instagram/feed_8_C4Tc5OnpB_L_slide_6.jpg",
    gallery: [
      "/instagram/feed_8_C4Tc5OnpB_L_slide_6.jpg",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_8.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C4Tc5OnpB_L/",
    heelOptions: ["Anabela Alta 9,5cm (Meia Pata 3,5cm)", "Anabela M\xE9dia 7,5cm"],
    strapFinishes: [
      "Pir\xE2mides Douradas & Ponteiras Ouro",
      "Pir\xE2mides Prata & Ponteiras Prata"
    ],
    colors: buildStandardColors(
      "Dourado",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_6.jpg",
      {
        Dourado: "/instagram/feed_8_C4Tc5OnpB_L_slide_6.jpg",
        Nude: "/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg",
        Rosa: "/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg",
        Prata: "/instagram/feed_8_C4Tc5OnpB_L_slide_8.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description: "Vers\xE3o Gladiadora com amarra\xE7\xE3o na perna da nossa Anabela Plataforma @petersonshoes_! Tiras de dedo cravejadas em pir\xE2mides metalizadas e cord\xF5es macios que permitem diversas formas de amarra\xE7\xE3o no tornozelo.",
    craftDetails: [
      "Escolha entre Preto, Branco, Marsala, Nude, Dourado, Prata, Vermelho, Rosa ou Outra Cor",
      "Cord\xF5es macios de alta resist\xEAncia com ajuste perfeito na perna",
      "Produ\xE7\xE3o pr\xF3pria sob encomenda em 15 dias (50% no Pix ou Cart\xE3o de Cr\xE9dito)"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 4. POST 9 (C4Tc1qCpAdX Slide 1) — Papete Flatform Tratorada Strass & Amarração (Off-White) — R$ 130,00
  {
    id: "prod-ig-04-papete-tratorada-strass",
    sku: "PTS-IG-04",
    name: "Papete Flatform Tratorada Strass & Amarra\xE7\xE3o (Off-White)",
    subtitle: "Solado Tratorado Cravejado com Tiras Duplas de Strass & Amarra\xE7\xE3o N\xF3 Frontal",
    category: "Flatforms & Papetes",
    price: 130,
    image: "/instagram/feed_9_C4Tc1qCpAdX_slide_1.jpg",
    gallery: [
      "/instagram/feed_9_C4Tc1qCpAdX_slide_1.jpg",
      "/instagram/feed_9_C4Tc1qCpAdX_slide_2.jpg",
      "/instagram/feed_9_C4Tc1qCpAdX_slide_3.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C4Tc1qCpAdX/",
    heelOptions: ["Flatform Tratorada 4cm", "Flatform Anat\xF4mica 3cm"],
    strapFinishes: ["Strass Cristal & Vira Cravejada", "Strass Grafite Onix"],
    colors: buildStandardColors(
      "Branco",
      "/instagram/feed_9_C4Tc1qCpAdX_slide_1.jpg",
      {
        Branco: "/instagram/feed_9_C4Tc1qCpAdX_slide_1.jpg",
        Nude: "/instagram/feed_9_C4Tc1qCpAdX_slide_1.jpg",
        Preto: "/instagram/feed_9_C4Tc1qCpAdX_slide_2.jpg",
        Dourado: "/instagram/feed_9_C4Tc1qCpAdX_slide_3.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description: "Brilho intenso e design super moderno do Instagram @petersonshoes_! Papete Flatform com solado tratorado contornado por fileira de strass, duas tiras frontais cravejadas e amarra\xE7\xE3o com n\xF3 central sobre o peito do p\xE9.",
    craftDetails: [
      "Dispon\xEDvel em todas as cores padr\xE3o ou cor personalizada sob encomenda (34 ao 39 BR)",
      "Vira da palmilha inteiramente contornada em manta de strass",
      "Solado tratorado leve e antiderrapante feito sob encomenda"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 5. POST 5 (C4539VxO5om Slides 1 a 2) — Anabela Plataforma Trançada Esferas (Dourada) — R$ 150,00
  {
    id: "prod-ig-05-anabela-trancada-gold",
    sku: "PTS-IG-05",
    name: "Anabela Plataforma Tran\xE7ada Esferas (Dourada)",
    subtitle: "Salto Plataforma Revestido em Trama Artesanal com Esferas & Fivela",
    category: "Anabelas & Plataformas",
    price: 150,
    image: "/instagram/feed_5_C4539VxO5om_slide_1.jpg",
    gallery: [
      "/instagram/feed_5_C4539VxO5om_slide_1.jpg",
      "/instagram/feed_5_C4539VxO5om_slide_2.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C4539VxO5om/",
    heelOptions: ["Anabela Alta 9,5cm (Meia Pata 3,5cm)", "Anabela M\xE9dia 7,5cm"],
    strapFinishes: ["Esferas & Fivela Dourada", "Esferas & Fivela Prateada"],
    colors: buildStandardColors(
      "Dourado",
      "/instagram/feed_5_C4539VxO5om_slide_1.jpg",
      {
        Dourado: "/instagram/feed_5_C4539VxO5om_slide_1.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description: "Destaque absoluto do Instagram @petersonshoes_! Sand\xE1lia Anabela Plataforma inteiramente revestida em trama artesanal, com tira frontal de dedo adornada por esferas e tiras cruzadas no tornozelo.",
    craftDetails: [
      "Revestimento completo da plataforma em tran\xE7ado artesanal feito \xE0 m\xE3o",
      "Meia pata frontal que reduz a inclina\xE7\xE3o do p\xE9 e garante conforto prolongado",
      "Confeccionada sob encomenda (34 ao 39 BR) com 50% de entrada no Pix ou Cart\xE3o"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 6. POST 10 (C4Tcs31JPdl Slide 1) — Flatform Gladiadora Tiras Cruzadas Strass (Dourada) — R$ 130,00
  {
    id: "prod-ig-06-flatform-amarracao-strass",
    sku: "PTS-IG-06",
    name: "Flatform Gladiadora Tiras Cruzadas Strass (Dourada)",
    subtitle: "Flatform Anat\xF4mica com Vira de Strass, Tiras Finas Brilhantes & Amarra\xE7\xE3o Gladiadora",
    category: "Flatforms & Papetes",
    price: 130,
    image: "/instagram/feed_10_C4Tcs31JPdl_slide_1.jpg",
    gallery: [
      "/instagram/feed_10_C4Tcs31JPdl_slide_1.jpg",
      "/instagram/feed_10_C4Tcs31JPdl_slide_2.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C4Tcs31JPdl/",
    heelOptions: ["Flatform Anat\xF4mica 3,5cm", "Flatform Conforto 2,5cm"],
    strapFinishes: [
      "Strass Dourado & Vira Brilhante",
      "Strass Prata Cristal"
    ],
    colors: buildStandardColors(
      "Dourado",
      "/instagram/feed_10_C4Tcs31JPdl_slide_1.jpg",
      {
        Dourado: "/instagram/feed_10_C4Tcs31JPdl_slide_1.jpg",
        Branco: "/instagram/feed_10_C4Tcs31JPdl_slide_2.jpg",
        Prata: "/instagram/feed_10_C4Tcs31JPdl_slide_2.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description: "Delicadeza e sofistica\xE7\xE3o em cada detalhe! Nossa Flatform Gladiadora @petersonshoes_ possui tiras finas cruzadas recobertas por strass, borda da palmilha cravejada e amarra\xE7\xE3o ajust\xE1vel no tornozelo.",
    craftDetails: [
      "Produzida em Preto, Branco, Marsala, Nude, Dourado, Prata, Vermelho, Rosa ou Outra Cor",
      "Palmilha anat\xF4mica acolchoada com filete lateral de strass",
      "Fabrica\xE7\xE3o pr\xF3pria sob encomenda em at\xE9 15 dias (Numera\xE7\xE3o 34 ao 39)"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 7. POST 11 (C4TcpFaJ9ll Slide 1) — Papete Flatform Espelhada Tiras Strass (Prata) — R$ 130,00
  {
    id: "prod-ig-07-papete-metalizada-transpassada",
    sku: "PTS-IG-07",
    name: "Papete Flatform Espelhada Tiras Strass (Prata)",
    subtitle: "Acabamento Premium com Tiras Transpassadas em Strass & Fivela no Tornozelo",
    category: "Flatforms & Papetes",
    price: 130,
    image: "/instagram/feed_11_C4TcpFaJ9ll_slide_1.jpg",
    gallery: [
      "/instagram/feed_11_C4TcpFaJ9ll_slide_1.jpg",
      "/instagram/feed_11_C4TcpFaJ9ll_slide_2.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C4TcpFaJ9ll/",
    heelOptions: ["Flatform Espelhada 3,5cm", "Flatform Conforto 2,5cm"],
    strapFinishes: [
      "Strass Cristal & Fivela Prata",
      "Strass Champagne & Fivela Ouro"
    ],
    colors: buildStandardColors(
      "Prata",
      "/instagram/feed_11_C4TcpFaJ9ll_slide_1.jpg",
      {
        Prata: "/instagram/feed_11_C4TcpFaJ9ll_slide_1.jpg",
        Dourado: "/instagram/feed_11_C4TcpFaJ9ll_slide_2.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Para quem ama brilho com m\xE1ximo conforto! Papete Flatform @petersonshoes_ com tiras curvas cravejadas em strass e fechamento seguro por fivela no tornozelo.",
    craftDetails: [
      "Dispon\xEDvel em todas as cores padr\xE3o ou qualquer outra cor personalizada",
      "Bico quadrado anat\xF4mico que acomoda os dedos com perfei\xE7\xE3o (34 ao 39 BR)",
      "Encomenda confirmada com 50% de entrada via Pix ou Cart\xE3o de Cr\xE9dito"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 8. POST 7 (C4ayCqZteae) — Flatform Normal Tira de Dedo Strass Duo — R$ 110,00
  {
    id: "prod-ig-08-papete-dos-sonhos-strass",
    sku: "PTS-IG-08",
    name: "Flatform Tira de Dedo Strass Duo (Dourada & Prata)",
    subtitle: "Flatform Normal Bico Quadrado com Tiras de Dedo e Peito do P\xE9 Cravejadas em Strass",
    category: "Flatforms & Papetes",
    price: 110,
    image: "/instagram/feed_7_C4ayCqZteae_main.jpg",
    gallery: [
      "/instagram/feed_7_C4ayCqZteae_main.jpg",
      "/instagram/feed_11_C4TcpFaJ9ll_slide_2.jpg",
      "/instagram/feed_11_C4TcpFaJ9ll_slide_1.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C4ayCqZteae/",
    heelOptions: ["Flatform Anat\xF4mica 3cm", "Flatform Baixa 2cm"],
    strapFinishes: ["Manta de Strass Dourado", "Manta de Strass Prata Cristal"],
    colors: buildStandardColors(
      "Dourado",
      "/instagram/feed_7_C4ayCqZteae_main.jpg",
      {
        Dourado: "/instagram/feed_7_C4ayCqZteae_main.jpg",
        Prata: "/instagram/feed_7_C4ayCqZteae_main.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Publicada em nosso Instagram @petersonshoes_, nossa Flatform de Dedo Strass Duo combina calce pr\xE1tico estilo slide com anel de dedo e tr\xEAs tiras superiores inteiramente cravejadas em strass de alto brilho.",
    craftDetails: [
      "Flatform normal pr\xE1tica de cal\xE7ar e super leve para o dia a dia ou eventos",
      "Dispon\xEDvel nas cores padr\xE3o ou cor personalizada (Numera\xE7\xE3o 34 ao 39 BR)",
      "Produzida sob encomenda pela Peterson Shoes em at\xE9 15 dias"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 9. POST 12 (C4TcmhYpO8_) — Flatform Normal Slide Tira de Dedo Nó em Strass — R$ 110,00
  {
    id: "prod-ig-09-chinelo-flatform-no-strass",
    sku: "PTS-IG-09",
    name: "Flatform Slide Tira de Dedo N\xF3 em Strass",
    subtitle: "Flatform Normal Anat\xF4mica Macia com Tiras Revestidas em Manta de Strass e N\xF3",
    category: "Flatforms & Papetes",
    price: 110,
    image: "/instagram/feed_12_C4TcmhYpO8__main.jpg",
    gallery: ["/instagram/feed_12_C4TcmhYpO8__main.jpg"],
    instagramPostUrl: "https://www.instagram.com/p/C4TcmhYpO8_/",
    heelOptions: ["Solado Anat\xF4mico 3,5cm", "Solado Conforto 2,5cm"],
    strapFinishes: [
      "Manta de Strass Cristal c/ N\xF3 Central",
      "Manta de Strass Dourado"
    ],
    colors: buildStandardColors(
      "Nude",
      "/instagram/feed_12_C4TcmhYpO8__main.jpg",
      {
        Nude: "/instagram/feed_12_C4TcmhYpO8__main.jpg",
        Preto: "/instagram/feed_12_C4TcmhYpO8__main.jpg",
        Branco: "/instagram/feed_12_C4TcmhYpO8__main.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Conforto absoluto nos p\xE9s com o glamour da manta de strass! Nossa Flatform Normal Slide com n\xF3 central do Instagram @petersonshoes_ \xE9 confeccionada em todas as cores padr\xE3o ou sob encomenda na cor que voc\xEA desejar.",
    craftDetails: [
      "Palmilha anat\xF4mica tipo nuvem de alt\xEDssima maciez (34 ao 39 BR)",
      "Tiras revestidas em manta de strass com forro interno suave",
      "Ideal para varejo ou pedidos em atacado (a partir de 6 pares)"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 10. POST 2 (C454HJKO2oG) — Anabela Espadrille Branca Pirâmides Prateadas & Corda de Juta — R$ 150,00
  {
    id: "prod-ig-10-anabela-espadrille-branca",
    sku: "PTS-IG-10",
    name: "Anabela Espadrille Pir\xE2mides & Juta (Branca)",
    subtitle: "Anabela com Tachas Piramidais Espelhadas & Corda de Juta Natural",
    category: "Anabelas & Plataformas",
    price: 150,
    image: "/instagram/feed_2_C454HJKO2oG_main.jpg",
    gallery: ["/instagram/feed_2_C454HJKO2oG_main.jpg"],
    instagramPostUrl: "https://www.instagram.com/p/C454HJKO2oG/",
    heelOptions: ["Anabela 9cm com Meia Pata", "Anabela 7cm Conforto"],
    strapFinishes: ["Pir\xE2mides Prateadas Cromadas", "Pir\xE2mides Douradas"],
    colors: buildStandardColors(
      "Branco",
      "/instagram/feed_2_C454HJKO2oG_main.jpg",
      {
        Branco: "/instagram/feed_2_C454HJKO2oG_main.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Modelo oficial @petersonshoes_ pensado para produ\xE7\xF5es sofisticadas! Sand\xE1lia Anabela estruturada em napa macia, com tira frontal e tornozeleira cravejadas de pir\xE2mides e vira contornada em corda de juta.",
    craftDetails: [
      "Tira frontal e pulseira do tornozelo com aplica\xE7\xE3o firme de pir\xE2mides espelhadas",
      "Base contornada em juta natural tran\xE7ada e tachas met\xE1licas",
      "Feita sob medida no seu n\xFAmero (34 ao 39 BR) em at\xE9 15 dias"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 11. POST 4 (C454A4GujcN Slides 1 a 2) — Rasteira Gladiadora Strass Cristal — R$ 110,00
  {
    id: "prod-ig-11-rasteira-gladiadora-strass",
    sku: "PTS-IG-11",
    name: "Rasteira Gladiadora Strass Cristal (Prata)",
    subtitle: "Tiras Duplas em Manta de Strass & Amarra\xE7\xE3o Gladiadora Delicada na Perna",
    category: "Rasteiras & Gladiadoras",
    price: 110,
    image: "/instagram/feed_4_C454A4GujcN_slide_1.jpg",
    gallery: [
      "/instagram/feed_4_C454A4GujcN_slide_1.jpg",
      "/instagram/feed_4_C454A4GujcN_slide_2.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C454A4GujcN/",
    heelOptions: ["Rasteira Plana Conforto 1,2cm", "Salto Baixo 2cm"],
    strapFinishes: ["Strass Cristal Prata", "Strass Dourado Champagne"],
    colors: buildStandardColors(
      "Prata",
      "/instagram/feed_4_C454A4GujcN_slide_1.jpg",
      {
        Prata: "/instagram/feed_4_C454A4GujcN_slide_1.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description: 'Sucesso absoluto no Instagram @petersonshoes_ ("Quando amamos o que fazemos")! Rasteira Gladiadora com duas tiras frontais revestidas em manta de strass cristal de alto brilho e cord\xF5es macios para amarra\xE7\xE3o.',
    craftDetails: [
      "Manta de strass cristal com fixa\xE7\xE3o refor\xE7ada e forro interno macio",
      "Dispon\xEDvel em Preto, Branco, Marsala, Nude, Dourado, Prata, Vermelho, Rosa ou Outra Cor",
      "Fabrica\xE7\xE3o pr\xF3pria sob encomenda em at\xE9 15 dias (34 ao 39 BR)"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 12. POST 6 (C45360nuL6q Slides 1 a 2) — Anabela Tamanco Plataforma Trançado Nó — R$ 150,00
  {
    id: "prod-ig-12-tamanco-plataforma-no",
    sku: "PTS-IG-12",
    name: "Anabela Tamanco Plataforma Tran\xE7ado c/ N\xF3 (Off-White)",
    subtitle: "Anabela Plataforma Alta Revestida em Trama Artesanal & Tira Larga com N\xF3 Central",
    category: "Anabelas & Plataformas",
    price: 150,
    image: "/instagram/feed_6_C45360nuL6q_slide_1.jpg",
    gallery: [
      "/instagram/feed_6_C45360nuL6q_slide_1.jpg",
      "/instagram/feed_6_C45360nuL6q_slide_2.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C45360nuL6q/",
    heelOptions: ["Anabela Plataforma Alta 8,5cm", "Anabela Plataforma M\xE9dia 6,5cm"],
    strapFinishes: ["Napa Macia Sem Metais", "Detalhe Dourado na Palmilha"],
    colors: buildStandardColors(
      "Branco",
      "/instagram/feed_6_C45360nuL6q_slide_1.jpg",
      {
        Branco: "/instagram/feed_6_C45360nuL6q_slide_1.jpg",
        Nude: "/instagram/feed_6_C45360nuL6q_slide_2.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Conforto, leveza e altura em um modelo tend\xEAncia do nosso Instagram @petersonshoes_! Anabela Tamanco Plataforma com base inteiramente revestida em trama tran\xE7ada e g\xE1spea em napa ultra macia com n\xF3 frontal anat\xF4mico.",
    craftDetails: [
      "Plataforma super leve com estabilidade total ao caminhar (34 ao 39 BR)",
      "Tira larga forrada em espuma macia para zero atrito nos dedos",
      "Produzido sob encomenda com 50% de entrada via Pix ou Cart\xE3o de Cr\xE9dito"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 13. POST 3 (C454E0zuuFv Slide 1) — Outras Rasteiras: Rasteira Esferas & Medalhão Metalizada (Dourada) — R$ 100,00
  {
    id: "prod-ig-13-rasteira-medalhao-esferas",
    sku: "PTS-IG-13",
    name: "Rasteira Esferas & Medalh\xE3o Metalizada (Dourada)",
    subtitle: "Rasteira de Dedo com Tachas Esf\xE9ricas & Tira Dupla no Tornozelo",
    category: "Rasteiras & Gladiadoras",
    price: 100,
    image: "/instagram/feed_3_C454E0zuuFv_slide_1.jpg",
    gallery: [
      "/instagram/feed_3_C454E0zuuFv_slide_1.jpg",
      "/instagram/feed_3_C454E0zuuFv_slide_2.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C454E0zuuFv/",
    heelOptions: ["Rasteira Conforto 1,5cm", "Salto Baixo 2,5cm"],
    strapFinishes: [
      "Esferas & Medalh\xF5es Dourados",
      "Esferas & Medalh\xF5es Prateados"
    ],
    colors: buildStandardColors(
      "Dourado",
      "/instagram/feed_3_C454E0zuuFv_slide_1.jpg",
      {
        Dourado: "/instagram/feed_3_C454E0zuuFv_slide_1.jpg",
        Prata: "/instagram/feed_3_C454E0zuuFv_slide_2.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Escolha a sua favorita do nosso Instagram @petersonshoes_! Rasteira de dedo confeccionada com aplica\xE7\xE3o cont\xEDnua de esferas e medalh\xF5es trabalhados e tira dupla que valoriza o tornozelo.",
    craftDetails: [
      "Dispon\xEDvel em todas as cores padr\xE3o ou outra cor personalizada escrita por voc\xEA",
      "Aplica\xE7\xE3o de esferas e medalh\xF5es com rebites internos protegidos",
      "Bico levemente quadrado moderno com palmilha macia (34 ao 39 BR)"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 14. POST 1 Slide 4 — Papete Flatform Pirâmides Black & Gold (Preta) — R$ 130,00
  {
    id: "prod-ig-14-papete-piramides-preta",
    sku: "PTS-IG-14",
    name: "Papete Flatform Pir\xE2mides Black & Gold (Preta)",
    subtitle: "Edi\xE7\xE3o Preta com Pir\xE2mides Douradas Espelhadas & Solado Anat\xF4mico",
    category: "Flatforms & Papetes",
    price: 130,
    image: "/instagram/feed_1_C454LXbOzrn_slide_4.jpg",
    gallery: [
      "/instagram/feed_1_C454LXbOzrn_slide_4.jpg",
      "/instagram/feed_1_C454LXbOzrn_slide_1.jpg",
      "/instagram/feed_1_C454LXbOzrn_slide_2.jpg",
      "/instagram/feed_1_C454LXbOzrn_slide_3.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C454LXbOzrn/",
    heelOptions: ["Flatform Anat\xF4mica 3,5cm", "Flatform Conforto 2,5cm"],
    strapFinishes: [
      "Pir\xE2mides Douradas & Fivela Dourada",
      "Pir\xE2mides Prata & Fivela Prata"
    ],
    colors: buildStandardColors(
      "Preto",
      "/instagram/feed_1_C454LXbOzrn_slide_4.jpg",
      {
        Preto: "/instagram/feed_1_C454LXbOzrn_slide_4.jpg",
        Dourado: "/instagram/feed_1_C454LXbOzrn_slide_1.jpg",
        Nude: "/instagram/feed_1_C454LXbOzrn_slide_2.jpg",
        Branco: "/instagram/feed_1_C454LXbOzrn_slide_2.jpg",
        Prata: "/instagram/feed_1_C454LXbOzrn_slide_3.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Contraste marcante entre o preto intenso e o brilho das pir\xE2mides douradas! Esta vers\xE3o da nossa Papete Flatform @petersonshoes_ traz palmilha anat\xF4mica contornada, tira de dedo com n\xF3 frontal e pulseira regul\xE1vel.",
    craftDetails: [
      "Dispon\xEDvel em Preto, Branco, Marsala, Nude, Dourado, Prata, Vermelho, Rosa ou Outra Cor",
      "Metais piramidais dourados com banho resistente \xE0 oxida\xE7\xE3o",
      "Feita sob encomenda em at\xE9 15 dias (Numera\xE7\xE3o 34 ao 39 BR)"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 15. POST 8 Slide 2 — Anabela Plataforma Pirâmides & Fivela (Nude Rosé) — R$ 150,00
  {
    id: "prod-ig-15-anabela-piramides-nude",
    sku: "PTS-IG-15",
    name: "Anabela Plataforma Pir\xE2mides & Fivela (Nude Ros\xE9)",
    subtitle: "Edi\xE7\xE3o Nude Aveludada com Tachas Piramidais Douradas & Bico Quadrado",
    category: "Anabelas & Plataformas",
    price: 150,
    image: "/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg",
    gallery: [
      "/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C4Tc5OnpB_L/",
    heelOptions: ["Anabela Alta 9,5cm (Meia Pata 3,5cm)", "Anabela M\xE9dia 7,5cm"],
    strapFinishes: [
      "Fivela no Tornozelo (Foto 1)",
      "Amarra\xE7\xE3o Gladiadora (Foto 2)"
    ],
    colors: buildStandardColors(
      "Nude",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg",
      {
        Nude: "/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg",
        Rosa: "/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg",
        Dourado: "/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg",
        Branco: "/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg",
        Preto: "/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg",
        Prata: "/instagram/feed_8_C4Tc5OnpB_L_slide_3.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Eleg\xE2ncia suave que alonga a silhueta! Nossa Anabela Plataforma Pir\xE2mides pode ser encomendada tanto na vers\xE3o com Fivela cl\xE1ssica no tornozelo quanto na vers\xE3o Gladiadora de Amarra\xE7\xE3o, do 34 ao 39.",
    craftDetails: [
      "Escolha entre fechamento com Fivela ou Amarra\xE7\xE3o Gladiadora",
      "Dispon\xEDvel em todas as cores padr\xE3o ou qualquer outra cor personalizada",
      "Pagamento facilitado: 50% de entrada (Pix ou Cart\xE3o c/ taxa) e 50% na conclus\xE3o"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 16. POST 1 Slide 2 — Papete Flatform Pirâmides & Fivela (Off-White / Nude) — R$ 130,00
  {
    id: "prod-ig-16-papete-piramides-nude",
    sku: "PTS-IG-16",
    name: "Papete Flatform Pir\xE2mides & Fivela (Off-White / Nude)",
    subtitle: "Palmilha Anat\xF4mica Off-White com Pir\xE2mides Douradas & Fivela Ajust\xE1vel",
    category: "Flatforms & Papetes",
    price: 130,
    image: "/instagram/feed_1_C454LXbOzrn_slide_2.jpg",
    gallery: [
      "/instagram/feed_1_C454LXbOzrn_slide_2.jpg",
      "/instagram/feed_1_C454LXbOzrn_slide_1.jpg",
      "/instagram/feed_1_C454LXbOzrn_slide_3.jpg",
      "/instagram/feed_1_C454LXbOzrn_slide_4.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C454LXbOzrn/",
    heelOptions: ["Flatform Anat\xF4mica 3,5cm", "Flatform Conforto 2,5cm"],
    strapFinishes: [
      "Pir\xE2mides Douradas & Fivela Ouro",
      "Pir\xE2mides Prata & Fivela Prata"
    ],
    colors: buildStandardColors(
      "Nude",
      "/instagram/feed_1_C454LXbOzrn_slide_2.jpg",
      {
        Nude: "/instagram/feed_1_C454LXbOzrn_slide_2.jpg",
        Branco: "/instagram/feed_1_C454LXbOzrn_slide_2.jpg",
        Dourado: "/instagram/feed_1_C454LXbOzrn_slide_1.jpg",
        Prata: "/instagram/feed_1_C454LXbOzrn_slide_3.jpg",
        Preto: "/instagram/feed_1_C454LXbOzrn_slide_4.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Vers\xE3o Off-White / Nude super vers\xE1til do nosso Instagram @petersonshoes_! Combina com todos os looks e traz palmilha macia de bico quadrado com tachas piramidais.",
    craftDetails: [
      "Fabrica\xE7\xE3o pr\xF3pria em Goi\xE2nia - GO sob encomenda (34 ao 39 BR)",
      "Dispon\xEDvel nas 8 cores padr\xE3o ou na cor personalizada que voc\xEA escrever",
      "Entrada de 50% (R$ 65,00 no Pix sem taxa) + 50% quando ficar pronta"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 17. POST 1 Slide 3 — Papete Flatform Pirâmides & Fivela (Prata Metalizada) — R$ 130,00
  {
    id: "prod-ig-17-papete-piramides-prata",
    sku: "PTS-IG-17",
    name: "Papete Flatform Pir\xE2mides & Fivela (Prata)",
    subtitle: "Acabamento Metalizado Prata com Pir\xE2mides Espelhadas & Pulseira no Tornozelo",
    category: "Flatforms & Papetes",
    price: 130,
    image: "/instagram/feed_1_C454LXbOzrn_slide_3.jpg",
    gallery: [
      "/instagram/feed_1_C454LXbOzrn_slide_3.jpg",
      "/instagram/feed_1_C454LXbOzrn_slide_1.jpg",
      "/instagram/feed_1_C454LXbOzrn_slide_2.jpg",
      "/instagram/feed_1_C454LXbOzrn_slide_4.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C454LXbOzrn/",
    heelOptions: ["Flatform Anat\xF4mica 3,5cm", "Flatform Conforto 2,5cm"],
    strapFinishes: [
      "Pir\xE2mides Cromadas & Fivela Prata",
      "Pir\xE2mides Douradas & Fivela Ouro"
    ],
    colors: buildStandardColors(
      "Prata",
      "/instagram/feed_1_C454LXbOzrn_slide_3.jpg",
      {
        Prata: "/instagram/feed_1_C454LXbOzrn_slide_3.jpg",
        Dourado: "/instagram/feed_1_C454LXbOzrn_slide_1.jpg",
        Nude: "/instagram/feed_1_C454LXbOzrn_slide_2.jpg",
        Preto: "/instagram/feed_1_C454LXbOzrn_slide_4.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Edi\xE7\xE3o Prata Metalizada da nossa Papete Flatform Pir\xE2mides @petersonshoes_! Moderna, confort\xE1vel e feita sob medida na sua numera\xE7\xE3o.",
    craftDetails: [
      "Confeccionada sob encomenda do 34 ao 39 BR em at\xE9 15 dias",
      "Escolha Prata ou qualquer uma das cores padr\xE3o / cor personalizada",
      "Entrada de 50% (R$ 65,00 no Pix) + 50% na conclus\xE3o"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 18. POST 3 Slide 2 — Outras Rasteiras: Rasteira Esferas & Medalhão Metalizada (Prata) — R$ 100,00
  {
    id: "prod-ig-18-rasteira-medalhao-prata",
    sku: "PTS-IG-18",
    name: "Rasteira Esferas & Medalh\xE3o Metalizada (Prata)",
    subtitle: "Rasteira de Dedo Prateada com Esferas Cromadas & Tira Dupla no Tornozelo",
    category: "Rasteiras & Gladiadoras",
    price: 100,
    image: "/instagram/feed_3_C454E0zuuFv_slide_2.jpg",
    gallery: [
      "/instagram/feed_3_C454E0zuuFv_slide_2.jpg",
      "/instagram/feed_3_C454E0zuuFv_slide_1.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C454E0zuuFv/",
    heelOptions: ["Rasteira Conforto 1,5cm", "Salto Baixo 2,5cm"],
    strapFinishes: [
      "Esferas & Medalh\xF5es Prateados",
      "Esferas & Medalh\xF5es Dourados"
    ],
    colors: buildStandardColors(
      "Prata",
      "/instagram/feed_3_C454E0zuuFv_slide_2.jpg",
      {
        Prata: "/instagram/feed_3_C454E0zuuFv_slide_2.jpg",
        Dourado: "/instagram/feed_3_C454E0zuuFv_slide_1.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Vers\xE3o Prata Metalizada da nossa Rasteira Esferas & Medalh\xE3o @petersonshoes_! Leve, fresca e elegante para todas as ocasi\xF5es.",
    craftDetails: [
      "Fabrica\xE7\xE3o pr\xF3pria sob encomenda em Goi\xE2nia - GO (Numera\xE7\xE3o 34 ao 39)",
      "Dispon\xEDvel em todas as cores padr\xE3o ou outra cor personalizada",
      "Valor R$ 100,00 \xB7 Entrada de 50% (R$ 50,00 no Pix) + 50% quando ficar pronta"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 19. POST 8 Slide 3 — Anabela Plataforma Pirâmides & Fivela (Prata Champagne) — R$ 150,00
  {
    id: "prod-ig-19-anabela-piramides-prata",
    sku: "PTS-IG-19",
    name: "Anabela Plataforma Pir\xE2mides & Fivela (Prata Champagne)",
    subtitle: "Plataforma Alta Metalizada com Tachas Piramidais & Fivela no Tornozelo",
    category: "Anabelas & Plataformas",
    price: 150,
    image: "/instagram/feed_8_C4Tc5OnpB_L_slide_3.jpg",
    gallery: [
      "/instagram/feed_8_C4Tc5OnpB_L_slide_3.jpg",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C4Tc5OnpB_L/",
    heelOptions: ["Anabela Alta 9,5cm (Meia Pata 3,5cm)", "Anabela M\xE9dia 7,5cm"],
    strapFinishes: [
      "Pir\xE2mides Douradas & Fivela Ouro",
      "Pir\xE2mides Prata & Fivela Cromada"
    ],
    colors: buildStandardColors(
      "Prata",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_3.jpg",
      {
        Prata: "/instagram/feed_8_C4Tc5OnpB_L_slide_3.jpg",
        Preto: "/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg",
        Nude: "/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg",
        Dourado: "/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg",
        Branco: "/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Brilho sofisticado para festas e eventos! Anabela Plataforma Pir\xE2mides @petersonshoes_ na edi\xE7\xE3o Prata Champagne, confeccionada sob encomenda do 34 ao 39.",
    craftDetails: [
      "Meia pata anat\xF4mica que garante conforto mesmo em salto alto",
      "Dispon\xEDvel em todas as cores padr\xE3o ou cor personalizada",
      "Entrada de 50% (R$ 75,00 no Pix) + 50% quando sua Anabela estiver pronta"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 20. POST 8 Slide 4 — Anabela Plataforma Pirâmides & Fivela (Dourada) — R$ 150,00
  {
    id: "prod-ig-20-anabela-piramides-dourada",
    sku: "PTS-IG-20",
    name: "Anabela Plataforma Pir\xE2mides & Fivela (Dourada)",
    subtitle: "Edi\xE7\xE3o Ouro Metalizado com Pir\xE2mides Douradas & Pulseira de Fivela",
    category: "Anabelas & Plataformas",
    price: 150,
    image: "/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg",
    gallery: [
      "/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C4Tc5OnpB_L/",
    heelOptions: ["Anabela Alta 9,5cm (Meia Pata 3,5cm)", "Anabela M\xE9dia 7,5cm"],
    strapFinishes: [
      "Pir\xE2mides Douradas & Fivela Ouro",
      "Pir\xE2mides Prata & Fivela Cromada"
    ],
    colors: buildStandardColors(
      "Dourado",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg",
      {
        Dourado: "/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg",
        Preto: "/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg",
        Nude: "/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg",
        Prata: "/instagram/feed_8_C4Tc5OnpB_L_slide_3.jpg",
        Branco: "/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Uma das campe\xE3s de pedidos no Instagram @petersonshoes_! Anabela Plataforma inteiramente dourada com pir\xE2mides espelhadas e fechamento por fivela no tornozelo.",
    craftDetails: [
      "Confeccionada sob encomenda na numera\xE7\xE3o 34 ao 39 BR",
      "Dispon\xEDvel em Dourado ou qualquer outra cor escolhida por voc\xEA",
      "Valor R$ 150,00 \xB7 Entrada de 50% (R$ 75,00) + 50% na conclus\xE3o"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 21. POST 8 Slide 5 — Anabela Plataforma Pirâmides & Fivela (Branca) — R$ 150,00
  {
    id: "prod-ig-21-anabela-piramides-branca",
    sku: "PTS-IG-21",
    name: "Anabela Plataforma Pir\xE2mides & Fivela (Branca)",
    subtitle: "Edi\xE7\xE3o Branca com Tachas Piramidais Douradas & Bico Quadrado Moderno",
    category: "Anabelas & Plataformas",
    price: 150,
    image: "/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg",
    gallery: [
      "/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C4Tc5OnpB_L/",
    heelOptions: ["Anabela Alta 9,5cm (Meia Pata 3,5cm)", "Anabela M\xE9dia 7,5cm"],
    strapFinishes: [
      "Pir\xE2mides Douradas & Fivela Ouro",
      "Pir\xE2mides Prata & Fivela Cromada"
    ],
    colors: buildStandardColors(
      "Branco",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg",
      {
        Branco: "/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg",
        Preto: "/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg",
        Nude: "/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg",
        Prata: "/instagram/feed_8_C4Tc5OnpB_L_slide_3.jpg",
        Dourado: "/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Destaque especial do carrossel @petersonshoes_! A Anabela Plataforma Branca com pir\xE2mides douradas valoriza produ\xE7\xF5es diurnas e noturnas com m\xE1ximo conforto.",
    craftDetails: [
      "Fabrica\xE7\xE3o pr\xF3pria em Goi\xE2nia - GO sob encomenda (34 ao 39 BR)",
      "8 cores padr\xE3o + op\xE7\xE3o Outra Cor personalizada",
      "Entrada de 50% (R$ 75,00 no Pix) + 50% somente quando estiver pronta"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 22. POST 8 Slide 7 — Anabela Plataforma Pirâmides Gladiadora (Nude Rosé) — R$ 150,00
  {
    id: "prod-ig-22-anabela-gladiadora-nude",
    sku: "PTS-IG-22",
    name: "Anabela Plataforma Pir\xE2mides Gladiadora (Nude Ros\xE9)",
    subtitle: "Anabela Bico Quadrado Nude Ros\xE9 com Pir\xE2mides Douradas & Amarra\xE7\xE3o na Perna",
    category: "Anabelas & Plataformas",
    price: 150,
    image: "/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg",
    gallery: [
      "/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_6.jpg",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_8.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C4Tc5OnpB_L/",
    heelOptions: ["Anabela Alta 9,5cm (Meia Pata 3,5cm)", "Anabela M\xE9dia 7,5cm"],
    strapFinishes: [
      "Pir\xE2mides Douradas & Ponteiras Ouro",
      "Pir\xE2mides Prata & Ponteiras Prata"
    ],
    colors: buildStandardColors(
      "Nude",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg",
      {
        Nude: "/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg",
        Rosa: "/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg",
        Dourado: "/instagram/feed_8_C4Tc5OnpB_L_slide_6.jpg",
        Prata: "/instagram/feed_8_C4Tc5OnpB_L_slide_8.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Delicada e imponente! Anabela Plataforma Pir\xE2mides Gladiadora na cor Nude Ros\xE9 com amarra\xE7\xE3o lace-up macia no tornozelo.",
    craftDetails: [
      "Produzida sob encomenda na numera\xE7\xE3o 34 ao 39 BR em at\xE9 15 dias",
      "Dispon\xEDvel em Nude, Rosa, Dourado, Prata, Preto, Branco, Marsala, Vermelho ou Outra Cor",
      "Valor R$ 150,00 \xB7 Entrada de 50% (R$ 75,00) + 50% na entrega"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 23. POST 8 Slide 8 — Anabela Plataforma Pirâmides Gladiadora (Prata) — R$ 150,00
  {
    id: "prod-ig-23-anabela-gladiadora-prata",
    sku: "PTS-IG-23",
    name: "Anabela Plataforma Pir\xE2mides Gladiadora (Prata)",
    subtitle: "Anabela Metalizada Prata com Tachas Piramidais & Amarra\xE7\xE3o Gladiadora",
    category: "Anabelas & Plataformas",
    price: 150,
    image: "/instagram/feed_8_C4Tc5OnpB_L_slide_8.jpg",
    gallery: [
      "/instagram/feed_8_C4Tc5OnpB_L_slide_8.jpg",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_6.jpg",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C4Tc5OnpB_L/",
    heelOptions: ["Anabela Alta 9,5cm (Meia Pata 3,5cm)", "Anabela M\xE9dia 7,5cm"],
    strapFinishes: [
      "Pir\xE2mides Prata & Ponteiras Prata",
      "Pir\xE2mides Douradas & Ponteiras Ouro"
    ],
    colors: buildStandardColors(
      "Prata",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_8.jpg",
      {
        Prata: "/instagram/feed_8_C4Tc5OnpB_L_slide_8.jpg",
        Dourado: "/instagram/feed_8_C4Tc5OnpB_L_slide_6.jpg",
        Nude: "/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Edi\xE7\xE3o Prata Metalizada da nossa Anabela Plataforma Gladiadora @petersonshoes_! Perfeita para quem busca altura com estabilidade e brilho.",
    craftDetails: [
      "Meia pata frontal confort\xE1vel e amarra\xE7\xE3o ajust\xE1vel",
      "Confeccionada sob encomenda do 34 ao 39 BR em Goi\xE2nia - GO",
      "Entrada de 50% (R$ 75,00 no Pix) + 50% quando ficar pronta"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 24. POST 9 Slide 2 — Papete Flatform Tratorada Strass & Amarração (Preta Onix) — R$ 130,00
  {
    id: "prod-ig-24-papete-tratorada-preta",
    sku: "PTS-IG-24",
    name: "Papete Flatform Tratorada Strass & Amarra\xE7\xE3o (Preta)",
    subtitle: "Solado Tratorado Preto com Vira de Strass Cristal & Amarra\xE7\xE3o N\xF3 Central",
    category: "Flatforms & Papetes",
    price: 130,
    image: "/instagram/feed_9_C4Tc1qCpAdX_slide_2.jpg",
    gallery: [
      "/instagram/feed_9_C4Tc1qCpAdX_slide_2.jpg",
      "/instagram/feed_9_C4Tc1qCpAdX_slide_1.jpg",
      "/instagram/feed_9_C4Tc1qCpAdX_slide_3.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C4Tc1qCpAdX/",
    heelOptions: ["Flatform Tratorada 4cm", "Flatform Anat\xF4mica 3cm"],
    strapFinishes: ["Strass Cristal & Vira Cravejada", "Strass Grafite Onix"],
    colors: buildStandardColors(
      "Preto",
      "/instagram/feed_9_C4Tc1qCpAdX_slide_2.jpg",
      {
        Preto: "/instagram/feed_9_C4Tc1qCpAdX_slide_2.jpg",
        Branco: "/instagram/feed_9_C4Tc1qCpAdX_slide_1.jpg",
        Dourado: "/instagram/feed_9_C4Tc1qCpAdX_slide_3.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Destaque em preto com strass cristal do nosso Instagram @petersonshoes_! Papete Flatform Tratorada com amarra\xE7\xE3o que abra\xE7a o p\xE9 com firmeza e maciez.",
    craftDetails: [
      "Solado tratorado contornado por filete de strass brilhante",
      "Dispon\xEDvel do 34 ao 39 BR em todas as cores padr\xE3o ou cor personalizada",
      "Valor R$ 130,00 \xB7 Entrada de 50% (R$ 65,00 no Pix) + 50% quando ficar pronta"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 25. POST 9 Slide 3 — Papete Flatform Tratorada Strass & Amarração (Dourada) — R$ 130,00
  {
    id: "prod-ig-25-papete-tratorada-dourada",
    sku: "PTS-IG-25",
    name: "Papete Flatform Tratorada Strass & Amarra\xE7\xE3o (Dourada)",
    subtitle: "Edi\xE7\xE3o Dourada Metalizada com Tiras Duplas de Strass & Solado Tratorado",
    category: "Flatforms & Papetes",
    price: 130,
    image: "/instagram/feed_9_C4Tc1qCpAdX_slide_3.jpg",
    gallery: [
      "/instagram/feed_9_C4Tc1qCpAdX_slide_3.jpg",
      "/instagram/feed_9_C4Tc1qCpAdX_slide_1.jpg",
      "/instagram/feed_9_C4Tc1qCpAdX_slide_2.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C4Tc1qCpAdX/",
    heelOptions: ["Flatform Tratorada 4cm", "Flatform Anat\xF4mica 3cm"],
    strapFinishes: ["Strass Dourado & Vira Cravejada", "Strass Cristal"],
    colors: buildStandardColors(
      "Dourado",
      "/instagram/feed_9_C4Tc1qCpAdX_slide_3.jpg",
      {
        Dourado: "/instagram/feed_9_C4Tc1qCpAdX_slide_3.jpg",
        Branco: "/instagram/feed_9_C4Tc1qCpAdX_slide_1.jpg",
        Preto: "/instagram/feed_9_C4Tc1qCpAdX_slide_2.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Vers\xE3o Dourada da Papete Tratorada Strass @petersonshoes_! Confeccionada sob encomenda na numera\xE7\xE3o 34 ao 39 em nossa f\xE1brica pr\xF3pria em Goi\xE2nia - GO.",
    craftDetails: [
      "Tiras frontais em manta de strass com amarra\xE7\xE3o ajust\xE1vel",
      "Dispon\xEDvel nas 8 cores padr\xE3o ou na cor personalizada que voc\xEA digitar",
      "Entrada de 50% (R$ 65,00 no Pix) + 50% somente na conclus\xE3o"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 26. POST 10 Slide 2 — Flatform Gladiadora Tiras Cruzadas Strass (Branca & Prata) — R$ 130,00
  {
    id: "prod-ig-26-flatform-gladiadora-branca",
    sku: "PTS-IG-26",
    name: "Flatform Gladiadora Tiras Cruzadas Strass (Branca & Prata)",
    subtitle: "Flatform Gladiadora Branca com Tiras Finas em Strass Cristal & Vira Cravejada",
    category: "Flatforms & Papetes",
    price: 130,
    image: "/instagram/feed_10_C4Tcs31JPdl_slide_2.jpg",
    gallery: [
      "/instagram/feed_10_C4Tcs31JPdl_slide_2.jpg",
      "/instagram/feed_10_C4Tcs31JPdl_slide_1.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C4Tcs31JPdl/",
    heelOptions: ["Flatform Anat\xF4mica 3,5cm", "Flatform Conforto 2,5cm"],
    strapFinishes: [
      "Strass Prata Cristal & Vira Brilhante",
      "Strass Dourado"
    ],
    colors: buildStandardColors(
      "Branco",
      "/instagram/feed_10_C4Tcs31JPdl_slide_2.jpg",
      {
        Branco: "/instagram/feed_10_C4Tcs31JPdl_slide_2.jpg",
        Prata: "/instagram/feed_10_C4Tcs31JPdl_slide_2.jpg",
        Dourado: "/instagram/feed_10_C4Tcs31JPdl_slide_1.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Edi\xE7\xE3o Branca & Prata Cristal da nossa Flatform Gladiadora Tiras Cruzadas @petersonshoes_! Delicada, iluminada e super confort\xE1vel.",
    craftDetails: [
      "Fabrica\xE7\xE3o pr\xF3pria sob encomenda em at\xE9 15 dias (34 ao 39 BR)",
      "Escolha Branco, Prata, Dourado ou qualquer outra cor personalizada",
      "Valor R$ 130,00 \xB7 Entrada de 50% (R$ 65,00 no Pix) + 50% quando ficar pronta"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 27. POST 11 Slide 2 — Papete Flatform Espelhada Tiras Strass (Dourado Champagne) — R$ 130,00
  {
    id: "prod-ig-27-papete-espelhada-dourada",
    sku: "PTS-IG-27",
    name: "Papete Flatform Espelhada Tiras Strass (Dourado Champagne)",
    subtitle: "Palmilha Espelhada Champagne com Tiras Transpassadas em Strass & Fivela",
    category: "Flatforms & Papetes",
    price: 130,
    image: "/instagram/feed_11_C4TcpFaJ9ll_slide_2.jpg",
    gallery: [
      "/instagram/feed_11_C4TcpFaJ9ll_slide_2.jpg",
      "/instagram/feed_11_C4TcpFaJ9ll_slide_1.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C4TcpFaJ9ll/",
    heelOptions: ["Flatform Espelhada 3,5cm", "Flatform Conforto 2,5cm"],
    strapFinishes: [
      "Strass Champagne & Fivela Ouro",
      "Strass Cristal & Fivela Prata"
    ],
    colors: buildStandardColors(
      "Dourado",
      "/instagram/feed_11_C4TcpFaJ9ll_slide_2.jpg",
      {
        Dourado: "/instagram/feed_11_C4TcpFaJ9ll_slide_2.jpg",
        Prata: "/instagram/feed_11_C4TcpFaJ9ll_slide_1.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Edi\xE7\xE3o Dourado Champagne da Papete Flatform Espelhada @petersonshoes_! Tiras sinuosas cravejadas de strass sobre o peito do p\xE9 e fivela delicada no tornozelo.",
    craftDetails: [
      "Produzida sob medida na numera\xE7\xE3o 34 ao 39 BR em Goi\xE2nia - GO",
      "Dispon\xEDvel em todas as cores padr\xE3o ou outra cor personalizada",
      "Entrada de 50% (R$ 65,00 no Pix) + 50% somente quando estiver pronta"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 28. POST 14 (C4TcgZrplaC) — Papete Flatform Tira Transversal Pirâmides & Fivela — R$ 130,00
  {
    id: "prod-ig-28-papete-transversal-piramides",
    sku: "PTS-IG-28",
    name: "Papete Flatform Tira Transversal Pir\xE2mides & Fivela (Dourada & Prata)",
    subtitle: "Bico Quadrado Anat\xF4mico com Tira Diagonal Cravejada de Pir\xE2mides & Fivela no Tornozelo",
    category: "Flatforms & Papetes",
    price: 130,
    image: "/instagram/feed_14_C4TcgZrplaC_slide_1.jpg",
    gallery: [
      "/instagram/feed_14_C4TcgZrplaC_slide_1.jpg",
      "/instagram/feed_14_C4TcgZrplaC_slide_2.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C4TcgZrplaC/",
    heelOptions: ["Flatform Anat\xF4mica 3,5cm", "Flatform Conforto 2,5cm"],
    strapFinishes: [
      "Pir\xE2mides Douradas & Fivela Ouro",
      "Pir\xE2mides Prata & Fivela Cromada"
    ],
    colors: buildStandardColors(
      "Dourado",
      "/instagram/feed_14_C4TcgZrplaC_slide_1.jpg",
      {
        Dourado: "/instagram/feed_14_C4TcgZrplaC_slide_1.jpg",
        Prata: "/instagram/feed_14_C4TcgZrplaC_slide_2.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description: "Um dos modelos mais pedidos do Instagram @petersonshoes_! Papete Flatform com tira transversal e pulseira inteiramente aplicadas com pir\xE2mides metalizadas, garantindo firmeza e muito destaque.",
    craftDetails: [
      "Confeccionada sob encomenda na numera\xE7\xE3o 34 ao 39 BR em at\xE9 15 dias",
      "Dispon\xEDvel em Dourado, Prata, Preto, Branco, Marsala, Nude, Vermelho, Rosa ou Outra Cor",
      "Valor R$ 130,00 \xB7 Entrada de 50% (R$ 65,00 no Pix) + 50% quando ficar pronta"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 29. POST 15 (C4TceEBpcL2) — Outras Rasteiras: Rasteira Bico Quadrado Tira de Dedo Nó em Strass — R$ 100,00
  {
    id: "prod-ig-29-rasteira-no-strass-bico-quadrado",
    sku: "PTS-IG-29",
    name: "Rasteira Bico Quadrado Tira de Dedo N\xF3 em Strass",
    subtitle: "Rasteira Elegante de Bico Quadrado com Tiras em Manta de Strass & N\xF3 Central",
    category: "Rasteiras & Gladiadoras",
    price: 100,
    image: "/instagram/feed_15_C4TceEBpcL2_main.jpg",
    gallery: ["/instagram/feed_15_C4TceEBpcL2_main.jpg"],
    instagramPostUrl: "https://www.instagram.com/p/C4TceEBpcL2/",
    heelOptions: ["Rasteira Conforto 1,5cm", "Salto Baixo 2,5cm"],
    strapFinishes: [
      "Manta de Strass Cristal Brilhante",
      "Manta de Strass Dourado Champagne"
    ],
    colors: buildStandardColors(
      "Preto",
      "/instagram/feed_15_C4TceEBpcL2_main.jpg",
      {
        Preto: "/instagram/feed_15_C4TceEBpcL2_main.jpg",
        Dourado: "/instagram/feed_15_C4TceEBpcL2_main.jpg",
        Nude: "/instagram/feed_15_C4TceEBpcL2_main.jpg",
        Prata: "/instagram/feed_15_C4TceEBpcL2_main.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description: "Cl\xE1ssica, leve e super brilhante! Rasteira de bico quadrado do nosso perfil @petersonshoes_ com tiras de dedo unidas por n\xF3 central cravejado de strass.",
    craftDetails: [
      "Produzida sob medida na numera\xE7\xE3o 34 ao 39 BR em nossa f\xE1brica em Goi\xE2nia - GO",
      "Dispon\xEDvel em Preto, Dourado, Nude, Branco, Marsala, Prata, Vermelho, Rosa ou Outra Cor",
      "Valor R$ 100,00 \xB7 Entrada de 50% (R$ 50,00 no Pix) + 50% na conclus\xE3o"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 30. POST 16 (C4TccS0J14Z) & POST 44 (C12GJ6QORi4) — Outras Rasteiras: Rasteira Laço Duplo Strass — R$ 100,00
  {
    id: "prod-ig-30-rasteira-laco-duplo-strass",
    sku: "PTS-IG-30",
    name: "Rasteira Bico Quadrado La\xE7o Duplo Cravejado em Strass",
    subtitle: "Modelo Tend\xEAncia com Dois La\xE7os Estruturados em Strass Cristal & Bico Quadrado",
    category: "Rasteiras & Gladiadoras",
    price: 100,
    image: "/instagram/feed_44_C12GJ6QORi4_slide_1.jpg",
    gallery: [
      "/instagram/feed_44_C12GJ6QORi4_slide_1.jpg",
      "/instagram/feed_16_C4TccS0J14Z_slide_1.jpg",
      "/instagram/feed_16_C4TccS0J14Z_slide_2.jpg",
      "/instagram/feed_16_C4TccS0J14Z_slide_3.jpg",
      "/instagram/feed_44_C12GJ6QORi4_slide_2.jpg",
      "/instagram/feed_44_C12GJ6QORi4_slide_4.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C4TccS0J14Z/",
    heelOptions: ["Rasteira Conforto 1,5cm", "Salto Baixo 2,5cm"],
    strapFinishes: [
      "La\xE7o Duplo em Manta de Strass Cristal",
      "La\xE7o Duplo em Strass Dourado"
    ],
    colors: buildStandardColors(
      "Dourado",
      "/instagram/feed_44_C12GJ6QORi4_slide_1.jpg",
      {
        Dourado: "/instagram/feed_44_C12GJ6QORi4_slide_1.jpg",
        Branco: "/instagram/feed_16_C4TccS0J14Z_slide_3.jpg",
        Rosa: "/instagram/feed_16_C4TccS0J14Z_slide_1.jpg",
        Preto: "/instagram/feed_16_C4TccS0J14Z_slide_1.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description: "Campe\xE3 de olhares no perfil @petersonshoes_! Rasteira de bico quadrado com dois la\xE7os frontais inteiramente revestidos em strass de alto brilho. Sofisticada, feminina e ultra confort\xE1vel.",
    craftDetails: [
      "La\xE7os duplos estruturados manualmente com manta de strass premium",
      "Numera\xE7\xE3o 34 ao 39 BR em todas as cores padr\xE3o ou cor personalizada",
      "Valor R$ 100,00 \xB7 Entrada de 50% (R$ 50,00 no Pix) + 50% quando ficar pronta"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 31. POST 17 (C4TcYo9pYsy) — Outras Rasteiras: Rasteira Tira Transversal Strass & Fivela — R$ 100,00
  {
    id: "prod-ig-31-rasteira-transversal-strass-fivela",
    sku: "PTS-IG-31",
    name: "Rasteira Bico Quadrado Tira Transversal Strass & Fivela",
    subtitle: "Tira Diagonal em Manta de Strass, Anel de Dedo & Fechamento por Fivela no Tornozelo",
    category: "Rasteiras & Gladiadoras",
    price: 100,
    image: "/instagram/feed_17_C4TcYo9pYsy_main.jpg",
    gallery: ["/instagram/feed_17_C4TcYo9pYsy_main.jpg"],
    instagramPostUrl: "https://www.instagram.com/p/C4TcYo9pYsy/",
    heelOptions: ["Rasteira Conforto 1,5cm", "Salto Baixo 2,5cm"],
    strapFinishes: [
      "Strass Cristal & Fivela Metalizada",
      "Strass Dourado & Fivela Ouro"
    ],
    colors: buildStandardColors(
      "Dourado",
      "/instagram/feed_17_C4TcYo9pYsy_main.jpg",
      {
        Dourado: "/instagram/feed_17_C4TcYo9pYsy_main.jpg",
        Branco: "/instagram/feed_17_C4TcYo9pYsy_main.jpg",
        Prata: "/instagram/feed_17_C4TcYo9pYsy_main.jpg",
        Preto: "/instagram/feed_17_C4TcYo9pYsy_main.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Delicadeza e seguran\xE7a ao caminhar! Modelo oficial @petersonshoes_ com tira transversal brilhante no peito do p\xE9 e pulseira com fivela ajust\xE1vel no tornozelo.",
    craftDetails: [
      "Fabrica\xE7\xE3o pr\xF3pria em Goi\xE2nia - GO sob encomenda (Numera\xE7\xE3o 34 ao 39 BR)",
      "Dispon\xEDvel em Dourado, Branco, Prata, Preto, Marsala, Nude, Vermelho, Rosa ou Outra Cor",
      "Valor R$ 100,00 \xB7 Entrada de 50% (R$ 50,00 no Pix) + 50% na entrega"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 32. POST 18 (C4TcU91p2E8) & POST 20 (C4TcQjaJejN) — Rasteira Gladiadora Multitiras Nó de Strass — R$ 110,00
  {
    id: "prod-ig-32-rasteira-gladiadora-no-strass",
    sku: "PTS-IG-32",
    name: "Rasteira Gladiadora Multitiras N\xF3 de Strass & Amarra\xE7\xE3o",
    subtitle: "Rasteira Gladiadora Bico Quadrado com Tiras Cravejadas, N\xF3 Frontal & Amarra\xE7\xE3o na Perna",
    category: "Rasteiras & Gladiadoras",
    price: 110,
    image: "/instagram/feed_20_C4TcQjaJejN_main.jpg",
    gallery: [
      "/instagram/feed_20_C4TcQjaJejN_main.jpg",
      "/instagram/feed_18_C4TcU91p2E8_main.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C4TcQjaJejN/",
    heelOptions: ["Rasteira Conforto 1,5cm", "Salto Baixo 2,5cm"],
    strapFinishes: [
      "Strass Cristal & Amarra\xE7\xE3o Macia",
      "Strass Dourado & Amarra\xE7\xE3o Macia"
    ],
    colors: buildStandardColors(
      "Rosa",
      "/instagram/feed_20_C4TcQjaJejN_main.jpg",
      {
        Rosa: "/instagram/feed_20_C4TcQjaJejN_main.jpg",
        Preto: "/instagram/feed_20_C4TcQjaJejN_main.jpg",
        Branco: "/instagram/feed_18_C4TcU91p2E8_main.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description: "Moderna e super estilosa! Nossa Rasteira Gladiadora com n\xF3 de strass e amarra\xE7\xE3o lace-up no tornozelo (@petersonshoes_) valoriza qualquer produ\xE7\xE3o e pode ser feita na sua cor favorita.",
    craftDetails: [
      "Tiras finas confort\xE1veis com aplica\xE7\xE3o de strass e cord\xF5es macios para amarra\xE7\xE3o",
      "Numera\xE7\xE3o 34 ao 39 BR \xB7 Escolha entre as cores padr\xE3o ou digite Outra Cor",
      "Valor R$ 110,00 \xB7 Entrada de 50% (R$ 55,00 no Pix) + 50% quando ficar pronta"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 33. POST 19 (C4TcSseJ1vr) — Outras Rasteiras: Rasteira Bico Quadrado Tiras Cruzadas X em Pedraria — R$ 100,00
  {
    id: "prod-ig-33-rasteira-tiras-x-pedraria",
    sku: "PTS-IG-33",
    name: "Rasteira Bico Quadrado Tiras Cruzadas X em Pedraria",
    subtitle: "Slide Rasteira com Tiras Largas Cruzadas em X Revestidas de Pedraria e Strass",
    category: "Rasteiras & Gladiadoras",
    price: 100,
    image: "/instagram/feed_19_C4TcSseJ1vr_main.jpg",
    gallery: ["/instagram/feed_19_C4TcSseJ1vr_main.jpg"],
    instagramPostUrl: "https://www.instagram.com/p/C4TcSseJ1vr/",
    heelOptions: ["Rasteira Conforto 1,5cm", "Salto Baixo 2,5cm"],
    strapFinishes: [
      "Pedraria & Strass no Tom da Sand\xE1lia",
      "Pedraria Cristal Prateada"
    ],
    colors: buildStandardColors(
      "Dourado",
      "/instagram/feed_19_C4TcSseJ1vr_main.jpg",
      {
        Dourado: "/instagram/feed_19_C4TcSseJ1vr_main.jpg",
        Preto: "/instagram/feed_19_C4TcSseJ1vr_main.jpg",
        Prata: "/instagram/feed_19_C4TcSseJ1vr_main.jpg",
        Nude: "/instagram/feed_19_C4TcSseJ1vr_main.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Calce f\xE1cil e acabamento de joia nos p\xE9s! Rasteira de tiras cruzadas em X cravejadas em pedraria e strass, confeccionada sob encomenda pela Peterson Shoes em Goi\xE2nia - GO.",
    craftDetails: [
      "Tiras largas cruzadas com forro interno acolchoado que abra\xE7a o peito do p\xE9",
      "Numera\xE7\xE3o 34 ao 39 BR em todas as cores padr\xE3o ou cor personalizada",
      "Valor R$ 100,00 \xB7 Entrada de 50% (R$ 50,00 no Pix) + 50% na conclus\xE3o"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 34. POST 22 (C4TcJj9Ju9I) — Flatform Normal: Flatform 3 Tiras Finas Assimétricas em Strass — R$ 110,00
  {
    id: "prod-ig-34-flatform-3-tiras-strass",
    sku: "PTS-IG-34",
    name: "Flatform 3 Tiras Finas Assim\xE9tricas em Strass (Branca & Preta)",
    subtitle: "Flatform Normal Slide com Tr\xEAs Tiras Delicadas em Strass & Vira Brilhante",
    category: "Flatforms & Papetes",
    price: 110,
    image: "/instagram/feed_22_C4TcJj9Ju9I_slide_1.jpg",
    gallery: [
      "/instagram/feed_22_C4TcJj9Ju9I_slide_1.jpg",
      "/instagram/feed_22_C4TcJj9Ju9I_slide_4.jpg",
      "/instagram/feed_22_C4TcJj9Ju9I_slide_2.jpg",
      "/instagram/feed_22_C4TcJj9Ju9I_slide_3.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C4TcJj9Ju9I/",
    heelOptions: ["Flatform Anat\xF4mica 3,5cm", "Flatform Conforto 2,5cm"],
    strapFinishes: [
      "Strass Cristal & Vira Cravejada",
      "Strass Onix / Dourado"
    ],
    colors: buildStandardColors(
      "Branco",
      "/instagram/feed_22_C4TcJj9Ju9I_slide_1.jpg",
      {
        Branco: "/instagram/feed_22_C4TcJj9Ju9I_slide_1.jpg",
        Preto: "/instagram/feed_22_C4TcJj9Ju9I_slide_4.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description: "Minimalista, iluminada e super confort\xE1vel! Nossa Flatform Normal de 3 tiras finas em strass (@petersonshoes_) combina praticidade de calce com vira contornada por brilho.",
    craftDetails: [
      "Solado flatform macio com filete de strass em toda a borda (34 ao 39 BR)",
      "Dispon\xEDvel em Branco, Preto, Marsala, Nude, Dourado, Prata, Vermelho, Rosa ou Outra Cor",
      "Valor R$ 110,00 \xB7 Entrada de 50% (R$ 55,00 no Pix) + 50% quando ficar pronta"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 35. POST 23 (C4TcFzJJLNA) — Flatform Normal: Flatform Tiras Entrelaçadas & Nó Pedraria Espelhada — R$ 110,00
  {
    id: "prod-ig-35-flatform-no-pedraria-espelhada",
    sku: "PTS-IG-35",
    name: "Flatform Tiras Entrela\xE7adas & N\xF3 Pedraria Espelhada",
    subtitle: "Flatform Normal com Palmilha Metalizada, Vira de Strass & N\xF3 Frontal Cravejado",
    category: "Flatforms & Papetes",
    price: 110,
    image: "/instagram/feed_23_C4TcFzJJLNA_slide_1.jpg",
    gallery: [
      "/instagram/feed_23_C4TcFzJJLNA_slide_1.jpg",
      "/instagram/feed_23_C4TcFzJJLNA_slide_2.jpg",
      "/instagram/feed_23_C4TcFzJJLNA_slide_3.jpg",
      "/instagram/feed_23_C4TcFzJJLNA_slide_4.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C4TcFzJJLNA/",
    heelOptions: ["Flatform Espelhada 3,5cm", "Flatform Conforto 2,5cm"],
    strapFinishes: [
      "Pedraria Cristal & Vira de Strass",
      "Pedraria Dourada & Vira de Strass"
    ],
    colors: buildStandardColors(
      "Dourado",
      "/instagram/feed_23_C4TcFzJJLNA_slide_2.jpg",
      {
        Dourado: "/instagram/feed_23_C4TcFzJJLNA_slide_2.jpg",
        Nude: "/instagram/feed_23_C4TcFzJJLNA_slide_3.jpg",
        Preto: "/instagram/feed_23_C4TcFzJJLNA_slide_4.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description: "Sucesso absoluto no feed @petersonshoes_! Flatform Normal com tiras duplas cravejadas unidas por n\xF3 frontal e palmilha com acabamento espelhado de luxo.",
    craftDetails: [
      "Confeccionada sob encomenda na numera\xE7\xE3o 34 ao 39 BR em Goi\xE2nia - GO",
      "Escolha Dourado, Nude, Preto ou qualquer outra cor personalizada",
      "Valor R$ 110,00 \xB7 Entrada de 50% (R$ 55,00 no Pix) + 50% na conclus\xE3o"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 36. POST 24 (C4TcBT1pobH) — Flatform Normal: Flatform Tiras Cruzadas Duplas em Manta de Strass — R$ 110,00
  {
    id: "prod-ig-36-flatform-tiras-cruzadas-duplas",
    sku: "PTS-IG-36",
    name: "Flatform Tiras Cruzadas Duplas em Manta de Strass",
    subtitle: "Flatform Normal Anat\xF4mica com Duplo X em Manta de Strass & Vira Brilhante",
    category: "Flatforms & Papetes",
    price: 110,
    image: "/instagram/feed_24_C4TcBT1pobH_slide_1.jpg",
    gallery: [
      "/instagram/feed_24_C4TcBT1pobH_slide_1.jpg",
      "/instagram/feed_24_C4TcBT1pobH_slide_2.jpg",
      "/instagram/feed_24_C4TcBT1pobH_slide_3.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C4TcBT1pobH/",
    heelOptions: ["Flatform Anat\xF4mica 3,5cm", "Flatform Conforto 2,5cm"],
    strapFinishes: [
      "Manta de Strass Cristal & Vira Cravejada",
      "Manta de Strass Dourado"
    ],
    colors: buildStandardColors(
      "Nude",
      "/instagram/feed_24_C4TcBT1pobH_slide_1.jpg",
      {
        Nude: "/instagram/feed_24_C4TcBT1pobH_slide_1.jpg",
        Branco: "/instagram/feed_24_C4TcBT1pobH_slide_2.jpg",
        Preto: "/instagram/feed_24_C4TcBT1pobH_slide_1.jpg",
        Dourado: "/instagram/feed_24_C4TcBT1pobH_slide_1.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Design que abra\xE7a o p\xE9 com muito brilho e maciez! Flatform Normal com tiras cruzadas duplas em manta de strass do nosso Instagram @petersonshoes_.",
    craftDetails: [
      "Palmilha macia e vira lateral contornada em strass (34 ao 39 BR)",
      "Dispon\xEDvel em Nude, Branco, Preto, Dourado, Marsala, Prata, Vermelho, Rosa ou Outra Cor",
      "Valor R$ 110,00 \xB7 Entrada de 50% (R$ 55,00 no Pix) + 50% quando ficar pronta"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 37. POST 26 (C4Tb7oxJ70j) — Flatform Normal: Flatform Slide de Dedo Nó Central Strass Metalizada — R$ 110,00
  {
    id: "prod-ig-37-flatform-slide-no-dourada",
    sku: "PTS-IG-37",
    name: "Flatform Slide de Dedo N\xF3 Central Strass Metalizada (Dourada)",
    subtitle: "Flatform Normal Metalizada com Tiras em Strass Unido por N\xF3 Central & Vira Cravejada",
    category: "Flatforms & Papetes",
    price: 110,
    image: "/instagram/feed_26_C4Tb7oxJ70j_slide_1.jpg",
    gallery: [
      "/instagram/feed_26_C4Tb7oxJ70j_slide_1.jpg",
      "/instagram/feed_26_C4Tb7oxJ70j_slide_2.jpg",
      "/instagram/feed_26_C4Tb7oxJ70j_slide_3.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C4Tb7oxJ70j/",
    heelOptions: ["Flatform Metalizada 3,5cm", "Flatform Conforto 2,5cm"],
    strapFinishes: [
      "Strass Dourado & Vira Cravejada",
      "Strass Prata Cristal & Vira Cravejada"
    ],
    colors: buildStandardColors(
      "Dourado",
      "/instagram/feed_26_C4Tb7oxJ70j_slide_1.jpg",
      {
        Dourado: "/instagram/feed_26_C4Tb7oxJ70j_slide_1.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Praticidade e glamour para todos os momentos! Nossa Flatform Normal Slide com n\xF3 central em strass (@petersonshoes_) \xE9 confeccionada sob encomenda do 34 ao 39.",
    craftDetails: [
      "Acabamento metalizado espelhado e filete de strass ao redor da sola",
      "Numera\xE7\xE3o 34 ao 39 BR em todas as cores padr\xE3o ou cor personalizada",
      "Valor R$ 110,00 \xB7 Entrada de 50% (R$ 55,00 no Pix) + 50% na conclus\xE3o"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 38. POST 28 (C12HMIqOt-1) — Papete Flatform Anel de Dedo & Tiras Cruzadas Strass c/ Fivela — R$ 130,00
  {
    id: "prod-ig-38-papete-anel-dedo-strass-fivela",
    sku: "PTS-IG-38",
    name: "Papete Flatform Anel de Dedo & Tiras Strass c/ Fivela (Dourada)",
    subtitle: "Papete Metalizada com Anel de Dedo Cravejado, Tira Transversal em Strass & Fivela",
    category: "Flatforms & Papetes",
    price: 130,
    image: "/instagram/feed_28_C12HMIqOt-1_main.jpg",
    gallery: ["/instagram/feed_28_C12HMIqOt-1_main.jpg"],
    instagramPostUrl: "https://www.instagram.com/p/C12HMIqOt-1/",
    heelOptions: ["Flatform Espelhada 3,5cm", "Flatform Conforto 2,5cm"],
    strapFinishes: [
      "Strass Dourado & Fivela no Tornozelo",
      "Strass Prata & Fivela no Tornozelo"
    ],
    colors: buildStandardColors(
      "Dourado",
      "/instagram/feed_28_C12HMIqOt-1_main.jpg",
      {
        Dourado: "/instagram/feed_28_C12HMIqOt-1_main.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Design anat\xF4mico que prende o p\xE9 com delicadeza e brilho! Papete Flatform @petersonshoes_ com anel de dedo cravejado, tiras de strass e pulseira com fivela no tornozelo.",
    craftDetails: [
      "Produzida sob medida na numera\xE7\xE3o 34 ao 39 BR em nossa f\xE1brica em Goi\xE2nia - GO",
      "Dispon\xEDvel nas 8 cores padr\xE3o ou na cor personalizada que voc\xEA escrever",
      "Valor R$ 130,00 \xB7 Entrada de 50% (R$ 65,00 no Pix) + 50% quando ficar pronta"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 39. POST 29 (C12HDhQO1dO) — Papete Flatform Vira de Strass & Duas Tiras Brilhantes c/ Fivela — R$ 130,00
  {
    id: "prod-ig-39-papete-duas-tiras-strass-fivela",
    sku: "PTS-IG-39",
    name: "Papete Flatform Vira de Strass & Duas Tiras c/ Fivela (Branca)",
    subtitle: "Papete Branca com Duas Tiras Frontais em Strass, Vira Cravejada & Fivela Traseira",
    category: "Flatforms & Papetes",
    price: 130,
    image: "/instagram/feed_29_C12HDhQO1dO_slide_1.jpg",
    gallery: [
      "/instagram/feed_29_C12HDhQO1dO_slide_1.jpg",
      "/instagram/feed_29_C12HDhQO1dO_slide_2.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C12HDhQO1dO/",
    heelOptions: ["Flatform Anat\xF4mica 3,5cm", "Flatform Conforto 2,5cm"],
    strapFinishes: [
      "Strass Cristal & Fivela Regul\xE1vel",
      "Strass Dourado & Fivela Ouro"
    ],
    colors: buildStandardColors(
      "Branco",
      "/instagram/feed_29_C12HDhQO1dO_slide_1.jpg",
      {
        Branco: "/instagram/feed_29_C12HDhQO1dO_slide_1.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Delicada, rom\xE2ntica e super est\xE1vel nos p\xE9s! Papete Flatform @petersonshoes_ com duas tiras paralelas de strass na frente, contorno brilhante na vira e fechamento por fivela.",
    craftDetails: [
      "Confeccionada sob encomenda na numera\xE7\xE3o 34 ao 39 BR em at\xE9 15 dias",
      "Escolha Branco, Preto, Nude, Dourado, Prata, Marsala, Vermelho, Rosa ou Outra Cor",
      "Valor R$ 130,00 \xB7 Entrada de 50% (R$ 65,00 no Pix) + 50% na conclus\xE3o"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 40. POST 30 (C12HAGoOeUg) — Flatform Gladiadora Multitiras Strass & Amarração Lace-Up — R$ 130,00
  {
    id: "prod-ig-40-flatform-gladiadora-multitiras",
    sku: "PTS-IG-40",
    name: "Flatform Gladiadora Multitiras Strass & Amarra\xE7\xE3o (Preta & Branca)",
    subtitle: "Flatform Gladiadora com Tiras Finas Brilhantes, Vira de Strass & Amarra\xE7\xE3o na Perna",
    category: "Flatforms & Papetes",
    price: 130,
    image: "/instagram/feed_30_C12HAGoOeUg_slide_1.jpg",
    gallery: [
      "/instagram/feed_30_C12HAGoOeUg_slide_1.jpg",
      "/instagram/feed_30_C12HAGoOeUg_slide_2.jpg",
      "/instagram/feed_30_C12HAGoOeUg_slide_3.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C12HAGoOeUg/",
    heelOptions: ["Flatform Anat\xF4mica 3,5cm", "Flatform Conforto 2,5cm"],
    strapFinishes: [
      "Strass Cristal & Amarra\xE7\xE3o Gladiadora",
      "Strass Dourado & Amarra\xE7\xE3o Gladiadora"
    ],
    colors: buildStandardColors(
      "Preto",
      "/instagram/feed_30_C12HAGoOeUg_slide_1.jpg",
      {
        Preto: "/instagram/feed_30_C12HAGoOeUg_slide_1.jpg",
        Branco: "/instagram/feed_30_C12HAGoOeUg_slide_2.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description: "Visual marcante direto da nossa f\xE1brica em Goi\xE2nia - GO! Flatform Gladiadora @petersonshoes_ com multitiras de strass e amarra\xE7\xE3o ajust\xE1vel no tornozelo.",
    craftDetails: [
      "Vira contornada em strass e palmilha macia (Numera\xE7\xE3o 34 ao 39 BR)",
      "Dispon\xEDvel em Preto, Branco, Dourado, Prata, Nude, Marsala, Vermelho, Rosa ou Outra Cor",
      "Valor R$ 130,00 \xB7 Entrada de 50% (R$ 65,00 no Pix) + 50% quando ficar pronta"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 41. POST 49 (CzWpulBOVR3) — Flatform Normal: Flatform Metalizada 3 Tiras Tubulares Strass — R$ 110,00
  {
    id: "prod-ig-41-flatform-3-tiras-tubulares-dourada",
    sku: "PTS-IG-41",
    name: "Flatform Metalizada 3 Tiras Tubulares em Strass (Dourada)",
    subtitle: "Flatform Normal Slide com Tr\xEAs Tiras Tubulares Cravejadas & Solado Tratorado c/ Strass",
    category: "Flatforms & Papetes",
    price: 110,
    image: "/instagram/feed_49_CzWpulBOVR3_main.jpg",
    gallery: ["/instagram/feed_49_CzWpulBOVR3_main.jpg"],
    instagramPostUrl: "https://www.instagram.com/p/CzWpulBOVR3/",
    heelOptions: ["Flatform Tratorada 3,5cm", "Flatform Anat\xF4mica 2,5cm"],
    strapFinishes: [
      "3 Tiras Tubulares Strass Champagne",
      "3 Tiras Tubulares Strass Cristal"
    ],
    colors: buildStandardColors(
      "Dourado",
      "/instagram/feed_49_CzWpulBOVR3_main.jpg",
      {
        Dourado: "/instagram/feed_49_CzWpulBOVR3_main.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Brilho triplo e conforto de nuvem! Nossa Flatform Normal com 3 tiras tubulares de strass (@petersonshoes_) \xE9 perfeita para quem ama praticidade sem abrir m\xE3o da sofistica\xE7\xE3o.",
    craftDetails: [
      "Confeccionada sob encomenda na numera\xE7\xE3o 34 ao 39 BR em at\xE9 15 dias",
      "Dispon\xEDvel em todas as cores padr\xE3o ou cor personalizada",
      "Valor R$ 110,00 \xB7 Entrada de 50% (R$ 55,00 no Pix) + 50% na conclus\xE3o"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 42. POST 51 (CzWpluLO3Lx — Post mais curtido do perfil!) — Flatform Normal Tiras Cruzadas Pedraria Cristal — R$ 110,00
  {
    id: "prod-ig-42-flatform-pedraria-cristal-espelhada",
    sku: "PTS-IG-42",
    name: "Flatform Tiras Cruzadas Pedraria Cristal Espelhada",
    subtitle: "Recordista de Curtidas @petersonshoes_ \xB7 Flatform Normal com Pedraria Lapidada & Vira de Strass",
    category: "Flatforms & Papetes",
    price: 110,
    image: "/instagram/feed_51_CzWpluLO3Lx_slide_1.jpg",
    gallery: [
      "/instagram/feed_51_CzWpluLO3Lx_slide_1.jpg",
      "/instagram/feed_51_CzWpluLO3Lx_slide_2.jpg",
      "/instagram/feed_51_CzWpluLO3Lx_slide_3.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/CzWpluLO3Lx/",
    heelOptions: ["Flatform Espelhada 3,5cm", "Flatform Conforto 2,5cm"],
    strapFinishes: [
      "Pedraria Lapidada Cristal & Vira de Strass",
      "Pedraria Dourada & Vira de Strass"
    ],
    colors: buildStandardColors(
      "Branco",
      "/instagram/feed_51_CzWpluLO3Lx_slide_1.jpg",
      {
        Branco: "/instagram/feed_51_CzWpluLO3Lx_slide_1.jpg",
        Dourado: "/instagram/feed_51_CzWpluLO3Lx_slide_2.jpg",
        Prata: "/instagram/feed_51_CzWpluLO3Lx_slide_3.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description: "O modelo mais curtido do Instagram @petersonshoes_! Flatform Normal com tiras cruzadas ricamente trabalhadas em pedraria cristal lapidada e vira espelhada com strass.",
    craftDetails: [
      "Sucesso absoluto de vendas no varejo e atacado (Numera\xE7\xE3o 34 ao 39 BR)",
      "Dispon\xEDvel em Branco, Dourado, Prata, Preto, Nude, Marsala, Vermelho, Rosa ou Outra Cor",
      "Valor R$ 110,00 \xB7 Entrada de 50% (R$ 55,00 no Pix) + 50% quando ficar pronta"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 43. POST 54 (CzJ_ceLJwx6) — Outras Rasteiras: Rasteira Bico Quadrado Tiras Entrelaçadas em Strass — R$ 100,00
  {
    id: "prod-ig-43-rasteira-tiras-entrelacadas-dourada",
    sku: "PTS-IG-43",
    name: "Rasteira Bico Quadrado Tiras Entrela\xE7adas em Strass (Dourada)",
    subtitle: "Rasteira Metalizada de Bico Quadrado com Tiras Finas Entrela\xE7adas em Strass",
    category: "Rasteiras & Gladiadoras",
    price: 100,
    image: "/instagram/feed_54_CzJ_ceLJwx6_slide_1.jpg",
    gallery: [
      "/instagram/feed_54_CzJ_ceLJwx6_slide_1.jpg",
      "/instagram/feed_54_CzJ_ceLJwx6_slide_2.jpg",
      "/instagram/feed_54_CzJ_ceLJwx6_slide_3.jpg",
      "/instagram/feed_54_CzJ_ceLJwx6_slide_4.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/CzJ_ceLJwx6/",
    heelOptions: ["Rasteira Conforto 1,5cm", "Salto Baixo 2,5cm"],
    strapFinishes: [
      "Tiras Entrela\xE7adas Strass Dourado",
      "Tiras Entrela\xE7adas Strass Cristal"
    ],
    colors: buildStandardColors(
      "Dourado",
      "/instagram/feed_54_CzJ_ceLJwx6_slide_1.jpg",
      {
        Dourado: "/instagram/feed_54_CzJ_ceLJwx6_slide_1.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: true,
    active: true,
    description: "Eleg\xE2ncia atemporal nos p\xE9s! Rasteira de bico quadrado do nosso perfil @petersonshoes_ com desenho de tiras finas entrela\xE7adas em strass sobre o peito do p\xE9.",
    craftDetails: [
      "Palmilha metalizada macia e solado antiderrapante (34 ao 39 BR)",
      "Dispon\xEDvel em Dourado, Prata, Preto, Branco, Nude, Marsala, Vermelho, Rosa ou Outra Cor",
      "Valor R$ 100,00 \xB7 Entrada de 50% (R$ 50,00 no Pix) + 50% na conclus\xE3o"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 44. POST 62 (CzJ-wYRpoWs) — Flatform Normal: Flatform Slide Tira Larga Nuvem Metalizada — R$ 110,00
  {
    id: "prod-ig-44-flatform-slide-nuvem-metalizada",
    sku: "PTS-IG-44",
    name: "Flatform Slide Tira Larga Nuvem Metalizada (Dourada & Prata)",
    subtitle: "Flatform Normal Anat\xF4mica Estilo Nuvem com G\xE1spea Larga Acolchoada Metalizada",
    category: "Flatforms & Papetes",
    price: 110,
    image: "/instagram/feed_62_CzJ-wYRpoWs_slide_1.jpg",
    gallery: [
      "/instagram/feed_62_CzJ-wYRpoWs_slide_1.jpg",
      "/instagram/feed_62_CzJ-wYRpoWs_slide_2.jpg",
      "/instagram/feed_62_CzJ-wYRpoWs_slide_3.jpg",
      "/instagram/feed_62_CzJ-wYRpoWs_slide_4.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/CzJ-wYRpoWs/",
    heelOptions: ["Flatform Anat\xF4mica 3,5cm", "Flatform Conforto 2,5cm"],
    strapFinishes: [
      "Napa Metalizada Macia Acolchoada",
      "Napa Fosca Acolchoada"
    ],
    colors: buildStandardColors(
      "Dourado",
      "/instagram/feed_62_CzJ-wYRpoWs_slide_1.jpg",
      {
        Dourado: "/instagram/feed_62_CzJ-wYRpoWs_slide_1.jpg",
        Prata: "/instagram/feed_62_CzJ-wYRpoWs_slide_2.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Um dos posts mais amados do nosso Instagram @petersonshoes_! Flatform Normal Slide com tira larga acolchoada e palmilha anat\xF4mica super leve para usar o dia inteiro.",
    craftDetails: [
      "Conforto absoluto com espuma interna macia (Numera\xE7\xE3o 34 ao 39 BR)",
      "Dispon\xEDvel em Dourado, Prata, Preto, Branco, Nude, Marsala, Vermelho, Rosa ou Outra Cor",
      "Valor R$ 110,00 \xB7 Entrada de 50% (R$ 55,00 no Pix) + 50% quando ficar pronta"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 45. POST 69 (Cqk8GO5NMY1) — Flatform Gladiadora Tratorada Tiras Strass & Amarração — R$ 130,00
  {
    id: "prod-ig-45-flatform-gladiadora-tratorada-cores",
    sku: "PTS-IG-45",
    name: "Flatform Gladiadora Tratorada Tiras Strass & Amarra\xE7\xE3o (Preta, Branca & Nude)",
    subtitle: "Solado Flatform Tratorado com Vira Brilhante, Tiras Cruzadas em Strass & Amarra\xE7\xE3o",
    category: "Flatforms & Papetes",
    price: 130,
    image: "/instagram/feed_69_Cqk8GO5NMY1_slide_1.jpg",
    gallery: [
      "/instagram/feed_69_Cqk8GO5NMY1_slide_1.jpg",
      "/instagram/feed_69_Cqk8GO5NMY1_slide_2.jpg",
      "/instagram/feed_69_Cqk8GO5NMY1_slide_3.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/Cqk8GO5NMY1/",
    heelOptions: ["Flatform Tratorada 4cm", "Flatform Anat\xF4mica 3cm"],
    strapFinishes: [
      "Strass Cristal & Amarra\xE7\xE3o Longa",
      "Strass Dourado & Amarra\xE7\xE3o Longa"
    ],
    colors: buildStandardColors(
      "Preto",
      "/instagram/feed_69_Cqk8GO5NMY1_slide_1.jpg",
      {
        Preto: "/instagram/feed_69_Cqk8GO5NMY1_slide_1.jpg",
        Branco: "/instagram/feed_69_Cqk8GO5NMY1_slide_2.jpg",
        Nude: "/instagram/feed_69_Cqk8GO5NMY1_slide_3.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Moderna, imponente e cheia de personalidade! Flatform Gladiadora Tratorada @petersonshoes_ com tiras cruzadas em strass e amarra\xE7\xE3o macia no tornozelo.",
    craftDetails: [
      "Produzida sob encomenda na numera\xE7\xE3o 34 ao 39 BR em nossa f\xE1brica em Goi\xE2nia - GO",
      "Escolha Preto, Branco, Nude ou qualquer outra cor personalizada",
      "Valor R$ 130,00 \xB7 Entrada de 50% (R$ 65,00 no Pix) + 50% na conclus\xE3o"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  },
  // 46. POST 72 (Cqk6zKsOtGe) — Outras Rasteiras: Rasteira Bico Quadrado Multitiras Finas & Fivela — R$ 100,00
  {
    id: "prod-ig-46-rasteira-multitiras-finas-fivela",
    sku: "PTS-IG-46",
    name: "Rasteira Bico Quadrado Multitiras Finas & Fivela",
    subtitle: "Rasteira Delicada de Bico Quadrado com Tiras Finas Assim\xE9tricas & Fivela no Tornozelo",
    category: "Rasteiras & Gladiadoras",
    price: 100,
    image: "/instagram/feed_72_Cqk6zKsOtGe_slide_1.jpg",
    gallery: [
      "/instagram/feed_72_Cqk6zKsOtGe_slide_1.jpg",
      "/instagram/feed_72_Cqk6zKsOtGe_slide_2.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/Cqk6zKsOtGe/",
    heelOptions: ["Rasteira Conforto 1,5cm", "Salto Baixo 2,5cm"],
    strapFinishes: [
      "Tiras Finas em Napa Macia c/ Fivela",
      "Tiras Finas Metalizadas c/ Fivela"
    ],
    colors: buildStandardColors(
      "Rosa",
      "/instagram/feed_72_Cqk6zKsOtGe_slide_1.jpg",
      {
        Rosa: "/instagram/feed_72_Cqk6zKsOtGe_slide_1.jpg",
        Branco: "/instagram/feed_72_Cqk6zKsOtGe_slide_2.jpg",
        Preto: "/instagram/feed_72_Cqk6zKsOtGe_slide_2.jpg"
      }
    ),
    availableSizes: STANDARD_SIZES,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Leveza minimalista que valoriza os p\xE9s! Rasteira de bico quadrado com multitiras finas e fechamento por fivela do nosso perfil @petersonshoes_.",
    craftDetails: [
      "Confeccionada sob encomenda na numera\xE7\xE3o 34 ao 39 BR em at\xE9 15 dias",
      "Dispon\xEDvel em Rosa, Branco, Preto, Marsala, Nude, Dourado, Prata, Vermelho ou Outra Cor",
      "Valor R$ 100,00 \xB7 Entrada de 50% (R$ 50,00 no Pix) + 50% quando ficar pronta"
    ],
    createdAt: "2026-03-01T12:00:00.000Z"
  }
];

// server.ts
dotenv.config();
var PORT = Number(process.env.PORT) || 3e3;
var IS_VERCEL = Boolean(process.env.VERCEL);
var BUNDLED_DB_FILE = path.resolve(process.cwd(), "data", "peterson-db.json");
var DATA_DIR = IS_VERCEL ? path.join("/tmp", "peterson-data") : path.resolve(process.cwd(), "data");
var DB_FILE_PROD = path.join(DATA_DIR, "peterson-db.json");
var DB_FILE_HOMOLOG = path.join(DATA_DIR, "peterson-db-homolog.json");
var ADMIN_AUTH_FILE = path.join(DATA_DIR, "admin-auth.secret.json");
var SQL_SCHEMA_FILE = path.resolve(process.cwd(), "supabase-schema.sql");
var INSTAGRAM_PUBLIC_DIR = path.resolve(process.cwd(), "public", "instagram");
function resolveEnv(req) {
  if (!req) return "homologacao";
  const headerEnv = String(req.headers["x-peterson-env"] || "").toLowerCase().trim();
  const queryEnv = String(req.query?.env || "").toLowerCase().trim();
  if (headerEnv === "producao" || queryEnv === "producao") {
    return "producao";
  }
  if (headerEnv === "homologacao" || queryEnv === "homologacao") {
    return "homologacao";
  }
  return "producao";
}
var STANDARD_SIZES2 = [34, 35, 36, 37, 38, 39];
function addDaysISO(days) {
  const d = /* @__PURE__ */ new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}
var BANCO_INTER_OFFICIAL_BRCODE = "00020101021126360014br.gov.bcb.pix0114507896360001325204000053039865802BR5912SONHO ANIMAL6007GOIANIA62070503***63049D03";
function generateMercadoPagoPixPayload(_amount, _reference, _pixKey) {
  return BANCO_INTER_OFFICIAL_BRCODE;
}
function buildStandardColors2(defaultColorName, defaultImage, photoByColor = {}) {
  const basePalette = [
    { name: "Preto", hex: "#1B191A" },
    { name: "Branco", hex: "#F7F7F5" },
    { name: "Marsala", hex: "#631421" },
    { name: "Nude", hex: "#DFC1B4" },
    { name: "Dourado", hex: "#D4AF37" },
    { name: "Prata", hex: "#C4C9CE" },
    { name: "Vermelho", hex: "#B31B2C" },
    { name: "Rosa", hex: "#E07A9B" }
  ];
  const sortedPalette = [
    ...basePalette.filter((c) => c.name === defaultColorName),
    ...basePalette.filter((c) => c.name !== defaultColorName)
  ];
  const mapped = sortedPalette.map((c) => ({
    name: c.name,
    hex: c.hex,
    image: photoByColor[c.name] || defaultImage
  }));
  mapped.push({
    name: "Outra Cor",
    hex: "#8E7970",
    image: defaultImage,
    isCustom: true
  });
  return mapped;
}
var INITIAL_PRODUCTS2 = [
  // 1. POST 1 (C454LXbOzrn Slide 1) — Papete Flatform Pirâmides & Fivela (Dourada) — R$ 130,00
  {
    id: "prod-ig-01-papete-piramides",
    sku: "PTS-IG-01",
    name: "Papete Flatform Pir\xE2mides & Fivela (Dourada)",
    subtitle: "Bico Quadrado Anat\xF4mico com Pir\xE2mides Espelhadas & Pulseira no Tornozelo",
    category: "Flatforms & Papetes",
    price: 130,
    image: "/instagram/feed_1_C454LXbOzrn_slide_1.jpg",
    gallery: [
      "/instagram/feed_1_C454LXbOzrn_slide_1.jpg",
      "/instagram/feed_1_C454LXbOzrn_slide_2.jpg",
      "/instagram/feed_1_C454LXbOzrn_slide_3.jpg",
      "/instagram/feed_1_C454LXbOzrn_slide_4.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C454LXbOzrn/",
    heelOptions: ["Flatform Anat\xF4mica 3,5cm", "Flatform Conforto 2,5cm"],
    strapFinishes: ["Pir\xE2mides Douradas & Fivela Ouro", "Pir\xE2mides Cromadas & Fivela Prata"],
    colors: buildStandardColors2("Dourado", "/instagram/feed_1_C454LXbOzrn_slide_1.jpg", {
      Dourado: "/instagram/feed_1_C454LXbOzrn_slide_1.jpg",
      Nude: "/instagram/feed_1_C454LXbOzrn_slide_2.jpg",
      Branco: "/instagram/feed_1_C454LXbOzrn_slide_2.jpg",
      Prata: "/instagram/feed_1_C454LXbOzrn_slide_3.jpg",
      Preto: "/instagram/feed_1_C454LXbOzrn_slide_4.jpg"
    }),
    availableSizes: STANDARD_SIZES2,
    productionDays: 15,
    featured: true,
    active: true,
    description: "Modelo oficial @petersonshoes_ de fabrica\xE7\xE3o pr\xF3pria em Goi\xE2nia - GO! Nossa Papete Flatform Pir\xE2mides combina palmilha anat\xF4mica macia de bico quadrado, tiras de dedo com aplica\xE7\xE3o de pir\xE2mides espelhadas e fivela regul\xE1vel no tornozelo.",
    craftDetails: [
      "Fabrica\xE7\xE3o pr\xF3pria @petersonshoes_ sob encomenda em at\xE9 15 dias (Numera\xE7\xE3o 34 ao 39)",
      "Dispon\xEDvel em Preto, Branco, Marsala, Nude, Dourado, Prata, Vermelho, Rosa ou Outra Cor \xE0 sua escolha",
      "Pagamento de 50% de entrada (Pix sem taxa ou Cart\xE3o c/ taxa do banco) e 50% quando ficar pronta"
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  // 2. POST 8 Parte A (C4Tc5OnpB_L Slide 1) — Anabela Plataforma Pirâmides & Fivela (Preta) — R$ 150,00
  {
    id: "prod-ig-02-anabela-piramides-fivela",
    sku: "PTS-IG-02",
    name: "Anabela Plataforma Pir\xE2mides & Fivela (Preta)",
    subtitle: "Plataforma Alta Bico Quadrado com Tiras em Pir\xE2mides & Fechamento por Fivela",
    category: "Anabelas & Plataformas",
    price: 150,
    image: "/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg",
    gallery: [
      "/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_3.jpg",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C4Tc5OnpB_L/",
    heelOptions: ["Anabela Alta 9,5cm (Meia Pata 3,5cm)", "Anabela M\xE9dia 7,5cm"],
    strapFinishes: ["Pir\xE2mides Douradas & Fivela Ouro", "Pir\xE2mides Prata & Fivela Cromada"],
    colors: buildStandardColors2("Preto", "/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg", {
      Preto: "/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg",
      Nude: "/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg",
      Rosa: "/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg",
      Prata: "/instagram/feed_8_C4Tc5OnpB_L_slide_3.jpg",
      Dourado: "/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg",
      Branco: "/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg"
    }),
    availableSizes: STANDARD_SIZES2,
    productionDays: 15,
    featured: true,
    active: true,
    description: "Cl\xE1ssica e imponente! Nossa Anabela Plataforma de bico quadrado com tachas piramidais e tira de fivela no tornozelo \xE9 produzida sob encomenda na sua cor favorita e numera\xE7\xE3o do 34 ao 39.",
    craftDetails: [
      "Dispon\xEDvel em todas as cores padr\xE3o ou qualquer outra cor personalizada escrita por voc\xEA",
      "Meia pata frontal anat\xF4mica que proporciona estabilidade e leveza",
      "Confeccionada sob medida no seu n\xFAmero (34 ao 39 BR) em at\xE9 15 dias"
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  // 3. POST 8 Parte B (C4Tc5OnpB_L Slide 6) — Anabela Plataforma Pirâmides Gladiadora (Dourada) — R$ 150,00
  {
    id: "prod-ig-03-anabela-piramides-amarracao",
    sku: "PTS-IG-03",
    name: "Anabela Plataforma Pir\xE2mides Gladiadora (Dourada)",
    subtitle: "Plataforma Alta Bico Quadrado com Pir\xE2mides & Amarra\xE7\xE3o Lace-Up na Perna",
    category: "Anabelas & Plataformas",
    price: 150,
    image: "/instagram/feed_8_C4Tc5OnpB_L_slide_6.jpg",
    gallery: [
      "/instagram/feed_8_C4Tc5OnpB_L_slide_6.jpg",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_8.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C4Tc5OnpB_L/",
    heelOptions: ["Anabela Alta 9,5cm (Meia Pata 3,5cm)", "Anabela M\xE9dia 7,5cm"],
    strapFinishes: ["Pir\xE2mides Douradas & Ponteiras Ouro", "Pir\xE2mides Prata & Ponteiras Prata"],
    colors: buildStandardColors2("Dourado", "/instagram/feed_8_C4Tc5OnpB_L_slide_6.jpg", {
      Dourado: "/instagram/feed_8_C4Tc5OnpB_L_slide_6.jpg",
      Nude: "/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg",
      Rosa: "/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg",
      Prata: "/instagram/feed_8_C4Tc5OnpB_L_slide_8.jpg"
    }),
    availableSizes: STANDARD_SIZES2,
    productionDays: 15,
    featured: true,
    active: true,
    description: "Vers\xE3o Gladiadora com amarra\xE7\xE3o na perna da nossa Anabela Plataforma @petersonshoes_! Tiras de dedo cravejadas em pir\xE2mides metalizadas e cord\xF5es macios que permitem diversas formas de amarra\xE7\xE3o no tornozelo.",
    craftDetails: [
      "Escolha entre Preto, Branco, Marsala, Nude, Dourado, Prata, Vermelho, Rosa ou Outra Cor",
      "Cord\xF5es macios de alta resist\xEAncia com ajuste perfeito na perna",
      "Produ\xE7\xE3o pr\xF3pria sob encomenda em 15 dias (50% no Pix ou Cart\xE3o de Cr\xE9dito)"
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  // 4. POST 9 (C4Tc1qCpAdX Slide 1) — Papete Flatform Tratorada Strass & Amarração (Off-White) — R$ 130,00
  {
    id: "prod-ig-04-papete-tratorada-strass",
    sku: "PTS-IG-04",
    name: "Papete Flatform Tratorada Strass & Amarra\xE7\xE3o (Off-White)",
    subtitle: "Solado Tratorado Cravejado com Tiras Duplas de Strass & Amarra\xE7\xE3o N\xF3 Frontal",
    category: "Flatforms & Papetes",
    price: 130,
    image: "/instagram/feed_9_C4Tc1qCpAdX_slide_1.jpg",
    gallery: [
      "/instagram/feed_9_C4Tc1qCpAdX_slide_1.jpg",
      "/instagram/feed_9_C4Tc1qCpAdX_slide_2.jpg",
      "/instagram/feed_9_C4Tc1qCpAdX_slide_3.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C4Tc1qCpAdX/",
    heelOptions: ["Flatform Tratorada 4cm", "Flatform Anat\xF4mica 3cm"],
    strapFinishes: ["Strass Cristal & Vira Cravejada", "Strass Grafite Onix"],
    colors: buildStandardColors2("Branco", "/instagram/feed_9_C4Tc1qCpAdX_slide_1.jpg", {
      Branco: "/instagram/feed_9_C4Tc1qCpAdX_slide_1.jpg",
      Nude: "/instagram/feed_9_C4Tc1qCpAdX_slide_1.jpg",
      Preto: "/instagram/feed_9_C4Tc1qCpAdX_slide_2.jpg",
      Dourado: "/instagram/feed_9_C4Tc1qCpAdX_slide_3.jpg"
    }),
    availableSizes: STANDARD_SIZES2,
    productionDays: 15,
    featured: true,
    active: true,
    description: "Brilho intenso e design super moderno do Instagram @petersonshoes_! Papete Flatform com solado tratorado contornado por fileira de strass, duas tiras frontais cravejadas e amarra\xE7\xE3o com n\xF3 central sobre o peito do p\xE9.",
    craftDetails: [
      "Dispon\xEDvel em todas as cores padr\xE3o ou cor personalizada sob encomenda (34 ao 39 BR)",
      "Vira da palmilha inteiramente contornada em manta de strass",
      "Solado tratorado leve e antiderrapante feito sob encomenda"
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  // 5. POST 5 (C4539VxO5om Slides 1 a 2) — Anabela Plataforma Trançada Esferas (Dourada) — R$ 150,00
  {
    id: "prod-ig-05-anabela-trancada-gold",
    sku: "PTS-IG-05",
    name: "Anabela Plataforma Tran\xE7ada Esferas (Dourada)",
    subtitle: "Salto Plataforma Revestido em Trama Artesanal com Esferas & Fivela",
    category: "Anabelas & Plataformas",
    price: 150,
    image: "/instagram/feed_5_C4539VxO5om_slide_1.jpg",
    gallery: [
      "/instagram/feed_5_C4539VxO5om_slide_1.jpg",
      "/instagram/feed_5_C4539VxO5om_slide_2.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C4539VxO5om/",
    heelOptions: ["Anabela Alta 9,5cm (Meia Pata 3,5cm)", "Anabela M\xE9dia 7,5cm"],
    strapFinishes: ["Esferas & Fivela Dourada", "Esferas & Fivela Prateada"],
    colors: buildStandardColors2("Dourado", "/instagram/feed_5_C4539VxO5om_slide_1.jpg", {
      Dourado: "/instagram/feed_5_C4539VxO5om_slide_1.jpg"
    }),
    availableSizes: STANDARD_SIZES2,
    productionDays: 15,
    featured: true,
    active: true,
    description: "Destaque absoluto do Instagram @petersonshoes_! Sand\xE1lia Anabela Plataforma inteiramente revestida em trama artesanal, com tira frontal de dedo adornada por esferas e tiras cruzadas no tornozelo.",
    craftDetails: [
      "Revestimento completo da plataforma em tran\xE7ado artesanal feito \xE0 m\xE3o",
      "Meia pata frontal que reduz a inclina\xE7\xE3o do p\xE9 e garante conforto prolongado",
      "Confeccionada sob encomenda (34 ao 39 BR) com 50% de entrada no Pix ou Cart\xE3o"
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  // 6. POST 10 (C4Tcs31JPdl Slide 1) — Flatform Gladiadora Tiras Cruzadas Strass (Dourada) — R$ 130,00
  {
    id: "prod-ig-06-flatform-amarracao-strass",
    sku: "PTS-IG-06",
    name: "Flatform Gladiadora Tiras Cruzadas Strass (Dourada)",
    subtitle: "Flatform Anat\xF4mica com Vira de Strass, Tiras Finas Brilhantes & Amarra\xE7\xE3o Gladiadora",
    category: "Flatforms & Papetes",
    price: 130,
    image: "/instagram/feed_10_C4Tcs31JPdl_slide_1.jpg",
    gallery: [
      "/instagram/feed_10_C4Tcs31JPdl_slide_1.jpg",
      "/instagram/feed_10_C4Tcs31JPdl_slide_2.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C4Tcs31JPdl/",
    heelOptions: ["Flatform Anat\xF4mica 3,5cm", "Flatform Conforto 2,5cm"],
    strapFinishes: ["Strass Dourado & Vira Brilhante", "Strass Prata Cristal"],
    colors: buildStandardColors2("Dourado", "/instagram/feed_10_C4Tcs31JPdl_slide_1.jpg", {
      Dourado: "/instagram/feed_10_C4Tcs31JPdl_slide_1.jpg",
      Branco: "/instagram/feed_10_C4Tcs31JPdl_slide_2.jpg",
      Prata: "/instagram/feed_10_C4Tcs31JPdl_slide_2.jpg"
    }),
    availableSizes: STANDARD_SIZES2,
    productionDays: 15,
    featured: true,
    active: true,
    description: "Delicadeza e sofistica\xE7\xE3o em cada detalhe! Nossa Flatform Gladiadora @petersonshoes_ possui tiras finas cruzadas recobertas por strass, borda da palmilha cravejada e amarra\xE7\xE3o ajust\xE1vel no tornozelo.",
    craftDetails: [
      "Produzida em Preto, Branco, Marsala, Nude, Dourado, Prata, Vermelho, Rosa ou Outra Cor",
      "Palmilha anat\xF4mica acolchoada com filete lateral de strass",
      "Fabrica\xE7\xE3o pr\xF3pria sob encomenda em at\xE9 15 dias (Numera\xE7\xE3o 34 ao 39)"
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  // 7. POST 11 (C4TcpFaJ9ll Slide 1) — Papete Flatform Espelhada Tiras Strass (Prata) — R$ 130,00
  {
    id: "prod-ig-07-papete-metalizada-transpassada",
    sku: "PTS-IG-07",
    name: "Papete Flatform Espelhada Tiras Strass (Prata)",
    subtitle: "Acabamento Premium com Tiras Transpassadas em Strass & Fivela no Tornozelo",
    category: "Flatforms & Papetes",
    price: 130,
    image: "/instagram/feed_11_C4TcpFaJ9ll_slide_1.jpg",
    gallery: [
      "/instagram/feed_11_C4TcpFaJ9ll_slide_1.jpg",
      "/instagram/feed_11_C4TcpFaJ9ll_slide_2.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C4TcpFaJ9ll/",
    heelOptions: ["Flatform Espelhada 3,5cm", "Flatform Conforto 2,5cm"],
    strapFinishes: ["Strass Cristal & Fivela Prata", "Strass Champagne & Fivela Ouro"],
    colors: buildStandardColors2("Prata", "/instagram/feed_11_C4TcpFaJ9ll_slide_1.jpg", {
      Prata: "/instagram/feed_11_C4TcpFaJ9ll_slide_1.jpg",
      Dourado: "/instagram/feed_11_C4TcpFaJ9ll_slide_2.jpg"
    }),
    availableSizes: STANDARD_SIZES2,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Para quem ama brilho com m\xE1ximo conforto! Papete Flatform @petersonshoes_ com tiras curvas cravejadas em strass e fechamento seguro por fivela no tornozelo.",
    craftDetails: [
      "Dispon\xEDvel em todas as cores padr\xE3o ou qualquer outra cor personalizada",
      "Bico quadrado anat\xF4mico que acomoda os dedos com perfei\xE7\xE3o (34 ao 39 BR)",
      "Encomenda confirmada com 50% de entrada via Pix ou Cart\xE3o de Cr\xE9dito"
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  // 8. POST 7 (C4ayCqZteae) — Flatform Normal Tira de Dedo Strass Duo — R$ 110,00
  {
    id: "prod-ig-08-papete-dos-sonhos-strass",
    sku: "PTS-IG-08",
    name: "Flatform Tira de Dedo Strass Duo (Dourada & Prata)",
    subtitle: "Flatform Normal Bico Quadrado com Tiras de Dedo e Peito do P\xE9 Cravejadas em Strass",
    category: "Flatforms & Papetes",
    price: 110,
    image: "/instagram/feed_7_C4ayCqZteae_main.jpg",
    gallery: [
      "/instagram/feed_7_C4ayCqZteae_main.jpg",
      "/instagram/feed_11_C4TcpFaJ9ll_slide_2.jpg",
      "/instagram/feed_11_C4TcpFaJ9ll_slide_1.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C4ayCqZteae/",
    heelOptions: ["Flatform Anat\xF4mica 3cm", "Flatform Baixa 2cm"],
    strapFinishes: ["Manta de Strass Dourado", "Manta de Strass Prata Cristal"],
    colors: buildStandardColors2("Dourado", "/instagram/feed_7_C4ayCqZteae_main.jpg", {
      Dourado: "/instagram/feed_7_C4ayCqZteae_main.jpg",
      Prata: "/instagram/feed_7_C4ayCqZteae_main.jpg"
    }),
    availableSizes: STANDARD_SIZES2,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Publicada em nosso Instagram @petersonshoes_, nossa Flatform de Dedo Strass Duo combina calce pr\xE1tico estilo slide com anel de dedo e tr\xEAs tiras superiores inteiramente cravejadas em strass de alto brilho.",
    craftDetails: [
      "Flatform normal pr\xE1tica de cal\xE7ar e super leve para o dia a dia ou eventos",
      "Dispon\xEDvel nas cores padr\xE3o ou cor personalizada (Numera\xE7\xE3o 34 ao 39 BR)",
      "Produzida sob encomenda pela Peterson Shoes em at\xE9 15 dias"
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  // 9. POST 12 (C4TcmhYpO8_) — Flatform Normal Slide Tira de Dedo Nó em Strass — R$ 110,00
  {
    id: "prod-ig-09-chinelo-flatform-no-strass",
    sku: "PTS-IG-09",
    name: "Flatform Slide Tira de Dedo N\xF3 em Strass",
    subtitle: "Flatform Normal Anat\xF4mica Macia com Tiras Revestidas em Manta de Strass e N\xF3",
    category: "Flatforms & Papetes",
    price: 110,
    image: "/instagram/feed_12_C4TcmhYpO8__main.jpg",
    gallery: ["/instagram/feed_12_C4TcmhYpO8__main.jpg"],
    instagramPostUrl: "https://www.instagram.com/p/C4TcmhYpO8_/",
    heelOptions: ["Solado Anat\xF4mico 3,5cm", "Solado Conforto 2,5cm"],
    strapFinishes: ["Manta de Strass Cristal c/ N\xF3 Central", "Manta de Strass Dourado"],
    colors: buildStandardColors2("Nude", "/instagram/feed_12_C4TcmhYpO8__main.jpg", {
      Nude: "/instagram/feed_12_C4TcmhYpO8__main.jpg",
      Preto: "/instagram/feed_12_C4TcmhYpO8__main.jpg",
      Branco: "/instagram/feed_12_C4TcmhYpO8__main.jpg"
    }),
    availableSizes: STANDARD_SIZES2,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Conforto absoluto nos p\xE9s com o glamour da manta de strass! Nossa Flatform Normal Slide com n\xF3 central do Instagram @petersonshoes_ \xE9 confeccionado em todas as cores padr\xE3o ou sob encomenda na cor que voc\xEA desejar.",
    craftDetails: [
      "Palmilha anat\xF4mica tipo nuvem de alt\xEDssima maciez (34 ao 39 BR)",
      "Tiras revestidas em manta de strass com forro interno suave",
      "Ideal para varejo ou pedidos em atacado (a partir de 6 pares)"
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  // 10. POST 2 (C454HJKO2oG) — Anabela Espadrille Branca Pirâmides Prateadas & Corda de Juta — R$ 150,00
  {
    id: "prod-ig-10-anabela-espadrille-branca",
    sku: "PTS-IG-10",
    name: "Anabela Espadrille Pir\xE2mides & Juta (Branca)",
    subtitle: "Anabela com Tachas Piramidais Espelhadas & Corda de Juta Natural",
    category: "Anabelas & Plataformas",
    price: 150,
    image: "/instagram/feed_2_C454HJKO2oG_main.jpg",
    gallery: ["/instagram/feed_2_C454HJKO2oG_main.jpg"],
    instagramPostUrl: "https://www.instagram.com/p/C454HJKO2oG/",
    heelOptions: ["Anabela 9cm com Meia Pata", "Anabela 7cm Conforto"],
    strapFinishes: ["Pir\xE2mides Prateadas Cromadas", "Pir\xE2mides Douradas"],
    colors: buildStandardColors2("Branco", "/instagram/feed_2_C454HJKO2oG_main.jpg", {
      Branco: "/instagram/feed_2_C454HJKO2oG_main.jpg"
    }),
    availableSizes: STANDARD_SIZES2,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Modelo oficial @petersonshoes_ pensado para produ\xE7\xF5es sofisticadas! Sand\xE1lia Anabela estruturada em napa macia, com tira frontal e tornozeleira cravejadas de pir\xE2mides e vira contornada em corda de juta.",
    craftDetails: [
      "Tira frontal e pulseira do tornozelo com aplica\xE7\xE3o firme de pir\xE2mides espelhadas",
      "Base contornada em juta natural tran\xE7ada e tachas met\xE1licas",
      "Feita sob medida no seu n\xFAmero (34 ao 39 BR) em at\xE9 15 dias"
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  // 11. POST 4 (C454A4GujcN Slides 1 a 2) — Rasteira Gladiadora Strass Cristal — R$ 110,00
  {
    id: "prod-ig-11-rasteira-gladiadora-strass",
    sku: "PTS-IG-11",
    name: "Rasteira Gladiadora Strass Cristal (Prata)",
    subtitle: "Tiras Duplas em Manta de Strass & Amarra\xE7\xE3o Gladiadora Delicada na Perna",
    category: "Rasteiras & Gladiadoras",
    price: 110,
    image: "/instagram/feed_4_C454A4GujcN_slide_1.jpg",
    gallery: [
      "/instagram/feed_4_C454A4GujcN_slide_1.jpg",
      "/instagram/feed_4_C454A4GujcN_slide_2.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C454A4GujcN/",
    heelOptions: ["Rasteira Plana Conforto 1,2cm", "Salto Baixo 2cm"],
    strapFinishes: ["Strass Cristal Prata", "Strass Dourado Champagne"],
    colors: buildStandardColors2("Prata", "/instagram/feed_4_C454A4GujcN_slide_1.jpg", {
      Prata: "/instagram/feed_4_C454A4GujcN_slide_1.jpg"
    }),
    availableSizes: STANDARD_SIZES2,
    productionDays: 15,
    featured: false,
    active: true,
    description: 'Sucesso absoluto no Instagram @petersonshoes_ ("Quando amamos o que fazemos")! Rasteira Gladiadora com duas tiras frontais revestidas em manta de strass cristal de alto brilho e cord\xF5es macios para amarra\xE7\xE3o.',
    craftDetails: [
      "Manta de strass cristal com fixa\xE7\xE3o refor\xE7ada e forro interno macio",
      "Dispon\xEDvel em Preto, Branco, Marsala, Nude, Dourado, Prata, Vermelho, Rosa ou Outra Cor",
      "Fabrica\xE7\xE3o pr\xF3pria sob encomenda em at\xE9 15 dias (34 ao 39 BR)"
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  // 12. POST 6 (C45360nuL6q Slides 1 a 2) — Anabela Tamanco Plataforma Trançado Nó — R$ 150,00
  {
    id: "prod-ig-12-tamanco-plataforma-no",
    sku: "PTS-IG-12",
    name: "Anabela Tamanco Plataforma Tran\xE7ado c/ N\xF3 (Off-White)",
    subtitle: "Anabela Plataforma Alta Revestida em Trama Artesanal & Tira Larga com N\xF3 Central",
    category: "Anabelas & Plataformas",
    price: 150,
    image: "/instagram/feed_6_C45360nuL6q_slide_1.jpg",
    gallery: [
      "/instagram/feed_6_C45360nuL6q_slide_1.jpg",
      "/instagram/feed_6_C45360nuL6q_slide_2.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C45360nuL6q/",
    heelOptions: ["Anabela Plataforma Alta 8,5cm", "Anabela Plataforma M\xE9dia 6,5cm"],
    strapFinishes: ["Napa Macia Sem Metais", "Detalhe Dourado na Palmilha"],
    colors: buildStandardColors2("Branco", "/instagram/feed_6_C45360nuL6q_slide_1.jpg", {
      Branco: "/instagram/feed_6_C45360nuL6q_slide_1.jpg",
      Nude: "/instagram/feed_6_C45360nuL6q_slide_2.jpg"
    }),
    availableSizes: STANDARD_SIZES2,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Conforto, leveza e altura em um modelo tend\xEAncia do nosso Instagram @petersonshoes_! Anabela Tamanco Plataforma com base inteiramente revestida em trama tran\xE7ada e g\xE1spea em napa ultra macia com n\xF3 frontal anat\xF4mico.",
    craftDetails: [
      "Plataforma super leve com estabilidade total ao caminhar (34 ao 39 BR)",
      "Tira larga forrada em espuma macia para zero atrito nos dedos",
      "Produzido sob encomenda com 50% de entrada via Pix ou Cart\xE3o de Cr\xE9dito"
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  // 13. POST 3 (C454E0zuuFv Slide 1) — Outras Rasteiras: Rasteira Esferas & Medalhão Metalizada (Dourada) — R$ 100,00
  {
    id: "prod-ig-13-rasteira-medalhao-esferas",
    sku: "PTS-IG-13",
    name: "Rasteira Esferas & Medalh\xE3o Metalizada (Dourada)",
    subtitle: "Rasteira de Dedo com Tachas Esf\xE9ricas & Tira Dupla no Tornozelo",
    category: "Rasteiras & Gladiadoras",
    price: 100,
    image: "/instagram/feed_3_C454E0zuuFv_slide_1.jpg",
    gallery: [
      "/instagram/feed_3_C454E0zuuFv_slide_1.jpg",
      "/instagram/feed_3_C454E0zuuFv_slide_2.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C454E0zuuFv/",
    heelOptions: ["Rasteira Conforto 1,5cm", "Salto Baixo 2,5cm"],
    strapFinishes: ["Esferas & Medalh\xF5es Dourados", "Esferas & Medalh\xF5es Prateados"],
    colors: buildStandardColors2("Dourado", "/instagram/feed_3_C454E0zuuFv_slide_1.jpg", {
      Dourado: "/instagram/feed_3_C454E0zuuFv_slide_1.jpg",
      Prata: "/instagram/feed_3_C454E0zuuFv_slide_2.jpg"
    }),
    availableSizes: STANDARD_SIZES2,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Escolha a sua favorita do nosso Instagram @petersonshoes_! Rasteira de dedo confeccionada com aplica\xE7\xE3o cont\xEDnua de esferas e medalh\xF5es trabalhados e tira dupla que valoriza o tornozelo.",
    craftDetails: [
      "Dispon\xEDvel em todas as cores padr\xE3o ou outra cor personalizada escrita por voc\xEA",
      "Aplica\xE7\xE3o de esferas e medalh\xF5es com rebites internos protegidos",
      "Bico levemente quadrado moderno com palmilha macia (34 ao 39 BR)"
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  // 14. POST 1 Slide 4 — Papete Flatform Pirâmides Black & Gold (Preta) — R$ 130,00
  {
    id: "prod-ig-14-papete-piramides-preta",
    sku: "PTS-IG-14",
    name: "Papete Flatform Pir\xE2mides Black & Gold (Preta)",
    subtitle: "Edi\xE7\xE3o Preta com Pir\xE2mides Douradas Espelhadas & Solado Anat\xF4mico",
    category: "Flatforms & Papetes",
    price: 130,
    image: "/instagram/feed_1_C454LXbOzrn_slide_4.jpg",
    gallery: [
      "/instagram/feed_1_C454LXbOzrn_slide_4.jpg",
      "/instagram/feed_1_C454LXbOzrn_slide_1.jpg",
      "/instagram/feed_1_C454LXbOzrn_slide_2.jpg",
      "/instagram/feed_1_C454LXbOzrn_slide_3.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C454LXbOzrn/",
    heelOptions: ["Flatform Anat\xF4mica 3,5cm", "Flatform Conforto 2,5cm"],
    strapFinishes: ["Pir\xE2mides Douradas & Fivela Dourada", "Pir\xE2mides Prata & Fivela Prata"],
    colors: buildStandardColors2("Preto", "/instagram/feed_1_C454LXbOzrn_slide_4.jpg", {
      Preto: "/instagram/feed_1_C454LXbOzrn_slide_4.jpg",
      Dourado: "/instagram/feed_1_C454LXbOzrn_slide_1.jpg",
      Nude: "/instagram/feed_1_C454LXbOzrn_slide_2.jpg",
      Branco: "/instagram/feed_1_C454LXbOzrn_slide_2.jpg",
      Prata: "/instagram/feed_1_C454LXbOzrn_slide_3.jpg"
    }),
    availableSizes: STANDARD_SIZES2,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Contraste marcante entre o preto intenso e o brilho das pir\xE2mides douradas! Esta vers\xE3o da nossa Papete Flatform @petersonshoes_ traz palmilha anat\xF4mica contornada, tira de dedo com n\xF3 frontal e pulseira regul\xE1vel.",
    craftDetails: [
      "Dispon\xEDvel em Preto, Branco, Marsala, Nude, Dourado, Prata, Vermelho, Rosa ou Outra Cor",
      "Metais piramidais dourados com banho resistente \xE0 oxida\xE7\xE3o",
      "Feita sob encomenda em at\xE9 15 dias (Numera\xE7\xE3o 34 ao 39 BR)"
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  // 15. POST 8 Slide 2 — Anabela Plataforma Pirâmides & Fivela (Nude Rosé) — R$ 150,00
  {
    id: "prod-ig-15-anabela-piramides-nude",
    sku: "PTS-IG-15",
    name: "Anabela Plataforma Pir\xE2mides & Fivela (Nude Ros\xE9)",
    subtitle: "Edi\xE7\xE3o Nude Aveludada com Tachas Piramidais Douradas & Bico Quadrado",
    category: "Anabelas & Plataformas",
    price: 150,
    image: "/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg",
    gallery: [
      "/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C4Tc5OnpB_L/",
    heelOptions: ["Anabela Alta 9,5cm (Meia Pata 3,5cm)", "Anabela M\xE9dia 7,5cm"],
    strapFinishes: ["Fivela no Tornozelo (Foto 1)", "Amarra\xE7\xE3o Gladiadora (Foto 2)"],
    colors: buildStandardColors2("Nude", "/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg", {
      Nude: "/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg",
      Rosa: "/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg",
      Dourado: "/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg",
      Branco: "/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg",
      Preto: "/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg",
      Prata: "/instagram/feed_8_C4Tc5OnpB_L_slide_3.jpg"
    }),
    availableSizes: STANDARD_SIZES2,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Eleg\xE2ncia suave que alonga a silhueta! Nossa Anabela Plataforma Pir\xE2mides pode ser encomendada tanto na vers\xE3o com Fivela cl\xE1ssica no tornozelo quanto na vers\xE3o Gladiadora de Amarra\xE7\xE3o, do 34 ao 39.",
    craftDetails: [
      "Escolha entre fechamento com Fivela ou Amarra\xE7\xE3o Gladiadora",
      "Dispon\xEDvel em todas as cores padr\xE3o ou qualquer outra cor personalizada",
      "Pagamento facilitado: 50% de entrada (Pix ou Cart\xE3o c/ taxa) e 50% na conclus\xE3o"
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  // 16. POST 1 Slide 2 — Papete Flatform Pirâmides & Fivela (Off-White / Nude) — R$ 130,00
  {
    id: "prod-ig-16-papete-piramides-nude",
    sku: "PTS-IG-16",
    name: "Papete Flatform Pir\xE2mides & Fivela (Off-White / Nude)",
    subtitle: "Palmilha Anat\xF4mica Off-White com Pir\xE2mides Douradas & Fivela Ajust\xE1vel",
    category: "Flatforms & Papetes",
    price: 130,
    image: "/instagram/feed_1_C454LXbOzrn_slide_2.jpg",
    gallery: [
      "/instagram/feed_1_C454LXbOzrn_slide_2.jpg",
      "/instagram/feed_1_C454LXbOzrn_slide_1.jpg",
      "/instagram/feed_1_C454LXbOzrn_slide_3.jpg",
      "/instagram/feed_1_C454LXbOzrn_slide_4.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C454LXbOzrn/",
    heelOptions: ["Flatform Anat\xF4mica 3,5cm", "Flatform Conforto 2,5cm"],
    strapFinishes: ["Pir\xE2mides Douradas & Fivela Ouro", "Pir\xE2mides Prata & Fivela Prata"],
    colors: buildStandardColors2("Nude", "/instagram/feed_1_C454LXbOzrn_slide_2.jpg", {
      Nude: "/instagram/feed_1_C454LXbOzrn_slide_2.jpg",
      Branco: "/instagram/feed_1_C454LXbOzrn_slide_2.jpg",
      Dourado: "/instagram/feed_1_C454LXbOzrn_slide_1.jpg",
      Prata: "/instagram/feed_1_C454LXbOzrn_slide_3.jpg",
      Preto: "/instagram/feed_1_C454LXbOzrn_slide_4.jpg"
    }),
    availableSizes: STANDARD_SIZES2,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Vers\xE3o Off-White / Nude super vers\xE1til do nosso Instagram @petersonshoes_! Combina com todos os looks e traz palmilha macia de bico quadrado com tachas piramidais.",
    craftDetails: [
      "Fabrica\xE7\xE3o pr\xF3pria em Goi\xE2nia - GO sob encomenda (34 ao 39 BR)",
      "Dispon\xEDvel nas 8 cores padr\xE3o ou na cor personalizada que voc\xEA escrever",
      "Entrada de 50% (R$ 65,00 no Pix sem taxa) + 50% quando ficar pronta"
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  // 17. POST 1 Slide 3 — Papete Flatform Pirâmides & Fivela (Prata Metalizada) — R$ 130,00
  {
    id: "prod-ig-17-papete-piramides-prata",
    sku: "PTS-IG-17",
    name: "Papete Flatform Pir\xE2mides & Fivela (Prata)",
    subtitle: "Acabamento Metalizado Prata com Pir\xE2mides Espelhadas & Pulseira no Tornozelo",
    category: "Flatforms & Papetes",
    price: 130,
    image: "/instagram/feed_1_C454LXbOzrn_slide_3.jpg",
    gallery: [
      "/instagram/feed_1_C454LXbOzrn_slide_3.jpg",
      "/instagram/feed_1_C454LXbOzrn_slide_1.jpg",
      "/instagram/feed_1_C454LXbOzrn_slide_2.jpg",
      "/instagram/feed_1_C454LXbOzrn_slide_4.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C454LXbOzrn/",
    heelOptions: ["Flatform Anat\xF4mica 3,5cm", "Flatform Conforto 2,5cm"],
    strapFinishes: ["Pir\xE2mides Cromadas & Fivela Prata", "Pir\xE2mides Douradas & Fivela Ouro"],
    colors: buildStandardColors2("Prata", "/instagram/feed_1_C454LXbOzrn_slide_3.jpg", {
      Prata: "/instagram/feed_1_C454LXbOzrn_slide_3.jpg",
      Dourado: "/instagram/feed_1_C454LXbOzrn_slide_1.jpg",
      Nude: "/instagram/feed_1_C454LXbOzrn_slide_2.jpg",
      Preto: "/instagram/feed_1_C454LXbOzrn_slide_4.jpg"
    }),
    availableSizes: STANDARD_SIZES2,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Edi\xE7\xE3o Prata Metalizada da nossa Papete Flatform Pir\xE2mides @petersonshoes_! Moderna, confort\xE1vel e feita sob medida na sua numera\xE7\xE3o.",
    craftDetails: [
      "Confeccionada sob encomenda do 34 ao 39 BR em at\xE9 15 dias",
      "Escolha Prata ou qualquer uma das cores padr\xE3o / cor personalizada",
      "Entrada de 50% (R$ 65,00 no Pix) + 50% na conclus\xE3o"
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  // 18. POST 3 Slide 2 — Outras Rasteiras: Rasteira Esferas & Medalhão Metalizada (Prata) — R$ 100,00
  {
    id: "prod-ig-18-rasteira-medalhao-prata",
    sku: "PTS-IG-18",
    name: "Rasteira Esferas & Medalh\xE3o Metalizada (Prata)",
    subtitle: "Rasteira de Dedo Prateada com Esferas Cromadas & Tira Dupla no Tornozelo",
    category: "Rasteiras & Gladiadoras",
    price: 100,
    image: "/instagram/feed_3_C454E0zuuFv_slide_2.jpg",
    gallery: [
      "/instagram/feed_3_C454E0zuuFv_slide_2.jpg",
      "/instagram/feed_3_C454E0zuuFv_slide_1.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C454E0zuuFv/",
    heelOptions: ["Rasteira Conforto 1,5cm", "Salto Baixo 2,5cm"],
    strapFinishes: ["Esferas & Medalh\xF5es Prateados", "Esferas & Medalh\xF5es Dourados"],
    colors: buildStandardColors2("Prata", "/instagram/feed_3_C454E0zuuFv_slide_2.jpg", {
      Prata: "/instagram/feed_3_C454E0zuuFv_slide_2.jpg",
      Dourado: "/instagram/feed_3_C454E0zuuFv_slide_1.jpg"
    }),
    availableSizes: STANDARD_SIZES2,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Vers\xE3o Prata Metalizada da nossa Rasteira Esferas & Medalh\xE3o @petersonshoes_! Leve, fresca e elegante para todas as ocasi\xF5es.",
    craftDetails: [
      "Fabrica\xE7\xE3o pr\xF3pria sob encomenda em Goi\xE2nia - GO (Numera\xE7\xE3o 34 ao 39)",
      "Dispon\xEDvel em todas as cores padr\xE3o ou outra cor personalizada",
      "Valor R$ 100,00 \xB7 Entrada de 50% (R$ 50,00 no Pix) + 50% quando ficar pronta"
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  // 19. POST 8 Slide 3 — Anabela Plataforma Pirâmides & Fivela (Prata Champagne) — R$ 150,00
  {
    id: "prod-ig-19-anabela-piramides-prata",
    sku: "PTS-IG-19",
    name: "Anabela Plataforma Pir\xE2mides & Fivela (Prata Champagne)",
    subtitle: "Plataforma Alta Metalizada com Tachas Piramidais & Fivela no Tornozelo",
    category: "Anabelas & Plataformas",
    price: 150,
    image: "/instagram/feed_8_C4Tc5OnpB_L_slide_3.jpg",
    gallery: [
      "/instagram/feed_8_C4Tc5OnpB_L_slide_3.jpg",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C4Tc5OnpB_L/",
    heelOptions: ["Anabela Alta 9,5cm (Meia Pata 3,5cm)", "Anabela M\xE9dia 7,5cm"],
    strapFinishes: ["Pir\xE2mides Douradas & Fivela Ouro", "Pir\xE2mides Prata & Fivela Cromada"],
    colors: buildStandardColors2("Prata", "/instagram/feed_8_C4Tc5OnpB_L_slide_3.jpg", {
      Prata: "/instagram/feed_8_C4Tc5OnpB_L_slide_3.jpg",
      Preto: "/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg",
      Nude: "/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg",
      Dourado: "/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg",
      Branco: "/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg"
    }),
    availableSizes: STANDARD_SIZES2,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Brilho sofisticado para festas e eventos! Anabela Plataforma Pir\xE2mides @petersonshoes_ na edi\xE7\xE3o Prata Champagne, confeccionada sob encomenda do 34 ao 39.",
    craftDetails: [
      "Meia pata anat\xF4mica que garante conforto mesmo em salto alto",
      "Dispon\xEDvel em todas as cores padr\xE3o ou cor personalizada",
      "Entrada de 50% (R$ 75,00 no Pix) + 50% quando sua Anabela estiver pronta"
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  // 20. POST 8 Slide 4 — Anabela Plataforma Pirâmides & Fivela (Dourada) — R$ 150,00
  {
    id: "prod-ig-20-anabela-piramides-dourada",
    sku: "PTS-IG-20",
    name: "Anabela Plataforma Pir\xE2mides & Fivela (Dourada)",
    subtitle: "Edi\xE7\xE3o Ouro Metalizado com Pir\xE2mides Douradas & Pulseira de Fivela",
    category: "Anabelas & Plataformas",
    price: 150,
    image: "/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg",
    gallery: [
      "/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C4Tc5OnpB_L/",
    heelOptions: ["Anabela Alta 9,5cm (Meia Pata 3,5cm)", "Anabela M\xE9dia 7,5cm"],
    strapFinishes: ["Pir\xE2mides Douradas & Fivela Ouro", "Pir\xE2mides Prata & Fivela Cromada"],
    colors: buildStandardColors2("Dourado", "/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg", {
      Dourado: "/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg",
      Preto: "/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg",
      Nude: "/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg",
      Prata: "/instagram/feed_8_C4Tc5OnpB_L_slide_3.jpg",
      Branco: "/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg"
    }),
    availableSizes: STANDARD_SIZES2,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Uma das campe\xE3s de pedidos no Instagram @petersonshoes_! Anabela Plataforma inteiramente dourada com pir\xE2mides espelhadas e fechamento por fivela no tornozelo.",
    craftDetails: [
      "Confeccionada sob encomenda na numera\xE7\xE3o 34 ao 39 BR",
      "Dispon\xEDvel em Dourado ou qualquer outra cor escolhida por voc\xEA",
      "Valor R$ 150,00 \xB7 Entrada de 50% (R$ 75,00) + 50% na conclus\xE3o"
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  // 21. POST 8 Slide 5 — Anabela Plataforma Pirâmides & Fivela (Branca) — R$ 150,00
  {
    id: "prod-ig-21-anabela-piramides-branca",
    sku: "PTS-IG-21",
    name: "Anabela Plataforma Pir\xE2mides & Fivela (Branca)",
    subtitle: "Edi\xE7\xE3o Branca com Tachas Piramidais Douradas & Bico Quadrado Moderno",
    category: "Anabelas & Plataformas",
    price: 150,
    image: "/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg",
    gallery: [
      "/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C4Tc5OnpB_L/",
    heelOptions: ["Anabela Alta 9,5cm (Meia Pata 3,5cm)", "Anabela M\xE9dia 7,5cm"],
    strapFinishes: ["Pir\xE2mides Douradas & Fivela Ouro", "Pir\xE2mides Prata & Fivela Cromada"],
    colors: buildStandardColors2("Branco", "/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg", {
      Branco: "/instagram/feed_8_C4Tc5OnpB_L_slide_5.jpg",
      Preto: "/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg",
      Nude: "/instagram/feed_8_C4Tc5OnpB_L_slide_2.jpg",
      Prata: "/instagram/feed_8_C4Tc5OnpB_L_slide_3.jpg",
      Dourado: "/instagram/feed_8_C4Tc5OnpB_L_slide_4.jpg"
    }),
    availableSizes: STANDARD_SIZES2,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Destaque especial do carrossel @petersonshoes_! A Anabela Plataforma Branca com pir\xE2mides douradas valoriza produ\xE7\xF5es diurnas e noturnas com m\xE1ximo conforto.",
    craftDetails: [
      "Fabrica\xE7\xE3o pr\xF3pria em Goi\xE2nia - GO sob encomenda (34 ao 39 BR)",
      "8 cores padr\xE3o + op\xE7\xE3o Outra Cor personalizada",
      "Entrada de 50% (R$ 75,00 no Pix) + 50% somente quando estiver pronta"
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  // 22. POST 8 Slide 7 — Anabela Plataforma Pirâmides Gladiadora (Nude Rosé) — R$ 150,00
  {
    id: "prod-ig-22-anabela-gladiadora-nude",
    sku: "PTS-IG-22",
    name: "Anabela Plataforma Pir\xE2mides Gladiadora (Nude Ros\xE9)",
    subtitle: "Anabela Bico Quadrado Nude Ros\xE9 com Pir\xE2mides Douradas & Amarra\xE7\xE3o na Perna",
    category: "Anabelas & Plataformas",
    price: 150,
    image: "/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg",
    gallery: [
      "/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_6.jpg",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_8.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C4Tc5OnpB_L/",
    heelOptions: ["Anabela Alta 9,5cm (Meia Pata 3,5cm)", "Anabela M\xE9dia 7,5cm"],
    strapFinishes: ["Pir\xE2mides Douradas & Ponteiras Ouro", "Pir\xE2mides Prata & Ponteiras Prata"],
    colors: buildStandardColors2("Nude", "/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg", {
      Nude: "/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg",
      Rosa: "/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg",
      Dourado: "/instagram/feed_8_C4Tc5OnpB_L_slide_6.jpg",
      Prata: "/instagram/feed_8_C4Tc5OnpB_L_slide_8.jpg"
    }),
    availableSizes: STANDARD_SIZES2,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Delicada e imponente! Anabela Plataforma Pir\xE2mides Gladiadora na cor Nude Ros\xE9 com amarra\xE7\xE3o lace-up macia no tornozelo.",
    craftDetails: [
      "Produzida sob encomenda na numera\xE7\xE3o 34 ao 39 BR em at\xE9 15 dias",
      "Dispon\xEDvel em Nude, Rosa, Dourado, Prata, Preto, Branco, Marsala, Vermelho ou Outra Cor",
      "Valor R$ 150,00 \xB7 Entrada de 50% (R$ 75,00) + 50% na entrega"
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  // 23. POST 8 Slide 8 — Anabela Plataforma Pirâmides Gladiadora (Prata) — R$ 150,00
  {
    id: "prod-ig-23-anabela-gladiadora-prata",
    sku: "PTS-IG-23",
    name: "Anabela Plataforma Pir\xE2mides Gladiadora (Prata)",
    subtitle: "Anabela Metalizada Prata com Tachas Piramidais & Amarra\xE7\xE3o Gladiadora",
    category: "Anabelas & Plataformas",
    price: 150,
    image: "/instagram/feed_8_C4Tc5OnpB_L_slide_8.jpg",
    gallery: [
      "/instagram/feed_8_C4Tc5OnpB_L_slide_8.jpg",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_6.jpg",
      "/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C4Tc5OnpB_L/",
    heelOptions: ["Anabela Alta 9,5cm (Meia Pata 3,5cm)", "Anabela M\xE9dia 7,5cm"],
    strapFinishes: ["Pir\xE2mides Prata & Ponteiras Prata", "Pir\xE2mides Douradas & Ponteiras Ouro"],
    colors: buildStandardColors2("Prata", "/instagram/feed_8_C4Tc5OnpB_L_slide_8.jpg", {
      Prata: "/instagram/feed_8_C4Tc5OnpB_L_slide_8.jpg",
      Dourado: "/instagram/feed_8_C4Tc5OnpB_L_slide_6.jpg",
      Nude: "/instagram/feed_8_C4Tc5OnpB_L_slide_7.jpg"
    }),
    availableSizes: STANDARD_SIZES2,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Edi\xE7\xE3o Prata Metalizada da nossa Anabela Plataforma Gladiadora @petersonshoes_! Perfeita para quem busca altura com estabilidade e brilho.",
    craftDetails: [
      "Meia pata frontal confort\xE1vel e amarra\xE7\xE3o ajust\xE1vel",
      "Confeccionada sob encomenda do 34 ao 39 BR em Goi\xE2nia - GO",
      "Entrada de 50% (R$ 75,00 no Pix) + 50% quando ficar pronta"
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  // 24. POST 9 Slide 2 — Papete Flatform Tratorada Strass & Amarração (Preta Onix) — R$ 130,00
  {
    id: "prod-ig-24-papete-tratorada-preta",
    sku: "PTS-IG-24",
    name: "Papete Flatform Tratorada Strass & Amarra\xE7\xE3o (Preta)",
    subtitle: "Solado Tratorado Preto com Vira de Strass Cristal & Amarra\xE7\xE3o N\xF3 Central",
    category: "Flatforms & Papetes",
    price: 130,
    image: "/instagram/feed_9_C4Tc1qCpAdX_slide_2.jpg",
    gallery: [
      "/instagram/feed_9_C4Tc1qCpAdX_slide_2.jpg",
      "/instagram/feed_9_C4Tc1qCpAdX_slide_1.jpg",
      "/instagram/feed_9_C4Tc1qCpAdX_slide_3.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C4Tc1qCpAdX/",
    heelOptions: ["Flatform Tratorada 4cm", "Flatform Anat\xF4mica 3cm"],
    strapFinishes: ["Strass Cristal & Vira Cravejada", "Strass Grafite Onix"],
    colors: buildStandardColors2("Preto", "/instagram/feed_9_C4Tc1qCpAdX_slide_2.jpg", {
      Preto: "/instagram/feed_9_C4Tc1qCpAdX_slide_2.jpg",
      Branco: "/instagram/feed_9_C4Tc1qCpAdX_slide_1.jpg",
      Dourado: "/instagram/feed_9_C4Tc1qCpAdX_slide_3.jpg"
    }),
    availableSizes: STANDARD_SIZES2,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Destaque em preto com strass cristal do nosso Instagram @petersonshoes_! Papete Flatform Tratorada com amarra\xE7\xE3o que abra\xE7a o p\xE9 com firmeza e maciez.",
    craftDetails: [
      "Solado tratorado contornado por filete de strass brilhante",
      "Dispon\xEDvel do 34 ao 39 BR em todas as cores padr\xE3o ou cor personalizada",
      "Valor R$ 130,00 \xB7 Entrada de 50% (R$ 65,00 no Pix) + 50% quando ficar pronta"
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  // 25. POST 9 Slide 3 — Papete Flatform Tratorada Strass & Amarração (Dourada) — R$ 130,00
  {
    id: "prod-ig-25-papete-tratorada-dourada",
    sku: "PTS-IG-25",
    name: "Papete Flatform Tratorada Strass & Amarra\xE7\xE3o (Dourada)",
    subtitle: "Edi\xE7\xE3o Dourada Metalizada com Tiras Duplas de Strass & Solado Tratorado",
    category: "Flatforms & Papetes",
    price: 130,
    image: "/instagram/feed_9_C4Tc1qCpAdX_slide_3.jpg",
    gallery: [
      "/instagram/feed_9_C4Tc1qCpAdX_slide_3.jpg",
      "/instagram/feed_9_C4Tc1qCpAdX_slide_1.jpg",
      "/instagram/feed_9_C4Tc1qCpAdX_slide_2.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C4Tc1qCpAdX/",
    heelOptions: ["Flatform Tratorada 4cm", "Flatform Anat\xF4mica 3cm"],
    strapFinishes: ["Strass Dourado & Vira Cravejada", "Strass Cristal"],
    colors: buildStandardColors2("Dourado", "/instagram/feed_9_C4Tc1qCpAdX_slide_3.jpg", {
      Dourado: "/instagram/feed_9_C4Tc1qCpAdX_slide_3.jpg",
      Branco: "/instagram/feed_9_C4Tc1qCpAdX_slide_1.jpg",
      Preto: "/instagram/feed_9_C4Tc1qCpAdX_slide_2.jpg"
    }),
    availableSizes: STANDARD_SIZES2,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Vers\xE3o Dourada da Papete Tratorada Strass @petersonshoes_! Confeccionada sob encomenda na numera\xE7\xE3o 34 ao 39 em nossa f\xE1brica pr\xF3pria em Goi\xE2nia - GO.",
    craftDetails: [
      "Tiras frontais em manta de strass com amarra\xE7\xE3o ajust\xE1vel",
      "Dispon\xEDvel nas 8 cores padr\xE3o ou na cor personalizada que voc\xEA digitar",
      "Entrada de 50% (R$ 65,00 no Pix) + 50% somente na conclus\xE3o"
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  // 26. POST 10 Slide 2 — Flatform Gladiadora Tiras Cruzadas Strass (Branca & Prata) — R$ 130,00
  {
    id: "prod-ig-26-flatform-gladiadora-branca",
    sku: "PTS-IG-26",
    name: "Flatform Gladiadora Tiras Cruzadas Strass (Branca & Prata)",
    subtitle: "Flatform Gladiadora Branca com Tiras Finas em Strass Cristal & Vira Cravejada",
    category: "Flatforms & Papetes",
    price: 130,
    image: "/instagram/feed_10_C4Tcs31JPdl_slide_2.jpg",
    gallery: [
      "/instagram/feed_10_C4Tcs31JPdl_slide_2.jpg",
      "/instagram/feed_10_C4Tcs31JPdl_slide_1.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C4Tcs31JPdl/",
    heelOptions: ["Flatform Anat\xF4mica 3,5cm", "Flatform Conforto 2,5cm"],
    strapFinishes: ["Strass Prata Cristal & Vira Brilhante", "Strass Dourado"],
    colors: buildStandardColors2("Branco", "/instagram/feed_10_C4Tcs31JPdl_slide_2.jpg", {
      Branco: "/instagram/feed_10_C4Tcs31JPdl_slide_2.jpg",
      Prata: "/instagram/feed_10_C4Tcs31JPdl_slide_2.jpg",
      Dourado: "/instagram/feed_10_C4Tcs31JPdl_slide_1.jpg"
    }),
    availableSizes: STANDARD_SIZES2,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Edi\xE7\xE3o Branca & Prata Cristal da nossa Flatform Gladiadora Tiras Cruzadas @petersonshoes_! Delicada, iluminada e super confort\xE1vel.",
    craftDetails: [
      "Fabrica\xE7\xE3o pr\xF3pria sob encomenda em at\xE9 15 dias (34 ao 39 BR)",
      "Escolha Branco, Prata, Dourado ou qualquer outra cor personalizada",
      "Valor R$ 130,00 \xB7 Entrada de 50% (R$ 65,00 no Pix) + 50% quando ficar pronta"
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  // 27. POST 11 Slide 2 — Papete Flatform Espelhada Tiras Strass (Dourado Champagne) — R$ 130,00
  {
    id: "prod-ig-27-papete-espelhada-dourada",
    sku: "PTS-IG-27",
    name: "Papete Flatform Espelhada Tiras Strass (Dourado Champagne)",
    subtitle: "Palmilha Espelhada Champagne com Tiras Transpassadas em Strass & Fivela",
    category: "Flatforms & Papetes",
    price: 130,
    image: "/instagram/feed_11_C4TcpFaJ9ll_slide_2.jpg",
    gallery: [
      "/instagram/feed_11_C4TcpFaJ9ll_slide_2.jpg",
      "/instagram/feed_11_C4TcpFaJ9ll_slide_1.jpg"
    ],
    instagramPostUrl: "https://www.instagram.com/p/C4TcpFaJ9ll/",
    heelOptions: ["Flatform Espelhada 3,5cm", "Flatform Conforto 2,5cm"],
    strapFinishes: ["Strass Champagne & Fivela Ouro", "Strass Cristal & Fivela Prata"],
    colors: buildStandardColors2("Dourado", "/instagram/feed_11_C4TcpFaJ9ll_slide_2.jpg", {
      Dourado: "/instagram/feed_11_C4TcpFaJ9ll_slide_2.jpg",
      Prata: "/instagram/feed_11_C4TcpFaJ9ll_slide_1.jpg"
    }),
    availableSizes: STANDARD_SIZES2,
    productionDays: 15,
    featured: false,
    active: true,
    description: "Edi\xE7\xE3o Dourado Champagne da Papete Flatform Espelhada @petersonshoes_! Tiras sinuosas cravejadas de strass sobre o peito do p\xE9 e fivela delicada no tornozelo.",
    craftDetails: [
      "Produzida sob medida na numera\xE7\xE3o 34 ao 39 BR em Goi\xE2nia - GO",
      "Dispon\xEDvel em todas as cores padr\xE3o ou outra cor personalizada",
      "Entrada de 50% (R$ 65,00 no Pix) + 50% somente quando estiver pronta"
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  }
];
async function createMercadoPagoPixPayment(params) {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (params.liveEnabled && token && token !== "MY_MERCADO_PAGO_ACCESS_TOKEN") {
    try {
      const cleanCpf = params.payerCpf.replace(/\D/g, "");
      const nameParts = params.payerName.trim().split(/\s+/);
      const firstName = nameParts[0] || "Cliente";
      const lastName = nameParts.slice(1).join(" ") || "PetersonShoes";
      const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": crypto.randomUUID()
        },
        body: JSON.stringify({
          transaction_amount: Number(params.amount.toFixed(2)),
          description: params.description,
          payment_method_id: "pix",
          external_reference: params.externalReference,
          payer: {
            email: params.payerEmail || "cliente@petersonshoes.com.br",
            first_name: firstName,
            last_name: lastName,
            ...cleanCpf.length === 11 ? {
              identification: {
                type: "CPF",
                number: cleanCpf
              }
            } : {}
          }
        })
      });
      if (mpRes.ok) {
        const mpData = await mpRes.json();
        const qrCode = mpData?.point_of_interaction?.transaction_data?.qr_code || generateMercadoPagoPixPayload(params.amount, params.externalReference, params.pixKey);
        return {
          pixCopyPaste: qrCode,
          mpReferenceId: `MP-LIVE-${mpData.id || Date.now()}`,
          sandboxMode: false
        };
      }
    } catch (err) {
      console.error("Aviso: Falha ao chamar API Mercado Pago ao vivo, usando BRCode Pix direto:", err);
    }
  }
  return {
    pixCopyPaste: generateMercadoPagoPixPayload(
      params.amount,
      params.externalReference,
      params.pixKey
    ),
    mpReferenceId: `MP-PIX-${Date.now().toString().slice(-7)}`,
    sandboxMode: !params.liveEnabled
  };
}
function createInitialDatabase() {
  const order1Date = new Date(Date.now() - 6 * 864e5).toISOString();
  const order1Est = addDaysISO(9);
  const order2Date = new Date(Date.now() - 14 * 864e5).toISOString();
  const order2Est = addDaysISO(1);
  const settings = {
    storeName: "PETERSON SHOES",
    instagramUrl: "https://www.instagram.com/petersonshoes_/",
    whatsappStore: process.env.WHATSAPP_STORE_NUMBER || "5562984998265",
    whatsappFactory: process.env.WHATSAPP_FACTORY_NUMBER || "5562984998265",
    productionDays: 15,
    depositPercentage: 50,
    creditCardFeePercentage: 4.99,
    mercadoPagoLiveEnabled: process.env.MERCADO_PAGO_LIVE_CHARGES_ENABLED === "true",
    pixKey: "50.789.636/0001-32",
    pixKeyType: "CNPJ",
    bankName: "Inter",
    bankHolderName: "50789636 JACKELINE GOMES PETERSON",
    bankHolderDoc: "50.789.636/0001-32",
    bankAgency: "",
    bankAccount: "",
    cardPaymentLink: ""
  };
  const customers = [
    {
      id: "cust-1",
      name: "Carolina Mendon\xE7a",
      email: "carolina.mendonca@email.com.br",
      whatsapp: "(62) 99412-8831",
      cpf: "348.912.408-22",
      cep: "74150-040",
      street: "Av. T-63",
      number: "1420",
      complement: "Apto 82",
      neighborhood: "Setor Bueno",
      city: "Goi\xE2nia",
      state: "GO",
      totalOrders: 1,
      totalSpent: 130,
      createdAt: order1Date
    },
    {
      id: "cust-2",
      name: "Juliana Vasconcelos",
      email: "juliana.vasc@email.com.br",
      whatsapp: "(62) 98731-5509",
      cpf: "129.845.307-10",
      cep: "74810-100",
      street: "Rua 1136",
      number: "615",
      complement: "Casa 2",
      neighborhood: "Setor Marista",
      city: "Goi\xE2nia",
      state: "GO",
      totalOrders: 1,
      totalSpent: 150,
      createdAt: order2Date
    }
  ];
  const payments = [
    {
      id: "pay-1a",
      orderId: "ord-1001",
      orderCode: "PTS-2026-101",
      installmentType: "ENTRADA_50",
      method: "PIX_MERCADO_PAGO",
      baseAmount: 65,
      feeAmount: 0,
      installments: 1,
      amount: 65,
      status: "APROVADO",
      pixCopyPaste: generateMercadoPagoPixPayload(65, "PTS2026101E", settings.pixKey),
      mpReferenceId: "MP-PIX-9841201",
      sandboxMode: true,
      paidAt: order1Date,
      createdAt: order1Date
    },
    {
      id: "pay-1b",
      orderId: "ord-1001",
      orderCode: "PTS-2026-101",
      installmentType: "FINAL_50",
      method: "PIX_MERCADO_PAGO",
      baseAmount: 65,
      feeAmount: 0,
      installments: 1,
      amount: 65,
      status: "PENDENTE",
      pixCopyPaste: generateMercadoPagoPixPayload(65, "PTS2026101F", settings.pixKey),
      mpReferenceId: "MP-PIX-9841202",
      sandboxMode: true,
      paidAt: null,
      createdAt: order1Date
    },
    {
      id: "pay-2a",
      orderId: "ord-1002",
      orderCode: "PTS-2026-102",
      installmentType: "ENTRADA_50",
      method: "CARTAO_MERCADO_PAGO",
      baseAmount: 75,
      feeAmount: 3.74,
      installments: 2,
      cardBrand: "Mastercard",
      cardLast4: "4829",
      amount: 78.74,
      status: "APROVADO",
      pixCopyPaste: generateMercadoPagoPixPayload(75, "PTS2026102E", settings.pixKey),
      mpReferenceId: "MP-CARD-9840911",
      sandboxMode: true,
      paidAt: order2Date,
      createdAt: order2Date
    },
    {
      id: "pay-2b",
      orderId: "ord-1002",
      orderCode: "PTS-2026-102",
      installmentType: "FINAL_50",
      method: "PIX_MERCADO_PAGO",
      baseAmount: 75,
      feeAmount: 0,
      installments: 1,
      amount: 75,
      status: "PENDENTE",
      pixCopyPaste: generateMercadoPagoPixPayload(75, "PTS2026102F", settings.pixKey),
      mpReferenceId: "MP-PIX-9840912",
      sandboxMode: true,
      paidAt: null,
      createdAt: order2Date
    }
  ];
  const orders = [
    {
      id: "ord-1001",
      orderCode: "PTS-2026-101",
      customerId: "cust-1",
      customerName: "Carolina Mendon\xE7a",
      customerWhatsapp: "(62) 99412-8831",
      customerEmail: "carolina.mendonca@email.com.br",
      customerCpf: "348.912.408-22",
      shippingAddress: "Av. T-63, 1420, Apto 82 - Setor Bueno, Goi\xE2nia/GO - CEP 74150-040",
      items: [
        {
          productId: "prod-ig-01-papete-piramides",
          sku: "PTS-IG-01",
          name: "Papete Flatform Pir\xE2mides & Fivela (Dourada)",
          image: "/instagram/feed_1_C454LXbOzrn_slide_1.jpg",
          unitPrice: 130,
          quantity: 1,
          size: 37,
          colorName: "Dourado",
          colorHex: "#D4AF37",
          customization: {
            heelOption: "Flatform Anat\xF4mica 3,5cm",
            strapFinish: "Pir\xE2mides Douradas & Fivela Ouro",
            footWidth: "Padr\xE3o",
            insoleEngraving: "C.M.",
            customNotes: "Favor deixar a tira do tornozelo com 1 furo extra."
          }
        }
      ],
      totalAmount: 130,
      depositAmount: 65,
      remainingAmount: 65,
      paymentStatus: "ENTRADA_50_PAGA",
      productionStatus: "MONTAGEM_ARTESANAL",
      estimatedDeliveryDate: order1Est,
      productionDays: 15,
      factoryNotes: "Material dourado metalizado separado. Montagem da flatform com pir\xE2mides em andamento.",
      trackingCode: "",
      createdAt: order1Date,
      updatedAt: order1Date
    },
    {
      id: "ord-1002",
      orderCode: "PTS-2026-102",
      customerId: "cust-2",
      customerName: "Juliana Vasconcelos",
      customerWhatsapp: "(62) 98731-5509",
      customerEmail: "juliana.vasc@email.com.br",
      customerCpf: "129.845.307-10",
      shippingAddress: "Rua 1136, 615, Casa 2 - Setor Marista, Goi\xE2nia/GO - CEP 74810-100",
      items: [
        {
          productId: "prod-ig-02-anabela-piramides-fivela",
          sku: "PTS-IG-02",
          name: "Anabela Plataforma Pir\xE2mides & Fivela (Preta)",
          image: "/instagram/feed_8_C4Tc5OnpB_L_slide_1.jpg",
          unitPrice: 150,
          quantity: 1,
          size: 36,
          colorName: "Preto",
          colorHex: "#1B191A",
          customization: {
            heelOption: "Anabela Alta 9,5cm (Meia Pata 3,5cm)",
            strapFinish: "Pir\xE2mides Douradas & Fivela Ouro",
            footWidth: "P\xE9 Fino (Mais Justa)",
            insoleEngraving: "J.V.",
            customNotes: "Encomenda para evento no final do m\xEAs."
          }
        }
      ],
      totalAmount: 150,
      depositAmount: 75,
      remainingAmount: 75,
      paymentStatus: "AGUARDANDO_FINAL_50",
      productionStatus: "PRONTA_PARA_ENTREGA",
      estimatedDeliveryDate: order2Est,
      productionDays: 15,
      factoryNotes: "Sand\xE1lia Anabela Pir\xE2mides finalizada e revisada! Aguardando pagamento dos 50% finais da cliente (Pix ou Cart\xE3o).",
      trackingCode: "",
      createdAt: order2Date,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  ];
  return {
    products: INITIAL_PRODUCTS,
    customers,
    orders,
    payments,
    settings
  };
}
function getDbFilePath(env) {
  return env === "homologacao" ? DB_FILE_HOMOLOG : DB_FILE_PROD;
}
function loadDb(env = "producao") {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const targetFile = getDbFilePath(env);
  if (!fs.existsSync(targetFile)) {
    if (fs.existsSync(BUNDLED_DB_FILE)) {
      try {
        fs.copyFileSync(BUNDLED_DB_FILE, targetFile);
      } catch {
      }
    }
    if (!fs.existsSync(targetFile)) {
      const initial = createInitialDatabase();
      fs.writeFileSync(targetFile, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }
  }
  try {
    const raw = fs.readFileSync(targetFile, "utf-8");
    const parsed = JSON.parse(raw);
    const needsUpgrade = !parsed.products || parsed.products.length < 46 || parsed.products[0]?.price !== 130 || parsed.settings?.whatsappStore !== "5562984998265" || parsed.products[0]?.availableSizes?.includes(33) || !parsed.products[0]?.colors?.some((c) => c.name === "Marsala");
    if (needsUpgrade) {
      const upgraded = createInitialDatabase();
      fs.writeFileSync(targetFile, JSON.stringify(upgraded, null, 2), "utf-8");
      return upgraded;
    }
    parsed.settings = {
      ...parsed.settings,
      bankName: "Inter",
      bankHolderName: "50789636 JACKELINE GOMES PETERSON",
      bankHolderDoc: "50.789.636/0001-32",
      pixKeyType: "CNPJ",
      pixKey: "50.789.636/0001-32"
    };
    return parsed;
  } catch (err) {
    console.error(`Erro ao ler banco de dados (${env}), recriando estado inicial:`, err);
    const initial = createInitialDatabase();
    fs.writeFileSync(targetFile, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }
}
function saveDb(data, env = "producao") {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const targetFile = getDbFilePath(env);
  fs.writeFileSync(targetFile, JSON.stringify(data, null, 2), "utf-8");
}
var activeAdminSessions = /* @__PURE__ */ new Map();
var loginRateLimiter = /* @__PURE__ */ new Map();
function loadStoredAdminCredentials() {
  try {
    if (fs.existsSync(ADMIN_AUTH_FILE)) {
      const raw = fs.readFileSync(ADMIN_AUTH_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && parsed.passwordHash && parsed.salt) {
        return parsed;
      }
    }
  } catch {
  }
  return null;
}
function hasEnvAdminPassword() {
  const envPass = (process.env.ADMIN_PASSWORD || "").trim();
  return envPass.length >= 6;
}
function isAdminConfigured() {
  return hasEnvAdminPassword() || Boolean(loadStoredAdminCredentials());
}
function hashPasswordWithSalt(password, saltHex) {
  return crypto.scryptSync(password, Buffer.from(saltHex, "hex"), 64).toString("hex");
}
function verifyAdminCredentials(emailInput, passwordInput) {
  const cleanPassword = String(passwordInput || "");
  const cleanEmail = String(emailInput || "").trim().toLowerCase();
  if (!cleanPassword) {
    return { ok: false, email: "" };
  }
  if (hasEnvAdminPassword()) {
    const expectedPass = String(process.env.ADMIN_PASSWORD).trim();
    const expectedEmail = (process.env.ADMIN_EMAIL || "contato@petersonshoes.com.br").trim().toLowerCase();
    const passBufA = Buffer.from(cleanPassword);
    const passBufB = Buffer.from(expectedPass);
    const passMatches = passBufA.length === passBufB.length && crypto.timingSafeEqual(passBufA, passBufB);
    const emailMatches = !cleanEmail || cleanEmail === expectedEmail;
    return {
      ok: passMatches && emailMatches,
      email: expectedEmail
    };
  }
  const stored = loadStoredAdminCredentials();
  if (stored) {
    const computedHash = hashPasswordWithSalt(cleanPassword, stored.salt);
    const bufA = Buffer.from(computedHash, "hex");
    const bufB = Buffer.from(stored.passwordHash, "hex");
    const passMatches = bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
    const emailMatches = !cleanEmail || cleanEmail === stored.email.toLowerCase();
    return {
      ok: passMatches && emailMatches,
      email: stored.email
    };
  }
  return { ok: false, email: "" };
}
function issueAdminSessionToken(email) {
  const token = crypto.randomBytes(32).toString("hex");
  activeAdminSessions.set(token, {
    email,
    expiresAt: Date.now() + 12 * 60 * 60 * 1e3
  });
  return token;
}
function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "N\xE3o autorizado: Token administrativo ausente." });
  }
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    return res.status(401).json({ error: "N\xE3o autorizado: Token administrativo vazio." });
  }
  const session = activeAdminSessions.get(token);
  if (!session) {
    return res.status(401).json({ error: "Sess\xE3o administrativa inv\xE1lida ou expirada. Fa\xE7a login novamente." });
  }
  if (Date.now() > session.expiresAt) {
    activeAdminSessions.delete(token);
    return res.status(401).json({ error: "Sess\xE3o administrativa expirada. Fa\xE7a login novamente." });
  }
  next();
}
var app = express();
app.use(express.json({ limit: "12mb" }));
app.use((req, _res, next) => {
  const rewrittenPath = req.query?.__path;
  if (typeof rewrittenPath === "string" && rewrittenPath.length > 0) {
    const cleanTarget = `/api/${rewrittenPath.replace(/^\/+/, "")}`;
    if (!req.url.startsWith(cleanTarget)) {
      const qIndex = req.url.indexOf("?");
      const rawQuery = qIndex >= 0 ? req.url.slice(qIndex + 1) : "";
      const params = new URLSearchParams(rawQuery);
      params.delete("__path");
      const qs = params.toString();
      req.url = `${cleanTarget}${qs ? `?${qs}` : ""}`;
    }
  }
  next();
});
function registerApiRoutes() {
  loadDb("producao");
  loadDb("homologacao");
  const resolveBaseUrl = (req) => {
    if (process.env.APP_URL) {
      return process.env.APP_URL.replace(/\/+$/, "");
    }
    const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host || "ais-pre-hjb47jbbnfvcnibk2wkogq-443983653592.us-east1.run.app";
    return `${proto.split(",")[0].trim()}://${host.split(",")[0].trim()}`;
  };
  app.get(["/robots.txt", "/api/robots.txt"], (req, res) => {
    const baseUrl = resolveBaseUrl(req);
    const robotsTxt = [
      "User-agent: *",
      "Allow: /",
      "Disallow: /api/admin/",
      "",
      `Sitemap: ${baseUrl}/sitemap.xml`,
      ""
    ].join("\n");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.send(robotsTxt);
  });
  app.get(["/sitemap.xml", "/api/sitemap.xml"], (req, res) => {
    const baseUrl = resolveBaseUrl(req);
    const db = loadDb();
    const activeProducts = db.products.filter((p) => p.active);
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const escapeXml = (str) => String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
    const productUrlsXml = activeProducts.map((p) => {
      const imageFullUrl = p.image.startsWith("http") ? p.image : `${baseUrl}${p.image.startsWith("/") ? "" : "/"}${p.image}`;
      return `  <url>
    <loc>${escapeXml(`${baseUrl}/?modelo=${encodeURIComponent(p.sku)}`)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <image:image>
      <image:loc>${escapeXml(imageFullUrl)}</image:loc>
      <image:title>${escapeXml(`${p.name} - Peterson Shoes Goi\xE2nia`)}</image:title>
      <image:caption>${escapeXml(`${p.subtitle} | Numera\xE7\xE3o 34 ao 39 BR | R$ ${p.price.toFixed(2)}`)}</image:caption>
    </image:image>
  </url>`;
    }).join("\n");
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${escapeXml(`${baseUrl}/`)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${escapeXml(`${baseUrl}/?categoria=Flatforms+%26+Papetes`)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${escapeXml(`${baseUrl}/?categoria=Anabelas+%26+Plataformas`)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${escapeXml(`${baseUrl}/?categoria=Rasteiras+%26+Gladiadoras`)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
${productUrlsXml}
</urlset>`;
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.send(xml);
  });
  app.get("/api/products", (req, res) => {
    const env = resolveEnv(req);
    const db = loadDb(env);
    const activeProducts = db.products.filter((p) => p.active);
    res.json(activeProducts);
  });
  app.get("/api/settings", (req, res) => {
    const env = resolveEnv(req);
    const db = loadDb(env);
    res.json({
      ...db.settings,
      creditCardFeePercentage: db.settings.creditCardFeePercentage ?? 4.99,
      supabaseConfigured: Boolean(
        process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
      ),
      mercadoPagoTokenConfigured: Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN),
      environment: env
    });
  });
  app.post("/api/orders", async (req, res) => {
    try {
      const env = resolveEnv(req);
      const db = loadDb(env);
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
        items
      } = req.body;
      if (!customerName || !customerWhatsapp || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          error: "Por favor, preencha nome, WhatsApp e adicione ao menos uma sand\xE1lia."
        });
      }
      const totalAmount = items.reduce(
        (acc, item) => acc + Number(item.unitPrice) * Number(item.quantity),
        0
      );
      const depositAmount = Math.round(totalAmount * 0.5 * 100) / 100;
      const remainingAmount = Math.round((totalAmount - depositAmount) * 100) / 100;
      let customer = db.customers.find(
        (c) => customerCpf && c.cpf.replace(/\D/g, "") === String(customerCpf).replace(/\D/g, "") || c.whatsapp.replace(/\D/g, "") === String(customerWhatsapp).replace(/\D/g, "")
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
          email: customerEmail || "",
          whatsapp: customerWhatsapp,
          cpf: customerCpf || "",
          cep: cep || "",
          street: street || "",
          number: number || "",
          complement: complement || "",
          neighborhood: neighborhood || "",
          city: city || "",
          state: state || "",
          totalOrders: 1,
          totalSpent: totalAmount,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        db.customers.unshift(customer);
      }
      const orderNumber = 101 + db.orders.length;
      const orderCode = env === "homologacao" ? `PTS-HML-${orderNumber}` : `PTS-2026-${orderNumber}`;
      const orderId = `ord-${Date.now()}`;
      const productionDays = db.settings.productionDays || 15;
      const estimatedDeliveryDate = addDaysISO(productionDays);
      const shippingAddress = `${street}, ${number}${complement ? ` (${complement})` : ""} - ${neighborhood}, ${city}/${state} - CEP ${cep}`;
      const allowLiveCharges = env === "producao" && db.settings.mercadoPagoLiveEnabled;
      const [mpDeposit, mpFinal] = await Promise.all([
        createMercadoPagoPixPayment({
          amount: depositAmount,
          description: `Peterson Shoes - Entrada 50% Pedido ${orderCode}`,
          payerEmail: customerEmail || "cliente@petersonshoes.com.br",
          payerName: customerName,
          payerCpf: customerCpf || "",
          externalReference: `${orderCode}E`,
          pixKey: db.settings.pixKey || "50.789.636/0001-32",
          liveEnabled: allowLiveCharges
        }),
        createMercadoPagoPixPayment({
          amount: remainingAmount,
          description: `Peterson Shoes - 50% Final Pedido ${orderCode}`,
          payerEmail: customerEmail || "cliente@petersonshoes.com.br",
          payerName: customerName,
          payerCpf: customerCpf || "",
          externalReference: `${orderCode}F`,
          pixKey: db.settings.pixKey || "50.789.636/0001-32",
          liveEnabled: allowLiveCharges
        })
      ]);
      const depositPayment = {
        id: `pay-${Date.now()}-1`,
        orderId,
        orderCode,
        installmentType: "ENTRADA_50",
        method: "PIX_MERCADO_PAGO",
        baseAmount: depositAmount,
        feeAmount: 0,
        installments: 1,
        amount: depositAmount,
        status: "PENDENTE",
        pixCopyPaste: mpDeposit.pixCopyPaste,
        mpReferenceId: mpDeposit.mpReferenceId,
        sandboxMode: mpDeposit.sandboxMode,
        paidAt: null,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      const finalPayment = {
        id: `pay-${Date.now()}-2`,
        orderId,
        orderCode,
        installmentType: "FINAL_50",
        method: "PIX_MERCADO_PAGO",
        baseAmount: remainingAmount,
        feeAmount: 0,
        installments: 1,
        amount: remainingAmount,
        status: "PENDENTE",
        pixCopyPaste: mpFinal.pixCopyPaste,
        mpReferenceId: mpFinal.mpReferenceId,
        sandboxMode: mpFinal.sandboxMode,
        paidAt: null,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      const newOrder = {
        id: orderId,
        orderCode,
        customerId: customer.id,
        customerName,
        customerWhatsapp,
        customerEmail: customerEmail || "",
        customerCpf: customerCpf || "",
        shippingAddress,
        items,
        totalAmount,
        depositAmount,
        remainingAmount,
        paymentStatus: "AGUARDANDO_ENTRADA_50",
        productionStatus: "AGUARDANDO_CONFIRMACAO",
        estimatedDeliveryDate,
        productionDays,
        factoryNotes: "Encomenda registrada no site. Aguardando confer\xEAncia do recebimento dos 50% de entrada no Banco Inter pela administra\xE7\xE3o.",
        trackingCode: "",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      db.orders.unshift(newOrder);
      db.payments.unshift(finalPayment, depositPayment);
      saveDb(db, env);
      res.status(201).json({
        order: {
          ...newOrder,
          payments: [depositPayment, finalPayment]
        },
        depositPayment,
        finalPayment
      });
    } catch (error) {
      console.error("Erro ao criar encomenda:", error);
      res.status(500).json({ error: "Erro interno ao registrar sua encomenda." });
    }
  });
  app.get("/api/orders/lookup", (req, res) => {
    const env = resolveEnv(req);
    const query = String(req.query.query || "").trim();
    const db = loadDb(env);
    if (!query) {
      const enriched2 = db.orders.slice(0, 10).map((o) => ({
        ...o,
        payments: db.payments.filter((p) => p.orderId === o.id)
      }));
      return res.json(enriched2);
    }
    const cleanDigits = query.replace(/\D/g, "");
    const matched = db.orders.filter((o) => {
      const codeMatch = o.orderCode.toLowerCase().includes(query.toLowerCase());
      const nameMatch = o.customerName.toLowerCase().includes(query.toLowerCase());
      const cpfMatch = cleanDigits.length >= 4 && o.customerCpf.replace(/\D/g, "").includes(cleanDigits);
      const phoneMatch = cleanDigits.length >= 4 && o.customerWhatsapp.replace(/\D/g, "").includes(cleanDigits);
      return codeMatch || nameMatch || cpfMatch || phoneMatch;
    });
    const enriched = matched.map((o) => ({
      ...o,
      payments: db.payments.filter((p) => p.orderId === o.id)
    }));
    res.json(enriched);
  });
  const handleCustomerNotifyPayment = (req, res) => {
    const env = resolveEnv(req);
    const { id } = req.params;
    const {
      installmentType,
      method,
      installments,
      feeAmount,
      totalCharged,
      cardBrand,
      cardLast4
    } = req.body;
    const db = loadDb(env);
    const order = db.orders.find((o) => o.id === id || o.orderCode === id);
    if (!order) {
      return res.status(404).json({ error: "Encomenda n\xE3o encontrada." });
    }
    const payment = db.payments.find(
      (p) => p.orderId === order.id && p.installmentType === (installmentType || "ENTRADA_50")
    );
    const chosenMethod = method || "PIX_MERCADO_PAGO";
    if (payment && payment.status !== "APROVADO") {
      payment.method = chosenMethod;
      payment.status = "PENDENTE";
      if (chosenMethod === "CARTAO_MERCADO_PAGO") {
        const baseVal = payment.baseAmount ?? (installmentType === "FINAL_50" ? order.remainingAmount : order.depositAmount);
        payment.baseAmount = baseVal;
        payment.feeAmount = typeof feeAmount === "number" ? feeAmount : 0;
        payment.installments = installments || 1;
        payment.amount = typeof totalCharged === "number" && totalCharged >= baseVal ? totalCharged : baseVal + (payment.feeAmount || 0);
        payment.cardBrand = cardBrand || "Cart\xE3o";
        payment.cardLast4 = cardLast4 || "0000";
      } else {
        const baseVal = payment.baseAmount ?? (installmentType === "FINAL_50" ? order.remainingAmount : order.depositAmount);
        payment.baseAmount = baseVal;
        payment.feeAmount = 0;
        payment.installments = 1;
        payment.amount = baseVal;
      }
    }
    const methodLabel = chosenMethod === "CARTAO_MERCADO_PAGO" ? `Cart\xE3o de Cr\xE9dito (${installments || 1}x c/ taxa do banco)` : "Pix Banco Inter";
    const parcelaLabel = installmentType === "FINAL_50" ? "50% finais" : "50% de entrada";
    order.factoryNotes = `${order.factoryNotes} | Cliente informou envio de pagamento (${parcelaLabel} via ${methodLabel}) em ${(/* @__PURE__ */ new Date()).toLocaleString("pt-BR")} \u2014 Aguardando confer\xEAncia no Banco Inter pelo Admin.`;
    order.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    saveDb(db, env);
    res.json({
      notified: true,
      message: "Aviso de pagamento registrado! O status ser\xE1 atualizado para Pago assim que a Peterson Shoes conferir o recebimento no Banco Inter.",
      order: {
        ...order,
        payments: db.payments.filter((p) => p.orderId === order.id)
      }
    });
  };
  app.post("/api/orders/:id/notify-payment", handleCustomerNotifyPayment);
  app.post("/api/orders/:id/confirm-payment", handleCustomerNotifyPayment);
  app.post("/api/webhooks/mercadopago", (req, res) => {
    try {
      const env = resolveEnv(req);
      if (env === "homologacao") {
        return res.status(200).json({ received: true, ignoredInHomologacao: true });
      }
      const webhookSecret = (process.env.MERCADO_PAGO_WEBHOOK_SECRET || "").trim();
      const providedSecret = String(
        req.headers["x-webhook-secret"] || req.query.secret || ""
      ).trim();
      if (!webhookSecret || providedSecret !== webhookSecret) {
        return res.status(401).json({ error: "Webhook n\xE3o autorizado." });
      }
      const { external_reference, installmentType } = req.body || {};
      if (external_reference) {
        const db = loadDb("producao");
        const cleanCode = String(external_reference).replace(/[EF]$/, "");
        const order = db.orders.find(
          (o) => o.orderCode.replace(/[^a-zA-Z0-9]/g, "") === cleanCode || o.orderCode === cleanCode
        );
        if (order) {
          const isFinal = String(external_reference).endsWith("F") || installmentType === "FINAL_50";
          const pay = db.payments.find(
            (p) => p.orderId === order.id && p.installmentType === (isFinal ? "FINAL_50" : "ENTRADA_50")
          );
          if (pay) {
            pay.status = "APROVADO";
            pay.paidAt = (/* @__PURE__ */ new Date()).toISOString();
          }
          if (isFinal) {
            order.paymentStatus = "QUITADO_100";
          } else {
            order.paymentStatus = "ENTRADA_50_PAGA";
            if (order.productionStatus === "AGUARDANDO_CONFIRMACAO") {
              order.productionStatus = "CORTE_MODELAGEM";
            }
          }
          order.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
          saveDb(db, "producao");
        }
      }
      res.status(200).json({ received: true });
    } catch (err) {
      res.status(200).json({ received: true });
    }
  });
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!message || !message.trim()) {
        return res.status(400).json({ error: "Mensagem vazia." });
      }
      const db = loadDb();
      const activeProducts = db.products.filter((p) => p.active);
      const catalogSummary = activeProducts.map(
        (p) => `- ${p.name} (SKU: ${p.sku} | Categoria: ${p.category}): R$ ${p.price.toFixed(2)} (Entrada de 50%: R$ ${(p.price / 2).toFixed(2)} no Pix sem taxa ou no Cart\xE3o de Cr\xE9dito com a taxa do banco + 50% quando ficar pronta). Cores: Preto, Branco, Marsala, Nude, Dourado, Prata, Vermelho, Rosa ou Outra Cor personalizada. Numera\xE7\xF5es: 34 ao 39 BR.`
      ).join("\n");
      const ordersSummary = db.orders.slice(0, 15).map(
        (o) => `- Pedido ${o.orderCode} (${o.customerName}): Status Produ\xE7\xE3o = ${o.productionStatus}, Status Pagamento = ${o.paymentStatus}, Entrega Estimada = ${o.estimatedDeliveryDate}, Total = R$ ${o.totalAmount.toFixed(2)} (Entrada 50% = R$ ${o.depositAmount.toFixed(2)}, Restante 50% = R$ ${o.remainingAmount.toFixed(2)})`
      ).join("\n");
      const systemInstruction = `Voc\xEA \xE9 a Consultora Virtual Oficial da **Peterson Shoes** (@petersonshoes_ \u2014 "Seu estilo, sua sand\xE1lia!"), marca de **Goi\xE2nia - Goi\xE1s** especializada em sand\xE1lias femininas de fabrica\xE7\xE3o pr\xF3pria feitas sob encomenda.

INFORMA\xC7\xD5ES REAIS E OBRIGAT\xD3RIAS DA LOJA:
1. **Localiza\xE7\xE3o & Fabrica\xE7\xE3o Pr\xF3pria**: Somos de **Goi\xE2nia - Goi\xE1s (GO)**, com fabrica\xE7\xE3o pr\xF3pria sob encomenda (Atacado a partir de 6 pares e Varejo). O prazo estimado de produ\xE7\xE3o \xE9 de **${db.settings.productionDays} dias**.
2. **Numera\xE7\xE3o Oficial**: Produzimos do **34 ao 39 BR** (34, 35, 36, 37, 38 e 39).
3. **Cores Padr\xE3o & Cor Personalizada**: Todos os modelos podem ser feitos nas cores padr\xE3o **Preto, Branco, Marsala, Nude, Dourado, Prata, Vermelho e Rosa**, al\xE9m da op\xE7\xE3o **"Outra Cor"** onde a cliente escreve exatamente qual cor deseja.
4. **Como Funciona o Pagamento (50% + 50% no Pix ou Cart\xE3o de Cr\xE9dito)**:
   - A cliente paga **50% de entrada da sand\xE1lia** para confirmar o pedido (sem precisar aguardar cota\xE7\xE3o de frete) e os outros **50% da sand\xE1lia na entrega**, quando estiver pronta (em 15 dias).
   - A cliente escolhe se prefere pagar os 50% no **Pix (sem taxa)** ou no **Cart\xE3o de Cr\xE9dito (em at\xE9 6x, com o acr\xE9scimo da taxa cobrada pelo banco/operadora)**.
5. **Regra de Frete e Entrega (Separado do pre\xE7o da sand\xE1lia)**:
   - Informe sempre de forma clara: **"O frete \xE9 por conta da cliente. A forma de envio e o valor da entrega ser\xE3o combinados quando a sand\xE1lia estiver pronta."**
   - Para **Goi\xE2nia e regi\xE3o**, a entrega poder\xE1 ser combinada por **Uber Moto**.
   - Para **outras cidades**, o envio poder\xE1 ser combinado pelos **Correios**, com o frete pago pela cliente antes da postagem.
   - Nunca informe frete gr\xE1tis, R$ 0,00 ou valor estimado de frete.
6. **Atendimento via WhatsApp**: O site possui bot\xF5es com link direto para o WhatsApp oficial da loja (n\xE3o exiba o n\xFAmero de telefone por extenso na mensagem; oriente a cliente a clicar no bot\xE3o "Falar no WhatsApp" da p\xE1gina) | Instagram: ${db.settings.instagramUrl}.

CAT\xC1LOGO COMPLETO DO INSTAGRAM @petersonshoes_ (${activeProducts.length} MODELOS):
${catalogSummary}

PEDIDOS EM ANDAMENTO NO SISTEMA (Caso a cliente pergunte sobre um c\xF3digo PTS-...):
${ordersSummary}

DIRETRIZES DE ESTILO:
- Responda sempre em portugu\xEAs do Brasil, com tom elegante, acolhedor, prestativo e objetivo.
- Nunca escreva o n\xFAmero de telefone no texto; convide a cliente a clicar diretamente no bot\xE3o de WhatsApp do site caso queira falar com uma atendente.
- Destaque que somos de Goi\xE2nia - Goi\xE1s com fabrica\xE7\xE3o pr\xF3pria e enviamos para todo o Brasil.
- Sempre mencione que a entrada de 50% pode ser paga no Pix (sem taxa) ou no Cart\xE3o de Cr\xE9dito (com a taxa do banco), e que todos os modelos s\xE3o feitos do 34 ao 39 nas cores Preto, Branco, Marsala, Nude, Dourado, Prata, Vermelho, Rosa ou Outra Cor escolhida pela cliente.`;
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
        return res.json({
          reply: `Ol\xE1! Sou a consultora da **Peterson Shoes (@petersonshoes_)**, direto da nossa fabrica\xE7\xE3o pr\xF3pria em **Goi\xE2nia - Goi\xE1s**. Produzimos sand\xE1lias femininas sob encomenda (numera\xE7\xE3o **34 ao 39**, prazo de **${db.settings.productionDays} dias**, com envio para todo o Brasil e entrega em Goi\xE2nia). Todos os modelos podem ser feitos nas cores **Preto, Branco, Marsala, Nude, Dourado, Prata, Vermelho, Rosa** ou em **Outra Cor** que voc\xEA escrever! Voc\xEA confirma seu pedido pagando **50% de entrada** (no **Pix sem taxa** ou no **Cart\xE3o de Cr\xE9dito com a taxa do banco**) e os outros **50% quando sua sand\xE1lia estiver pronta**. Se preferir, basta clicar no bot\xE3o de **WhatsApp** aqui abaixo para falar direto conosco! Como posso ajudar voc\xEA hoje?`
        });
      }
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      const conversationContents = [
        ...(history || []).map((msg) => ({
          role: msg.role,
          parts: [{ text: msg.text }]
        })),
        {
          role: "user",
          parts: [{ text: message }]
        }
      ];
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: conversationContents,
        config: {
          systemInstruction,
          temperature: 0.5
        }
      });
      res.json({
        reply: response.text || "Estou \xE0 disposi\xE7\xE3o para ajudar voc\xEA a escolher sua sand\xE1lia sob encomenda da Peterson Shoes."
      });
    } catch (error) {
      console.error("Erro na IA Peterson Shoes:", error);
      res.status(500).json({
        error: "N\xE3o foi poss\xEDvel processar sua pergunta no momento. Tente novamente ou clique no bot\xE3o para falar direto pelo WhatsApp."
      });
    }
  });
  app.get("/api/admin/auth-status", (_req, res) => {
    res.json({
      configured: isAdminConfigured(),
      configuredViaEnv: hasEnvAdminPassword()
    });
  });
  app.post("/api/admin/setup-credentials", (req, res) => {
    if (isAdminConfigured()) {
      return res.status(403).json({
        error: "As credenciais administrativas j\xE1 est\xE3o configuradas. Fa\xE7a login com sua senha."
      });
    }
    const { email, password } = req.body;
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanPassword = String(password || "");
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return res.status(400).json({ error: "Informe um e-mail administrativo v\xE1lido." });
    }
    if (cleanPassword.length < 8) {
      return res.status(400).json({
        error: "A senha administrativa deve ter pelo menos 8 caracteres."
      });
    }
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = hashPasswordWithSalt(cleanPassword, salt);
    const sessionSecret = crypto.randomBytes(32).toString("hex");
    const record = {
      email: cleanEmail,
      salt,
      passwordHash,
      sessionSecret,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(ADMIN_AUTH_FILE, JSON.stringify(record, null, 2), {
      encoding: "utf-8",
      mode: 384
    });
    const token = issueAdminSessionToken(cleanEmail);
    return res.status(201).json({
      token,
      adminEmail: cleanEmail
    });
  });
  app.post("/api/admin/login", (req, res) => {
    const clientIp = String(req.headers["x-forwarded-for"] || req.ip || "local");
    const now = Date.now();
    const rateRecord = loginRateLimiter.get(clientIp);
    if (rateRecord && now < rateRecord.resetAt && rateRecord.count >= 8) {
      return res.status(429).json({
        error: "Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente."
      });
    }
    if (!isAdminConfigured()) {
      return res.status(403).json({
        error: "A senha administrativa ainda n\xE3o foi configurada. Realize a configura\xE7\xE3o inicial."
      });
    }
    const { email, password } = req.body;
    const verification = verifyAdminCredentials(email || "", password || "");
    if (verification.ok) {
      loginRateLimiter.delete(clientIp);
      const token = issueAdminSessionToken(verification.email);
      return res.json({
        token,
        adminEmail: verification.email
      });
    }
    const nextCount = rateRecord && now < rateRecord.resetAt ? rateRecord.count + 1 : 1;
    loginRateLimiter.set(clientIp, {
      count: nextCount,
      resetAt: now + 10 * 60 * 1e3
    });
    return res.status(401).json({
      error: "Credenciais inv\xE1lidas. Verifique seu e-mail e senha administrativa."
    });
  });
  app.post("/api/admin/logout", (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice("Bearer ".length).trim();
      activeAdminSessions.delete(token);
    }
    res.json({ ok: true });
  });
  app.get("/api/admin/dashboard", requireAdminAuth, (req, res) => {
    const env = resolveEnv(req);
    const db = loadDb(env);
    const enrichedOrders = db.orders.map((o) => ({
      ...o,
      payments: db.payments.filter((p) => p.orderId === o.id)
    }));
    const totalOrdersVolume = db.orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalPaidAmount = db.payments.filter((p) => p.status === "APROVADO").reduce((sum, p) => sum + p.amount, 0);
    const pendingReceivables = db.payments.filter((p) => p.status === "PENDENTE").reduce((sum, p) => sum + p.amount, 0);
    res.json({
      environment: env,
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
        mercadoPagoTokenConfigured: Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN)
      },
      metrics: {
        totalOrdersCount: db.orders.length,
        totalCustomersCount: db.customers.length,
        totalProductsCount: db.products.length,
        totalOrdersVolume,
        totalPaidAmount,
        pendingReceivables,
        readyForFinalPaymentCount: db.orders.filter(
          (o) => o.productionStatus === "PRONTA_PARA_ENTREGA" && o.paymentStatus !== "QUITADO_100"
        ).length
      }
    });
  });
  app.post("/api/admin/upload-image", requireAdminAuth, (req, res) => {
    try {
      const { filename, dataUrl } = req.body;
      if (!dataUrl || !dataUrl.startsWith("data:image/")) {
        return res.status(400).json({ error: "Formato de imagem inv\xE1lido." });
      }
      const matches = dataUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (!matches) {
        return res.status(400).json({ error: "N\xE3o foi poss\xEDvel decodificar a imagem." });
      }
      const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, "base64");
      fs.mkdirSync(INSTAGRAM_PUBLIC_DIR, { recursive: true });
      const safeBase = (filename || "sandalia").replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40);
      const finalFile = `custom_${safeBase}_${Date.now()}.${ext}`;
      fs.writeFileSync(path.join(INSTAGRAM_PUBLIC_DIR, finalFile), buffer);
      return res.json({ url: `/instagram/${finalFile}` });
    } catch (err) {
      console.error("Erro ao salvar imagem enviada:", err);
      return res.status(500).json({ error: "Falha ao salvar imagem no servidor." });
    }
  });
  app.patch("/api/admin/products/:id/price", requireAdminAuth, (req, res) => {
    const env = resolveEnv(req);
    const { id } = req.params;
    const { price } = req.body;
    const numericPrice = Number(price);
    if (!numericPrice || isNaN(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({ error: "Informe um valor v\xE1lido maior que zero." });
    }
    const db = loadDb(env);
    const idx = db.products.findIndex((p) => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Modelo n\xE3o encontrado." });
    }
    db.products[idx].price = Math.round(numericPrice * 100) / 100;
    saveDb(db, env);
    return res.json(db.products[idx]);
  });
  app.post("/api/admin/products", requireAdminAuth, (req, res) => {
    const env = resolveEnv(req);
    const db = loadDb(env);
    const body = req.body;
    if (!body.name || !body.price) {
      return res.status(400).json({ error: "Nome e pre\xE7o da sand\xE1lia s\xE3o obrigat\xF3rios." });
    }
    const defaultImg = body.image || "/instagram/feed_1_C454LXbOzrn_slide_1.jpg";
    const newProduct = {
      id: `prod-${Date.now()}`,
      sku: body.sku || `PTS-IG-${Math.floor(16 + Math.random() * 80)}`,
      name: body.name,
      subtitle: body.subtitle || "Sand\xE1lia Feminina Feita Sob Encomenda",
      category: body.category || "Flatforms & Papetes",
      price: Number(body.price),
      image: defaultImg,
      gallery: Array.isArray(body.gallery) && body.gallery.length > 0 ? body.gallery : [defaultImg],
      instagramPostUrl: body.instagramPostUrl || "https://www.instagram.com/petersonshoes_/",
      heelOptions: Array.isArray(body.heelOptions) && body.heelOptions.length > 0 ? body.heelOptions : ["Flatform Anat\xF4mica 3,5cm", "Anabela 8cm"],
      strapFinishes: Array.isArray(body.strapFinishes) && body.strapFinishes.length > 0 ? body.strapFinishes : ["Metais Dourados", "Metais Prateados"],
      colors: Array.isArray(body.colors) && body.colors.length > 0 ? body.colors : buildStandardColors2("Dourado", defaultImg),
      availableSizes: Array.isArray(body.availableSizes) && body.availableSizes.length > 0 ? body.availableSizes : STANDARD_SIZES2,
      productionDays: Number(body.productionDays || 15),
      featured: Boolean(body.featured),
      active: body.active !== void 0 ? Boolean(body.active) : true,
      description: body.description || "Sand\xE1lia artesanal Peterson Shoes produzida sob encomenda com material de alta qualidade.",
      craftDetails: Array.isArray(body.craftDetails) && body.craftDetails.length > 0 ? body.craftDetails : [
        "Fabrica\xE7\xE3o pr\xF3pria sob encomenda em 15 dias (Numera\xE7\xE3o 34 ao 39)",
        "Pagamento 50% na encomenda (Pix ou Cart\xE3o) e 50% quando ficar pronta"
      ],
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.products.unshift(newProduct);
    saveDb(db, env);
    res.status(201).json(newProduct);
  });
  app.put("/api/admin/products/:id", requireAdminAuth, (req, res) => {
    const env = resolveEnv(req);
    const { id } = req.params;
    const db = loadDb(env);
    const idx = db.products.findIndex((p) => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Produto n\xE3o encontrado." });
    }
    const updated = {
      ...db.products[idx],
      ...req.body,
      id: db.products[idx].id,
      price: Number(req.body.price ?? db.products[idx].price)
    };
    db.products[idx] = updated;
    saveDb(db, env);
    res.json(updated);
  });
  app.delete("/api/admin/products/:id", requireAdminAuth, (req, res) => {
    const env = resolveEnv(req);
    const { id } = req.params;
    const db = loadDb(env);
    db.products = db.products.filter((p) => p.id !== id);
    saveDb(db, env);
    res.json({ ok: true });
  });
  app.patch("/api/admin/orders/:id", requireAdminAuth, (req, res) => {
    const env = resolveEnv(req);
    const { id } = req.params;
    const {
      productionStatus,
      paymentStatus,
      factoryNotes,
      trackingCode,
      estimatedDeliveryDate
    } = req.body;
    const db = loadDb(env);
    const order = db.orders.find((o) => o.id === id);
    if (!order) {
      return res.status(404).json({ error: "Encomenda n\xE3o encontrada." });
    }
    if (productionStatus) {
      order.productionStatus = productionStatus;
      if (productionStatus === "PRONTA_PARA_ENTREGA" && order.paymentStatus === "ENTRADA_50_PAGA") {
        order.paymentStatus = "AGUARDANDO_FINAL_50";
      }
    }
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
      const orderPayments = db.payments.filter((p) => p.orderId === order.id);
      const depositPay = orderPayments.find((p) => p.installmentType === "ENTRADA_50");
      const finalPay = orderPayments.find((p) => p.installmentType === "FINAL_50");
      if (paymentStatus === "AGUARDANDO_ENTRADA_50") {
        if (depositPay) {
          depositPay.status = "PENDENTE";
          depositPay.paidAt = null;
        }
      }
      if (paymentStatus === "ENTRADA_50_PAGA" && depositPay && depositPay.status !== "APROVADO") {
        depositPay.status = "APROVADO";
        depositPay.paidAt = (/* @__PURE__ */ new Date()).toISOString();
      }
      if (paymentStatus === "QUITADO_100") {
        if (depositPay && depositPay.status !== "APROVADO") {
          depositPay.status = "APROVADO";
          depositPay.paidAt = (/* @__PURE__ */ new Date()).toISOString();
        }
        if (finalPay && finalPay.status !== "APROVADO") {
          finalPay.status = "APROVADO";
          finalPay.paidAt = (/* @__PURE__ */ new Date()).toISOString();
        }
      }
    }
    if (factoryNotes !== void 0) order.factoryNotes = factoryNotes;
    if (trackingCode !== void 0) order.trackingCode = trackingCode;
    if (estimatedDeliveryDate !== void 0) order.estimatedDeliveryDate = estimatedDeliveryDate;
    order.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    saveDb(db, env);
    res.json({
      ...order,
      payments: db.payments.filter((p) => p.orderId === order.id)
    });
  });
  app.put("/api/admin/settings", requireAdminAuth, (req, res) => {
    const env = resolveEnv(req);
    const db = loadDb(env);
    db.settings = {
      ...db.settings,
      ...req.body,
      productionDays: Number(req.body.productionDays ?? db.settings.productionDays),
      depositPercentage: Number(req.body.depositPercentage ?? db.settings.depositPercentage),
      creditCardFeePercentage: Number(
        req.body.creditCardFeePercentage ?? db.settings.creditCardFeePercentage ?? 4.99
      )
    };
    saveDb(db, env);
    res.json(db.settings);
  });
  app.get("/api/admin/sql-schema", requireAdminAuth, (_req, res) => {
    let sqlContent = "";
    if (fs.existsSync(SQL_SCHEMA_FILE)) {
      sqlContent = fs.readFileSync(SQL_SCHEMA_FILE, "utf-8");
    }
    res.json({ sql: sqlContent });
  });
}
registerApiRoutes();
async function startServer() {
  const publicPath = path.join(process.cwd(), "public");
  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
  }
  const distPath = path.join(process.cwd(), "dist");
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Peterson Shoes Full-Stack Server running on http://localhost:${PORT}`);
  });
}
if (!IS_VERCEL) {
  startServer();
}
var server_default = app;
export {
  INITIAL_PRODUCTS2 as INITIAL_PRODUCTS,
  app,
  server_default as default
};
