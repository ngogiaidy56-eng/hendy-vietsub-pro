import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Mic,
  Music,
  Zap,
  Sliders,
  Play,
  RotateCcw,
  Sparkles,
  Radio,
  Check,
  Headphones,
} from 'lucide-react';
import { MultiChannelAudioConfig } from '../types/editor';
import { audioEngine } from '../utils/audioEngine';

interface MultiChannelAudioMixerProps {
  config: MultiChannelAudioConfig;
  onChangeConfig: (newConfig: MultiChannelAudioConfig) => void;
  isPlaying?: boolean;
}

export const MultiChannelAudioMixer: React.FC<MultiChannelAudioMixerProps> = ({
  config,
  onChangeConfig,
  isPlaying = false,
}) => {
  // Meter visualization state
  const [meterLevels, setMeterLevels] = useState({ ch1: 65, ch2: 80, ch3: 45, ch4: 30, master: 70 });

  // Simulate real-time bouncing meters when playing
  useEffect(() => {
    if (!isPlaying) {
      setMeterLevels({ ch1: 0, ch2: 0, ch3: 0, ch4: 0, master: 0 });
      return;
    }

    const interval = setInterval(() => {
      setMeterLevels({
        ch1: config.originalVideo.isMuted ? 0 : Math.floor(Math.random() * 40 + (config.originalVideo.volume * 0.4)),
        ch2: config.aiVoiceover.isMuted ? 0 : Math.floor(Math.random() * 35 + (config.aiVoiceover.volume * 0.5)),
        ch3: config.bgm.isMuted ? 0 : Math.floor(Math.random() * 30 + (config.bgm.volume * 0.3)),
        ch4: config.sfx.isMuted ? 0 : Math.floor(Math.random() * 25 + (config.sfx.volume * 0.2)),
        master: config.master.isMuted ? 0 : Math.floor(Math.random() * 30 + 55),
      });
    }, 150);

    return () => clearInterval(interval);
  }, [isPlaying, config]);

  const updateCh = (channel: keyof MultiChannelAudioConfig, field: string, value: any) => {
    onChangeConfig({
      ...config,
      [channel]: {
        ...(config[channel] as any),
        [field]: value,
      },
    });
  };

  const handleTestVoice = () => {
    audioEngine.speakVietnameseSpeech(
      'Xin chào! Giọng đọc lồng tiếng AI tiếng Việt đang hoạt động hoàn hảo. Bạn không cần phải đọc phụ đề.',
      config.aiVoiceover.voiceGender
    );
  };

  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-3.5 shadow-xl space-y-3 text-slate-200">
      {/* Mixer Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <Headphones className="w-4 h-4" />
          </div>
          <div>
            <div className="font-extrabold text-xs text-white flex items-center gap-2">
              Bàn Hòa Âm Đa Kênh (Multi-Channel Audio Mixer)
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-bold">
                4-TRACK PRO
              </span>
            </div>
            <p className="text-[10px] text-neutral-400">
              Kiểm soát độc lập: Thoại Gốc, Lồng Tiếng AI, Nhạc Nền & Hiệu Ứng
            </p>
          </div>
        </div>

        {/* Master Hands-free Banner */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-500/40 text-purple-200 text-[10px] font-bold cursor-pointer select-none">
            <input
              type="checkbox"
              checked={config.aiVoiceover.handsFreeAutoRead}
              onChange={(e) => updateCh('aiVoiceover', 'handsFreeAutoRead', e.target.checked)}
              className="rounded bg-neutral-800 text-purple-600 focus:ring-0"
            />
            <span>🎙️ Tự Động Lồng Tiếng (Không Cần Đọc)</span>
          </label>
        </div>
      </div>

      {/* 4 Tracks + Master Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        {/* Channel 1: Video Sound */}
        <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/90 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-neutral-300 text-[11px] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              Kênh 1: Video Gốc
            </span>
            <button
              onClick={() => updateCh('originalVideo', 'isMuted', !config.originalVideo.isMuted)}
              className={`p-1 rounded text-[10px] font-bold ${
                config.originalVideo.isMuted ? 'bg-red-500/20 text-red-400' : 'bg-neutral-800 text-neutral-300'
              }`}
            >
              {config.originalVideo.isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* VU Meter */}
          <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-100"
              style={{ width: `${Math.min(100, meterLevels.ch1)}%` }}
            ></div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-neutral-400">
              <span>Âm lượng:</span>
              <span className="font-mono text-white">{config.originalVideo.volume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={config.originalVideo.volume}
              onChange={(e) => updateCh('originalVideo', 'volume', Number(e.target.value))}
              className="w-full accent-blue-500 h-1 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>

          <label className="flex items-center gap-1.5 text-[10px] text-neutral-400 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={config.originalVideo.autoDucking}
              onChange={(e) => updateCh('originalVideo', 'autoDucking', e.target.checked)}
              className="rounded bg-neutral-800 text-blue-600 focus:ring-0"
            />
            <span>Auto-Ducking khi AI nói</span>
          </label>
        </div>

        {/* Channel 2: AI Voiceover / Dubbing */}
        <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-purple-300 text-[11px] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
              Kênh 2: Lồng Tiếng AI
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleTestVoice}
                className="px-1.5 py-0.5 rounded bg-purple-800/60 hover:bg-purple-700 text-purple-200 text-[9px] font-bold"
                title="Nghe thử giọng đọc"
              >
                Thử giọng
              </button>
              <button
                onClick={() => updateCh('aiVoiceover', 'isMuted', !config.aiVoiceover.isMuted)}
                className={`p-1 rounded text-[10px] font-bold ${
                  config.aiVoiceover.isMuted ? 'bg-red-500/20 text-red-400' : 'bg-purple-900 text-purple-200'
                }`}
              >
                {config.aiVoiceover.isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* VU Meter */}
          <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-100"
              style={{ width: `${Math.min(100, meterLevels.ch2)}%` }}
            ></div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-neutral-400">
              <span>Âm lượng Thuyết minh:</span>
              <span className="font-mono text-purple-300 font-bold">{config.aiVoiceover.volume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={config.aiVoiceover.volume}
              onChange={(e) => updateCh('aiVoiceover', 'volume', Number(e.target.value))}
              className="w-full accent-purple-500 h-1 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-1.5 pt-1">
            <select
              value={config.aiVoiceover.voiceGender}
              onChange={(e) => updateCh('aiVoiceover', 'voiceGender', e.target.value)}
              className="bg-neutral-900 border border-neutral-750 text-neutral-200 text-[10px] rounded px-1.5 py-0.5 flex-1 focus:outline-none"
            >
              <option value="female">Giọng Nữ (Truyền cảm)</option>
              <option value="male">Giọng Nam (Trầm ấm)</option>
            </select>
            <select
              value={config.aiVoiceover.speed}
              onChange={(e) => updateCh('aiVoiceover', 'speed', Number(e.target.value))}
              className="bg-neutral-900 border border-neutral-750 text-neutral-200 text-[10px] rounded px-1 py-0.5 focus:outline-none"
            >
              <option value={0.85}>0.85x</option>
              <option value={1.0}>1.0x</option>
              <option value={1.2}>1.2x</option>
              <option value={1.35}>1.35x</option>
            </select>
          </div>
        </div>

        {/* Channel 3: Background Music (BGM) */}
        <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/90 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-neutral-300 text-[11px] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Kênh 3: Nhạc Nền (BGM)
            </span>
            <button
              onClick={() => updateCh('bgm', 'isMuted', !config.bgm.isMuted)}
              className={`p-1 rounded text-[10px] font-bold ${
                config.bgm.isMuted ? 'bg-red-500/20 text-red-400' : 'bg-neutral-800 text-neutral-300'
              }`}
            >
              {config.bgm.isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* VU Meter */}
          <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-100"
              style={{ width: `${Math.min(100, meterLevels.ch3)}%` }}
            ></div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-neutral-400">
              <span>Âm lượng BGM:</span>
              <span className="font-mono text-white">{config.bgm.volume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={config.bgm.volume}
              onChange={(e) => updateCh('bgm', 'volume', Number(e.target.value))}
              className="w-full accent-emerald-500 h-1 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>

          <div className="text-[10px] text-neutral-400 flex items-center justify-between pt-1">
            <span>Ducking giảm:</span>
            <span className="text-emerald-400 font-bold">{config.bgm.duckingRatio}%</span>
          </div>
        </div>

        {/* Channel 4: Sound FX */}
        <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/90 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-neutral-300 text-[11px] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Kênh 4: Hiệu Ứng (SFX)
            </span>
            <button
              onClick={() => updateCh('sfx', 'isMuted', !config.sfx.isMuted)}
              className={`p-1 rounded text-[10px] font-bold ${
                config.sfx.isMuted ? 'bg-red-500/20 text-red-400' : 'bg-neutral-800 text-neutral-300'
              }`}
            >
              {config.sfx.isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* VU Meter */}
          <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-100"
              style={{ width: `${Math.min(100, meterLevels.ch4)}%` }}
            ></div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-neutral-400">
              <span>Âm lượng SFX:</span>
              <span className="font-mono text-white">{config.sfx.volume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={config.sfx.volume}
              onChange={(e) => updateCh('sfx', 'volume', Number(e.target.value))}
              className="w-full accent-amber-500 h-1 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Quick SFX buttons */}
          <div className="flex items-center gap-1 pt-1">
            <button
              onClick={() => audioEngine.playSfx('whoosh')}
              className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[9px] text-neutral-300"
            >
              Whoosh
            </button>
            <button
              onClick={() => audioEngine.playSfx('boom')}
              className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[9px] text-neutral-300"
            >
              Boom
            </button>
            <button
              onClick={() => audioEngine.playSfx('ding')}
              className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[9px] text-neutral-300"
            >
              Ding
            </button>
          </div>
        </div>

        {/* Master Channel */}
        <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-750 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-white text-[11px] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              MASTER OUT
            </span>
            <button
              onClick={() => updateCh('master', 'isMuted', !config.master.isMuted)}
              className={`p-1 rounded text-[10px] font-bold ${
                config.master.isMuted ? 'bg-red-500/20 text-red-400' : 'bg-neutral-800 text-neutral-200'
              }`}
            >
              {config.master.isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Stereo Master Meter */}
          <div className="space-y-1">
            <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-red-500 transition-all duration-100"
                style={{ width: `${Math.min(100, meterLevels.master)}%` }}
              ></div>
            </div>
            <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-red-500 transition-all duration-100"
                style={{ width: `${Math.min(100, meterLevels.master * 0.95)}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-neutral-400">
              <span>Tổng Gain:</span>
              <span className="font-mono text-rose-400 font-bold">{config.master.volume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="150"
              value={config.master.volume}
              onChange={(e) => updateCh('master', 'volume', Number(e.target.value))}
              className="w-full accent-rose-500 h-1 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>

          <div className="text-[9px] text-center text-neutral-500 pt-1 font-mono">
            Stereo 48kHz / 24-bit
          </div>
        </div>
      </div>
    </div>
  );
};


