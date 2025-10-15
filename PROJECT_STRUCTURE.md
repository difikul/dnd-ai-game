# Project Structure - Character System

## Frontend Directory Tree

```
frontend/src/
├── types/
│   └── character.ts              # Character type definitions
│
├── constants/
│   ├── races.ts                  # Race information & bonuses
│   └── classes.ts                # Class information & features
│
├── utils/
│   └── dndCalculations.ts        # D&D game mechanics utilities
│
├── services/
│   ├── api.service.ts            # Axios instance & interceptors
│   └── character.service.ts      # Character API calls
│
├── stores/
│   └── characterStore.ts         # Pinia state management
│
├── components/
│   └── character/
│       ├── StatBlock.vue         # Single ability score display
│       ├── RaceSelector.vue      # Race selection grid
│       ├── ClassSelector.vue     # Class selection grid
│       ├── CharacterCreator.vue  # Multi-step wizard
│       ├── CharacterSheet.vue    # Character detail view
│       └── CharacterList.vue     # Character list view
│
├── views/
│   ├── HomeView.vue              # Home page
│   ├── CharacterCreationView.vue # Character creation page
│   ├── GameView.vue              # Game session page
│   └── SavedGamesView.vue        # Saved games list
│
├── router/
│   └── index.ts                  # Vue Router configuration
│
├── assets/
│   └── main.css                  # Global styles & Tailwind
│
├── App.vue                        # Root component
├── main.ts                        # Application entry point
└── vite-env.d.ts                 # Vite environment types
```

## Configuration Files

```
frontend/
├── package.json                   # Dependencies & scripts
├── vite.config.ts                 # Vite configuration
├── tsconfig.json                  # TypeScript config
├── tailwind.config.js             # Tailwind CSS config
├── postcss.config.js              # PostCSS config
├── .env.example                   # Environment template
└── Dockerfile                     # Docker configuration
```

## Documentation Files

```
/
├── CHARACTER_SYSTEM_DOCS.md       # Technical documentation
├── IMPLEMENTATION_SUMMARY.md      # Implementation summary
├── UI_FLOW.md                     # UI flow diagrams
└── PROJECT_STRUCTURE.md           # This file

frontend/
└── CHARACTER_SYSTEM_README.md     # Quick start guide
```

## File Sizes & Line Counts

```
types/character.ts              ~180 lines
constants/races.ts              ~120 lines
constants/classes.ts            ~100 lines
utils/dndCalculations.ts        ~200 lines
services/api.service.ts         ~100 lines
services/character.service.ts   ~80 lines
stores/characterStore.ts        ~180 lines

components/character/
  StatBlock.vue                 ~65 lines
  RaceSelector.vue              ~95 lines
  ClassSelector.vue             ~115 lines
  CharacterCreator.vue          ~310 lines
  CharacterSheet.vue            ~240 lines
  CharacterList.vue             ~120 lines

views/CharacterCreationView.vue ~90 lines

Total: ~1,995 lines of code
```

## Dependencies

### Runtime
- vue: ^3.5.12
- vue-router: ^4.4.5
- pinia: ^2.2.6
- axios: ^1.7.7
- @vueuse/core: ^11.2.0
- socket.io-client: ^4.8.1

### Development
- @vitejs/plugin-vue: ^5.1.4
- typescript: ^5.6.3
- vite: ^5.4.10
- vue-tsc: ^2.1.10
- tailwindcss: ^3.4.14
- autoprefixer: ^10.4.20
- postcss: ^8.4.47

## Component Architecture

```
┌─────────────────────────────────────────────────┐
│                    App.vue                       │
│              (Root Component)                    │
└─────────────────┬───────────────────────────────┘
                  │
      ┌───────────┴───────────┐
      │                       │
      ▼                       ▼
┌──────────┐          ┌──────────────┐
│  Router  │          │ Pinia Stores │
│          │          │              │
│ Routes:  │          │ - character  │
│ - /      │          └──────────────┘
│ - /create│
│ - /game  │
│ - /saves │
└────┬─────┘
     │
     ├─── HomeView.vue
     │
     ├─── CharacterCreationView.vue
     │         │
     │         └─── CharacterCreator.vue
     │                   ├─── RaceSelector.vue
     │                   └─── ClassSelector.vue
     │
     ├─── GameView.vue
     │         │
     │         └─── CharacterSheet.vue
     │                   └─── StatBlock.vue (x6)
     │
     └─── SavedGamesView.vue
               │
               └─── CharacterList.vue
```

