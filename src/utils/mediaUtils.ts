/**
 * Utility functions for reading media files with full duration and generating thumbnails.
 */

export interface LoadedMediaInfo {
  name: string;
  url: string;
  type: 'video' | 'audio' | 'image';
  duration: number;
  thumbnail: string;
  width?: number;
  height?: number;
}

export async function readMediaFullDuration(file: File): Promise<LoadedMediaInfo> {
  const url = URL.createObjectURL(file);
  const isVideo = file.type.startsWith('video');
  const isAudio = file.type.startsWith('audio');
  const isImage = file.type.startsWith('image');

  if (isVideo) {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = url;
      video.muted = true;
      video.playsInline = true;

      // Timeout safety fallback
      const timer = setTimeout(() => {
        resolve({
          name: file.name,
          url,
          type: 'video',
          duration: 30.0,
          thumbnail:
            'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600&auto=format&fit=crop&q=80',
        });
      }, 5000);

      video.onloadedmetadata = () => {
        clearTimeout(timer);
        const actualDuration =
          video.duration && isFinite(video.duration) && video.duration > 0
            ? Number(video.duration.toFixed(2))
            : 30.0;

        // Seek a tiny bit to capture a real frame thumbnail
        video.currentTime = Math.min(1.0, actualDuration * 0.1);
      };

      video.onseeked = () => {
        let thumbnail =
          'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600&auto=format&fit=crop&q=80';
        try {
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(video.videoWidth || 640, 640);
          canvas.height = Math.min(video.videoHeight || 360, 360);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            thumbnail = canvas.toDataURL('image/jpeg', 0.85);
          }
        } catch {
          // CORS or security fallback
        }

        const actualDuration =
          video.duration && isFinite(video.duration) && video.duration > 0
            ? Number(video.duration.toFixed(2))
            : 30.0;

        resolve({
          name: file.name,
          url,
          type: 'video',
          duration: actualDuration,
          thumbnail,
          width: video.videoWidth || 1920,
          height: video.videoHeight || 1080,
        });
      };

      video.onerror = () => {
        clearTimeout(timer);
        resolve({
          name: file.name,
          url,
          type: 'video',
          duration: 30.0,
          thumbnail:
            'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600&auto=format&fit=crop&q=80',
        });
      };
    });
  }

  if (isAudio) {
    return new Promise((resolve) => {
      const audio = document.createElement('audio');
      audio.preload = 'metadata';
      audio.src = url;

      const timer = setTimeout(() => {
        resolve({
          name: file.name,
          url,
          type: 'audio',
          duration: 30.0,
          thumbnail: '',
        });
      }, 5000);

      audio.onloadedmetadata = () => {
        clearTimeout(timer);
        const actualDuration =
          audio.duration && isFinite(audio.duration) && audio.duration > 0
            ? Number(audio.duration.toFixed(2))
            : 30.0;
        resolve({
          name: file.name,
          url,
          type: 'audio',
          duration: actualDuration,
          thumbnail: '',
        });
      };

      audio.onerror = () => {
        clearTimeout(timer);
        resolve({
          name: file.name,
          url,
          type: 'audio',
          duration: 30.0,
          thumbnail: '',
        });
      };
    });
  }

  // Image
  return Promise.resolve({
    name: file.name,
    url,
    type: 'image',
    duration: 5.0, // Default duration for static images on timeline
    thumbnail: url,
  });
}

/**
 * Format seconds into HH:MM:SS.ms or MM:SS.ms for long video durations
 */
export function formatFullTimecode(secs: number): string {
  if (isNaN(secs) || secs < 0) secs = 0;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  const ms = Math.floor((secs % 1) * 100);

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  if (h > 0) {
    return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(ms)}`;
  }
  return `${pad(m)}:${pad(s)}.${pad(ms)}`;
}


