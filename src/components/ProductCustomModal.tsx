import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Sparkles,
  MessageCircle,
  ShieldCheck,
  Ruler,
  ExternalLink,
  CreditCard,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { BespokeProduct, OrderItem } from '../types/peterson';
import { calculateCardInstallments, formatBRL } from '../utils/payment';
import { buildCustomerProductMessage, toWhatsAppHref } from '../utils/whatsapp';

interface ProductCustomModalProps {
  product: BespokeProduct | null;
  initialColorIdx?: number;
  initialPhotoUrl?: string;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: OrderItem) => void;
  onOpenSizeGuide: () => void;
  whatsappStore: string;
  creditCardFeePercentage?: number;
}

export const ProductCustomModal: React.FC<ProductCustomModalProps> = ({
  product,
  initialColorIdx = 0,
  initialPhotoUrl,
  isOpen,
  onClose,
  onAddToCart,
  onOpenSizeGuide,
  whatsappStore,
  creditCardFeePercentage = 4.99,
}) => {
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [customColorText, setCustomColorText] = useState('');
  const [colorError, setColorError] = useState('');
  const [activePhotoUrl, setActivePhotoUrl] = useState<string>('');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState<number>(36);
  const [heelOption, setHeelOption] = useState<string>('');
  const [strapFinish, setStrapFinish] = useState<string>('');
  const [footWidth, setFootWidth] = useState<
    'Padrão' | 'Pé Fino (Mais Justa)' | 'Pé Largo (Conforto Extra)'
  >('Padrão');
  const [insoleEngraving, setInsoleEngraving] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (product) {
      const safeIdx =
        initialColorIdx >= 0 && initialColorIdx < product.colors.length
          ? initialColorIdx
          : 0;
      setSelectedColorIdx(safeIdx);
      setCustomColorText('');
      setColorError('');
      setIsLightboxOpen(false);
      const initialColor = product.colors[safeIdx] || product.colors[0];
      setActivePhotoUrl(
        initialPhotoUrl || initialColor?.image || product.image
      );
      setSelectedSize(
        product.availableSizes.includes(36) ? 36 : product.availableSizes[0] || 36
      );
      setHeelOption(product.heelOptions[0] || 'Padrão');
      setStrapFinish(product.strapFinishes[0] || 'Metais Dourados');
      setFootWidth('Padrão');
      setInsoleEngraving('');
      setCustomNotes('');
      setQuantity(1);
    }
  }, [product, initialColorIdx, initialPhotoUrl]);

  if (!isOpen || !product) return null;

  const currentColor = product.colors[selectedColorIdx] || product.colors[0];
  const isCustomColorSelected =
    Boolean(currentColor?.isCustom) ||
    currentColor?.name.toLowerCase().includes('outra cor');

  const resolvedColorName = isCustomColorSelected
    ? customColorText.trim()
      ? `Outra Cor (${customColorText.trim()})`
      : 'Outra Cor (Personalizada)'
    : currentColor?.name || 'Padrão';

  const displayImage = activePhotoUrl || currentColor?.image || product.image;
  const galleryList =
    product.gallery && product.gallery.length > 0
      ? product.gallery
      : [product.image];

  const depositValue = product.price * 0.5;
  const remainingValue = product.price - depositValue;
  const card1xOption = calculateCardInstallments(
    depositValue,
    creditCardFeePercentage
  )[0];

  const handleSelectColor = (idx: number) => {
    setSelectedColorIdx(idx);
    setColorError('');
    const chosen = product.colors[idx];
    if (chosen?.image) {
      setActivePhotoUrl(chosen.image);
    }
  };

  const handleConfirmCustomOrder = () => {
    if (isCustomColorSelected && !customColorText.trim()) {
      setColorError(
        'Por favor, escreva qual a cor personalizada que você deseja para sua sandália.'
      );
      return;
    }

    const newItem: OrderItem = {
      productId: product.id,
      sku: product.sku,
      name: product.name,
      image: displayImage,
      unitPrice: product.price,
      quantity,
      size: selectedSize,
      colorName: resolvedColorName,
      colorHex: currentColor.hex,
      customization: {
        heelOption,
        strapFinish,
        footWidth,
        insoleEngraving: insoleEngraving.trim().toUpperCase(),
        customNotes: customNotes.trim(),
        customColorDescription: isCustomColorSelected
          ? customColorText.trim()
          : undefined,
      },
    };
    onAddToCart(newItem);
    onClose();
  };

  const whatsappMessage = buildCustomerProductMessage(
    product,
    resolvedColorName,
    selectedSize,
    heelOption
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdp-modal-title"
    >
      <div className="bg-[#FAF7F2] border border-[#E6DDD0] rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Sticky Non-Overlapping Top Bar */}
        <div className="px-6 py-4 bg-[#631421] text-[#FAF7F2] flex items-center justify-between gap-4 shrink-0 border-b border-[#4D0E18]">
          <div className="min-w-0">
            <p className="text-xs text-[#E5D3B3] truncate">
              Ateliê Sob Encomenda @petersonshoes_ · Numeração 34 ao 39 · Prazo {product.productionDays} Dias
            </p>
            <h2
              id="pdp-modal-title"
              className="font-serif-display text-xl sm:text-2xl font-semibold truncate"
            >
              {product.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#FAF7F2]/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            aria-label="Fechar configuração da sandália"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Contiguous Purchase Module */}
        <div className="overflow-y-auto flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            {/* Left Column: Real Instagram Product Imagery & Gallery */}
            <div className="lg:col-span-5 bg-[#F3EDE2] flex flex-col justify-between p-6 md:p-8 border-b lg:border-b-0 lg:border-r border-[#E6DDD0]">
              <div>
                <div
                  onClick={() => setIsLightboxOpen(true)}
                  className="aspect-4/5 w-full rounded-xl overflow-hidden bg-white border border-[#E6DDD0] shadow-xs relative group cursor-zoom-in"
                  title="Clique para ampliar a foto em tela cheia"
                >
                  <img
                    src={displayImage}
                    alt={`${product.name} - ${resolvedColorName}`}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-103"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsLightboxOpen(true);
                    }}
                    className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/65 hover:bg-black/80 text-[#FAF7F2] text-[11px] font-medium rounded-lg flex items-center gap-1.5 backdrop-blur-xs transition-colors cursor-pointer"
                  >
                    <ZoomIn className="w-3.5 h-3.5 text-[#E5D3B3]" />
                    <span>Ampliar Foto</span>
                  </button>
                </div>

                {/* Multi-Photo Instagram Carousel Thumbnails */}
                {galleryList.length > 1 && (
                  <div className="mt-3">
                    <p className="text-[11px] font-medium text-[#6E5D5F] mb-1.5">
                      Fotos reais deste modelo no Instagram @petersonshoes_ ({galleryList.length} fotos):
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {galleryList.map((imgUrl, idx) => {
                        const isSelectedThumb = displayImage === imgUrl;
                        return (
                          <button
                            key={`${imgUrl}-${idx}`}
                            type="button"
                            onClick={() => {
                              setActivePhotoUrl(imgUrl);
                            }}
                            className={`aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                              isSelectedThumb
                                ? 'border-[#631421] shadow-xs scale-102'
                                : 'border-[#E6DDD0] opacity-80 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={imgUrl}
                              alt={`${product.name} foto ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="mt-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6E5D5F]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span>{product.category}</span>
                      <span>·</span>
                      <span className="font-mono-tabular">SKU {product.sku}</span>
                    </div>
                    {product.instagramPostUrl && (
                      <a
                        href={product.instagramPostUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#631421] font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        <span>Ver post no Instagram</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <p className="mt-3 text-xs sm:text-sm text-[#3D2C30] leading-relaxed">
                    {product.description}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-[#E6DDD0]">
                <p className="text-xs font-semibold text-[#631421] tracking-wide mb-2.5">
                  Diferenciais de Fabricação Própria @petersonshoes_
                </p>
                <ul className="space-y-2 text-xs text-[#3D2C30]">
                  {product.craftDetails.map((detail, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-[#631421] shrink-0 mt-0.5" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Column: Bespoke Customization & 50%/50% Checkout */}
            <div className="lg:col-span-7 p-6 md:p-8 flex flex-col justify-between bg-[#FAF7F2]">
              <div className="space-y-5">
                {/* Price & 50% / 50% Payment Rule Box (Pix OR Credit Card with Bank Fee) */}
                <div className="p-4 sm:p-5 rounded-xl bg-[#F3EDE2] border border-[#E6DDD0]">
                  <div className="flex flex-wrap items-baseline justify-between gap-4">
                    <div>
                      <span className="text-xs text-[#6E5D5F]">Valor Total do Par</span>
                      <p className="text-2xl font-semibold text-[#1F1215] font-mono-tabular mt-0.5">
                        {formatBRL(product.price)}
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <span className="text-xs font-semibold text-[#631421]">
                        50% de Entrada (Você escolhe Pix ou Cartão)
                      </span>
                      <p className="text-2xl font-bold text-[#631421] font-mono-tabular mt-0.5">
                        {formatBRL(depositValue)} no Pix
                      </p>
                      <p className="text-[11px] text-[#6E5D5F] font-mono-tabular flex items-center sm:justify-end gap-1 mt-0.5">
                        <CreditCard className="w-3 h-3 text-[#631421]" />
                        <span>
                          ou {formatBRL(card1xOption.totalWithFee)} no Cartão (c/ taxa do banco)
                        </span>
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 pt-3 border-t border-[#E6DDD0] text-xs text-[#3D2C30] flex items-start gap-2 leading-relaxed">
                    <ShieldCheck className="w-4 h-4 text-[#631421] shrink-0 mt-0.5" />
                    <span>
                      Pague <strong>50% de entrada</strong> agora (no <strong>Pix sem taxa</strong> ou no <strong>Cartão de Crédito em até 6x</strong> com a taxa cobrada pelo banco) e os outros{' '}
                      <strong>{formatBRL(remainingValue)} (50%)</strong> somente quando sua sandália estiver pronta em {product.productionDays} dias.
                    </span>
                  </p>
                </div>

                {/* 1. Escolha da Cor (8 Cores Padrão + Outra Cor escrita pela cliente) */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-semibold text-[#1F1215]">
                      1. Escolha a Cor:{' '}
                      <span className="text-[#631421] font-bold">{resolvedColorName}</span>
                    </span>
                    <span className="text-[11px] text-[#6E5D5F]">
                      Cores padrão + opção de escrever outra cor
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color, idx) => {
                      const isSelected = idx === selectedColorIdx;
                      const isCustomOpt =
                        Boolean(color.isCustom) ||
                        color.name.toLowerCase().includes('outra cor');

                      return (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => handleSelectColor(idx)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer whitespace-nowrap ${
                            isSelected
                              ? 'border-[#631421] bg-[#631421] text-[#FAF7F2] shadow-xs'
                              : 'border-[#E6DDD0] bg-white text-[#3D2C30] hover:border-[#631421]/60'
                          }`}
                        >
                          {isCustomOpt ? (
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/25 shrink-0"
                              style={{
                                background:
                                  'conic-gradient(#D4AF37, #631421, #E07A9B, #C4C9CE, #D4AF37)',
                              }}
                            />
                          ) : (
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/25 shrink-0"
                              style={{ backgroundColor: color.hex }}
                            />
                          )}
                          <span>
                            {isCustomOpt ? 'Outra Cor (Digitar Cor)' : color.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Campo aberto quando a cliente escolhe "Outra Cor" */}
                  {isCustomColorSelected && (
                    <div className="mt-3 p-3.5 rounded-xl bg-[#F3EDE2] border border-[#631421]/40 space-y-1.5">
                      <label className="block text-xs font-bold text-[#631421]">
                        Qual cor você quer que a gente produza sua sandália? *
                      </label>
                      <input
                        type="text"
                        value={customColorText}
                        onChange={(e) => {
                          setCustomColorText(e.target.value);
                          if (colorError) setColorError('');
                        }}
                        placeholder="Escreva a cor desejada (ex: Azul Royal, Verde Esmeralda, Caramelo, Lilás...)"
                        className="w-full px-3.5 py-2.5 bg-white border border-[#D8CBB8] focus:border-[#631421] rounded-lg text-xs text-[#1F1215] focus:outline-none"
                      />
                      <p className="text-[11px] text-[#6E5D5F]">
                        Como somos fabricação própria sob encomenda, confeccionamos na cor que você escrever acima!
                      </p>
                    </div>
                  )}

                  {colorError && (
                    <p className="mt-2 text-xs font-semibold text-[#9E2A2B]">
                      {colorError}
                    </p>
                  )}
                </div>

                {/* 2. Escolha da Numeração (34 ao 39 BR) */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-2">
                    <span className="font-semibold text-[#1F1215]">
                      2. Numeração (34 ao 39 BR):{' '}
                      <span className="text-[#631421] font-bold">{selectedSize} BR</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenSizeGuide();
                      }}
                      className="text-xs font-semibold text-[#631421] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Ruler className="w-3.5 h-3.5" />
                      <span>Abrir Provador de Medidas (cm)</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {product.availableSizes.map((size) => {
                      const active = selectedSize === size;
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          className={`py-2.5 text-xs font-mono-tabular font-semibold rounded-lg border transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#631421] text-[#FAF7F2] border-[#631421]'
                              : 'bg-white text-[#1F1215] border-[#E6DDD0] hover:border-[#631421]'
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Personalização de Salto e Metais */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#1F1215] mb-1.5">
                      3. Altura & Solado / Plataforma
                    </label>
                    <select
                      value={heelOption}
                      onChange={(e) => setHeelOption(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E6DDD0] rounded-lg text-xs text-[#1F1215] focus:outline-none focus:border-[#631421]"
                    >
                      {product.heelOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1F1215] mb-1.5">
                      4. Acabamento de Pirâmides / Esferas / Fivela
                    </label>
                    <select
                      value={strapFinish}
                      onChange={(e) => setStrapFinish(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E6DDD0] rounded-lg text-xs text-[#1F1215] focus:outline-none focus:border-[#631421]"
                    >
                      {product.strapFinishes.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 5. Largura da Forma & Iniciais na Palmilha */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#1F1215] mb-1.5">
                      5. Largura da Forma (Anatomia do Pé)
                    </label>
                    <select
                      value={footWidth}
                      onChange={(e) => setFootWidth(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E6DDD0] rounded-lg text-xs text-[#1F1215] focus:outline-none focus:border-[#631421]"
                    >
                      <option value="Padrão">Forma Padrão Brasileira</option>
                      <option value="Pé Fino (Mais Justa)">
                        Pé Fino (Tiras mais justas no peito do pé)
                      </option>
                      <option value="Pé Largo (Conforto Extra)">
                        Pé Largo (+4mm de folga anatômica)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1F1215] mb-1.5">
                      6. Gravação de Iniciais na Palmilha (Cortesia)
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={insoleEngraving}
                      onChange={(e) => setInsoleEngraving(e.target.value)}
                      placeholder="Ex: M.C. (Opcional)"
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E6DDD0] rounded-lg text-xs text-[#1F1215] focus:outline-none focus:border-[#631421]"
                    />
                  </div>
                </div>

                {/* Observações extras */}
                <div>
                  <label className="block text-xs font-semibold text-[#1F1215] mb-1.5">
                    Observações Especiais para a Fábrica (Opcional)
                  </label>
                  <input
                    type="text"
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="Ex: Preciso para evento, desejo furo extra na tira do tornozelo, pedido atacado..."
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E6DDD0] rounded-lg text-xs text-[#1F1215] focus:outline-none focus:border-[#631421]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-5 border-t border-[#E6DDD0] space-y-2.5">
                <button
                  type="button"
                  onClick={handleConfirmCustomOrder}
                  className="w-full py-3.5 px-6 bg-[#631421] hover:bg-[#4D0E18] text-[#FAF7F2] font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Sparkles className="w-4 h-4 text-[#E5D3B3] shrink-0" />
                  <span className="truncate">
                    Confirmar Personalização · Entrada 50% ({formatBRL(depositValue)})
                  </span>
                </button>

                <a
                  href={toWhatsAppHref(whatsappStore, whatsappMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-white hover:bg-[#F3EDE2] text-[#1F1215] border border-[#E6DDD0] rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 text-[#2E6B3E] shrink-0" />
                  <span>Tirar Dúvida desta Sandália pelo WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Screen Photo Lightbox Zoom */}
      {isLightboxOpen && (
        <div
          onClick={() => setIsLightboxOpen(false)}
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-8"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl w-full flex flex-col items-center"
          >
            <div className="w-full flex items-center justify-between text-[#FAF7F2] mb-3 px-1">
              <div>
                <p className="text-sm font-semibold">{product.name}</p>
                <p className="text-xs text-[#E5D3B3]">
                  Cor selecionada: {resolvedColorName} · Numeração 34 ao 39 BR
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Fechar Zoom</span>
              </button>
            </div>

            <div className="relative w-full max-h-[75vh] bg-[#1A0509] rounded-2xl overflow-hidden border border-white/15 flex items-center justify-center">
              <img
                src={displayImage}
                alt={product.name}
                className="max-h-[75vh] w-auto object-contain"
              />

              {galleryList.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const currIdx = Math.max(0, galleryList.indexOf(displayImage));
                      const prevIdx =
                        (currIdx - 1 + galleryList.length) % galleryList.length;
                      setActivePhotoUrl(galleryList[prevIdx]);
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/65 hover:bg-black/85 text-white border border-white/20 cursor-pointer"
                    aria-label="Foto anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const currIdx = Math.max(0, galleryList.indexOf(displayImage));
                      const nextIdx = (currIdx + 1) % galleryList.length;
                      setActivePhotoUrl(galleryList[nextIdx]);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/65 hover:bg-black/85 text-white border border-white/20 cursor-pointer"
                    aria-label="Próxima foto"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {galleryList.length > 1 && (
              <div className="flex items-center gap-2 mt-4 overflow-x-auto max-w-full py-1">
                {galleryList.map((imgUrl, idx) => (
                  <button
                    key={`zoom-thumb-${idx}`}
                    type="button"
                    onClick={() => setActivePhotoUrl(imgUrl)}
                    className={`w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer transition-all ${
                      displayImage === imgUrl
                        ? 'border-[#E5D3B3] scale-105'
                        : 'border-white/20 opacity-65 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`${product.name} miniatura ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
