import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronRight,
  Cloud,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  Compass,
  Droplets,
  Eye,
  Gauge,
  Heart,
  House,
  Loader2,
  MapPin,
  Menu,
  Moon,
  Search,
  Snowflake,
  Star,
  Sun,
  Wind,
  Zap,
} from "lucide-react";

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY?.trim();
const BASE_URL = "https://api.openweathermap.org/data/2.5";
const STORAGE_KEY = "weathernix:favorites";

const DEFAULT_NEARBY = [
  { name: "Noida", distance: "Near the city" },
  { name: "Lucknow", distance: "Regional nearby" },
  { name: "Kanpur", distance: "Regional nearby" },
  { name: "Varanasi", distance: "Regional nearby" },
  { name: "Ghaziabad", distance: "Regional nearby" },
];

const NEARBY_CITIES = {
  Prayagraj: [
    { name: "Varanasi", distance: "42 km away" },
    { name: "Lucknow", distance: "120 km away" },
    { name: "Kanpur", distance: "127 km away" },
    { name: "Fatehpur", distance: "133 km away" },
    { name: "Raebareli", distance: "144 km away" },
  ],
  Delhi: [
    { name: "Noida", distance: "14 km away" },
    { name: "Gurugram", distance: "28 km away" },
    { name: "Ghaziabad", distance: "19 km away" },
    { name: "Faridabad", distance: "31 km away" },
    { name: "Meerut", distance: "76 km away" },
  ],
  Mumbai: [
    { name: "Thane", distance: "18 km away" },
    { name: "Navi Mumbai", distance: "21 km away" },
    { name: "Kalyan", distance: "39 km away" },
    { name: "Panvel", distance: "45 km away" },
    { name: "Bhiwandi", distance: "33 km away" },
  ],
  London: [
    { name: "Croydon", distance: "15 km away" },
    { name: "Wembley", distance: "12 km away" },
    { name: "Bromley", distance: "20 km away" },
    { name: "Ilford", distance: "14 km away" },
    { name: "Watford", distance: "28 km away" },
  ],
};

const FORECAST_LIMIT = 5;

