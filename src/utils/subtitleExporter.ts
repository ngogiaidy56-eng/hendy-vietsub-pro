import { SubtitleSegment, SubtitleDisplayMode } from '../types/editor';

function formatSrtTime(seconds: number): string {
  const pad = (num: number, size = 2) => String(Math.floor(num)).padStart(size, '0');
  const hrs = pad(seconds / 3600);
  const mins = pad((seconds % 3600) / 60);
  const secs = pad(seconds % 60);
  const ms = String(Math.floor((seconds % 1) * 1000)).padStart(3, '0');
  return `${hrs}:${mins}:${secs},${ms}`;
}

function formatVttTime(seconds: number): string {
  const pad = (num: number, size = 2) => String(Math.floor(num)).padStart(size, '0');
  const hrs = pad(seconds / 3600);
  const mins = pad((seconds % 3600) / 60);
  const secs = pad(seconds % 60);
  const ms = String(Math.floor((seconds % 1) * 1000)).padStart(3, '0');
  return `${hrs}:${mins}:${secs}.${ms}`;
}

export function generateSrtContent(subtitles: SubtitleSegment[], mode: SubtitleDisplayMode = 'bilingual'): string {
  return subtitles
    .map((sub, index) => {
      let text = sub.textVi;
      if (mode === 'bilingual') {
        text = `${sub.textVi}\n${sub.textOriginal}`;
      } else if (mode === 'original-only') {
        text = sub.textOriginal;
      }
      return `${index + 1}\n${formatSrtTime(sub.start)} --> ${formatSrtTime(sub.end)}\n${text}\n`;
    })
    .join('\n');
}

export function generateVttContent(subtitles: SubtitleSegment[], mode: SubtitleDisplayMode = 'bilingual'): string {
  const body = subtitles
    .map((sub, index) => {
      let text = sub.textVi;
      if (mode === 'bilingual') {
        text = `${sub.textVi}\n${sub.textOriginal}`;
      } else if (mode === 'original-only') {
        text = sub.textOriginal;
      }
      return `${index + 1}\n${formatVttTime(sub.start)} --> ${formatVttTime(sub.end)}\n${text}\n`;
    })
    .join('\n');

  return `WEBVTT - CapCut Pro AI Vietsub\n\n${body}`;
}

export function generateAssKaraokeContent(subtitles: SubtitleSegment[]): string {
  const header = `[Script Info]
Title: CapCut Pro Vietnamese Karaoke Subtitles
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,52,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,3,2,2,20,20,40,1
Style: KaraokeVi,Arial,56,&H0000FFFF,&H000000FF,&H00000000,&H90000000,-1,0,0,0,100,100,0,0,1,4,2,2,20,20,50,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const formatAssTime = (seconds: number) => {
    const pad = (num: number, size = 2) => String(Math.floor(num)).padStart(size, '0');
    const hrs = Math.floor(seconds / 3600);
    const mins = pad((seconds % 3600) / 60);
    const secs = pad(seconds % 60);
    const cs = String(Math.floor((seconds % 1) * 100)).padStart(2, '0');
    return `${hrs}:${mins}:${secs}.${cs}`;
  };

  const events = subtitles
    .map((sub) => {
      const start = formatAssTime(sub.start);
      const end = formatAssTime(sub.end);
      return `Dialogue: 0,${start},${end},KaraokeVi,,0,0,0,,${sub.textVi}`;
    })
    .join('\n');

  return `${header}${events}\n`;
}

export function downloadFile(content: string, filename: string, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}


