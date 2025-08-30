# Prompt Hunter 🎮

A retro pixel-art RPG-style game where you battle AI monsters by solving programming and creative challenges. Built with React, TypeScript, and Canvas 2D - no backend required!

![Prompt Hunter Gameplay](https://img.shields.io/badge/Status-Active-brightgreen)
![React](https://img.shields.io/badge/React-19.1.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## 🎯 Overview

Prompt Hunter combines educational programming challenges with classic RPG combat mechanics. Players choose from 8 unique character classes, each with distinct abilities and challenges, then battle monsters by solving real-world programming problems, creative writing tasks, and logic puzzles.

### Key Features
- **8 Unique Character Classes** with different stats and specialties
- **Real-time Combat System** with HP-based battles
- **AI-Powered Validation** using Google Gemini for creative challenges
- **Progressive Difficulty** from Easy to Impossible
- **Pixel Art Aesthetics** with retro gaming vibes
- **Mobile-First Design** with responsive Canvas rendering
- **No Backend Required** - runs entirely in the browser

## 📖 About the Project

## Inspiration

Prompt Hunter was born from a simple observation: **programming education often feels like homework rather than an adventure**. Traditional coding challenges lack the emotional engagement that makes learning stick. I wanted to create something that would make developers excited to practice their skills.

The core inspiration came from classic RPG games like *Final Fantasy* and *Pokémon*, where character progression and combat mechanics create addictive gameplay loops. What if we could apply that same psychological reward system to programming education? The goal was to create a game where learning feels like playing, failure is fun, and success is satisfying.

## What it does

Prompt Hunter is a retro pixel-art RPG where players battle AI monsters by solving real programming and creative challenges. The game features:

- **8 Unique Character Classes** with different stats and specialties (Engineer, Bard, Necromancer, Alchemist, Hacker, Detective, Healer, Mysterious)
- **Real-time Combat System** where monsters attack every 5 seconds and players must solve challenges to deal damage
- **AI-Powered Validation** using Google Gemini for creative task evaluation
- **Progressive Difficulty** from Easy to Impossible challenges
- **No Backend Required** - runs entirely in the browser with local storage

Players choose a character class, battle through 5 phases of increasingly difficult challenges, and must defeat monsters before their HP reaches zero. Each character has unique mechanics - Engineers fix bugs, Bards create creative hints, Detectives solve locked mysteries, and Healers face special sentence-based challenges.

## How we built it

**Technology Stack**: React 19 + TypeScript + Vite + Tailwind CSS + Zustand + Canvas 2D

**Development Process**:

**Phase 1: Core Architecture (Week 1-2)**
- Set up React + TypeScript + Vite for rapid development
- Implemented Zustand stores for state management (session, progress, content, settings)
- Created pixel-perfect Canvas 2D rendering system with device pixel ratio support
- Built basic HP-based combat system with timer mechanics

**Phase 2: Content System (Week 3-4)**
- Designed flexible JSON content pack format with TypeScript validation
- Built extensible validator system supporting multiple validation types
- Created 8 unique character classes with distinct stats and mechanics
- Implemented various challenge formats (bugfix, creative hints, data transformation, security)

**Phase 3: AI Integration (Week 5-6)**
- Integrated Google Gemini 2.5 Flash Lite API for creative task validation
- Implemented secure Web Worker sandbox for code execution with 500ms timeout
- Added rate limiting (1-second minimum between requests) and error handling
- Created multiple AI scoring schemes for different task types

**Phase 4: Polish & UX (Week 7-8)**
- Created pixel art character sprites and UI elements
- Added visual effects (shake animations, damage numbers, hit flashes)
- Optimized for mobile devices with responsive design
- Implemented accessibility features (keyboard navigation, screen reader support)

**Key Technical Implementations**:
- Canvas scaling formula: $$\text{scale} = \max(1, \lfloor\min(\frac{\text{viewport width}}{\text{internal width}}, \frac{\text{viewport height}}{\text{internal height}})\rfloor)$$
- Game state management: $$\text{Game State} = \{\text{roleId}, \text{phaseIndex}, \text{playerHP}, \text{monsterHP}, \text{nextAttackMs}, \text{running}\}$$
- Character power balancing: $$\text{Power Level} = \frac{\text{HP} \times \text{Attack}}{\text{Difficulty Multiplier}}$$

## Challenges we ran into

**Technical Challenges**:

**Canvas Performance Optimization**
Achieving smooth 60fps rendering while maintaining pixel-perfect scaling was the biggest technical hurdle. The solution involved using `requestAnimationFrame` for timing, implementing integer-only transforms, batching draw operations, and optimizing sprite rendering.

**State Management Complexity**
Managing complex game state across multiple stores while ensuring persistence was tricky. We solved this through clear separation of concerns between stores, immutable state updates, proper cleanup on component unmount, and LocalStorage integration for progress.

**AI Validation Reliability**
Creating reliable AI-based validation for creative tasks was challenging. We implemented multiple scoring schemes for different task types, fallback validation when AI is unavailable, clear guidance prompts for consistent evaluation, and rate limiting to prevent API abuse.

**Design Challenges**:

**Character Balance**
Balancing 8 different character classes with varying difficulty levels required extensive playtesting. We used mathematical power level calculations, iterative stat adjustments, player feedback integration, and difficulty progression testing.

**Content Creation**
Creating engaging challenges that work across different skill levels was difficult. We built a modular content pack system, implemented multiple validator types, created progressive difficulty scaling, and conducted extensive testing with different audiences.

**User Experience**
Making the game accessible to both beginners and experts required careful UX design. We implemented clear visual feedback systems, intuitive controls, helpful AI assistance, and progressive disclosure of complexity.

## Accomplishments that we're proud of

- **Successfully combined educational programming with engaging RPG mechanics** - creating a game that makes learning fun
- **Built a sophisticated AI integration system** that enhances creativity without replacing human ingenuity
- **Achieved smooth 60fps performance** on a pixel-perfect Canvas 2D rendering system
- **Created 8 unique character classes** with distinct mechanics and balanced gameplay
- **Implemented a flexible content system** that supports custom challenge packs
- **Built a secure code execution environment** using Web Workers with timeout protection
- **Made the game entirely frontend-based** with no backend requirements
- **Achieved mobile-first responsive design** that works across all devices
- **Created an accessible gaming experience** with keyboard navigation and screen reader support

## What we learned

**Technical Insights**:
- **Canvas 2D Performance**: Integer scaling is crucial for pixel art rendering across different device pixel ratios
- **State Management**: Clear separation of concerns between different stores is essential for complex game state
- **AI Integration**: Rate limiting, error handling, and fallback systems are critical for reliable AI-powered features
- **Security**: Web Workers provide excellent isolation for safe code execution without compromising performance

**Game Design Lessons**:
- **Character Balance**: Mathematical formulas help ensure fair gameplay across different difficulty levels
- **Combat Timing**: Simple timing mechanisms create predictable but engaging gameplay loops
- **Progressive Difficulty**: Players need clear progression paths to stay motivated
- **Visual Feedback**: Immediate feedback systems are crucial for player engagement

**Educational Insights**:
- **Learning through play** is more effective than traditional exercises
- **Failure can be fun** when wrapped in the right mechanics
- **AI can enhance creativity** without replacing human problem-solving
- **Community feedback** is invaluable for iterative improvement

## What's next for Prompt Hunter

**Short-term Goals (Next 3 months)**:
- **Community Content Packs**: Enable users to create and share custom challenge packs
- **Multiplayer Mode**: Add cooperative and competitive multiplayer features
- **Leaderboards**: Implement global and friend-based leaderboards
- **Achievement System**: Add badges and achievements for different accomplishments

**Medium-term Goals (3-6 months)**:
- **Mobile App**: Develop native mobile applications for iOS and Android
- **Advanced AI Features**: Implement adaptive difficulty and personalized challenges
- **Educational Partnerships**: Partner with coding bootcamps and educational institutions
- **Language Support**: Add support for more languages beyond English and Chinese

**Long-term Vision (6+ months)**:
- **AI-Generated Content**: Create dynamic challenge generation using AI
- **Virtual Reality**: Explore VR/AR versions of the game
- **Esports Integration**: Develop competitive tournament systems
- **Educational Platform**: Expand into a comprehensive programming education platform

**Technical Roadmap**:
- **Performance Optimization**: Further optimize rendering and state management
- **Accessibility Improvements**: Enhance screen reader and keyboard navigation support
- **Offline Mode**: Implement full offline functionality with sync when online
- **Analytics**: Add learning analytics to track player progress and challenge effectiveness

## 🎮 Gameplay

### Character Classes

| Character | HP | Attack | Specialty | Difficulty | Description |
|-----------|----|--------|-----------|------------|-------------|
| **Engineer** | 200 | 100 | Debugging Logic | Easy | Fixes broken code and builds tools |
| **Bard** | 100 | 100 | Creative Music | Easy | Creates hints for songs and movies |
| **Necromancer** | 200 | 50 | Dark Arts Algorithms | Medium | Manipulates data with dark magic |
| **Alchemist** | 200 | 20 | Data Transformation | Medium | Transforms data structures |
| **Hacker** | 100 | 100 | Security Systems | Medium | Solves security challenges |
| **Detective** | 30 | 100 | Detective Mysteries | Hard | Investigates with locked questions |
| **Healer** | 30 | 0 | Healing Arts | Hard | Special sentence-based challenges |
| **Mysterious** | 100M | 100M | Unknown Powers | Impossible | ??? |

### Combat System
- **Player HP**: Varies by character (30-200 HP)
- **Monster HP**: 100 HP per phase
- **Attack Timer**: Monster attacks every 5 seconds
- **Damage**: Correct answers deal damage, wrong answers deal none
- **Victory**: Complete 5 phases to win a role
- **Defeat**: Player dies at 0 HP → return to menu

### Special Mechanics

#### Detective Mode
- **Question Locking**: Randomly selects one question, locks it until victory
- **Progress Persistence**: Saves current question and HP between sessions
- **High Risk**: Low HP (30) but high attack power

#### Healer Challenges
- **Sentence-Based**: Unique challenges requiring exact sentence reproduction
- **Copy Detection**: Copy-pasting exact sentences triggers 10-second freeze
- **No Attack**: Cannot deal damage, must rely on healing mechanics

#### AI Integration
- **Gemini Assistant**: Optional AI helper for hints and guidance
- **AI Validation**: Creative tasks use AI scoring for evaluation
- **Rate Limiting**: 1-second minimum between API requests

## 🛠️ Technical Architecture

## Built with

### Frontend Technologies
- **React 19.1.1** - Modern UI library for building interactive user interfaces
- **TypeScript 5.8.3** - Type-safe JavaScript for better development experience
- **Vite 7.1.2** - Fast build tool and development server
- **Tailwind CSS 3.4.17** - Utility-first CSS framework for rapid styling
- **React Router DOM 7.8.2** - Client-side routing for single-page applications

### State Management & Data
- **Zustand 5.0.8** - Lightweight state management with persistence
- **LocalStorage** - Client-side data persistence for game progress
- **SessionStorage** - Temporary storage for API keys and session data

### Graphics & Rendering
- **Canvas 2D API** - Pixel-perfect rendering for retro game aesthetics
- **Web Workers** - Background processing for secure code execution
- **requestAnimationFrame** - Smooth 60fps game loop timing

### AI & External APIs
- **Google Gemini 2.5 Flash Lite** - AI-powered task validation and assistance
- **RESTful API Integration** - HTTP requests for AI model communication
- **Rate Limiting** - Custom implementation for API request throttling

### Development Tools
- **ESLint 9.33.0** - Code linting and quality enforcement
- **TypeScript ESLint 8.39.1** - TypeScript-specific linting rules
- **PostCSS 8.5.6** - CSS processing and optimization
- **Autoprefixer 10.4.21** - Automatic CSS vendor prefixing

### Build & Deployment
- **Vite Build System** - Optimized production builds
- **Static File Serving** - No backend required, pure frontend deployment
- **Vercel** - Cloud platform for hosting and deployment (optional)

### Security & Performance
- **Web Worker Sandbox** - Isolated code execution environment
- **Timeout Protection** - 500ms execution limits for user code
- **CORS Handling** - Cross-origin resource sharing management
- **Device Pixel Ratio Support** - High-DPI display optimization

### Browser APIs
- **Clipboard API** - Copy/paste functionality for code snippets
- **File API** - Content pack upload and management
- **Storage API** - Local data persistence
- **Canvas API** - 2D graphics rendering
- **Web Workers API** - Background processing

### Platform Support
- **Web Browsers** - Chrome, Firefox, Safari, Edge (modern versions)
- **Mobile Devices** - Responsive design for tablets and phones
- **Desktop** - Full-featured experience on computers
- **Progressive Web App** - Installable web application capabilities

### Project Structure
```
src/
├── components/          # UI components
│   ├── AnswerPanel.tsx  # Answer input and validation
│   ├── TaskPanel.tsx    # Challenge display
│   ├── ChatPanel.tsx    # AI assistant interface
│   ├── HealthBar.tsx    # HP display
│   └── ...
├── pages/               # Main game pages
│   ├── PlayPage.tsx     # Main gameplay screen
│   ├── PackViewer.tsx   # Content pack management
│   └── SettingsMenu.tsx # Game settings
├── store/               # Zustand state stores
│   ├── session.ts       # Game session state
│   ├── progress.ts      # Persistent progress
│   ├── content.ts       # Content pack management
│   └── settings.ts      # User settings
├── lib/                 # Core game logic
│   ├── validator.ts     # Answer validation system
│   ├── canvas.ts        # Canvas rendering utilities
│   ├── gemini.ts        # AI API integration
│   └── characterStats.ts # Character statistics
├── types/               # TypeScript definitions
├── hooks/               # Custom React hooks
└── workers/             # Web Worker for safe execution
```

### Key Systems

#### Validation Engine
- **Multiple Validators**: Text matching, regex, JavaScript evaluation
- **AI Scoring**: Creative tasks use AI for evaluation
- **Worker Sandbox**: Safe code execution with 500ms timeout
- **Scoring Schemes**: 
  - `attack_100_once`: Perfect score required
  - `attack_50_two_parts`: Partial scoring
  - `attack_20_bugs`: Bug-based scoring

#### Canvas Rendering
- **Internal Resolution**: 320x180 pixels
- **Pixel Art**: Integer scaling with no anti-aliasing
- **High DPI**: Device pixel ratio support
- **Effects**: Shake animations, hit flashes, damage numbers

#### State Management
- **Session Store**: Current game state (HP, phase, timer)
- **Progress Store**: Persistent wins across sessions
- **Content Store**: Dynamic content pack loading
- **Settings Store**: User preferences and API keys

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd prompt-hunter

# Install dependencies
npm install

# Start development server
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`)

### Building for Production
```bash
# Build the project
npm run build

# Preview production build
npm run preview
```

## 🎯 How to Play

### 1. Setup (Optional)
- Get a Google Gemini API key from [AI Studio](https://aistudio.google.com/app/apikey)
- Enter the key in Settings or Chat panel for AI assistance
- Restrict the key to HTTP referrers for security

### 2. Choose Your Character
- Select from 8 unique roles on the main menu
- Each character has different stats and challenge types
- Start with Engineer or Bard for easier gameplay

### 3. Battle Monsters
- **Combat Loop**: Monster attacks every 5 seconds
- **Answer Challenges**: Solve prompts to deal damage
- **Use AI Assistant**: Get hints via chat panel (requires API key)
- **Progress**: Complete 5 phases to win

### 4. Advanced Strategies
- **Engineer**: Focus on debugging and code fixes
- **Bard**: Create creative hints without revealing answers
- **Detective**: Master the locked question system
- **Healer**: Avoid copy-pasting exact sentences
- **Mysterious**: Discover hidden mechanics

## 📦 Content System

### Content Packs
- **Format**: JSON with TypeScript validation
- **Structure**: Roles → Phases → Tasks → Validators
- **Localization**: English and Chinese (Hong Kong) support
- **Runtime Loading**: Load custom packs via Settings

### Task Types
- **Bugfix**: Fix broken code snippets
- **Creative Hint**: Create hints for songs/movies
- **Data Transformation**: Manipulate data structures
- **Security**: Solve security challenges
- **Healing**: Special sentence-based challenges
- **Mysterious**: Unknown challenge types

### Creating Custom Content
1. Follow the JSON schema in `src/types/content.ts`
2. Include validators for each phase
3. Load via Settings → Content Pack → Upload File
4. Validate with TypeScript for type safety

## 🔒 Security Features

- **Worker Sandbox**: All code execution isolated in Web Workers
- **Timeout Protection**: 500ms timeout on all code execution
- **No Main Thread Eval**: Prevents XSS attacks
- **API Key Security**: Keys only stored in sessionStorage
- **Content Validation**: JSON schema validation for content packs
- **Rate Limiting**: Prevents API abuse

## 🎨 Customization

### Styling
- **Tailwind CSS**: Utility-first styling system
- **Dark Theme**: Built-in dark mode support
- **Responsive**: Mobile-first design approach
- **Pixel Art**: Custom sprites and animations

### Configuration
- **Settings Menu**: Adjust game preferences
- **API Configuration**: Manage AI integration
- **Content Packs**: Load custom challenge sets
- **Language**: Switch between English and Chinese

## 🤝 Contributing

### Development Setup
```bash
# Install dependencies
npm install

# Run linting
npm run lint

# Type checking
npm run type-check
```

### Code Style
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting (via ESLint)
- **React Hooks**: Follow React best practices

### Areas for Contribution
- **New Character Classes**: Add unique roles and mechanics
- **Content Packs**: Create new challenge sets
- **UI Improvements**: Enhance user experience
- **Performance**: Optimize rendering and state management
- **Accessibility**: Improve screen reader support

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini**: AI integration and validation
- **React Team**: Frontend framework
- **Vite Team**: Build tool and development server
- **Tailwind CSS**: Utility-first styling
- **Zustand**: State management library

## 📞 Support

- **Issues**: Report bugs and feature requests via GitHub Issues
- **Discussions**: Join community discussions
- **Documentation**: Check inline code comments and TypeScript types

---

**Happy Hunting! 🎮⚔️**