## Data Flow Architecture

```
┌──────────────┐
│ User Action  │
└──────┬───────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐
│  Component   │────▶│ Pinia Store  │
│   (Vue 3)    │◀────│  (Reactive)  │
└──────────────┘     └──────┬───────┘
                            │
                            ▼
                    ┌──────────────┐
                    │ API Service  │
                    │   (Axios)    │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │Backend API   │
                    │ REST Endpoints│
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Database    │
                    │ (PostgreSQL) │
                    └──────────────┘
```

## State Management Flow

```
characterStore (Pinia)
│
├── State
│   ├── currentCharacter: Character | null
│   ├── characters: Character[]
│   ├── loading: boolean
│   └── error: string | null
│
├── Getters (Computed)
│   ├── hasCharacter
│   ├── characterCount
│   ├── isLoading
│   └── hasError
│
└── Actions (Async)
    ├── createCharacter()     → POST /api/characters
    ├── loadCharacter()       → GET /api/characters/:id
    ├── loadAllCharacters()   → GET /api/characters
    ├── updateCharacter()     → PUT /api/characters/:id
    ├── deleteCharacter()     → DELETE /api/characters/:id
    └── clearError()          → Local state update
```

## Styling Architecture

```
TailwindCSS Configuration
│
├── Theme Extension
│   ├── Colors
│   │   ├── primary: Fantasy orange (#f97316)
│   │   ├── dark: Dark backgrounds (#0a0a0f - #374151)
│   │   └── fantasy: Gold, Ruby, Emerald, Sapphire
│   │
│   ├── Fonts
│   │   ├── display: Cinzel (serif)
│   │   ├── body: Inter (sans-serif)
│   │   └── mono: JetBrains Mono
│   │
│   └── Animations
│       ├── fade-in
│       ├── slide-up
│       └── dice-roll
│
└── Component Styles
    ├── Utility-first approach
    ├── Scoped component styles
    └── Dark fantasy aesthetic
```

## Build Process

```
npm run dev
    │
    ├─── Vite Dev Server
    │    ├─── Vue SFC compilation
    │    ├─── TypeScript transpilation
    │    ├─── TailwindCSS processing
    │    └─── Hot Module Replacement
    │
    └─── http://localhost:5173

npm run build
    │
    ├─── TypeScript type checking
    ├─── Vue SFC compilation
    ├─── Vite production build
    │    ├─── Code splitting
    │    ├─── Tree shaking
    │    ├─── Minification
    │    └─── Asset optimization
    │
    └─── dist/ output directory
```

## API Integration Points

```
Frontend                      Backend (Expected)
────────────────────────────────────────────────
CharacterCreator.vue    →    POST /api/characters
   └─ createCharacter()

CharacterSheet.vue      →    GET /api/characters/:id
   └─ loadCharacter()

CharacterList.vue       →    GET /api/characters
   └─ loadAllCharacters()

CharacterEditor.vue     →    PUT /api/characters/:id
   └─ updateCharacter()      (Future implementation)

CharacterManage.vue     →    DELETE /api/characters/:id
   └─ deleteCharacter()      (Future implementation)
```

## Type Safety Flow

```
TypeScript Definitions (/types/character.ts)
              │
              ├─── Components (Props, Emits)
              │     └─── Type checking at compile time
              │
              ├─── Store (State, Getters, Actions)
              │     └─── Type-safe state management
              │
              ├─── Services (Request, Response)
              │     └─── Type-safe API calls
              │
              └─── Utils (Parameters, Returns)
                    └─── Type-safe calculations
```

## Environment Configuration

```
.env (local)
│
├── VITE_API_URL=http://localhost:3000
└── VITE_APP_NAME=D&D AI Game
    │
    └─── Injected via import.meta.env
         └─── Type-safe via vite-env.d.ts
```

## Deployment Structure (Future)

```
Docker Container
│
├── Nginx (Port 80)
│   └── Static files from /dist
│
├── Node.js Backend (Port 3000)
│   └── API endpoints
│
└── PostgreSQL (Port 5432)
    └── Character data
```

---

This structure represents the complete Character System implementation,
ready for backend integration and production deployment.
