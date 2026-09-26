import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mic,
  MicOff,
  Sparkles,
  FileAudio,
  Upload,
  Check,
  Loader2,
  Volume2,
  Clock,
  Users,
  Languages,
  ArrowRight,
  Play,
  RotateCcw,
} from 'lucide-react';
import { SubtitleSegment } from '../types/editor';
import { audioEngine } from '../utils/audioEngine';

interface AutoTranscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySubtitles: (subs: SubtitleSegment[]) => void;
  currentDuration?: number;
}

export const AutoTranscriptionModal: React.FC<AutoTranscriptionModalProps> = ({
  isOpen,
  onClose,
  onApplySubtitles,
  currentDuration = 30,
}) => {
  const [inputMode, setInputMode] = useState<'timeline-audio' | 'mic-recording' | 'upload-file' | 'text-prompt'>('timeline-audio');
  const [sourceLang, setSourceLang] = useState<string>('auto');
  const [inputPrompt, setInputPrompt] = useState<string>(
    'Trích xuất toàn bộ lời thoại diễn viên và tạo phụ đề tiếng Việt chuẩn xác từng câu kèm nhãn người nói.'
  );

  // Microphone recording state
  const [isRecording, setIsRecording] = useState(false);
  const [micTranscript, setMicTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  // Transcription state
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultSubs, setResultSubs] = useState<SubtitleSegment[] | null>(null);
  const [detectedLang, setDetectedLang] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [autoVoiceover, setAutoVoiceover] = useState(true);

  // Initialize SpeechRecognition if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'vi-VN';

        recognition.onresult = (event: any) => {
          let current = '';
          for (let i = 0; i < event.results.length; i++) {
            current += event.results[i][0].transcript + ' ';
          }
          setMicTranscript(current);
        };

        recognition.onerror = (e: any) => {
          console.warn('Speech recognition error:', e);
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  if (!isOpen) return null;

  const handleToggleMic = () => {
    if (!recognitionRef.current) {
      alert('Trình duyệt của bạn chưa hỗ trợ Web Speech API cho Micro. Bạn có thể sử dụng chế độ Nhập văn bản hoặc Âm thanh Video.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      audioEngine.playSfx('ding');
    } else {
      setMicTranscript('');
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        audioEngine.playSfx('whoosh');
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleStartTranscribe = async () => {
    setIsProcessing(true);
    audioEngine.playSfx('whoosh');

    try {
      const res = await fetch('/api/gemini/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputPrompt: inputMode === 'mic-recording' ? micTranscript : inputPrompt,
          videoTitle: 'Auto Transcribed Project',
          rawAudioTranscript: micTranscript,
          sourceLang,
        }),
      });

      const data = await res.json();
      if (data.success && data.subtitles) {
        setResultSubs(data.subtitles);
        setDetectedLang(data.detectedLanguage || 'Tiếng Anh (Nhận diện tự động)');
        setSummary(data.summary || 'Đã tạo phụ đề Vietsub đồng bộ');
        audioEngine.playSfx('ding');
      }
    } catch (err) {
      console.error('Transcription error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = () => {
    if (!resultSubs || resultSubs.length === 0) return;
    onApplySubtitles(resultSubs);
    if (autoVoiceover && resultSubs[0]?.textVi) {
      audioEngine.speakVietnameseSpeech(resultSubs[0].textVi);
    }
    audioEngine.playSfx('ding');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-750 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 px-6 border-b border-neutral-800 bg-neutral-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/20 text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black text-base text-white flex items-center gap-2">
                Công Cụ Chuyển Âm Thanh Thành Phụ Đề Tự Động (Auto-Transcription)
              </div>
              <p className="text-xs text-neutral-400">
                Nhận diện giọng nói, tách thoại từng giây và tạo Vietsub kèm lồng tiếng AI
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Method Switcher */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-neutral-800 bg-neutral-950/40 text-xs">
          <button
            onClick={() => setInputMode('timeline-audio')}
            className={`px-3 py-2 font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              inputMode === 'timeline-audio'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileAudio className="w-3.5 h-3.5 text-amber-400" />
            <span>Âm thanh Timeline</span>
          </button>

          <button
            onClick={() => setInputMode('mic-recording')}
            className={`px-3 py-2 font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              inputMode === 'mic-recording'
                ? 'border-rose-400 text-rose-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-rose-400" />
            <span>Thu âm Trực tiếp (Micro)</span>
          </button>

          <button
            onClick={() => setInputMode('upload-file')}
            className={`px-3 py-2 font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              inputMode === 'upload-file'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Tải Tệp Audio / Video</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs text-neutral-300">
          {/* Options Row */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
            <div>
              <label className="text-[11px] font-bold text-neutral-400 block mb-1.5">
                Ngôn ngữ gốc trong video:
              </label>
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-750 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="auto">🌐 Tự động nhận diện ngôn ngữ</option>
                <option value="en">🇺🇸 Tiếng Anh (English)</option>
                <option value="zh">🇨🇳 Tiếng Trung (Chinese)</option>
                <option value="ko">🇰🇷 Tiếng Hàn (Korean)</option>
                <option value="ja">🇯🇵 Tiếng Nhật (Japanese)</option>
                <option value="vi">🇻🇳 Tiếng Việt (Vietnamese)</option>
                <option value="fr">🇫🇷 Tiếng Pháp (French)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-neutral-400 block mb-1.5">
                Đích dịch thuật:
              </label>
              <div className="flex items-center h-8 px-3 rounded-lg bg-neutral-900 border border-neutral-750 text-white font-semibold text-xs">
                🇻🇳 Tiếng Việt (Chuẩn Vietsub Điện Ảnh)
              </div>
            </div>
          </div>

          {/* Mode 1: Timeline Audio */}
          {inputMode === 'timeline-audio' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30">
                <div className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Trích xuất âm thanh từ project đang dựng (~{currentDuration.toFixed(0)} giây)</span>
                </div>
                <p className="text-[11px] text-neutral-300 mt-1">
                  AI sẽ tự động lắng nghe toàn bộ đoạn âm thanh của các clip đang nằm trên timeline, phân biệt giọng nói và tạo phụ đề tương ứng từng khung hình.
                </p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-400 block mb-1">
                  Ghi chú hoặc ngữ cảnh nội dung (Tùy chọn):
                </label>
                <input
                  type="text"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  placeholder="Ví dụ: Đoạn đối thoại hành động trong phim viễn tưởng, dịch kịch tính..."
                  className="w-full bg-neutral-950 border border-neutral-750 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

          {/* Mode 2: Live Mic Recording */}
          {inputMode === 'mic-recording' && (
            <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-800 text-center space-y-3">
                <div className="flex justify-center">
                  <button
                    onClick={handleToggleMic}
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl active:scale-95 ${
                      isRecording
                        ? 'bg-rose-600 text-white shadow-rose-600/40 animate-pulse'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white'
                    }`}
                  >
                    {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                  </button>
                </div>

                <div className="font-extrabold text-sm text-white">
                  {isRecording ? 'Đang lắng nghe... Hãy nói vào micro' : 'Nhấp để bắt đầu thu âm từ Micro'}
                </div>
                <p className="text-[11px] text-neutral-400 max-w-sm mx-auto">
                  Nói một đoạn bất kỳ bằng tiếng Việt hoặc tiếng nước ngoài; hệ thống sẽ nhận diện và chia đoạn phụ đề tự động.
                </p>

                {micTranscript && (
                  <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-750 text-left font-sans text-xs text-neutral-200">
                    <span className="text-[10px] text-neutral-400 font-bold block mb-1">
                      Lời thoại vừa thu âm:
                    </span>
                    {micTranscript}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mode 3: File Upload */}
          {inputMode === 'upload-file' && (
            <div className="p-8 rounded-2xl bg-neutral-950 border border-dashed border-neutral-750 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 mx-auto flex items-center justify-center text-cyan-400">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <div className="font-extrabold text-sm text-white">
                  Chọn hoặc kéo thả tệp âm thanh / video
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Hỗ trợ MP3, WAV, M4A, AAC, MP4, MKV, WebM (Tối đa 250MB)
                </p>
              </div>

              <input
                type="file"
                accept="audio/*,video/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setInputPrompt(`Tệp âm thanh tải lên: ${e.target.files[0].name}`);
                    audioEngine.playSfx('ding');
                  }
                }}
                className="text-xs text-neutral-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-neutral-800 file:text-neutral-200 hover:file:bg-neutral-700 cursor-pointer"
              />
            </div>
          )}

          {/* Results Preview if available */}
          {resultSubs && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-white">
                    Kết quả Phiên âm ({resultSubs.length} đoạn phụ đề)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                    {detectedLang}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-purple-300 font-semibold">
                    <input
                      type="checkbox"
                      checked={autoVoiceover}
                      onChange={(e) => setAutoVoiceover(e.target.checked)}
                      className="rounded bg-neutral-800 text-purple-600 focus:ring-0"
                    />
                    <span>Kích hoạt Lồng tiếng AI (Không cần đọc phụ đề)</span>
                  </label>
                </div>
              </div>

              {/* Subtitles list preview */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {resultSubs.map((sub, idx) => (
                  <div
                    key={sub.id || idx}
                    className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-amber-400 font-mono">
                          {sub.start.toFixed(1)}s - {sub.end.toFixed(1)}s
                        </span>
                        <span className="text-[10px] text-neutral-400 font-semibold">
                          [{sub.speaker || 'Thoại'}]
                        </span>
                      </div>
                      <div className="font-bold text-white text-xs">{sub.textVi}</div>
                      {sub.textOriginal && (
                        <div className="text-[11px] text-neutral-400 italic">
                          {sub.textOriginal}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => audioEngine.speakVietnameseSpeech(sub.textVi)}
                      className="p-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-purple-300"
                      title="Nghe thử giọng đọc AI"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between">
          <div className="text-[11px] text-neutral-400">
            {isProcessing ? 'Đang phân tích âm thanh bằng Gemini AI...' : 'Tự động đồng bộ chuẩn từng khung hình'}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs transition-colors"
            >
              Hủy
            </button>

            {!resultSubs ? (
              <button
                onClick={handleStartTranscribe}
                disabled={isProcessing || (inputMode === 'mic-recording' && !micTranscript && !isRecording)}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-extrabold text-xs shadow-lg shadow-amber-500/25 active:scale-95 transition-all disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang Phiên Âm AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 fill-current" />
                    <span>Bắt Đầu Phiên Âm & Tạo Vietsub</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleApply}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Áp Dụng Vào Timeline & Lồng Tiếng</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


