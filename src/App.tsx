/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { CanvasPreview } from './components/CanvasPreview';
import { InspectorPanel } from './components/InspectorPanel';
import { AssetSidebar } from './components/AssetSidebar';
import { Timeline } from './components/Timeline';
import { WebVideoSubtitleMode } from './components/WebVideoSubtitleMode';
import { BookmarkletView } from './components/BookmarkletView';
import { ExportModal } from './components/ExportModal';
import { SettingsModal } from './components/SettingsModal';
import { VietsubStudioPanel } from './components/VietsubStudioPanel';
import { BookmarkletModal } from './components/BookmarkletModal';
import { AiVideoCreationModal } from './components/AiVideoCreationModal';
import { ExtensionsAndAppsHubModal } from './components/ExtensionsAndAppsHubModal';
import { AutoTranscriptionModal } from './components/AutoTranscriptionModal';
import { FullScreenCinemaMode } from './components/FullScreenCinemaMode';
import { MultiChannelAudioMixer } from './components/MultiChannelAudioMixer';
import { SystemLogsTable } from './components/SystemLogsTable';
import { SystemControlPanel } from './components/system/SystemControlPanel';
import { SystemLogEntry, SubsystemType, LogSeverity } from './types/logs';
import {
  AspectRatio,
  VideoClip,
  AudioClip,
  SubtitleSegment,
  SubtitleDisplayMode,
  ExportProgress,
  TransitionType,
  CloudflareConfig,
  MultiChannelAudioConfig,
} from './types/editor';
import {
  INITIAL_VIDEO_CLIPS,
  INITIAL_AUDIO_CLIPS,
  INITIAL_SUBTITLES,
} from './utils/sampleData';
import { audioEngine } from './utils/audioEngine';

