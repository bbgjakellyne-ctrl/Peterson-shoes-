import React, { useState } from 'react';
import { ZoomIn, X } from 'lucide-react';

interface QrCodeMatrixProps {
  seed?: string;
  size?: number;
  compact?: boolean;
}

export const QrCodeMatrix: React.FC<QrCodeMatrixProps> = ({
  size = 220,
  compact = false,
}) => {
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col items-center">
        <div
          onClick={() => setIsZoomOpen(true)}
          style={{ width: size }}
          className="bg-white border-2 border-[#DFD3C3] hover:border-[#5B1824] rounded-xl overflow-hidden shadow-xs cursor-zoom-in transition-all group relative"
          title="Clique para ampliar o QR Code do Banco Inter"
        >
          <img
            src="/instagram/pix_qrcode_banco_inter.png"
            alt="QR Code Pix Oficial Banco Inter — 50789636 JACKELINE GOMES PETERSON — CNPJ 50.789.636/0001-32"
            className="w-full h-auto block select-none"
          />
          {!compact && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsZoomOpen(true);
              }}
              className="w-full py-1.5 px-2 bg-[#F7F3EC] group-hover:bg-[#5B1824] text-[#5B1824] group-hover:text-white text-[11px] font-semibold border-t border-[#DFD3C3] flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
              <span>Ampliar QR Code Banco Inter</span>
            </button>
          )}
        </div>
      </div>

      {isZoomOpen && (
        <div
          onClick={() => setIsZoomOpen(false)}
          className="fixed inset-0 z-[90] bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="QR Code Pix Banco Inter Ampliado"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl border border-[#DFD3C3] space-y-3"
          >
            <div className="flex items-center justify-between border-b border-[#EFE7DA] pb-2.5">
              <div>
                <p className="text-xs font-bold text-[#5B1824] uppercase tracking-wider">
                  QR Code Oficial · Banco Inter
                </p>
                <p className="text-[11px] text-[#6E5A5F]">
                  50789636 JACKELINE GOMES PETERSON · CNPJ 50.789.636/0001-32
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsZoomOpen(false)}
                className="p-1.5 rounded-lg bg-[#F7F3EC] hover:bg-[#EFE7DA] text-[#231619] cursor-pointer"
                aria-label="Fechar QR Code ampliado"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden border border-[#EFE7DA] bg-white">
              <img
                src="/instagram/pix_qrcode_banco_inter.png"
                alt="QR Code Pix Oficial Banco Inter Ampliado"
                className="w-full h-auto max-h-[70vh] object-contain mx-auto block"
              />
            </div>

            <p className="text-center text-xs text-[#4A373B]">
              Aponte a câmera do aplicativo do seu banco para ler o QR Code e digite o valor exato da entrada de 50%.
            </p>
          </div>
        </div>
      )}
    </>
  );
};
