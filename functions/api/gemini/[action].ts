interface RequestBody {
  [key: string]: unknown;
}

type GeminiCandidate = {
  content?: {
    parts?: Array<{
      text?: string;
      inlineData?: { data?: string; mimeType?: string };
    }>;
  };
};

type GeminiResponse = {
  candidates?: GeminiCandidate[];
  error?: { message?: string };
};

const JSON_MODE_CONFIG = {
  responseMimeType: 'application/json',
  temperature: 0.2,
};

const STOCK_FOOTAGE_POOL = [
  {
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
    tag: 'scifi',
  },
  {
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
    tag: 'cyberpunk',
  },
  {
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    tag: 'nature',
  },
  {
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
    tag: 'creative',
  },
  {
    src: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
    tag: 'coffee_lifestyle',
    isImage: true,
  },
  {
    src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&auto=format&fit=crop&q=80',
    tag: 'travel',
    isImage: true,
  },
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

function cleanJsonText(text: string): string {
  let value = text.trim();
  if (value.startsWith('```')) {
    value = value.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  }
  const firstObject = value.indexOf('{');
  const firstArray = value.indexOf('[');
  const first = firstObject === -1 ? firstArray : firstArray === -1 ? firstObject : Math.min(firstObject, firstArray);
  const lastObject = value.lastIndexOf('}');
  const lastArray = value.lastIndexOf(']');
  const last = Math.max(lastObject, lastArray);
  if (first >= 0 && last >= first) return value.slice(first, last + 1);
  return value;
}

function extractText(payload: GeminiResponse): string {
  return (payload.candidates?.[0]?.content?.parts || [])
    .map((part) => part.text || '')
    .join('')
    .trim();
}

function extractAudio(payload: GeminiResponse): { data: string; mimeType: string } | null {
  for (const part of payload.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData?.data) {
      return {
        data: part.inlineData.data,
        mimeType: part.inlineData.mimeType || 'audio/wav',
      };
    }
  }
  return null;
}

async function readBody(request: Request): Promise<RequestBody> {
  try {
    const value = await request.json();
    return value && typeof value === 'object' ? (value as RequestBody) : {};
  } catch {
    return {};
  }
}

async function geminiRequest(
  env: Record<string, string | undefined>,
  model: string,
  body: Record<string, unknown>,
  attempt = 0,
): Promise<GeminiResponse> {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => ({}))) as GeminiResponse;
  if (response.ok) return payload;

  const message = payload.error?.message || `Gemini HTTP ${response.status}`;
  const retryable = response.status === 429 || response.status === 500 || response.status === 502 || response.status === 503 || response.status === 504;
  if (retryable && attempt < 2) {
    await sleep(500 * 2 ** attempt);
    return geminiRequest(env, model, body, attempt + 1);
  }
  throw new Error(message);
}

