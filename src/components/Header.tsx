import React, { useState, useRef, useEffect } from 'react';
import {
  Film,
  Sparkles,
  Globe,
  Settings,
  Download,
  RotateCcw,
  RotateCw,
  Monitor,
  Smartphone,
  Square,
  Ratio,
  Maximize2,
  Wand2,
  Mic,
  Headphones,
  Layers,
  ChevronDown,
  Bookmark,
  Check,
  Zap,
} from 'lucide-react';
import { AspectRatio } from '../types/editor';

interface HeaderProps {
  activeTab: 'editor' | 'web-sub' | 'bookmarklet' | 'settings';
  setActiveTab: (tab: 'editor' | 'web-sub' | 'bookmarklet' | 'settings') => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (ar: AspectRatio) => void;
  onOpenExport: () => void;
  onOpenUpload: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  exportMinimized: boolean;
  onExpandExport: () => void;
  isVietsubPanelOpen?: boolean;
  onToggleVietsubPanel?: () => void;
  subtitlesCount?: number;
  onOpenBookmarkletModal?: () => void;
  onOpenAiCreation?: () => void;
  onOpenExtensionsHub?: () => void;
  onOpenAutoTranscription?: () => void;
  onOpenFullScreen?: () => void;
  handsFreeVoiceoverActive?: boolean;
  onToggleHandsFreeVoiceover?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  aspectRatio,
  setAspectRatio,
  onOpenExport,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  exportMinimized,
  onExpandExport,
  isVietsubPanelOpen = false,
  onToggleVietsubPanel,
  subtitlesCount = 0,
  onOpenBookmarkletModal,
  onOpenAiCreation,
  onOpenExtensionsHub,
  onOpenAutoTranscription,
  onOpenFullScreen,
  handsFreeVoiceoverActive = true,
  onToggleHandsFreeVoiceover,
}) => {
  const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);
  const aiMenuRef = useRef<HTMLDivElement | null>(null);

  // Close AI dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (aiMenuRef.current && !aiMenuRef.current.contains(e.target as Node)) {
        setIsAiMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const aspectRatios: { id: AspectRatio; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: '16:9', label: '16:9', icon: <Monitor className="w-3.5 h-3.5" />, desc: 'Landscape / 16:9' },
    { id: '9:16', label: '9:16', icon: <Smartphone className="w-3.5 h-3.5" />, desc: 'Vertical / Reels' },
    { id: '1:1', label: '1:1', icon: <Square className="w-3.5 h-3.5" />, desc: 'Square / Feed' },
    { id: '4:5', label: '4:5', icon: <Ratio className="w-3.5 h-3.5" />, desc: 'Portrait / Feed' },
    { id: '21:9', label: '21:9', icon: <Maximize2 className="w-3.5 h-3.5" />, desc: 'Cinema Ultrawide' },
  ];

  return (
    <header className="studio-header h-[60px] bg-[#0a0f18] border-b border-slate-800/80 px-3 sm:px-4 flex items-center justify-between shrink-0 z-40 text-slate-200 select-none">
      {/* Zone 1: Brand & Breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Film className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-black text-[15px] tracking-tight text-white">
              AI Studio <span className="text-cyan-400">Pro</span>
            </span>
            <span className="hidden sm:inline-block text-slate-500 text-xs">/</span>
            <span className="hidden sm:inline-block text-xs text-slate-400 font-medium">
              Video + Vietsub Workspace
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 ml-3 bg-slate-900/90 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeTab === 'editor'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Film className="w-3.5 h-3.5 text-indigo-400" />
            <span>Edit</span>
          </button>

          <button
            onClick={() => setActiveTab('web-sub')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeTab === 'web-sub'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>Web</span>
          </button>

          {onOpenExtensionsHub && (
            <button
              onClick={onOpenExtensionsHub}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-cyan-300 hover:bg-slate-800/80 transition-colors"
              title="Download Desktop & Mobile Packages"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Apps</span>
            </button>
          )}
        </nav>
      </div>

      {/* Zone 2: Aspect Ratio Switcher */}
      <div className="hidden lg:flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-lg border border-slate-800 text-xs">
        <span className="text-[10px] uppercase font-semibold text-slate-500 px-2 tracking-wider">
          Aspect:
        </span>
        {aspectRatios.map((item) => (
          <button
            key={item.id}
            onClick={() => setAspectRatio(item.id)}
            title={item.desc}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
              aspectRatio === item.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Zone 3: Actions & Controls */}
      <div className="flex items-center gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center bg-slate-900/90 p-0.5 rounded-md border border-slate-800">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo"
            className="p-1.5 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo"
            className="p-1.5 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* AI & Dubbing Hub Menu */}
        <div className="relative" ref={aiMenuRef}>
          <button
            onClick={() => setIsAiMenuOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors border ${
              handsFreeVoiceoverActive
                ? 'bg-indigo-950/60 text-indigo-200 border-indigo-500/40'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
            }`}
            title="AI & Voiceover Control Menu"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Tools</span>
            {handsFreeVoiceoverActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Clean CRM Dropdown */}
          {isAiMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 space-y-1 animate-in fade-in-50 zoom-in-95 duration-100">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-800">
                Cognitive Services & Automation
              </div>

              {/* 1. Hands-Free Voiceover Toggle */}
              {onToggleHandsFreeVoiceover && (
                <button
                  onClick={() => onToggleHandsFreeVoiceover()}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-850 text-left text-xs transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-purple-400" />
                    <div>
                      <div className="font-semibold text-slate-200">Hands-Free Dubbing</div>
                      <div className="text-[10px] text-slate-400">Audible speech without reading</div>
                    </div>
                  </div>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      handsFreeVoiceoverActive
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {handsFreeVoiceoverActive ? 'ON' : 'OFF'}
                  </span>
                </button>
              )}

              {/* 2. Auto Transcription */}
              {onOpenAutoTranscription && (
                <button
                  onClick={() => {
                    setIsAiMenuOpen(false);
                    onOpenAutoTranscription();
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-850 text-left text-xs transition-colors"
                >
                  <Mic className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="font-semibold text-slate-200">Speech-to-Text Transcription</div>
                    <div className="text-[10px] text-slate-400">Convert voice into timed Vietsub</div>
                  </div>
                </button>
              )}

              {/* 3. AI Video Creator */}
              {onOpenAiCreation && (
                <button
                  onClick={() => {
                    setIsAiMenuOpen(false);
                    onOpenAiCreation();
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-850 text-left text-xs transition-colors"
                >
                  <Wand2 className="w-4 h-4 text-pink-400" />
                  <div>
                    <div className="font-semibold text-slate-200">AI Script-to-Video Engine</div>
                    <div className="text-[10px] text-slate-400">Generate storyboard & voice</div>
                  </div>
                </button>
              )}

              {/* 4. Bookmarklet */}
              {onOpenBookmarkletModal && (
                <button
                  onClick={() => {
                    setIsAiMenuOpen(false);
                    onOpenBookmarkletModal();
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-850 text-left text-xs transition-colors"
                >
                  <Bookmark className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="font-semibold text-slate-200">1-Click Web Dubbing</div>
                    <div className="text-[10px] text-slate-400">YouTube, Netflix & web video</div>
                  </div>
                </button>
              )}

              {/* 5. Cloudflare Workers AI Settings */}
              <button
                onClick={() => {
                  setIsAiMenuOpen(false);
                  setActiveTab('settings');
                }}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-850 text-left text-xs transition-colors border-t border-slate-800 pt-2"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <div>
                  <div className="font-semibold text-slate-200">AI Infrastructure Config</div>
                  <div className="text-[10px] text-slate-400">Whisper, Llama & TTS models</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Vietsub Panel Toggle */}
        {activeTab === 'editor' && onToggleVietsubPanel && (
          <button
            onClick={onToggleVietsubPanel}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors border ${
              isVietsubPanelOpen
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Vietsub</span>
            <span className="font-mono tabular-nums text-[10px] bg-slate-800 px-1 rounded text-slate-300">
              {subtitlesCount}
            </span>
          </button>
        )}

        {/* Cinema Mode Button */}
        {onOpenFullScreen && (
          <button
            onClick={onOpenFullScreen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
            title="Fullscreen Cinema Mode (F)"
          >
            <Maximize2 className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Cinema</span>
          </button>
        )}

        {/* Export Video & Subtitles */}
        {exportMinimized ? (
          <button
            onClick={onExpandExport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-amber-500 text-slate-950 animate-pulse transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Rendering...</span>
          </button>
        ) : (
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        )}
      </div>
    </header>
  );
};


