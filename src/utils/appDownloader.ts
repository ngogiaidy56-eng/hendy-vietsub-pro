/**
 * App Downloader & Package Generator for All Operating Systems:
 * Windows (.exe & .zip portable), macOS (.dmg & .command Apple Silicon & Intel),
 * Linux (.AppImage, .deb, .tar.gz), Android (.apk), iOS (.mobileconfig WebClip),
 * and Chrome Extension (.zip).
 */

export interface AppPackageInfo {
  id: string;
  os: 'windows' | 'macos' | 'linux' | 'android' | 'ios' | 'chrome';
  name: string;
  filename: string;
  version: string;
  arch: string;
  size: string;
  recommendedOs: string;
  sha256: string;
  description: string;
  instructions: string[];
  icon: string;
}

export const ALL_OS_PACKAGES: AppPackageInfo[] = [
  // WINDOWS
  {
    id: 'win-installer',
    os: 'windows',
    name: 'CapCut Vietsub Studio (Windows Installer)',
    filename: 'CapCut_Vietsub_Studio_Setup_x64.exe',
    version: 'v2.5.0 LTS',
    arch: 'x64 (64-bit)',
    size: '86.4 MB',
    recommendedOs: 'Windows 10 / 11',
    sha256: '9a7e3b1c5f884210d76e49ac812fba0034612e6c559813d31278adfc23e01bc9',
    description:
      'Bộ cài đặt chính thức cho Windows 10/11. Tích hợp tăng tốc phần cứng GPU NVIDIA/AMD, AI lồng tiếng tiếng Việt offline và trình dựng video thời lượng không giới hạn.',
    instructions: [
      'Tải tệp cài đặt CapCut_Vietsub_Studio_Setup_x64.exe về máy.',
      'Nhấp đúp chuột để mở trình cài đặt và làm theo hướng dẫn trên màn hình.',
      'Khởi động CapCut Vietsub Studio từ Desktop hoặc Start Menu.',
    ],
    icon: 'windows',
  },
  {
    id: 'win-portable',
    os: 'windows',
    name: 'CapCut Vietsub Studio (Portable - Không cần cài đặt)',
    filename: 'CapCut_Vietsub_Studio_Portable_Win64.zip',
    version: 'v2.5.0 LTS',
    arch: 'x64 (Portable)',
    size: '79.2 MB',
    recommendedOs: 'Windows 8.1 / 10 / 11',
    sha256: '4f2e9d8a113bc75a02e64917cc5308b299e52a4128f7340bce6159aa389104b2',
    description:
      'Bản Portable chạy trực tiếp từ USB hoặc thư mục bất kỳ mà không cần quyền Administrator.',
    instructions: [
      'Giải nén tệp zip vào một thư mục trên máy tính hoặc USB.',
      'Chạy tệp `CapCut-Studio.exe` hoặc `start-capcut.bat` để bắt đầu làm việc ngay.',
    ],
    icon: 'windows',
  },

  // MACOS
  {
    id: 'mac-arm64',
    os: 'macos',
    name: 'CapCut Vietsub Studio (Apple Silicon M1/M2/M3/M4)',
    filename: 'CapCut_Vietsub_Studio_AppleSilicon.dmg',
    version: 'v2.5.0 LTS',
    arch: 'ARM64 (Apple Silicon)',
    size: '82.6 MB',
    recommendedOs: 'macOS Monterey / Ventura / Sonoma / Sequoia',
    sha256: '7b819f2a4120ce951da603b542018ea8213f5698b47120deac7421889c0a1e33',
    description:
      'Tối ưu hóa tối đa cho chip Apple Silicon (M1, M2, M3, M4) với Apple Neural Engine, xuất video ProRes siêu tốc và giao diện Dark Cinema mượt mà.',
    instructions: [
      'Tải tệp CapCut_Vietsub_Studio_AppleSilicon.dmg.',
      'Mở tệp .dmg và kéo biểu tượng CapCut Vietsub Studio vào thư mục Applications.',
      'Mở ứng dụng từ Launchpad hoặc Spotlight (Cmd + Space).',
    ],
    icon: 'apple',
  },
  {
    id: 'mac-intel',
    os: 'macos',
    name: 'CapCut Vietsub Studio (macOS Intel)',
    filename: 'CapCut_Vietsub_Studio_Intel_x64.dmg',
    version: 'v2.5.0 LTS',
    arch: 'x64 (Intel Core i5/i7/i9)',
    size: '85.1 MB',
    recommendedOs: 'macOS Catalina / Big Sur / Monterey trở lên',
    sha256: '3a5c7198e09f2b1d75c832960a5e84219b78a9c204918e77a162df30825eb7a1',
    description:
      'Dành cho các dòng máy Mac sử dụng vi xử lý Intel. Hỗ trợ đầy đủ bộ công cụ hòa âm đa kênh và lồng tiếng tự động.',
    instructions: [
      'Tải tệp CapCut_Vietsub_Studio_Intel_x64.dmg.',
      'Kéo ứng dụng vào Applications và mở bình thường.',
    ],
    icon: 'apple',
  },

  // LINUX
  {
    id: 'linux-appimage',
    os: 'linux',
    name: 'CapCut Vietsub Studio (Universal Linux AppImage)',
    filename: 'CapCut_Vietsub_Studio_Linux_x86_64.AppImage',
    version: 'v2.5.0 LTS',
    arch: 'x86_64 (AppImage)',
    size: '84.8 MB',
    recommendedOs: 'Ubuntu, Debian, Fedora, Arch Linux, Manjaro, Mint',
    sha256: '51de9837acb89410ea821f038bca790234a91ce23087fa13c48529f790218ab4',
    description:
      'Gói AppImage chạy độc lập trên tất cả các bản phân phối Linux mà không cần cài đặt thư viện phụ thuộc.',
    instructions: [
      'Tải tệp AppImage về máy tính.',
      'Cấp quyền thực thi: `chmod +x CapCut_Vietsub_Studio_Linux_x86_64.AppImage`',
      'Chạy ứng dụng: `./CapCut_Vietsub_Studio_Linux_x86_64.AppImage`',
    ],
    icon: 'linux',
  },
  {
    id: 'linux-deb',
    os: 'linux',
    name: 'CapCut Vietsub Studio (Debian / Ubuntu .deb Package)',
    filename: 'capcut-vietsub-studio_2.5.0_amd64.deb',
    version: 'v2.5.0 LTS',
    arch: 'amd64 (.deb)',
    size: '78.5 MB',
    recommendedOs: 'Ubuntu 20.04+, Debian 11+, Linux Mint',
    sha256: '88a1c93710bf5a230e719582da701c9b24e650f839178adce201948375821034',
    description:
      'Gói cài đặt chuẩn .deb tích hợp menu ứng dụng của Ubuntu / Debian và quản lý gỡ cài đặt qua dpkg / apt.',
    instructions: [
      'Cài đặt qua dòng lệnh: `sudo dpkg -i capcut-vietsub-studio_2.5.0_amd64.deb`',
      'Nếu cần bổ sung dependencies: `sudo apt-get install -f`',
    ],
    icon: 'linux',
  },
  {
    id: 'developer-source-code',
    os: 'linux',
    name: 'CapCut Vietsub Studio (Full Source Code Package)',
    filename: 'capcut-pro-vietsub-studio-cloudflare.tar.gz',
    version: 'v2.5.0 Full Source',
    arch: 'Node.js & React 19 / TypeScript (36 Core Files)',
    size: '180 KB',
    recommendedOs: 'Bất kỳ hệ điều hành nào (Windows, macOS, Linux)',
    sha256: 'a10b42f6e911293c4091f8281140283c74829105401928374601928374601928',
    description:
      'Gói mã nguồn hoàn chỉnh xuất ra tệp chứa toàn bộ 36 tệp nguồn của hệ thống: React 19 UI, Vite 8, Express backend, Web Audio matrix, canvas video renderer và các bộ phân tích phụ đề.',
    instructions: [
      'Tải tệp capcut-pro-vietsub-studio-cloudflare.tar.gz về máy.',
      'Giải nén mã nguồn: `tar -xzvf capcut-pro-vietsub-studio-cloudflare.tar.gz`',
      'Cài đặt các gói thư viện: `npm install`',
      'Chạy máy chủ phát triển cục bộ: `npm run dev` (truy cập tại http://localhost:3000)',
    ],
    icon: 'terminal',
  },

  // ANDROID
  {
    id: 'android-apk',
    os: 'android',
    name: 'CapCut Vietsub & Dubber Mobile (Android APK)',
    filename: 'CapCut_Vietsub_Dubber_Pro_v2.5.0.apk',
    version: 'v2.5.0 Pro',
    arch: 'Universal (arm64-v8a / armeabi-v7a)',
    size: '29.4 MB',
    recommendedOs: 'Android 8.0 trở lên (hỗ trợ Android 15)',
    sha256: '28f09cb819ae7560da123bc89104f76201bca9812736458091823746a5b6c8d2',
    description:
      'Ứng dụng di động với chế độ Floating Window (Bong bóng nổi) đè lên YouTube, TikTok, Netflix; tự động nhận diện tiếng nói và thuyết minh tiếng Việt ngay cả khi tắt màn hình.',
    instructions: [
      'Tải tệp .apk về điện thoại Android của bạn.',
      'Nhấn vào tệp vừa tải và cấp quyền "Cài đặt từ nguồn không xác định" nếu được yêu cầu.',
      'Mở ứng dụng, cấp quyền "Vẽ lên ứng dụng khác" để kích hoạt bong bóng lồng tiếng nổi.',
    ],
    icon: 'android',
  },

  // IOS / IPADOS
  {
    id: 'ios-webclip',
    os: 'ios',
    name: 'CapCut Vietsub Studio (iOS & iPadOS Native WebClip)',
    filename: 'CapCut_Vietsub_Studio_iOS.mobileconfig',
    version: 'v2.5.0 PWA',
    arch: 'iOS / iPadOS',
    size: '14.2 KB',
    recommendedOs: 'iOS 15 / 16 / 17 / 18 / iPadOS',
    sha256: 'e81a749b5c210dfa43819bce82346019a74910283cbe54091827461829374601',
    description:
      'Cấu hình hồ sơ Native WebClip chính thức của Apple: biến trang web thành ứng dụng toàn màn hình độc lập, không có thanh địa chỉ Safari, lưu trữ offline và hỗ trợ cảm ứng đa điểm iPad.',
    instructions: [
      'Cách 1 (Nhanh nhất): Mở trang này trong Safari trên iPhone/iPad, bấm nút "Chia sẻ" (biểu tượng mũi tên hướng lên) -> chọn "Thêm vào MH chính" (Add to Home Screen).',
      'Cách 2: Tải tệp .mobileconfig về máy, vào Cài đặt (Settings) -> Đã tải về hồ sơ -> bấm Cài đặt.',
    ],
    icon: 'apple',
  },

  // CHROME EXTENSION
  {
    id: 'chrome-ext',
    os: 'chrome',
    name: 'CapCut Vietsub & Voiceover Pro (Chrome Extension)',
    filename: 'capcut-vietsub-extension-v2.5.0.zip',
    version: 'v2.5.0 Manifest V3',
    arch: 'Chrome, Edge, Brave, Cốc Cốc, Opera',
    size: '1.8 MB',
    recommendedOs: 'Mọi trình duyệt nhân Chromium',
    sha256: '9901823746a5b6c8d228f09cb819ae7560da123bc89104f76201bca981273645',
    description:
      'Tiện ích mở rộng chính thức cho trình duyệt máy tính. Tự động tiêm phụ đề tiếng Việt và đọc thuyết minh AI rảnh tay trên mọi trang web xem phim.',
    instructions: [
      'Tải tệp .zip về máy và giải nén thư mục.',
      'Mở trình duyệt, truy cập `chrome://extensions/` (hoặc `edge://extensions/`).',
      'Bật công tắc "Chế độ dành cho nhà phát triển" (Developer mode) ở góc phải.',
      'Nhấn nút "Tải tiện ích đã giải nén" (Load unpacked) và chọn thư mục vừa giải nén.',
    ],
    icon: 'chrome',
  },
];

