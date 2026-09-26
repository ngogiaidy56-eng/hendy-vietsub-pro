import { VideoClip, AudioClip, SubtitleSegment, SoundFxItem } from '../types/editor';

export const SAMPLE_VIDEOS = [
  {
    id: 'sample_tos',
    title: 'Tears of Steel (Sci-Fi Robot Action)',
    description: 'Blender Foundation open movie - futuristic Amsterdam battle scene with VFX robotics.',
    duration: 32,
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
    originalLang: 'English',
    sampleScript: `Celia: What are you doing here, Thom?
Thom: I came to stop you before the rocket launches.
Celia: You never understood what we were building here.
Thom: It's not about understanding. It's about saving what remains of our world.`,
  },
  {
    id: 'sample_sintel',
    title: 'Sintel (Fantasy Dragon Quest)',
    description: 'Blender Foundation open movie - emotional quest through snowy mountains and desert ruins.',
    duration: 52,
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    originalLang: 'English',
    sampleScript: `Narrator: A lone wanderer traverses the biting winter blizzard.
Sintel: Scales... it was a baby dragon with emerald wings.
Elder: Searching for a beast will only bring sorrow to the mountains.
Sintel: I promised I would find him, no matter how far.`,
  },
  {
    id: 'sample_bbb',
    title: 'Big Buck Bunny (Classic 3D Animation)',
    description: 'Blender Foundation open movie - peaceful forest morning interrupted by mischievous forest critters.',
    duration: 33,
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    originalLang: 'English',
    sampleScript: `Narrator: The morning sunlight warms the tranquil meadow.
Bunny: What a peaceful day to pick sweet wildflowers.
Squirrel: Hey Frank! Target acquired, prepare the acorns!
Narrator: But peace in this forest never lasts for long.`,
  },
  {
    id: 'sample_cyber',
    title: 'Cyberpunk Tokyo Night (Cinematic 4K)',
    description: 'Neon billboards, rain reflections, and futuristic Tokyo Shibuya aesthetic.',
    duration: 20,
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    originalLang: 'English',
    sampleScript: `Narrator: Tokyo at midnight pulses with pure neon electricity.
Speaker: In 2077, information flows faster than light down every alleyway.
Voiceover: Welcome to the city that never powers down.`,
  },
];

export const SOUND_FX_LIBRARY: SoundFxItem[] = [
  {
    id: 'sfx_whoosh',
    name: 'Whoosh Transition',
    category: 'Transition',
    description: 'CapCut fast cinematic sweep for scene transitions',
    duration: 0.5,
    sfxKey: 'whoosh',
  },
  {
    id: 'sfx_ding',
    name: 'Crystal Ding',
    category: 'UI & Pop',
    description: 'Satisfying notification & point chime',
    duration: 1.0,
    sfxKey: 'ding',
  },
  {
    id: 'sfx_pop',
    name: 'Bubble Pop',
    category: 'UI & Pop',
    description: 'Playful UI popup & text pop-in sound',
    duration: 0.2,
    sfxKey: 'pop',
  },
  {
    id: 'sfx_boom',
    name: 'Cinematic Sub Boom',
    category: 'Cinematic',
    description: 'Deep 808 sub bass trailer impact',
    duration: 1.2,
    sfxKey: 'boom',
  },
  {
    id: 'sfx_shutter',
    name: 'Camera Shutter Click',
    category: 'Camera & Tech',
    description: 'Realistic double-click DSLR mechanical shutter',
    duration: 0.3,
    sfxKey: 'shutter',
  },
  {
    id: 'sfx_glitch',
    name: 'Cyber Glitch Distortion',
    category: 'Camera & Tech',
    description: 'High-tech stuttering digital noise burst',
    duration: 0.4,
    sfxKey: 'glitch',
  },
  {
    id: 'sfx_swoosh',
    name: 'Airy Swoosh',
    category: 'Transition',
    description: 'Smooth wind pan for text animations',
    duration: 0.5,
    sfxKey: 'swoosh',
  },
];

