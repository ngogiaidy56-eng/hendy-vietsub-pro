import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  SkipBack,
  SkipForward,
  Subtitles,
  Headphones,
  Sparkles,
  Sliders,
  Settings,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import {
  VideoClip,
  SubtitleSegment,
  SubtitleDisplayMode,
  MultiChannelAudioConfig,
} from '../types/editor';
import { audioEngine } from '../utils/audioEngine';

interface FullScreenCinemaModeProps {
  isOpen: boolean;
  onClose: () => void;
  videoClips: VideoClip[];
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onStepFrame: (frames: number) => void;
  subtitles: SubtitleSegment[];
  subtitleMode: SubtitleDisplayMode;
  setSubtitleMode: (mode: SubtitleDisplayMode) => void;
  subtitleOffset: number;
  setSubtitleOffset: (fn: (prev: number) => number) => void;
  audioConfig: MultiChannelAudioConfig;
  onChangeAudioConfig: (newConfig: MultiChannelAudioConfig) => void;
}

export const FullScreenCinemaMode: React.FC<FullScreenCinemaModeProps> = ({
  isOpen,
  onClose,
  videoClips,
  currentTime,
  duration,
  isPlaying,
  onTogglePlay,
  onSeek,
  onStepFrame,
  subtitles,
  subtitleMode,
  setSubtitleMode,
  subtitleOffset,
  setSubtitleOffset,
  audioConfig,
  onChangeAudioConfig,
}) => {
  const [showControls, setShowControls] = useState(true);
  const [showAudioDrawer, setShowAudioDrawer] = useState(false);
  const [fontSize, setFontSize] = useState<number>(32);
  const [lastSpokenSubId, setLastSpokenSubId] = useState<string>('');
  const hideTimeoutRef = useRef<any>(null);

  // Active clip determination
  const activeClip = videoClips.find(
    (c) => currentTime >= c.startTime && currentTime <= c.startTime + c.duration
  ) || videoClips[0];

  // Active subtitle determination
  const effectiveTime = currentTime + subtitleOffset;
  const currentSub = subtitles.find(
    (s) => effectiveTime >= s.start && effectiveTime <= s.end
  );

  // Auto Voiceover effect: When a new subtitle appears and handsFreeAutoRead is true, speak it!
  useEffect(() => {
    if (
      isPlaying &&
      audioConfig.aiVoiceover.handsFreeAutoRead &&
      !audioConfig.aiVoiceover.isMuted &&
      currentSub &&
      currentSub.id !== lastSpokenSubId
    ) {
      setLastSpokenSubId(currentSub.id);
      audioEngine.speakVietnameseSpeech(
        currentSub.textVi,
        audioConfig.aiVoiceover.voiceGender
      );
    }
  }, [currentSub, isPlaying, audioConfig.aiVoiceover, lastSpokenSubId]);

  // Mouse idle detection to hide on-screen controls
  const handleMouseMove = () => {
    setShowControls(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setShowAudioDrawer(false);
      }
    }, 3500);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'f' || e.key === 'F') {
        if (e.key === 'Escape' || (e.target as HTMLElement).tagName !== 'INPUT') {
          onClose();
        }
      } else if (e.code === 'Space') {
        e.preventDefault();
        onTogglePlay();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onSeek(Math.max(0, currentTime - 5));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onSeek(Math.min(duration, currentTime + 5));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentTime, duration, onTogglePlay, onSeek, onClose]);

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m}:${s < 10 ? '0' : ''}${s}.${ms}`;
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="fixed inset-0 z-50 bg-black text-white flex flex-col justify-between overflow-hidden select-none"
    >
      {/* Top Header Overlay */}
      <div
        className={`absolute top-0 inset-x-0 p-5 flex items-center justify-between z-40 transition-opacity duration-300 bg-gradient-to-b from-black/90 via-black/50 to-transparent ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="font-black text-sm tracking-wider uppercase text-cyan-400 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
            Chế Độ Rạp Phim Toàn Màn Hình (Cinema Vietsub Mode)
          </span>

          {/* Hands-free Voiceover Live Badge */}
          {audioConfig.aiVoiceover.handsFreeAutoRead && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/80 border border-purple-500/50 text-purple-200 text-xs font-bold shadow-lg shadow-purple-900/30">
              <Headphones className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
              <span>🎙️ Thuyết Minh AI Đang Phát (Không Cần Đọc)</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Subtitle Mode Selector */}
          <div className="flex items-center gap-1 bg-neutral-900/90 border border-neutral-750 px-2 py-1 rounded-xl text-xs">
            <button
              onClick={() => setSubtitleMode('bilingual')}
              className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                subtitleMode === 'bilingual' ? 'bg-cyan-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Song Ngữ
            </button>
            <button
              onClick={() => setSubtitleMode('vi-only')}
              className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                subtitleMode === 'vi-only' ? 'bg-amber-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Chỉ Tiếng Việt
            </button>
            <button
              onClick={() => setSubtitleMode('original-only')}
              className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                subtitleMode === 'original-only' ? 'bg-purple-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Chỉ Tiếng Gốc
            </button>
          </div>

          {/* Font Size Adjuster */}
          <div className="flex items-center gap-1 bg-neutral-900/90 border border-neutral-750 px-2 py-1 rounded-xl text-xs">
            <button
              onClick={() => setFontSize((s) => Math.max(20, s - 4))}
              className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-bold"
              title="Giảm cỡ chữ"
            >
              A-
            </button>
            <span className="font-mono px-1">{fontSize}px</span>
            <button
              onClick={() => setFontSize((s) => Math.min(52, s + 4))}
              className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-bold"
              title="Tăng cỡ chữ"
            >
              A+
            </button>
          </div>

          {/* Exit Fullscreen */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-750 text-neutral-300 hover:text-white transition-all"
            title="Thoát toàn màn hình (Esc hoặc F)"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Cinema Viewport */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center bg-black overflow-hidden">
        {activeClip?.type === 'video' ? (
          <video
            src={activeClip.src}
            className="w-full h-full object-contain pointer-events-none"
            muted={audioConfig.originalVideo.isMuted}
          />
        ) : (
          <img
            src={activeClip?.src || activeClip?.thumbnail}
            alt="Cinema Frame"
            className="w-full h-full object-contain pointer-events-none"
          />
        )}

        {/* Cinematic Subtitle Overlay */}
        {currentSub && (
          <div className="absolute bottom-24 inset-x-0 flex flex-col items-center justify-center px-8 z-30 pointer-events-none">
            <div className="max-w-4xl text-center bg-black/65 backdrop-blur-md border border-white/10 rounded-2xl px-8 py-4 shadow-[0_10px_40px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-150">
              {(subtitleMode === 'bilingual' || subtitleMode === 'vi-only') && (
                <div
                  style={{ fontSize: `${fontSize}px` }}
                  className="font-extrabold text-yellow-400 tracking-wide drop-shadow-[0_4px_12px_rgba(0,0,0,1)] leading-snug"
                >
                  {currentSub.textVi}
                </div>
              )}

              {(subtitleMode === 'bilingual' || subtitleMode === 'original-only') && (
                <div
                  style={{ fontSize: `${Math.round(fontSize * 0.65)}px` }}
                  className="font-semibold text-neutral-200 opacity-90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] mt-1"
                >
                  {currentSub.textOriginal}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Multi-Channel Audio Drawer (Floating Drawer) */}
      {showAudioDrawer && (
        <div className="absolute bottom-28 right-8 z-40 w-80 bg-neutral-900/95 border border-neutral-750 backdrop-blur-lg rounded-2xl p-4 shadow-2xl space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <span className="font-extrabold text-xs text-white flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5 text-cyan-400" />
              Âm Thanh Đa Kênh Nhanh
            </span>
            <button
              onClick={() => setShowAudioDrawer(false)}
              className="p-1 rounded hover:bg-neutral-800 text-neutral-400"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Channel Sliders */}
          <div className="space-y-2 text-xs">
            <div>
              <div className="flex justify-between text-[11px] text-neutral-300 mb-1">
                <span>Kênh 1: Video Gốc</span>
                <span className="font-mono text-white">{audioConfig.originalVideo.volume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={audioConfig.originalVideo.volume}
                onChange={(e) =>
                  onChangeAudioConfig({
                    ...audioConfig,
                    originalVideo: { ...audioConfig.originalVideo, volume: Number(e.target.value) },
                  })
                }
                className="w-full accent-blue-500 h-1 bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-purple-300 mb-1">
                <span>Kênh 2: Lồng Tiếng AI</span>
                <span className="font-mono text-purple-200 font-bold">{audioConfig.aiVoiceover.volume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={audioConfig.aiVoiceover.volume}
                onChange={(e) =>
                  onChangeAudioConfig({
                    ...audioConfig,
                    aiVoiceover: { ...audioConfig.aiVoiceover, volume: Number(e.target.value) },
                  })
                }
                className="w-full accent-purple-500 h-1 bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-emerald-300 mb-1">
                <span>Kênh 3: Nhạc Nền (BGM)</span>
                <span className="font-mono text-white">{audioConfig.bgm.volume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={audioConfig.bgm.volume}
                onChange={(e) =>
                  onChangeAudioConfig({
                    ...audioConfig,
                    bgm: { ...audioConfig.bgm, volume: Number(e.target.value) },
                  })
                }
                className="w-full accent-emerald-500 h-1 bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Bottom Floating Control Bar */}
      <div
        className={`absolute bottom-0 inset-x-0 p-5 flex flex-col gap-3 z-40 transition-opacity duration-300 bg-gradient-to-t from-black/95 via-black/70 to-transparent ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Scrubber Bar */}
        <div className="w-full flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-neutral-300">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min="0"
            max={duration || 1}
            step="0.033"
            value={currentTime}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="flex-1 h-1.5 bg-neutral-800 accent-cyan-500 rounded-lg cursor-pointer"
          />
          <span className="text-xs font-mono text-neutral-400">
            {formatTime(duration)}
          </span>
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Step -1F */}
            <button
              onClick={() => onStepFrame(-1)}
              className="px-2.5 py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-750 text-xs font-bold text-neutral-300"
              title="Lùi 1 khung hình"
            >
              -1F
            </button>

            {/* Play/Pause */}
            <button
              onClick={onTogglePlay}
              className="w-11 h-11 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 flex items-center justify-center font-bold shadow-lg shadow-cyan-500/30 active:scale-95 transition-all"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            {/* Step +1F */}
            <button
              onClick={() => onStepFrame(1)}
              className="px-2.5 py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-750 text-xs font-bold text-neutral-300"
              title="Tiến 1 khung hình"
            >
              +1F
            </button>

            {/* Subtitle Offset */}
            <div className="flex items-center gap-1.5 bg-neutral-900/90 border border-neutral-750 px-3 py-1.5 rounded-xl text-xs font-semibold">
              <span className="text-neutral-400">Lệch phụ đề:</span>
              <span className="font-mono text-yellow-400">{subtitleOffset.toFixed(1)}s</span>
              <button
                onClick={() => setSubtitleOffset((o) => Number((o - 0.5).toFixed(1)))}
                className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[10px]"
              >
                -0.5s
              </button>
              <button
                onClick={() => setSubtitleOffset((o) => Number((o + 0.5).toFixed(1)))}
                className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[10px]"
              >
                +0.5s
              </button>
            </div>
          </div>

          {/* Right Control items */}
          <div className="flex items-center gap-3">
            {/* Toggle Audio Drawer */}
            <button
              onClick={() => setShowAudioDrawer((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-750 text-xs font-semibold text-neutral-200"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Chỉnh 4 Kênh Âm Thanh</span>
            </button>

            {/* Hands-free Voiceover Toggle Button */}
            <button
              onClick={() =>
                onChangeAudioConfig({
                  ...audioConfig,
                  aiVoiceover: {
                    ...audioConfig.aiVoiceover,
                    handsFreeAutoRead: !audioConfig.aiVoiceover.handsFreeAutoRead,
                  },
                })
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                audioConfig.aiVoiceover.handsFreeAutoRead
                  ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
                  : 'bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-750 text-neutral-400'
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>
                {audioConfig.aiVoiceover.handsFreeAutoRead ? 'Lồng Tiếng AI: BẬT' : 'Lồng Tiếng AI: TẮT'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


