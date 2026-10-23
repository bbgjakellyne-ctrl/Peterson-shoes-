-- ============================================================================
-- PETERSON SHOES — ESQUEMA COMPLETO POSTGRESQL / SUPABASE
-- Execute este script no SQL Editor do seu projeto Supabase (https://supabase.com)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE PRODUTOS (CATÁLOGO SOB ENCOMENDA)
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  image TEXT NOT NULL,
  heel_options JSONB NOT NULL DEFAULT '[]'::jsonb,
  strap_finishes JSONB NOT NULL DEFAULT '[]'::jsonb,
  colors JSONB NOT NULL DEFAULT '[]'::jsonb,
  available_sizes JSONB NOT NULL DEFAULT '[33,34,35,36,37,38,39,40]'::jsonb,
  production_days INTEGER NOT NULL DEFAULT 15,
  featured BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  description TEXT NOT NULL,
  craft_details JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABELA DE CLIENTES
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  cpf TEXT NOT NULL,
  cep TEXT NOT NULL,
  street TEXT NOT NULL,
  number TEXT NOT NULL,
  complement TEXT DEFAULT '',
  neighborhood TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  total_orders INTEGER NOT NULL DEFAULT 1,
  total_spent NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABELA DE ENCOMENDAS (PEDIDOS COM ENTRADA 50% + FINAL 50% E PRAZO 15 DIAS)
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  order_code TEXT UNIQUE NOT NULL,
  customer_id TEXT NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  customer_name TEXT NOT NULL,
  customer_whatsapp TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_cpf TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  items JSONB NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  deposit_amount NUMERIC(10, 2) NOT NULL, -- 50% para iniciar a produção
  remaining_amount NUMERIC(10, 2) NOT NULL, -- 50% quando a sandália estiver pronta
  payment_status TEXT NOT NULL DEFAULT 'AGUARDANDO_ENTRADA_50',
  -- Valores: AGUARDANDO_ENTRADA_50 | ENTRADA_50_PAGA | AGUARDANDO_FINAL_50 | QUITADO_100
  production_status TEXT NOT NULL DEFAULT 'AGUARDANDO_CONFIRMACAO',
  -- Valores: AGUARDANDO_CONFIRMACAO | CORTE_MODELAGEM | MONTAGEM_ARTESANAL | ACABAMENTO_QUALIDADE | PRONTA_PARA_ENTREGA | ENVIADA_ENTREGUE
  estimated_delivery_date DATE NOT NULL,
  production_days INTEGER NOT NULL DEFAULT 15,
  factory_notes TEXT DEFAULT '',
  tracking_code TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABELA DE PAGAMENTOS (MERCADO PAGO PIX 50% ENTRADA E 50% CONCLUSÃO)
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_code TEXT NOT NULL,
  installment_type TEXT NOT NULL, -- 'ENTRADA_50' ou 'FINAL_50'
  method TEXT NOT NULL DEFAULT 'PIX_MERCADO_PAGO',
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDENTE', -- 'PENDENTE' | 'APROVADO'
  pix_copy_paste TEXT NOT NULL,
  mp_reference_id TEXT NOT NULL,
  sandbox_mode BOOLEAN NOT NULL DEFAULT true,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. CONFIGURAÇÕES DA LOJA
CREATE TABLE IF NOT EXISTS public.store_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  store_name TEXT NOT NULL DEFAULT 'Peterson Shoes',
  instagram_url TEXT NOT NULL DEFAULT 'https://www.instagram.com/petersonshoes_/',
  whatsapp_store TEXT NOT NULL DEFAULT '5511999999999',
  whatsapp_factory TEXT NOT NULL DEFAULT '5511988888888',
  production_days INTEGER NOT NULL DEFAULT 15,
  deposit_percentage INTEGER NOT NULL DEFAULT 50,
  mercado_pago_live_enabled BOOLEAN NOT NULL DEFAULT false,
  pix_key TEXT NOT NULL DEFAULT 'financeiro@petersonshoes.com.br'
);

CREATE INDEX IF NOT EXISTS idx_orders_code ON public.orders(order_code);
CREATE INDEX IF NOT EXISTS idx_orders_whatsapp ON public.orders(customer_whatsapp);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
