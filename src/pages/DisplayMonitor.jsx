import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../services/api';
import { useToast } from '../components/ui/Toast';
import { printerService } from '../services/printerService';
import audioQueueService from '../services/audioQueueService';


// ─── Helpers ───────────────────────────────────────────────
function formatTime(date) {
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function formatDate(date) {
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTicketDate(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
}

function formatTicketTime(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}




// ─── Notification Sound ────────────────────────────────────
function playChime() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const tones = [
      { freq: 830, start: 0, dur: 0.25 },
      { freq: 1046, start: 0.3, dur: 0.35 },
    ];

    tones.forEach(({ freq, start, dur }) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.4, audioCtx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + start + dur);
      osc.start(audioCtx.currentTime + start);
      osc.stop(audioCtx.currentTime + start + dur);
    });
  } catch {
    // AudioContext not supported
  }
}

export default function DisplayMonitor() {
  const toast = useToast();
  const { branchId } = useParams();

  useEffect(() => {
    window.audioQueueService = audioQueueService;
  }, []);
  const [time, setTime] = useState(new Date());
  const [branchName, setBranchName] = useState('');
  const [theme, setTheme] = useState(document.documentElement.classList.contains('light') ? 'light' : 'dark');

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };
  const [currentQueue, setCurrentQueue] = useState(null);
  const [counter, setCounter] = useState(null);
  const [waitingQueue, setWaitingQueue] = useState([]);
  const [counter1Active, setCounter1Active] = useState(null);
  const [counter2Active, setCounter2Active] = useState(null);
  const [flashActive, setFlashActive] = useState(false);
  const socketRef = useRef(null);
  const hasInteracted = useRef(false);

  // Kiosk ticket creation state
  const [createdTicket, setCreatedTicket] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);

  // Enable audio on first user interaction
  useEffect(() => {
    const enableAudio = () => {
      hasInteracted.current = true;
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('touchstart', enableAudio);
    };
    document.addEventListener('click', enableAudio);
    document.addEventListener('touchstart', enableAudio);
    return () => {
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('touchstart', enableAudio);
    };
  }, []);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch branch details from public display or QR endpoint
  useEffect(() => {
    if (!branchId) return;
    api
      .get(`/display/${branchId}`)
      .then((res) => {
        const data = res.data;
        if (data.branch_name || data.name) {
          setBranchName(data.branch_name || data.name);
        }
      })
      .catch(() => {
        setBranchName(`Cabang ${branchId}`);
      });
  }, [branchId]);

  // Fetch display data
  const fetchDisplay = useCallback(() => {
    if (!branchId) return;
    api
      .get(`/display/${branchId}`)
      .then((res) => {
        const data = res.data;
        setCurrentQueue(data.current_queue);
        setCounter(data.counter);
        setWaitingQueue(data.waiting_queue || []);

        // Also capture active counters
        if (data.counter === 1) setCounter1Active(data.current_queue);
        if (data.counter === 2) setCounter2Active(data.current_queue);
      })
      .catch(() => { });
  }, [branchId]);

  useEffect(() => {
    fetchDisplay();
  }, [fetchDisplay]);

  // Socket.IO
  useEffect(() => {
    if (!branchId) return;

    const socketUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/\/api$/, '')
      : '/';
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-branch', branchId);
    });

    let lastCallTime = 0;
    let lastQueueNum = '';
    let lastCounterNum = '';

    const handleCall = (data) => {
      const now = Date.now();
      // Deduplicate calls within 2 seconds
      if (
        data.queue_number === lastQueueNum &&
        data.counter_number === lastCounterNum &&
        (now - lastCallTime) < 2000
      ) {
        console.log('Ignoring duplicate call event for:', data.queue_number);
        return;
      }
      lastCallTime = now;
      lastQueueNum = data.queue_number;
      lastCounterNum = data.counter_number;

      setCurrentQueue(data.queue_number);
      setCounter(data.counter_number);

      if (data.counter_number === 1) setCounter1Active(data.queue_number);
      if (data.counter_number === 2) setCounter2Active(data.queue_number);

      setFlashActive(true);
      setTimeout(() => setFlashActive(false), 2000);

      if (hasInteracted.current) {
        audioQueueService.playQueueAnnouncement(data.queue_number, data.counter_number);
      }
      fetchDisplay();
    };

    socket.on('queue-called', handleCall);
    socket.on('queue_called', handleCall);

    socket.on('queue-updated', (data) => {
      setCurrentQueue(data.current_queue);
      setCounter(data.counter);
      setWaitingQueue(data.waiting_queue || []);
      if (data.branch_name || data.name) {
        setBranchName(data.branch_name || data.name);
      }
    });

    socket.on('queue_created', () => {
      fetchDisplay();
    });

    socket.on('queue_completed', () => {
      fetchDisplay();
    });

    socket.on('queue_skipped', () => {
      fetchDisplay();
    });

    return () => {
      socket.disconnect();
      audioQueueService.clear();
    };
  }, [branchId, fetchDisplay]);

  // Kiosk: Create and print ticket
  const handleCetakTiket = async () => {
    try {
      setIsPrinting(true);
      const res = await api.post('/queues/take-number', {
        branch_id: Number(branchId),
        customer_name: ''
      });
      const ticket = res.data.data;

      setCreatedTicket({
        number: ticket.queue_number,
        estimated: ticket.estimated_waiting,
        time: new Date().toLocaleString('id-ID', {
          dateStyle: 'medium',
          timeStyle: 'medium'
        })
      });

      // Format ticket data for Bluetooth/ESC/POS printer
      const ticketData = {
        branch: branchName || `Cabang ${branchId}`,
        number: ticket.queue_number,
        date: formatTicketDate(new Date()),
        time: formatTicketTime(new Date()),
      };

      try {
        await printerService.print(ticketData);
      } catch (printErr) {
        console.error('Print failed:', printErr);
        toast.error('Printer belum terhubung');
      }

      setIsPrinting(false);
    } catch (err) {
      console.error(err);
      setIsPrinting(false);
      toast.error('Gagal mengambil nomor antrian');
    }
  };

  const handleCetakLagi = async () => {
    if (!createdTicket) return;
    try {
      const ticketData = {
        branch: branchName || `Cabang ${branchId}`,
        number: createdTicket.number,
        date: formatTicketDate(new Date()),
        time: formatTicketTime(new Date()),
      };

      try {
        await printerService.print(ticketData);
      } catch (printErr) {
        console.error('Reprint failed:', printErr);
        toast.error('Printer belum terhubung');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      className="display-root"
      onClick={() => {
        hasInteracted.current = true;
      }}
    >
      {/* ── Background Orbs (Premium Theme) ── */}
      <div className="display-bg-orb display-bg-orb--1" />
      <div className="display-bg-orb display-bg-orb--2" />
      <div className="display-bg-line" />

      {/* ── Main Container ── */}
      <div className="display-container-split">
        {/* ================= LEFT SECTION (70%) ================= */}
        <div className="display-left-section">
          {/* Header */}
          <header className="display-header-left">
            <div className="display-logo-brand">
              <div className="display-premium-logo">
                <span className="display-logo-txt">SE</span>
              </div>
              <div>
                <h1 className="display-logo-title">
                  SUPER <span className="text-gold">EMAS</span>
                </h1>
                <p className="display-logo-subtitle">{branchName || '...'}</p>
              </div>
            </div>
            <div className="display-clock-block flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-navy-300 hover:text-white hover:bg-navy-700/30 transition-colors cursor-pointer display-theme-toggle no-print"
                title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
              >
                {theme === 'dark' ? (
                  <svg className="w-5 h-5 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              <div className="text-right">
                <p className="display-time-txt">{formatTime(time)}</p>
                <p className="display-date-txt">{formatDate(time)}</p>
              </div>
            </div>
          </header>

          {/* Core Layout */}
          <div className="display-left-body">
            {/* Left Box: Active called queue */}
            <div className={`display-calling-panel ${flashActive ? 'display-calling-panel--flash' : ''}`}>
              <div className="panel-glow-top" />
              <span className="calling-label">NOMOR DIPANGGIL</span>
              <div className="calling-number-wrap">
                <span className="calling-number">{currentQueue || '—'}</span>
              </div>
              <div className="calling-counter-badge">
                <span className="calling-counter-dot" />
                LOKET {counter || '—'}
              </div>
            </div>

            {/* Right Box: Status Loket & Waiting list */}
            <div className="display-calling-side">
              {/* Loket Status Card */}
              <div className="status-card">
                <h3 className="card-section-title">STATUS LOKET</h3>
                <div className="status-grid">
                  <div className="status-loket-box">
                    <div className="status-loket-header">
                      <span className={`status-dot ${counter1Active ? 'status-dot--active' : ''}`} />
                      <span className="status-loket-name">Loket 1</span>
                    </div>
                    <p className="status-loket-number">{counter1Active || '—'}</p>
                    <p className="status-loket-desc">
                      {counter1Active ? 'Melayani' : 'Aktif'}
                    </p>
                  </div>
                  <div className="status-loket-box">
                    <div className="status-loket-header">
                      <span className={`status-dot ${counter2Active ? 'status-dot--active' : ''}`} />
                      <span className="status-loket-name">Loket 2</span>
                    </div>
                    <p className="status-loket-number">{counter2Active || '—'}</p>
                    <p className="status-loket-desc">
                      {counter2Active ? 'Melayani' : 'Aktif'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Waiting List Card */}
              <div className="waiting-card">
                <h3 className="card-section-title">ANTRIAN SELANJUTNYA</h3>
                <div className="waiting-list-flow">
                  {waitingQueue.length === 0 ? (
                    <p className="waiting-list-empty">Tidak ada antrian</p>
                  ) : (
                    waitingQueue.slice(0, 5).map((q, i) => (
                      <div
                        key={q}
                        className={`waiting-list-item ${i === 0 ? 'waiting-list-item--next' : ''}`}
                      >
                        <span className="waiting-item-rank">{i + 1}</span>
                        <span className="waiting-item-num">{q}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Running text marquee */}
          <footer className="display-marquee-footer">
            <div className="display-marquee-wrap">
              <div className="display-marquee-track">
                <span className="display-marquee-txt">
                  ★ Selamat datang di SUPER EMAS INDONESIA &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ★ Solusi Jual Emas Paling SUPER &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                </span>
                <span className="display-marquee-txt" aria-hidden="true">
                  ★ Selamat datang di SUPER EMAS INDONESIA &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ★ Solusi Jual Emas Paling SUPER &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                </span>
              </div>
            </div>
          </footer>
        </div>

        {/* ================= RIGHT SECTION (30%) ================= */}
        <div className="display-right-section">
          <div className="kiosk-container">
            <div className="kiosk-header">
              <div className="kiosk-badge">TICKET KIOSK</div>
              <h2 className="kiosk-title">AMBIL ANTRIAN</h2>
              <p className="kiosk-desc">Tekan tombol di bawah untuk mencetak nomor antrian</p>
            </div>

            <div className="kiosk-body">
              <button
                className={`kiosk-big-btn ${isPrinting ? 'kiosk-big-btn--disabled' : ''}`}
                onClick={handleCetakTiket}
                disabled={isPrinting}
              >
                <div className="btn-inner">
                  <svg className="kiosk-btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span>{isPrinting ? 'MENCETAK...' : 'CETAK TIKET'}</span>
                </div>
              </button>

              {createdTicket && (
                <div className="kiosk-ticket-info animate-fade-in">
                  <p className="ticket-info-title">NOMOR ANDA</p>
                  <p className="ticket-info-num">{createdTicket.number}</p>

                  <div className="ticket-info-wait">
                    <span className="wait-label">Estimasi Menunggu:</span>
                    <span className="wait-value">{createdTicket.estimated} Menit</span>
                  </div>

                  <button className="kiosk-reprint-btn" onClick={handleCetakLagi}>
                    <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.706 9h-2.744" />
                    </svg>
                    CETAK LAGI
                  </button>
                </div>
              )}
            </div>

            <div className="kiosk-footer">
              <p className="kiosk-footer-txt">SUPER EMAS INDONESIA</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Hidden thermal print layout (58mm) ── */}
      {createdTicket && (
        <div className="ticket-print-layout">
          <div className="ticket-header">SUPER EMAS INDONESIA</div>
          <div className="ticket-branch">Cabang: {branchName}</div>
          <div className="ticket-divider">--------------------------------</div>
          <div className="ticket-label">Nomor Antrian</div>
          <div className="ticket-number">{createdTicket.number}</div>
          <div className="ticket-divider">--------------------------------</div>
          <div className="ticket-time">{createdTicket.time}</div>
          <div className="ticket-footer">Terima kasih telah menunggu.</div>
        </div>
      )}

      {/* ── Screen Hint ── */}
      <div className="display-hint">
        Klik di mana saja untuk mengaktifkan suara panggilan loket
      </div>

      {/* ── Premium Layout Styles ── */}
      <style>{kioskStyles}</style>
    </div>
  );
}

// ─── STYLES ────────────────────────────────────────────────
const kioskStyles = `
  /* Premium Dark Purple, Black, and Gold color palette */
  .display-root {
    position: fixed;
    inset: 0;
    overflow: hidden;
    background: #080312; /* Rich Black-Purple */
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    color: #e2e8f0;
    user-select: none;
  }

  /* Orbs & lines background decoration */
  .display-bg-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(140px);
    pointer-events: none;
    z-index: 0;
  }
  .display-bg-orb--1 {
    width: 50vw; height: 50vw;
    top: -15vw; left: -10vw;
    background: radial-gradient(circle, rgba(123, 31, 162, 0.12), transparent 70%);
  }
  .display-bg-orb--2 {
    width: 40vw; height: 40vw;
    bottom: -10vw; right: -5vw;
    background: radial-gradient(circle, rgba(212, 168, 67, 0.08), transparent 70%);
  }
  .display-bg-line {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(123, 31, 162, 0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(123, 31, 162, 0.02) 1px, transparent 1px);
    background-size: 60px 60px;
    pointer-events: none;
    z-index: 0;
  }

  /* Split layout container */
  .display-container-split {
    position: relative;
    z-index: 10;
    display: flex;
    width: 100%;
    height: 100%;
  }

  /* 70% left side display */
  .display-left-section {
    width: 70%;
    height: 100%;
    display: flex;
    flex-direction: column;
    border-right: 1px solid rgba(123, 31, 162, 0.15);
    box-sizing: border-box;
  }

  /* 30% right side kiosk */
  .display-right-section {
    width: 30%;
    height: 100%;
    background: rgba(10, 3, 20, 0.7);
    backdrop-filter: blur(30px);
    box-sizing: border-box;
  }

  /* ── Header ── */
  .display-header-left {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5vw 2.5vw;
    background: rgba(15, 6, 28, 0.85);
    border-bottom: 1px solid rgba(123, 31, 162, 0.15);
  }
  .display-logo-brand {
    display: flex;
    align-items: center;
    gap: 1.2vw;
  }
  .display-premium-logo {
    width: clamp(40px, 3.5vw, 60px);
    height: clamp(40px, 3.5vw, 60px);
    border-radius: 14px;
    background: linear-gradient(135deg, #d4a843, #b8922e);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 24px rgba(212, 168, 67, 0.2);
  }
  .display-logo-txt {
    color: #0d0319;
    font-weight: 900;
    font-size: clamp(14px, 1.6vw, 24px);
  }
  .display-logo-title {
    font-size: clamp(16px, 1.8vw, 28px);
    font-weight: 800;
    color: #ffffff;
    margin: 0;
    letter-spacing: 0.05em;
  }
  .text-gold {
    color: #d4a843;
  }
  .display-logo-subtitle {
    font-size: clamp(10px, 0.9vw, 14px);
    color: #b08ee0;
    margin: 0;
    font-weight: 600;
  }
  .display-clock-block {
    text-align: right;
  }
  .display-time-txt {
    font-size: clamp(20px, 2.5vw, 42px);
    font-weight: 800;
    color: #ffffff;
    margin: 0;
    letter-spacing: 0.05em;
    font-variant-numeric: tabular-nums;
  }
  .display-date-txt {
    font-size: clamp(9px, 0.8vw, 13px);
    color: #8f6ebd;
    margin: 0;
    font-weight: 500;
  }

  /* ── Body ── */
  .display-left-body {
    flex: 1;
    display: flex;
    gap: 2vw;
    padding: 2vw 2.5vw;
    min-height: 0;
  }

  /* Left Column inside Left side: Current Called number */
  .display-calling-panel {
    flex: 1.3;
    background: linear-gradient(145deg, rgba(30, 10, 54, 0.65), rgba(15, 5, 30, 0.45));
    border: 1px solid rgba(123, 31, 162, 0.25);
    border-radius: 28px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(15px);
    transition: all 0.3s ease;
  }
  .panel-glow-top {
    position: absolute;
    top: 0; inset-inline: 0;
    height: 4px;
    background: linear-gradient(90deg, transparent, #d4a843, transparent);
  }
  .display-calling-panel--flash {
    border-color: rgba(212, 168, 67, 0.5);
    box-shadow: 0 0 60px rgba(123, 31, 162, 0.2), inset 0 0 60px rgba(212, 168, 67, 0.05);
    animation: flashBorder 2s ease-out;
  }
  @keyframes flashBorder {
    0% { border-color: #d4a843; }
    100% { border-color: rgba(123, 31, 162, 0.25); }
  }
  .calling-label {
    font-size: clamp(12px, 1.2vw, 20px);
    font-weight: 700;
    color: #b08ee0;
    letter-spacing: 0.3em;
    margin-bottom: 1vw;
  }
  .calling-number-wrap {
    position: relative;
  }
  .calling-number {
    font-size: clamp(60px, 10vw, 170px);
    font-weight: 900;
    color: #d4a843;
    margin: 0;
    line-height: 1;
    text-shadow: 0 0 35px rgba(212, 168, 67, 0.25);
    letter-spacing: 0.05em;
  }
  .calling-counter-badge {
    margin-top: 2vw;
    display: inline-flex;
    align-items: center;
    gap: 0.6vw;
    padding: 0.5vw 2vw;
    background: rgba(212, 168, 67, 0.08);
    border: 1px solid rgba(212, 168, 67, 0.2);
    border-radius: 100px;
    font-size: clamp(12px, 1.2vw, 22px);
    font-weight: 700;
    color: #e4be5a;
    letter-spacing: 0.15em;
  }
  .calling-counter-dot {
    width: clamp(8px, 0.8vw, 12px);
    height: clamp(8px, 0.8vw, 12px);
    border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
    animation: dotPulse 2s ease-in-out infinite;
  }
  @keyframes dotPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  /* Right Column inside Left side: Status & Queue lists */
  .display-calling-side {
    flex: 0.8;
    display: flex;
    flex-direction: column;
    gap: 2vw;
    min-height: 0;
  }
  .card-section-title {
    font-size: clamp(9px, 0.75vw, 13px);
    font-weight: 700;
    color: #8f6ebd;
    letter-spacing: 0.25em;
    margin: 0 0 1vw 0;
    text-transform: uppercase;
  }

  /* Status card */
  .status-card {
    background: rgba(30, 10, 54, 0.4);
    border: 1px solid rgba(123, 31, 162, 0.15);
    border-radius: 20px;
    padding: 1.3vw;
    backdrop-filter: blur(12px);
  }
  .status-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1vw;
  }
  .status-loket-box {
    background: rgba(15, 6, 28, 0.5);
    border: 1px solid rgba(123, 31, 162, 0.15);
    border-radius: 14px;
    padding: 1vw;
    text-align: center;
  }
  .status-loket-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5vw;
    margin-bottom: 0.3vw;
  }
  .status-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 8px rgba(34, 197, 94, 0.3);
  }
  .status-dot--active {
    background: #e4be5a;
    box-shadow: 0 0 10px rgba(228, 190, 90, 0.5);
    animation: dotPulse 1.5s infinite;
  }
  .status-loket-name {
    font-size: clamp(9px, 0.8vw, 13px);
    font-weight: 600;
    color: #b08ee0;
  }
  .status-loket-number {
    font-size: clamp(18px, 2vw, 36px);
    font-weight: 800;
    color: #ffffff;
    margin: 0.2vw 0;
  }
  .status-loket-desc {
    font-size: clamp(8px, 0.7vw, 11px);
    color: #8f6ebd;
    font-weight: 500;
    margin: 0;
  }

  /* Waiting list card */
  .waiting-card {
    flex: 1;
    background: rgba(30, 10, 54, 0.4);
    border: 1px solid rgba(123, 31, 162, 0.15);
    border-radius: 20px;
    padding: 1.3vw;
    backdrop-filter: blur(12px);
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  .waiting-list-flow {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.4vw;
    overflow: hidden;
  }
  .waiting-list-empty {
    color: #8f6ebd;
    font-size: clamp(10px, 0.9vw, 14px);
    text-align: center;
    margin: auto 0;
  }
  .waiting-list-item {
    display: flex;
    align-items: center;
    gap: 1vw;
    padding: 0.6vw 1vw;
    background: rgba(15, 6, 28, 0.3);
    border-radius: 10px;
    border: 1px solid transparent;
    transition: all 0.3s ease;
  }
  .waiting-list-item--next {
    background: rgba(212, 168, 67, 0.06);
    border-color: rgba(212, 168, 67, 0.15);
  }
  .waiting-item-rank {
    width: 24px; height: 24px;
    border-radius: 6px;
    background: rgba(143, 110, 189, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    color: #b08ee0;
  }
  .waiting-list-item--next .waiting-item-rank {
    background: rgba(212, 168, 67, 0.15);
    color: #d4a843;
  }
  .waiting-item-num {
    font-size: clamp(14px, 1.3vw, 22px);
    font-weight: 700;
    color: #d2c5e5;
  }
  .waiting-list-item--next .waiting-item-num {
    color: #e4be5a;
  }

  /* ── Marquee Footer ── */
  .display-marquee-footer {
    background: rgba(15, 6, 28, 0.9);
    border-top: 1px solid rgba(123, 31, 162, 0.15);
    overflow: hidden;
    padding: 0.8vw 0;
  }
  .display-marquee-wrap {
    overflow: hidden;
    white-space: nowrap;
  }
  .display-marquee-track {
    display: inline-flex;
    animation: marqueeScroll 25s linear infinite;
  }
  .display-marquee-txt {
    font-size: clamp(11px, 1vw, 16px);
    font-weight: 600;
    color: #d4a843;
    letter-spacing: 0.05em;
    padding: 0 3vw;
  }
  @keyframes marqueeScroll {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }

  /* ================= KIOSK RIGHT PANEL ================= */
  .kiosk-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 3vw 2vw;
    box-sizing: border-box;
    justify-content: space-between;
    align-items: center;
  }

  .kiosk-header {
    text-align: center;
  }
  .kiosk-badge {
    display: inline-block;
    padding: 4px 12px;
    background: rgba(123, 31, 162, 0.15);
    border: 1px solid rgba(123, 31, 162, 0.3);
    border-radius: 100px;
    font-size: 10px;
    font-weight: 700;
    color: #b08ee0;
    letter-spacing: 0.15em;
    margin-bottom: 12px;
  }
  .kiosk-title {
    font-size: clamp(18px, 1.8vw, 26px);
    font-weight: 800;
    color: #ffffff;
    margin: 0 0 6px 0;
    letter-spacing: 0.02em;
  }
  .kiosk-desc {
    font-size: clamp(10px, 0.9vw, 13px);
    color: #8f6ebd;
    margin: 0;
    max-width: 220px;
    line-height: 1.4;
  }

  .kiosk-body {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2vw;
  }

  /* Big ticket button */
  .kiosk-big-btn {
    width: clamp(140px, 14vw, 210px);
    height: clamp(140px, 14vw, 210px);
    border-radius: 50%;
    background: linear-gradient(135deg, #2c0b56, #0d0319);
    border: 3px solid #d4a843;
    cursor: pointer;
    box-shadow: 0 10px 30px rgba(212, 168, 67, 0.15), 0 0 0 6px rgba(123, 31, 162, 0.1);
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .kiosk-big-btn:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: 0 12px 35px rgba(212, 168, 67, 0.25), 0 0 0 10px rgba(123, 31, 162, 0.15);
  }
  .kiosk-big-btn:active:not(:disabled) {
    transform: scale(0.97);
  }
  .kiosk-big-btn--disabled {
    opacity: 0.6;
    border-color: #8f6ebd;
    cursor: not-allowed;
    box-shadow: none;
  }
  .btn-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: #d4a843;
    font-weight: 800;
    font-size: clamp(10px, 1vw, 15px);
    letter-spacing: 0.08em;
  }
  .kiosk-btn-icon {
    width: clamp(24px, 2.5vw, 42px);
    height: clamp(24px, 2.5vw, 42px);
  }

  /* Generated ticket display */
  .kiosk-ticket-info {
    width: 100%;
    background: linear-gradient(180deg, rgba(30, 10, 54, 0.5), rgba(15, 6, 28, 0.3));
    border: 1px solid rgba(212, 168, 67, 0.15);
    border-radius: 18px;
    padding: 1.5vw;
    text-align: center;
    box-sizing: border-box;
  }
  .ticket-info-title {
    font-size: 11px;
    font-weight: 700;
    color: #b08ee0;
    letter-spacing: 0.2em;
    margin: 0 0 4px 0;
  }
  .ticket-info-num {
    font-size: clamp(32px, 3.5vw, 56px);
    font-weight: 900;
    color: #d4a843;
    margin: 0 0 10px 0;
    letter-spacing: 0.02em;
    line-height: 1;
  }
  .ticket-info-wait {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 6px;
    font-size: clamp(10px, 0.9vw, 13px);
    margin-bottom: 12px;
  }
  .wait-label {
    color: #8f6ebd;
  }
  .wait-value {
    color: #ffffff;
    font-weight: 700;
  }
  .kiosk-reprint-btn {
    display: inline-flex;
    align-items: center;
    background: transparent;
    border: 1px solid rgba(143, 110, 189, 0.3);
    color: #b08ee0;
    padding: 6px 14px;
    border-radius: 8px;
    font-size: 10px;
    font-weight: 700;
    cursor: pointer;
    letter-spacing: 0.05em;
    transition: all 0.2s;
  }
  .kiosk-reprint-btn:hover {
    background: rgba(143, 110, 189, 0.1);
    color: #ffffff;
    border-color: rgba(143, 110, 189, 0.5);
  }

  .kiosk-footer {
    text-align: center;
  }
  .kiosk-footer-txt {
    font-size: 10px;
    font-weight: 600;
    color: #8f6ebd;
    letter-spacing: 0.1em;
    margin: 0;
  }

  .display-hint {
    position: fixed;
    bottom: 5vw;
    left: 35%;
    transform: translateX(-50%);
    background: rgba(123, 31, 162, 0.1);
    border: 1px solid rgba(123, 31, 162, 0.2);
    color: #b08ee0;
    font-size: clamp(9px, 0.8vw, 12px);
    padding: 0.4vw 1.5vw;
    border-radius: 100px;
    z-index: 100;
    pointer-events: none;
    animation: hintFade 6s ease-in-out forwards;
  }
  @keyframes hintFade {
    0%, 75% { opacity: 0.9; }
    100% { opacity: 0; visibility: hidden; }
  }

  /* Animation */
  .animate-fade-in {
    animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* ================= PRINT MEDIA STYLING (58mm Thermal Printer) ================= */
  @media print {
    @page {
      size: 58mm auto;
      margin: 0;
    }
    
    html, body {
      background: #ffffff !important;
      color: #000000 !important;
      font-family: 'Courier New', Courier, monospace;
      width: 58mm;
      margin: 0;
      padding: 0;
    }

    /* Hide the entire web app view during printing */
    #root, .display-root, .display-hint, .display-marquee-footer {
      display: none !important;
      visibility: hidden !important;
    }

    /* Print only the custom thermal ticket layout */
    .ticket-print-layout {
      display: block !important;
      width: 54mm;
      margin: 0 auto;
      padding: 5mm 2mm;
      text-align: center;
      box-sizing: border-box;
      color: #000000;
      border: none;
    }
    
    .ticket-header {
      font-size: 13px;
      font-weight: bold;
      margin-bottom: 2px;
      letter-spacing: 0.05em;
    }
    
    .ticket-branch {
      font-size: 10px;
      margin-bottom: 4px;
    }
    
    .ticket-divider {
      font-size: 10px;
      margin: 3px 0;
    }
    
    .ticket-label {
      font-size: 11px;
      margin-top: 4px;
      margin-bottom: 2px;
    }
    
    .ticket-number {
      font-size: 32px;
      font-weight: bold;
      margin: 5px 0;
      line-height: 1;
    }
    
    .ticket-time {
      font-size: 9px;
      margin-bottom: 4px;
    }
    
    .ticket-footer {
      font-size: 9px;
      margin-top: 6px;
    }
  }

  @media screen {
    .ticket-print-layout {
      display: none !important;
    }
  }

  /* ── Responsive adaptation for tablets landscape ── */
  @media (max-width: 1024px) {
    .display-left-section {
      width: 65%;
    }
    .display-right-section {
      width: 35%;
    }
  }
  @media (max-width: 768px) {
    .display-container-split {
      flex-direction: column;
      overflow-y: auto;
    }
    .display-left-section {
      width: 100%;
      height: 65%;
      border-right: none;
      border-bottom: 1px solid rgba(123, 31, 162, 0.15);
    }
    .display-right-section {
      width: 100%;
      height: 35%;
    }
    .kiosk-container {
      padding: 1.5vw;
      flex-direction: row;
    }
    .kiosk-body {
      flex-direction: row;
      justify-content: center;
      gap: 2vw;
    }
  }

  /* ── Light Mode Overrides ── */
  .light .display-root {
    background: #f4f2f7;
    color: #1e293b;
  }
  .light .display-bg-orb--1 {
    background: radial-gradient(circle, rgba(139, 92, 246, 0.08), transparent 70%);
  }
  .light .display-bg-orb--2 {
    background: radial-gradient(circle, rgba(212, 168, 67, 0.05), transparent 70%);
  }
  .light .display-bg-line {
    background-image:
      linear-gradient(rgba(139, 92, 246, 0.015) 1px, transparent 1px),
      linear-gradient(90deg, rgba(139, 92, 246, 0.015) 1px, transparent 1px);
  }
  .light .display-left-section {
    border-right-color: rgba(139, 92, 246, 0.15);
  }
  .light .display-right-section {
    background: rgba(255, 255, 255, 0.7);
  }
  .light .display-header-left {
    background: rgba(255, 255, 255, 0.85);
    border-bottom-color: rgba(139, 92, 246, 0.15);
  }
  .light .display-logo-title {
    color: #1a0f33;
  }
  .light .display-logo-subtitle {
    color: #5c4399;
  }
  .light .display-time-txt {
    color: #1a0f33;
  }
  .light .display-date-txt {
    color: #5c4399;
  }
  .light .display-calling-panel {
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.85), rgba(244, 242, 247, 0.65));
    border-color: rgba(139, 92, 246, 0.25);
  }
  .light .calling-label {
    color: #5c4399;
  }
  .light .calling-counter-badge {
    background: rgba(212, 168, 67, 0.08);
    border-color: rgba(212, 168, 67, 0.2);
    color: #b8922e;
  }
  .light .status-card {
    background: rgba(255, 255, 255, 0.5);
    border-color: rgba(139, 92, 246, 0.15);
  }
  .light .status-loket-box {
    background: rgba(255, 255, 255, 0.8);
    border-color: rgba(139, 92, 246, 0.15);
  }
  .light .status-loket-name {
    color: #5c4399;
  }
  .light .status-loket-number {
    color: #1a0f33;
  }
  .light .status-loket-desc {
    color: #5c4399;
  }
  .light .waiting-card {
    background: rgba(255, 255, 255, 0.5);
    border-color: rgba(139, 92, 246, 0.15);
  }
  .light .waiting-list-item {
    background: rgba(255, 255, 255, 0.8);
    border-color: rgba(139, 92, 246, 0.15);
    color: #1e293b;
  }
  .light .waiting-list-item--next {
    background: rgba(212, 168, 67, 0.08);
    border-color: rgba(212, 168, 67, 0.3);
    color: #b8922e;
  }
  .light .display-marquee-footer {
    background: rgba(255, 255, 255, 0.85);
    border-top-color: rgba(139, 92, 246, 0.15);
  }
  .light .display-marquee-txt {
    color: #5c4399;
  }
  .light .kiosk-title {
    color: #1a0f33;
  }
  .light .kiosk-desc {
    color: #5c4399;
  }
  .light .kiosk-ticket-info {
    background: rgba(255, 255, 255, 0.8);
    border-color: rgba(139, 92, 246, 0.15);
  }
  .light .ticket-info-title {
    color: #5c4399;
  }
  .light .ticket-info-num {
    color: #1a0f33;
  }
  .light .wait-label {
    color: #5c4399;
  }
  .light .wait-value {
    color: #1a0f33;
  }
  .light .display-hint {
    background: rgba(255, 255, 255, 0.95);
    border-color: rgba(139, 92, 246, 0.2);
    color: #5c4399;
  }
`;
