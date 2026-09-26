import {
  AspectRatio,
  ExportSettings,
  SubtitleSegment,
  VideoClip,
  AudioClip,
} from '../types/editor';
import { audioEngine } from './audioEngine';

export interface RenderCallback {
  onProgress: (progress: number, currentFrame: number, totalFrames: number, timeRemaining: string) => void;
  onComplete: (videoBlob: Blob, videoUrl: string) => void;
  onError: (error: string) => void;
}

export function getResolutionDimensions(
  aspectRatio: AspectRatio,
  quality: '720p' | '1080p' | '4k'
): { width: number; height: number } {
  let baseHeight = quality === '4k' ? 2160 : quality === '1080p' ? 1080 : 720;

  switch (aspectRatio) {
    case '16:9':
      return { width: Math.round((baseHeight * 16) / 9), height: baseHeight };
    case '9:16':
      return { width: baseHeight, height: Math.round((baseHeight * 16) / 9) };
    case '1:1':
      return { width: baseHeight, height: baseHeight };
    case '4:5':
      return { width: baseHeight, height: Math.round((baseHeight * 5) / 4) };
    case '21:9':
      return { width: Math.round((baseHeight * 21) / 9), height: baseHeight };
    default:
      return { width: 1920, height: 1080 };
  }
}

export async function renderTimelineVideo(
  clips: VideoClip[],
  audioClips: AudioClip[],
  subtitles: SubtitleSegment[],
  aspectRatio: AspectRatio,
  settings: ExportSettings,
  callbacks: RenderCallback,
  signal?: AbortSignal
): Promise<void> {
  const { width, height } = getResolutionDimensions(aspectRatio, settings.resolution);
  const fps = settings.fps;

  // Calculate total duration in seconds
  const totalDuration = clips.reduce((acc, c) => Math.max(acc, c.startTime + c.duration), 5);
  const totalFrames = Math.max(1, Math.floor(totalDuration * fps));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    callbacks.onError('Failed to create canvas 2D rendering context');
    return;
  }

  // Pre-load video elements or thumbnail images for each clip
  const mediaElements: Map<string, HTMLVideoElement | HTMLImageElement> = new Map();
  for (const clip of clips) {
    if (clip.type === 'video') {
      const vid = document.createElement('video');
      vid.src = clip.src;
      vid.crossOrigin = 'anonymous';
      vid.muted = true;
      vid.playsInline = true;
      let loadSuccess = false;

      await new Promise<void>((resolve) => {
        vid.onloadeddata = () => {
          loadSuccess = true;
          mediaElements.set(clip.id, vid);
          resolve();
        };
        vid.onerror = () => {
          // If video cannot be decoded or CORS blocked, fallback to thumbnail image
          const fallbackImg = new Image();
          fallbackImg.crossOrigin = 'anonymous';
          fallbackImg.src = clip.thumbnail || clip.src;
          fallbackImg.onload = () => {
            mediaElements.set(clip.id, fallbackImg);
            resolve();
          };
          fallbackImg.onerror = () => {
            resolve();
          };
        };
        vid.load();
      });

      if (!loadSuccess && !mediaElements.has(clip.id)) {
        const fallbackImg = new Image();
        fallbackImg.crossOrigin = 'anonymous';
        fallbackImg.src = clip.thumbnail || clip.src;
        mediaElements.set(clip.id, fallbackImg);
      }
    } else {
      const img = new Image();
      img.src = clip.src;
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
      mediaElements.set(clip.id, img);
    }
  }

  // Setup MediaRecorder
  let mimeType = 'video/webm;codecs=vp9';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : 'video/webm';
  }

  const stream = canvas.captureStream(fps);
  let recorder: MediaRecorder;
  try {
    recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: qualityBitrate(settings.resolution) });
  } catch {
    recorder = new MediaRecorder(stream);
  }

  const recordedChunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };

  recorder.onstop = () => {
    const finalBlob = new Blob(recordedChunks, { type: recorder.mimeType });
    const videoUrl = URL.createObjectURL(finalBlob);
    audioEngine.playSfx('chime');
    callbacks.onComplete(finalBlob, videoUrl);
  };

  recorder.start();
  const startTimeMs = Date.now();

  // Render frame by frame
  for (let f = 0; f < totalFrames; f++) {
    if (signal?.aborted) {
      recorder.stop();
      return;
    }

    const currentTime = f / fps;

    // Draw background
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, width, height);

    // Find active clip(s)
    const activeClip = clips.find((c) => currentTime >= c.startTime && currentTime <= c.startTime + c.duration);

    if (activeClip) {
      const media = mediaElements.get(activeClip.id);
      if (media) {
        ctx.save();
        // Setup transform
        ctx.translate(width / 2 + activeClip.transform.x, height / 2 + activeClip.transform.y);
        ctx.rotate((activeClip.transform.rotation * Math.PI) / 180);
        ctx.scale(
          activeClip.transform.scale * (activeClip.transform.flipH ? -1 : 1),
          activeClip.transform.scale * (activeClip.transform.flipV ? -1 : 1)
        );

        // Calculate filter string
        const filterStr = buildCssFilter(activeClip.filter);
        ctx.filter = filterStr;

        // Draw image or video frame
        const mediaAspect = 16 / 9;
        let drawW = width;
        let drawH = width / mediaAspect;
        if (drawH < height) {
          drawH = height;
          drawW = height * mediaAspect;
        }

        ctx.drawImage(media, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        // Draw Vignette if set
        if (activeClip.filter.vignette > 0) {
          const vigGrad = ctx.createRadialGradient(
            width / 2,
            height / 2,
            width * 0.25,
            width / 2,
            height / 2,
            width * 0.75
          );
          vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
          vigGrad.addColorStop(1, `rgba(0,0,0,${(activeClip.filter.vignette / 100) * 0.85})`);
          ctx.fillStyle = vigGrad;
          ctx.fillRect(0, 0, width, height);
        }

        // Draw transitions (e.g. fade / white flash at start/end of clip)
        const timeInClip = currentTime - activeClip.startTime;
        if (activeClip.transition.type !== 'none') {
          const tDur = activeClip.transition.duration || 0.5;
          if (timeInClip < tDur) {
            const progress = 1 - timeInClip / tDur;
            if (activeClip.transition.type === 'fade' || activeClip.transition.type === 'dissolve') {
              ctx.fillStyle = `rgba(0,0,0,${progress})`;
              ctx.fillRect(0, 0, width, height);
            } else if (activeClip.transition.type === 'white-flash') {
              ctx.fillStyle = `rgba(255,255,255,${progress})`;
              ctx.fillRect(0, 0, width, height);
            }
          }
        }
      }
    }

    // Hardcode dynamic karaoke / cinema subtitles directly onto video frames
    if (settings.hardcodeSubtitles) {
      const activeSub = subtitles.find((s) => currentTime >= s.start && currentTime <= s.end);
      if (activeSub) {
        drawSubtitleOverlay(ctx, width, height, activeSub, settings);
      }
    }

    // Update progress
    const progressPct = Math.round(((f + 1) / totalFrames) * 100);
    const elapsed = (Date.now() - startTimeMs) / 1000;
    const remainingSecs = Math.max(0, Math.round((elapsed / (f + 1)) * (totalFrames - f - 1)));
    const mins = Math.floor(remainingSecs / 60);
    const secs = remainingSecs % 60;
    const timeRemainingStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    callbacks.onProgress(progressPct, f + 1, totalFrames, timeRemainingStr);

    // Yield back to event loop every frame
    await new Promise((r) => requestAnimationFrame(r));
  }

  recorder.stop();
}

