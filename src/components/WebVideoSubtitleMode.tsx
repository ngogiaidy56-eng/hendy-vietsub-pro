import React, { useState, useRef, useEffect } from 'react';
import {
  Globe,
  Sparkles,
  Play,
  Pause,
  Subtitles,
  Download,
  Plus,
  Trash2,
  Edit2,
  Film,
  RotateCcw,
  Check,
  ExternalLink,
  Volume2,
} from 'lucide-react';
import { SAMPLE_VIDEOS } from '../utils/sampleData';
import { SubtitleSegment, SubtitleDisplayMode } from '../types/editor';
import { generateSrtContent, generateVttContent, downloadFile } from '../utils/subtitleExporter';
import { audioEngine } from '../utils/audioEngine';

interface WebVideoSubtitleModeProps {
  onImportToTimeline: (videoUrl: string, videoTitle: string, subtitles: SubtitleSegment[]) => void;
}

export const WebVideoSubtitleMode: React.FC<WebVideoSubtitleModeProps> = ({
  onImportToTimeline,
}) => {
  const [selectedSample, setSelectedSample] = useState(SAMPLE_VIDEOS[0]);
  const [videoUrlInput, setVideoUrlInput] = useState(SAMPLE_VIDEOS[0].url);
  const [currentVideoSrc, setCurrentVideoSrc] = useState(SAMPLE_VIDEOS[0].url);

  // Subtitle list & offset
  const [subtitles, setSubtitles] = useState<SubtitleSegment[]>([
    {
      id: 'web_sub_1',
      start: 0.5,
      end: 4.0,
      textOriginal: 'What are you doing here, Thom? The storm is coming.',
      textVi: 'Anh đang làm gì ở đây vậy Thom? Cơn bão sắp kéo đến rồi.',
      speaker: 'Celia',
    },
    {
      id: 'web_sub_2',
      start: 4.5,
      end: 8.5,
      textOriginal: 'I came to stop you before the rocket launches into the sky.',
      textVi: 'Tôi đến để ngăn cô trước khi quả tên lửa phóng lên bầu trời.',
      speaker: 'Thom',
    },
    {
      id: 'web_sub_3',
      start: 9.0,
      end: 13.5,
      textOriginal: 'You never understood what we were truly building together.',
      textVi: 'Cô chưa từng hiểu những gì chúng ta đã cùng nhau gầy dựng.',
      speaker: 'Celia',
    },
    {
      id: 'web_sub_4',
      start: 14.0,
      end: 18.0,
      textOriginal: 'It is about saving what remains of our fragile world.',
      textVi: 'Vấn đề là cứu lấy những gì còn sót lại của thế giới mong manh này.',
      speaker: 'Thom',
    },
  ]);

  const [subtitleMode, setSubtitleMode] = useState<SubtitleDisplayMode>('bilingual');
  const [syncOffset, setSyncOffset] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [videoError, setVideoError] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Active subtitle cue with sync offset applied
  const effectiveTime = currentTime + syncOffset;
  const activeSub = subtitles.find(
    (s) => effectiveTime >= s.start && effectiveTime <= s.end
  );

  // Load selected sample video
  const handleSelectSample = (sample: typeof SAMPLE_VIDEOS[0]) => {
    setSelectedSample(sample);
    setVideoUrlInput(sample.url);
    setCurrentVideoSrc(sample.url);
    setVideoError(false);
    setCurrentTime(0);
    if (videoRef.current) {
      try {
        videoRef.current.currentTime = 0;
      } catch {}
    }
  };

  // Load custom video URL
  const handleLoadCustomUrl = () => {
    if (!videoUrlInput.trim()) return;
    setCurrentVideoSrc(videoUrlInput.trim());
    setVideoError(false);
    setCurrentTime(0);
    if (videoRef.current) {
      try {
        videoRef.current.currentTime = 0;
      } catch {}
    }
  };

  // Fallback playback timer for simulated playhead when external video source cannot be loaded
  useEffect(() => {
    let timer: any = null;
    if (videoError && isPlaying) {
      timer = setInterval(() => {
        setCurrentTime((t) => {
          if (t >= selectedSample.duration) {
            setIsPlaying(false);
            return 0;
          }
          return Number((t + 0.1).toFixed(1));
        });
      }, 100);
    }
    return () => clearInterval(timer);
  }, [videoError, isPlaying, selectedSample.duration]);

  // AI Subtitle Recognition & Vietnamese Translation via Gemini
  const handleRecognizeAndTranslate = async () => {
    setIsTranslating(true);
    try {
      const res = await fetch('/api/gemini/subtitles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoTitle: selectedSample.title,
          prompt: `Translate the dialogue of this video to Vietnamese with cinema-quality translation. Context: ${selectedSample.description}`,
          originalLanguage: selectedSample.originalLang,
          clipDuration: selectedSample.duration,
          customScript: selectedSample.sampleScript,
        }),
      });

      const data = await res.json();
      if (data.success && data.subtitles) {
        setSubtitles(data.subtitles);
        audioEngine.playSfx('ding');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTranslating(false);
    }
  };

  // Update a subtitle segment in place
  const handleUpdateSub = (id: string, field: 'textVi' | 'textOriginal' | 'start' | 'end', val: any) => {
    setSubtitles((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: val } : s))
    );
  };

  // Delete a subtitle segment
  const handleDeleteSub = (id: string) => {
    setSubtitles((prev) => prev.filter((s) => s.id !== id));
  };

  // Add new subtitle cue
  const handleAddNewSub = () => {
    const newSub: SubtitleSegment = {
      id: `sub_custom_${Date.now()}`,
      start: Number(currentTime.toFixed(1)),
      end: Number((currentTime + 3).toFixed(1)),
      textOriginal: 'New dialogue line',
      textVi: 'Dòng phụ đề tiếng Việt mới',
      speaker: 'Speaker',
    };
    setSubtitles((prev) => [...prev, newSub]);
  };

  const filteredSubs = subtitles.filter(
    (s) =>
      s.textVi.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.textOriginal.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full min-h-0 bg-neutral-950 text-neutral-200 overflow-hidden">
      {/* Left Column: Video Player with Real-time Vietsub Overlay */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-neutral-800/80 bg-neutral-950">
        {/* Top Video URL Bar & Sample Picker */}
        <div className="p-3 bg-neutral-900/90 border-b border-neutral-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[280px]">
            <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
            <input
              type="text"
              value={videoUrlInput}
              onChange={(e) => setVideoUrlInput(e.target.value)}
              placeholder="Dán link video trực tiếp (MP4, WebM, HLS)..."
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={handleLoadCustomUrl}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-semibold transition-all"
            >
              Tải link
            </button>
          </div>

          {/* Quick Sample Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-neutral-500 font-medium">Video mẫu:</span>
            {SAMPLE_VIDEOS.map((sample) => (
              <button
                key={sample.id}
                onClick={() => handleSelectSample(sample)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  selectedSample.id === sample.id
                    ? 'bg-cyan-500 text-neutral-950 shadow-sm'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {sample.title.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Video Player Display */}
        <div className="flex-1 flex items-center justify-center p-4 bg-black relative min-h-0 overflow-hidden">
          <div className="relative max-h-full aspect-video rounded-xl overflow-hidden shadow-2xl border border-neutral-800/80 flex items-center justify-center bg-neutral-950">
            {!videoError ? (
              <video
                ref={videoRef}
                key={currentVideoSrc}
                src={currentVideoSrc}
                onError={() => {
                  console.warn('[WebVideoSubtitleMode] Video source unavailable, activating simulated preview:', currentVideoSrc);
                  setVideoError(true);
                }}
                onTimeUpdate={() => {
                  if (videoRef.current) {
                    setCurrentTime(videoRef.current.currentTime);
                  }
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="w-full h-full object-contain"
                playsInline
                preload="metadata"
              />
            ) : (
              <div className="w-full h-full relative flex items-center justify-center">
                <img
                  src={selectedSample.thumbnail}
                  alt={selectedSample.title}
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute top-3 left-3 right-3 bg-neutral-900/90 border border-neutral-700/60 rounded-lg px-3 py-1.5 flex items-center justify-between text-[11px] text-neutral-300 backdrop-blur-sm">
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    Chế độ xem trước phụ đề điện ảnh (Nguồn video trực tuyến kích hoạt giả lập)
                  </span>
                  <button
                    onClick={() => {
                      setVideoError(false);
                      if (videoRef.current) videoRef.current.load();
                    }}
                    className="text-cyan-400 hover:underline text-[10px]"
                  >
                    Thử tải lại
                  </button>
                </div>
              </div>
            )}

            {/* Dynamic Real-time Subtitle Overlay on Video */}
            {activeSub && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 max-w-[88%] z-20 pointer-events-none text-center">
                <div className="bg-neutral-950/85 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-3 shadow-2xl shadow-black inline-block">
                  {(subtitleMode === 'bilingual' || subtitleMode === 'vi-only') && (
                    <div className="text-xl md:text-2xl font-black text-yellow-400 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] tracking-wide">
                      {activeSub.textVi}
                    </div>
                  )}
                  {(subtitleMode === 'bilingual' || subtitleMode === 'original-only') && (
                    <div className="text-sm font-medium text-neutral-200 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] mt-0.5">
                      {activeSub.textOriginal}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Player Transport Bar & Subtitle Sync Offset Controls */}
        <div className="h-12 bg-neutral-900/90 border-t border-neutral-800/80 px-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (videoError) {
                  setIsPlaying((p) => !p);
                  return;
                }
                if (!videoRef.current) return;
                if (isPlaying) {
                  try {
                    videoRef.current.pause();
                  } catch {}
                } else {
                  videoRef.current.play().catch((err) => {
                    console.debug('Play request handled safely:', err?.message);
                  });
                }
              }}
              className="w-8 h-8 rounded-full bg-cyan-500 text-neutral-950 flex items-center justify-center shadow-md active:scale-95"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current translate-x-0.5" />}
            </button>

            <span className="font-mono text-xs text-cyan-400">
              {currentTime.toFixed(1)}s
            </span>
          </div>

          {/* Subtitle Sync Offset Buttons (+/- 0.5s) */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-neutral-950 px-2.5 py-1 rounded-lg border border-neutral-800">
              <span className="text-[11px] text-neutral-400 font-medium">Bù trừ lệch thời gian (Offset):</span>
              <button
                onClick={() => setSyncOffset((o) => Number((o - 0.5).toFixed(1)))}
                className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-mono text-[11px]"
                title="Lùi 0.5 giây"
              >
                -0.5s
              </button>
              <span
                className={`font-mono font-bold text-xs ${
                  syncOffset !== 0 ? 'text-amber-400' : 'text-neutral-300'
                }`}
              >
                {syncOffset > 0 ? `+${syncOffset}s` : `${syncOffset}s`}
              </span>
              <button
                onClick={() => setSyncOffset((o) => Number((o + 0.5).toFixed(1)))}
                className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-mono text-[11px]"
                title="Tiến 0.5 giây"
              >
                +0.5s
              </button>
              {syncOffset !== 0 && (
                <button
                  onClick={() => setSyncOffset(0)}
                  className="text-neutral-500 hover:text-white ml-1 text-[10px]"
                  title="Đặt lại về 0"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Display Mode Switcher */}
            <div className="flex items-center bg-neutral-950 rounded-lg p-0.5 border border-neutral-800 text-[11px]">
              <button
                onClick={() => setSubtitleMode('bilingual')}
                className={`px-2 py-1 rounded ${
                  subtitleMode === 'bilingual'
                    ? 'bg-cyan-500/20 text-cyan-400 font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Song ngữ
              </button>
              <button
                onClick={() => setSubtitleMode('vi-only')}
                className={`px-2 py-1 rounded ${
                  subtitleMode === 'vi-only'
                    ? 'bg-yellow-500/20 text-yellow-400 font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Chỉ Vietsub
              </button>
              <button
                onClick={() => setSubtitleMode('original-only')}
                className={`px-2 py-1 rounded ${
                  subtitleMode === 'original-only'
                    ? 'bg-purple-500/20 text-purple-400 font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Tiếng gốc
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Independent Subtitle Cue Editor (no forced sync with video playback) */}
      <div className="w-full md:w-96 flex flex-col bg-neutral-900/95 shrink-0 overflow-hidden">
        {/* Header of Subtitle List */}
        <div className="p-3 border-b border-neutral-800/80 bg-neutral-950/60 flex items-center justify-between">
          <div>
            <div className="font-bold text-xs text-white flex items-center gap-1.5">
              <Subtitles className="w-3.5 h-3.5 text-yellow-400" />
              <span>Danh sách phụ đề Vietsub</span>
            </div>
            <div className="text-[10px] text-neutral-500">
              Tự do cuộn và chỉnh sửa (không khóa theo phát video)
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleAddNewSub}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs flex items-center gap-1 font-semibold"
              title="Thêm phụ đề mới"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>Thêm</span>
            </button>
          </div>
        </div>

        {/* AI Action Banner */}
        <div className="p-3 bg-gradient-to-r from-amber-950/40 via-yellow-950/30 to-neutral-950 border-b border-neutral-800/80 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <div className="font-bold text-xs text-yellow-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gemini AI Auto-Vietsub</span>
            </div>
            <div className="text-[10px] text-neutral-400">
              Nhận diện & dịch phụ đề điện ảnh chuẩn xác
            </div>
          </div>
          <button
            onClick={handleRecognizeAndTranslate}
            disabled={isTranslating}
            className="px-3 py-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-neutral-950 font-bold text-xs shadow-md shadow-yellow-500/20 active:scale-95 transition-all shrink-0"
          >
            {isTranslating ? 'Đang dịch...' : 'Dịch Vietsub'}
          </button>
        </div>

        {/* Subtitle Search */}
        <div className="p-2 border-b border-neutral-800/80 bg-neutral-950/40">
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Tìm kiếm dòng phụ đề..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-300 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Editable Subtitle List - Independent scrolling */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {filteredSubs.length === 0 ? (
            <div className="text-center py-10 text-neutral-500 text-xs">
              Không tìm thấy phụ đề nào.
            </div>
          ) : (
            filteredSubs.map((sub, idx) => (
              <div
                key={sub.id}
                className="p-2.5 rounded-xl bg-neutral-850 border border-neutral-750 hover:border-neutral-600 transition-all space-y-2 group"
              >
                {/* Time range & delete */}
                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1 font-mono text-cyan-400 font-semibold">
                    <input
                      type="number"
                      step="0.1"
                      value={sub.start}
                      onChange={(e) =>
                        handleUpdateSub(sub.id, 'start', Number(e.target.value))
                      }
                      className="w-12 bg-neutral-900 border border-neutral-750 rounded px-1 text-center"
                    />
                    <span>→</span>
                    <input
                      type="number"
                      step="0.1"
                      value={sub.end}
                      onChange={(e) =>
                        handleUpdateSub(sub.id, 'end', Number(e.target.value))
                      }
                      className="w-12 bg-neutral-900 border border-neutral-750 rounded px-1 text-center"
                    />
                    <span className="text-neutral-500 ml-1">
                      ({(sub.end - sub.start).toFixed(1)}s)
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteSub(sub.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-neutral-500 hover:text-red-400 transition-all"
                    title="Xóa dòng này"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Vietnamese Translation (Yellow) */}
                <div>
                  <textarea
                    rows={2}
                    value={sub.textVi}
                    onChange={(e) => handleUpdateSub(sub.id, 'textVi', e.target.value)}
                    className="w-full bg-neutral-900/90 border border-yellow-500/30 rounded-lg p-1.5 text-xs font-semibold text-yellow-300 focus:outline-none focus:border-yellow-400 resize-none"
                    placeholder="Lời dịch Tiếng Việt..."
                  />
                </div>

                {/* Original Language (Neutral) */}
                <div>
                  <input
                    type="text"
                    value={sub.textOriginal}
                    onChange={(e) =>
                      handleUpdateSub(sub.id, 'textOriginal', e.target.value)
                    }
                    className="w-full bg-neutral-900/60 border border-neutral-750 rounded px-2 py-1 text-[11px] text-neutral-300 focus:outline-none focus:border-neutral-500"
                    placeholder="Lời thoại gốc..."
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions: Download SRT / VTT & Send to Studio */}
        <div className="p-3 border-t border-neutral-800/80 bg-neutral-950/80 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                const srt = generateSrtContent(subtitles, subtitleMode);
                downloadFile(srt, 'capcut_vietsub.srt', 'text/plain');
              }}
              className="py-1.5 px-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 border border-neutral-700 flex items-center justify-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tải file .SRT</span>
            </button>
            <button
              onClick={() => {
                const vtt = generateVttContent(subtitles, subtitleMode);
                downloadFile(vtt, 'capcut_vietsub.vtt', 'text/vtt');
              }}
              className="py-1.5 px-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 border border-neutral-700 flex items-center justify-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-pink-400" />
              <span>Tải file .VTT</span>
            </button>
          </div>

          <button
            onClick={() => onImportToTimeline(currentVideoSrc, selectedSample.title, subtitles)}
            className="w-full py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Film className="w-3.5 h-3.5" />
            <span>Chuyển video & phụ đề sang Trình dựng Timeline</span>
          </button>
        </div>
      </div>
    </div>
  );
};