async function generateJson(
  env: Record<string, string | undefined>,
  prompt: string,
  systemInstruction?: string,
): Promise<any> {
  const models = ['gemini-3.8-flash', 'gemini-2.5-flash'];
  let lastError: unknown = null;

  for (const model of models) {
    try {
      const payload = await geminiRequest(env, model, {
        systemInstruction: systemInstruction
          ? { parts: [{ text: systemInstruction }] }
          : undefined,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: JSON_MODE_CONFIG,
      });
      const text = extractText(payload);
      if (!text) throw new Error('Gemini returned an empty response');
      return JSON.parse(cleanJsonText(text));
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Gemini request failed');
}

function generateSmartFallbackSubtitles(videoTitle?: string, customScript?: string, clipDuration = 30) {
  if (customScript?.trim()) {
    const lines = customScript
      .split(/\n|\.\s+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 2);
    if (lines.length) {
      const step = Math.min(clipDuration / lines.length, 4);
      return lines.map((line, index) => ({
        id: `sub_fb_${Date.now()}_${index}`,
        start: Number((index * step).toFixed(2)),
        end: Number((index * step + Math.min(step * 0.9, 3.8)).toFixed(2)),
        textOriginal: line,
        textVi: line.startsWith('[') ? line : `[Vietsub] ${line}`,
        speaker: 'Diễn viên',
      }));
    }
  }

  const templates: Record<string, Array<{ start: number; end: number; textOriginal: string; textVi: string; speaker: string }>> = {
    'Tears of Steel': [
      { start: 0.8, end: 3.5, textOriginal: 'What happened to the old days?', textVi: 'Chuyện gì đã xảy ra với những ngày tháng cũ?', speaker: 'Thom' },
      { start: 4, end: 7.2, textOriginal: 'They went away. Things got complicated.', textVi: 'Chúng đã trôi qua rồi. Mọi chuyện dần trở nên phức tạp.', speaker: 'Celia' },
      { start: 7.8, end: 11.2, textOriginal: "We have one shot at this. Don't lose focus.", textVi: 'Chúng ta chỉ có một cơ hội duy nhất. Đừng mất tập trung.', speaker: 'Thom' },
      { start: 12, end: 15.5, textOriginal: 'The tracking system is locked onto target!', textVi: 'Hệ thống định vị đã khóa chặt mục tiêu!', speaker: 'Kỹ thuật viên' },
      { start: 16, end: 20, textOriginal: 'Initiate backup sequence now!', textVi: 'Kích hoạt quy trình dự phòng ngay lập tức!', speaker: 'Chỉ huy' },
    ],
    Sintel: [
      { start: 0.5, end: 3.8, textOriginal: "I've been searching for you everywhere across the snow.", textVi: 'Ta đã lặn lội tìm kiếm con khắp mọi nẻo băng tuyết.', speaker: 'Sintel' },
      { start: 4.2, end: 8, textOriginal: 'No storm will ever keep us apart.', textVi: 'Không cơn bão nào có thể chia lìa chúng ta.', speaker: 'Sintel' },
      { start: 8.5, end: 12, textOriginal: "Hold on... I'm almost there.", textVi: 'Hãy vững vàng... ta sắp đến bên con rồi.', speaker: 'Sintel' },
    ],
    'Big Buck Bunny': [
      { start: 0.5, end: 3.2, textOriginal: 'A peaceful morning in the forest awakens.', textVi: 'Một buổi sáng thanh bình tại khu rừng đang thức giấc.', speaker: 'Người kể' },
      { start: 3.8, end: 7, textOriginal: 'Until the mischievous trio plots their next move.', textVi: 'Cho đến khi bộ ba tinh quái bắt đầu bày mưu kế.', speaker: 'Người kể' },
      { start: 7.5, end: 11, textOriginal: 'Big Buck Bunny will not let this stand.', textVi: 'Chú thỏ Bunny khổng lồ sẽ không bỏ qua chuyện này.', speaker: 'Người kể' },
    ],
  };

  const key = Object.keys(templates).find((name) => (videoTitle || '').toLowerCase().includes(name.toLowerCase()));
  if (key) return templates[key].map((item, index) => ({ ...item, id: `sub_fb_${Date.now()}_${index}` }));

  return [
    { id: `sub_fb_${Date.now()}_1`, start: 0.5, end: 3.8, textOriginal: 'In a world where everything changed in an instant...', textVi: 'Trong một thế giới nơi mọi thứ đảo lộn chỉ trong tích tắc...', speaker: 'Dẫn truyện' },
    { id: `sub_fb_${Date.now()}_2`, start: 4.2, end: 7.6, textOriginal: 'We must decide what we are willing to fight for.', textVi: 'Chúng ta phải quyết định mình sẵn sàng chiến đấu vì điều gì.', speaker: 'Nhân vật chính' },
    { id: `sub_fb_${Date.now()}_3`, start: 8, end: 11.5, textOriginal: "There's no turning back now. This is our moment.", textVi: 'Không còn đường lui nữa rồi. Đây chính là thời khắc của chúng ta.', speaker: 'Đồng đội' },
    { id: `sub_fb_${Date.now()}_4`, start: 12, end: 16, textOriginal: 'Stay together, and we will survive this journey.', textVi: 'Hãy sát cánh bên nhau, chúng ta nhất định sẽ vượt qua hành trình này.', speaker: 'Chỉ huy' },
  ];
}

function fallbackVideoProject(topic?: string) {
  const now = Date.now();
  const scenes = [
    {
      id: `ai_scene_${now}_0`, name: 'Cảnh 1: Mở màn ấn tượng', duration: 6, textVi: 'Mỗi hành trình tuyệt vời đều bắt đầu từ một ý tưởng táo bạo.', textOriginal: 'Every great journey begins with a daring vision.', narration: 'Chào mừng bạn đến với thế giới sáng tạo nội dung không giới hạn.', filterPreset: 'cinematic-teal-orange', transitionType: 'fade', soundFxKey: 'whoosh',
    },
    {
      id: `ai_scene_${now}_1`, name: 'Cảnh 2: Đột phá công nghệ', duration: 7, textVi: 'Trí tuệ nhân tạo nâng tầm trải nghiệm dựng phim và phụ đề chuẩn xác.', textOriginal: 'Artificial intelligence elevates precision subtitling and cinema editing.', narration: 'Công nghệ AI giúp bạn biến ý tưởng thành video hoàn chỉnh chỉ trong vài giây.', filterPreset: 'cyberpunk-neon', transitionType: 'zoom-in', soundFxKey: 'boom',
    },
    {
      id: `ai_scene_${now}_2`, name: 'Cảnh 3: Lan tỏa cảm xúc', duration: 6.5, textVi: 'Phụ đề Vietsub đồng bộ mang câu chuyện đến gần hơn với khán giả.', textOriginal: 'Synchronized Vietsub subtitles connect the narrative with global audiences.', narration: 'Từng khung hình, từng giai điệu được chăm chút với độ sắc nét tuyệt đối.', filterPreset: 'moody-film', transitionType: 'slide-left', soundFxKey: 'ding',
    },
    {
      id: `ai_scene_${now}_3`, name: 'Cảnh 4: Kết nối & Hành động', duration: 5.5, textVi: 'Sẵn sàng sáng tạo kiệt tác tiếp theo của chính bạn ngay hôm nay.', textOriginal: 'Ready to produce your next masterpiece today.', narration: 'Hãy bắt đầu dựng phim cùng CapCut Pro AI ngay hôm nay.', filterPreset: 'sunset-glow', transitionType: 'fade', soundFxKey: 'pop',
    },
  ];

  return {
    title: topic ? `AI Video: ${topic}` : 'Hành Trình Khám Phá Điện Ảnh (AI Vietsub)',
    description: 'Kịch bản video tự động hóa với phụ đề Vietsub và hiệu ứng CapCut Pro.',
    backgroundMusicGenre: 'Cinematic Ambient',
    scenes: scenes.map((scene, index) => ({
      ...scene,
      type: STOCK_FOOTAGE_POOL[index % STOCK_FOOTAGE_POOL.length].isImage ? 'image' : 'video',
      src: STOCK_FOOTAGE_POOL[index % STOCK_FOOTAGE_POOL.length].src,
      thumbnail: STOCK_FOOTAGE_POOL[index % STOCK_FOOTAGE_POOL.length].thumbnail,
    })),
  };
}

async function handleSubtitles(env: Record<string, string | undefined>, body: RequestBody) {
  const clipDuration = Number(body.clipDuration || 30);
  const videoTitle = String(body.videoTitle || 'Cinematic Film Clip');
  const prompt = String(body.prompt || 'A dramatic scene with high tension and emotional resonance');
  const customScript = String(body.customScript || '');

  try {
    const data = await generateJson(
      env,
      `Generate cinema subtitles and Vietnamese translation for this video.\nTitle: ${videoTitle}\nContext/Scene: ${prompt}\nLanguage: ${String(body.originalLanguage || 'English')}\nDuration: ${clipDuration} seconds.\nReturn a JSON array where each item has start, end, textOriginal, textVi, and speaker. Keep each line 1.5 to 4.5 seconds and within the clip duration.`,
      'You are a professional cinema subtitle translator and subtitler specializing in Vietnamese localization (Vietsub). Create accurate, natural, high-impact cinema subtitles with realistic timestamps.',
    );

    const subtitles = (Array.isArray(data) ? data : []).map((sub: any, index: number) => ({
      id: sub.id || `sub_${Date.now()}_${index}`,
      start: Number(sub.start || 0),
      end: Number(sub.end || Math.min(clipDuration, 3)),
      textOriginal: String(sub.textOriginal || ''),
      textVi: String(sub.textVi || ''),
      speaker: String(sub.speaker || 'Narrator'),
    }));
    return json({ success: true, subtitles });
  } catch (error) {
    return json({
      success: true,
      subtitles: generateSmartFallbackSubtitles(videoTitle, customScript, clipDuration),
      isFallback: true,
      notice: 'Gemini tạm thời không khả dụng; hệ thống đã chuyển sang bộ phụ đề dự phòng.',
      warning: error instanceof Error ? error.message : String(error),
    });
  }
}

async function handleTts(env: Record<string, string | undefined>, body: RequestBody) {
  const text = String(body.text || '').trim();
  if (!text) return json({ success: false, error: 'Text is required' }, 400);

  const voiceName = String(body.voiceGender || 'female') === 'male' ? 'Puck' : 'Kore';
  const style = String(body.style || 'cinematic');
  const models = ['gemini-3.8-flash-tts', 'gemini-3.8-flash-lite-tts'];
  let lastError: unknown = null;

  for (const model of models) {
    try {
      const payload = await geminiRequest(env, model, {
        contents: [{
          role: 'user',
          parts: [{ text: `Đọc diễn cảm bằng tiếng Việt với phong cách ${style}: "${text}"`, speech_metadata: { style: `Natural, engaging Vietnamese narration (${String(body.voiceGender || 'female')})` } }],
        }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
        },
      });
      const audio = extractAudio(payload);
      if (audio) return json({ success: true, audioBase64: audio.data, mimeType: audio.mimeType || 'audio/wav', provider: 'gemini' });
    } catch (error) {
      lastError = error;
    }
  }

  return json({
    success: true,
    audioBase64: null,
    fallbackText: text,
    provider: 'client_fallback',
    warning: lastError instanceof Error ? lastError.message : undefined,
  });
}

async function handleAudioMix(env: Record<string, string | undefined>, body: RequestBody) {
  try {
    const data = await generateJson(
      env,
      `You are an elite sound designer and mixing engineer. Given these audio tracks: ${JSON.stringify(body.tracks || [])}. Vocal style: ${String(body.vocalType || 'Vietnamese voiceover')}. Background music genre: ${String(body.bgmGenre || 'Cinematic Ambient')}. Return JSON with duckingMusicVolumePct (0-100), duckingAttackMs, duckingReleaseMs, vocalVolumeBoostPct (100-200), eqPreset (vocal_presence | cinema_warm | bass_cut | podcast_clear), and soundDesignTips in Vietnamese.`,
    );
    return json({ success: true, mix: data });
  } catch {
    return json({
      success: true,
      mix: {
        duckingMusicVolumePct: 20,
        duckingAttackMs: 250,
        duckingReleaseMs: 450,
        vocalVolumeBoostPct: 130,
        eqPreset: 'vocal_presence',
        soundDesignTips: 'Tự động giảm nhạc nền xuống 20% khi có giọng đọc thuyết minh để tạo độ rõ nét và chuyên nghiệp.',
      },
      isFallback: true,
    });
  }
}

async function handleCreateVideo(env: Record<string, string | undefined>, body: RequestBody) {
  const topic = String(body.topic || 'Hành trình sáng tạo nội dung số hiện đại');
  const style = String(body.style || 'cinematic');
  const aspectRatio = String(body.aspectRatio || '16:9');
  const durationTarget = Number(body.durationTarget || 24);

  try {
    const projectData = await generateJson(
      env,
      `Create an AI-powered video storyboard with Vietnamese subtitles and narration. Topic: "${topic}". Style: ${style}. Aspect ratio: ${aspectRatio}. Target duration: about ${durationTarget} seconds. Use 3 to 4 sequential scenes. Return JSON with title, description, backgroundMusicGenre, and scenes. Each scene must include name, duration, textVi, textOriginal, narration, filterPreset, transitionType, soundFxKey.`,
      'You are an elite video director and CapCut video producer. Keep the storyboard concise and production-ready.',
    );

    const scenes = (Array.isArray(projectData.scenes) ? projectData.scenes : []).map((scene: any, index: number) => {
      const asset = STOCK_FOOTAGE_POOL[index % STOCK_FOOTAGE_POOL.length];
      return {
        ...scene,
        id: `ai_scene_${Date.now()}_${index}`,
        type: asset.isImage ? 'image' : 'video',
        src: asset.src,
        thumbnail: asset.thumbnail,
      };
    });

    return json({ success: true, project: { ...projectData, scenes } });
  } catch {
    return json({ success: true, project: fallbackVideoProject(topic), isFallback: true });
  }
}

async function handleTranscribe(env: Record<string, string | undefined>, body: RequestBody) {
  const inputPrompt = String(body.inputPrompt || body.rawAudioTranscript || 'Hội thoại thường ngày trong phim điện ảnh');
  const videoTitle = String(body.videoTitle || 'Audio Track');
  const sourceLang = String(body.sourceLang || 'auto');

  try {
    const data = await generateJson(
      env,
      `Transcribe and generate timed Vietnamese subtitles from the provided speech/audio description. Video/Audio Title: "${videoTitle}". Source Language: ${sourceLang}. User Audio/Topic Description: "${inputPrompt}". Break dialogue into natural subtitle segments, each line under 40 characters for cinema. Return JSON with detectedLanguage, summary, speakersCount, and subtitles. Each subtitle must have start, end, textVi, textOriginal, speaker.`,
      'You are an automated transcription system and professional film subtitler.',
    );
    const subtitles = (Array.isArray(data.subtitles) ? data.subtitles : []).map((sub: any, index: number) => ({
      id: `stt_${Date.now()}_${index}`,
      start: Number(sub.start || index * 3.5),
      end: Number(sub.end || (index + 1) * 3.5),
      textVi: String(sub.textVi || ''),
      textOriginal: String(sub.textOriginal || ''),
      speaker: String(sub.speaker || 'Thuyết minh'),
    }));
    return json({
      success: true,
      detectedLanguage: String(data.detectedLanguage || 'Tự động nhận diện'),
      summary: String(data.summary || 'Đã phiên âm và tạo phụ đề Vietsub thành công'),
      speakersCount: Number(data.speakersCount || 2),
      subtitles,
    });
  } catch {
    const subtitles = [
      { id: `stt_${Date.now()}_0`, start: 0.8, end: 4.2, textVi: 'Xin chào các bạn, chào mừng đến với phiên bản lồng tiếng tự động.', textOriginal: 'Hello everyone, welcome to the automatic voiceover version.', speaker: 'Người nói 1' },
      { id: `stt_${Date.now()}_1`, start: 4.8, end: 8.5, textVi: 'Hệ thống nhận diện giọng nói và chuyển âm thanh thành phụ đề cực kỳ chuẩn xác.', textOriginal: 'The speech recognition system transcribes audio into subtitles with high precision.', speaker: 'Người nói 2' },
      { id: `stt_${Date.now()}_2`, start: 9, end: 13.2, textVi: 'Bạn không cần phải dán mắt đọc chữ nữa, AI sẽ tự động thuyết minh trực tiếp.', textOriginal: 'No need to read subtitles anymore, AI will voice over automatically.', speaker: 'Thuyết minh AI' },
      { id: `stt_${Date.now()}_3`, start: 13.8, end: 18, textVi: 'Mọi đoạn hội thoại đều được đồng bộ từng khung hình với âm thanh đa kênh.', textOriginal: 'All dialogues are synced frame by frame with multi-channel audio.', speaker: 'Người nói 1' },
    ];
    return json({ success: true, detectedLanguage: 'Tiếng Anh (Mô hình nhận diện)', summary: 'Phiên âm tự động hoàn tất với phụ đề tiếng Việt', speakersCount: 2, subtitles, isFallback: true });
  }
}

async function handleEnhanceVietnamese(env: Record<string, string | undefined>, body: RequestBody) {
  const subtitles = Array.isArray(body.subtitles) ? body.subtitles : [];
  const mode = String(body.mode || 'restore_diacritics');
  try {
    const data = await generateJson(
      env,
      `Perform "${mode}" on the following Vietnamese subtitles. Modes: restore_diacritics (restore missing accents and normalize spelling); cinema_tone (rewrite into cinematic Vietnamese dialogue); smart_split (split long lines under 38 characters). Preserve id, start, end, textOriginal and return polished textVi. Input: ${JSON.stringify(subtitles)}`,
      'You are a master Vietnamese linguist and cinematic subtitler.',
    );
    return json({ success: true, subtitles: Array.isArray(data.subtitles) ? data.subtitles : subtitles });
  } catch {
    return json({ success: true, subtitles, isFallback: true });
  }
}

export const onRequest = async (context: any): Promise<Response> => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (context.request.method !== 'POST') {
    return json({ success: false, error: 'Method Not Allowed' }, 405);
  }

  const action = String(context.params?.action || '');
  const body = await readBody(context.request);
  const env = context.env as Record<string, string | undefined>;

  switch (action) {
    case 'subtitles':
      return handleSubtitles(env, body);
    case 'tts':
      return handleTts(env, body);
    case 'audio-mix':
      return handleAudioMix(env, body);
    case 'create-video':
      return handleCreateVideo(env, body);
    case 'transcribe':
      return handleTranscribe(env, body);
    case 'enhance-vietnamese':
      return handleEnhanceVietnamese(env, body);
    default:
      return json({ success: false, error: `Unknown Gemini action: ${action}` }, 404);
  }
};