function buildCssFilter(f: VideoClip['filter']): string {
  let filter = `brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturation}%)`;
  if (f.preset === 'black-white-noir') {
    filter += ' grayscale(100%) contrast(140%)';
  } else if (f.preset === 'vintage-90s') {
    filter += ' sepia(35%) contrast(90%)';
  } else if (f.preset === 'sunset-glow') {
    filter += ' sepia(20%) saturate(130%)';
  } else if (f.preset === 'cyberpunk-neon') {
    filter += ' hue-rotate(45deg) saturate(160%)';
  } else if (f.preset === 'cinematic-teal-orange') {
    filter += ' contrast(115%) saturate(125%)';
  }
  return filter;
}

function drawSubtitleOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  sub: SubtitleSegment,
  settings: ExportSettings
) {
  const fontSize = Math.max(22, Math.round(height * 0.038));
  ctx.save();

  // Position: bottom 12%
  const subY = height * 0.86;

  // Primary Vietnamese line
  ctx.font = `bold ${fontSize}px "Inter", "Segoe UI", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const viText = sub.textVi;
  const enText = sub.textOriginal;

  const viWidth = ctx.measureText(viText).width;
  ctx.font = `500 ${Math.round(fontSize * 0.72)}px "Inter", system-ui, sans-serif`;
  const enWidth = ctx.measureText(enText).width;
  const boxWidth = Math.max(viWidth, enWidth) + 48;
  const boxHeight = settings.subtitleMode === 'bilingual' ? fontSize * 2.5 : fontSize * 1.6;

  // Translucent pill background
  ctx.fillStyle = 'rgba(10, 10, 14, 0.82)';
  roundRect(ctx, width / 2 - boxWidth / 2, subY - boxHeight / 2, boxWidth, boxHeight, 16);
  ctx.fill();

  // Pill border highlight
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  if (settings.subtitleMode === 'bilingual') {
    // VI Line (Yellow / Karaoke Gold)
    ctx.font = `bold ${fontSize}px "Inter", "Segoe UI", system-ui, sans-serif`;
    ctx.fillStyle = '#facc15';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 6;
    ctx.fillText(viText, width / 2, subY - fontSize * 0.38);

    // EN Line (Crisp White)
    ctx.font = `500 ${Math.round(fontSize * 0.7)}px "Inter", system-ui, sans-serif`;
    ctx.fillStyle = '#f1f5f9';
    ctx.shadowBlur = 4;
    ctx.fillText(enText, width / 2, subY + fontSize * 0.52);
  } else if (settings.subtitleMode === 'vi-only') {
    ctx.font = `bold ${fontSize}px "Inter", "Segoe UI", system-ui, sans-serif`;
    ctx.fillStyle = '#facc15';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 6;
    ctx.fillText(viText, width / 2, subY);
  } else {
    ctx.font = `bold ${fontSize}px "Inter", "Segoe UI", system-ui, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 6;
    ctx.fillText(enText, width / 2, subY);
  }

  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function qualityBitrate(quality: '720p' | '1080p' | '4k'): number {
  switch (quality) {
    case '4k':
      return 25000000; // 25 Mbps
    case '1080p':
      return 8000000; // 8 Mbps
    case '720p':
    default:
      return 3500000; // 3.5 Mbps
  }
}


