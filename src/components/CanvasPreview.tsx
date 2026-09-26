import React, { useRef, useEffect, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Subtitles,
  Maximize,
  Sparkles,
  Film,
  Grid,
  Layers,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Upload,
} from 'lucide-react';
import {
  AspectRatio,
  SubtitleDisplayMode,
  SubtitleSegment,
  VideoClip,
} from '../types/editor';
import { formatFullTimecode, readMediaFullDuration } from '../utils/mediaUtils';

interface CanvasPreviewProps {
  aspectRatio: AspectRatio;
  currentTime: number;
  totalDuration: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  activeClip?: VideoClip;
  subtitles: SubtitleSegment[];
  subtitleMode: SubtitleDisplayMode;
  setSubtitleMode: (mode: SubtitleDisplayMode) => void;
  subtitleOffset: number;
  setSubtitleOffset: (fn: (prev: number) => number) => void;
  onAddVideoClip?: (clip: VideoClip) => void;
}

export const CanvasPreview: React.FC<CanvasPreviewProps> = ({
  aspectRatio,
  currentTime,
  totalDuration,
  isPlaying,
  onTogglePlay,
  onSeek,
  activeClip,
  subtitles,
  subtitleMode,
  setSubtitleMode,
  subtitleOffset,
  setSubtitleOffset,
  onAddVideoClip,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasFileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [failedClips, setFailedClips] = useState<Record<string, boolean>>({});

  // Built-in Preview Frame and Grid Guide state
  const [showPreviewFrame, setShowPreviewFrame] = useState<boolean>(true);
  const [showGridGuides, setShowGridGuides] = useState<boolean>(false);
  const [previewFrameMinimized, setPreviewFrameMinimized] = useState<boolean>(false);

  const isVideoFailed = activeClip ? !!failedClips[activeClip.id] : false;

  const handleProcessUploadedFile = async (file: File) => {
    if (!onAddVideoClip) return;
    try {
      const info = await readMediaFullDuration(file);
      const newClip: VideoClip = {
        id: `uploaded_${Date.now()}`,
        type: info.type === 'video' ? 'video' : 'image',
        name: file.name,
        src: info.url,
        thumbnail: info.thumbnail,
        startTime: currentTime,
        duration: info.duration,
        sourceStart: 0,
        sourceDuration: info.duration,
        volume: 100,
        isMuted: false,
        transform: { rotation: 0, flipH: false, flipV: false, scale: 1, x: 0, y: 0 },
        filter: {
          preset: 'none',
          brightness: 100,
          contrast: 100,
          saturation: 100,
          temperature: 0,
          vignette: 0,
        },
        transition: { type: 'none', duration: 0.5 },
      };
      onAddVideoClip(newClip);
    } catch (err) {
      console.error('File process error:', err);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessUploadedFile(e.dataTransfer.files[0]);
    }
  };

  // Sync HTML5 video playback with timeline playhead
  useEffect(() => {
    if (!videoRef.current || !activeClip || activeClip.type !== 'video' || isVideoFailed) return;
    const vid = videoRef.current;
    const clipLocalTime = Math.max(0, currentTime - activeClip.startTime + activeClip.sourceStart);

    if (vid.readyState >= 1) {
      if (Math.abs(vid.currentTime - clipLocalTime) > 0.3) {
        try {
          vid.currentTime = clipLocalTime;
        } catch {
          // ignore
        }
      }
    }

    if (isPlaying) {
      if (vid.paused && vid.readyState >= 2) {
        const playPromise = vid.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.debug('Video play request safely deferred:', err?.message);
          });
        }
      }
    } else {
      if (!vid.paused) {
        try {
          vid.pause();
        } catch {
          // ignore
        }
      }
    }
  }, [currentTime, isPlaying, activeClip, isVideoFailed]);

  // Find active subtitle cue with sync offset applied
  const effectiveTime = currentTime + subtitleOffset;
  const activeSubtitle = subtitles.find(
    (sub) => effectiveTime >= sub.start && effectiveTime <= sub.end
  );

  // Calculate aspect ratio CSS
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case '16:9':
        return 'aspect-[16/9] max-h-[92%] max-w-[96%]';
      case '9:16':
        return 'aspect-[9/16] max-h-[94%] max-w-[46%]';
      case '1:1':
        return 'aspect-square max-h-[86%] max-w-[86%]';
      case '4:5':
        return 'aspect-[4/5] max-h-[88%] max-w-[68%]';
      case '21:9':
        return 'aspect-[21/9] max-h-[76%] max-w-[98%]';
      default:
        return 'aspect-[16/9] max-h-[92%]';
    }
  };

  // Build CSS filter string from clip filter settings
  const getFilterStyle = (): React.CSSProperties => {
    if (!activeClip) return {};

    const f = activeClip.filter;
    let filterStr = `brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturation}%)`;

    if (f.preset === 'black-white-noir') {
      filterStr += ' grayscale(100%) contrast(140%)';
    } else if (f.preset === 'vintage-90s') {
      filterStr += ' sepia(40%) contrast(90%)';
    } else if (f.preset === 'sunset-glow') {
      filterStr += ' sepia(25%) saturate(140%) hue-rotate(-10deg)';
    } else if (f.preset === 'cyberpunk-neon') {
      filterStr += ' hue-rotate(45deg) saturate(170%) contrast(120%)';
    } else if (f.preset === 'cinematic-teal-orange') {
      filterStr += ' contrast(115%) saturate(125%)';
    } else if (f.preset === 'vivid-hdr') {
      filterStr += ' contrast(125%) saturate(135%) brightness(105%)';
    } else if (f.preset === 'moody-film') {
      filterStr += ' contrast(110%) saturate(85%) brightness(95%)';
    } else if (f.preset === 'pastel') {
      filterStr += ' brightness(110%) saturate(80%) contrast(90%)';
    }

    return { filter: filterStr };
  };

  // Transform styling: Rotate, Flip H/V, Zoom/Scale, Pan X/Y
  const getTransformStyle = (): React.CSSProperties => {
    if (!activeClip) return {};
    const t = activeClip.transform;
    const scaleX = (t.flipH ? -1 : 1) * t.scale;
    const scaleY = (t.flipV ? -1 : 1) * t.scale;

    return {
      transform: `translate(${t.x}px, ${t.y}px) rotate(${t.rotation}deg) scale(${scaleX}, ${scaleY})`,
      transformOrigin: 'center center',
      transition: 'transform 0.05s linear',
    };
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingOver(true);
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={handleDrop}
      className={`rounded-xl bg-[#0f172a] border border-slate-800/80 shadow-lg shadow-black/20 flex flex-col flex-1 min-h-0 overflow-hidden relative select-none ${
        isDraggingOver ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-950/20' : ''
      }`}
    >
      <input
        ref={canvasFileInputRef}
        type="file"
        accept="video/*,audio/*,image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleProcessUploadedFile(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {/* Top Preview Controls Toolbar: CRM Minimalist Style */}
      <div className="h-10 bg-[#111c35] border-b border-slate-800 px-3.5 flex items-center justify-between text-xs text-slate-400 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 font-semibold text-slate-200 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Viewport Display ({aspectRatio})</span>
          </div>
          {activeClip && (
            <span className="px-2 py-0.5 rounded bg-slate-900 text-[11px] text-slate-300 border border-slate-800 truncate max-w-[220px]">
              {activeClip.name}
            </span>
          )}
        </div>

        {/* Subtitle Sync Offset Controls & Display Mode */}
        <div className="flex items-center gap-2">
          {/* Subtitle Offset */}
          <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 text-[11px]">
            <Subtitles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">Sync:</span>
            <button
              onClick={() => setSubtitleOffset((o) => Number((o - 0.5).toFixed(1)))}
              className="px-1 py-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white font-mono text-[10px]"
              title="Offset -0.5s"
            >
              -0.5s
            </button>
            <span
              className={`font-mono text-[11px] font-bold ${
                subtitleOffset !== 0 ? 'text-indigo-400' : 'text-slate-400'
              }`}
            >
              {subtitleOffset > 0 ? `+${subtitleOffset}s` : `${subtitleOffset}s`}
            </span>
            <button
              onClick={() => setSubtitleOffset((o) => Number((o + 0.5).toFixed(1)))}
              className="px-1 py-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white font-mono text-[10px]"
              title="Offset +0.5s"
            >
              +0.5s
            </button>
          </div>

          {/* Subtitle Language Mode */}
          <div className="flex items-center bg-slate-900 rounded-md p-0.5 border border-slate-800 text-[11px]">
            <button
              onClick={() => setSubtitleMode('bilingual')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                subtitleMode === 'bilingual'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Bilingual
            </button>
            <button
              onClick={() => setSubtitleMode('vi-only')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                subtitleMode === 'vi-only'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Vietnamese
            </button>
            <button
              onClick={() => setSubtitleMode('original-only')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                subtitleMode === 'original-only'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Source
            </button>
          </div>

          {/* Preview Frame & Grid Overlays */}
          <button
            onClick={() => setShowPreviewFrame((v) => !v)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors border ${
              showPreviewFrame
                ? 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Toggle Source Frame PiP Monitor"
          >
            <Film className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Source PiP</span>
          </button>

          <button
            onClick={() => setShowGridGuides((v) => !v)}
            className={`p-1 rounded-md border transition-colors ${
              showGridGuides
                ? 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Toggle Rule of Thirds Guide"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport (Dominant, centered cinema space) */}
      <div className="flex-1 flex items-center justify-center p-3 sm:p-5 min-h-0 bg-[#070b14] overflow-hidden relative">
        <div
          className={`${getAspectRatioClass()} w-full relative rounded-lg overflow-hidden bg-black shadow-2xl shadow-black/90 border border-slate-800/90 flex items-center justify-center`}
        >
          {activeClip ? (
            <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
              {activeClip.type === 'video' && !isVideoFailed ? (
                <video
                  ref={videoRef}
                  key={activeClip.id}
                  src={activeClip.src}
                  onError={() => {
                    console.warn(`[CanvasPreview] Video stream fallback for '${activeClip.name}'`);
                    setFailedClips((prev) => ({ ...prev, [activeClip.id]: true }));
                  }}
                  onLoadedMetadata={() => {
                    if (videoRef.current) {
                      const clipLocalTime = Math.max(
                        0,
                        currentTime - activeClip.startTime + activeClip.sourceStart
                      );
                      videoRef.current.currentTime = clipLocalTime;
                      if (isPlaying) {
                        videoRef.current.play().catch(() => {});
                      }
                    }
                  }}
                  style={{
                    ...getTransformStyle(),
                    ...getFilterStyle(),
                  }}
                  className="w-full h-full object-cover pointer-events-none"
                  playsInline
                  preload="metadata"
                  muted={activeClip.isMuted}
                />
              ) : (
                <img
                  src={activeClip.thumbnail || activeClip.src}
                  alt={activeClip.name}
                  style={{
                    ...getTransformStyle(),
                    ...getFilterStyle(),
                  }}
                  className="w-full h-full object-cover pointer-events-none"
                />
              )}

              {/* Vignette Overlay if set */}
              {activeClip.filter.vignette > 0 && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${
                      (activeClip.filter.vignette / 100) * 0.85
                    }) 100%)`,
                  }}
                />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 gap-3 p-6 text-center max-w-sm">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 shadow-md">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-100">No media clip active at playhead</p>
                <p className="text-xs text-slate-500 mt-1">
                  Drag and drop a video or audio file here to start editing full duration.
                </p>
              </div>
              <button
                type="button"
                onClick={() => canvasFileInputRef.current?.click()}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Media (Full Duration)</span>
              </button>
            </div>
          )}

          {/* Subtitle Dialogue Overlay */}
          {activeSubtitle && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 max-w-[88%] z-20 pointer-events-none text-center">
              <div className="bg-slate-950/85 backdrop-blur-md border border-white/20 rounded-xl px-5 py-2.5 shadow-2xl shadow-black inline-block">
                {(subtitleMode === 'bilingual' || subtitleMode === 'vi-only') && (
                  <div className="text-lg md:text-xl font-bold text-yellow-400 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] tracking-wide">
                    {activeSubtitle.textVi}
                  </div>
                )}
                {(subtitleMode === 'bilingual' || subtitleMode === 'original-only') && (
                  <div className="text-xs md:text-sm font-medium text-slate-200/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] mt-0.5">
                    {activeSubtitle.textOriginal}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rule of Thirds Grid Guides */}
          {showGridGuides && (
            <div className="absolute inset-0 pointer-events-none z-10">
              <div className="absolute top-[33.3%] left-0 right-0 h-px border-t border-indigo-400/40 border-dashed" />
              <div className="absolute top-[66.6%] left-0 right-0 h-px border-t border-indigo-400/40 border-dashed" />
              <div className="absolute left-[33.3%] top-0 bottom-0 w-px border-l border-indigo-400/40 border-dashed" />
              <div className="absolute left-[66.6%] top-0 bottom-0 w-px border-l border-indigo-400/40 border-dashed" />
              <div className="absolute inset-[8%] border border-yellow-400/30 rounded-lg pointer-events-none flex items-start justify-between p-1">
                <span className="text-[9px] font-mono text-yellow-400/60 font-semibold uppercase">
                  Safe Title 90%
                </span>
              </div>
            </div>
          )}

          {/* Source Frame Monitor (PiP) */}
          {showPreviewFrame && activeClip && (
            <div className="absolute top-3 right-3 z-30 transition-all">
              {!previewFrameMinimized ? (
                <div className="w-44 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-lg overflow-hidden shadow-2xl shadow-black p-2 text-left">
                  <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-slate-800">
                    <div className="flex items-center gap-1.5 text-indigo-300 font-bold text-[10px]">
                      <Film className="w-3 h-3 text-indigo-400" />
                      <span>Source Frame Monitor</span>
                    </div>
                    <button
                      onClick={() => setPreviewFrameMinimized(true)}
                      className="text-slate-400 hover:text-white p-0.5"
                      title="Minimize PiP"
                    >
                      <Minimize2 className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="w-full aspect-video rounded-md overflow-hidden bg-slate-900 border border-slate-800 relative flex items-center justify-center">
                    <img
                      src={activeClip.thumbnail || activeClip.src}
                      alt="Source Frame"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.5 rounded text-[8px] font-mono text-slate-300">
                      RAW
                    </div>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                    <span className="text-indigo-400 font-semibold">
                      Frame #{Math.round(currentTime * 30)}
                    </span>
                    <span>30 FPS</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setPreviewFrameMinimized(false)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-950/90 backdrop-blur-md border border-slate-800 text-slate-300 text-[10px] font-semibold shadow-lg hover:bg-slate-900 transition-colors"
                >
                  <Film className="w-3 h-3 text-indigo-400" />
                  <span>#{Math.round(currentTime * 30)}</span>
                  <Maximize2 className="w-2.5 h-2.5 text-slate-500" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Transport Controls Bar: Clean CRM dark mode */}
      <div className="h-11 bg-[#111c35] border-t border-slate-800 px-4 flex items-center justify-between shrink-0 font-sans">
        {/* Timecode display */}
        <div className="font-mono text-xs font-semibold text-slate-300 flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-indigo-400 tabular-nums font-bold">
              {formatFullTimecode(currentTime)}
            </span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400 tabular-nums">
              {formatFullTimecode(totalDuration)}
            </span>
          </div>

          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 tabular-nums">
            F#{Math.round(currentTime * 30)}
          </span>
        </div>

        {/* Transport buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onSeek(Number(Math.max(0, currentTime - 0.033).toFixed(3)))}
            className="px-1.5 py-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 font-mono text-[10px] flex items-center gap-0.5 border border-slate-800 transition-colors"
            title="Step Back 1 Frame (-0.033s)"
          >
            <ChevronLeft className="w-3 h-3" />
            <span className="hidden sm:inline">-1F</span>
          </button>

          <button
            onClick={() => onSeek(Math.max(0, currentTime - 5))}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Skip Back 5s"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={onTogglePlay}
            className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-600/30 active:scale-95 transition-all mx-1"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current translate-x-0.5" />
            )}
          </button>

          <button
            onClick={() => onSeek(Math.min(totalDuration, currentTime + 5))}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Skip Forward 5s"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            onClick={() => onSeek(Number(Math.min(totalDuration, currentTime + 0.033).toFixed(3)))}
            className="px-1.5 py-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 font-mono text-[10px] flex items-center gap-0.5 border border-slate-800 transition-colors"
            title="Step Forward 1 Frame (+0.033s)"
          >
            <span className="hidden sm:inline">+1F</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Right meta */}
        <div className="text-[11px] text-slate-400 flex items-center gap-2">
          {activeClip ? (
            <span className="text-slate-400 hidden md:inline truncate max-w-[160px]">
              {activeClip.name}
            </span>
          ) : (
            <span className="text-slate-500 hidden md:inline">Ready</span>
          )}
        </div>
      </div>
    </div>
  );
};


