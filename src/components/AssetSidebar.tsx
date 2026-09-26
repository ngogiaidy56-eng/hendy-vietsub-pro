import React, { useState, useRef } from 'react';
import {
  Film,
  Music,
  Mic,
  Subtitles,
  Upload,
  Play,
  Plus,
  Sparkles,
  Volume2,
  Check,
  StopCircle,
  Radio,
  Clock,
  Wand2,
} from 'lucide-react';
import { SAMPLE_VIDEOS, SOUND_FX_LIBRARY } from '../utils/sampleData';
import { audioEngine } from '../utils/audioEngine';
import { VideoClip, AudioClip, SubtitleSegment, SoundFxItem } from '../types/editor';
import { readMediaFullDuration } from '../utils/mediaUtils';

interface AssetSidebarProps {
  onAddVideoClip: (clip: VideoClip) => void;
  onAddAudioClip: (clip: AudioClip) => void;
  onSetSubtitles: (subtitles: SubtitleSegment[]) => void;
  currentTime: number;
}

export const AssetSidebar: React.FC<AssetSidebarProps> = ({
  onAddVideoClip,
  onAddAudioClip,
  onSetSubtitles,
  currentTime,
}) => {
  const [activeTab, setActiveTab] = useState<'media' | 'sfx' | 'voiceover' | 'tts' | 'subtitles'>('media');

  // Voiceover Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const timerRef = useRef<any>(null);

  // AI Vietnamese TTS state
  const [ttsText, setTtsText] = useState(
    'Chào mừng bạn đến với CapCut Pro! Hôm nay chúng ta sẽ cùng khám phá kỹ thuật dựng phim và phụ đề điện ảnh.'
  );
  const [voiceGender, setVoiceGender] = useState<'female' | 'male'>('female');
  const [voicePreset, setVoicePreset] = useState<'kore' | 'puck' | 'zephyr' | 'charon'>('kore');
  const [isGeneratingTts, setIsGeneratingTts] = useState(false);

  // AI Subtitle Generator state
  const [subtitlePrompt, setSubtitlePrompt] = useState(
    'Cảnh đối thoại phim hành động khoa học viễn tưởng với nhịp độ dồn dập và kịch tính.'
  );
  const [isGeneratingSubs, setIsGeneratingSubs] = useState(false);

  // File upload input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Start Mic Voiceover Recording
  const handleStartRecording = async () => {
    try {
      await audioEngine.startVoiceoverRecording();
      setIsRecording(true);
      setRecordDuration(0);
      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      alert('Không thể mở micro: ' + (err?.message || 'Vui lòng cấp quyền micro trong trình duyệt'));
    }
  };

  // Stop Mic Voiceover Recording & insert to timeline
  const handleStopRecording = async () => {
    clearInterval(timerRef.current);
    setIsRecording(false);
    const { url, duration } = await audioEngine.stopVoiceoverRecording();

    if (url && duration > 0.2) {
      const newAudioClip: AudioClip = {
        id: `voiceover_${Date.now()}`,
        name: `Thu âm trực tiếp (${Math.round(duration)}s)`,
        type: 'voiceover',
        src: url,
        startTime: currentTime,
        duration: Math.max(1, Number(duration.toFixed(2))),
        volume: 120,
        isMuted: false,
        color: '#10b981',
        waveform: [40, 70, 95, 80, 60, 85, 50, 30],
      };
      onAddAudioClip(newAudioClip);
      audioEngine.playSfx('ding');
    }
  };

  // Insert Sound FX at playhead
  const handleInsertSfx = async (item: SoundFxItem) => {
    const { url, duration } = await audioEngine.renderSfxBufferUrl(item.sfxKey);
    const newAudioClip: AudioClip = {
      id: `sfx_${Date.now()}_${item.id}`,
      name: item.name,
      type: 'sfx',
      src: url,
      startTime: currentTime,
      duration: duration,
      volume: 100,
      isMuted: false,
      color: '#38bdf8',
      waveform: [30, 60, 90, 70, 40, 20],
    };
    onAddAudioClip(newAudioClip);
    audioEngine.playSfx(item.sfxKey);
  };

  // Generate Vietnamese Voiceover TTS
  const handleGenerateTts = async () => {
    if (!ttsText.trim()) return;
    setIsGeneratingTts(true);

    try {
      const res = await fetch('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: ttsText,
          voiceGender,
          style: 'cinematic',
        }),
      });

      const data = await res.json();
      let audioUrl = '';
      let dur = Math.max(3, Math.ceil(ttsText.length / 15));

      if (data.audioBase64) {
        audioUrl = `data:${data.mimeType || 'audio/mp3'};base64,${data.audioBase64}`;
      } else {
        // Audio generation via Web Speech fallback
        await audioEngine.speakVietnameseSpeech(ttsText, voiceGender);
      }

      const voiceClip: AudioClip = {
        id: `tts_voice_${Date.now()}`,
        name: `Lồng tiếng AI (${voiceGender === 'female' ? 'Nữ - Lan' : 'Nam - Minh'})`,
        type: 'voiceover',
        src: audioUrl || 'tts_speech',
        startTime: currentTime,
        duration: dur,
        volume: 110,
        isMuted: false,
        color: '#a855f7',
        waveform: [50, 75, 90, 65, 80, 95, 70, 40],
      };
      onAddAudioClip(voiceClip);
      audioEngine.playSfx('ding');
    } catch (err: any) {
      console.warn('TTS error, using speech synthesis fallback:', err);
      audioEngine.speakVietnameseSpeech(ttsText, voiceGender);
    } finally {
      setIsGeneratingTts(false);
    }
  };

  // Generate AI Subtitles from prompt / context
  const handleGenerateSubtitles = async () => {
    setIsGeneratingSubs(true);
    try {
      const res = await fetch('/api/gemini/subtitles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: subtitlePrompt,
          videoTitle: 'CapCut Cinema Project',
          clipDuration: 30,
        }),
      });
      const data = await res.json();
      if (data.success && data.subtitles) {
        onSetSubtitles(data.subtitles);
        audioEngine.playSfx('ding');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingSubs(false);
    }
  };

  // Upload custom file (Video / Audio / Image) with FULL DURATION support
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    try {
      const mediaInfo = await readMediaFullDuration(file);

      if (mediaInfo.type === 'video' || mediaInfo.type === 'image') {
        const newClip: VideoClip = {
          id: `uploaded_${Date.now()}`,
          type: mediaInfo.type,
          name: file.name,
          src: mediaInfo.url,
          thumbnail: mediaInfo.thumbnail,
          startTime: currentTime,
          duration: mediaInfo.duration, // Full actual duration of the video!
          sourceStart: 0,
          sourceDuration: mediaInfo.duration, // Full actual duration!
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
        audioEngine.playSfx('ding');
      } else if (mediaInfo.type === 'audio') {
        const newAudio: AudioClip = {
          id: `uploaded_audio_${Date.now()}`,
          name: file.name,
          type: 'music',
          src: mediaInfo.url,
          startTime: currentTime,
          duration: mediaInfo.duration, // Full actual duration of audio!
          volume: 90,
          isMuted: false,
          color: '#06b6d4',
          waveform: [40, 60, 85, 95, 75, 50, 30, 70, 90, 65, 45, 80, 55],
        };
        onAddAudioClip(newAudio);
        audioEngine.playSfx('ding');
      }
    } catch (err) {
      console.error('Failed to load media with full duration:', err);
    }
  };

  return (
    <aside className="w-72 bg-[#0f172a] border border-slate-800/80 rounded-xl flex flex-col shrink-0 select-none overflow-hidden text-slate-200 shadow-lg shadow-black/20">
      {/* Top Sidebar Navigation Tabs */}
      <div className="flex border-b border-slate-800 bg-[#0b1120] p-1 gap-1">
        <button
          onClick={() => setActiveTab('media')}
          title="Media & Uploads"
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
            activeTab === 'media'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Film className="w-3.5 h-3.5 text-indigo-400" />
          <span>Media</span>
        </button>

        <button
          onClick={() => setActiveTab('sfx')}
          title="Sound Effects Library"
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
            activeTab === 'sfx'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Music className="w-3.5 h-3.5 text-pink-400" />
          <span>SFX</span>
        </button>

        <button
          onClick={() => setActiveTab('voiceover')}
          title="Record Microphone"
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
            activeTab === 'voiceover'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Mic className="w-3.5 h-3.5 text-emerald-400" />
          <span>Record</span>
        </button>

        <button
          onClick={() => setActiveTab('tts')}
          title="AI Voiceover Synthesis"
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
            activeTab === 'tts'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wand2 className="w-3.5 h-3.5 text-purple-400" />
          <span>TTS</span>
        </button>

        <button
          onClick={() => setActiveTab('subtitles')}
          title="Subtitle Generator"
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
            activeTab === 'subtitles'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Subtitles className="w-3.5 h-3.5 text-amber-400" />
          <span>Subs</span>
        </button>
      </div>

      {/* Main Tab Body */}
      <div className="flex-1 overflow-y-auto p-3 text-xs text-slate-300 space-y-4 bg-[#0b1120]/40">
        {/* TAB 1: MEDIA & UPLOAD */}
        {activeTab === 'media' && (
          <div className="space-y-3">
            {/* Upload Button */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-slate-750 hover:border-indigo-500 rounded-xl p-3.5 text-center cursor-pointer bg-slate-900/60 hover:bg-slate-850/80 transition-all group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,audio/*,image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="w-5 h-5 mx-auto text-neutral-400 group-hover:text-cyan-400 mb-1.5 transition-colors" />
              <div className="font-semibold text-xs text-neutral-200">Tải file từ máy tính</div>
              <div className="text-[10px] text-neutral-500">MP4, WebM, MP3, PNG, JPG</div>
            </div>

            {/* Sample Videos List */}
            <div>
              <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                Video mẫu bản quyền mở
              </div>
              <div className="space-y-2">
                {SAMPLE_VIDEOS.map((vid) => (
                  <div
                    key={vid.id}
                    className="p-2 rounded-xl bg-neutral-850 border border-neutral-750 hover:border-neutral-600 transition-all flex items-center gap-2.5 group"
                  >
                    <img
                      src={vid.thumbnail}
                      alt={vid.title}
                      className="w-14 h-10 object-cover rounded-lg bg-neutral-800 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-xs text-neutral-200 truncate group-hover:text-cyan-400">
                        {vid.title}
                      </div>
                      <div className="text-[10px] text-neutral-500 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{vid.duration}s</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const newClip: VideoClip = {
                          id: `clip_${Date.now()}_${vid.id}`,
                          type: 'video',
                          name: vid.title,
                          src: vid.url,
                          thumbnail: vid.thumbnail,
                          startTime: currentTime,
                          duration: vid.duration,
                          sourceStart: 0,
                          sourceDuration: vid.duration,
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
                          transition: { type: 'fade', duration: 0.5 },
                        };
                        onAddVideoClip(newClip);
                        audioEngine.playSfx('ding');
                      }}
                      className="p-1.5 rounded-lg bg-neutral-800 hover:bg-cyan-500 hover:text-black text-neutral-300 transition-all"
                      title="Chèn vào timeline"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SOUND FX */}
        {activeTab === 'sfx' && (
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
              Thư viện âm thanh CapCut (Sound FX)
            </div>
            <p className="text-[11px] text-neutral-500">
              Nhấp nút Play để nghe thử hoặc nút (+) để chèn trực tiếp tại vị trí con trỏ (playhead).
            </p>

            <div className="space-y-2 pt-1">
              {SOUND_FX_LIBRARY.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl bg-neutral-850 border border-neutral-750 hover:border-neutral-600 flex items-center justify-between gap-2 transition-all"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-neutral-200">{item.name}</div>
                    <div className="text-[10px] text-neutral-500">{item.description}</div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => audioEngine.playSfx(item.sfxKey)}
                      className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-cyan-400 transition-all"
                      title="Nghe thử âm thanh"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                    <button
                      onClick={() => handleInsertSfx(item)}
                      className="p-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold transition-all"
                      title="Chèn vào timeline tại con trỏ"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: VOICEOVER DIRECT RECORDING */}
        {activeTab === 'voiceover' && (
          <div className="space-y-4">
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Thu âm lồng tiếng trực tiếp (Microphone)
            </div>

            <div className="p-4 rounded-2xl bg-neutral-850 border border-neutral-750 text-center space-y-3">
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-emerald-500/10 border border-emerald-500/30">
                <Mic
                  className={`w-7 h-7 ${
                    isRecording ? 'text-red-500 animate-pulse' : 'text-emerald-400'
                  }`}
                />
              </div>

              {isRecording ? (
                <div>
                  <div className="flex items-center justify-center gap-1.5 text-red-400 font-bold text-sm">
                    <Radio className="w-4 h-4 animate-ping" />
                    <span>Đang thu âm: {recordDuration}s</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Nói rõ vào micro, nhấp Dừng để chèn vào timeline
                  </p>
                </div>
              ) : (
                <div>
                  <div className="font-bold text-neutral-200">Sẵn sàng thu âm</div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Âm thanh sẽ được thêm tự động tại mốc: {currentTime.toFixed(1)}s
                  </p>
                </div>
              )}

              {isRecording ? (
                <button
                  onClick={handleStopRecording}
                  className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <StopCircle className="w-4 h-4" />
                  <span>Dừng & Chèn vào Timeline</span>
                </button>
              ) : (
                <button
                  onClick={handleStartRecording}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <Mic className="w-4 h-4" />
                  <span>Bắt đầu thu âm</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: AI VIETNAMESE TTS VOICEOVER */}
        {activeTab === 'tts' && (
          <div className="space-y-4">
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Lồng tiếng AI Tiếng Việt (Text-to-Speech)
            </div>

            {/* Input Script */}
            <div>
              <label className="text-[11px] text-neutral-400 mb-1 block">
                Nội dung thuyết minh (Tiếng Việt):
              </label>
              <textarea
                rows={4}
                value={ttsText}
                onChange={(e) => setTtsText(e.target.value)}
                placeholder="Nhập đoạn văn bản cần thuyết minh tiếng Việt..."
                className="w-full rounded-xl bg-neutral-850 border border-neutral-750 p-2.5 text-xs text-neutral-200 focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>

            {/* Voice Gender & Presets */}
            <div>
              <label className="text-[11px] text-neutral-400 mb-1.5 block">
                Chọn giọng đọc:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setVoiceGender('female')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    voiceGender === 'female'
                      ? 'bg-purple-500/20 border-purple-500 text-white'
                      : 'bg-neutral-850 border-neutral-750 text-neutral-400 hover:bg-neutral-800'
                  }`}
                >
                  <div className="font-bold text-xs text-purple-300">Giọng Nữ (Lan)</div>
                  <div className="text-[10px] text-neutral-500">Truyền cảm, ấm áp</div>
                </button>

                <button
                  onClick={() => setVoiceGender('male')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    voiceGender === 'male'
                      ? 'bg-cyan-500/20 border-cyan-500 text-white'
                      : 'bg-neutral-850 border-neutral-750 text-neutral-400 hover:bg-neutral-800'
                  }`}
                >
                  <div className="font-bold text-xs text-cyan-300">Giọng Nam (Minh)</div>
                  <div className="text-[10px] text-neutral-500">Trầm ấm, điện ảnh</div>
                </button>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateTts}
              disabled={isGeneratingTts || !ttsText.trim()}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-purple-600/30 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {isGeneratingTts ? 'Đang tạo giọng đọc AI...' : 'Tạo & Chèn lồng tiếng vào Timeline'}
              </span>
            </button>
          </div>
        )}

        {/* TAB 5: AI SUBTITLE GENERATION */}
        {activeTab === 'subtitles' && (
          <div className="space-y-4">
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Tạo phụ đề tự động bằng Gemini AI
            </div>

            <div>
              <label className="text-[11px] text-neutral-400 mb-1 block">
                Mô tả kịch bản hoặc lời thoại cần dịch:
              </label>
              <textarea
                rows={4}
                value={subtitlePrompt}
                onChange={(e) => setSubtitlePrompt(e.target.value)}
                className="w-full rounded-xl bg-neutral-850 border border-neutral-750 p-2.5 text-xs text-neutral-200 focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>

            <button
              onClick={handleGenerateSubtitles}
              disabled={isGeneratingSubs}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-50 text-black font-bold text-xs shadow-lg shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {isGeneratingSubs ? 'Gemini đang tạo phụ đề...' : 'Tạo phụ đề điện ảnh tự động'}
              </span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};


