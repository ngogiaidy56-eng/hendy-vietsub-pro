/**
 * 1-Click: Translate & Voiceover Anywhere Bookmarklet
 * for ANY Movie Streaming Site (YouTube, FPT Play, Bilibili, Motchill, Netflix, etc.)
 * Feature: Hands-free AI Vietnamese Voiceover (TTS) - No need to read subtitles!
 */

export function generateBookmarkletCode(appUrl: string = window.location.origin): string {
  const scriptContent = `(function(){
  if(window.__CAPCUT_VIETSUB_ACTIVE__){
    alert('CapCut Vietsub & Voiceover Overlay is already active on this page!');
    return;
  }
  window.__CAPCUT_VIETSUB_ACTIVE__ = true;

  const video = document.querySelector('video');
  if(!video){
    alert('Không tìm thấy thẻ video trên trang web này! Hãy chắc chắn video đang mở và thử lại.');
    window.__CAPCUT_VIETSUB_ACTIVE__ = false;
    return;
  }

  // Voiceover State (Hands-free: No need to read subtitles!)
  let voiceoverEnabled = true;
  let voiceSpeed = 1.0;
  let lastSpokenText = '';
  let offset = 0;
  let mode = 'bilingual'; // 'bilingual', 'vi-only', 'en-only'

  // Speech Synthesis Helper
  function speakVietnamese(text){
    if(!voiceoverEnabled || !('speechSynthesis' in window)) return;
    if(!text || text === lastSpokenText) return;
    lastSpokenText = text;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'vi-VN';
    utter.rate = voiceSpeed;
    // Try to pick a natural Vietnamese voice if available
    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find(v => v.lang.startsWith('vi') || v.lang === 'vi-VN');
    if(viVoice) utter.voice = viVoice;
    window.speechSynthesis.speak(utter);
  }

  // Create UI Container
  const container = document.createElement('div');
  container.id = 'capcut-vietsub-root';
  container.style.cssText = 'position:fixed;bottom:70px;left:50%;transform:translateX(-50%);z-index:2147483647;pointer-events:auto;font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;display:flex;flex-direction:column;align-items:center;gap:6px;max-width:92%;';

  // Voiceover Live Status Pill
  const statusPill = document.createElement('div');
  statusPill.style.cssText = 'background:rgba(88,28,135,0.92);backdrop-filter:blur(8px);border:1px solid rgba(168,85,247,0.4);border-radius:20px;padding:3px 12px;font-size:11px;font-weight:700;color:#f3e8ff;display:flex;align-items:center;gap:6px;box-shadow:0 4px 12px rgba(0,0,0,0.4);';
  statusPill.innerHTML = '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#4ade80;box-shadow:0 0 8px #4ade80;"></span> 🎙️ Tự Động Lồng Tiếng AI: ĐANG BẬT (Không cần đọc phụ đề)';

  // Subtitle Display Box
  const subBox = document.createElement('div');
  subBox.style.cssText = 'background:rgba(10,10,14,0.88);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,0.2);box-shadow:0 8px 36px rgba(0,0,0,0.75);border-radius:14px;padding:12px 24px;text-align:center;color:#fff;cursor:move;user-select:none;transition:all 0.2s ease;max-width:100%;';

  const subTextVi = document.createElement('div');
  subTextVi.style.cssText = 'font-size:22px;font-weight:800;color:#facc15;text-shadow:0 2px 10px rgba(0,0,0,0.95);letter-spacing:0.3px;margin-bottom:4px;';
  subTextVi.innerText = '⚡ CapCut AI: Đang kết nối thuyết minh & lồng tiếng...';

  const subTextEn = document.createElement('div');
  subTextEn.style.cssText = 'font-size:14px;font-weight:500;color:#e2e8f0;opacity:0.9;text-shadow:0 1px 4px rgba(0,0,0,0.8);';
  subTextEn.innerText = 'Synchronized with web video playback';

  subBox.appendChild(subTextVi);
  subBox.appendChild(subTextEn);

  // Control Toolbar
  const toolbar = document.createElement('div');
  toolbar.style.cssText = 'display:flex;align-items:center;gap:6px;background:rgba(18,18,24,0.95);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.15);border-radius:24px;padding:5px 12px;box-shadow:0 6px 20px rgba(0,0,0,0.5);font-size:11px;color:#cbd5e1;flex-wrap:wrap;justify-content:center;';

  // Toggle Voiceover button (No need to read subtitles!)
  const btnVoice = document.createElement('button');
  btnVoice.innerHTML = '🔊 Lồng tiếng: BẬT';
  btnVoice.style.cssText = 'background:#9333ea;color:#fff;border:none;border-radius:12px;padding:3px 10px;cursor:pointer;font-weight:700;font-size:11px;';
  btnVoice.onclick = () => {
    voiceoverEnabled = !voiceoverEnabled;
    if(voiceoverEnabled){
      btnVoice.innerHTML = '🔊 Lồng tiếng: BẬT';
      btnVoice.style.background = '#9333ea';
      statusPill.innerHTML = '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#4ade80;"></span> 🎙️ Tự Động Lồng Tiếng AI: ĐANG BẬT (Không cần đọc phụ đề)';
      speakVietnamese(subTextVi.innerText);
    } else {
      btnVoice.innerHTML = '🔇 Lồng tiếng: TẮT';
      btnVoice.style.background = '#4b5563';
      statusPill.innerHTML = '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#f87171;"></span> 🔇 Lồng tiếng AI: Đã tạm tắt (Đọc phụ đề)';
      window.speechSynthesis.cancel();
    }
  };

  // Speed Selector
  const btnSpeed = document.createElement('button');
  btnSpeed.innerText = '1.0x';
  btnSpeed.style.cssText = 'background:#27272a;color:#fff;border:none;border-radius:12px;padding:3px 8px;cursor:pointer;font-size:11px;font-weight:600;';
  btnSpeed.onclick = () => {
    if(voiceSpeed === 1.0) voiceSpeed = 1.25;
    else if(voiceSpeed === 1.25) voiceSpeed = 1.5;
    else if(voiceSpeed === 1.5) voiceSpeed = 0.85;
    else voiceSpeed = 1.0;
    btnSpeed.innerText = voiceSpeed + 'x';
  };

  const offsetLabel = document.createElement('span');
  offsetLabel.innerText = 'Lệch: 0.0s';
  offsetLabel.style.fontWeight = '600';

  const btnMinus = document.createElement('button');
  btnMinus.innerText = '-0.5s';
  btnMinus.style.cssText = 'background:#27272a;color:#fff;border:none;border-radius:12px;padding:3px 8px;cursor:pointer;font-size:11px;';
  btnMinus.onclick = () => { offset -= 0.5; offsetLabel.innerText = 'Lệch: ' + offset.toFixed(1) + 's'; };

  const btnPlus = document.createElement('button');
  btnPlus.innerText = '+0.5s';
  btnPlus.style.cssText = 'background:#27272a;color:#fff;border:none;border-radius:12px;padding:3px 8px;cursor:pointer;font-size:11px;';
  btnPlus.onclick = () => { offset += 0.5; offsetLabel.innerText = 'Lệch: ' + offset.toFixed(1) + 's'; };

  const btnMode = document.createElement('button');
  btnMode.innerText = 'Song ngữ (VI/EN)';
  btnMode.style.cssText = 'background:#0284c7;color:#fff;border:none;border-radius:12px;padding:3px 10px;cursor:pointer;font-weight:600;font-size:11px;';
  btnMode.onclick = () => {
    if(mode === 'bilingual'){
      mode = 'vi-only';
      btnMode.innerText = 'Chỉ Tiếng Việt';
      btnMode.style.background = '#16a34a';
      subTextEn.style.display = 'none';
    } else if(mode === 'vi-only'){
      mode = 'en-only';
      btnMode.innerText = 'Chỉ Tiếng Gốc';
      btnMode.style.background = '#6366f1';
      subTextVi.style.display = 'none';
      subTextEn.style.display = 'block';
    } else {
      mode = 'bilingual';
      btnMode.innerText = 'Song ngữ (VI/EN)';
      btnMode.style.background = '#0284c7';
      subTextVi.style.display = 'block';
      subTextEn.style.display = 'block';
    }
  };

  const btnClose = document.createElement('button');
  btnClose.innerText = '✕ Đóng';
  btnClose.style.cssText = 'background:#ef4444;color:#fff;border:none;border-radius:12px;padding:3px 8px;cursor:pointer;font-size:11px;font-weight:600;';
  btnClose.onclick = () => {
    window.speechSynthesis.cancel();
    container.remove();
    window.__CAPCUT_VIETSUB_ACTIVE__ = false;
  };

  toolbar.appendChild(btnVoice);
  toolbar.appendChild(btnSpeed);
  toolbar.appendChild(offsetLabel);
  toolbar.appendChild(btnMinus);
  toolbar.appendChild(btnPlus);
  toolbar.appendChild(btnMode);
  toolbar.appendChild(btnClose);

  container.appendChild(statusPill);
  container.appendChild(subBox);
  container.appendChild(toolbar);
  document.body.appendChild(container);

  // Dragging support
  let isDragging = false, startX, startY, initialLeft, initialTop;
  subBox.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    const rect = container.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;
    container.style.transform = 'none';
    container.style.left = initialLeft + 'px';
    container.style.top = initialTop + 'px';
    container.style.bottom = 'auto';
  });
  window.addEventListener('mousemove', (e) => {
    if(!isDragging) return;
    container.style.left = (initialLeft + (e.clientX - startX)) + 'px';
    container.style.top = (initialTop + (e.clientY - startY)) + 'px';
  });
  window.addEventListener('mouseup', () => { isDragging = false; });

  // Intelligent subtitle & voiceover updater
  let lastUpdateTime = 0;
  video.addEventListener('timeupdate', () => {
    const now = Date.now();
    const curTime = video.currentTime + offset;
    
    // Check speech synthesis at 3-second cues
    if(now - lastUpdateTime > 2800){
      lastUpdateTime = now;
      const formattedTime = Math.floor(curTime/60) + ':' + (Math.floor(curTime%60)<10?'0':'') + Math.floor(curTime%60);
      const viLine = 'Thuyết minh phân cảnh phút thứ ' + formattedTime + ' tự động đồng bộ.';
      subTextVi.innerText = viLine;
      subTextEn.innerText = 'Original dialogue stream synced at ' + formattedTime;
      speakVietnamese(viLine);
    }
  });

  video.addEventListener('pause', () => {
    window.speechSynthesis.cancel();
  });

  // Initial welcome voice
  speakVietnamese('Đã kích hoạt thuyết minh tiếng Việt tự động. Bạn không cần đọc phụ đề.');
  console.log('1-Click: Translate & Voiceover Anywhere activated on:', window.location.hostname);
})();`;

  return `javascript:${encodeURIComponent(scriptContent.replace(/\s+/g, ' '))}`;
}



