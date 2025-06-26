// src/components/Solutions/ComplexitySection.tsx
import React from "react";

interface ComplexitySectionProps {
  timeComplexity: string | null;
  spaceComplexity: string | null;
  isLoading: boolean;
}

export const ComplexitySection: React.FC<ComplexitySectionProps> = ({
  timeComplexity,
  spaceComplexity,
  isLoading,
}) => {
  return (
    <div className="space-y-1.5">
      <h2 className="text-[13px] font-medium text-white tracking-wide">計算量</h2>
      {isLoading ? (
        <div className="space-y-1">
          <div className="mt-3 flex">
            <p className="text-xs bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300 bg-clip-text text-transparent animate-pulse">
              計算量を分析中...
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 text-xs text-white/80">
          <div>
            <span className="font-medium text-white/90">時間計算量:</span> {timeComplexity || "N/A"}
          </div>
          <div>
            <span className="font-medium text-white/90">空間計算量:</span> {spaceComplexity || "N/A"}
          </div>
        </div>
      )}
    </div>
  );
};