const styles = `
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #root {
  min-height: 100%;
  height: 100%;
  overflow: hidden;
}
body {
  background: #050d18;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
button, input { font: inherit; }
button { -webkit-tap-highlight-color: transparent; border: none; cursor: pointer; }

/* ─── Rain canvas ─── */
#rain-canvas {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  opacity: 0.55;
  transition: opacity 0.6s ease;
}
#rain-canvas.day-mode { opacity: 0; }

/* ─── App shell ─── */
.app {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: #fff;
  --accent: #2a9fd6;
  --accent2: #56c8ef;
  --muted: rgba(180, 210, 230, 0.70);
  --panel: rgba(10, 28, 50, 0.68);
  --panelStrong: rgba(15, 38, 65, 0.80);
  --border: rgba(56, 120, 180, 0.22);
  --input: rgba(8, 22, 40, 0.70);
  --sidebar-bg: rgba(6, 16, 32, 0.82);
  --text: #ffffff;
  transition: background 0.6s ease;
}

/* Night background */
.app.night {
  background:
    radial-gradient(ellipse at 50% -10%, rgba(20, 60, 110, 0.6) 0%, transparent 55%),
    linear-gradient(180deg, #050d18 0%, #071522 40%, #040c16 100%);
}

/* Day background — bright sky gradient */
.app.day {
  background:
    radial-gradient(ellipse at 50% -5%, rgba(255, 220, 100, 0.45) 0%, transparent 50%),
    linear-gradient(180deg, #4ab0e8 0%, #6ec6f0 25%, #89d4f5 50%, #b8e4fa 75%, #d6eef8 100%);
  --accent: #0077b6;
  --accent2: #0096c7;
  --muted: rgba(0, 60, 100, 0.65);
  --panel: rgba(255, 255, 255, 0.22);
  --panelStrong: rgba(255, 255, 255, 0.32);
  --border: rgba(0, 100, 180, 0.20);
  --input: rgba(255, 255, 255, 0.55);
  --sidebar-bg: rgba(0, 60, 120, 0.18);
  --text: #071723;
}

/* City skyline silhouette */
.skyline {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 280px;
  pointer-events: none;
  z-index: 1;
  background:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 280' preserveAspectRatio='none'%3E%3Cpath fill='%23020a14' fill-opacity='0.92' d='M0,280 L0,200 L20,200 L20,160 L30,160 L30,140 L40,140 L40,160 L50,160 L50,180 L70,180 L70,120 L80,120 L80,100 L90,100 L90,80 L100,80 L100,100 L110,100 L110,120 L120,120 L120,180 L140,180 L140,150 L155,150 L155,130 L165,130 L165,110 L175,110 L175,90 L185,90 L185,70 L195,70 L195,50 L205,50 L205,70 L215,70 L215,90 L225,90 L225,110 L235,110 L235,130 L245,130 L245,150 L260,150 L260,180 L280,180 L280,140 L295,140 L295,100 L310,100 L310,80 L325,80 L325,60 L340,60 L340,80 L355,80 L355,100 L370,100 L370,140 L390,140 L390,160 L410,160 L410,130 L425,130 L425,100 L440,100 L440,70 L455,70 L455,45 L470,45 L470,30 L480,30 L480,20 L490,20 L490,30 L500,30 L500,45 L515,45 L515,70 L530,70 L530,100 L545,100 L545,130 L560,130 L560,160 L580,160 L580,140 L595,140 L595,110 L610,110 L610,85 L625,85 L625,65 L640,65 L640,85 L655,85 L655,110 L670,110 L670,140 L690,140 L690,160 L710,160 L710,180 L730,180 L730,150 L745,150 L745,120 L760,120 L760,90 L775,90 L775,65 L790,65 L790,45 L800,45 L800,30 L812,30 L812,20 L820,20 L820,30 L830,30 L830,45 L845,45 L845,65 L860,65 L860,90 L875,90 L875,120 L890,120 L890,150 L905,150 L905,180 L925,180 L925,160 L940,160 L940,130 L955,130 L955,100 L970,100 L970,70 L985,70 L985,50 L1000,50 L1000,70 L1015,70 L1015,100 L1030,100 L1030,130 L1045,130 L1045,160 L1060,160 L1060,180 L1080,180 L1080,140 L1095,140 L1095,110 L1110,110 L1110,80 L1125,80 L1125,55 L1140,55 L1140,80 L1155,80 L1155,110 L1170,110 L1170,140 L1185,140 L1185,160 L1200,160 L1200,180 L1220,180 L1220,150 L1235,150 L1235,120 L1250,120 L1250,100 L1265,100 L1265,80 L1280,80 L1280,100 L1295,100 L1295,120 L1310,120 L1310,150 L1325,150 L1325,180 L1345,180 L1345,160 L1360,160 L1360,140 L1375,140 L1375,160 L1390,160 L1390,180 L1410,180 L1410,200 L1440,200 L1440,280 Z'/%3E%3C/svg%3E")
    no-repeat bottom;
  background-size: 100% 100%;
  transition: opacity 0.6s ease;
}
.app.day .skyline { opacity: 0.15; }

/* ─── Layout ─── */
.shell {
  position: relative;
  z-index: 2;
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

/* ─── Sidebar ─── */
.sidebar {
  width: 240px;
  flex: 0 0 240px;
  display: flex;
  flex-direction: column;
  padding: 28px 16px 24px;
  background: var(--sidebar-bg);
  backdrop-filter: blur(28px);
  border-right: 1px solid var(--border);
  overflow-y: auto;
  scrollbar-width: none;
  transition: background 0.6s ease, border-color 0.4s ease;
}
.sidebar::-webkit-scrollbar { display: none; }

.brandRow {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
}

.brandMark {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: rgba(37, 150, 190, 0.22);
  box-shadow: 0 0 30px rgba(37, 150, 190, 0.25);
  flex-shrink: 0;
}

.brandTitle {
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text);
}

.brandSub {
  font-size: 0.76rem;
  color: var(--muted);
  margin-top: 2px;
}

.navGroup {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.navBtn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  background: transparent;
  color: var(--muted);
  font-size: 0.93rem;
  font-weight: 600;
  transition: all 0.2s ease;
  text-align: left;
}
.navBtn:hover {
  background: rgba(255, 255, 255, 0.07);
  color: var(--text);
}
.navBtn.active {
  background: rgba(37, 150, 190, 0.22);
  color: #fff;
  box-shadow: 0 8px 24px rgba(37, 150, 190, 0.18);
}
.app.day .navBtn.active { color: var(--text); }
.app.day .navBtn:hover { background: rgba(0, 60, 120, 0.10); color: var(--text); }

.sidebarCard {
  margin-top: auto;
  border: 1px solid var(--border);
  background: var(--panel);
  border-radius: 20px;
  padding: 18px 16px;
  margin-bottom: 4px;
}
.sidebarEmoji { font-size: 2.4rem; text-align: center; margin-bottom: 10px; }
.sidebarCardTitle { font-size: 0.93rem; font-weight: 700; text-align: center; color: var(--text); }
.sidebarCardText { margin-top: 6px; color: var(--muted); line-height: 1.6; font-size: 0.82rem; text-align: center; }

/* ─── Main content ─── */
.content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
}

/* Top header bar */
.topBar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 28px 0;
  flex-shrink: 0;
}

.topLeft {}
.topTitle {
  font-size: 1.8rem;
  font-weight: 800;
  letter-spacing: -0.025em;
  color: var(--text);
  line-height: 1.1;
}
.topSub {
  font-size: 0.88rem;
  color: var(--muted);
  margin-top: 4px;
}

.topActions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.themeWrap {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--panel);
  backdrop-filter: blur(12px);
}

.themeToggle {
  width: 42px;
  height: 24px;
  border-radius: 999px;
  border: 1px solid var(--border) !important;
  position: relative;
  background: rgba(37, 150, 190, 0.25);
  cursor: pointer;
  transition: background 0.3s ease;
}
.themeKnob {
  position: absolute;
  top: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  transition: left 0.25s ease;
}
.themeKnob.dark { left: 3px; }
.themeKnob.day { left: 21px; }

.heartTopBtn {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  border: 1px solid var(--border) !important;
  background: var(--panel);
  backdrop-filter: blur(12px);
  color: var(--text);
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}
.heartTopBtn:hover { background: var(--panelStrong); transform: translateY(-1px); }

.iconBtn {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  border: 1px solid var(--border) !important;
  background: var(--panel);
  backdrop-filter: blur(12px);
  color: var(--text);
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}
.iconBtn:hover { background: var(--panelStrong); transform: translateY(-1px); }

/* Search bar */
.searchWrap {
  padding: 14px 28px 0;
  flex-shrink: 0;
}
.searchBar {
  display: flex;
  gap: 10px;
  align-items: center;
}
.searchField {
  position: relative;
  flex: 1;
}
.searchInput {
  width: 100%;
  height: 52px;
  border-radius: 16px;
  border: 1px solid var(--border);
  background: var(--panel);
  backdrop-filter: blur(16px);
  color: var(--text);
  padding: 0 18px 0 48px;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s ease, background 0.2s ease;
}
.searchInput:focus { border-color: rgba(37, 150, 190, 0.5); background: var(--panelStrong); }
.searchInput::placeholder { color: var(--muted); }
.searchIcon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--muted);
  pointer-events: none;
}
.searchBtn {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: var(--accent);
  color: #fff;
  display: grid;
  place-items: center;
  transition: all 0.2s ease;
  box-shadow: 0 8px 24px rgba(37, 150, 190, 0.35);
  flex-shrink: 0;
}
.searchBtn:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(37, 150, 190, 0.45); }

/* Error / loading notice */
.notice {
  margin: 8px 28px 0;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid rgba(255, 99, 99, 0.35);
  background: rgba(255, 99, 99, 0.10);
  color: var(--text);
  font-size: 0.88rem;
  flex-shrink: 0;
}
.noticeInfo {
  border-color: rgba(168, 221, 240, 0.25);
  background: rgba(168, 221, 240, 0.08);
}

/* Scrollable page area */
.pageScroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px 28px 24px;
  scrollbar-width: thin;
  scrollbar-color: rgba(37, 150, 190, 0.3) transparent;
}
.pageScroll::-webkit-scrollbar { width: 4px; }
.pageScroll::-webkit-scrollbar-thumb { background: rgba(37, 150, 190, 0.3); border-radius: 4px; }

/* ─── Overview grid ─── */
.overviewGrid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 14px;
  margin-bottom: 14px;
}

/* ─── Panel ─── */
.panel {
  border: 1px solid var(--border);
  background: var(--panel);
  backdrop-filter: blur(24px);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.30);
  transition: background 0.4s ease, border-color 0.4s ease;
}
.panelPad { padding: 22px; }

/* ─── Weather card (main) ─── */
.weatherCard {
  position: relative;
  overflow: hidden;
}

.favoriteToggle {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 2;
}

.heartBtn {
  width: 38px;
  height: 38px;
  border-radius: 999px;
  border: 1px solid var(--border) !important;
  background: rgba(255, 255, 255, 0.12);
  display: grid;
  place-items: center;
  color: var(--text);
  cursor: pointer;
  transition: all 0.2s ease;
}
.heartBtn.filled { background: rgba(255,255,255,0.9); border-color: transparent !important; }
.heartBtn:hover { transform: translateY(-1px); background: rgba(255,255,255,0.18); }

.cardHeader {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 4px;
}
.cardLocation {
  display: flex;
  align-items: center;
  gap: 8px;
}
.cardTitle {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text);
}
.cardSub {
  margin-top: 4px;
  color: var(--muted);
  font-size: 0.85rem;
}

.actionBtn {
  border: 1px solid var(--border) !important;
  background: var(--panelStrong);
  color: var(--text);
  border-radius: 999px;
  padding: 8px 16px;
  font-size: 0.83rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.actionBtn:hover { transform: translateY(-1px); background: rgba(37,150,190,0.18); }

.weatherHero {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 20px 0 16px;
}
.weatherIconWrap {
  width: 140px;
  height: 140px;
  border-radius: 28px;
  background: rgba(37, 150, 190, 0.08);
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.weatherTextBlock { flex: 1; }
.weatherTemp {
  font-size: 5.5rem;
  font-weight: 900;
  line-height: 0.9;
  letter-spacing: -0.05em;
  color: var(--text);
}
.weatherUnit {
  font-size: 2.8rem;
  color: var(--muted);
  vertical-align: top;
  margin-top: 8px;
  display: inline-block;
}
.condition {
  margin-top: 10px;
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--accent2);
}
.feels {
  margin-top: 6px;
  color: var(--muted);
  font-size: 0.95rem;
}

.stats {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(4, 1fr);
}
.statCard {
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 16px;
  border: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.15);
  padding: 12px 14px;
}
.statIcon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: rgba(37, 150, 190, 0.12);
  color: var(--accent2);
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.statLabel { font-size: 0.78rem; color: var(--muted); }
.statValue { font-size: 0.96rem; font-weight: 800; color: var(--text); margin-top: 2px; }

/* ─── Forecast panel (right column in overview) ─── */
.forecastPanel {
  display: flex;
  flex-direction: column;
}

.sectionHeader {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.sectionTitle {
  font-size: 1.2rem;
  font-weight: 800;
  letter-spacing: -0.015em;
  color: var(--text);
}
.sectionSub {
  margin-top: 4px;
  color: var(--muted);
  font-size: 0.82rem;
}

.forecastList {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.forecastRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 11px 14px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.15);
  transition: background 0.2s ease;
}
.forecastRow:hover { background: rgba(37, 150, 190, 0.08); }
.rowDay { min-width: 72px; }
.rowDayName { font-weight: 800; color: var(--text); font-size: 0.92rem; }
.rowDate { font-size: 0.78rem; color: var(--muted); margin-top: 2px; }
.rowCondition {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--muted);
  font-size: 0.86rem;
  flex: 1;
  justify-content: center;
}
.rowTemps {
  font-weight: 900;
  font-size: 0.96rem;
  color: var(--text);
  white-space: nowrap;
  text-align: right;
}

/* ─── Nearby cities panel ─── */
.nearbySectionHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  gap: 12px;
}

.cityGrid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(5, 1fr);
}
.cityCard {
  position: relative;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.15);
  padding: 16px;
  cursor: pointer;
  transition: all 0.22s ease;
  overflow: hidden;
}
.cityCard:hover {
  transform: translateY(-3px);
  background: rgba(37, 150, 190, 0.10);
  border-color: rgba(37, 150, 190, 0.30);
}
.cityName {
  font-size: 0.98rem;
  font-weight: 800;
  color: var(--text);
  padding-right: 42px;
}
.cityDistance { margin-top: 4px; color: var(--muted); font-size: 0.8rem; }
.cityMid {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  gap: 8px;
}
.cityTemp { font-size: 1.7rem; font-weight: 900; color: var(--text); line-height: 1; }
.cityCond { color: var(--muted); font-size: 0.8rem; margin-top: 4px; }
.cityRange { margin-top: 12px; color: var(--muted); font-size: 0.8rem; }
.rangeHi { color: var(--accent2); }

/* ─── Loading/empty states ─── */
.loadingState {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 10px;
  color: var(--muted);
  font-size: 0.88rem;
}
.spin { animation: spin 1s linear infinite; }

.emptyBox {
  border: 1px dashed var(--border);
  background: rgba(0, 0, 0, 0.08);
  border-radius: 20px;
  padding: 32px 24px;
  text-align: center;
  color: var(--muted);
}
.emptyIcon { margin: 0 auto 10px; color: var(--accent2); }
.emptyTitle { font-size: 1rem; font-weight: 800; color: var(--text); }
.emptyText { margin-top: 6px; line-height: 1.6; font-size: 0.88rem; }

/* ─── Full tab views (forecast/nearby/favorites full page) ─── */
.tabGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 14px;
}

footer {
  text-align: center;
  color: var(--muted);
  padding: 14px 0 4px;
  font-size: 0.82rem;
}

.muted { color: var(--muted); }

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ─── Responsive ─── */
@media (max-width: 1200px) {
  .overviewGrid { grid-template-columns: 1fr; }
  .cityGrid { grid-template-columns: repeat(3, 1fr); }
  .stats { grid-template-columns: repeat(2, 1fr); }
  .tabGrid { grid-template-columns: 1fr; }
}
@media (max-width: 900px) {
  .shell { flex-direction: column; }
  .sidebar { width: 100%; flex: 0 0 auto; flex-direction: row; flex-wrap: wrap; padding: 14px 16px; }
  .brandRow { margin-bottom: 0; }
  .navGroup { flex-direction: row; flex-wrap: wrap; gap: 4px; margin-top: 0; margin-left: auto; }
  .sidebarCard { display: none; }
  .content { flex: 1; }
  .cityGrid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 640px) {
  .cityGrid { grid-template-columns: 1fr; }
  .stats { grid-template-columns: 1fr; }
  .weatherHero { flex-direction: column; gap: 12px; }
  .weatherIconWrap { width: 110px; height: 110px; }
  .weatherTemp { font-size: 4rem; }
  .condition { font-size: 1.4rem; }
  .topTitle { font-size: 1.4rem; }
  .pageScroll { padding: 12px 16px 20px; }
  .topBar, .searchWrap { padding-left: 16px; padding-right: 16px; }
}
`;

