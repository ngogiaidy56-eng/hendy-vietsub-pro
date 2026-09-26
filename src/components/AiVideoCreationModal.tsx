import React, { useState } from 'react';
import {
  Wand2,
  Sparkles,
  X,
  Film,
  Subtitles,
  Volume2,
  Music,
  Check,
  ChevronRight,
  Monitor,
  Smartphone,
  Square,
  Maximize2,
  Loader2,
  Palette,
  Play,
} from 'lucide-react';
import {
  AspectRatio,
  VideoClip,
  AudioClip,
  SubtitleSegment,
} from '../types/editor';
import { audioEngine } from '../utils/audioEngine';

interface AiVideoCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (ar: AspectRatio) => void;
  onApplyProject: (
    clips: VideoClip[],
    subtitles: SubtitleSegment[],
    audioClips: AudioClip[]
  ) => void;
}

export const AiVideoCreationModal: React.FC<AiVideoCreationModalProps> = ({
  isOpen,
  onClose,
  aspectRatio,
  setAspectRatio,
  onApplyProject,
}) => {
  const [topic, setTopic] = useState<string>('Khám phá thế giới công nghệ tương lai và trí tuệ nhân tạo');
  const [style, setStyle] = useState<'cinematic' | 'cyberpunk' | 'vlog_travel' | 'vintage'>('cinematic');
  const [voiceGender, setVoiceGender] = useState<'female' | 'male'>('female');
  const [includeVoiceover, setIncludeVoiceover] = useState<boolean>(true);
  const [includeBgm, setIncludeBgm] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>('');

  if (!isOpen) return null;

  const quickPrompts = [
    {
      title: 'Review Phim Viễn Tưởng',
      prompt: 'Review trailer phim khoa học viễn tưởng với những cỗ máy robot và trận chiến bảo vệ nhân loại',
      style: 'cinematic' as const,
    },
    {
      title: 'Quán Cafe Vintage Chill',
      prompt: 'Video giới thiệu quán cà phê phong cách cổ điển thập niên 90 với tiếng nhạc acoustic và hương vị ấm áp',
      style: 'vintage' as const,
    },
    {
      title: 'Hành Trình Du Lịch Đà Lạt',
      prompt: 'Khám phá thành phố sương mù Đà Lạt, săn mây đồi chè và tận hưởng không khí bình yên',
      style: 'vlog_travel' as const,
    },
    {
      title: 'Thành Phố Neon Cyberpunk',
      prompt: 'Thước phim đêm Tokyo rực rỡ ánh đèn neon 2077 và nhịp sống số hóa tốc độ cao',
      style: 'cyberpunk' as const,
    },
  ];

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    setIsGenerating(true);
    setGenerationStep('Khởi tạo đạo diễn AI & phân tích kịch bản...');

    try {
      setGenerationStep('Đang tạo kịch bản phân cảnh và phụ đề Vietsub chuẩn thời gian...');
      const res = await fetch('/api/gemini/create-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          style,
          aspectRatio,
          durationTarget: 25,
        }),
      });

      const data = await res.json();
      if (!data.success || !data.project) {
        throw new Error('Không thể tạo video dự án');
      }

      const project = data.project;
      setGenerationStep('Đang ráp nối thước phim, hiệu ứng chuyển cảnh và âm thanh...');

      let currentTimeCursor = 0;
      const newVideoClips: VideoClip[] = [];
      const newSubtitles: SubtitleSegment[] = [];
      const newAudioClips: AudioClip[] = [];

      for (let i = 0; i < project.scenes.length; i++) {
        const scene = project.scenes[i];
        const sceneDuration = Math.max(4.5, scene.duration || 6.0);

        // 1. Create Video/Image Clip
        const clip: VideoClip = {
          id: `ai_clip_${Date.now()}_${i}`,
          type: scene.type || 'video',
          name: scene.name || `Cảnh ${i + 1}`,
          src: scene.src,
          thumbnail: scene.thumbnail,
          startTime: Number(currentTimeCursor.toFixed(2)),
          duration: sceneDuration,
          sourceStart: 0,
          sourceDuration: 30,
          volume: 80,
          isMuted: false,
          transform: { rotation: 0, flipH: false, flipV: false, scale: 1, x: 0, y: 0 },
          filter: {
            preset: scene.filterPreset || 'cinematic-teal-orange',
            brightness: 105,
            contrast: 110,
            saturation: 115,
            temperature: scene.filterPreset === 'sunset-glow' ? 15 : -10,
            vignette: 20,
          },
          transition: {
            type: scene.transitionType || 'fade',
            duration: 0.6,
          },
        };
        newVideoClips.push(clip);

        // 2. Create Vietsub Subtitle segment
        const sub: SubtitleSegment = {
          id: `ai_sub_${Date.now()}_${i}`,
          start: Number((currentTimeCursor + 0.4).toFixed(2)),
          end: Number((currentTimeCursor + sceneDuration - 0.3).toFixed(2)),
          textOriginal: scene.textOriginal || scene.name,
          textVi: scene.textVi || scene.narration,
          speaker: 'Thuyết minh',
        };
        newSubtitles.push(sub);

        // 3. Create Sound FX for scene transition impact
        if (scene.soundFxKey) {
          const sfxBuffer = await audioEngine.renderSfxBufferUrl(scene.soundFxKey);
          newAudioClips.push({
            id: `ai_sfx_${Date.now()}_${i}`,
            name: `SFX ${scene.soundFxKey.toUpperCase()}`,
            type: 'sfx',
            src: sfxBuffer.url,
            startTime: Number(currentTimeCursor.toFixed(2)),
            duration: sfxBuffer.duration,
            volume: 90,
            isMuted: false,
            color: '#38bdf8',
            waveform: [35, 75, 95, 60, 30],
          });
        }

        currentTimeCursor += sceneDuration;
      }

      // 4. Create Background Music (BGM) track
      if (includeBgm) {
        setGenerationStep('Đang hòa âm BGM và cân bằng âm thanh...');
        const totalLength = currentTimeCursor;
        newAudioClips.push({
          id: `ai_bgm_${Date.now()}`,
          name: `Nhạc nền (${project.backgroundMusicGenre || 'Cinematic Ambient'})`,
          type: 'music',
          src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
          startTime: 0,
          duration: Number(totalLength.toFixed(2)),
          volume: includeVoiceover ? 25 : 65, // Ducked if voiceover included
          isMuted: false,
          color: '#818cf8',
          waveform: [50, 65, 80, 75, 60, 70, 85, 90, 70, 55],
        });
      }

      // 5. Apply complete project to timeline and preview
      setGenerationStep('Hoàn tất! Đang chuyển vào khung dựng phim...');
      audioEngine.playSfx('ding');
      onApplyProject(newVideoClips, newSubtitles, newAudioClips);
      onClose();
    } catch (err: any) {
      console.error(err);
      alert('Đã xảy ra sự cố khi tạo video: ' + (err?.message || 'Vui lòng thử lại'));
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-purple-950/40 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-900/60 via-neutral-900 to-neutral-900 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Tạo Video Tự Động với Vietsub AI
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  AI PRODUCER
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Tự động lên kịch bản, ghép thước phim, đồng bộ phụ đề tiếng Việt & âm thanh
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Topic Prompt Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
              <span>Chủ đề / Ý tưởng video của bạn:</span>
              <span className="text-[11px] text-purple-400 font-normal">Gemini AI Studio Engine</span>
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isGenerating}
              placeholder="Nhập ý tưởng video (VD: Review phim khoa học viễn tưởng, giới thiệu quán cafe, nhật ký du lịch...)"
              className="w-full h-20 bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-neutral-200 text-xs focus:outline-none focus:border-purple-500 resize-none disabled:opacity-50"
            />
          </div>

          {/* Quick Idea Suggestions */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-neutral-400">Ý tưởng mẫu 1-chạm:</span>
            <div className="grid grid-cols-2 gap-2">
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={isGenerating}
                  onClick={() => {
                    setTopic(p.prompt);
                    setStyle(p.style);
                  }}
                  className="text-left p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80 hover:border-purple-500/60 hover:bg-purple-950/20 transition-all text-neutral-300 disabled:opacity-50"
                >
                  <div className="font-semibold text-purple-300 text-[11px]">{p.title}</div>
                  <div className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">{p.prompt}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Settings Grid: Aspect Ratio & Cinematic Style */}
          <div className="grid grid-cols-2 gap-4">
            {/* Aspect Ratio */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-300">Tỉ lệ khung hình:</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: '16:9' as AspectRatio, label: '16:9', desc: 'YouTube / Ngang', icon: <Monitor className="w-3.5 h-3.5" /> },
                  { id: '9:16' as AspectRatio, label: '9:16', desc: 'TikTok / Shorts', icon: <Smartphone className="w-3.5 h-3.5" /> },
                  { id: '1:1' as AspectRatio, label: '1:1', desc: 'Instagram Vuông', icon: <Square className="w-3.5 h-3.5" /> },
                  { id: '21:9' as AspectRatio, label: '21:9', desc: 'Điện ảnh Cinema', icon: <Maximize2 className="w-3.5 h-3.5" /> },
                ].map((ar) => (
                  <button
                    key={ar.id}
                    type="button"
                    disabled={isGenerating}
                    onClick={() => setAspectRatio(ar.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                      aspectRatio === ar.id
                        ? 'bg-purple-600/20 border-purple-500 text-purple-300 font-bold'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {ar.icon}
                    <div>
                      <div className="text-xs">{ar.label}</div>
                      <div className="text-[9px] text-neutral-500 font-normal">{ar.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Style */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-300">Phong cách hình ảnh & màu sắc:</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'cinematic' as const, label: 'Điện ảnh Teal & Orange' },
                  { id: 'cyberpunk' as const, label: 'Cyberpunk Neon' },
                  { id: 'vintage' as const, label: 'Vintage Cổ điển 90s' },
                  { id: 'vlog_travel' as const, label: 'Hoàng hôn Rực rỡ' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    disabled={isGenerating}
                    onClick={() => setStyle(s.id)}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      style === s.id
                        ? 'bg-purple-600/20 border-purple-500 text-purple-300 font-bold'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs">{s.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sound & Subtitle Options */}
          <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-2.5">
            <span className="font-semibold text-neutral-300 block">Tùy chọn tự động hóa:</span>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeVoiceover}
                  onChange={(e) => setIncludeVoiceover(e.target.checked)}
                  disabled={isGenerating}
                  className="rounded border-neutral-700 text-purple-600 focus:ring-0"
                />
                <span className="text-neutral-300 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                  Tạo giọng đọc thuyết minh tiếng Việt AI ({voiceGender === 'female' ? 'Nữ truyền cảm' : 'Nam trầm ấm'})
                </span>
              </label>

              <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded-lg border border-neutral-800 text-[10px]">
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => setVoiceGender('female')}
                  className={`px-2 py-0.5 rounded ${voiceGender === 'female' ? 'bg-purple-600 text-white font-bold' : 'text-neutral-400'}`}
                >
                  Giọng Nữ
                </button>
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => setVoiceGender('male')}
                  className={`px-2 py-0.5 rounded ${voiceGender === 'male' ? 'bg-purple-600 text-white font-bold' : 'text-neutral-400'}`}
                >
                  Giọng Nam
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-neutral-800/50">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeBgm}
                  onChange={(e) => setIncludeBgm(e.target.checked)}
                  disabled={isGenerating}
                  className="rounded border-neutral-700 text-purple-600 focus:ring-0"
                />
                <span className="text-neutral-300 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-indigo-400" />
                  Hòa âm nhạc nền (BGM) & Sound FX chuyển cảnh CapCut
                </span>
              </label>

              <span className="text-[10px] text-green-400 font-mono">Auto-Ducking Bật</span>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-neutral-800/50 text-neutral-400">
              <Subtitles className="w-3.5 h-3.5 text-yellow-400" />
              <span>Phụ đề Vietsub Karaoke điện ảnh sẽ được đồng bộ chính xác từng mili-giây</span>
            </div>
          </div>

          {/* Loading Indicator */}
          {isGenerating && (
            <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/40 text-center space-y-2 animate-in fade-in">
              <div className="flex items-center justify-center gap-2 text-purple-300 font-semibold text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                <span>{generationStep}</span>
              </div>
              <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400 h-full w-2/3 animate-pulse" />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all font-medium disabled:opacity-30"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !topic.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white shadow-lg shadow-purple-600/30 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xử lý AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Tạo Video & Vietsub AI Ngay</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};


