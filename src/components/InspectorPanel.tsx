import React, { useState } from 'react';
import {
  Subtitles,
  Volume2,
  VolumeX,
  Play,
  RotateCw,
  Sparkles,
  Zap,
  Check,
  Split,
  Music,
  Sliders,
  Maximize2,
  Mic,
  Clock,
  Film,
  Download,
  Headphones,
  Cpu,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import {
  VideoClip,
  AudioClip,
  SubtitleSegment,
  SubtitleDisplayMode,
  MultiChannelAudioConfig,
} from '../types/editor';
import { audioEngine } from '../utils/audioEngine';
import {
  generateSrtContent,
  generateVttContent,
  generateAssKaraokeContent,
  downloadFile,
} from '../utils/subtitleExporter';
import { formatFullTimecode } from '../utils/mediaUtils';

interface InspectorPanelProps {
  activeClip?: VideoClip;
  onUpdateClip: (clipId: string, updater: (clip: VideoClip) => VideoClip) => void;
  onExtractAudio: (clip: VideoClip) => void;
  onApplyTransitionToAll?: (transitionType: any, duration: number) => void;
  onRunAiAudioMix?: () => void;
  isMixing?: boolean;
  subtitles: SubtitleSegment[];
  onUpdateSubtitles?: (subtitles: SubtitleSegment[]) => void;
  subtitleMode: SubtitleDisplayMode;
  setSubtitleMode: (mode: SubtitleDisplayMode) => void;
  subtitleOffset: number;
  setSubtitleOffset: (fn: (prev: number) => number) => void;
  onOpenVietsubStudio: () => void;
  audioConfig?: MultiChannelAudioConfig;
  onChangeAudioConfig?: (config: MultiChannelAudioConfig) => void;
  onOpenAutoTranscription?: () => void;
  onOpenFullScreen?: () => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  activeClip,
  onUpdateClip,
  onExtractAudio,
  subtitles,
  onUpdateSubtitles,
  subtitleMode,
  setSubtitleMode,
  subtitleOffset,
  setSubtitleOffset,
  audioConfig,
  onChangeAudioConfig,
  onOpenAutoTranscription,
  onOpenFullScreen,
}) => {
  const [activeTab, setActiveTab] = useState<
    'vietsub' | 'clip' | 'voiceover' | 'multichannel' | 'export'
  >('vietsub');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceSuccessMsg, setEnhanceSuccessMsg] = useState<string | null>(null);
  const [selectedSubId, setSelectedSubId] = useState<string | null>(
    subtitles.length > 0 ? subtitles[0].id : null
  );

  const selectedSub = subtitles.find((s) => s.id === selectedSubId) || subtitles[0];

  // AI Vietnamese Diacritics Restoration & Cinema Polish
  const handleEnhanceVietnamese = async (
    mode: 'restore_diacritics' | 'cinema_tone' | 'smart_split'
  ) => {
    if (!onUpdateSubtitles || subtitles.length === 0) return;
    setIsEnhancing(true);
    audioEngine.playSfx('whoosh');

    try {
      const res = await fetch('/api/gemini/enhance-vietnamese', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtitles, mode }),
      });
      const data = await res.json();
      if (data.success && data.subtitles) {
        onUpdateSubtitles(data.subtitles);
        audioEngine.playSfx('ding');
        setEnhanceSuccessMsg(
          mode === 'restore_diacritics'
            ? 'Đã phục hồi dấu tiếng Việt chuẩn xác'
            : mode === 'cinema_tone'
            ? 'Đã nâng cấp văn phong điện ảnh tự nhiên'
            : 'Đã phân tách câu phụ đề cân đối'
        );
        setTimeout(() => setEnhanceSuccessMsg(null), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Split selected subtitle cue in half
  const handleSplitCue = () => {
    if (!selectedSub || !onUpdateSubtitles) return;
    const mid = Number(((selectedSub.start + selectedSub.end) / 2).toFixed(1));
    const words = selectedSub.textVi.split(' ');
    const half = Math.ceil(words.length / 2);
    const text1 = words.slice(0, half).join(' ');
    const text2 = words.slice(half).join(' ');

    const newCue: SubtitleSegment = {
      id: `cue_split_${Date.now()}`,
      start: mid,
      end: selectedSub.end,
      textVi: text2 || 'Đoạn thoại tiếp theo...',
      textOriginal: selectedSub.textOriginal,
      speaker: selectedSub.speaker,
    };

    const updated = subtitles.map((s) =>
      s.id === selectedSub.id ? { ...s, end: mid, textVi: text1 } : s
    );
    onUpdateSubtitles([...updated, newCue].sort((a, b) => a.start - b.start));
    audioEngine.playSfx('ding');
  };

  // Test speaking Vietnamese voiceover
  const handleTestVoice = (text?: string) => {
    const speechText =
      text ||
      selectedSub?.textVi ||
      'Chào mừng bạn đến với hệ thống lồng tiếng tự động. Bạn không cần phải dán mắt đọc phụ đề.';
    const gender = audioConfig?.aiVoiceover?.voiceGender || 'female';
    audioEngine.speakVietnameseSpeech(speechText, gender);
  };

  // Export Subtitle File
  const handleExport = (format: 'srt' | 'vtt' | 'ass' | 'txt') => {
    audioEngine.playSfx('ding');
    const title = 'CapCut_Vietsub_Project';
    if (format === 'srt') {
      const content = generateSrtContent(subtitles, subtitleMode);
      downloadFile(content, `${title}.srt`, 'text/plain;charset=utf-8');
    } else if (format === 'vtt') {
      const content = generateVttContent(subtitles, subtitleMode);
      downloadFile(content, `${title}.vtt`, 'text/vtt;charset=utf-8');
    } else if (format === 'ass') {
      const content = generateAssKaraokeContent(subtitles);
      downloadFile(content, `${title}.ass`, 'text/plain;charset=utf-8');
    } else {
      const content = subtitles.map((s) => `[${s.start}s - ${s.end}s] ${s.textVi}`).join('\n');
      downloadFile(content, `${title}.txt`, 'text/plain;charset=utf-8');
    }
  };

  const tabs: {
    id: 'vietsub' | 'clip' | 'voiceover' | 'multichannel' | 'export';
    label: string;
    icon: React.ReactNode;
  }[] = [
    { id: 'vietsub', label: 'Vietsub AI', icon: <Subtitles className="w-3.5 h-3.5" /> },
    { id: 'clip', label: 'Clip', icon: <Film className="w-3.5 h-3.5" /> },
    { id: 'voiceover', label: 'Dubbing', icon: <Headphones className="w-3.5 h-3.5" /> },
    { id: 'multichannel', label: 'Audio Bus', icon: <Volume2 className="w-3.5 h-3.5" /> },
    { id: 'export', label: 'Export', icon: <Download className="w-3.5 h-3.5" /> },
  ];

  return (
    <aside className="w-80 lg:w-84 xl:w-96 bg-[#0f172a] border border-slate-800/80 rounded-xl flex flex-col shrink-0 select-none overflow-hidden text-slate-200 shadow-lg shadow-black/20">
      {/* Inspector Header: Minimalist CRM style */}
      <div className="h-10 px-3.5 bg-[#111c35] border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <Sliders className="w-3 h-3 text-indigo-400" />
          </div>
          <span className="font-bold text-xs text-slate-100 tracking-tight">
            Control Center & Inspector
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono tabular-nums text-[11px] text-slate-400">
            {subtitles.length} cues
          </span>
          {onOpenFullScreen && (
            <button
              onClick={onOpenFullScreen}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Fullscreen Cinema (F)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Segmented Tab Navigation */}
      <div className="p-1 bg-[#0b1120] border-b border-slate-800 flex items-center gap-1 shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-1.5 px-1 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === tab.id
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/50'
            }`}
          >
            {tab.icon}
            <span className="truncate">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Structured Content Area */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-xs bg-[#0b1120]/40">
        {/* TAB 1: VIETSUB AI & CUE EDITING */}
        {activeTab === 'vietsub' && (
          <div className="space-y-3.5">
            {/* Structured AI Cognitive Actions */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-0.5">
                AI Cognitive Translation & Polish
              </div>

              <div className="bg-[#0f172a] rounded-lg border border-slate-800 divide-y divide-slate-800/80 overflow-hidden">
                {/* Diacritics Recovery Row */}
                <div className="p-2.5 flex items-center justify-between gap-3 hover:bg-slate-900/50 transition-colors">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-200 text-xs">
                        Vietnamese Diacritics
                      </div>
                      <div className="text-[11px] text-slate-400 leading-tight truncate">
                        Auto-restore accents and Telex typos
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleEnhanceVietnamese('restore_diacritics')}
                    disabled={isEnhancing || subtitles.length === 0}
                    className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-indigo-300 border border-slate-700 text-[11px] font-semibold transition-colors shrink-0"
                  >
                    Restore
                  </button>
                </div>

                {/* Cinema Phrasing Row */}
                <div className="p-2.5 flex items-center justify-between gap-3 hover:bg-slate-900/50 transition-colors">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-200 text-xs">
                        Cinema Phrasing
                      </div>
                      <div className="text-[11px] text-slate-400 leading-tight truncate">
                        Hollywood tone & natural expression
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleEnhanceVietnamese('cinema_tone')}
                    disabled={isEnhancing || subtitles.length === 0}
                    className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-amber-300 border border-slate-700 text-[11px] font-semibold transition-colors shrink-0"
                  >
                    Polish
                  </button>
                </div>

                {/* Auto-transcribe Row */}
                {onOpenAutoTranscription && (
                  <div className="p-2.5 flex items-center justify-between gap-3 hover:bg-slate-900/50 transition-colors">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <Mic className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-200 text-xs">
                          Speech Recognition
                        </div>
                        <div className="text-[11px] text-slate-400 leading-tight truncate">
                          Whisper auto-transcribe audio track
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={onOpenAutoTranscription}
                      className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 text-[11px] font-semibold transition-colors shrink-0"
                    >
                      Transcribe
                    </button>
                  </div>
                )}
              </div>

              {enhanceSuccessMsg && (
                <div className="py-1.5 px-2.5 rounded-md bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{enhanceSuccessMsg}</span>
                </div>
              )}
            </div>

            {/* Subtitle Cue Timing & Editing */}
            {selectedSub ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Active Cue Inspection
                  </span>
                  <span className="font-mono tabular-nums text-slate-300 text-[11px]">
                    {selectedSub.start.toFixed(1)}s — {selectedSub.end.toFixed(1)}s
                  </span>
                </div>

                <div className="p-3 bg-[#0f172a] rounded-lg border border-slate-800 space-y-2.5">
                  {/* Vietnamese Textarea */}
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                      Vietnamese Dialogue:
                    </label>
                    <textarea
                      rows={2}
                      value={selectedSub.textVi}
                      onChange={(e) => {
                        if (onUpdateSubtitles) {
                          onUpdateSubtitles(
                            subtitles.map((s) =>
                              s.id === selectedSub.id ? { ...s, textVi: e.target.value } : s
                            )
                          );
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-750 rounded-md p-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none font-medium leading-relaxed"
                    />
                  </div>

                  {/* Original Text Input */}
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                      Original Audio Script:
                    </label>
                    <input
                      type="text"
                      value={selectedSub.textOriginal || ''}
                      onChange={(e) => {
                        if (onUpdateSubtitles) {
                          onUpdateSubtitles(
                            subtitles.map((s) =>
                              s.id === selectedSub.id
                                ? { ...s, textOriginal: e.target.value }
                                : s
                            )
                          );
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-750 rounded-md px-2.5 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  {/* Micro Actions: Split Cue & Test Speech */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={handleSplitCue}
                      className="flex-1 h-7 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Split className="w-3 h-3 text-cyan-400" />
                      <span>Split Cue</span>
                    </button>

                    <button
                      onClick={() => handleTestVoice(selectedSub.textVi)}
                      className="flex-1 h-7 rounded-md bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[11px] font-medium border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Play className="w-3 h-3 fill-current text-indigo-400" />
                      <span>Preview TTS</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-[#0f172a] border border-slate-800 text-center text-slate-400 text-xs">
                No active subtitle cue selected.
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CLIP ATTRIBUTES & FULL DURATION CONTROLS */}
        {activeTab === 'clip' && (
          <div className="space-y-3.5">
            {activeClip ? (
              <>
                {/* Media Metadata Card */}
                <div className="p-3 rounded-lg bg-[#0f172a] border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Film className="w-4 h-4 text-blue-400 shrink-0" />
                      <span className="font-semibold text-xs text-white truncate">
                        {activeClip.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                      {activeClip.type}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-slate-900/90 p-2 rounded-md border border-slate-800">
                      <div className="text-slate-500 text-[10px]">Source Media Extent</div>
                      <div className="font-mono tabular-nums text-cyan-400 font-semibold mt-0.5">
                        {formatFullTimecode(activeClip.sourceDuration || activeClip.duration)}
                      </div>
                    </div>
                    <div className="bg-slate-900/90 p-2 rounded-md border border-slate-800">
                      <div className="text-slate-500 text-[10px]">Timeline Span</div>
                      <div className="font-mono tabular-nums text-emerald-400 font-semibold mt-0.5">
                        {formatFullTimecode(activeClip.duration)}
                      </div>
                    </div>
                  </div>

                  {/* 1-Click Full Duration Sync */}
                  <button
                    onClick={() => {
                      onUpdateClip(activeClip.id, (c) => ({
                        ...c,
                        sourceStart: 0,
                        duration: c.sourceDuration || c.duration,
                      }));
                      audioEngine.playSfx('ding');
                    }}
                    className="w-full h-8 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Sync Full Duration ({formatFullTimecode(activeClip.sourceDuration || activeClip.duration)})</span>
                  </button>
                </div>

                {/* Trimming & Timing Sliders */}
                <div className="p-3 rounded-lg bg-[#0f172a] border border-slate-800 space-y-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Trimming & Extents
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Active Length:</span>
                      <span className="font-mono tabular-nums text-slate-200 font-semibold">
                        {formatFullTimecode(activeClip.duration)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max={Number((activeClip.sourceDuration - activeClip.sourceStart).toFixed(2)) || 3600}
                      step="0.1"
                      value={activeClip.duration}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        onUpdateClip(activeClip.id, (c) => ({ ...c, duration: val }));
                      }}
                      className="w-full accent-indigo-500 h-1 bg-slate-800 rounded cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">In-point Offset:</span>
                      <span className="font-mono tabular-nums text-slate-200 font-semibold">
                        {formatFullTimecode(activeClip.sourceStart)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={Math.max(0, Number((activeClip.sourceDuration - 0.5).toFixed(2)))}
                      step="0.1"
                      value={activeClip.sourceStart}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        onUpdateClip(activeClip.id, (c) => ({
                          ...c,
                          sourceStart: val,
                          duration: Math.min(c.duration, c.sourceDuration - val),
                        }));
                      }}
                      className="w-full accent-amber-500 h-1 bg-slate-800 rounded cursor-pointer"
                    />
                  </div>
                </div>

                {/* Audio Track & Extraction */}
                <div className="p-3 rounded-lg bg-[#0f172a] border border-slate-800 space-y-2.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Clip Audio Channel
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Volume Level:</span>
                        <span className="font-mono tabular-nums text-slate-200 font-semibold">
                          {activeClip.volume}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="150"
                        value={activeClip.volume}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          onUpdateClip(activeClip.id, (c) => ({ ...c, volume: val }));
                        }}
                        className="w-full accent-blue-500 h-1 bg-slate-800 rounded cursor-pointer"
                      />
                    </div>

                    <button
                      onClick={() => {
                        onUpdateClip(activeClip.id, (c) => ({ ...c, isMuted: !c.isMuted }));
                        audioEngine.playSfx('pop');
                      }}
                      className={`p-2 rounded-md border text-slate-300 transition-colors ${
                        activeClip.isMuted
                          ? 'bg-red-500/20 text-red-300 border-red-500/30'
                          : 'bg-slate-800 border-slate-700 hover:text-white'
                      }`}
                      title={activeClip.isMuted ? 'Unmute' : 'Mute'}
                    >
                      {activeClip.isMuted ? (
                        <VolumeX className="w-3.5 h-3.5" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      onExtractAudio(activeClip);
                      audioEngine.playSfx('ding');
                    }}
                    className="w-full h-7 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Music className="w-3 h-3 text-cyan-400" />
                    <span>Extract Audio to Track</span>
                  </button>
                </div>

                {/* Transform Controls */}
                <div className="p-3 rounded-lg bg-[#0f172a] border border-slate-800 space-y-2.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Geometry & Orientation
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Scale Factor:</span>
                      <span className="font-mono tabular-nums text-slate-200 font-semibold">
                        {Math.round(activeClip.transform.scale * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.5"
                      step="0.05"
                      value={activeClip.transform.scale}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        onUpdateClip(activeClip.id, (c) => ({
                          ...c,
                          transform: { ...c.transform, scale: val },
                        }));
                      }}
                      className="w-full accent-indigo-500 h-1 bg-slate-800 rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        onUpdateClip(activeClip.id, (c) => ({
                          ...c,
                          transform: {
                            ...c.transform,
                            rotation: (c.transform.rotation + 90) % 360,
                          },
                        }));
                      }}
                      className="flex-1 h-7 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <RotateCw className="w-3 h-3 text-indigo-400" />
                      <span>Rotate 90°</span>
                    </button>

                    <button
                      onClick={() => {
                        onUpdateClip(activeClip.id, (c) => ({
                          ...c,
                          transform: { ...c.transform, flipH: !c.transform.flipH },
                        }));
                      }}
                      className={`flex-1 h-7 rounded-md text-[11px] font-medium border transition-colors flex items-center justify-center gap-1.5 ${
                        activeClip.transform.flipH
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      <span>Flip Horizontal</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-6 rounded-lg bg-[#0f172a] border border-slate-800 text-center space-y-2">
                <Film className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-300">No clip currently selected</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Select a clip on the multi-track timeline to inspect and edit its extents, audio channel, and geometry.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: AI DUBBING & SYNTHESIS */}
        {activeTab === 'voiceover' && audioConfig && onChangeAudioConfig && (
          <div className="space-y-3.5">
            {/* Hands-Free Voiceover Control Card */}
            <div className="p-3 rounded-lg bg-[#0f172a] border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-purple-400" />
                  <span className="font-semibold text-xs text-white">
                    Hands-Free Audio Readout
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={audioConfig.aiVoiceover.handsFreeAutoRead}
                    onChange={(e) =>
                      onChangeAudioConfig({
                        ...audioConfig,
                        aiVoiceover: {
                          ...audioConfig.aiVoiceover,
                          handsFreeAutoRead: e.target.checked,
                        },
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Automatically vocalizes Vietnamese dialogue concurrently with video playback so viewers don't need to read subtitles.
              </p>
            </div>

            {/* Voice Persona Selector */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-0.5">
                Voice Persona & Region
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() =>
                    onChangeAudioConfig({
                      ...audioConfig,
                      aiVoiceover: { ...audioConfig.aiVoiceover, voiceGender: 'female' },
                    })
                  }
                  className={`h-8 rounded-md border text-[11px] font-medium transition-colors ${
                    audioConfig.aiVoiceover.voiceGender === 'female'
                      ? 'bg-purple-950/40 border-purple-500/50 text-purple-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Female (Lan · Melodic)
                </button>
                <button
                  onClick={() =>
                    onChangeAudioConfig({
                      ...audioConfig,
                      aiVoiceover: { ...audioConfig.aiVoiceover, voiceGender: 'male' },
                    })
                  }
                  className={`h-8 rounded-md border text-[11px] font-medium transition-colors ${
                    audioConfig.aiVoiceover.voiceGender === 'male'
                      ? 'bg-purple-950/40 border-purple-500/50 text-purple-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Male (Minh · Baritone)
                </button>
              </div>
            </div>

            {/* Speech Rate & Volume */}
            <div className="p-3 rounded-lg bg-[#0f172a] border border-slate-800 space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Synthesis Velocity:</span>
                  <span className="font-mono tabular-nums text-slate-200 font-semibold">
                    {audioConfig.aiVoiceover.speed}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.5"
                  step="0.05"
                  value={audioConfig.aiVoiceover.speed}
                  onChange={(e) =>
                    onChangeAudioConfig({
                      ...audioConfig,
                      aiVoiceover: {
                        ...audioConfig.aiVoiceover,
                        speed: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-purple-500 h-1 bg-slate-800 rounded cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Master Level:</span>
                  <span className="font-mono tabular-nums text-slate-200 font-semibold">
                    {audioConfig.aiVoiceover.volume}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={audioConfig.aiVoiceover.volume}
                  onChange={(e) =>
                    onChangeAudioConfig({
                      ...audioConfig,
                      aiVoiceover: {
                        ...audioConfig.aiVoiceover,
                        volume: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-purple-500 h-1 bg-slate-800 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Voice Preview Button */}
            <button
              onClick={() => handleTestVoice()}
              className="w-full h-8 rounded-md bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/40 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current text-purple-300" />
              <span>Test Audio Speech Synthesis</span>
            </button>
          </div>
        )}

        {/* TAB 4: 4-CHANNEL AUDIO BUS */}
        {activeTab === 'multichannel' && audioConfig && onChangeAudioConfig && (
          <div className="space-y-3.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-0.5">
              4-Track Channel Bus Architecture
            </div>

            <div className="space-y-2">
              {/* Channel 1 */}
              <div className="p-2.5 rounded-lg bg-[#0f172a] border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 font-medium">Channel 1: Original Video Track</span>
                  <span className="font-mono tabular-nums text-slate-200 font-semibold">
                    {audioConfig.originalVideo.volume}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={audioConfig.originalVideo.volume}
                  onChange={(e) =>
                    onChangeAudioConfig({
                      ...audioConfig,
                      originalVideo: {
                        ...audioConfig.originalVideo,
                        volume: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-blue-500 h-1 bg-slate-800 rounded cursor-pointer"
                />
              </div>

              {/* Channel 2 */}
              <div className="p-2.5 rounded-lg bg-[#0f172a] border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-purple-300 font-medium">Channel 2: AI Dubbing Stream</span>
                  <span className="font-mono tabular-nums text-purple-200 font-semibold">
                    {audioConfig.aiVoiceover.volume}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={audioConfig.aiVoiceover.volume}
                  onChange={(e) =>
                    onChangeAudioConfig({
                      ...audioConfig,
                      aiVoiceover: {
                        ...audioConfig.aiVoiceover,
                        volume: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-purple-500 h-1 bg-slate-800 rounded cursor-pointer"
                />
              </div>

              {/* Channel 3 */}
              <div className="p-2.5 rounded-lg bg-[#0f172a] border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-emerald-300 font-medium">Channel 3: Ambient Score (BGM)</span>
                  <span className="font-mono tabular-nums text-slate-200 font-semibold">
                    {audioConfig.bgm.volume}%
                  </span>
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
                  className="w-full accent-emerald-500 h-1 bg-slate-800 rounded cursor-pointer"
                />
              </div>

              {/* Channel 4 */}
              <div className="p-2.5 rounded-lg bg-[#0f172a] border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-amber-300 font-medium">Channel 4: Foley & SFX</span>
                  <span className="font-mono tabular-nums text-slate-200 font-semibold">
                    {audioConfig.sfx.volume}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={audioConfig.sfx.volume}
                  onChange={(e) =>
                    onChangeAudioConfig({
                      ...audioConfig,
                      sfx: { ...audioConfig.sfx, volume: Number(e.target.value) },
                    })
                  }
                  className="w-full accent-amber-500 h-1 bg-slate-800 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ARTIFACT EXPORT */}
        {activeTab === 'export' && (
          <div className="space-y-3.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-0.5">
              Standard Subtitle Exports
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleExport('srt')}
                className="p-3 rounded-lg bg-[#0f172a] border border-slate-800 hover:border-slate-700 text-left space-y-1 transition-colors group"
              >
                <div className="font-semibold text-xs text-white group-hover:text-indigo-300">
                  SubRip (.SRT)
                </div>
                <div className="text-[10px] text-slate-500">Universal standard</div>
              </button>

              <button
                onClick={() => handleExport('vtt')}
                className="p-3 rounded-lg bg-[#0f172a] border border-slate-800 hover:border-slate-700 text-left space-y-1 transition-colors group"
              >
                <div className="font-semibold text-xs text-white group-hover:text-indigo-300">
                  WebVTT (.VTT)
                </div>
                <div className="text-[10px] text-slate-500">HTML5 web video</div>
              </button>

              <button
                onClick={() => handleExport('ass')}
                className="p-3 rounded-lg bg-[#0f172a] border border-slate-800 hover:border-slate-700 text-left space-y-1 transition-colors group"
              >
                <div className="font-semibold text-xs text-white group-hover:text-indigo-300">
                  Aegisub (.ASS)
                </div>
                <div className="text-[10px] text-slate-500">Karaoke styles</div>
              </button>

              <button
                onClick={() => handleExport('txt')}
                className="p-3 rounded-lg bg-[#0f172a] border border-slate-800 hover:border-slate-700 text-left space-y-1 transition-colors group"
              >
                <div className="font-semibold text-xs text-white group-hover:text-indigo-300">
                  Raw Script (.TXT)
                </div>
                <div className="text-[10px] text-slate-500">Plain text transcript</div>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};


