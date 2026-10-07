import React, { useState } from 'react';
import { Cog, Zap } from 'lucide-react';

/**
 * MechMate AI Logo Component
 * - If the user puts /logo.png in public/, renders it.
 * - Otherwise falls back to clean vector brand mark.
 */
export const MechMateLogo: React.FC<{
  className?: string;
}> = ({ className = 'w-full max-w-[200px]' }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className={`inline-flex items-center justify-center select-none ${className}`}>
      {!imageError ? (
        <img
          src="/logo.png"
          alt="MechMate AI"
          onError={() => setImageError(true)}
          className="w-full h-auto object-contain filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.85)] transition-transform duration-200 hover:scale-[1.02]"
          loading="eager"
        />
      ) : (
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-xl bg-[#142634] border border-[#00D2FF]/30 flex items-center justify-center shadow">
            <Cog className="w-5 h-5 text-[#00D2FF]" />
            <Zap className="w-2.5 h-2.5 text-[#00E599] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <span className="text-base font-bold text-white tracking-wide">
            Mech<span className="text-[#00D2FF]">Mate</span> AI
          </span>
        </div>
      )}
    </div>
  );
};
