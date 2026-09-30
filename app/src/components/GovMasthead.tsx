'use client';

export default function GovMasthead() {
  return (
    <div className="gov-masthead flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="font-bold tracking-wider text-[#FCD116]">GOVPH</span>
        <span className="text-[#94A3B8]">|</span>
        <span className="text-[#E2E8F0]">
          Republika ng Pilipinas - Pamahalaang Bayan ng Santa Maria, Lalawigan ng Bulacan
        </span>
      </div>
      <div className="hidden md:flex items-center gap-4 text-[#94A3B8]">
        <span>Philippine Standard Time (PST): RA 10535</span>
        <span className="text-[#FCD116] font-mono font-semibold">GMT+8</span>
      </div>
    </div>
  );
}
