# 🎸 EasyTuna — Musical Instrument Tuner for Android & Web

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Android%20%7C%20Web-blue?style=for-the-badge&logo=android" alt="Platform" />
  <img src="https://img.shields.io/badge/Engine-Web%20Audio%20%2B%20YIN-success?style=for-the-badge" alt="Audio Engine" />
  <img src="https://img.shields.io/badge/Language-TypeScript%20%7C%20React-61dafb?style=for-the-badge&logo=react" alt="Tech" />
  <img src="https://img.shields.io/badge/License-MIT-purple?style=for-the-badge" alt="License" />
</p>

**EasyTuna** is a modern, high-precision instrument tuner application for 6-string guitar, bass guitar, and ukulele. Inspired by the intuitive interface of *GuitarTuna*, it features a distinctive headstock layout, automatic note detection, and an airy soft pastel aesthetic with instant theme switching.

---

## ✨ Features

### 🎯 1. GuitarTuna-Inspired Intelligent Tuner
- **Interactive Headstock View**: Fully vectorized SVG guitar headstock with classic dual-arch contours, tuning posts, chrome shafts, and strings running smoothly through a bone nut down to the fretboard.
- **True YIN Algorithm (de Cheveigné & Kawahara)**: High-precision DSP pitch detection in the time domain, eliminating tapering bias and octave hopping (verified with 0.00 Hz target frequency error on standard guitar and bass strings).
- **Attack-Lock State Machine**:
  - Automatically identifies and locks onto a plucked string upon strike onset ($\Delta\text{RMS}$).
  - Holds the target note steady during decay without erratic needle swings from ambient room noise.
  - Seamlessly switches to another string only upon a distinct new strike or after a 1.4-second silence timeout.
- **Smooth Cents Deviation Meter**: Ranging from `-50` to `+50` cents with adaptive needle damping. Illuminates with a soft emerald glow, chime, and haptic feedback when in tune (within $\pm 3$ cents).
- **Reference Tone Synthesizer**: Tap any tuning peg to hear a realistic acoustic pluck of that string.

### 🎨 2. Airy Pastel Design System & Themes
- **Airy Pastel (Default)**: Soft morning sky gradients (`#F3F7FD` to `#EFE8FA`), frosted glassmorphic cards (`backdrop-filter: blur(16px)`), lavender-blue accents, and gentle diffused shadows.
- **Midnight Dark**: Sleek, high-contrast dark theme with glowing neon strings.
- **Mint Breeze**: Fresh pastel sage and eucalyptus tones.
- Instant theme switching powered by CSS Custom Properties (`tokens.css`) without re-rendering the app core.

### 📚 3. Extensible Instruments Catalog
- **6-String Guitar**: *Standard E*, *Drop D*, *Half-step down (Eb)*.
- **4-String Bass Guitar**: Low-register support down to $E_1$ (41.20 Hz).
- **Ukulele (Soprano/Concert)**: $G_4$ - $C_4$ - $E_4$ - $A_4$.
- **Upcoming Presets**: 7-string guitar, 12-string guitar, violin (stubs ready in configuration).
- **Desktop Friendly Navigation**: Category tabs feature mouse-wheel scrolling (with page vertical scroll lock), drag-to-scroll swiping, and quick-navigation arrow buttons.

---

## 🛠 Technology Stack

- **Frontend Core**: React 19, TypeScript, Vite
- **Styling**: Vanilla CSS with semantic Design Tokens & CSS Variables
- **Audio Engine**: Web Audio API (`AudioContext`, `AnalyserNode`) + custom YIN pitch detection module
- **Mobile Container**: Capacitor 8 (Android platform wrapper with hardware permissions for audio recording and haptics)
- **Icons**: Lucide React

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm / yarn

### Local Web Development
```bash
# Clone the repository
git clone https://github.com/Lumi4s/EasyTuna.git
cd EasyTuna

# Install dependencies
npm install

# Start local dev server
npm run dev
```
Open [http://localhost:3000/](http://localhost:3000/) in your browser.

---

## 📱 Download & Android Build

### Download Pre-built APK
The compiled and signed debug APK is available directly in GitHub Releases:  
👉 **[Download EasyTuna-v1.0.apk](../../releases)**

### Build APK from Source
```bash
# 1. Build web distribution bundle and sync with native Android
npm run build
npx cap sync

# 2. Compile APK using Gradle wrapper
cd android
./gradlew assembleDebug
```
The output APK will be generated at:  
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## 📂 Project Structure

```
EasyTuna/
├── android/                 # Native Android Capacitor wrapper & Gradle setup
├── src/
│   ├── audio/              # Pitch detection & sound synthesis engine
│   │   ├── PitchDetector.ts # YIN algorithm with sub-sample parabolic interpolation
│   │   ├── AudioEngine.ts   # Attack-Lock state machine, median filter, mic stream
│   │   ├── PitchUtils.ts    # Cents, musical notes, and frequency math
│   │   └── ToneGenerator.ts # Plucked string audio synthesizer
│   ├── config/             # Declarative instrument & tuning definitions
│   │   └── instruments.ts
│   ├── context/            # Global state (TunerContext & ThemeContext)
│   ├── components/         # Modular UI components (HeadstockView, PitchMeter, etc.)
│   ├── views/              # Pages: TunerView, InstrumentsView, SettingsView
│   ├── styles/             # CSS design tokens (tokens.css, App.css)
│   └── App.tsx
├── README.md
└── RELEASE_NOTES.md
```

---

<p align="center">
  <sub><font color="#8b949e">Designed and implemented with the assistance of Gemini 3.8 Flash (High) in accordance with modern engineering standards.</font></sub>
</p>
