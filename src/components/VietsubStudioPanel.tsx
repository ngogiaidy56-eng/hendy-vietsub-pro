import React, { useState } from 'react';
import {
  Subtitles,
  Sparkles,
  Plus,
  Trash2,
  Download,
  RotateCcw,
  Globe,
  Film,
  Zap,
  Bookmark,
  Check,
  Search,
  Type,
  Palette,
  Sliders,
  X,
} from 'lucide-react';
import { SubtitleSegment, SubtitleDisplayMode } from '../types/editor';
import { SAMPLE_VIDEOS } from '../utils/sampleData';
import { generateSrtContent, generateVttContent, downloadFile } from '../utils/subtitleExporter';
import { audioEngine } from '../utils/audioEngine';

interface VietsubStudioPanelProps {
  subtitles: SubtitleSegment[];
  onUpdateSubtitles: (subs: SubtitleSegment[]) => void;
  subtitleMode: SubtitleDisplayMode;
  setSubtitleMode: (mode: SubtitleDisplayMode) => void;
  subtitleOffset: number;
  setSubtitleOffset: (fn: (prev: number) => number) => void;
  currentTime: number;
  onSeek: (time: number) => void;
  onImportWebVideo: (videoUrl: string, videoTitle: string, sampleSubs?: SubtitleSegment[]) => void;
  onOpenBookmarklet: () => void;
  onClose?: () => void;
}

