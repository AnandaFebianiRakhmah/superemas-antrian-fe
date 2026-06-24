import React from 'react';

export function ThermalTicket({ ticketData, branchName }) {
  if (!ticketData) return null;

  return (
    <div className="flex justify-center p-4">
      {/* Screen view card designed to look like a premium paper ticket receipt */}
      <div 
        id="print-ticket" 
        className="w-full max-w-[280px] bg-white text-navy-950 p-6 rounded-2xl shadow-2xl relative overflow-hidden font-mono border border-gray-200"
        style={{
          color: '#0a0a0a',
          backgroundColor: '#ffffff',
        }}
      >
        {/* Decorative receipt cuts */}
        <div className="absolute top-0 left-0 right-0 h-1.5 flex justify-between overflow-hidden">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="w-3 h-3 bg-navy-900 rounded-full -mt-2.5 mx-[1px] shrink-0" />
          ))}
        </div>

        <div className="text-center pt-2">
          {/* Logo SUPER EMAS */}
          <div className="text-lg font-black tracking-wider text-black">SUPER EMAS</div>
          <div className="text-[10px] tracking-[0.25em] text-gray-500 font-sans font-bold mb-2">INDONESIA</div>
          
          {/* Nama Cabang */}
          <div className="text-xs font-bold font-sans text-gray-700 bg-gray-100 py-1 px-3 rounded-full inline-block mb-3">
            Cabang: {branchName}
          </div>
          
          <div className="border-t border-dashed border-gray-300 my-3" />
          
          <div className="text-[11px] uppercase tracking-widest text-gray-500 font-sans font-semibold">Nomor Antrian</div>
          
          {/* Nomor Antrian */}
          <div className="text-5xl font-black text-black my-4 tracking-tight leading-none">
            {ticketData.number}
          </div>
          
          <div className="border-t border-dashed border-gray-300 my-3" />
          
          {/* Tanggal & Jam */}
          <div className="text-[11px] text-gray-600 font-sans font-medium mb-4">
            {ticketData.time}
          </div>
          
          {/* Pesan */}
          <div className="text-[11px] font-bold font-sans text-navy-950 bg-gold-100 border border-gold-300/40 p-2.5 rounded-xl leading-relaxed mb-1">
            Silakan menunggu hingga nomor dipanggil
          </div>
          
          <div className="text-[9px] text-gray-400 font-sans mt-4">
            Terima kasih atas kunjungan Anda
          </div>
        </div>
      </div>
    </div>
  );
}
