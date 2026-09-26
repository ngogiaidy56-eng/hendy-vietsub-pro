import React, { useState } from 'react';
import {
  X,
  Settings,
  Cloud,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Sparkles,
  Zap,
} from 'lucide-react';
import { CloudflareConfig } from '../types/editor';
import { audioEngine } from '../utils/audioEngine';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cloudflareConfig: CloudflareConfig;
  setCloudflareConfig: React.Dispatch<React.SetStateAction<CloudflareConfig>>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  cloudflareConfig,
  setCloudflareConfig,
}) => {
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestStatus(null);

    try {
      const res = await fetch('/api/cloudflare/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Kiểm tra kết nối Cloudflare Workers AI và Server-Side Gemini API',
          accountId: cloudflareConfig.accountId,
          apiToken: cloudflareConfig.apiToken,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestStatus('✅ Kết nối thành công! Đã sẵn sàng xử lý TTS và phụ đề thông qua Server-Side API.');
        audioEngine.playSfx('ding');
      } else {
        setTestStatus('⚠️ ' + (data.error || 'Vui lòng kiểm tra lại thông tin Cloudflare.'));
      }
    } catch (err: any) {
      setTestStatus('❌ Lỗi kết nối: ' + err.message);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-orange-400" />
            <span className="font-bold text-sm text-white">
              Cấu hình Cloudflare Workers AI & Gemini Engine
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs text-neutral-300">
          {/* Status Box */}
          <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/30 space-y-1.5">
            <div className="flex items-center gap-1.5 text-orange-400 font-bold text-xs">
              <Zap className="w-3.5 h-3.5" />
              <span>Tích hợp Cloudflare Workers AI & Server-Side Architecture</span>
            </div>
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              Ứng dụng được thiết kế theo cấu trúc Server-Side Gemini API chuyên nghiệp, kết hợp bộ giải mã giọng nói và sinh phụ đề thời gian thực. Bạn có thể xuất bản ứng dụng lên{' '}
              <a
                href="https://dash.cloudflare.com"
                target="_blank"
                rel="noreferrer"
                className="text-orange-400 underline font-semibold inline-flex items-center gap-0.5"
              >
                dash.cloudflare.com <ExternalLink className="w-2.5 h-2.5" />
              </a>{' '}
              hoặc chạy mượt mà ngay lập tức với các model AI được tích hợp sẵn.
            </p>
          </div>

          {/* Cloudflare Account ID & API Token inputs */}
          <div className="space-y-3 pt-1">
            <div>
              <label className="text-[11px] font-bold text-neutral-300 block mb-1">
                Cloudflare Account ID (Tùy chọn khi deploy):
              </label>
              <input
                type="text"
                value={cloudflareConfig.accountId}
                onChange={(e) =>
                  setCloudflareConfig((prev) => ({ ...prev, accountId: e.target.value }))
                }
                placeholder="Ví dụ: 8a7b9c0d1e2f3a4b5c6d..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-200 focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-neutral-300 block mb-1">
                Cloudflare API Token (Workers AI Read/Write):
              </label>
              <input
                type="password"
                value={cloudflareConfig.apiToken}
                onChange={(e) =>
                  setCloudflareConfig((prev) => ({ ...prev, apiToken: e.target.value }))
                }
                placeholder="Ví dụ: cF_api_token_..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-200 focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>
          </div>

          {/* Test connection result */}
          {testStatus && (
            <div className="p-3 rounded-xl bg-neutral-850 border border-neutral-750 text-xs">
              {testStatus}
            </div>
          )}

          {/* Integrated AI Capabilities info */}
          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1.5">
            <div className="font-bold text-[11px] text-neutral-300 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Mô hình AI đang vận hành ngầm</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-neutral-400">
              <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
                <div className="font-bold text-neutral-200">Gemini 3.8 Flash</div>
                <div>Nhận diện & Dịch phụ đề điện ảnh</div>
              </div>
              <div className="p-2 rounded bg-neutral-900 border border-neutral-800">
                <div className="font-bold text-neutral-200">Gemini 3.8 Flash Lite TTS</div>
                <div>Thuyết minh tiếng Việt (Nam/Nữ)</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-orange-400 font-bold text-xs border border-neutral-700 transition-all"
            >
              {isTesting ? 'Đang kiểm tra...' : 'Kiểm tra kết nối AI'}
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-xs shadow-md transition-all"
            >
              Lưu & Hoàn tất
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