export const VietsubStudioPanel: React.FC<VietsubStudioPanelProps> = ({
  subtitles,
  onUpdateSubtitles,
  subtitleMode,
  setSubtitleMode,
  subtitleOffset,
  setSubtitleOffset,
  currentTime,
  onSeek,
  onImportWebVideo,
  onOpenBookmarklet,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'ai-generate' | 'web-import' | 'styles'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [webVideoUrl, setWebVideoUrl] = useState('');

  // AI prompt state
  const [promptText, setPromptText] = useState(
    'Dịch thoại video sang tiếng Việt phong cách điện ảnh Hollywood, nhịp điệu kịch tính và cuốn hút.'
  );

  // Subtitle styling state (Font size, colors, shadow)
  const [fontSize, setFontSize] = useState<number>(20);
  const [textColor, setTextColor] = useState<string>('#facc15'); // Gold
  const [bgOpacity, setBgOpacity] = useState<number>(85);

  // Update a subtitle segment
  const handleUpdateSub = (
    id: string,
    field: 'textVi' | 'textOriginal' | 'start' | 'end' | 'speaker',
    val: any
  ) => {
    onUpdateSubtitles(
      subtitles.map((s) => (s.id === id ? { ...s, [field]: val } : s))
    );
  };

  // Delete a subtitle segment
  const handleDeleteSub = (id: string) => {
    onUpdateSubtitles(subtitles.filter((s) => s.id !== id));
    audioEngine.playSfx('pop');
  };

  // Add new subtitle cue at playhead
  const handleAddCueAtPlayhead = () => {
    const newCue: SubtitleSegment = {
      id: `cue_${Date.now()}`,
      start: Number(currentTime.toFixed(1)),
      end: Number((currentTime + 3.0).toFixed(1)),
      textOriginal: 'New original dialogue...',
      textVi: 'Dòng phụ đề tiếng Việt mới...',
      speaker: 'Diễn viên',
    };
    onUpdateSubtitles([...subtitles, newCue].sort((a, b) => a.start - b.start));
    audioEngine.playSfx('ding');
  };

  // AI Auto-translate existing or generate new subtitles
  const handleAiAutoTranslate = async () => {
    setIsTranslating(true);
    try {
      const res = await fetch('/api/gemini/subtitles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          videoTitle: 'CapCut Timeline Project',
          clipDuration: 30,
        }),
      });
      const data = await res.json();
      if (data.success && data.subtitles) {
        onUpdateSubtitles(data.subtitles);
        audioEngine.playSfx('ding');
      }
    } catch (err) {
      console.error('AI translation error:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const filteredSubs = subtitles.filter(
    (s) =>
      s.textVi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.textOriginal.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-80 md:w-96 bg-[#0f172a] border border-slate-800/80 rounded-xl flex flex-col shrink-0 select-none overflow-hidden h-full z-20 shadow-lg shadow-black/20 text-slate-200">
      {/* Header */}
      <div className="h-10 px-3.5 border-b border-slate-800 bg-[#111c35] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-6 h-6 rounded-md bg-yellow-500/20 text-yellow-400 flex items-center justify-center font-bold text-xs">
            <Subtitles className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-extrabold text-xs text-white">Chế độ Vietsub AI</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
              {subtitles.length} câu
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onOpenBookmarklet}
            className="p-1.5 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 text-xs flex items-center gap-1 transition-all border border-pink-500/30"
            title="1-Click Vietsub Bookmarklet cho web xem phim"
          >
            <Bookmark className="w-3 h-3" />
            <span className="text-[10px] font-bold hidden sm:inline">Bookmarklet</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mode Switcher & Sync Offset Controls */}
      <div className="p-2.5 bg-neutral-950/90 border-b border-neutral-800/80 space-y-2 shrink-0">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-neutral-400 font-medium">Hiển thị Vietsub:</span>
          <div className="flex items-center bg-neutral-900 rounded-lg p-0.5 border border-neutral-800">
            <button
              onClick={() => setSubtitleMode('bilingual')}
              className={`px-2 py-0.5 rounded ${
                subtitleMode === 'bilingual'
                  ? 'bg-cyan-500/20 text-cyan-400 font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Song ngữ
            </button>
            <button
              onClick={() => setSubtitleMode('vi-only')}
              className={`px-2 py-0.5 rounded ${
                subtitleMode === 'vi-only'
                  ? 'bg-yellow-500/20 text-yellow-400 font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Chỉ tiếng Việt
            </button>
            <button
              onClick={() => setSubtitleMode('original-only')}
              className={`px-2 py-0.5 rounded ${
                subtitleMode === 'original-only'
                  ? 'bg-purple-500/20 text-purple-400 font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Gốc
            </button>
          </div>
        </div>

        {/* Sync Offset Quick Buttons (+/- 0.5s) */}
        <div className="flex items-center justify-between text-[11px] bg-neutral-900 px-2.5 py-1.5 rounded-xl border border-neutral-800">
          <span className="text-neutral-400 font-medium">Bù độ lệch (Offset):</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSubtitleOffset((o) => Number((o - 0.5).toFixed(1)))}
              className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-mono text-[10px]"
              title="Lùi 0.5 giây"
            >
              -0.5s
            </button>
            <span
              className={`font-mono font-bold text-xs ${
                subtitleOffset !== 0 ? 'text-amber-400' : 'text-neutral-400'
              }`}
            >
              {subtitleOffset > 0 ? `+${subtitleOffset}s` : `${subtitleOffset}s`}
            </span>
            <button
              onClick={() => setSubtitleOffset((o) => Number((o + 0.5).toFixed(1)))}
              className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-mono text-[10px]"
              title="Tiến 0.5 giây"
            >
              +0.5s
            </button>
            {subtitleOffset !== 0 && (
              <button
                onClick={() => setSubtitleOffset(() => 0)}
                className="text-neutral-500 hover:text-white ml-0.5"
                title="Đặt lại về 0"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-800/80 bg-neutral-950/60 p-1 gap-1 shrink-0">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex-1 py-1 rounded-lg text-[11px] font-semibold transition-all ${
            activeTab === 'list'
              ? 'bg-neutral-800 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Danh sách câu
        </button>
        <button
          onClick={() => setActiveTab('ai-generate')}
          className={`flex-1 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1 ${
            activeTab === 'ai-generate'
              ? 'bg-neutral-800 text-yellow-400 shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          <span>Dịch AI</span>
        </button>
        <button
          onClick={() => setActiveTab('web-import')}
          className={`flex-1 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1 ${
            activeTab === 'web-import'
              ? 'bg-neutral-800 text-cyan-400 shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Globe className="w-3 h-3" />
          <span>Web Video</span>
        </button>
      </div>

      {/* Tab 1: Subtitle Cue List */}
      {activeTab === 'list' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Search & Add button */}
          <div className="p-2.5 border-b border-neutral-800/80 flex items-center gap-2 bg-neutral-950/40 shrink-0">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm nội dung phụ đề..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-2 py-1 text-xs text-neutral-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <button
              onClick={handleAddCueAtPlayhead}
              className="px-2.5 py-1 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-neutral-950 font-bold text-xs flex items-center gap-1 shadow-sm shrink-0"
              title="Thêm phụ đề tại vị trí con trỏ (playhead)"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm câu</span>
            </button>
          </div>

          {/* Independent Scrollable Subtitle List */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 text-xs">
            {filteredSubs.length === 0 ? (
              <div className="text-center py-10 text-neutral-500">
                Chưa có câu phụ đề nào phù hợp. Nhấp nút "Thêm câu" hoặc dùng tính năng "Dịch AI".
              </div>
            ) : (
              filteredSubs.map((sub, index) => {
                const isActive =
                  currentTime >= sub.start + subtitleOffset &&
                  currentTime <= sub.end + subtitleOffset;

                return (
                  <div
                    key={sub.id}
                    onClick={() => onSeek(sub.start)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer space-y-1.5 group ${
                      isActive
                        ? 'bg-yellow-950/20 border-yellow-500/60 ring-1 ring-yellow-500/40'
                        : 'bg-neutral-850/80 border-neutral-750 hover:border-neutral-600'
                    }`}
                  >
                    {/* Timing bar */}
                    <div className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1 font-mono text-cyan-400 font-semibold">
                        <span className="text-neutral-500 font-sans">#{index + 1}</span>
                        <input
                          type="number"
                          step="0.1"
                          value={sub.start}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            handleUpdateSub(sub.id, 'start', Number(e.target.value))
                          }
                          className="w-11 bg-neutral-900 border border-neutral-750 rounded px-1 text-center"
                        />
                        <span>→</span>
                        <input
                          type="number"
                          step="0.1"
                          value={sub.end}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            handleUpdateSub(sub.id, 'end', Number(e.target.value))
                          }
                          className="w-11 bg-neutral-900 border border-neutral-750 rounded px-1 text-center"
                        />
                        <span className="text-neutral-500">
                          ({(sub.end - sub.start).toFixed(1)}s)
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSub(sub.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition-all"
                        title="Xóa câu này"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Tiếng Việt */}
                    <div>
                      <textarea
                        rows={2}
                        value={sub.textVi}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          handleUpdateSub(sub.id, 'textVi', e.target.value)
                        }
                        placeholder="Nội dung phụ đề tiếng Việt..."
                        className="w-full bg-neutral-900/90 border border-yellow-500/30 rounded-lg p-1.5 text-xs font-semibold text-yellow-300 focus:outline-none focus:border-yellow-400 resize-none"
                      />
                    </div>

                    {/* Tiếng gốc */}
                    <div>
                      <input
                        type="text"
                        value={sub.textOriginal}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          handleUpdateSub(sub.id, 'textOriginal', e.target.value)
                        }
                        placeholder="Lời thoại gốc..."
                        className="w-full bg-neutral-900/60 border border-neutral-750 rounded px-2 py-0.5 text-[11px] text-neutral-300 focus:outline-none focus:border-neutral-500"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 2: AI Subtitle Generation & Translation */}
      {activeTab === 'ai-generate' && (
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-xs text-neutral-300">
          <div className="p-3 rounded-xl bg-gradient-to-r from-yellow-950/30 to-amber-950/30 border border-yellow-500/30 space-y-1">
            <div className="font-bold text-yellow-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dịch phụ đề điện ảnh bằng Gemini AI</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Tự động nhận diện thoại hoặc dịch kịch bản sang tiếng Việt chuẩn văn phong điện ảnh chuyên nghiệp.
            </p>
          </div>

          <div>
            <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
              Yêu cầu dịch & phong cách (Prompt):
            </label>
            <textarea
              rows={4}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className="w-full rounded-xl bg-neutral-850 border border-neutral-750 p-2.5 text-xs text-neutral-200 focus:outline-none focus:border-yellow-500 resize-none"
            />
          </div>

          <button
            onClick={handleAiAutoTranslate}
            disabled={isTranslating}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 disabled:opacity-50 text-neutral-950 font-extrabold text-xs shadow-lg shadow-yellow-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isTranslating ? 'Gemini đang phân tích & dịch...' : 'Tạo phụ đề Vietsub AI ngay'}</span>
          </button>
        </div>
      )}

      {/* Tab 3: Web Video Subtitle Mode Direct Integration */}
      {activeTab === 'web-import' && (
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-xs text-neutral-300">
          <div>
            <div className="font-bold text-xs text-white mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Dán liên kết Video từ Web</span>
            </div>
            <p className="text-[11px] text-neutral-400 mb-2">
              Dán URL video trực tiếp (MP4, WebM) để chèn ngay vào timeline cùng phụ đề:
            </p>
            <div className="space-y-2">
              <input
                type="text"
                value={webVideoUrl}
                onChange={(e) => setWebVideoUrl(e.target.value)}
                placeholder="https://.../video.mp4"
                className="w-full bg-neutral-950 border border-neutral-750 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={() => {
                  if (webVideoUrl.trim()) {
                    onImportWebVideo(webVideoUrl.trim(), 'Web Stream Video');
                    setWebVideoUrl('');
                  }
                }}
                disabled={!webVideoUrl.trim()}
                className="w-full py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-cyan-400 font-bold text-xs border border-neutral-700 transition-all"
              >
                Chèn video này vào Timeline
              </button>
            </div>
          </div>

          {/* Fast Sample Movie Clips */}
          <div className="pt-2 border-t border-neutral-800 space-y-2">
            <div className="font-bold text-[11px] text-neutral-400 uppercase tracking-wider">
              Phim mẫu bản quyền mở (Kèm Vietsub AI)
            </div>
            <div className="space-y-2">
              {SAMPLE_VIDEOS.map((sample) => (
                <div
                  key={sample.id}
                  className="p-2 rounded-xl bg-neutral-850 border border-neutral-750 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xs text-neutral-200 truncate">
                      {sample.title}
                    </div>
                    <div className="text-[10px] text-neutral-500">
                      {sample.duration}s • {sample.originalLang}
                    </div>
                  </div>
                  <button
                    onClick={() => onImportWebVideo(sample.url, sample.title)}
                    className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500 text-cyan-400 hover:text-black font-bold text-xs transition-all shrink-0"
                  >
                    Dựng phim
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer: Export Subtitle Files */}
      <div className="p-3 border-t border-neutral-800 bg-neutral-950/80 shrink-0">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              const srt = generateSrtContent(subtitles, subtitleMode);
              downloadFile(srt, `CapCut_Vietsub_${Date.now()}.srt`, 'text/plain');
            }}
            className="py-1.5 px-2 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 font-semibold text-[11px] flex items-center justify-center gap-1 transition-all"
          >
            <Download className="w-3 h-3 text-cyan-400" />
            <span>Tải .SRT</span>
          </button>
          <button
            onClick={() => {
              const vtt = generateVttContent(subtitles, subtitleMode);
              downloadFile(vtt, `CapCut_Vietsub_${Date.now()}.vtt`, 'text/vtt');
            }}
            className="py-1.5 px-2 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 font-semibold text-[11px] flex items-center justify-center gap-1 transition-all"
          >
            <Download className="w-3 h-3 text-pink-400" />
            <span>Tải .VTT</span>
          </button>
        </div>
      </div>
    </div>
  );
};


