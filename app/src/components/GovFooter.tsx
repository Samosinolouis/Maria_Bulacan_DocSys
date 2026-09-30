'use client';

export default function GovFooter() {
  return (
    <footer className="bg-[#081E36] text-[#CBD5E1] border-t-2 border-[#15803D] mt-auto">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
          {/* Col 1 */}
          <div className="space-y-2">
            <h4 className="font-cinzel text-sm font-bold text-white tracking-wide">
              REPUBLIC OF THE PHILIPPINES
            </h4>
            <p className="text-[#94A3B8] leading-relaxed">
              All content is in the public domain unless otherwise stated. Adheres to the Philippine
              Government Web Standards (GWTS v25.3.3).
            </p>
            <div className="font-mono text-[11px] text-[#FCD116]">
              ISO 9001:2015 Quality Management
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-2">
            <h4 className="font-bold text-white tracking-wide uppercase text-[11px]">
              Municipal Government
            </h4>
            <ul className="space-y-1 text-[#94A3B8]">
              <li>Pamahalaang Bayan ng Santa Maria, Bulacan</li>
              <li>Tanggapan ng Administrador ng Bayan</li>
              <li>Poblacion, Santa Maria, Bulacan 3022</li>
              <li>Hotline: (044) 815-2882 | 8888 Citizen Complaint</li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-2">
            <h4 className="font-bold text-white tracking-wide uppercase text-[11px]">
              Statutory Compliance
            </h4>
            <ul className="space-y-1 text-[#94A3B8]">
              <li>Republic Act 11032 (Ease of Doing Business)</li>
              <li>Republic Act 10173 (Data Privacy Act of 2012)</li>
              <li>Republic Act 8491 (Heraldic Code of the Philippines)</li>
              <li>Republic Act 10535 (Philippine Standard Time)</li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-2">
            <h4 className="font-bold text-white tracking-wide uppercase text-[11px]">
              Executive Systems
            </h4>
            <ul className="space-y-1 text-[#94A3B8]">
              <li>Anti-Red Tape Authority (ARTA) Electronic Docket</li>
              <li>Executive Order & Legislative Indorsement Portal</li>
              <li>Central Municipal Gavel & Venue Scheduler</li>
              <li>National Government Portal (gov.ph)</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#94A3B8]">
          <p>
            (c) {new Date().getFullYear()} Pamahalaang Bayan ng Santa Maria, Bulacan - Tanggapan ng Administrador ng Bayan. Lahat ng karapatan ay nakalaan.
          </p>
          <div className="flex items-center gap-4">
            <span className="hover:text-white cursor-pointer">Privacy Statement</span>
            <span className="hover:text-white cursor-pointer">Citizen Charter</span>
            <span className="hover:text-white cursor-pointer">Accessibility</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
