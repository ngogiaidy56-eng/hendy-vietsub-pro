import React, { useRef, useState } from 'react';
import {
  Scissors,
  Trash2,
  ZoomIn,
  ZoomOut,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Subtitles,
  Film,
  Music,
  Plus,
  ChevronLeft,
  ChevronRight,
  Split,
  ChevronsLeft,
  ChevronsRight,
  Maximize2,
} from 'lucide-react';
import { VideoClip, AudioClip, SubtitleSegment } from '../types/editor';
import { formatFullTimecode } from '../utils/mediaUtils';

interface TimelineProps {
  videoClips: VideoClip[];
  audioClips: AudioClip[];
  subtitles: SubtitleSegment[];
  currentTime: number;
  totalDuration: number;
  isPlaying: boolean;
  selectedClipId: string | null;
  onSelectClip: (id: string | null) => void;
  onSeek: (time: number) => void;
  onTogglePlay: () => void;
  onSplitAtPlayhead: () => void;
  onTrimStartToPlayhead: () => void;
  onTrimEndToPlayhead: () => void;
  onDeleteSelectedClip: () => void;
  onExtractAudio: (clip: VideoClip) => void;
  onMoveClip: (clipId: string, direction: 'left' | 'right') => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  videoClips,
  audioClips,
  subtitles,
  currentTime,
  totalDuration,
  isPlaying,
  selectedClipId,
  onSelectClip,
  onSeek,
  onTogglePlay,
  onSplitAtPlayhead,
  onTrimStartToPlayhead,
  onTrimEndToPlayhead,
  onDeleteSelectedClip,
  onExtractAudio,
  onMoveClip,
}) => {
  // Timeline zoom level: pixels per second (e.g. 20px/s to 80px/s)
  const [zoom, setZoom] = useState<number>(36);
  const trackContainerRef = useRef<HTMLDivElement | null>(null);

  // Hover scrub preview frame state
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number>(0);
  const [showHoverPreview, setShowHoverPreview] = useState<boolean>(true);

  const handleZoomToFit = () => {
    if (!trackContainerRef.current) return;
    const containerWidth = trackContainerRef.current.clientWidth || window.innerWidth;
    const targetZoom = Math.max(
      1,
      Math.min(80, Number(((containerWidth - 80) / Math.max(totalDuration, 5)).toFixed(2)))
    );
    setZoom(targetZoom);
  };

  // Dynamic ruler step interval depending on total duration so long 1-hour videos render smoothly
  const rulerStep =
    totalDuration > 3600
      ? 300
      : totalDuration > 1200
      ? 120
      : totalDuration > 600
      ? 60
      : totalDuration > 180
      ? 15
      : totalDuration > 60
      ? 5
      : 2;
  const rulerTicksCount = Math.ceil(totalDuration / rulerStep) + 6;

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackContainerRef.current) return;
    const rect = trackContainerRef.current.getBoundingClientRect();
    const scrollLeft = trackContainerRef.current.scrollLeft;
    const clickX = e.clientX - rect.left + scrollLeft;
    const newTime = Math.max(0, Math.min(totalDuration, clickX / zoom));
    onSeek(Number(newTime.toFixed(2)));
  };

  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackContainerRef.current) return;
    const rect = trackContainerRef.current.getBoundingClientRect();
    const scrollLeft = trackContainerRef.current.scrollLeft;
    const clickX = e.clientX - rect.left + scrollLeft;
    const time = Math.max(0, Math.min(totalDuration, clickX / zoom));
    setHoverTime(Number(time.toFixed(2)));
    setHoverX(e.clientX - rect.left);
  };

  const handleTimelineMouseLeave = () => {
    setHoverTime(null);
  };

  // Selected clip helper
  const selectedVideoClip = videoClips.find((c) => c.id === selectedClipId);

  // Active clip & subtitle at hovered timestamp for preview frame
  const hoveredClip = videoClips.find(
    (c) => hoverTime !== null && hoverTime >= c.startTime && hoverTime <= c.startTime + c.duration
  );
  const hoveredSub = subtitles.find(
    (s) => hoverTime !== null && hoverTime >= s.start && hoverTime <= s.end
  );

  return (
    <div className="h-56 lg:h-64 bg-[#0f172a] border border-slate-800/80 rounded-xl flex flex-col shrink-0 select-none overflow-hidden shadow-lg shadow-black/20">
      {/* Timeline Controls & Editing Toolbar */}
      <div className="h-10 bg-[#111c35] border-b border-slate-800 px-4 flex items-center justify-between shrink-0">
        {/* Cut, Trim, Delete Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onTogglePlay}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-all mr-2"
            title="Play / Pause"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onSplitAtPlayhead}
            disabled={!selectedVideoClip}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-indigo-300 border border-slate-700 transition-all"
            title="Split clip at playhead"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Split</span>
          </button>

          <button
            onClick={onTrimStartToPlayhead}
            disabled={!selectedVideoClip}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 border border-slate-700 transition-all"
            title="Trim start to playhead"
          >
            <ChevronsLeft className="w-3.5 h-3.5 text-amber-400" />
            <span>Trim In</span>
          </button>

          <button
            onClick={onTrimEndToPlayhead}
            disabled={!selectedVideoClip}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 border border-slate-700 transition-all"
            title="Trim end from playhead"
          >
            <span>Trim Out</span>
            <ChevronsRight className="w-3.5 h-3.5 text-amber-400" />
          </button>

          {selectedVideoClip && (
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => onMoveClip(selectedVideoClip.id, 'left')}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                title="Shift Left"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onMoveClip(selectedVideoClip.id, 'right')}
                className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white"
                title="Đổi chỗ sang phải"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={onDeleteSelectedClip}
            disabled={!selectedClipId}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-red-500/20 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed text-neutral-400 border border-neutral-700 transition-all ml-1"
            title="Xóa clip đã chọn"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Current Time Display & Zoom */}
        <div className="flex items-center gap-3">
          {/* Hover Preview Frame Toggle */}
          <button
            onClick={() => setShowHoverPreview((v) => !v)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all border ${
              showHoverPreview
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
            }`}
            title="Bật / Tắt khung xem trước (Preview Frame) khi rê chuột qua timeline"
          >
            <Film className="w-3 h-3 text-cyan-400" />
            <span className="hidden sm:inline">Khung Preview</span>
          </button>

          <div className="font-mono text-xs font-bold text-cyan-400 bg-neutral-900 px-2.5 py-1 rounded-lg border border-neutral-800">
            {formatFullTimecode(currentTime)}
          </div>

          {/* Zoom controls with Zoom-To-Fit for full video duration */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleZoomToFit}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-[10px] font-semibold transition-all"
              title="Xem toàn bộ thời lượng video trên màn hình (Zoom to Fit)"
            >
              <Maximize2 className="w-3 h-3 text-cyan-400" />
              <span>Toàn bộ</span>
            </button>

            <button
              onClick={() => setZoom((z) => Math.max(1, z - 4))}
              className="p-1 text-neutral-400 hover:text-white"
              title="Thu nhỏ timeline"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <input
              type="range"
              min="1"
              max="80"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-20 accent-cyan-500 h-1 bg-neutral-800 rounded cursor-pointer"
              title={`Tỉ lệ hiển thị: ${zoom}px/giây`}
            />
            <button
              onClick={() => setZoom((z) => Math.min(80, z + 4))}
              className="p-1 text-neutral-400 hover:text-white"
              title="Phóng to timeline"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Multi-Track Canvas & Scroller */}
      <div
        ref={trackContainerRef}
        onClick={handleTimelineClick}
        onMouseMove={handleTimelineMouseMove}
        onMouseLeave={handleTimelineMouseLeave}
        className="flex-1 overflow-x-auto overflow-y-hidden relative bg-neutral-950/90 cursor-pointer"
      >
        {/* Minimum width to allow scrolling across the full video duration */}
        <div
          style={{ width: `${Math.max(window.innerWidth, totalDuration * zoom + 300)}px` }}
          className="h-full relative flex flex-col min-w-full"
        >
          {/* 1. Time Ruler with Dynamic Interval */}
          <div className="h-6 border-b border-neutral-800/80 bg-neutral-900/90 relative flex items-center shrink-0">
            {Array.from({ length: rulerTicksCount }).map((_, i) => {
              const sec = i * rulerStep;
              return (
                <div
                  key={sec}
                  style={{ left: `${sec * zoom}px` }}
                  className="absolute top-0 bottom-0 border-l border-neutral-700/50 pl-1 text-[9px] font-mono text-neutral-500 flex items-center"
                >
                  {formatFullTimecode(sec)}
                </div>
              );
            })}
          </div>

          {/* 2. Subtitle Track */}
          <div className="h-10 border-b border-neutral-800/60 bg-neutral-950/40 relative flex items-center shrink-0 px-2">
            <div className="absolute left-2 z-10 text-[10px] font-bold text-yellow-500/60 uppercase tracking-widest pointer-events-none flex items-center gap-1">
              <Subtitles className="w-3 h-3" />
              <span>Phụ đề</span>
            </div>

            {subtitles.map((sub) => {
              const left = sub.start * zoom;
              const width = Math.max(20, (sub.end - sub.start) * zoom);
              return (
                <div
                  key={sub.id}
                  style={{ left: `${left}px`, width: `${width}px` }}
                  className="absolute h-7 top-1.5 rounded-md bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-[10px] px-2 py-0.5 truncate shadow-sm flex items-center"
                  title={`${sub.textVi} (${sub.textOriginal})`}
                >
                  <span className="font-semibold truncate">{sub.textVi}</span>
                </div>
              );
            })}
          </div>

          {/* 3. Main Video Track */}
          <div className="h-24 border-b border-neutral-800/60 bg-neutral-900/50 relative flex items-center shrink-0">
            <div className="absolute left-2 z-10 text-[10px] font-bold text-cyan-500/60 uppercase tracking-widest pointer-events-none flex items-center gap-1">
              <Film className="w-3 h-3" />
              <span>Video</span>
            </div>

            {videoClips.map((clip, idx) => {
              const left = clip.startTime * zoom;
              const width = Math.max(30, clip.duration * zoom);
              const isSelected = clip.id === selectedClipId;

              return (
                <div
                  key={clip.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectClip(clip.id);
                  }}
                  style={{ left: `${left}px`, width: `${width}px` }}
                  className={`absolute h-20 top-2 rounded-xl overflow-hidden cursor-pointer transition-all border-2 flex flex-col justify-between ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-950/40 ring-2 ring-cyan-500/30 shadow-lg'
                      : 'border-neutral-700 bg-neutral-850/90 hover:border-neutral-500'
                  }`}
                >
                  {/* Thumbnail Banner */}
                  <div className="h-10 w-full relative overflow-hidden bg-neutral-800">
                    <img
                      src={clip.thumbnail}
                      alt={clip.name}
                      className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent" />
                  </div>

                  {/* Title & Duration */}
                  <div className="p-1.5 bg-neutral-900/90 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-neutral-200 truncate pr-1">
                      {clip.name}
                    </span>
                    <span className="font-mono text-[10px] text-cyan-400 shrink-0">
                      {clip.duration.toFixed(1)}s
                    </span>
                  </div>

                  {/* Transition Marker */}
                  {clip.transition.type !== 'none' && (
                    <div
                      className="absolute top-1 right-1 px-1 py-0.5 rounded bg-blue-600/80 text-[9px] font-bold text-white shadow"
                      title={`Chuyển cảnh: ${clip.transition.type}`}
                    >
                      {clip.transition.type}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 4. Audio Track */}
          <div className="h-16 bg-neutral-950/60 relative flex items-center shrink-0">
            <div className="absolute left-2 z-10 text-[10px] font-bold text-pink-500/60 uppercase tracking-widest pointer-events-none flex items-center gap-1">
              <Music className="w-3 h-3" />
              <span>Âm thanh</span>
            </div>

            {audioClips.map((audio) => {
              const left = audio.startTime * zoom;
              const width = Math.max(24, audio.duration * zoom);
              const isSelected = audio.id === selectedClipId;

              return (
                <div
                  key={audio.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectClip(audio.id);
                  }}
                  style={{
                    left: `${left}px`,
                    width: `${width}px`,
                    borderColor: audio.color,
                  }}
                  className={`absolute h-11 top-2.5 rounded-lg overflow-hidden border px-2 py-1 flex items-center justify-between cursor-pointer transition-all ${
                    isSelected ? 'ring-2 ring-white/50 bg-neutral-800' : 'bg-neutral-850/80'
                  }`}
                >
                  <div className="min-w-0 pr-1">
                    <div className="font-semibold text-[10px] text-neutral-200 truncate">
                      {audio.name}
                    </div>
                    <div className="text-[9px] text-neutral-400 flex items-center gap-1">
                      <span>{audio.type}</span>
                      <span>•</span>
                      <span>{audio.volume}%</span>
                    </div>
                  </div>

                  {/* Procedural Waveform visualizer */}
                  <div className="flex items-center gap-0.5 h-6 shrink-0 opacity-70">
                    {(audio.waveform || [30, 70, 90, 50, 80, 40, 20]).map((bar, bIdx) => (
                      <div
                        key={bIdx}
                        style={{
                          height: `${Math.max(4, (bar / 100) * 20)}px`,
                          backgroundColor: audio.color,
                        }}
                        className="w-1 rounded-full"
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Red Scrubbing Playhead */}
          <div
            style={{ left: `${currentTime * zoom}px` }}
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none"
          >
            {/* Playhead handle */}
            <div className="w-3 h-3 -translate-x-[5px] -top-0 bg-red-500 rounded-b shadow-md shadow-red-500/50" />
          </div>

          {/* Live Hover / Scrub Preview Frame Window */}
          {showHoverPreview && hoverTime !== null && (
            <>
              {/* Vertical guideline indicator at hover position */}
              <div
                style={{ left: `${hoverTime * zoom}px` }}
                className="absolute top-0 bottom-0 w-px bg-cyan-400/70 z-30 pointer-events-none border-dashed border-l border-cyan-400"
              />

              {/* Floating Preview Frame Card */}
              <div
                style={{
                  left: `${Math.max(10, hoverTime * zoom - 80)}px`,
                }}
                className="absolute top-1 z-40 pointer-events-none bg-neutral-950/95 backdrop-blur-md border border-cyan-500/50 rounded-xl p-2 shadow-2xl shadow-black w-48 transition-transform duration-75 text-left"
              >
                {/* Frame Thumbnail Preview */}
                <div className="w-full aspect-video rounded-lg overflow-hidden bg-neutral-900 border border-neutral-800 relative flex items-center justify-center">
                  {hoveredClip ? (
                    <img
                      src={hoveredClip.thumbnail || hoveredClip.src}
                      alt={hoveredClip.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-neutral-600 gap-1">
                      <Film className="w-5 h-5" />
                      <span className="text-[9px]">Khoảng trống</span>
                    </div>
                  )}

                  {/* Micro Frame Badge */}
                  <div className="absolute top-1 left-1 bg-black/80 backdrop-blur-sm rounded px-1.5 py-0.5 text-[9px] font-mono font-bold text-cyan-300 border border-cyan-500/30">
                    Khung {Math.round(hoverTime * 30)}
                  </div>
                </div>

                {/* Info: Timecode & Clip Name */}
                <div className="mt-1.5 flex items-center justify-between text-[10px]">
                  <span className="font-mono font-bold text-neutral-200">
                    {formatFullTimecode(hoverTime)}
                  </span>
                  <span className="text-neutral-400 truncate max-w-[90px]">
                    {hoveredClip ? hoveredClip.name : 'Không có clip'}
                  </span>
                </div>

                {/* Active Vietsub preview if present at this frame */}
                {hoveredSub && (
                  <div className="mt-1 pt-1 border-t border-neutral-800/80">
                    <div className="text-[10px] text-yellow-300 font-semibold line-clamp-1 flex items-center gap-1">
                      <Subtitles className="w-3 h-3 shrink-0 text-yellow-400" />
                      <span className="truncate">{hoveredSub.textVi}</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};