// ─── Rain canvas component ───
function RainCanvas({ isDay }) {
  useEffect(() => {
    const canvas = document.getElementById("rain-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let animId;
    let drops = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initDrops();
    }

    function initDrops() {
      const count = Math.floor((canvas.width * canvas.height) / 6000);
      drops = Array.from({ length: count }, () => createDrop());
    }

    function createDrop() {
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        length: 14 + Math.random() * 24,
        speed: 8 + Math.random() * 14,
        opacity: 0.2 + Math.random() * 0.45,
        width: 0.8 + Math.random() * 0.8,
      };
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "#a8d8f0";
      drops.forEach((d) => {
        ctx.globalAlpha = d.opacity;
        ctx.lineWidth = d.width;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.length * 0.15, d.y + d.length);
        ctx.stroke();

        d.y += d.speed;
        d.x -= d.speed * 0.15;

        if (d.y - d.length > canvas.height || d.x < -20) {
          Object.assign(d, createDrop(), { y: -d.length, x: Math.random() * canvas.width });
        }
      });
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      id="rain-canvas"
      className={isDay ? "day-mode" : ""}
    />
  );
}

// ─── Helpers ───
function titleCase(text = "") {
  return text
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function getWeatherIcon(id = 800) {
  if (id >= 200 && id < 300) return Zap;
  if (id >= 300 && id < 400) return CloudDrizzle;
  if (id >= 500 && id < 600) return CloudRain;
  if (id >= 600 && id < 700) return CloudSnow;
  if (id >= 700 && id < 800) return Cloud;
  if (id === 800) return Sun;
  if (id > 800) return Cloud;
  return Cloud;
}

function normalizeWeatherCard(data, subtitleOverride = "") {
  const condition = data?.weather?.[0] || {};
  const temp = Math.round(data?.main?.temp ?? 0);
  const tempMin = Math.round(data?.main?.temp_min ?? temp);
  const tempMax = Math.round(data?.main?.temp_max ?? temp);
  return {
    cityName: data?.name || "Unknown",
    country: data?.sys?.country || "",
    label: data?.sys?.country ? `${data.name}, ${data.sys.country}` : data?.name || "Unknown",
    subtitle: subtitleOverride || titleCase(condition.description || "Updated just now"),
    temp,
    condition: titleCase(condition.main || "Unknown"),
    humidity: Math.round(data?.main?.humidity ?? 0),
    wind: Math.round(data?.wind?.speed ?? 0),
    pressure: Math.round(data?.main?.pressure ?? 0),
    visibility:
      typeof data?.visibility === "number"
        ? (data.visibility / 1000).toFixed(1)
        : "—",
    tempMin,
    tempMax,
    weatherId: condition.id ?? 800,
  };
}

function normalizeForecast(list = []) {
  const groups = new Map();
  list.forEach((item) => {
    const dateKey = item?.dt_txt?.slice(0, 10);
    if (!dateKey) return;
    if (!groups.has(dateKey)) groups.set(dateKey, []);
    groups.get(dateKey).push(item);
  });
  return Array.from(groups.entries())
    .slice(0, FORECAST_LIMIT)
    .map(([dateKey, items], index) => {
      const midday =
        items.find((entry) => entry.dt_txt?.includes("12:00:00")) ||
        items[Math.floor(items.length / 2)] ||
        items[0];
      const temps = items.map((entry) => entry?.main || {});
      const min = Math.min(...temps.map((t) => t.temp_min ?? t.temp ?? 0));
      const max = Math.max(...temps.map((t) => t.temp_max ?? t.temp ?? 0));
      const condition = midday?.weather?.[0] || {};
      return {
        key: dateKey,
        dayLabel:
          index === 0
            ? "Today"
            : new Date(`${dateKey}T00:00:00`).toLocaleDateString("en-US", { weekday: "short" }),
        dateLabel: new Date(`${dateKey}T00:00:00`).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        min: Math.round(min),
        max: Math.round(max),
        condition: titleCase(condition.main || "Unknown"),
        weatherId: condition.id ?? 800,
      };
    });
}

async function fetchCurrentWeather(cityName) {
  if (!API_KEY) throw new Error("Missing OpenWeather API key in .env");
  const res = await fetch(
    `${BASE_URL}/weather?q=${encodeURIComponent(cityName)}&appid=${API_KEY}&units=metric`
  );
  if (!res.ok) {
    let message = "City not found";
    try {
      const data = await res.json();
      if (data?.message) message = titleCase(data.message);
    } catch {}
    throw new Error(message);
  }
  return normalizeWeatherCard(await res.json());
}

async function fetchForecastWeather(cityName) {
  if (!API_KEY) throw new Error("Missing OpenWeather API key in .env");
  const res = await fetch(
    `${BASE_URL}/forecast?q=${encodeURIComponent(cityName)}&appid=${API_KEY}&units=metric`
  );
  if (!res.ok) throw new Error("Forecast unavailable");
  const data = await res.json();
  return normalizeForecast(data?.list || []);
}

async function fetchNearbyWeather(cityName) {
  const entries = NEARBY_CITIES[cityName] || DEFAULT_NEARBY;
  const results = await Promise.all(
    entries.map(async (entry) => {
      try {
        const card = await fetchCurrentWeather(entry.name);
        return { ...card, subtitle: entry.distance };
      } catch {
        return null;
      }
    })
  );
  return results.filter(Boolean);
}

function cardKey(card) {
  return `${card?.cityName || ""}__${card?.country || ""}`;
}

// ─── Sub-components ───
function WeatherStat({ icon: Icon, label, value }) {
  return (
    <div className="statCard">
      <div className="statIcon"><Icon size={18} /></div>
      <div>
        <div className="statLabel">{label}</div>
        <div className="statValue">{value}</div>
      </div>
    </div>
  );
}

function FavoriteHeart({ active, onClick }) {
  return (
    <button
      type="button"
      className={`heartBtn ${active ? "filled" : ""}`}
      onClick={onClick}
      aria-label={active ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart size={16} className={active ? "fill-pink-500 text-pink-500" : ""} />
    </button>
  );
}

function CityCard({ item, onFavoriteToggle, isFavorite, onOpen }) {
  const Icon = getWeatherIcon(item?.weatherId ?? 800);
  return (
    <div
      className="cityCard"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen?.(); }
      }}
    >
      <div style={{ position: "absolute", top: 12, right: 12, zIndex: 2 }}>
        <FavoriteHeart
          active={isFavorite}
          onClick={(e) => { e.stopPropagation(); onFavoriteToggle(item); }}
        />
      </div>
      <div>
        <div className="cityName">{item.label}</div>
        <div className="cityDistance">{item.subtitle}</div>
      </div>
      <div className="cityMid">
        <Icon size={36} color="#a8ddf0" strokeWidth={1.8} />
        <div>
          <div className="cityTemp">{item.temp}°C</div>
          <div className="cityCond">{item.condition}</div>
        </div>
      </div>
      <div className="cityRange">
        {item.tempMin ?? item.temp}° / <span className="rangeHi">{item.tempMax ?? item.temp}°</span>
      </div>
    </div>
  );
}

