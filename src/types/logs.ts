export type SubsystemType =
  | 'AI_ENGINE'
  | 'AUDIO_BUS'
  | 'TIMELINE'
  | 'SUBTITLES'
  | 'PIPELINE'
  | 'SYSTEM';

export type LogSeverity = 'nominal' | 'active' | 'synced' | 'processing' | 'warning';

export interface SystemLogEntry {
  id: string;
  timestamp: string; // HH:MM:SS.mmm
  subsystem: SubsystemType;
  subsystemLabel: string;
  event: string;
  status: LogSeverity;
  statusLabel: string;
  latencyMs?: number;
  details: string;
  metadata?: Record<string, any>;
}


