import React, { useState } from 'react';
import {
  X,
  Minimize2,
  Maximize2,
  Download,
  Film,
  Subtitles,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Mic,
  Sliders,
  Volume2,
  Code2,
  FileCode,
  FolderArchive,
} from 'lucide-react';
import {
  ExportSettings,
  ExportProgress,
  AspectRatio,
  VideoClip,
  AudioClip,
  SubtitleSegment,
} from '../types/editor';
import { generateSrtContent, generateVttContent, downloadFile } from '../utils/subtitleExporter';
import { renderTimelineVideo } from '../utils/videoRenderer';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  aspectRatio: AspectRatio;
  videoClips: VideoClip[];
  audioClips: AudioClip[];
  subtitles: SubtitleSegment[];
  exportProgress: ExportProgress;
  setExportProgress: React.Dispatch<React.SetStateAction<ExportProgress>>;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  aspectRatio,
  videoClips,
  audioClips,
  subtitles,
  exportProgress,
  setExportProgress,
}) => {
  const [settings, setSettings] = useState<ExportSettings>({
    hardcodeSubtitles: true,
    subtitleMode: 'bilingual',
    karaokeEffect: true,
    resolution: '1080p',
    fps: 30,
    includeVoiceover: true,
    voiceGender: 'female',
    autoMixAudio: true,
  });

  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Start rendering video pipeline
  const handleStartExport = async () => {
    const controller = new AbortController();
    setAbortController(controller);

    setExportProgress({
      status: 'rendering',
      progress: 0,
      currentFrame: 0,
      totalFrames: 100,
      timeRemaining: 'Đang tính toán...',
      isMinimized: false,
    });

    renderTimelineVideo(
      videoClips,
      audioClips,
      subtitles,
      aspectRatio,
      settings,
      {
        onProgress: (progress, currentFrame, totalFrames, timeRemaining) => {
          setExportProgress((prev) => ({
            ...prev,
            progress,
            currentFrame,
            totalFrames,
            timeRemaining,
          }));
        },
        onComplete: (videoBlob, videoUrl) => {
          setExportProgress((prev) => ({
            ...prev,
            status: 'completed',
            progress: 100,
            downloadUrl: videoUrl,
            fileName: `CapCut_Vietsub_${aspectRatio.replace(':', 'x')}_${Date.now()}.mp4`,
          }));
        },
        onError: (err) => {
          setExportProgress((prev) => ({
            ...prev,
            status: 'error',
            error: err,
          }));
        },
      },
      controller.signal
    );
  };

  const handleCancelExport = () => {
    if (abortController) {
      abortController.abort();
    }
    setExportProgress({
      status: 'idle',
      progress: 0,
      currentFrame: 0,
      totalFrames: 0,
      timeRemaining: '',
      isMinimized: false,
    });
  };

  // Quick download SRT & VTT
  const handleDownloadSrt = () => {
    const content = generateSrtContent(subtitles, settings.subtitleMode);
    downloadFile(content, `CapCut_Subtitles_${Date.now()}.srt`, 'text/plain');
  };

  const handleDownloadVtt = () => {
    const content = generateVttContent(subtitles, settings.subtitleMode);
    downloadFile(content, `CapCut_Subtitles_${Date.now()}.vtt`, 'text/vtt');
  };

  const [downloadingSource, setDownloadingSource] = useState<'txt' | 'tar' | null>(null);

  const handleDownloadSourceTxt = () => {
    setDownloadingSource('txt');
    const a = document.createElement('a');
    a.href = '/SOURCE_CODE_EXPORT.txt';
    a.download = 'SOURCE_CODE_EXPORT.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => setDownloadingSource(null), 1500);
  };

  const handleDownloadSourceTar = () => {
    setDownloadingSource('tar');
    const a = document.createElement('a');
    a.href = '/capcut-pro-vietsub-studio-cloudflare.tar.gz';
    a.download = 'capcut-pro-vietsub-studio-cloudflare.tar.gz';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => setDownloadingSource(null), 1500);
  };

  // If floating minimized widget
  if (exportProgress.isMinimized) {
    return (
      <div className="fixed bottom-5 right-5 z-50 animate-bounce-subtle">
        <div className="bg-neutral-900/95 backdrop-blur-md border border-neutral-700/80 rounded-2xl p-3.5 shadow-2xl shadow-black/80 flex items-center gap-3.5 min-w-[280px]">
          {exportProgress.status === 'completed' ? (
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 font-mono font-bold text-xs">
              {exportProgress.progress}%
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="font-bold text-xs text-white truncate">
              {exportProgress.status === 'completed'
                ? 'Xuất video hoàn tất!'
                : `Đang xuất video (${exportProgress.progress}%)`}
            </div>
            <div className="text-[10px] text-neutral-400 truncate">
              {exportProgress.status === 'completed'
                ? 'Nhấp để mở và tải file về máy'
                : `Còn lại: ${exportProgress.timeRemaining || 'vài giây'}`}
            </div>
          </div>

          <button
            onClick={() =>
              setExportProgress((prev) => ({ ...prev, isMinimized: false }))
            }
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-cyan-400 hover:text-white transition-all shrink-0"
            title="Mở rộng cửa sổ xuất"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white">
              <Film className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-sm text-white">Xuất Video & Phụ Đề (Export)</span>
          </div>

          <div className="flex items-center gap-1">
            {exportProgress.status === 'rendering' && (
              <button
                onClick={() =>
                  setExportProgress((prev) => ({ ...prev, isMinimized: true }))
                }
                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white text-xs flex items-center gap-1"
                title="Thu nhỏ xuống góc màn hình"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium">Thu nhỏ cửa sổ</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-neutral-300">
          {exportProgress.status === 'rendering' ? (
            /* Active Export Progress Screen */
            <div className="py-6 space-y-4 text-center">
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-neutral-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-cyan-500 transition-all duration-300"
                    strokeDasharray={`${exportProgress.progress}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute font-mono font-bold text-lg text-white">
                  {exportProgress.progress}%
                </span>
              </div>

              <div>
                <h4 className="font-bold text-sm text-white">Đang render video & phụ đề...</h4>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Khung hình: {exportProgress.currentFrame} / {exportProgress.totalFrames} • Thời gian còn lại: {exportProgress.timeRemaining}
                </p>
              </div>

              <div className="p-3 bg-neutral-850 rounded-xl border border-neutral-750 text-neutral-400 text-[11px] max-w-md mx-auto">
                💡 Bạn có thể bấm <strong>"Thu nhỏ cửa sổ"</strong> để tiếp tục dựng phim, chỉnh màu hoặc xem phim trong nền.
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() =>
                    setExportProgress((prev) => ({ ...prev, isMinimized: true }))
                  }
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-cyan-400 font-semibold text-xs flex items-center gap-1.5"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Ẩn cửa sổ (Hide Window)</span>
                </button>

                <button
                  onClick={handleCancelExport}
                  className="px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 font-semibold text-xs"
                >
                  Hủy tiến trình
                </button>
              </div>
            </div>
          ) : exportProgress.status === 'completed' ? (
            /* Export Complete Screen */
            <div className="py-6 space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="font-extrabold text-base text-white">
                  Xuất video thành công!
                </h4>
                <p className="text-xs text-neutral-400 mt-1">
                  Video MP4 và phụ đề đã sẵn sàng để tải về máy của bạn.
                </p>
              </div>

              <div className="p-4 bg-neutral-850 rounded-xl border border-neutral-750 text-left space-y-2 max-w-md mx-auto">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-400">Độ phân giải:</span>
                  <span className="font-bold text-white">{settings.resolution} ({aspectRatio})</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-400">Tốc độ khung hình:</span>
                  <span className="font-bold text-white">{settings.fps} FPS</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-400">Phụ đề gắn chết:</span>
                  <span className="font-bold text-yellow-400">
                    {settings.hardcodeSubtitles ? 'CapCut Karaoke Vietsub' : 'Không gắn'}
                  </span>
                </div>
              </div>

              {/* Action Downloads */}
              <div className="space-y-2 max-w-md mx-auto">
                {exportProgress.downloadUrl && (
                  <a
                    href={exportProgress.downloadUrl}
                    download={exportProgress.fileName || 'capcut_video.mp4'}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-neutral-950 font-extrabold text-xs shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all block text-center"
                  >
                    <Download className="w-4 h-4" />
                    <span>Tải Video MP4 hoàn chỉnh ({settings.resolution})</span>
                  </a>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleDownloadSrt}
                    className="py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 font-semibold text-xs flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Tải file .SRT</span>
                  </button>
                  <button
                    onClick={handleDownloadVtt}
                    className="py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 font-semibold text-xs flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-pink-400" />
                    <span>Tải file .VTT</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Configure Export Options Screen */
            <div className="space-y-4">
              {/* Option 1: Hardcoded MP4 Subtitles */}
              <div className="p-3.5 rounded-xl bg-neutral-850 border border-neutral-750 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Subtitles className="w-4 h-4 text-yellow-400" />
                    <span className="font-bold text-xs text-white">
                      Gắn phụ đề cứng trực tiếp vào Video (Hardcoded MP4)
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.hardcodeSubtitles}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, hardcodeSubtitles: e.target.checked }))
                    }
                    className="w-4 h-4 accent-yellow-400 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-neutral-400">
                  Phụ đề được in trực tiếp lên khung hình video với phong cách CapCut Karaoke viền đổ bóng sắc nét.
                </p>

                {settings.hardcodeSubtitles && (
                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => setSettings((s) => ({ ...s, subtitleMode: 'bilingual' }))}
                      className={`flex-1 py-1 px-2 rounded text-[11px] font-semibold border ${
                        settings.subtitleMode === 'bilingual'
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                      }`}
                    >
                      Song ngữ (VI/EN)
                    </button>
                    <button
                      onClick={() => setSettings((s) => ({ ...s, subtitleMode: 'vi-only' }))}
                      className={`flex-1 py-1 px-2 rounded text-[11px] font-semibold border ${
                        settings.subtitleMode === 'vi-only'
                          ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                      }`}
                    >
                      Chỉ Vietsub
                    </button>
                    <button
                      onClick={() => setSettings((s) => ({ ...s, subtitleMode: 'original-only' }))}
                      className={`flex-1 py-1 px-2 rounded text-[11px] font-semibold border ${
                        settings.subtitleMode === 'original-only'
                          ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                      }`}
                    >
                      Chỉ tiếng gốc
                    </button>
                  </div>
                )}
              </div>

              {/* Option 2: Resolution & Frame Rate */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Độ phân giải (Resolution)
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['720p', '1080p', '4k'] as const).map((res) => (
                      <button
                        key={res}
                        onClick={() => setSettings((s) => ({ ...s, resolution: res }))}
                        className={`py-2 rounded-lg border text-center font-bold text-xs uppercase ${
                          settings.resolution === res
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                            : 'bg-neutral-850 border-neutral-750 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {res}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Khung hình/giây (FPS)
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {([30, 60] as const).map((fps) => (
                      <button
                        key={fps}
                        onClick={() => setSettings((s) => ({ ...s, fps }))}
                        className={`py-2 rounded-lg border text-center font-bold text-xs ${
                          settings.fps === fps
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                            : 'bg-neutral-850 border-neutral-750 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {fps} FPS
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Option 3: AI Voiceover Narration & Auto-Mix */}
              <div className="p-3.5 rounded-xl bg-neutral-850 border border-neutral-750 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-xs text-white">
                      Thuyết minh AI tiếng Việt & Tự động hòa âm
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.includeVoiceover}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, includeVoiceover: e.target.checked }))
                    }
                    className="w-4 h-4 accent-emerald-400 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-neutral-400">
                  Tự động mix giọng đọc thuyết minh và giảm âm lượng nhạc nền (Ducking) 20% khi có lời nói.
                </p>

                {settings.includeVoiceover && (
                  <div className="pt-1 flex gap-2">
                    <button
                      onClick={() => setSettings((s) => ({ ...s, voiceGender: 'female' }))}
                      className={`flex-1 py-1 px-2 rounded text-[11px] font-semibold border ${
                        settings.voiceGender === 'female'
                          ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                      }`}
                    >
                      Giọng Nữ (Lan)
                    </button>
                    <button
                      onClick={() => setSettings((s) => ({ ...s, voiceGender: 'male' }))}
                      className={`flex-1 py-1 px-2 rounded text-[11px] font-semibold border ${
                        settings.voiceGender === 'male'
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                      }`}
                    >
                      Giọng Nam (Minh)
                    </button>
                  </div>
                )}
              </div>

              {/* Subtitle File Exports */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
                <span className="text-[11px] text-neutral-400">Tải riêng file phụ đề:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadSrt}
                    className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 text-xs font-semibold cursor-pointer"
                  >
                    .SRT
                  </button>
                  <button
                    onClick={handleDownloadVtt}
                    className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 text-xs font-semibold cursor-pointer"
                  >
                    .VTT
                  </button>
                </div>
              </div>

              {/* Source Code File Exports */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-xs text-white">Xuất toàn bộ mã nguồn dự án</span>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60 font-medium">
                    36 tệp lõi • 11.988 dòng
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Tải về tất cả 36 tệp mã nguồn đầy đủ (React 19, TypeScript, Express API, Video Renderer, Multi-Track Audio Engine, Vietsub Studio) ra 1 tệp văn bản hợp nhất hoặc gói lưu trữ nén.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadSourceTxt}
                    className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-cyan-500/50 text-cyan-300 text-xs font-semibold transition-all cursor-pointer shadow-sm group"
                    title="Tải tệp SOURCE_CODE_EXPORT.txt chứa 100% mã nguồn tất cả tệp"
                  >
                    <FileCode className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                    <span>{downloadingSource === 'txt' ? '✓ Đang tải...' : 'Tệp hợp nhất (.TXT)'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadSourceTar}
                    className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-indigo-500/50 text-indigo-300 text-xs font-semibold transition-all cursor-pointer shadow-sm group"
                    title="Tải gói lưu trữ capcut-pro-vietsub-studio-cloudflare.tar.gz để bung nén và dev ngay"
                  >
                    <FolderArchive className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                    <span>{downloadingSource === 'tar' ? '✓ Đang tải...' : 'Gói lưu trữ (.TAR.GZ)'}</span>
                  </button>
                </div>
              </div>

              {/* Start Export Button */}
              <button
                onClick={handleStartExport}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-cyan-500/25 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Bắt đầu xuất Video & Phụ đề</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


