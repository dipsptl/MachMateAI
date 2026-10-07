import React, { useState, useRef, useEffect } from 'react';
import { Cog, Zap, Upload, CheckCircle2 } from 'lucide-react';

/**
 * MechMate AI Brand Logo Component
 * - Displays the user's authentic logo in high-definition (larger, ultra-clear and sharp).
 * - Ambient lighting sits behind the logo so foreground edges and text remain razor-sharp.
 */
export const MechSynapseLogo: React.FC<{
  className?: string;
  showWordmark?: boolean;
  heroSize?: boolean;
  showGlow?: boolean;
}> = ({
  className = 'w-full max-w-[320px]',
  showGlow = true,
}) => {
  const [logoSrc, setLogoSrc] = useState<string | null>('/logo.png');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const probe = new Image();
    probe.src = `/logo.png?v=${Date.now()}`;
    probe.onload = () => {
      setLogoSrc(`/logo.png?v=${Date.now()}`);
    };
    probe.onerror = () => {
      setLogoSrc(null);
    };
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadSuccess(false);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        const res = await fetch('/api/upload-logo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64Data }),
        });

        if (res.ok) {
          const freshUrl = `/logo.png?v=${Date.now()}`;
          setLogoSrc(freshUrl);
          setUploadSuccess(true);
          setTimeout(() => setUploadSuccess(false), 4000);
        } else {
          console.error('Logo upload failed with status:', res.status);
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Upload error:', err);
      setUploading(false);
    }
  };

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center select-none group pb-0 mb-0 ${className}`}
      role="img"
      aria-label="MechMate AI"
    >
      {/* Hidden file input for logo change */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        aria-label="Upload custom brand logo"
      />

      {/* Multi-layered ambient lighting strictly behind the logo (-z-10) so the logo stays crisp */}
      {showGlow && (
        <>
          {/* Warm Industrial Orange Lighting Aura */}
          <div
            className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-[#FF8800]/22 via-[#FF5500]/12 to-[#00D2FF]/20 blur-xl -z-10 opacity-80 pointer-events-none group-hover:opacity-100 transition-opacity duration-300"
            aria-hidden="true"
          />
          {/* Subtle Electric Cyan-Green Core Radiance */}
          <div
            className="absolute -inset-1 rounded-2xl bg-radial from-[#00D2FF]/20 via-[#00E599]/12 to-transparent blur-lg -z-10 opacity-75 pointer-events-none group-hover:opacity-95 transition-opacity duration-300"
            aria-hidden="true"
          />
        </>
      )}

      {logoSrc ? (
        <div className="relative group/logo w-full flex items-center justify-center">
          {/* Logo image rendered big and ultra-sharp without blurring edge filters */}
          <img
            src={logoSrc}
            alt="MechMate AI Brand Logo"
            onError={() => setLogoSrc(null)}
            className="w-full max-w-[320px] h-auto object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)] brightness-[1.03] contrast-[1.03] transition-transform duration-200 group-hover:scale-[1.01] block"
            style={{ imageRendering: 'auto' }}
            loading="eager"
          />

          {/* Quick Change Logo Button on hover */}
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
                fileInputRef.current?.click();
              }
            }}
            className="opacity-0 group-hover/logo:opacity-100 transition-opacity absolute -bottom-5 right-2 text-[10px] font-semibold text-[#00D2FF] hover:text-white bg-[#0A1822]/95 border border-[#00D2FF]/30 px-2.5 py-0.5 rounded-full flex items-center gap-1 cursor-pointer shadow-lg select-none"
            title="Change Brand Logo"
          >
            <Upload className="w-2.5 h-2.5" />
            <span>{uploading ? 'Updating...' : 'Change'}</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          {/* Clean High-Tech Vector Brandmark */}
          <div className="flex items-center gap-3 py-1">
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1A3344] via-[#102431] to-[#0A1822] border border-[#00D2FF]/30 flex items-center justify-center shadow-lg group-hover:border-[#00E599]/50 transition-colors">
              <Cog className="w-7 h-7 text-[#00D2FF]" />
              <Zap className="w-4 h-4 text-[#00E599] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_0_8px_#00E599]" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight text-white font-['Outfit']">
                  Mech<span className="text-[#00D2FF]">Mate</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded bg-gradient-to-r from-[#00E599] to-[#00D2FF] text-[#06151B] shadow-sm">
                  AI
                </span>
              </div>
              <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                Predict · Prevent · Protect
              </span>
            </div>
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
                fileInputRef.current?.click();
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold text-[#00D2FF] hover:text-white bg-[#102431]/80 hover:bg-[#153042] border border-[#00D2FF]/30 hover:border-[#00D2FF]/60 rounded-lg transition-all cursor-pointer shadow-sm select-none"
            title="Upload Custom Brand Logo"
          >
            <Upload className="w-3 h-3 text-[#00E599]" />
            <span>{uploading ? 'Uploading...' : 'Upload Logo'}</span>
          </div>
        </div>
      )}

      {uploadSuccess && (
        <span className="mt-1 text-[10px] text-[#00E599] font-medium flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Logo updated successfully!
        </span>
      )}
    </div>
  );
};