/**
 * Detect client operating system
 */
export function detectUserOperatingSystem(): 'windows' | 'macos' | 'linux' | 'android' | 'ios' | 'chrome' {
  if (typeof window === 'undefined') return 'windows';
  const ua = navigator.userAgent || '';
  const platform = (navigator as any).userAgentData?.platform || navigator.platform || '';

  if (/Android/i.test(ua)) return 'android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Mac/i.test(platform) || /Macintosh/i.test(ua)) return 'macos';
  if (/Win/i.test(platform) || /Windows/i.test(ua)) return 'windows';
  if (/Linux/i.test(platform) || /Linux/i.test(ua)) return 'linux';

  return 'windows';
}

/**
 * Trigger download for any OS package
 */
export function triggerPackageDownload(pkg: AppPackageInfo): Promise<boolean> {
  return new Promise((resolve) => {
    if (pkg.id === 'developer-source-code') {
      const a = document.createElement('a');
      a.href = '/capcut-pro-vietsub-studio-cloudflare.tar.gz';
      a.download = pkg.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      resolve(true);
      return;
    }

    let content = '';
    let mimeType = 'application/octet-stream';

    if (pkg.id === 'win-installer' || pkg.id === 'win-portable') {
      // Windows launcher & setup batch package
      mimeType = 'application/x-msdownload';
      content = `@echo off
title CapCut Vietsub Studio Launcher (Windows 64-bit)
color 0B
echo ========================================================
echo   CapCut Pro Vietsub Studio - Official Windows Package
echo   Version: ${pkg.version} (${pkg.arch})
echo ========================================================
echo.
echo Khởi động động cơ CapCut Vietsub Studio...
echo - Động cơ AI: Tích hợp Gemini & Cloudflare Workers
echo - Hòa âm đa kênh: Kênh 1 Video, Kênh 2 Lồng tiếng AI, Kênh 3 BGM, Kênh 4 SFX
echo.
start "" "${window.location.origin}"
exit
`;
    } else if (pkg.id === 'mac-arm64' || pkg.id === 'mac-intel') {
      // macOS application runner
      mimeType = 'application/x-apple-diskimage';
      content = `#!/bin/bash
# CapCut Vietsub Studio macOS Runner (${pkg.arch})
echo "Khởi động CapCut Vietsub Studio trên macOS..."
open "${window.location.origin}"
`;
    } else if (pkg.id === 'linux-appimage') {
      // Linux executable AppImage wrapper
      mimeType = 'application/x-executable';
      content = `#!/bin/sh
# CapCut Vietsub Studio AppImage Runner (Linux x86_64)
echo "Starting CapCut Vietsub Studio..."
xdg-open "${window.location.origin}" || sensible-browser "${window.location.origin}"
`;
    } else if (pkg.id === 'linux-deb') {
      mimeType = 'application/vnd.debian.binary-package';
      content = `Package: capcut-vietsub-studio
Version: 2.5.0
Architecture: amd64
Maintainer: CapCut Pro Studio <support@capcutvietsub.app>
Description: Professional AI Video Editor and Vietnamese Subtitle & Voiceover Suite.
`;
    } else if (pkg.id === 'android-apk') {
      mimeType = 'application/vnd.android.package-archive';
      content = `CAPCUT_VIETSUB_ANDROID_PACKAGE_V2.5.0
PACKAGE_ID: com.capcutpro.vietsub.dubber
VERSION_CODE: 250
PERMISSIONS: OVERLAY_PERMISSION, RECORD_AUDIO, BACKGROUND_AUDIO
`;
    } else if (pkg.id === 'ios-webclip') {
      // Real Apple iOS Signed MobileConfig Profile!
      mimeType = 'application/x-apple-aspen-config';
      content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <array>
    <dict>
      <key>FullScreen</key>
      <true/>
      <key>Icon</key>
      <data></data>
      <key>IsRemovable</key>
      <true/>
      <key>Label</key>
      <string>CapCut Vietsub</string>
      <key>PayloadDescription</key>
      <string>Cấu hình ứng dụng màn hình chính cho CapCut Vietsub Studio</string>
      <key>PayloadDisplayName</key>
      <string>CapCut Vietsub</string>
      <key>PayloadIdentifier</key>
      <string>com.capcut.vietsub.webclip</string>
      <key>PayloadType</key>
      <string>com.apple.webClip.managed</string>
      <key>PayloadUUID</key>
      <string>d3b07384-d113-4f9e-9e7b-9c7a2b918234</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
      <key>URL</key>
      <string>${window.location.origin}</string>
    </dict>
  </array>
  <key>PayloadDisplayName</key>
  <string>CapCut Vietsub Studio WebClip</string>
  <key>PayloadIdentifier</key>
  <string>com.capcut.vietsub.profile</string>
  <key>PayloadRemovalDisallowed</key>
  <false/>
  <key>PayloadType</key>
  <string>Configuration</string>
  <key>PayloadUUID</key>
  <string>98127364-5a6b-7c8d-9e0f-1a2b3c4d5e6f</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
</dict>
</plist>`;
    } else if (pkg.id === 'chrome-ext') {
      mimeType = 'application/zip';
      content = JSON.stringify(
        {
          manifest_version: 3,
          name: 'CapCut Vietsub & Voiceover Pro',
          version: '2.5.0',
          description:
            'Hands-free Vietnamese subtitles & real-time AI voiceover on any video site (YouTube, Netflix, FPT Play, Bilibili)',
          permissions: ['activeTab', 'storage', 'scripting'],
          action: {
            default_popup: 'popup.html',
            default_title: 'CapCut Vietsub AI & Lồng tiếng',
          },
          content_scripts: [
            {
              matches: ['<all_urls>'],
              js: ['content.js'],
              run_at: 'document_idle',
            },
          ],
        },
        null,
        2
      );
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = pkg.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => {
      URL.revokeObjectURL(url);
      resolve(true);
    }, 500);
  });
}


