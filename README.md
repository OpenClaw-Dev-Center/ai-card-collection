# 🎴 AI Card Collection

A fancy card collection game where you collect, upgrade, and battle with AI models from major providers like Claude, GPT, Gemini, Llama, and more!

<div align="center">

![React](https://img.shields.io/badge/React-20232a?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=Framer&logoColor=white)

[![Deploy with GitHub Pages](https://github.com/OpenClaw-Dev-Center/ai-card-collection/actions/workflows/deploy.yml/badge.svg)](https://openclaw-dev-center.github.io/ai-card-collection/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

## ✨ Features

- 🎴 **Collect AI Models** - Collect cards representing real AI models with different rarities (Common, Rare, Epic, Legendary, Mythic)
- 🎯 **Upgrade System** - Use duplicate cards to upgrade versions (Claude Opus 4.5 → 4.6, GPT-4 → GPT-4o, etc.)
- ⚔️ **Singleplayer Battles** - Battle AI models using their unique stats (Power, Speed, Intelligence, Creativity)
- 🎁 **Pack Opening** - Enjoy fancy pack opening animations with rarity-based rewards
- 🔐 **Simple Authentication** - Register/login with local storage persistence (no backend needed)
- 💎 **Fancy Animations** - Experience smooth Framer Motion animations, shimmer effects, and glossy card designs
- 📱 **Responsive Design** - Works on desktop and mobile
- 🚀 **GitHub Pages Ready** - Automatic deployment via GitHub Actions

---

## 🎮 How to Play

1. **Register / Login** - Create an account or sign in
2. **Open Packs** - Use your starting credits or earn more by playing to open packs
   - Basic Pack (100 credits) - 5 cards, guarantees Common+
   - Premium Pack (500 credits) - 5 cards, guarantees Rare+
   - Mega Pack (2000 credits) - 10 cards, guarantees Epic+
   - Legendary Pack (10000 credits) - 5 cards, guarantees Legendary+
3. **Build Your Collection** - View all your cards in the Collection tab
4. **Upgrade Cards** - Use duplicates and currency to upgrade card versions
5. **Battle Arena** - Select a card and battle against random opponents in turn-based stat competition
6. **Earn Rewards** - Win battles to earn credits and additional packs

---

## 🛠️ Tech Stack

- **Frontend**: React 19 + Vite
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion + GSAP
- **Icons**: Lucide React
- **Deployment**: GitHub Pages (via GitHub Actions)
- **Storage**: Browser localStorage (no backend required)

---

## 🚀 Quick Start

### Local Development

```bash
# Clone the repository
git clone https://github.com/OpenClaw-Dev-Center/ai-card-collection.git
cd ai-card-collection

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Deployment

The project is configured for GitHub Pages. Simply push to the `main` branch and the GitHub Action will automatically deploy.

```bash
git add .
git commit -m "Deploy update"
git push origin main
```

The site will be live at: `https://openclaw-dev-center.github.io/ai-card-collection/`

---

## 📁 Project Structure

```
ai-card-collection/
├── src/
│   ├── components/
│   │   ├── Auth.jsx          # Login / Register
│   │   ├── Dashboard.jsx     # Main menu
│   │   ├── Card.jsx          # Individual card component
│   │   ├── CardCollection.jsx # Collection view
│   │   ├── PackOpening.jsx   # Pack opening animation
│   │   └── GameMode.jsx      # Battle gameplay
│   ├── data/
│   │   └── cards.js          # Card definitions & game logic
│   ├── hooks/
│   │   ├── useAuth.js        # Authentication logic
│   │   └── useGame.js        # Currency & packs management
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .github/
│   └── workflows/
│       └── deploy.yml        # GitHub Pages CI/CD
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## 🎨 Design Highlights

- **Glassmorphism** - Frosted glass effects on cards and UI panels
- **Rarity-based Colors** - Each rarity tier has its own color scheme and glow effects
- **3D Card Flips** - Click cards to flip and see stats on the back
- **Shimmer Effects** - Rarity-based animated shimmer overlays
- **Particle Effects** - Floating particles in background and Mythic/Legendary pulls
- **Scanlines** - Subtle scanline effect on rare cards

---

## 📊 Card System

### Providers
- Claude (Anthropic)
- GPT (OpenAI)
- Gemini (Google)
- Llama (Meta)
- Mistral (Mistral AI)
- DeepSeek (DeepSeek AI)

### Stats
- **Power** - General capability strength
- **Speed** - Response/processing speed
- **Intelligence** - Reasoning ability
- **Creativity** - Creative generation

### Rarity Tiers
| Tier | Color | Probability | Stat Boost |
|------|-------|-------------|------------|
| Common | Gray | 45% | +0 |
| Rare | Blue | 30% | +3 |
| Epic | Purple | 15% | +6 |
| Legendary | Orange | 8% | +10 |
| Mythic | Red | 2% | +15 |

---

## 🔮 Future Ideas

- [ ] Multiplayer PvP battles
- [ ] Leaderboards & season rankings
- [ ] More AI models & versions
- [ ] Events with special packs
- [ ] Card crafting & fusion
- [ ] Dark/Light theme toggle
- [ ] Sound effects & music
- [ ] Cloud save sync

---

## 📝 License

MIT License - feel free to fork, modify, and use!

---

<div align="center">

**Built with ⚙️ by the OpenClaw team**

[Website](https://openclaw-dev-center.github.io/ai-card-collection/) • [Source](https://github.com/OpenClaw-Dev-Center/ai-card-collection)

</div>