export default function App() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'editor' | 'web-sub' | 'bookmarklet' | 'settings'>('editor');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');

  // Timeline media state
  const [videoClips, setVideoClips] = useState<VideoClip[]>(INITIAL_VIDEO_CLIPS);
  const [audioClips, setAudioClips] = useState<AudioClip[]>(INITIAL_AUDIO_CLIPS);
  const [subtitles, setSubtitles] = useState<SubtitleSegment[]>(INITIAL_SUBTITLES);

  // Playback & Selection
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedClipId, setSelectedClipId] = useState<string | null>('clip_1');

  // Subtitle settings
  const [subtitleMode, setSubtitleMode] = useState<SubtitleDisplayMode>('bilingual');
  const [subtitleOffset, setSubtitleOffset] = useState<number>(0);
  const [isVietsubPanelOpen, setIsVietsubPanelOpen] = useState<boolean>(true);
  const [isBookmarkletModalOpen, setIsBookmarkletModalOpen] = useState<boolean>(false);

  // Multi-Channel Audio Configuration
  const [audioConfig, setAudioConfig] = useState<MultiChannelAudioConfig>({
    originalVideo: { volume: 100, isMuted: false, isSolo: false, autoDucking: true },
    aiVoiceover: {
      volume: 125,
      isMuted: false,
      isSolo: false,
      voiceGender: 'female',
      accentRegion: 'north',
      speed: 1.0,
      pitch: 1.0,
      handsFreeAutoRead: true, // No need to read subtitles! AI speaks aloud
    },
    bgm: {
      volume: 50,
      isMuted: false,
      isSolo: false,
      genre: 'Chill Lo-fi',
      duckingRatio: 35,
    },
    sfx: { volume: 80, isMuted: false, isSolo: false },
    master: { volume: 100, isMuted: false },
  });

  // Modals & New Feature States
  const [isExtensionsHubOpen, setIsExtensionsHubOpen] = useState<boolean>(false);
  const [isAutoTranscriptionOpen, setIsAutoTranscriptionOpen] = useState<boolean>(false);
  const [isFullScreenCinemaOpen, setIsFullScreenCinemaOpen] = useState<boolean>(false);
  const [isMixerExpanded, setIsMixerExpanded] = useState<boolean>(false);
  const [lastSpokenCueId, setLastSpokenCueId] = useState<string>('');

  // Modals & Export state
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isAiCreationOpen, setIsAiCreationOpen] = useState<boolean>(false);
  const [isMixing, setIsMixing] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    status: 'idle',
    progress: 0,
    currentFrame: 0,
    totalFrames: 0,
    timeRemaining: '',
    isMinimized: false,
  });

  // Cloudflare configuration
  const [cloudflareConfig, setCloudflareConfig] = useState<CloudflareConfig>({
    accountId: '',
    apiToken: '',
    isEnabled: true,
  });

  // System Logs & Operations Telemetry Stream (High-Readability Data Table)
  const [isLogsTableExpanded, setIsLogsTableExpanded] = useState<boolean>(false);
  const [systemLogs, setSystemLogs] = useState<SystemLogEntry[]>([
    {
      id: 'log_core_01',
      timestamp: '09:14:02.112',
      subsystem: 'SYSTEM',
      subsystemLabel: 'System Core',
      event: 'Workspace Initialized',
      status: 'nominal',
      statusLabel: 'Nominal',
      latencyMs: 12,
      details: 'Deep navy CRM dashboard mounted. Scheduler locked at 60 FPS viewport sync.',
    },
    {
      id: 'log_core_02',
      timestamp: '09:14:02.138',
      subsystem: 'PIPELINE',
      subsystemLabel: 'Media Pipeline',
      event: 'Full-Duration Timeline Calibrated',
      status: 'synced',
      statusLabel: 'Synced',
      latencyMs: 16,
      details: 'Timeline duration calibrated across full source extents with sub-frame seek accuracy.',
    },
    {
      id: 'log_core_03',
      timestamp: '09:14:02.164',
      subsystem: 'AI_ENGINE',
      subsystemLabel: 'Gemini AI Engine',
      event: 'Cognitive Polish Synced',
      status: 'nominal',
      statusLabel: 'Nominal',
      latencyMs: 42,
      details: 'Gemini 2.5 Flash endpoints ready: Diacritics Recovery, Cinema Phrasing, Speech-to-Text.',
    },
    {
      id: 'log_core_04',
      timestamp: '09:14:02.190',
      subsystem: 'AUDIO_BUS',
      subsystemLabel: 'Audio Matrix',
      event: '4-Channel Bus Configured',
      status: 'nominal',
      statusLabel: 'Balanced',
      latencyMs: 4,
      details: 'Master matrix active: Primary (100%), AI Dubbing (125%), BGM Score (50%), SFX (80%).',
    },
    {
      id: 'log_core_05',
      timestamp: '09:14:02.215',
      subsystem: 'SUBTITLES',
      subsystemLabel: 'Vietsub Engine',
      event: 'Bilingual Cues Synced',
      status: 'nominal',
      statusLabel: 'Nominal',
      latencyMs: 24,
      details: 'Bilingual subtitles calibrated with live waveform alignment and zero audio drift.',
    },
  ]);

  const addSystemLog = useCallback(
    (
      subsystem: SubsystemType,
      subsystemLabel: string,
      event: string,
      status: LogSeverity,
      statusLabel: string,
      details: string,
      latencyMs?: number
    ) => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(
        now.getMilliseconds()
      ).padStart(3, '0')}`;

      const newEntry: SystemLogEntry = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        timestamp: timeStr,
        subsystem,
        subsystemLabel,
        event,
        status,
        statusLabel,
        details,
        latencyMs: latencyMs ?? Math.floor(Math.random() * 20 + 8),
      };

      setSystemLogs((prev) => [...prev.slice(-150), newEntry]);
    },
    []
  );

  // History stack for Undo / Redo
  const [history, setHistory] = useState<{ videoClips: VideoClip[]; audioClips: AudioClip[] }[]>([]);
  const [redoStack, setRedoStack] = useState<{ videoClips: VideoClip[]; audioClips: AudioClip[] }[]>([]);

  const pushHistory = useCallback(() => {
    setHistory((prev) => [
      ...prev.slice(-25),
      { videoClips: JSON.parse(JSON.stringify(videoClips)), audioClips: JSON.parse(JSON.stringify(audioClips)) },
    ]);
    setRedoStack([]);
  }, [videoClips, audioClips]);

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setRedoStack((prev) => [
      ...prev,
      { videoClips: JSON.parse(JSON.stringify(videoClips)), audioClips: JSON.parse(JSON.stringify(audioClips)) },
    ]);
    setVideoClips(previous.videoClips);
    setAudioClips(previous.audioClips);
    setHistory((prev) => prev.slice(0, -1));
    audioEngine.playSfx('pop');
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory((prev) => [
      ...prev,
      { videoClips: JSON.parse(JSON.stringify(videoClips)), audioClips: JSON.parse(JSON.stringify(audioClips)) },
    ]);
    setVideoClips(next.videoClips);
    setAudioClips(next.audioClips);
    setRedoStack((prev) => prev.slice(0, -1));
    audioEngine.playSfx('pop');
  };

  // Calculate total duration of project based on full durations
  const totalDuration = Math.max(
    10,
    ...videoClips.map((c) => c.startTime + c.duration),
    ...audioClips.map((a) => a.startTime + a.duration),
    ...subtitles.map((s) => s.end)
  );

  // Currently active video clip at playhead
  const activeClip = videoClips.find(
    (c) => currentTime >= c.startTime && currentTime <= c.startTime + c.duration
  );

  // Timeline Playback Loop via requestAnimationFrame
  const animationFrameRef = useRef<number | null>(null);
  const lastTickTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    lastTickTimeRef.current = Date.now();

    const loop = () => {
      const now = Date.now();
      const deltaSec = (now - lastTickTimeRef.current) / 1000;
      lastTickTimeRef.current = now;

      setCurrentTime((prev) => {
        const nextTime = prev + deltaSec;
        if (nextTime >= totalDuration) {
          setIsPlaying(false);
          return 0;
        }
        return nextTime;
      });

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, totalDuration]);

  // Hands-free Voiceover: Automatically speak Vietnamese subtitle during playback!
  useEffect(() => {
    if (!isPlaying || !audioConfig.aiVoiceover.handsFreeAutoRead || audioConfig.aiVoiceover.isMuted) {
      return;
    }

    const effectiveTime = currentTime + subtitleOffset;
    const currentSub = subtitles.find(
      (s) => effectiveTime >= s.start && effectiveTime <= s.end
    );

    if (currentSub && currentSub.id !== lastSpokenCueId) {
      setLastSpokenCueId(currentSub.id);
      audioEngine.speakVietnameseSpeech(
        currentSub.textVi,
        audioConfig.aiVoiceover.voiceGender
      );
    }
  }, [currentTime, isPlaying, audioConfig.aiVoiceover, subtitles, subtitleOffset, lastSpokenCueId]);

  // Keyboard Shortcuts (Space to play/pause, Delete to remove clip, F for Fullscreen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        setIsFullScreenCinemaOpen((p) => !p);
      } else if (e.code === 'Delete' || e.code === 'Backspace') {
        if (selectedClipId) {
          e.preventDefault();
          handleDeleteSelectedClip();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClipId]);

  // CUT & MERGE: Split at Playhead
  const handleSplitAtPlayhead = () => {
    const targetClip = videoClips.find((c) => c.id === selectedClipId);
    if (!targetClip) return;

    const clipStart = targetClip.startTime;
    const clipEnd = targetClip.startTime + targetClip.duration;

    // Check if playhead is strictly inside the clip
    if (currentTime <= clipStart + 0.1 || currentTime >= clipEnd - 0.1) {
      audioEngine.playSfx('glitch');
      return;
    }

    pushHistory();
    const splitPointInClip = currentTime - clipStart;

    // Part 1: from clipStart to currentTime
    const part1: VideoClip = {
      ...targetClip,
      duration: Number(splitPointInClip.toFixed(2)),
    };

    // Part 2: from currentTime to clipEnd
    const part2: VideoClip = {
      ...targetClip,
      id: `clip_${Date.now()}_part2`,
      name: `${targetClip.name} (Phần 2)`,
      startTime: Number(currentTime.toFixed(2)),
      duration: Number((targetClip.duration - splitPointInClip).toFixed(2)),
      sourceStart: Number((targetClip.sourceStart + splitPointInClip).toFixed(2)),
    };

    setVideoClips((prev) =>
      prev.map((c) => (c.id === targetClip.id ? part1 : c)).concat(part2).sort((a, b) => a.startTime - b.startTime)
    );

    setSelectedClipId(part2.id);
    audioEngine.playSfx('whoosh');
    addSystemLog(
      'TIMELINE',
      'Timeline & Media',
      'Clip Split Executed',
      'nominal',
      'Nominal',
      `Split clip '${targetClip.name}' into 2 segments at ${currentTime.toFixed(2)}s.`
    );
  };

  // CUT & MERGE: Trim Start to Playhead
  const handleTrimStartToPlayhead = () => {
    const targetClip = videoClips.find((c) => c.id === selectedClipId);
    if (!targetClip) return;

    if (currentTime <= targetClip.startTime || currentTime >= targetClip.startTime + targetClip.duration - 0.2) {
      return;
    }

    pushHistory();
    const trimmedSec = currentTime - targetClip.startTime;
    setVideoClips((prev) =>
      prev.map((c) => {
        if (c.id === targetClip.id) {
          return {
            ...c,
            startTime: Number(currentTime.toFixed(2)),
            duration: Number((c.duration - trimmedSec).toFixed(2)),
            sourceStart: Number((c.sourceStart + trimmedSec).toFixed(2)),
          };
        }
        return c;
      })
    );
    audioEngine.playSfx('whoosh');
    addSystemLog(
      'TIMELINE',
      'Timeline & Media',
      'Trim In Calibrated',
      'nominal',
      'Nominal',
      `Trimmed head of '${targetClip.name}' to ${currentTime.toFixed(2)}s.`
    );
  };

  // CUT & MERGE: Trim End to Playhead
  const handleTrimEndToPlayhead = () => {
    const targetClip = videoClips.find((c) => c.id === selectedClipId);
    if (!targetClip) return;

    if (currentTime <= targetClip.startTime + 0.2 || currentTime >= targetClip.startTime + targetClip.duration) {
      return;
    }

    pushHistory();
    const newDuration = currentTime - targetClip.startTime;
    setVideoClips((prev) =>
      prev.map((c) => {
        if (c.id === targetClip.id) {
          return {
            ...c,
            duration: Number(newDuration.toFixed(2)),
          };
        }
        return c;
      })
    );
    audioEngine.playSfx('whoosh');
    addSystemLog(
      'TIMELINE',
      'Timeline & Media',
      'Trim Out Calibrated',
      'nominal',
      'Nominal',
      `Trimmed tail of '${targetClip.name}' at ${currentTime.toFixed(2)}s.`
    );
  };

  // Delete selected clip
  const handleDeleteSelectedClip = () => {
    if (!selectedClipId) return;
    pushHistory();
    setVideoClips((prev) => prev.filter((c) => c.id !== selectedClipId));
    setAudioClips((prev) => prev.filter((a) => a.id !== selectedClipId));
    setSelectedClipId(null);
    audioEngine.playSfx('pop');
    addSystemLog(
      'TIMELINE',
      'Timeline & Media',
      'Clip Purged',
      'warning',
      'Purged',
      `Removed clip '${selectedClipId}' from timeline layout.`
    );
  };

  // Move clip left / right in order
  const handleMoveClip = (clipId: string, direction: 'left' | 'right') => {
    const index = videoClips.findIndex((c) => c.id === clipId);
    if (index === -1) return;
    if (direction === 'left' && index === 0) return;
    if (direction === 'right' && index === videoClips.length - 1) return;

    pushHistory();
    const newClips = [...videoClips];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    const temp = newClips[index];
    newClips[index] = newClips[targetIndex];
    newClips[targetIndex] = temp;

    // Recalculate start times sequentially
    let currStart = 0;
    const readjusted = newClips.map((c) => {
      const updated = { ...c, startTime: currStart };
      currStart += c.duration;
      return updated;
    });

    setVideoClips(readjusted);
    audioEngine.playSfx('whoosh');
  };

  // Update specific clip properties
  const handleUpdateClip = (clipId: string, updater: (clip: VideoClip) => VideoClip) => {
    setVideoClips((prev) =>
      prev.map((c) => (c.id === clipId ? updater(c) : c))
    );
  };

  // Audio Extraction: Separate audio from video clip into timeline
  const handleExtractAudio = (clip: VideoClip) => {
    pushHistory();
    const extractedTrack: AudioClip = {
      id: `extracted_${Date.now()}_${clip.id}`,
      name: `Âm thanh tách: ${clip.name}`,
      type: 'extracted',
      src: clip.src,
      startTime: clip.startTime,
      duration: clip.duration,
      volume: 100,
      isMuted: false,
      color: '#f43f5e',
      waveform: [60, 80, 45, 90, 75, 50, 65, 85, 40],
    };

    // Mute original video clip so they don't echo
    setVideoClips((prev) =>
      prev.map((c) => (c.id === clip.id ? { ...c, isMuted: true } : c))
    );

    setAudioClips((prev) => [...prev, extractedTrack]);
    audioEngine.playSfx('ding');
  };

  // Apply Transition to all clips
  const handleApplyTransitionToAll = (transitionType: TransitionType, duration: number) => {
    pushHistory();
    setVideoClips((prev) =>
      prev.map((c) => ({
        ...c,
        transition: { type: transitionType, duration },
      }))
    );
    audioEngine.playSfx('ding');
  };

  // AI Auto-Mix & Audio Ducking Assistant
  const handleRunAiAudioMix = async () => {
    setIsMixing(true);
    try {
      const res = await fetch('/api/gemini/audio-mix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tracks: audioClips.map((a) => ({ name: a.name, type: a.type, volume: a.volume })),
          vocalType: 'Vietnamese Voiceover Narration',
          bgmGenre: 'Cinematic Ambient',
        }),
      });

      const data = await res.json();
      if (data.success && data.mix) {
        pushHistory();
        // Adjust background music volume according to ducking recommendation
        setAudioClips((prev) =>
          prev.map((a) => {
            if (a.type === 'music') {
              return { ...a, volume: data.mix.duckingMusicVolumePct || 25 };
            }
            if (a.type === 'voiceover') {
              return { ...a, volume: data.mix.vocalVolumeBoostPct || 135 };
            }
            return a;
          })
        );
        audioEngine.playSfx('ding');
        alert(`✨ Trợ lý Auto-Mix: ${data.mix.soundDesignTips}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsMixing(false);
    }
  };

  // Import video & subtitles from Web Video Subtitle Mode directly into Studio Timeline
  const handleImportWebSubToTimeline = (
    videoUrl: string,
    videoTitle: string,
    importedSubs?: SubtitleSegment[]
  ) => {
    pushHistory();
    const newClip: VideoClip = {
      id: `clip_imported_${Date.now()}`,
      type: 'video',
      name: videoTitle || 'Web Subtitled Video',
      src: videoUrl,
      thumbnail:
        'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
      startTime: currentTime,
      duration: 25.0,
      sourceStart: 0,
      sourceDuration: 60.0,
      volume: 100,
      isMuted: false,
      transform: { rotation: 0, flipH: false, flipV: false, scale: 1, x: 0, y: 0 },
      filter: {
        preset: 'cinematic-teal-orange',
        brightness: 105,
        contrast: 110,
        saturation: 115,
        temperature: -10,
        vignette: 20,
      },
      transition: { type: 'fade', duration: 0.5 },
    };

    setVideoClips((prev) => [...prev, newClip]);
    if (importedSubs && importedSubs.length > 0) {
      setSubtitles(importedSubs);
    }
    setActiveTab('editor');
    setSelectedClipId(newClip.id);
    audioEngine.playSfx('ding');
  };

  // Handle applying complete AI Generated project to editor
  const handleApplyAiProject = (
    newClips: VideoClip[],
    newSubs: SubtitleSegment[],
    newAudio: AudioClip[]
  ) => {
    pushHistory();
    setVideoClips(newClips);
    setSubtitles(newSubs);
    setAudioClips(newAudio);
    if (newClips.length > 0) {
      setSelectedClipId(newClips[0].id);
    }
    setCurrentTime(0);
    setIsPlaying(false);
  };

  return (
    <div className="studio-shell h-[100dvh] max-h-[100dvh] min-h-[100dvh] w-full flex flex-col bg-[#070b12] text-slate-100 overflow-hidden font-sans select-none relative">
      {/* Top Main Navigation Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        aspectRatio={aspectRatio}
        setAspectRatio={setAspectRatio}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenUpload={() => setActiveTab('editor')}
        canUndo={history.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        exportMinimized={exportProgress.isMinimized}
        onExpandExport={() =>
          setExportProgress((prev) => ({ ...prev, isMinimized: false }))
        }
        isVietsubPanelOpen={isVietsubPanelOpen}
        onToggleVietsubPanel={() => setIsVietsubPanelOpen((p) => !p)}
        subtitlesCount={subtitles.length}
        onOpenBookmarkletModal={() => setIsBookmarkletModalOpen(true)}
        onOpenAiCreation={() => setIsAiCreationOpen(true)}
        onOpenExtensionsHub={() => setIsExtensionsHubOpen(true)}
        onOpenAutoTranscription={() => setIsAutoTranscriptionOpen(true)}
        onOpenFullScreen={() => setIsFullScreenCinemaOpen(true)}
        handsFreeVoiceoverActive={audioConfig.aiVoiceover.handsFreeAutoRead}
        onToggleHandsFreeVoiceover={() => {
          setAudioConfig((prev) => {
            const nextVal = !prev.aiVoiceover.handsFreeAutoRead;
            addSystemLog(
              'AUDIO_BUS',
              'Audio Matrix',
              nextVal ? 'Hands-Free AI Dubbing Enabled' : 'Hands-Free AI Dubbing Disabled',
              'nominal',
              'Nominal',
              `AI voiceover speech synthesis on subtitle cues set to ${nextVal ? 'ACTIVE' : 'MUTED'}.`
            );
            return {
              ...prev,
              aiVoiceover: {
                ...prev.aiVoiceover,
                handsFreeAutoRead: nextVal,
              },
            };
          });
          audioEngine.playSfx('ding');
        }}
      />

      {/* Main Dynamic Workspace Container */}
      <main className="studio-workspace flex-1 flex min-h-0 relative overflow-hidden bg-[#070b12] p-2 sm:p-2.5">
        {activeTab === 'editor' && (
          <div className="studio-editor flex-1 flex flex-col min-h-0 overflow-hidden gap-2">
            {/* Top Workspace (Asset Sidebar, Dominant Center Canvas + System Logs, Right Inspector Panel) */}
            <div className="studio-main-grid flex-1 flex min-h-0 overflow-hidden gap-2">
              {/* Left Asset Sidebar */}
              <AssetSidebar
                onAddVideoClip={(clip) => {
                  pushHistory();
                  setVideoClips((prev) => [...prev, clip]);
                  setSelectedClipId(clip.id);
                  addSystemLog(
                    'PIPELINE',
                    'Media Pipeline',
                    'Media Stream Attached',
                    'synced',
                    'Synced',
                    `Appended clip '${clip.name}' (${clip.duration}s full duration) to timeline stream.`
                  );
                }}
                onAddAudioClip={(audio) => {
                  pushHistory();
                  setAudioClips((prev) => [...prev, audio]);
                  setSelectedClipId(audio.id);
                  addSystemLog(
                    'AUDIO_BUS',
                    'Audio Matrix',
                    'Audio Track Ingested',
                    'nominal',
                    'Nominal',
                    `Injected audio track '${audio.name}' to channel.`
                  );
                }}
                onSetSubtitles={(subs) => {
                  setSubtitles(subs);
                  addSystemLog(
                    'SUBTITLES',
                    'Vietsub Engine',
                    'Subtitle Stream Ingested',
                    'nominal',
                    'Nominal',
                    `Ingested ${subs.length} subtitle segments into active project.`
                  );
                }}
                currentTime={currentTime}
              />

              {/* Middle Center Column: Dominant Centered Canvas Preview with System Logs Data Table Aligned Below */}
              <div className="studio-canvas-column flex-1 flex flex-col min-w-0 min-h-0 gap-2 overflow-hidden">
                {/* Dominant Centered Video Preview Canvas */}
                <CanvasPreview
                  aspectRatio={aspectRatio}
                  currentTime={currentTime}
                  totalDuration={totalDuration}
                  isPlaying={isPlaying}
                  onTogglePlay={() => {
                    setIsPlaying((p) => {
                      const next = !p;
                      addSystemLog(
                        'TIMELINE',
                        'Timeline & Media',
                        next ? 'Playback Running' : 'Playback Halted',
                        'nominal',
                        next ? 'Active' : 'Nominal',
                        `Playhead at ${currentTime.toFixed(2)}s / ${totalDuration.toFixed(2)}s.`
                      );
                      return next;
                    });
                  }}
                  onSeek={(time) => {
                    setCurrentTime(time);
                  }}
                  activeClip={activeClip}
                  subtitles={subtitles}
                  subtitleMode={subtitleMode}
                  setSubtitleMode={(mode) => {
                    setSubtitleMode(mode);
                    addSystemLog(
                      'SUBTITLES',
                      'Vietsub Engine',
                      'Display Mode Changed',
                      'nominal',
                      'Nominal',
                      `Switched subtitle format to '${mode}'.`
                    );
                  }}
                  subtitleOffset={subtitleOffset}
                  setSubtitleOffset={setSubtitleOffset}
                  onAddVideoClip={(clip) => {
                    pushHistory();
                    setVideoClips((prev) => [...prev, clip]);
                    setSelectedClipId(clip.id);
                    addSystemLog(
                      'PIPELINE',
                      'Media Pipeline',
                      'Video Stream Ingested',
                      'synced',
                      'Synced',
                      `Loaded '${clip.name}' (full duration: ${clip.duration}s).`
                    );
                  }}
                />

                {/* Sleek, High-Readability System Logs Data Table Aligned Below Canvas */}
                <div
                  className={`${
                    isLogsTableExpanded ? 'h-64 sm:h-72' : 'h-36 sm:h-44'
                  } shrink-0 transition-all duration-200`}
                >
                  <SystemLogsTable
                    logs={systemLogs}
                    onClearLogs={() => setSystemLogs([])}
                    isExpanded={isLogsTableExpanded}
                    onToggleExpand={() => setIsLogsTableExpanded((v) => !v)}
                  />
                </div>
              </div>

              {/* Integrated Vietsub Studio Panel directly within Editor Interface (if open) */}
              {isVietsubPanelOpen && (
                <VietsubStudioPanel
                  subtitles={subtitles}
                  onUpdateSubtitles={(newSubs) => {
                    pushHistory();
                    setSubtitles(newSubs);
                  }}
                  subtitleMode={subtitleMode}
                  setSubtitleMode={setSubtitleMode}
                  subtitleOffset={subtitleOffset}
                  setSubtitleOffset={setSubtitleOffset}
                  currentTime={currentTime}
                  onSeek={(t) => setCurrentTime(t)}
                  onImportWebVideo={handleImportWebSubToTimeline}
                  onOpenBookmarklet={() => setIsBookmarkletModalOpen(true)}
                  onClose={() => setIsVietsubPanelOpen(false)}
                />
              )}

              {/* Right Inspector Panel: Structured CRM Control Panel */}
              <InspectorPanel
                activeClip={videoClips.find((c) => c.id === selectedClipId)}
                onUpdateClip={handleUpdateClip}
                onExtractAudio={handleExtractAudio}
                onApplyTransitionToAll={handleApplyTransitionToAll}
                onRunAiAudioMix={handleRunAiAudioMix}
                isMixing={isMixing}
                subtitles={subtitles}
                onUpdateSubtitles={(newSubs) => {
                  pushHistory();
                  setSubtitles(newSubs);
                }}
                subtitleMode={subtitleMode}
                setSubtitleMode={setSubtitleMode}
                subtitleOffset={subtitleOffset}
                setSubtitleOffset={setSubtitleOffset}
                onOpenVietsubStudio={() => setIsVietsubPanelOpen(true)}
                audioConfig={audioConfig}
                onChangeAudioConfig={(cfg) => setAudioConfig(cfg)}
                onOpenAutoTranscription={() => setIsAutoTranscriptionOpen(true)}
                onOpenFullScreen={() => setIsFullScreenCinemaOpen(true)}
              />
            </div>

            {/* Quick Multi-Channel Audio Bar & Collapsible Mixer */}
            <div className="studio-bottom-stack shrink-0 flex flex-col gap-1.5">
              <div className="h-7 px-3 bg-[#0f172a] rounded-lg border border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsMixerExpanded((prev) => !prev)}
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded font-medium transition-colors ${
                      isMixerExpanded
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <span>🎚️ {isMixerExpanded ? 'Thu gọn Bàn Hòa Âm' : 'Mở Bàn Hòa Âm Đa Kênh (4-Track Matrix)'}</span>
                  </button>

                  <div className="hidden sm:flex items-center gap-2 text-slate-500 font-mono text-[10px]">
                    <span>Kênh 1: {audioConfig.originalVideo.volume}%</span>
                    <span>·</span>
                    <span className="text-purple-400 font-semibold">
                      Kênh 2 (AI Dub): {audioConfig.aiVoiceover.volume}%
                    </span>
                    <span>·</span>
                    <span>Kênh 3: {audioConfig.bgm.volume}%</span>
                    <span>·</span>
                    <span>Kênh 4: {audioConfig.sfx.volume}%</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-500 text-[10px]">
                  <span>Phím tắt: [F] Rạp Phim Toàn Màn Hình</span>
                </div>
              </div>

              {isMixerExpanded && (
                <div className="px-3 py-2 bg-[#0f172a] rounded-lg border border-slate-800 animate-in fade-in duration-200">
                  <MultiChannelAudioMixer
                    config={audioConfig}
                    onChangeConfig={(cfg) => setAudioConfig(cfg)}
                    isPlaying={isPlaying}
                  />
                </div>
              )}

              {/* Bottom Multi-Track CapCut Timeline */}
              <Timeline
                videoClips={videoClips}
                audioClips={audioClips}
                subtitles={subtitles}
                currentTime={currentTime}
                totalDuration={totalDuration}
                isPlaying={isPlaying}
                selectedClipId={selectedClipId}
                onSelectClip={(id) => setSelectedClipId(id)}
                onSeek={(t) => setCurrentTime(t)}
                onTogglePlay={() => setIsPlaying((p) => !p)}
                onSplitAtPlayhead={handleSplitAtPlayhead}
                onTrimStartToPlayhead={handleTrimStartToPlayhead}
                onTrimEndToPlayhead={handleTrimEndToPlayhead}
                onDeleteSelectedClip={handleDeleteSelectedClip}
                onExtractAudio={handleExtractAudio}
                onMoveClip={handleMoveClip}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Web Video Subtitling Mode */}
        {activeTab === 'web-sub' && (
          <WebVideoSubtitleMode onImportToTimeline={handleImportWebSubToTimeline} />
        )}

        {/* Tab 3: 1-Click Vietsub Bookmarklet */}
        {activeTab === 'bookmarklet' && <BookmarkletView />}

        {/* Tab 4: Cloudflare Workers AI & Settings */}
        {activeTab === 'settings' && (
          <div className="flex-1 flex items-center justify-center p-6 bg-neutral-950 overflow-y-auto">
            <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="font-extrabold text-base text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Cloudflare Workers AI & Gemini Server Engine</span>
                </div>
                <button
                  onClick={() => setActiveTab('editor')}
                  className="px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300"
                >
                  Quay lại Editor
                </button>
              </div>

              <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 text-xs text-neutral-300 space-y-2">
                <div className="font-bold text-orange-400 text-sm">
                  Cấu hình triển khai & Tích hợp Cloudflare
                </div>
                <p>
                  Bạn có thể xuất bản toàn bộ ứng dụng trực tiếp lên{' '}
                  <a
                    href="https://dash.cloudflare.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-orange-400 underline font-bold"
                  >
                    dash.cloudflare.com
                  </a>{' '}
                  với Cloudflare Pages hoặc Cloudflare Workers. Hệ thống Server-Side Gemini API xử lý phụ đề điện ảnh và giọng đọc thuyết minh tự động.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-neutral-400 font-bold block mb-1">
                    Cloudflare Account ID (Tùy chọn):
                  </label>
                  <input
                    type="text"
                    value={cloudflareConfig.accountId}
                    onChange={(e) =>
                      setCloudflareConfig((prev) => ({ ...prev, accountId: e.target.value }))
                    }
                    placeholder="Nhập Cloudflare Account ID của bạn..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-200 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-neutral-400 font-bold block mb-1">
                    Cloudflare Workers AI Token (Tùy chọn):
                  </label>
                  <input
                    type="password"
                    value={cloudflareConfig.apiToken}
                    onChange={(e) =>
                      setCloudflareConfig((prev) => ({ ...prev, apiToken: e.target.value }))
                    }
                    placeholder="Nhập Cloudflare API Token..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-200 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => {
                    audioEngine.playSfx('ding');
                    alert('Đã lưu cấu hình Cloudflare thành công!');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-extrabold text-xs shadow-lg shadow-cyan-500/20"
                >
                  Lưu cấu hình
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <SystemControlPanel />

      {/* Export Modal & Minimized Background Widget */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        aspectRatio={aspectRatio}
        videoClips={videoClips}
        audioClips={audioClips}
        subtitles={subtitles}
        exportProgress={exportProgress}
        setExportProgress={setExportProgress}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        cloudflareConfig={cloudflareConfig}
        setCloudflareConfig={setCloudflareConfig}
      />

      {/* 1-Click Vietsub Bookmarklet Modal */}
      <BookmarkletModal
        isOpen={isBookmarkletModalOpen}
        onClose={() => setIsBookmarkletModalOpen(false)}
      />

      {/* AI-Powered Video Creation with Vietnamese Subtitles Modal */}
      <AiVideoCreationModal
        isOpen={isAiCreationOpen}
        onClose={() => setIsAiCreationOpen(false)}
        aspectRatio={aspectRatio}
        setAspectRatio={setAspectRatio}
        onApplyProject={handleApplyAiProject}
      />

      {/* Extensions & Android APK Apps Hub Modal */}
      <ExtensionsAndAppsHubModal
        isOpen={isExtensionsHubOpen}
        onClose={() => setIsExtensionsHubOpen(false)}
        currentMode={isFullScreenCinemaOpen ? 'fullscreen' : activeTab === 'web-sub' ? 'web-video' : 'studio'}
        onSwitchMode={(mode) => {
          if (mode === 'fullscreen') {
            setIsFullScreenCinemaOpen(true);
          } else if (mode === 'web-video') {
            setActiveTab('web-sub');
          } else {
            setActiveTab('editor');
            setIsFullScreenCinemaOpen(false);
          }
        }}
        onOpenBookmarklet={() => setIsBookmarkletModalOpen(true)}
      />

      {/* Automatic Audio/Speech Transcription Tool */}
      <AutoTranscriptionModal
        isOpen={isAutoTranscriptionOpen}
        onClose={() => setIsAutoTranscriptionOpen(false)}
        onApplySubtitles={(newSubs) => {
          pushHistory();
          setSubtitles(newSubs);
        }}
        currentDuration={totalDuration}
      />

      {/* Dedicated Optimized Full-Screen Cinema Interface */}
      <FullScreenCinemaMode
        isOpen={isFullScreenCinemaOpen}
        onClose={() => setIsFullScreenCinemaOpen(false)}
        videoClips={videoClips}
        currentTime={currentTime}
        duration={totalDuration}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying((p) => !p)}
        onSeek={(t) => setCurrentTime(t)}
        onStepFrame={(frames) =>
          setCurrentTime((t) => Math.max(0, Math.min(totalDuration, t + frames * (1 / 30))))
        }
        subtitles={subtitles}
        subtitleMode={subtitleMode}
        setSubtitleMode={setSubtitleMode}
        subtitleOffset={subtitleOffset}
        setSubtitleOffset={setSubtitleOffset}
        audioConfig={audioConfig}
        onChangeAudioConfig={(cfg) => setAudioConfig(cfg)}
      />
    </div>
  );
}


