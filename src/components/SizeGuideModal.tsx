import React, { useState } from 'react';
import { X, Ruler, Check } from 'lucide-react';
import { SIZE_GUIDE_TABLE } from '../data/products';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSizeFilter: (size: number) => void;
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({
  isOpen,
  onClose,
  onSelectSizeFilter,
}) => {
  const [footLengthCm, setFootLengthCm] = useState<number>(24.0);

  if (!isOpen) return null;

  const recommendedRow =
    SIZE_GUIDE_TABLE.find(
      (row) => footLengthCm >= row.footLengthMin && footLengthCm <= row.footLengthMax
    ) ||
    (footLengthCm < SIZE_GUIDE_TABLE[0].footLengthMin
      ? SIZE_GUIDE_TABLE[0]
      : SIZE_GUIDE_TABLE[SIZE_GUIDE_TABLE.length - 1]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="size-guide-title"
    >
      <div className="bg-[#FAF7F2] border border-[#E6DDD0] rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Sticky Modal Header */}
        <div className="px-6 py-5 bg-[#631421] text-[#FAF7F2] flex items-center justify-between gap-4 shrink-0">
          <div>
            <p className="text-xs text-[#E5D3B3] tracking-wide">
              Provador Sob Medida Peterson Shoes · Numerações 34 ao 39 BR
            </p>
            <h2
              id="size-guide-title"
              className="font-serif-display text-2xl font-semibold mt-0.5"
            >
              Guia de Tamanhos & Anatomia dos Pés (34 ao 39)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#FAF7F2]/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            aria-label="Fechar guia de tamanhos"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6">
          {/* Interactive Foot Measurement Calculator */}
          <div className="bg-[#F3EDE2] border border-[#E6DDD0] rounded-xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <label
                  htmlFor="foot-slider"
                  className="text-sm font-semibold text-[#1F1215] flex items-center gap-2"
                >
                  <Ruler className="w-4 h-4 text-[#631421] shrink-0" />
                  <span>Comprimento do seu pé (do calcanhar ao dedo mais longo)</span>
                </label>
                <p className="text-xs text-[#6E5D5F] mt-1">
                  Apoie o pé sobre uma folha de papel encostada na parede e meça com uma régua até a extremidade.
                </p>
              </div>
              <div className="sm:text-right shrink-0">
                <span className="font-mono-tabular text-2xl font-semibold text-[#631421]">
                  {footLengthCm.toFixed(1)} cm
                </span>
              </div>
            </div>

            <input
              id="foot-slider"
              type="range"
              min={22.1}
              max={26.2}
              step={0.1}
              value={footLengthCm}
              onChange={(e) => setFootLengthCm(parseFloat(e.target.value))}
              className="w-full mt-4 accent-[#631421] cursor-pointer"
            />

            <div className="mt-4 pt-4 border-t border-[#E6DDD0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-[#6E5D5F]">
                  Numeração Peterson Shoes recomendada para você:
                </span>
                <div className="flex flex-wrap items-baseline gap-2.5 mt-0.5">
                  <span className="font-serif-display text-2xl font-semibold text-[#1F1215] tabular-nums">
                    Tamanho {recommendedRow.size} BR
                  </span>
                  <span className="text-xs text-[#6E5D5F] tabular-nums">
                    (Palmilha anatômica de {recommendedRow.insoleLength.toFixed(1)} cm)
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onSelectSizeFilter(recommendedRow.size);
                  onClose();
                }}
                className="px-4 py-2.5 bg-[#631421] hover:bg-[#4D0E18] text-[#FAF7F2] text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Filtrar Catálogo no Tam. {recommendedRow.size}</span>
              </button>
            </div>
          </div>

          {/* Complete Table */}
          <div className="overflow-x-auto bg-white border border-[#E6DDD0] rounded-xl">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#E6DDD0] bg-[#F3EDE2]/60 text-xs text-[#6E5D5F]">
                  <th className="py-3 px-4 font-semibold">Numeração (BR)</th>
                  <th className="py-3 px-4 font-semibold">Medida do Pé (cm)</th>
                  <th className="py-3 px-4 font-semibold">Palmilha Interna</th>
                  <th className="py-3 px-4 text-right font-semibold">Catálogo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6DDD0] tabular-nums">
                {SIZE_GUIDE_TABLE.map((row) => {
                  const isRecommended = row.size === recommendedRow.size;
                  return (
                    <tr
                      key={row.size}
                      className={
                        isRecommended
                          ? 'bg-[#631421]/8 font-semibold text-[#1F1215]'
                          : 'text-[#3D2C30]'
                      }
                    >
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        {row.size} BR {isRecommended ? '· Ideal para você' : ''}
                      </td>
                      <td className="py-2.5 px-4 font-mono-tabular whitespace-nowrap">
                        {row.footLengthMin.toFixed(1)} – {row.footLengthMax.toFixed(1)} cm
                      </td>
                      <td className="py-2.5 px-4 font-mono-tabular whitespace-nowrap">
                        {row.insoleLength.toFixed(1)} cm
                      </td>
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectSizeFilter(row.size);
                            onClose();
                          }}
                          className="text-xs font-semibold text-[#631421] hover:underline whitespace-nowrap cursor-pointer"
                        >
                          Selecionar {row.size}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-[#6E5D5F] leading-relaxed">
            Além da numeração do 34 ao 39, ao personalizar sua sandália você pode escolher gratuitamente a <strong>Largura da Forma</strong> (<em>Pé Fino</em>, <em>Padrão</em> ou <em>Pé Largo</em>) para um calce sob medida impecável.
          </p>
        </div>
      </div>
    </div>
  );
};
