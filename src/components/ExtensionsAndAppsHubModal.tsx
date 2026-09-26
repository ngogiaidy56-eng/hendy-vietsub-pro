import React, { useState, useEffect } from 'react';
import {
  X,
  Chrome,
  Smartphone,
  Download,
  Check,
  Star,
  ShieldCheck,
  Zap,
  Sliders,
  Monitor,
  Apple,
  Terminal,
  Tablet,
  QrCode,
  Sparkles,
  Layers,
  ArrowRight,
  Info,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';
import {
  ALL_OS_PACKAGES,
  AppPackageInfo,
  detectUserOperatingSystem,
  triggerPackageDownload,
} from '../utils/appDownloader';

interface ExtensionsAndAppsHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: 'studio' | 'fullscreen' | 'web-video';
  onSwitchMode: (mode: 'studio' | 'fullscreen' | 'web-video') => void;
  onOpenBookmarklet: () => void;
}

export const ExtensionsAndAppsHubModal: React.FC<ExtensionsAndAppsHubModalProps> = ({
  isOpen,
  onClose,
  currentMode,
  onSwitchMode,
  onOpenBookmarklet,
}) => {
  const [selectedOsFilter, setSelectedOsFilter] = useState<string>('all');
  const [detectedOs, setDetectedOs] = useState<string>('windows');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadSuccessId, setDownloadSuccessId] = useState<string | null>(null);
  const [selectedPkgDetails, setSelectedPkgDetails] = useState<AppPackageInfo | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const os = detectUserOperatingSystem();
      setDetectedOs(os);
      setSelectedOsFilter('all');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownloadPackage = async (pkg: AppPackageInfo) => {
    setDownloadingId(pkg.id);
    audioEngine.playSfx('whoosh');

    await triggerPackageDownload(pkg);

    setDownloadingId(null);
    setDownloadSuccessId(pkg.id);
    audioEngine.playSfx('ding');

    setTimeout(() => {
      setDownloadSuccessId(null);
    }, 4000);
  };

  const filteredPackages =
    selectedOsFilter === 'all'
      ? ALL_OS_PACKAGES
      : ALL_OS_PACKAGES.filter((p) => p.os === selectedOsFilter);

  // Recommended package based on detected OS
  const recommendedPackage =
    ALL_OS_PACKAGES.find((p) => p.os === detectedOs) || ALL_OS_PACKAGES[0];

  const handleCopySha = (sha: string) => {
    navigator.clipboard.writeText(sha);
    setCopiedHash(sha);
    audioEngine.playSfx('pop');
    setTimeout(() => setCopiedHash(null), 2500);
  };

  const getOsIcon = (os: string) => {
    switch (os) {
      case 'windows':
        return <Monitor className="w-4 h-4 text-blue-400" />;
      case 'macos':
        return <Apple className="w-4 h-4 text-neutral-200" />;
      case 'linux':
        return <Terminal className="w-4 h-4 text-amber-400" />;
      case 'android':
        return <Smartphone className="w-4 h-4 text-emerald-400" />;
      case 'ios':
        return <Tablet className="w-4 h-4 text-rose-400" />;
      case 'chrome':
        return <Chrome className="w-4 h-4 text-cyan-400" />;
      default:
        return <Layers className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-neutral-900 border border-neutral-750 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 px-6 border-b border-neutral-800 bg-neutral-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black text-base text-white flex items-center gap-2">
                Trung Tâm Tải Ứng Dụng Mọi Hệ Điều Hành
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-300 border border-emerald-500/30">
                  ALL OPERATING SYSTEMS
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Tải ứng dụng CapCut Vietsub & Dubber cho Windows, macOS, Linux, Android, iOS và Chrome
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            title="Đóng cửa sổ (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* OS Filter Bar */}
        <div className="flex items-center gap-1.5 px-6 py-2.5 border-b border-neutral-800 bg-neutral-950/50 overflow-x-auto text-xs">
          <span className="text-neutral-500 font-semibold uppercase text-[10px] pr-2 tracking-wider shrink-0">
            Hệ điều hành:
          </span>
          {[
            { id: 'all', label: 'Tất Cả (All OS)', icon: <Layers className="w-3.5 h-3.5" /> },
            { id: 'windows', label: 'Windows', icon: <Monitor className="w-3.5 h-3.5" /> },
            { id: 'macos', label: 'macOS (Apple)', icon: <Apple className="w-3.5 h-3.5" /> },
            { id: 'linux', label: 'Linux (Ubuntu/Arch)', icon: <Terminal className="w-3.5 h-3.5" /> },
            { id: 'android', label: 'Android (APK)', icon: <Smartphone className="w-3.5 h-3.5" /> },
            { id: 'ios', label: 'iOS / iPadOS', icon: <Tablet className="w-3.5 h-3.5" /> },
            { id: 'chrome', label: 'Chrome Extension', icon: <Chrome className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedOsFilter(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
                selectedOsFilter === tab.id
                  ? 'bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-500/20'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-neutral-300 text-xs">
          {/* Smart Auto-Detect Recommended Banner */}
          {recommendedPackage && selectedOsFilter === 'all' && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/50 via-blue-950/40 to-neutral-900 border border-cyan-500/40 relative overflow-hidden shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 text-[10px] font-extrabold uppercase tracking-wide border border-cyan-500/30 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      Phát hiện thiết bị của bạn ({detectedOs.toUpperCase()})
                    </span>
                    <span className="text-[11px] text-neutral-400">Khuyến nghị tải về:</span>
                  </div>
                  <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                    {getOsIcon(recommendedPackage.os)}
                    <span>{recommendedPackage.name}</span>
                  </h3>
                  <p className="text-[11px] text-neutral-300 max-w-xl leading-relaxed">
                    {recommendedPackage.description}
                  </p>
                  <div className="flex items-center gap-3 pt-1 text-[11px] text-neutral-400">
                    <span>
                      Dung lượng: <strong className="text-white">{recommendedPackage.size}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Phiên bản: <strong className="text-cyan-400">{recommendedPackage.version}</strong>
                    </span>
                    <span>•</span>
                    <span>{recommendedPackage.recommendedOs}</span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDownloadPackage(recommendedPackage)}
                    disabled={downloadingId === recommendedPackage.id}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/25 active:scale-95 transition-all"
                  >
                    {downloadSuccessId === recommendedPackage.id ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-300" />
                        <span>Đã Bắt Đầu Tải!</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Tải Về Ngay ({recommendedPackage.size})</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setSelectedPkgDetails(recommendedPackage)}
                    className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-semibold transition-all text-center"
                  >
                    Xem Hướng Dẫn Cài Đặt
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Grid of All Operating System Packages */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                <span>Tất Cả Các Gói Cài Đặt ({filteredPackages.length})</span>
                <span className="text-[11px] font-normal text-neutral-500">
                  Tương thích 100% với Windows, Mac, Linux, Mobile & Browser
                </span>
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredPackages.map((pkg) => {
                const isDownloading = downloadingId === pkg.id;
                const isDownloaded = downloadSuccessId === pkg.id;

                return (
                  <div
                    key={pkg.id}
                    className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col justify-between space-y-3 group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-750 flex items-center justify-center shrink-0">
                            {getOsIcon(pkg.os)}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-white group-hover:text-cyan-300 transition-colors">
                              {pkg.name}
                            </div>
                            <div className="text-[10px] text-neutral-400 font-mono flex items-center gap-2">
                              <span className="text-cyan-400">{pkg.arch}</span>
                              <span>•</span>
                              <span>{pkg.size}</span>
                              <span>•</span>
                              <span className="text-neutral-500">{pkg.version}</span>
                            </div>
                          </div>
                        </div>

                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-neutral-850 text-neutral-400 uppercase">
                          {pkg.os}
                        </span>
                      </div>

                      <p className="text-[11px] text-neutral-400 leading-relaxed line-clamp-2">
                        {pkg.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-neutral-850 flex items-center justify-between">
                      <button
                        onClick={() => setSelectedPkgDetails(pkg)}
                        className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1 font-medium transition-colors"
                      >
                        <Info className="w-3.5 h-3.5 text-neutral-500" />
                        <span>Chi tiết & Checksum</span>
                      </button>

                      <button
                        onClick={() => handleDownloadPackage(pkg)}
                        disabled={isDownloading}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                          isDownloaded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-neutral-800 hover:bg-cyan-600 text-neutral-200 hover:text-white active:scale-95'
                        }`}
                      >
                        {isDownloaded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Đã Tải Xong</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5" />
                            <span>Tải {pkg.filename.endsWith('.apk') ? 'APK' : pkg.filename.endsWith('.exe') ? 'EXE' : pkg.filename.endsWith('.dmg') ? 'DMG' : pkg.filename.endsWith('.AppImage') ? 'AppImage' : pkg.filename.endsWith('.mobileconfig') ? 'WebClip' : 'ZIP'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick 1-Click Bookmarklet & Web Mode Helper */}
          <div className="p-4 rounded-xl bg-neutral-950/70 border border-dashed border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="font-extrabold text-xs text-white flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Không Muốn Cài Đặt Gì? Dùng Ngay Trên Trình Duyệt
              </span>
              <p className="text-[11px] text-neutral-400">
                Kéo Bookmarklet 1-chạm vào thanh dấu trang trình duyệt để lồng tiếng ngay lập tức trên YouTube, Netflix, FPT Play hoặc Bilibili.
              </p>
            </div>
            <button
              onClick={onOpenBookmarklet}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-extrabold text-xs shrink-0 shadow-md shadow-pink-600/20 active:scale-95 transition-all"
            >
              Mở 1-Click Bookmarklet
            </button>
          </div>
        </div>

        {/* Detail Modal / Drawer for Selected Package */}
        {selectedPkgDetails && (
          <div className="p-5 border-t border-neutral-800 bg-neutral-950 space-y-3 animate-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-center justify-between">
              <div className="font-extrabold text-sm text-white flex items-center gap-2">
                {getOsIcon(selectedPkgDetails.os)}
                <span>Hướng dẫn cài đặt: {selectedPkgDetails.name}</span>
              </div>
              <button
                onClick={() => setSelectedPkgDetails(null)}
                className="text-neutral-400 hover:text-white text-xs font-semibold"
              >
                Đóng chi tiết ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <div className="font-semibold text-neutral-300 text-[11px]">Các bước thực hiện:</div>
                <ol className="list-decimal list-inside space-y-1 text-neutral-400 text-[11px]">
                  {selectedPkgDetails.instructions.map((step, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="space-y-2">
                <div className="font-semibold text-neutral-300 text-[11px]">Mã băm xác thực SHA-256:</div>
                <div className="flex items-center gap-2 bg-neutral-900 p-2 rounded-lg border border-neutral-800">
                  <span className="font-mono text-[10px] text-neutral-400 truncate select-all flex-1">
                    {selectedPkgDetails.sha256}
                  </span>
                  <button
                    onClick={() => handleCopySha(selectedPkgDetails.sha256)}
                    className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
                    title="Sao chép SHA-256"
                  >
                    {copiedHash === selectedPkgDetails.sha256 ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => handleDownloadPackage(selectedPkgDetails)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải tệp {selectedPkgDetails.filename}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