function LoadingState({ label }) {
  return (
    <div className="loadingState">
      <Loader2 className="spin" size={32} />
      <div>{label}</div>
    </div>
  );
}

// ─── App ───
function App() {
  const [search, setSearch] = useState("Delhi");
  const [dark, setDark] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [nearby, setNearby] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {}
  }, [favorites]);

  useEffect(() => {
    loadWeather("Delhi");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isDay = !dark;
  const currentIcon = weather ? getWeatherIcon(weather.weatherId) : CloudRain;
  const favoriteActive = weather ? favorites.some((item) => cardKey(item) === cardKey(weather)) : false;

  const openCity = async (cityName) => {
    if (!cityName?.trim()) return;
    setActiveTab("overview");
    setSearch(cityName.trim());
    await loadWeather(cityName.trim());
  };

  const loadWeather = async (cityName) => {
    if (!API_KEY) { setError("Missing OpenWeather API key in .env"); return; }
    setLoading(true);
    setError("");
    try {
      const current = await fetchCurrentWeather(cityName);
      const [nextForecast, nextNearby] = await Promise.all([
        fetchForecastWeather(current.cityName).catch(() => []),
        fetchNearbyWeather(current.cityName).catch(() => []),
      ]);
      setWeather(current);
      setForecast(nextForecast);
      setNearby(nextNearby);
      setSearch(current.cityName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to fetch weather");
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (item) => {
    const key = cardKey(item);
    setFavorites((prev) => {
      const exists = prev.some((fav) => cardKey(fav) === key);
      if (exists) return prev.filter((fav) => cardKey(fav) !== key);
      return [...prev, item];
    });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    await openCity(search.trim());
  };

  // ── Main weather card (shared across overview + forecast tab) ──
  const renderWeatherCard = (compact = false) => {
    if (!weather) return <LoadingState label="Search for a city to begin." />;
    return (
      <div className={`panel panelPad weatherCard`} style={{ flex: compact ? "none" : undefined }}>
        <div className="favoriteToggle">
          <FavoriteHeart active={favoriteActive} onClick={() => toggleFavorite(weather)} />
        </div>
        <div className="cardHeader">
          <div>
            <div className="cardLocation">
              <MapPin size={16} color="#a8ddf0" />
              <div className="cardTitle">{weather.label}</div>
            </div>
            <div className="cardSub">{weather.subtitle}</div>
          </div>
          <button type="button" className="actionBtn" onClick={() => loadWeather(weather.cityName)}>
            {compact ? "Refresh" : "Current Weather"}
          </button>
        </div>

        <div className="weatherHero">
          <div className="weatherIconWrap">
            {React.createElement(currentIcon, { size: compact ? 80 : 96, color: "#a8ddf0", strokeWidth: 1.7 })}
          </div>
          <div className="weatherTextBlock">
            <div>
              <span className="weatherTemp">{weather.temp}</span>
              <span className="weatherUnit">°C</span>
            </div>
            <div className="condition">{weather.condition}</div>
            <div className="feels">Feels like {Math.round(weather.tempMin)}°C</div>
          </div>
        </div>

        <div className="stats">
          <WeatherStat icon={Droplets} label="Humidity" value={`${weather.humidity}%`} />
          <WeatherStat icon={Wind} label="Wind" value={`${weather.wind} km/h`} />
          <WeatherStat icon={Gauge} label="Pressure" value={`${weather.pressure} hPa`} />
          <WeatherStat icon={Eye} label="Visibility" value={`${weather.visibility} km`} />
        </div>
      </div>
    );
  };

  // ── Forecast panel ──
  const renderForecastPanel = (actionLabel = "View More", onAction = () => setActiveTab("forecast")) => (
    <div className="panel panelPad forecastPanel">
      <div className="sectionHeader">
        <div>
          <div className="sectionTitle">5-Day Forecast</div>
          <div className="sectionSub">Useful weather outlook for the searched city.</div>
        </div>
        <button type="button" className="actionBtn" onClick={onAction}>{actionLabel}</button>
      </div>
      {forecast.length ? (
        <div className="forecastList">
          {forecast.map((item) => {
            const Icon = getWeatherIcon(item.weatherId);
            return (
              <div key={item.key} className="forecastRow">
                <div className="rowDay">
                  <div className="rowDayName">{item.dayLabel}</div>
                  <div className="rowDate">{item.dateLabel}</div>
                </div>
                <div className="rowCondition">
                  <Icon size={30} color="#a8ddf0" strokeWidth={1.8} />
                  <span>{item.condition}</span>
                </div>
                <div className="rowTemps">
                  {item.min}° <span className="muted">/</span>{" "}
                  <span style={{ color: "#56c8ef" }}>{item.max}°</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <LoadingState label="Forecast is loading..." />
      )}
    </div>
  );

  // ── Nearby cities section ──
  const renderNearbySection = (onAction = () => setActiveTab("nearby")) => (
    <div className="panel panelPad">
      <div className="nearbySectionHeader">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <MapPin size={18} color="#a8ddf0" />
          <div className="sectionTitle">Nearby 5 Cities</div>
        </div>
        <button type="button" className="actionBtn" onClick={onAction}>See on Map</button>
      </div>
      {nearby.length ? (
        <div className="cityGrid">
          {nearby.map((item) => (
            <CityCard
              key={cardKey(item)}
              item={item}
              isFavorite={favorites.some((fav) => cardKey(fav) === cardKey(item))}
              onFavoriteToggle={toggleFavorite}
              onOpen={() => openCity(item.cityName)}
            />
          ))}
        </div>
      ) : (
        <LoadingState label="Nearby cities are loading..." />
      )}
    </div>
  );

  // ── Page renders ──
  const renderOverview = () => {
    if (!weather && loading) {
      return (
        <div className="panel panelPad">
          <LoadingState label="Fetching live weather..." />
        </div>
      );
    }
    if (!weather && error) {
      return (
        <div className="panel panelPad">
          <div className="emptyBox">
            <Star size={36} className="emptyIcon" />
            <div className="emptyTitle">Weather data failed to load</div>
            <div className="emptyText">{error}</div>
          </div>
        </div>
      );
    }
    if (!weather) {
      return (
        <div className="panel panelPad">
          <LoadingState label="Search for a city to begin." />
        </div>
      );
    }

    return (
      <>
        {/* Top 2-column grid: weather card + forecast */}
        <div className="overviewGrid">
          {renderWeatherCard(false)}
          {renderForecastPanel("View More", () => setActiveTab("forecast"))}
        </div>
        {/* Nearby cities full-width below */}
        {renderNearbySection(() => setActiveTab("nearby"))}
      </>
    );
  };

  const renderForecastTab = () => {
    if (!weather && loading) return <div className="panel panelPad"><LoadingState label="Fetching live weather..." /></div>;
    if (!weather) return <div className="panel panelPad"><LoadingState label="Search a city to see the forecast." /></div>;
    return (
      <>
        <div className="tabGrid">
          {renderWeatherCard(true)}
          {renderForecastPanel("Back to Overview", () => setActiveTab("overview"))}
        </div>
      </>
    );
  };

  const renderNearbyTab = () => {
    if (!weather && loading) return <div className="panel panelPad"><LoadingState label="Fetching nearby cities..." /></div>;
    if (!weather) return <div className="panel panelPad"><LoadingState label="Search a city to see nearby weather." /></div>;
    return renderNearbySection(() => setActiveTab("overview"));
  };

  const renderFavoritesTab = () => (
    <div className="panel panelPad">
      <div className="sectionHeader">
        <div>
          <div className="sectionTitle">Favorites</div>
          <div className="sectionSub">Cities you starred, ready to open again.</div>
        </div>
        <button type="button" className="actionBtn" onClick={() => setActiveTab("overview")}>Back to Overview</button>
      </div>
      {favorites.length ? (
        <div className="cityGrid">
          {favorites.map((item) => (
            <CityCard
              key={cardKey(item)}
              item={item}
              isFavorite
              onFavoriteToggle={toggleFavorite}
              onOpen={() => openCity(item.cityName)}
            />
          ))}
        </div>
      ) : (
        <div className="emptyBox">
          <Star size={36} className="emptyIcon" />
          <div className="emptyTitle">No favorites yet</div>
          <div className="emptyText">Tap the heart on any city card to save it here.</div>
        </div>
      )}
    </div>
  );

  const renderMain = () => {
    if (activeTab === "overview") return renderOverview();
    if (activeTab === "forecast") return renderForecastTab();
    if (activeTab === "nearby") return renderNearbyTab();
    return renderFavoritesTab();
  };

  return (
    <div className={`app ${isDay ? "day" : "night"}`}>
      <style>{styles}</style>

      {/* Animated rain */}
      <RainCanvas isDay={isDay} />

      {/* City skyline silhouette */}
      <div className="skyline" />

      <div className="shell">
        {/* ── Sidebar ── */}
        {sidebarVisible && (
          <aside className="sidebar">
            <div className="brandRow">
              <div className="brandMark">
                <CloudRain size={24} color="#a8ddf0" strokeWidth={2} />
              </div>
              <div>
                <div className="brandTitle">Weathernix</div>
                <div className="brandSub">Smart Weather, Beautifully Simple</div>
              </div>
            </div>

            <nav className="navGroup">
              {[
                { id: "overview", icon: House, label: "Overview" },
                { id: "forecast", icon: CalendarDays, label: "Forecast" },
                { id: "nearby", icon: MapPin, label: "Nearby Cities" },
                { id: "favorites", icon: Heart, label: "Favorites" },
              ].map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  type="button"
                  className={`navBtn ${activeTab === id ? "active" : ""}`}
                  onClick={() => setActiveTab(id)}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </button>
              ))}
            </nav>

            <div className="sidebarCard">
              <div className="sidebarEmoji">☂️</div>
              <div className="sidebarCardTitle">Stay dry, stay awesome!</div>
              <div className="sidebarCardText">Check the weather before you head out.</div>
            </div>
          </aside>
        )}

        {/* ── Main content ── */}
        <main className="content">
          {/* Top bar */}
          <div className="topBar">
            <div className="topLeft">
              <div className="topTitle">Good Evening! 👋</div>
              <div className="topSub">Here's the latest weather update for you.</div>
            </div>
            <div className="topActions">
              {/* Day/Night toggle */}
              <div className="themeWrap">
                <Sun size={15} color={isDay ? "#f59e0b" : "rgba(255,255,255,.6)"} />
                <button
                  type="button"
                  className="themeToggle"
                  onClick={() => setDark((prev) => !prev)}
                  aria-label="Toggle day/night"
                >
                  <span className={`themeKnob ${isDay ? "day" : "dark"}`} />
                </button>
                <Moon size={15} color={isDay ? "rgba(0,50,100,.6)" : "#a8ddf0"} />
              </div>

              {/* Favorites quick access heart */}
              <button
                type="button"
                className="heartTopBtn"
                onClick={() => setActiveTab("favorites")}
                aria-label="Open favorites"
              >
                <Heart size={18} />
              </button>

              {/* Sidebar toggle */}
              <button
                type="button"
                className="iconBtn"
                aria-label={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
                onClick={() => setSidebarVisible((prev) => !prev)}
              >
                <Menu size={18} />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="searchWrap">
            <form className="searchBar" onSubmit={handleSearch}>
              <div className="searchField">
                <Search className="searchIcon" size={18} />
                <input
                  className="searchInput"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search for a city..."
                />
              </div>
              <button type="submit" className="searchBtn" aria-label="Search city">
                <ChevronRight size={26} />
              </button>
            </form>
          </div>

          {/* Notices */}
          {error && <div className="notice">{error}</div>}
          {loading && weather && (
            <div className="notice noticeInfo">Refreshing live weather…</div>
          )}

          {/* Scrollable page content */}
          <div className="pageScroll">
            {renderMain()}
            <footer>© 2024 Weathernix. All rights reserved.</footer>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
