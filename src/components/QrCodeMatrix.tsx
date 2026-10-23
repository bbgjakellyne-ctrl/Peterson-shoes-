import React from 'react';

interface QrCodeMatrixProps {
  seed: string;
  size?: number;
}

export const QrCodeMatrix: React.FC<QrCodeMatrixProps> = ({ seed, size = 168 }) => {
  const gridSize = 21;
  const cells: boolean[][] = Array.from({ length: gridSize }, () =>
    Array(gridSize).fill(false)
  );

  const drawFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        cells[r0 + r][c0 + c] = isBorder || isInner;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, gridSize - 7);
  drawFinder(gridSize - 7, 0);

  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= gridSize - 8;
      const inBottomLeft = r >= gridSize - 8 && c < 8;
      if (inTopLeft || inTopRight || inBottomLeft) continue;

      if (r === 6 || c === 6) {
        cells[r][c] = (r + c) % 2 === 0;
        continue;
      }

      const bit = ((hash >>> ((r * gridSize + c) % 24)) ^ (r * 13 + c * 7)) & 1;
      cells[r][c] = bit === 1;
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${gridSize} ${gridSize}`}
      className="bg-white p-2.5 border border-[#E6E0D6] rounded-lg"
      role="img"
      aria-label="QR Code PIX para pagamento instantâneo"
    >
      {cells.map((row, rIdx) =>
        row.map((filled, cIdx) =>
          filled ? (
            <rect
              key={`${rIdx}-${cIdx}`}
              x={cIdx}
              y={rIdx}
              width={1}
              height={1}
              fill="#1C1917"
            />
          ) : null
        )
      )}
    </svg>
  );
};
