import React, { useState } from 'react';
import { X, Send, Sparkles, MessageCircle } from 'lucide-react';
import { toWhatsAppHref } from '../utils/whatsapp';

interface AiConsultantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  whatsappStore: string;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

const SUGGESTED_QUESTIONS = [
  'Como funciona o pagamento de 50% de entrada?',
  'Qual o prazo de produção das sandálias?',
  'Quais modelos vocês têm na cor Vinho?',
  'Qual o status do pedido PTS-2026-101?',
];

export const AiConsultantDrawer: React.FC<AiConsultantDrawerProps> = ({
  isOpen,
  onClose,
  whatsappStore,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: 'Olá! Sou a Consultora Virtual da Peterson Shoes, direto da nossa fabricação própria em Goiânia - Goiás. Posso apresentar nossas sandálias feitas sob encomenda (numeração 34 ao 39), explicar o pagamento de 50% na encomenda (Pix sem taxa ou Cartão de Crédito com a taxa do banco) + 50% quando ficar pronta, ou consultar o andamento do seu pedido. Como posso ajudar você hoje?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const sendQuestion = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || loading) return;

    const updatedHistory: ChatMessage[] = [
      ...messages,
      { role: 'user', text: trimmed },
    ];
    setMessages(updatedHistory);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: messages,
        }),
      });
      const data = await res.json();
      setMessages([
        ...updatedHistory,
        {
          role: 'model',
          text:
            data.reply ||
            data.error ||
            'Estou à disposição para ajudar na escolha da sua sandália Peterson Shoes.',
        },
      ]);
    } catch (err) {
      setMessages([
        ...updatedHistory,
        {
          role: 'model',
          text: 'Tivemos uma oscilação momentânea. Você também pode falar diretamente conosco pelo botão de WhatsApp abaixo!',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/55 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-consultant-title"
    >
      <div className="bg-[#F7F3EC] w-full max-w-md h-full flex flex-col justify-between shadow-2xl border-l border-[#DFD3C3]">
        {/* Header */}
        <div className="px-6 py-5 bg-[#5B1824] text-[#F7F3EC] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-[#E5D3B3]" />
            <div>
              <h2 id="ai-consultant-title" className="text-lg font-semibold leading-tight">
                Consultora Peterson Shoes
              </h2>
              <p className="text-xs text-[#E5D3B3]">
                Atendimento Inteligente Integrado ao Catálogo Real
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#F7F3EC]/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Fechar atendimento IA"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Quick starter buttons */}
          <div className="space-y-1.5">
            <p className="text-[11px] text-[#6E5A5F] font-medium">
              Perguntas frequentes das clientes:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => sendQuestion(q)}
                  className="text-left px-2.5 py-1.5 bg-[#EFE7DA] hover:bg-[#E4D6C3] text-[#231619] border border-[#DFD3C3] rounded-lg text-xs transition-colors cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-4 py-3 text-xs leading-relaxed whitespace-pre-line ${
                  msg.role === 'user'
                    ? 'bg-[#5B1824] text-[#F7F3EC]'
                    : 'bg-white text-[#231619] border border-[#DFD3C3]'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-[#DFD3C3] rounded-xl px-4 py-3 text-xs text-[#6E5A5F]">
                Consultando catálogo e encomendas da Peterson Shoes...
              </div>
            </div>
          )}
        </div>

        {/* Footer Input + WhatsApp Direct Escalation */}
        <div className="p-4 bg-[#EFE7DA] border-t border-[#DFD3C3] space-y-2.5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendQuestion(input);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte sobre modelos, cores, 50% Pix ou seu pedido..."
              className="flex-1 px-3.5 py-2.5 bg-white border border-[#DFD3C3] rounded-lg text-xs text-[#231619] focus:outline-none focus:border-[#5B1824]"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 bg-[#5B1824] hover:bg-[#46111B] text-[#F7F3EC] rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar</span>
            </button>
          </form>

          <a
            href={toWhatsAppHref(
              whatsappStore,
              'Olá, Peterson Shoes! Vim pelo site e gostaria de atendimento personalizado para minha encomenda.'
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 px-3 bg-white hover:bg-[#F7F3EC] text-[#231619] border border-[#DFD3C3] rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5 text-[#2E6B3E]" />
            <span>Prefere falar com uma consultora humana no WhatsApp?</span>
          </a>
        </div>
      </div>
    </div>
  );
};
