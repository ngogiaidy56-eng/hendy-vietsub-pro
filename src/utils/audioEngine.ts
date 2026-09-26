/**
 * CapCut Pro Sound FX & Audio Engine
 * High-fidelity procedural audio synthesis using Web Audio API
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Play procedural CapCut Sound FX
  playSfx(type: string, volume: number = 1.0) {
    const ctx = this.getContext();
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(Math.max(0, Math.min(2, volume)), ctx.currentTime);
    masterGain.connect(ctx.destination);

    switch (type) {
      case 'whoosh':
      case 'swoosh':
        this.synthWhoosh(ctx, masterGain);
        break;
      case 'ding':
        this.synthDing(ctx, masterGain);
        break;
      case 'pop':
        this.synthPop(ctx, masterGain);
        break;
      case 'boom':
        this.synthBoom(ctx, masterGain);
        break;
      case 'shutter':
        this.synthShutter(ctx, masterGain);
        break;
      case 'glitch':
        this.synthGlitch(ctx, masterGain);
        break;
      case 'chime':
      default:
        this.synthChime(ctx, masterGain);
        break;
    }
  }

  private synthWhoosh(ctx: AudioContext, dest: AudioNode) {
    const bufferSize = ctx.sampleRate * 0.45;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(200, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(3200, ctx.currentTime + 0.22);
    filter.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.45);
    filter.Q.setValueAtTime(3.5, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.7, ctx.currentTime + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    noise.start();
  }

  private synthDing(ctx: AudioContext, dest: AudioNode) {
    const now = ctx.currentTime;
    const freqs = [1864, 3728]; // High crystal chime
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      const vol = idx === 0 ? 0.4 : 0.15;
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 1.2);
    });
  }

  private synthPop(ctx: AudioContext, dest: AudioNode) {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.1);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  private synthBoom(ctx: AudioContext, dest: AudioNode) {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.9);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

    // Distortion drive
    const shaper = ctx.createWaveShaper();
    shaper.curve = this.makeDistortionCurve(18);

    osc.connect(shaper);
    shaper.connect(gain);
    gain.connect(dest);

    osc.start(now);
    osc.stop(now + 1.1);
  }

  private synthShutter(ctx: AudioContext, dest: AudioNode) {
    const now = ctx.currentTime;
    // Click 1
    this.playClick(ctx, dest, now);
    // Click 2 (blade release)
    this.playClick(ctx, dest, now + 0.08);
  }

  private playClick(ctx: AudioContext, dest: AudioNode, time: number) {
    const bufferSize = ctx.sampleRate * 0.03;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2500, time);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    noise.start(time);
  }

  private synthGlitch(ctx: AudioContext, dest: AudioNode) {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.setValueAtTime(880, now + 0.04);
    osc.frequency.setValueAtTime(110, now + 0.09);
    osc.frequency.setValueAtTime(660, now + 0.14);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.setValueAtTime(0.01, now + 0.03);
    gain.gain.setValueAtTime(0.4, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.23);
  }

  private synthChime(ctx: AudioContext, dest: AudioNode) {
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 major chord
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.25, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 1.2);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 1.2);
    });
  }

  private makeDistortionCurve(amount: number) {
    const k = amount;
    const n = 22050;
    const curve = new Float32Array(n);
    const deg = Math.PI / 180;
    for (let i = 0; i < n; ++i) {
      const x = (i * 2) / n - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  // Create an audio buffer for an SFX item to place on timeline
  async renderSfxBufferUrl(type: string): Promise<{ url: string; duration: number }> {
    const sampleRate = 44100;
    const duration = type === 'boom' ? 1.2 : type === 'ding' ? 1.0 : 0.5;
    const offlineCtx = new OfflineAudioContext(1, sampleRate * duration, sampleRate);
    const gain = offlineCtx.createGain();
    gain.gain.value = 1.0;
    gain.connect(offlineCtx.destination);

    switch (type) {
      case 'whoosh':
      case 'swoosh':
        this.synthWhoosh(offlineCtx as any, gain);
        break;
      case 'ding':
        this.synthDing(offlineCtx as any, gain);
        break;
      case 'pop':
        this.synthPop(offlineCtx as any, gain);
        break;
      case 'boom':
        this.synthBoom(offlineCtx as any, gain);
        break;
      case 'shutter':
        this.synthShutter(offlineCtx as any, gain);
        break;
      case 'glitch':
        this.synthGlitch(offlineCtx as any, gain);
        break;
      default:
        this.synthChime(offlineCtx as any, gain);
        break;
    }

    const renderedBuffer = await offlineCtx.startRendering();
    const wavBlob = this.audioBufferToWav(renderedBuffer);
    const url = URL.createObjectURL(wavBlob);
    return { url, duration };
  }

  // Record Voiceover directly via Microphone
  async startVoiceoverRecording(): Promise<MediaStream> {
    this.recordedChunks = [];
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mediaRecorder = new MediaRecorder(stream);

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this.recordedChunks.push(e.data);
      }
    };

    this.mediaRecorder.start(100);
    return stream;
  }

  async stopVoiceoverRecording(): Promise<{ blob: Blob; url: string; duration: number }> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve({ blob: new Blob(), url: '', duration: 0 });
        return;
      }

      this.mediaRecorder.onstop = async () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(this.recordedChunks, { type: mimeType });
        const url = URL.createObjectURL(blob);

        // Calculate duration via AudioContext
        let duration = 3.0;
        try {
          const arrayBuffer = await blob.arrayBuffer();
          const audioCtx = this.getContext();
          const decoded = await audioCtx.decodeAudioData(arrayBuffer);
          duration = decoded.duration;
        } catch {
          // fallback
        }

        // Stop stream tracks
        if (this.mediaRecorder && this.mediaRecorder.stream) {
          this.mediaRecorder.stream.getTracks().forEach((track) => track.stop());
        }

        resolve({ blob, url, duration });
      };

      this.mediaRecorder.stop();
    });
  }

  // Client-side Web Speech API fallback for Vietnamese Voiceover
  speakVietnameseSpeech(text: string, voiceGender: 'female' | 'male' = 'female'): Promise<void> {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.rate = 1.0;
      utterance.pitch = voiceGender === 'female' ? 1.15 : 0.85;

      const voices = window.speechSynthesis.getVoices();
      const viVoices = voices.filter((v) => v.lang.includes('vi') || v.lang.includes('VN'));
      if (viVoices.length > 0) {
        utterance.voice = viVoices[0];
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  }

  // Convert AudioBuffer to standard WAV Blob for download & playback
  private audioBufferToWav(buffer: AudioBuffer): Blob {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const out = new DataView(new ArrayBuffer(length));
    const channels: Float32Array[] = [];
    let sampleRate = buffer.sampleRate;
    let offset = 0;
    let pos = 0;

    function setUint16(data: number) {
      out.setUint16(pos, data, true);
      pos += 2;
    }

    function setUint32(data: number) {
      out.setUint32(pos, data, true);
      pos += 4;
    }

    // RIFF identifier
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"

    // format chunk identifier
    setUint32(0x20746d66); // "fmt "
    setUint32(16); // format chunk length
    setUint16(1); // sample format (raw)
    setUint16(numOfChan);
    setUint32(sampleRate);
    setUint32(sampleRate * 2 * numOfChan); // byte rate
    setUint16(numOfChan * 2); // block align
    setUint16(16); // bits per sample

    // data chunk identifier
    setUint32(0x61746164); // "data"
    setUint32(length - pos - 4); // data chunk length

    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    while (pos < length) {
      for (let i = 0; i < numOfChan; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        out.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([out.buffer], { type: 'audio/wav' });
  }
}

export const audioEngine = new AudioEngine();