export const INITIAL_VIDEO_CLIPS: VideoClip[] = [
  {
    id: 'clip_1',
    type: 'video',
    name: 'Tears of Steel - Opening Action',
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
    startTime: 0,
    duration: 12.0,
    sourceStart: 5.0,
    sourceDuration: 32.0,
    volume: 100,
    isMuted: false,
    transform: {
      rotation: 0,
      flipH: false,
      flipV: false,
      scale: 1.0,
      x: 0,
      y: 0,
    },
    filter: {
      preset: 'cinematic-teal-orange',
      brightness: 105,
      contrast: 110,
      saturation: 115,
      temperature: -10,
      vignette: 25,
    },
    transition: {
      type: 'fade',
      duration: 0.5,
    },
  },
  {
    id: 'clip_2',
    type: 'video',
    name: 'Sintel - Mountain Ridge',
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    startTime: 12.0,
    duration: 10.0,
    sourceStart: 18.0,
    sourceDuration: 52.0,
    volume: 90,
    isMuted: false,
    transform: {
      rotation: 0,
      flipH: false,
      flipV: false,
      scale: 1.0,
      x: 0,
      y: 0,
    },
    filter: {
      preset: 'moody-film',
      brightness: 100,
      contrast: 115,
      saturation: 90,
      temperature: -15,
      vignette: 35,
    },
    transition: {
      type: 'slide-left',
      duration: 0.5,
    },
  },
];

export const INITIAL_SUBTITLES: SubtitleSegment[] = [
  {
    id: 'sub_1',
    start: 0.5,
    end: 4.2,
    textOriginal: 'What are you doing here, Thom? The storm is coming.',
    textVi: 'Anh đang làm gì ở đây vậy Thom? Cơn bão sắp kéo đến rồi.',
    speaker: 'Celia',
  },
  {
    id: 'sub_2',
    start: 4.8,
    end: 8.5,
    textOriginal: 'I came to stop you before the rocket launches into the sky.',
    textVi: 'Tôi đến để ngăn cô trước khi quả tên lửa phóng lên bầu trời.',
    speaker: 'Thom',
  },
  {
    id: 'sub_3',
    start: 9.0,
    end: 13.5,
    textOriginal: 'You never understood what we were truly building together.',
    textVi: 'Cô chưa từng hiểu những gì chúng ta đã cùng nhau gầy dựng.',
    speaker: 'Celia',
  },
  {
    id: 'sub_4',
    start: 14.0,
    end: 18.2,
    textOriginal: 'It is about saving what remains of our fragile world.',
    textVi: 'Vấn đề là cứu lấy những gì còn sót lại của thế giới mong manh này.',
    speaker: 'Thom',
  },
  {
    id: 'sub_5',
    start: 18.8,
    end: 22.0,
    textOriginal: 'Then prepare yourself, because there is no turning back.',
    textVi: 'Vậy thì hãy sẵn sàng đi, vì sẽ không có đường quay lại nữa đâu.',
    speaker: 'Elder',
  },
];

export const INITIAL_AUDIO_CLIPS: AudioClip[] = [
  {
    id: 'audio_sfx_1',
    name: 'Whoosh Transition FX',
    type: 'sfx',
    src: 'whoosh',
    startTime: 11.8,
    duration: 0.5,
    volume: 85,
    isMuted: false,
    color: '#38bdf8',
    waveform: [20, 35, 60, 95, 80, 45, 20],
  },
  {
    id: 'audio_sfx_2',
    name: 'Cinematic Sub Boom FX',
    type: 'sfx',
    src: 'boom',
    startTime: 0.0,
    duration: 1.2,
    volume: 95,
    isMuted: false,
    color: '#ec4899',
    waveform: [90, 85, 70, 50, 40, 30, 15],
  },
];


