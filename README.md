# Movies For Me 🎬🍿

A modern, fast, production-ready web application for streaming Movies, TV Shows, and Anime with real metadata and zero ads.

Built & maintained by **[narendraborhade-creator](https://github.com/narendraborhade-creator)**.

---

## ✨ Features

- 🎥 **Movies & TV Shows**: Real-time trending, top-rated, and categorized rows powered by TMDB.
- ⚡ **Anime Streaming**: Dedicated anime exploration and episode tracking powered by AniList.
- 🔊 **Multi-Audio & Hindi Support**: VidLink streaming source integrated by default with English and Hindi audio stream selection.
- 🔍 **Unified Search & Filtering**: Fast category filtering (Movies, TV Shows, Anime) and genre chips (Action, Comedy, Drama, Sci-Fi, etc.).
- 🌐 **Vercel & Web Native**: Built-in Vercel Edge Serverless proxy (`/api/tmdb`) bypassing ISP DNS blocking and CORS limitations seamlessly.
- 📱 **Responsive & Clean UI**: Dark cinematic interface optimized for both desktop and mobile web browsers.

---

## 🚀 Live Deployment on Vercel

### 1-Click Deploy or GitHub Import
1. Push this repository to your GitHub account (`https://github.com/narendraborhade-creator/movies-for-me`).
2. Go to [Vercel](https://vercel.com) and click **"Add New Project"** -> **"Import Git Repository"**.
3. Select `movies-for-me`.
4. (Optional) In **Environment Variables**, you can set:
   - `VITE_TMDB_API_READ_ACCESS_TOKEN` = Your TMDB API Read Access Token (or 32-character API Key).
   *(Note: A valid working fallback token is already pre-configured out-of-the-box so the app works immediately upon deployment!)*
5. Click **Deploy**.

---

## 🛠️ Local Development

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/)

### Installation & Run

```bash
# Clone the repository
git clone https://github.com/narendraborhade-creator/movies-for-me.git
cd movies-for-me

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔧 Architecture

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons
- **Backend / Edge**: Vercel Serverless Function proxy (`api/tmdb.js`) resolving TMDB API requests with SSL & CORS handling
- **Player Engine**: Native HTML5 `<iframe>` embed player with multi-host fallback (VidLink, VidSrc, 2Embed, VidNest, etc.)

---

## 📄 License

GPL-3.0 License. Developed by **narendraborhade-creator**.
