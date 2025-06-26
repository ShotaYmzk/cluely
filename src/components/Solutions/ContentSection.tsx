// src/components/Solutions/ContentSection.tsx
import React from "react";

interface ContentSectionProps {
  title: string;
  content: React.ReactNode;
  isLoading: boolean;
}

export const ContentSection: React.FC<ContentSectionProps> = ({ title, content, isLoading }) => {
  return (
    <div className="space-y-1.5">
      <h2 className="text-[13px] font-medium text-white tracking-wide">{title}</h2>
      {isLoading ? (
        <div className="space-y-1">
          <div className="mt-3 flex">
            <p className="text-xs bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300 bg-clip-text text-transparent animate-pulse">
              コンテンツを読み込み中...
            </p>
          </div>
        </div>
      ) : (
        <div className="text-white/80 text-[13px] leading-relaxed">
          {content}
        </div>
      )}
    </div>
  );
};