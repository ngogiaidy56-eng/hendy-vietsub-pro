import React, { useState } from 'react';
import {
  Bookmark,
  Copy,
  Check,
  ExternalLink,
  HelpCircle,
  Play,
  Pause,
  Subtitles,
  ShieldCheck,
  Zap,
  Sparkles,
} from 'lucide-react';
import { generateBookmarkletCode } from '../utils/bookmarklet';
import { audioEngine } from '../utils/audioEngine';

export const BookmarkletView: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const bookmarkletCode = generateBookmarkletCode();

  // Interactive Simulation state
  const [isSimActive, setIsSimActive] = useState(false);
  const [simOffset, setSimOffset] = useState(0);
  const [simMode, setSimMode] = useState<'bilingual' | 'vi' | 'en'>('bilingual');

  const handleCopy = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopied(true);
    audioEngine.playSfx('ding');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-neutral-950 text-neutral-200">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* FAQ Card: "Can I add Vietnamese subtitles to web-based videos?" */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/40 via-cyan-950/30 to-indigo-950/40 border border-cyan-500/30 shadow-2xl space-y-3">
          <div className="flex items-center gap-2 text-cyan-400">
            <HelpCircle className="w-5 h-5" />
            <span className="font-bold text-sm uppercase tracking-wider">Câu hỏi thường gặp (FAQ)</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white">
            "Tôi có thể thêm phụ đề tiếng Việt vào các video trên web xem phim không?"
          </h2>
          <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-750 text-neutral-300 text-sm leading-relaxed">
            <span className="font-extrabold text-cyan-400">HOÀN TOÀN CÓ THỂ (ABSOLUTELY)! </span>
            Ứng dụng cung cấp 2 giải pháp mạnh mẽ:
            <ul className="list-disc pl-5 mt-2 space-y-1.5 text-xs text-neutral-300">
              <li>
                <strong className="text-white">Giải pháp 1: Chế độ Web Video Subtitle Mode</strong> — Dán link video trực tiếp hoặc chọn video mẫu (Tears of Steel, Sintel, Big Buck Bunny) để nhận diện và dịch Vietsub tức thì với độ trễ tối thiểu và tùy chỉnh linh hoạt.
              </li>
              <li>
                <strong className="text-white">Giải pháp 2: 1-Click Vietsub Bookmarklet</strong> — Kéo nút đánh dấu vào thanh Bookmark của trình duyệt; khi xem phim trên BẤT KỲ trang nào (YouTube, FPT Play, Bilibili, Motchill...), chỉ cần nhấp 1 phát là lớp phủ phụ đề tiếng Việt AI xuất hiện đè lên video!
              </li>
            </ul>
          </div>
        </div>

        {/* 1-Click Bookmarklet Tool */}
        <div className="p-6 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-pink-400" />
                <span>Nút Bookmarklet 1-Click Vietsub</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Kéo nút màu tím bên dưới lên thanh dấu trang (Bookmarks Bar) của trình duyệt của bạn
              </p>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-semibold transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Đã sao chép mã!' : 'Sao chép mã Javascript'}</span>
            </button>
          </div>

          {/* Draggable Bookmarklet Button */}
          <div className="p-6 rounded-2xl bg-neutral-950/80 border border-dashed border-neutral-700 text-center space-y-3">
            <div className="text-xs text-neutral-400">
              👇 Kéo thả nút này lên thanh Bookmarks Bar của Chrome/Edge/Brave/Firefox:
            </div>
            <div>
              <a
                href={bookmarkletCode}
                onClick={(e) => {
                  e.preventDefault();
                  alert('Để cài đặt: Hãy KÉO & THẢ nút này lên thanh Bookmark (dấu trang) trên trình duyệt của bạn!');
                }}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white font-extrabold text-sm shadow-xl shadow-pink-500/25 cursor-grab active:cursor-grabbing hover:scale-105 transition-all"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>⚡ CapCut AI Vietsub (Kéo tôi vào Bookmarks)</span>
              </a>
            </div>
            <div className="text-[11px] text-neutral-500">
              *Mẹo: Nếu chưa thấy thanh dấu trang, nhấn tổ hợp phím <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono">Ctrl + Shift + B</kbd> (hoặc <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono">Cmd + Shift + B</kbd> trên Mac).
            </div>
          </div>

          {/* 3 Step Visual Guide */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-neutral-850 border border-neutral-800 space-y-1.5">
              <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-xs flex items-center justify-center">
                1
              </div>
              <div className="font-semibold text-xs text-white">Lưu vào Bookmark</div>
              <p className="text-[11px] text-neutral-400">
                Kéo nút "⚡ CapCut AI Vietsub" lên thanh dấu trang của trình duyệt.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-850 border border-neutral-800 space-y-1.5">
              <div className="w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 font-bold text-xs flex items-center justify-center">
                2
              </div>
              <div className="font-semibold text-xs text-white">Mở trang xem phim</div>
              <p className="text-[11px] text-neutral-400">
                Truy cập YouTube, FPT Play, Bilibili, Motchill hoặc bất cứ web nào có video.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-850 border border-neutral-800 space-y-1.5">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">
                3
              </div>
              <div className="font-semibold text-xs text-white">Nhấp để bật Vietsub</div>
              <p className="text-[11px] text-neutral-400">
                Bấm nút bookmark: Lớp phụ đề Vietsub nổi tự động đồng bộ và hiển thị!
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Simulation Sandbox */}
        <div className="p-6 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Trải nghiệm mô phỏng Bookmarklet ngay tại đây</span>
              </h3>
              <p className="text-xs text-neutral-400">
                Thử nghiệm tính năng hiển thị lớp phụ đề nổi của bookmarklet trên video mô phỏng
              </p>
            </div>

            <button
              onClick={() => {
                setIsSimActive((prev) => !prev);
                audioEngine.playSfx('ding');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                isSimActive
                  ? 'bg-red-500 hover:bg-red-400 text-white'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/25'
              }`}
            >
              {isSimActive ? 'Tắt lớp phủ Bookmarklet' : 'Kích hoạt thử Bookmarklet'}
            </button>
          </div>

          {/* Simulation Viewport */}
          <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-neutral-800 flex items-center justify-center">
            <video
              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"
              controls
              className="w-full h-full object-contain"
            />

            {/* Simulated Bookmarklet Overlay Container */}
            {isSimActive && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 pointer-events-auto max-w-[90%]">
                {/* Subtitle Pill */}
                <div className="bg-neutral-950/85 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-3 shadow-2xl text-center cursor-move">
                  {(simMode === 'bilingual' || simMode === 'vi') && (
                    <div className="text-lg md:text-xl font-black text-yellow-400 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                      ⚡ Celia: "Cơn bão khoa học công nghệ đang kéo đến thủ đô Amsterdam!"
                    </div>
                  )}
                  {(simMode === 'bilingual' || simMode === 'en') && (
                    <div className="text-xs md:text-sm font-medium text-neutral-200 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] mt-0.5">
                      The cyber storm is descending upon the city.
                    </div>
                  )}
                </div>

                {/* Simulated Floating Bookmarklet Toolbar */}
                <div className="flex items-center gap-1.5 bg-neutral-900/90 backdrop-blur-md border border-neutral-750 px-3 py-1 rounded-full text-xs shadow-lg">
                  <span className="font-semibold text-[11px] text-neutral-300">
                    Bù lệch: {simOffset.toFixed(1)}s
                  </span>
                  <button
                    onClick={() => setSimOffset((o) => Number((o - 0.5).toFixed(1)))}
                    className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[10px]"
                  >
                    -0.5s
                  </button>
                  <button
                    onClick={() => setSimOffset((o) => Number((o + 0.5).toFixed(1)))}
                    className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[10px]"
                  >
                    +0.5s
                  </button>

                  <button
                    onClick={() => {
                      if (simMode === 'bilingual') setSimMode('vi');
                      else if (simMode === 'vi') setSimMode('en');
                      else setSimMode('bilingual');
                    }}
                    className="px-2 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-[10px] ml-1"
                  >
                    {simMode === 'bilingual'
                      ? 'Song ngữ (VI/EN)'
                      : simMode === 'vi'
                      ? 'Chỉ Tiếng Việt'
                      : 'Chỉ Tiếng Gốc'}
                  </button>

                  <button
                    onClick={() => setIsSimActive(false)}
                    className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold ml-1"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};




