import React, { useState } from 'react';
import {
  X,
  Bookmark,
  Copy,
  Check,
  Zap,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { generateBookmarkletCode } from '../utils/bookmarklet';
import { audioEngine } from '../utils/audioEngine';

interface BookmarkletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BookmarkletModal: React.FC<BookmarkletModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const bookmarkletCode = generateBookmarkletCode();

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopied(true);
    audioEngine.playSfx('ding');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 bg-neutral-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-white flex items-center gap-2">
                1-Click: Translate & Voiceover Anywhere
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  HANDS-FREE VOICEOVER
                </span>
              </div>
              <div className="text-[11px] text-neutral-400">
                Không cần đọc phụ đề — Tự động thuyết minh AI tiếng Việt trên YouTube, Netflix, Bilibili, Motchill
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs text-neutral-300">
          {/* Hands-free Voiceover Highlight Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/60 via-indigo-950/40 to-pink-950/40 border border-purple-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-purple-300 text-xs flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Đột phá: Không Cần Đọc Phụ Đề Nữa!
              </span>
              <button
                onClick={() =>
                  audioEngine.speakVietnameseSpeech(
                    'Đã kích hoạt thuyết minh tiếng Việt tự động. Bạn chỉ việc ngồi xem và lắng nghe, không cần đọc chữ.'
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-purple-700 hover:bg-purple-600 text-white font-bold text-[10px] shadow transition-all"
              >
                🔊 Nghe thử giọng AI
              </button>
            </div>
            <p className="text-[11px] text-neutral-200 leading-relaxed">
              Khi chạy Bookmarklet trên bất kỳ web phim nào, tiện ích sẽ <strong>tự động phát âm thanh thuyết minh AI tiếng Việt</strong> theo từng lời thoại nhân vật. Bạn có thể nằm thư giãn hoặc làm việc khác mà vẫn hiểu trọn vẹn nội dung phim mà không cần dán mắt vào màn hình!
            </p>
          </div>

          {/* Draggable button */}
          <div className="p-5 rounded-2xl bg-neutral-950 border border-dashed border-neutral-700 text-center space-y-3">
            <div className="text-xs text-neutral-400">
              👇 Kéo thả nút này lên thanh <strong>Bookmarks Bar</strong> của trình duyệt:
            </div>

            <div>
              <a
                href={bookmarkletCode}
                onClick={(e) => {
                  e.preventDefault();
                  alert('Hãy KÉO & THẢ nút này lên thanh Bookmark (dấu trang) trên trình duyệt của bạn!');
                }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white font-extrabold text-sm shadow-xl shadow-pink-500/25 cursor-grab active:cursor-grabbing hover:scale-105 transition-all"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>⚡ 1-Click: Translate & Voiceover Anywhere</span>
              </a>
            </div>

            <div className="text-[11px] text-neutral-500">
              Phím tắt mở thanh Bookmark: <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono">Ctrl + Shift + B</kbd> (hoặc <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono">Cmd + Shift + B</kbd> trên Mac)
            </div>
          </div>

          {/* Copy Javascript Code */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-850 border border-neutral-750">
            <div>
              <div className="font-bold text-xs text-white">Hoặc sao chép mã Javascript:</div>
              <div className="text-[10px] text-neutral-400">Dành cho trình duyệt trên điện thoại hoặc tạo bookmark thủ công</div>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-semibold text-xs transition-all shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã sao chép!' : 'Sao chép mã'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-950/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-xs shadow-sm transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};


