export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5' | '21:9';

export type FilterPreset =
  | 'none'
  | 'cinematic-teal-orange'
  | 'vintage-90s'
  | 'sunset-glow'
  | 'cyberpunk-neon'
  | 'black-white-noir'
  | 'vivid-hdr'
  | 'moody-film'
  | 'pastel';

export type TransitionType =
  | 'none'
  | 'fade'
  | 'dissolve'
  | 'slide-left'
  | 'slide-right'
  | 'zoom'
  | 'glitch'
  | 'white-flash';

export interface TransformSettings {
  rotation: number; // -180 to 180 or 90, 180, 270
  flipH: boolean;
  flipV: boolean;
  scale: number; // 0.2 to 3.0
  x: number; // -500 to 500
  y: number; // -500 to 500
}

export interface FilterSettings {
  preset: FilterPreset;
  brightness: number; // 50 to 150 (100 = default)
  contrast: number; // 50 to 150 (100 = default)
  saturation: number; // 0 to 200 (100 = default)
  temperature: number; // -50 to 50 (0 = default)
  vignette: number; // 0 to 100 (0 = default)
}

export interface TransitionSettings {
  type: TransitionType;
  duration: number; // in seconds, e.g. 0.5
}

export interface VideoClip {
  id: string;
  type: 'video' | 'image';
  name: string;
  src: string;
  thumbnail: string;
  startTime: number; // timeline placement in seconds
  duration: number; // clip duration on timeline in seconds
  sourceStart: number; // in-point in original video
  sourceDuration: number; // total source media duration
  volume: number; // 0 to 200 (100 = default)
  isMuted: boolean;
  transform: TransformSettings;
  filter: FilterSettings;
  transition: TransitionSettings;
}

export type AudioCategory = 'extracted' | 'sfx' | 'voiceover' | 'music';

export interface AudioClip {
  id: string;
  name: string;
  type: AudioCategory;
  src: string;
  startTime: number;
  duration: number;
  volume: number; // 0 to 200
  isMuted: boolean;
  waveform?: number[];
  color: string;
}

export interface SubtitleSegment {
  id: string;
  start: number; // seconds
  end: number; // seconds
  textOriginal: string;
  textVi: string;
  speaker?: string;
}

export type SubtitleDisplayMode = 'bilingual' | 'vi-only' | 'original-only';

export interface ExportSettings {
  hardcodeSubtitles: boolean;
  subtitleMode: SubtitleDisplayMode;
  karaokeEffect: boolean;
  resolution: '720p' | '1080p' | '4k';
  fps: 30 | 60;
  includeVoiceover: boolean;
  voiceGender: 'female' | 'male';
  autoMixAudio: boolean;
}

export interface ExportProgress {
  status: 'idle' | 'rendering' | 'completed' | 'error';
  progress: number; // 0 to 100
  currentFrame: number;
  totalFrames: number;
  timeRemaining: string;
  isMinimized: boolean;
  downloadUrl?: string;
  fileName?: string;
  error?: string;
}

export interface SoundFxItem {
  id: string;
  name: string;
  category: 'Cinematic' | 'Transition' | 'UI & Pop' | 'Camera & Tech';
  description: string;
  duration: number; // in seconds
  sfxKey: string;
}

export interface CloudflareConfig {
  accountId: string;
  apiToken: string;
  isEnabled: boolean;
}

// Multi-Channel Audio Configuration
export interface ChannelAudioState {
  volume: number; // 0 to 200 (100 = 100%)
  isMuted: boolean;
  isSolo: boolean;
}

export interface MultiChannelAudioConfig {
  originalVideo: ChannelAudioState & { autoDucking: boolean };
  aiVoiceover: ChannelAudioState & {
    voiceGender: 'female' | 'male';
    accentRegion: 'north' | 'south' | 'central';
    speed: number; // 0.75 to 1.5
    pitch: number; // 0.8 to 1.3
    handsFreeAutoRead: boolean; // No need to read subtitles!
  };
  bgm: ChannelAudioState & {
    genre: 'Cinematic Ambient' | 'Chill Lo-fi' | 'Upbeat Electronic' | 'Epic Trailer';
    duckingRatio: number; // 20% to 50%
  };
  sfx: ChannelAudioState;
  master: {
    volume: number;
    isMuted: boolean;
  };
}

// Automatic Transcription Item
export interface TranscriptionResult {
  text: string;
  language: string;
  subtitles: SubtitleSegment[];
  speakersCount: number;
}



