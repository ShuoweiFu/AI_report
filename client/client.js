window.__ModuleLoader__.load({
	id: "dsh-liquid-glass",
	factory: (require) => {
		const React = require("react");
		const { createElement: h, Fragment, useEffect, useEffect: useLayoutEffect, useRef, useState, useSyncExternalStore } = React;

		const SOURCE = "dsh-liquid-glass";
		const STORAGE_KEY = "dsh-liquid-glass.settings.v2";
		const API = "/liquid-glass";
		/** Bumped whenever the mapping or the settings contract changes; visible via /liquid-glass/state. */
		const CLIENT_BUILD = "0.8.0 composite-behind";
		const LOAD_TAG = String((globalThis.__lgLoadCount = (globalThis.__lgLoadCount || 0) + 1));
		const DEFAULT_SETTINGS = Object.freeze({
			enabled: true,
			wallpaper: true,
			blur: 10,
			saturation: 1.4,
			tint: 0.55,
			dim: 0.08,
			refreshSec: 30,
			flow: 0.9,
			fps: 30,
			autoScale: true,
			source: "desktop"
		});

		const zh = {
			section: "液态玻璃",
			title: "液态玻璃",
			intro: "把桌面壁纸同步为 DSH 的背景，并让界面变成一层会流动的液态玻璃：面板与文字像悬空在壁纸上。",
			enable: "启用液态玻璃",
			enableHint: "关闭后立即恢复 DSH 原本的外观，设置会保留。",
			wallpaper: "同步桌面壁纸",
			wallpaperHint: "抓取当前桌面（含 Wallpaper Engine 动态壁纸）；窗口后面压着别的应用时，会把那个应用被遮住的部分一起合成进来。",
			blur: "背景模糊",
			saturation: "背景饱和",
			tint: "玻璃着色",
			dim: "壁纸压暗",
			refresh: "壁纸检测间隔",
			flow: "液态流动",
			flowHint: "壁纸折射、色散与高光的流动强度。",
			source: "背景来源",
			sourceHint: "「真实桌面」按屏幕坐标 1:1 映射桌面（含图标）；「壁纸本体」只取壁纸原图，不含图标。",
			sourceDesktop: "真实桌面（含图标）",
			sourceWallpaper: "壁纸本体（无图标）",
			refreshNow: "立即刷新",
			reset: "恢复默认",
			status: "壁纸状态",
			ready: "已同步",
			missing: "未找到壁纸",
			error: "读取失败",
			off: "已关闭",
			unknown: "—",
			source: "来源",
			size: "大小",
			moveHint: "桌面上移动鼠标，可以看到玻璃上的高光跟随。",
			perf: "性能保护",
			fps: "最大帧率",
			fpsHint: "核显建议 30；「无限制」只在独显台式机上使用。",
			autoScale: "自动降分辨率",
			autoScaleHint: "帧时间过高时降低着色器分辨率保命，流畅后自动恢复。",
			unlimited: "无限制",
			cssMode: "显卡过热保护：液态渲染已冻结，当前为静态磨砂玻璃。冷却后点「重新尝试」恢复。",
			contextLost: "检测到显卡驱动重置，已切换为静态玻璃（保命模式）。",
			autoDisabled: "连续两次显卡异常，已自动关闭液态玻璃。确认机器冷却后再手动开启。",
			retry: "重新尝试",
			noticeClose: "知道了",
			renderer: "渲染模式",
			running: "流动中",
			idleState: "按需渲染",
			pausedState: "已暂停",
			frozen: "冻结（静态）",
			scale: "渲染分辨率",
			frames: "累计帧"
		};
		const en = {
			section: "Liquid Glass",
			title: "Liquid Glass",
			intro: "Mirror the desktop wallpaper behind DeepSeek Harness and turn every surface into flowing liquid glass, so panels and text appear to float on the wallpaper.",
			enable: "Enable Liquid Glass",
			enableHint: "Turning this off restores the stock look immediately; settings are kept.",
			wallpaper: "Sync desktop wallpaper",
			wallpaperHint: "Captures the live desktop (Wallpaper Engine included); when another app sits behind this window, the occluded part of that app is composited in too.",
			blur: "Background blur",
			saturation: "Background saturation",
			tint: "Glass tint",
			dim: "Wallpaper dim",
			refresh: "Wallpaper poll interval",
			flow: "Liquid flow",
			flowHint: "Strength of the refraction, dispersion and moving highlights.",
			source: "Background source",
			sourceHint: "Real desktop maps the desktop 1:1 in screen space (icons included); Wallpaper only takes the icon-free wallpaper picture.",
			sourceDesktop: "Real desktop (icons)",
			sourceWallpaper: "Wallpaper only (no icons)",
			refreshNow: "Refresh now",
			reset: "Reset",
			status: "Wallpaper status",
			ready: "Synced",
			missing: "No wallpaper found",
			error: "Read failed",
			off: "Disabled",
			unknown: "—",
			source: "Source",
			size: "Size",
			moveHint: "Move the pointer over the window to see the glass highlights follow.",
			perf: "Performance guard",
			fps: "Max frame rate",
			fpsHint: "30 is the safe choice on integrated GPUs; use unlimited only on a discrete desktop GPU.",
			autoScale: "Dynamic resolution",
			autoScaleHint: "Drops the shader resolution when frame times spike, and restores it when smooth again.",
			unlimited: "Unlimited",
			cssMode: "GPU overheat guard: liquid rendering is frozen, showing static frosted glass. Let the machine cool, then retry.",
			contextLost: "The graphics driver reset; switched to static glass (fail-safe mode).",
			autoDisabled: "The GPU failed twice, so liquid glass was disabled automatically. Re-enable it after the machine cools down.",
			retry: "Retry",
			noticeClose: "Got it",
			renderer: "Renderer",
			running: "Flowing",
			idleState: "On demand",
			pausedState: "Paused",
			frozen: "Frozen (static)",
			scale: "Resolution",
			frames: "Frames"
		};

		function dictFor(lang) {
			return String(lang || "").toLowerCase().startsWith("zh") ? zh : en;
		}

		function makeTranslate(lang) {
			const dict = dictFor(lang);
			return (key) => dict[key] ?? key;
		}

		function normalize(raw) {
			const source = raw && typeof raw === "object" ? raw : {};
			const num = (value, fallback, min, max) => {
				const parsed = typeof value === "number" ? value : Number.parseFloat(value);
				return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
			};
			return {
				enabled: source.enabled !== false,
				wallpaper: source.wallpaper !== false,
				blur: Math.round(num(source.blur, DEFAULT_SETTINGS.blur, 0, 48)),
				saturation: num(source.saturation, DEFAULT_SETTINGS.saturation, 1, 2.4),
				tint: num(source.tint, DEFAULT_SETTINGS.tint, 0, 1),
				dim: num(source.dim, DEFAULT_SETTINGS.dim, 0, 0.6),
				refreshSec: Math.round(num(source.refreshSec, DEFAULT_SETTINGS.refreshSec, 5, 300)),
				flow: num(source.flow, DEFAULT_SETTINGS.flow, 0, 1.5),
				fps: Math.round(num(source.fps, DEFAULT_SETTINGS.fps, 0, 240)),
				autoScale: source.autoScale !== false,
				source: source.source === "wallpaper" ? "wallpaper" : "desktop"
			};
		}

		function readSettings() {
			try {
				const raw = localStorage.getItem(STORAGE_KEY);
				return normalize(raw ? JSON.parse(raw) : DEFAULT_SETTINGS);
			} catch {
				return normalize(DEFAULT_SETTINGS);
			}
		}

		function persistSettings(value) {
			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
			} catch {
				// Private mode or a full quota: the panel still works for this page.
			}
		}

		function clampAlpha(value) {
			return Math.min(1, Math.max(0, Number(value.toFixed(3))));
		}

		/**
		 * Per-token glass values from the single tint slider. The sidebar fill in
		 * particular stays very light because the frame AND the sidebar column both
		 * paint it — two layers of the same value would otherwise go opaque.
		 */
		function glassTokens(tint) {
			const t = Math.min(1, Math.max(0, tint));
			// The chrome must stay legible over a bright wallpaper: every surface
			// keeps a frosted veil, while the frame edges and the gaps stay clear so
			// the wallpaper still reads through the glass.
			const light = {
				"--dsw-alias-bg-base": `rgba(255,255,255,${clampAlpha(0.3 + 0.22 * t)})`,
				"--dsw-alias-bg-layer-1": `rgba(255,255,255,${clampAlpha(0.3 + 0.3 * t)})`,
				"--dsw-alias-bg-layer-2": `rgba(255,255,255,${clampAlpha(0.4 + 0.3 * t)})`,
				"--dsw-alias-bg-overlay": `rgba(251,252,255,${clampAlpha(0.6 + 0.3 * t)})`,
				"--dsw-specific-sidebar-fill": `rgba(255,255,255,${clampAlpha(0.22 + 0.2 * t)})`,
				"--dsw-alias-border-l1": "rgba(20,24,32,0.1)",
				"--dsw-alias-border-l2": "rgba(20,24,32,0.16)"
			};
			const dark = {
				"--dsw-alias-bg-base": `rgba(9,11,16,${clampAlpha(0.34 + 0.22 * t)})`,
				"--dsw-alias-bg-layer-1": `rgba(14,18,26,${clampAlpha(0.34 + 0.3 * t)})`,
				"--dsw-alias-bg-layer-2": `rgba(20,25,35,${clampAlpha(0.44 + 0.28 * t)})`,
				"--dsw-alias-bg-overlay": `rgba(18,22,31,${clampAlpha(0.64 + 0.26 * t)})`,
				"--dsw-specific-sidebar-fill": `rgba(11,14,21,${clampAlpha(0.26 + 0.2 * t)})`,
				"--dsw-alias-border-l1": "rgba(255,255,255,0.1)",
				"--dsw-alias-border-l2": "rgba(255,255,255,0.16)"
			};
			const out = {};
			for (const token of Object.keys(light)) out[token] = { light: light[token], dark: dark[token] };
			return out;
		}

		function currentMode() {
			if (document.body?.hasAttribute("data-ds-dark-theme")) return "dark";
			return "light";
		}

		function formatBytes(bytes) {
			if (!bytes || bytes <= 0) return "—";
			const units = ["B", "KB", "MB", "GB"];
			let value = bytes;
			let unit = 0;
			while (value >= 1024 && unit < units.length - 1) {
				value /= 1024;
				unit += 1;
			}
			return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
		}

		let reportedAt = 0;

		/** Forward client-side failures to the host so they survive a reload. */
		function reportClientError(message, urgent = false) {
			try {
				const now = Date.now();
				if (!urgent && now - reportedAt < 1500) return;
				reportedAt = now;
				const text = encodeURIComponent(String(message).slice(0, 3500));
				void fetch(`${API}/log?msg=${text}`, { credentials: "same-origin" }).catch(() => {});
			} catch {
				// Diagnostics are best effort.
			}
		}

		/** Keeps one failing overlay from deactivating the whole slot entry. */
		class Guard extends React.Component {
			constructor(props) {
				super(props);
				this.state = { error: null };
			}

			static getDerivedStateFromError(error) {
				return { error: String(error?.message ?? error) };
			}

			componentDidCatch(error) {
				reportClientError(`overlay: ${String(error?.stack ?? error)}`);
			}

			render() {
				return this.state.error ? null : this.props.children;
			}
		}

		const CSS = String.raw`
:root {
	--lg-wallpaper: none;
	--lg-blur: 10px;
	--lg-sat: 1.4;
	--lg-dim: 0.08;
	--lg-tint: 0.55;
	--lg-mx: 50%;
	--lg-my: 30%;
	--lg-fallback: #0b0e14;
}

html[data-lg-enabled="on"],
html[data-lg-enabled="on"] body {
	background: transparent !important;
}

/* CSS fallback wallpaper; the WebGL canvas takes over when it is running. */
html[data-lg-enabled="on"] body::before {
	content: "";
	position: fixed;
	inset: 0;
	z-index: -2;
	pointer-events: none;
	background-color: var(--lg-fallback);
	background-image: var(--lg-wallpaper, none);
	background-position: center;
	background-size: cover;
	background-repeat: no-repeat;
	opacity: calc(1 - var(--lg-dim));
}

html[data-lg-enabled="on"][data-lg-webgl="on"] body::before {
	background-image: none !important;
}

/* Soft moving sheen + depth over the wallpaper. */
html[data-lg-enabled="on"] body::after {
	content: "";
	position: fixed;
	inset: 0;
	z-index: -1;
	pointer-events: none;
	background:
		radial-gradient(140% 90% at 78% -20%, rgba(255, 255, 255, 0.16), transparent 58%),
		radial-gradient(120% 70% at 12% 110%, rgba(255, 255, 255, 0.07), transparent 55%),
		linear-gradient(160deg, rgba(255, 255, 255, 0.05), transparent 42%, rgba(0, 0, 0, 0.12));
}

html[data-lg-enabled="on"][data-lg-mode="light"] body::after {
	background:
		radial-gradient(140% 90% at 78% -20%, rgba(255, 255, 255, 0.3), transparent 60%),
		radial-gradient(120% 70% at 12% 110%, rgba(255, 255, 255, 0.18), transparent 55%),
		linear-gradient(160deg, rgba(255, 255, 255, 0.12), transparent 45%, rgba(12, 16, 24, 0.04));
}

/* Gate: an application window really sits behind DSH, so nothing may show
   through. Hide every glass layer and let the shipped opaque theme win. */
html[data-lg-suppressed="on"] body::before,
html[data-lg-suppressed="on"] body::after,
html[data-lg-suppressed="on"] canvas[data-liquid-glass],
html[data-lg-suppressed="on"] #root::after,
html[data-lg-suppressed="on"] .lg-light {
	display: none !important;
}

html[data-lg-suppressed="on"] #root {
	background: transparent !important;
	-webkit-backdrop-filter: none !important;
	backdrop-filter: none !important;
}

/* The glass pane: blur + saturation of everything behind the app. */
html[data-lg-enabled="on"] #root {
	background: transparent !important;
	-webkit-backdrop-filter: blur(var(--lg-blur)) saturate(var(--lg-sat));
	backdrop-filter: blur(var(--lg-blur)) saturate(var(--lg-sat));
}

/* Edge bevel: reads as a thick pane with an inner lens ring. */
html[data-lg-enabled="on"] #root::after {
	content: "";
	position: fixed;
	inset: 0;
	z-index: 2147483000;
	pointer-events: none;
	border-radius: 16px;
	background:
		radial-gradient(520px 420px at var(--lg-mx) var(--lg-my), rgba(255, 255, 255, 0.12), transparent 62%),
		linear-gradient(180deg, rgba(255, 255, 255, 0.1), transparent 12%, transparent 88%, rgba(0, 0, 0, 0.08));
	box-shadow:
		inset 0 0 0 1px rgba(255, 255, 255, 0.18),
		inset 0 1px 0 rgba(255, 255, 255, 0.5),
		inset 0 -1px 0 rgba(0, 0, 0, 0.22),
		inset 0 32px 48px -40px rgba(255, 255, 255, 0.28),
		inset 0 -48px 72px -56px rgba(0, 0, 0, 0.28);
}

/* Pointer-tracked highlight + a slow light sweep, above the whole app. */
.lg-light {
	position: fixed;
	inset: 0;
	z-index: 3;
	pointer-events: none;
	overflow: hidden;
	border-radius: 16px;
}

.lg-light::before {
	content: "";
	position: absolute;
	inset: 0;
	background: radial-gradient(
		420px 340px at var(--lg-mx) var(--lg-my),
		rgba(255, 255, 255, 0.2),
		rgba(255, 255, 255, 0.06) 38%,
		transparent 68%
	);
	mix-blend-mode: screen;
	opacity: 0.55;
	transition: opacity 0.4s ease;
}

.lg-light::after {
	content: "";
	position: absolute;
	inset: -30% -10%;
	background: linear-gradient(
		115deg,
		transparent 32%,
		rgba(255, 255, 255, 0.14) 46%,
		rgba(255, 255, 255, 0.03) 52%,
		transparent 64%
	);
	mix-blend-mode: overlay;
	animation: lg-sweep 16s ease-in-out infinite;
}

@keyframes lg-sweep {
	0% { transform: translate3d(-26%, -4%, 0) rotate(-2deg); }
	50% { transform: translate3d(26%, 4%, 0) rotate(2deg); }
	100% { transform: translate3d(-26%, -4%, 0) rotate(-2deg); }
}

@media (prefers-reduced-motion: reduce) {
	.lg-light::after { animation: none; }
}

@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
	html[data-lg-enabled="on"] #root {
		background: color-mix(in srgb, var(--lg-fallback) 88%, transparent) !important;
	}
}

/* ---- settings section ---- */
.lg-panel {
	display: flex;
	flex-direction: column;
	gap: 16px;
	padding: 2px 2px 28px;
	color: var(--dsw-alias-label-primary);
}

.lg-head h2 {
	margin: 0 0 6px;
	font-size: 16px;
	font-weight: 600;
}

.lg-head p {
	margin: 0;
	font-size: 12.5px;
	line-height: 1.65;
	color: var(--dsw-alias-label-secondary);
}

.lg-card {
	display: flex;
	flex-direction: column;
	gap: 14px;
	padding: 14px 16px;
	border: 1px solid var(--dsw-alias-border-l1);
	border-radius: 12px;
	background: var(--dsw-alias-bg-layer-1);
	box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.lg-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
}

.lg-label {
	display: flex;
	flex-direction: column;
	gap: 2px;
	font-size: 13px;
}

.lg-hint {
	font-size: 11.5px;
	cursor: default;
	color: var(--dsw-alias-label-secondary);
}

.lg-switch {
	position: relative;
	flex: none;
	width: 38px;
	height: 22px;
	padding: 0;
	border: 1px solid var(--dsw-alias-border-l2);
	border-radius: 999px;
	background: var(--dsw-alias-bg-layer-2);
	cursor: pointer;
}

.lg-switch[data-on="true"] {
	border-color: transparent;
	background: var(--dsw-alias-brand-primary);
}

.lg-switch i {
	position: absolute;
	top: 2px;
	left: 2px;
	width: 16px;
	height: 16px;
	border-radius: 50%;
	background: #fff;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
	transition: left 0.18s ease;
}

.lg-switch[data-on="true"] i {
	left: 18px;
}

.lg-slider {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.lg-slider-head {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	font-size: 13px;
}

.lg-slider-head b {
	font-size: 12px;
	font-weight: 500;
	font-variant-numeric: tabular-nums;
	color: var(--dsw-alias-label-secondary);
}

.lg-slider input {
	width: 100%;
	accent-color: var(--dsw-alias-brand-primary);
}

.lg-status {
	display: flex;
	align-items: flex-start;
	gap: 10px;
	font-size: 12px;
	line-height: 1.55;
	color: var(--dsw-alias-label-secondary);
}

.lg-dot {
	flex: none;
	width: 8px;
	height: 8px;
	margin-top: 5px;
	border-radius: 50%;
	background: var(--dsw-alias-state-idle-primary);
}

.lg-dot[data-state="ready"] {
	background: var(--dsw-alias-state-success-primary);
}

.lg-dot[data-state="error"],
.lg-dot[data-state="missing"] {
	background: var(--dsw-alias-state-error-primary);
}

.lg-status b {
	font-weight: 500;
	color: var(--dsw-alias-label-primary);
}

.lg-actions {
	display: flex;
	gap: 10px;
}

.lg-button {
	padding: 6px 14px;
	border: 1px solid var(--dsw-alias-border-l2);
	border-radius: 999px;
	background: var(--dsw-alias-bg-layer-1);
	color: var(--dsw-alias-label-primary);
	font-size: 12.5px;
	cursor: pointer;
}

.lg-button:hover {
	background: var(--dsw-alias-bg-layer-2);
}

.lg-warn {
	position: fixed;
	left: 50%;
	bottom: 22px;
	z-index: 2147483000;
	display: flex;
	align-items: center;
	gap: 10px;
	max-width: min(720px, calc(100vw - 40px));
	padding: 10px 14px;
	border: 1px solid var(--dsw-alias-state-warn-primary);
	border-radius: 12px;
	background: color-mix(in srgb, var(--dsw-alias-bg-overlay) 82%, #000 18%);
	color: var(--dsw-alias-label-primary);
	font-size: 12.5px;
	line-height: 1.45;
	box-shadow: 0 12px 32px rgba(0, 0, 0, 0.28);
	transform: translateX(-50%);
	pointer-events: auto;
	backdrop-filter: blur(10px);
}

.lg-warn[data-degrade="off"] {
	border-color: var(--dsw-alias-state-error-primary);
}

.lg-warn-text {
	flex: 1;
}

.lg-select {
	padding: 5px 10px;
	border: 1px solid var(--dsw-alias-border-l2);
	border-radius: 8px;
	background: var(--dsw-alias-bg-layer-1);
	color: var(--dsw-alias-label-primary);
	font-size: 12.5px;
}

.lg-metrics {
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 8px;
}

.lg-metric {
	padding: 8px 10px;
	border: 1px solid var(--dsw-alias-border-l1);
	border-radius: 10px;
	background: var(--dsw-alias-bg-layer-1);
}

.lg-metric span {
	display: block;
	font-size: 11px;
	color: var(--dsw-alias-label-secondary);
}

.lg-metric b {
	font-size: 13.5px;
	font-weight: 600;
	color: var(--dsw-alias-label-primary);
	font-variant-numeric: tabular-nums;
}
`;

		/**
		 * WebGL liquid wallpaper: the desktop picture is re-rendered every frame
		 * through a shader that warps it like a slow liquid, adds chromatic
		 * dispersion and moving caustics, and ripples around the pointer. CSS alone
		 * cannot do this — backdrop-filter only blurs, it cannot displace.
		 */
		const VERTEX_SHADER = "attribute vec2 aPos; void main() { gl_Position = vec4(aPos, 0.0, 1.0); }";

		const FRAGMENT_SHADER = String.raw`
precision highp float;
uniform vec2 uRes;
uniform vec2 uScreen;
uniform vec2 uWin;
uniform float uScale;
uniform float uDpr;
uniform vec2 uTexRes;
uniform sampler2D uTex;
uniform float uTime;
uniform float uSat;
uniform float uDim;
uniform float uFlow;
uniform vec2 uMouse;

float hash(vec2 p) {
	return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	vec2 u = f * f * (3.0 - 2.0 * f);
	return mix(
		mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
		mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
		u.y
	);
}

float fbm(vec2 p) {
	float value = 0.0;
	float amplitude = 0.5;
	for (int i = 0; i < 4; i++) {
		value += amplitude * noise(p);
		p *= 2.03;
		amplitude *= 0.5;
	}
	return value;
}

void main() {
	vec2 frag = gl_FragCoord.xy;
	vec2 res = uRes;

	// Screen-space mapping: this fragment shows a real desktop pixel, so the
	// picture behind the window matches the wallpaper around it instead of
	// being stretched over the window rectangle. Everything is computed in CSS
	// pixels so dynamic resolution scaling cannot shift the picture.
	vec2 fragCss = frag / uScale;
	vec2 screenUv = (uWin + fragCss) / uScreen;
	vec2 screenDev = uScreen * uDpr;
	float cover = max(screenDev.x / uTexRes.x, screenDev.y / uTexRes.y);
	// gl_FragCoord counts upwards from the bottom; texture rows count from the
	// top, so flip V here instead of relying on UNPACK_FLIP_Y_WEBGL (which
	// Chromium ignores for ImageBitmap uploads).
	screenUv.y = 1.0 - screenUv.y;
	vec2 uv = (screenUv - 0.5) * (screenDev / (uTexRes * cover)) + 0.5;

	float t = uTime;
	vec2 p = uv * vec2(uTexRes.x / uTexRes.y, 1.0) * 2.0;

	// Liquid domain warp.
	float n1 = fbm(p + vec2(t * 0.03, -t * 0.02));
	float n2 = fbm(p * 1.3 + vec2(-t * 0.025, t * 0.03) + n1);
	vec2 warp = vec2(n1 - 0.5, n2 - 0.5) * 0.05 * uFlow;

	// Ripple that follows the pointer (uMouse is already in screen UV space).
	vec2 mouse = uMouse;
	vec2 delta = uv - mouse;
	float dist = length(delta) + 1e-4;
	float ripple = sin(dist * 26.0 - t * 2.2) * exp(-dist * 5.0) * 0.012 * uFlow;
	vec2 rippled = uv + (delta / dist) * ripple;

	vec2 fuv = clamp(rippled + warp, 0.002, 0.998);

	// Chromatic dispersion: the "thick glass" look.
	vec2 ca = (fuv - 0.5) * 0.004;
	vec3 color;
	color.r = texture2D(uTex, clamp(fuv + ca, 0.002, 0.998)).r;
	color.g = texture2D(uTex, fuv).g;
	color.b = texture2D(uTex, clamp(fuv - ca, 0.002, 0.998)).b;

	// Slow caustics: large soft light patches that keep moving.
	float caustic = fbm(p * 0.8 + vec2(t * 0.05, t * 0.04));
	color *= 0.9 + caustic * 0.22 * uFlow + (1.0 - uFlow) * 0.05;

	// A slow specular band sweeping diagonally.
	float band = smoothstep(0.36, 0.56, abs(sin((uv.x + uv.y * 0.6) * 3.2 - t * 0.35)));
	color += band * 0.03 * uFlow;

	float luma = dot(color, vec3(0.299, 0.587, 0.114));
	color = mix(vec3(luma), color, uSat);
	color *= 1.0 - uDim * 0.85;

	gl_FragColor = vec4(color, 1.0);
}
`;

		function compileShader(gl, type, source) {
			const shader = gl.createShader(type);
			gl.shaderSource(shader, source);
			gl.compileShader(shader);
			if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
				const info = gl.getShaderInfoLog(shader);
				gl.deleteShader(shader);
				throw new Error(`liquid-glass shader: ${info}`);
			}
			return shader;
		}

		/**
		 * Owns the WebGL canvas that paints the liquid wallpaper and its five
		 * protection layers: visibility/focus circuit breaker, frame-rate
		 * throttle, dynamic resolution, render-on-demand, and a context-lost
		 * escape hatch that drops to static CSS glass.
		 */
		function createLiquidCanvas(options = {}) {
			const onFault = typeof options.onFault === "function" ? options.onFault : () => {};
			const canvas = document.createElement("canvas");
			canvas.setAttribute("aria-hidden", "true");
			canvas.dataset.liquidGlass = "canvas";
			Object.assign(canvas.style, {
				position: "fixed",
				inset: "0",
				width: "100%",
				height: "100%",
				zIndex: "-2",
				pointerEvents: "none",
				display: "block"
			});

			const gl = canvas.getContext("webgl", {
				antialias: false,
				alpha: false,
				depth: false,
				stencil: false,
				premultipliedAlpha: false,
				// Keep the last frame on screen when the guard freezes the loop;
				// otherwise a paused WebGL canvas can composite as transparent/black.
				preserveDrawingBuffer: true,
				powerPreference: "high-performance"
			});
			if (!gl) return null;

			let contextLost = false;
			// Our own dispose() loses the context on purpose; that event is not a fault.
			let disposed = false;
			let running = false;
			let frame = 0;
			let lastRenderAt = 0;
			let lastTickAt = 0;
			let slowTicks = 0;
			let fastTicks = 0;
			let scaleIndex = 0;
			let idleTimer = 0;
			let resumeTimer = 0;
			const SCALES = [1, 0.8, 0.65, 0.5];
			const perf = {
				targetFps: 30,
				autoScale: true,
				idle: false,
				frames: 0,
				paused: new Set()
			};
			const frameInterval = () => (perf.targetFps > 0 ? 1000 / perf.targetFps : 0);

			let program;
			try {
				program = gl.createProgram();
				gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
				gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
				gl.linkProgram(program);
				if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
					throw new Error(`liquid-glass link: ${gl.getProgramInfoLog(program)}`);
				}
			} catch (error) {
				console.warn("[liquid-glass]", error);
				return null;
			}

			gl.useProgram(program);

			const buffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
			const aPos = gl.getAttribLocation(program, "aPos");
			gl.enableVertexAttribArray(aPos);
			gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

			const uniforms = {
				res: gl.getUniformLocation(program, "uRes"),
				screen: gl.getUniformLocation(program, "uScreen"),
				win: gl.getUniformLocation(program, "uWin"),
				scale: gl.getUniformLocation(program, "uScale"),
				dpr: gl.getUniformLocation(program, "uDpr"),
				texRes: gl.getUniformLocation(program, "uTexRes"),
				tex: gl.getUniformLocation(program, "uTex"),
				time: gl.getUniformLocation(program, "uTime"),
				sat: gl.getUniformLocation(program, "uSat"),
				dim: gl.getUniformLocation(program, "uDim"),
				flow: gl.getUniformLocation(program, "uFlow"),
				mouse: gl.getUniformLocation(program, "uMouse")
			};

			let texture = null;
			let textureError = "";
			let textureRequest = 0;
			const clock = { start: performance.now() };
			const mouse = { x: 0, y: 0 };
			const params = { sat: 1.6, dim: 0.08, flow: 0.85 };
			const dpr = () => Math.min(2, window.devicePixelRatio || 1);

			function setScale(next) {
				const index = Math.max(0, Math.min(SCALES.length - 1, next));
				if (index === scaleIndex) return;
				scaleIndex = index;
				if (running && !perf.idle) schedule(true);
			}

			function resize() {
				const ratio = dpr() * SCALES[scaleIndex];
				const width = Math.max(1, Math.round(window.innerWidth * ratio));
				const height = Math.max(1, Math.round(window.innerHeight * ratio));
				if (canvas.width !== width || canvas.height !== height) {
					canvas.width = width;
					canvas.height = height;
				}
				gl.viewport(0, 0, width, height);
				return ratio;
			}

			/** Where the window sits on screen, in CSS pixels (plus canvas scale). */
			function geometry() {
				const dpr = window.devicePixelRatio || 1;
				const screenW = window.screen?.width || window.innerWidth;
				const screenH = window.screen?.height || window.innerHeight;
				const frameX = Math.max(0, ((window.outerWidth || window.innerWidth) - window.innerWidth) / 2);
				const frameY = Math.max(0, (window.outerHeight || window.innerHeight) - window.innerHeight);
				const left = (window.screenX || 0) + frameX;
				const top = (window.screenY || 0) + frameY;
				const scale = canvas.width / Math.max(1, window.innerWidth);
				return { dpr, screenW, screenH, left, scale, winBottom: screenH - (top + window.innerHeight) };
			}

			function render(now) {
				const ratio = resize();
				gl.uniform2f(uniforms.res, canvas.width, canvas.height);
				gl.uniform1f(uniforms.time, (now - clock.start) / 1000);
				gl.uniform1f(uniforms.sat, params.sat);
				gl.uniform1f(uniforms.dim, params.dim);
				gl.uniform1f(uniforms.flow, params.flow);
				const geo = geometry();
				gl.uniform2f(uniforms.screen, geo.screenW, geo.screenH);
				gl.uniform2f(uniforms.win, geo.left, geo.winBottom);
				gl.uniform1f(uniforms.scale, geo.scale);
				gl.uniform1f(uniforms.dpr, geo.dpr);
				gl.uniform2f(
					uniforms.mouse,
					(geo.left + mouse.x) / geo.screenW,
					1 - (geo.winBottom + (window.innerHeight - mouse.y)) / geo.screenH
				);
				if (texture) {
					gl.activeTexture(gl.TEXTURE0);
					gl.bindTexture(gl.TEXTURE_2D, texture.handle);
					gl.uniform1i(uniforms.tex, 0);
					gl.uniform2f(uniforms.texRes, texture.width, texture.height);
				}
				gl.drawArrays(gl.TRIANGLES, 0, 3);
				perf.frames += 1;
			}

			/** Adapt the resolution from the rAF cadence: only a real stall downsamples. */
			function adapt(gap) {
				if (!perf.autoScale) return;
				// Never adapt from throttled background frames: Chromium stretches
				// rAF gaps to seconds for occluded windows, which is not a real stall.
				if (!document.hasFocus() || document.visibilityState !== "visible") return;
				if (gap > 1000) return;
				const target = 1000 / 60;
				if (gap > Math.max(34, target * 1.6)) {
					slowTicks += 1;
					fastTicks = 0;
				} else if (gap < target * 1.35) {
					fastTicks += 1;
					slowTicks = 0;
				} else {
					slowTicks = 0;
					fastTicks = 0;
				}
				if (slowTicks >= 10) {
					setScale(scaleIndex + 1);
					slowTicks = 0;
				} else if (fastTicks >= 300) {
					setScale(scaleIndex - 1);
					fastTicks = 0;
				}
			}

			function tick(now) {
				frame = 0;
				if (!running || contextLost) return;
				// A paused (unfocused / hidden) window must not keep a rAF alive:
				// the loop stays fully parked until focus returns.
				if (perf.paused.size) return;
				if (perf.idle) return; // Fully suspended until wake().
				const gap = lastTickAt ? now - lastTickAt : 16.7;
				lastTickAt = now;
				const interval = frameInterval();
				const due = !interval || now - lastRenderAt >= interval - 0.5;
				if (due) {
					render(now);
					lastRenderAt = now;
					adapt(gap);
				}
				schedule();
			}

			function schedule(force) {
				if (!running || perf.idle || perf.paused.size || contextLost) return;
				if (frame && !force) return;
				if (frame) cancelAnimationFrame(frame);
				frame = requestAnimationFrame(tick);
			}

			function stopFrames() {
				if (frame) cancelAnimationFrame(frame);
				frame = 0;
				lastTickAt = 0;
			}

			function stop() {
				running = false;
				clearTimeout(idleTimer);
				clearTimeout(resumeTimer);
				stopFrames();
			}

			function start() {
				if (running) return;
				running = true;
				perf.idle = false;
				lastRenderAt = 0;
				lastTickAt = 0;
				schedule();
			}

			/** Layer 4: nothing changes visually, so stop asking the GPU for frames. */
			function armIdle() {
				clearTimeout(idleTimer);
				if (!running || perf.paused.size) return;
				if (params.flow > 0.02) return;
				idleTimer = setTimeout(() => {
					if (!running || perf.paused.size) return;
					if (params.flow > 0.02) return;
					perf.idle = true;
					stopFrames();
				}, 1500);
			}

			function wake() {
				if (!running || contextLost) return;
				perf.idle = false;
				lastRenderAt = 0;
				schedule(true);
			}

			canvas.addEventListener(
				"webglcontextlost",
				(event) => {
					event.preventDefault();
					if (disposed) return;
					contextLost = true;
					stop();
					onFault("lost");
				},
				false
			);
			canvas.addEventListener("webglcontextrestored", () => onFault("restored"), false);

			/**
			 * Pull a single frame out of a video wallpaper. Range support on the
			 * host route means only the beginning + the seek target are fetched.
			 */
			function frameFromVideo(url) {
				return new Promise((resolve, reject) => {
					const video = document.createElement("video");
					video.muted = true;
					video.playsInline = true;
					video.preload = "auto";
					video.crossOrigin = "anonymous";
					let settled = false;
					const timer = setTimeout(() => fail(new Error("video frame timeout")), 20_000);
					function cleanup() {
						video.removeAttribute("src");
						try {
							video.load();
						} catch {
							// Detaching an already detached element is harmless.
						}
						video.remove();
					}
					function fail(error) {
						if (settled) return;
						settled = true;
						clearTimeout(timer);
						cleanup();
						reject(error instanceof Error ? error : new Error("video frame failed"));
					}
					video.addEventListener("error", () => fail(new Error("video decode failed")), { once: true });
					video.addEventListener(
						"loadedmetadata",
						() => {
							const duration = Number.isFinite(video.duration) ? video.duration : 0;
							const target = duration > 2 ? Math.min(duration - 0.4, Math.max(0.6, duration * 0.18)) : 0;
							video.addEventListener(
								"seeked",
								() => {
									try {
										const widest = Math.max(video.videoWidth, video.videoHeight);
										const scale = Math.min(1, 2048 / Math.max(1, widest));
										const snapshot = document.createElement("canvas");
										snapshot.width = Math.max(1, Math.round(video.videoWidth * scale));
										snapshot.height = Math.max(1, Math.round(video.videoHeight * scale));
										snapshot.getContext("2d").drawImage(video, 0, 0, snapshot.width, snapshot.height);
										if (settled) return;
										settled = true;
										clearTimeout(timer);
										cleanup();
										resolve(snapshot);
									} catch (error) {
										fail(error);
									}
								},
								{ once: true }
							);
							try {
								video.currentTime = target;
							} catch (error) {
								fail(error);
							}
						},
						{ once: true }
					);
					video.src = url;
					video.load();
				});
			}

			async function setWallpaper(url, kind = "image") {
				const request = ++textureRequest;
				try {
					// Cap every texture so a 4K wallpaper cannot blow up VRAM on an iGPU.
					const MAX_TEX = 2048;
					/** @type {TexImageSource} */
					let source;
					if (kind === "video") {
						source = await frameFromVideo(url);
						if (request !== textureRequest) return;
					} else {
						const response = await fetch(url, { cache: "no-store", credentials: "same-origin" });
						if (!response.ok) throw new Error(`HTTP ${response.status}`);
						const blob = await response.blob();
						let bitmap = await createImageBitmap(blob);
						if (request !== textureRequest) {
							bitmap.close?.();
							return;
						}
						const widest = Math.max(bitmap.width, bitmap.height);
						if (widest > MAX_TEX) {
							const factor = MAX_TEX / widest;
							const scaled = await createImageBitmap(blob, {
								resizeWidth: Math.round(bitmap.width * factor),
								resizeHeight: Math.round(bitmap.height * factor),
								resizeQuality: "high"
							});
							bitmap.close?.();
							bitmap = scaled;
						}
						source = bitmap;
					}
					// Read the dimensions before close(): a closed ImageBitmap reports 0x0.
					const sourceWidth = source.width;
					const sourceHeight = source.height;
					const handle = gl.createTexture();
					gl.bindTexture(gl.TEXTURE_2D, handle);
					// Rows are uploaded top-down; the shader flips V explicitly.
					gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
					gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
					source.close?.();
					if (texture) gl.deleteTexture(texture.handle);
					texture = { handle, width: sourceWidth, height: sourceHeight };
					textureError = "";
					if (running) {
						lastRenderAt = 0;
						schedule(true);
					}
				} catch (error) {
					textureError = String(error?.message ?? error);
					console.warn("[liquid-glass] wallpaper texture failed", error);
				}
			}

			return {
				canvas,
				setWallpaper,
				setParams(next) {
					if (typeof next.sat === "number") params.sat = next.sat;
					if (typeof next.dim === "number") params.dim = next.dim;
					if (typeof next.flow === "number") params.flow = next.flow;
					armIdle();
				},
				setMouse(x, y) {
					mouse.x = x;
					mouse.y = y;
				},
				setTargetFps(value) {
					const next = Number.isFinite(value) ? Math.max(0, Math.min(240, value)) : 30;
					if (next === perf.targetFps) return;
					perf.targetFps = next;
					lastRenderAt = 0;
					schedule(true);
				},
				setAutoScale(value) {
					perf.autoScale = Boolean(value);
					if (!perf.autoScale) setScale(0);
				},
				setPaused(reason, paused) {
					const key = String(reason || "manual");
					if (paused) {
						perf.paused.add(key);
						stopFrames();
					} else {
						perf.paused.delete(key);
						if (!perf.paused.size) {
							clearTimeout(resumeTimer);
							resumeTimer = setTimeout(() => {
								if (!running || perf.paused.size || perf.idle) return;
								lastRenderAt = 0;
								lastTickAt = 0;
								schedule(true);
							}, 300);
						}
					}
				},
				wake,
				hasTexture() {
					return Boolean(texture);
				},
				stats() {
					return {
						mode: contextLost
							? "lost"
							: perf.idle
								? "idle"
								: perf.paused.size
									? "paused"
									: "running",
						scale: SCALES[scaleIndex],
						fps: perf.targetFps,
						frames: perf.frames,
						paused: Array.from(perf.paused),
						focus: document.hasFocus(),
						vis: document.visibilityState,
						vp: [window.innerWidth, window.innerHeight],
						geo: {
							scr: [screen.width, screen.height],
							dpr: window.devicePixelRatio,
							pos: [window.screenX, window.screenY],
							canvas: [canvas.width, canvas.height],
							scale: canvas.width / Math.max(1, window.innerWidth)
						},
						tex: texture ? [texture.width, texture.height] : null,
						texErr: textureError || null
					};
				},
				start,
				stop,
				dispose() {
					disposed = true;
					stop();
					textureRequest += 1;
					if (texture) gl.deleteTexture(texture.handle);
					gl.deleteProgram(program);
					gl.deleteBuffer(buffer);
					const lose = gl.getExtension("WEBGL_lose_context");
					if (lose) lose.loseContext();
					canvas.remove();
				}
			};
		}

		function Switch({ on, onChange, label }) {
			return h(
				"button",
				{
					type: "button",
					className: "lg-switch",
					role: "switch",
					"aria-checked": on,
					"aria-label": label,
					"data-on": on ? "true" : "false",
					onClick: () => onChange(!on)
				},
				h("i")
			);
		}

		function Slider({ label, value, min, max, step, display, onChange }) {
			return h(
				"label",
				{ className: "lg-slider" },
				h("div", { className: "lg-slider-head" }, h("span", null, label), h("b", null, display)),
				h("input", {
					type: "range",
					min,
					max,
					step,
					value,
					onChange: (event) => onChange(Number(event.target.value))
				})
			);
		}

		function Row({ label, hint, children }) {
			return h(
				"div",
				{ className: "lg-row" },
				h("div", { className: "lg-label" }, h("span", null, label), hint ? h("span", { className: "lg-hint" }, hint) : null),
				children
			);
		}

		function apply(ctx) {
			// One-time cleanup of the stale marker a diagnostic build left behind.
			try {
				if (document.title.startsWith("LG-BUILD-")) document.title = "AI助手身份与版本询问 — DeepSeek Harness";
			} catch {
				/* the title is cosmetic */
			}
			if (typeof window !== "undefined") {
				window.addEventListener("error", (event) => {
					reportClientError(`window: ${String(event?.message ?? "error")} @ ${event?.filename ?? "?"}:${event?.lineno ?? 0}`);
				});
				window.addEventListener("unhandledrejection", (event) => {
					reportClientError(`promise: ${String(event?.reason?.stack ?? event?.reason ?? "rejection")}`);
				});
			}

			// Follow the DSH locale preference, not the browser's language list.
			const locale = (() => {
				try {
					return ctx.get("locale") ?? null;
				} catch {
					return null;
				}
			})();
			// Bind the method: the locale service implements subscribe with `this`,
			// so a detached reference throws instead of subscribing.
			const subscribeLocale = locale?.subscribe ? (listener) => locale.subscribe(listener) : () => () => {};
			const snapshotLocale = locale?.getSnapshot
				? () => locale.getSnapshot().active
				: () => String(navigator.language || "en");
			let activeLang = snapshotLocale();

			const useLang = () => {
				const lang = useSyncExternalStore(subscribeLocale, snapshotLocale, snapshotLocale);
				activeLang = lang;
				return lang;
			};

			const t = (key) => makeTranslate(activeLang)(key);

			let settings = readSettings();
			const settingsListeners = new Set();
			const getSettings = () => settings;
			const setSettings = (patch) => {
				settings = normalize({ ...settings, ...patch });
				persistSettings(settings);
				for (const listener of settingsListeners) listener();
			};
			const subscribeSettings = (listener) => {
				settingsListeners.add(listener);
				return () => settingsListeners.delete(listener);
			};
			const useSettings = () => useSyncExternalStore(subscribeSettings, getSettings, getSettings);

			let wallpaper = { status: "idle", url: "", kind: "image", name: "", mtime: 0, bytes: 0, error: "", appsBehind: false };
			const wallpaperListeners = new Set();
			const getWallpaper = () => wallpaper;
			const setWallpaper = (patch) => {
				wallpaper = { ...wallpaper, ...patch };
				for (const listener of wallpaperListeners) listener();
			};
			const subscribeWallpaper = (listener) => {
				wallpaperListeners.add(listener);
				return () => wallpaperListeners.delete(listener);
			};
			const useWallpaper = () => useSyncExternalStore(subscribeWallpaper, getWallpaper, getWallpaper);

			// What sits behind the window is now part of the wallpaper picture:
			// the host composites the occluded app windows into the same capture, so
			// the glass keeps flowing and simply shows the real app behind it.

			let refreshNow = () => {};

			const theme = () => {
				try {
					return ctx.get("theme") ?? ctx.theme;
				} catch {
					return ctx.theme;
				}
			};

			// The renderer lives in the overlay layer; the settings panel reads this
			// registry so the guard state can be inspected without DevTools.
			let activeRenderer = null;

			function GlassLayer() {
				const value = useSettings();
				const state = useWallpaper();
				const lang = useLang();
				const [mode, setMode] = useState(currentMode);
				// Layer 5: 'webgl' → 'css' (static glass) → 'off' (plugin disabled).
				const [degrade, setDegrade] = useState("webgl");
				const [webglEpoch, setWebglEpoch] = useState(0);
				const [notice, setNotice] = useState("");
				const lossRef = useRef({ count: 0, at: 0 });
				const translate = makeTranslate(lang);
				const t = (key) => translate(key);
				// The host folds the occluded windows into the wallpaper capture, so
				// this is informational only — the glass never pauses for it.
				const appsBehind = state.appsBehind === true;

				// The palette selector lives on <body>; observe it so an OS theme flip
				// or a preference change recolors the glass without a reload.
				useEffect(() => {
					const api = theme();
					let dispose;
					if (api?.getTheme) {
						const sync = () => setMode(api.getTheme()?.active?.colorScheme === "dark" ? "dark" : "light");
						sync();
						if (typeof ctx.on === "function") dispose = ctx.on("theme/change", sync);
					}
					const observer = new MutationObserver(() => setMode(currentMode()));
					observer.observe(document.body, { attributes: true, attributeFilter: ["data-ds-dark-theme"] });
					return () => {
						observer.disconnect();
						if (typeof dispose === "function") dispose();
					};
				}, []);

				useEffect(() => {
					const root = document.documentElement;
					root.dataset.lgEnabled = value.enabled ? "on" : "off";
					root.dataset.lgMode = mode;
					root.style.setProperty(
						"--lg-wallpaper",
						value.wallpaper && state.url && state.kind !== "video" ? `url("${state.url}")` : "none"
					);
					root.style.setProperty("--lg-blur", `${value.blur}px`);
					root.style.setProperty("--lg-sat", String(value.saturation));
					root.style.setProperty("--lg-dim", String(value.dim));
					root.style.setProperty("--lg-tint", String(value.tint));
					root.style.setProperty("--lg-fallback", mode === "dark" ? "#0b0e14" : "#eef1f6");
					root.dataset.lgBehind = appsBehind ? "on" : "off";
				}, [value, state.url, state.kind, mode, appsBehind]);

				// WebGL liquid wallpaper: owns its canvas under <body>.
				const liquidRef = useRef(null);
				const liquid = liquidRef.current;
				const wallpaperUrl = value.wallpaper && state.url ? state.url : "";
				const wallpaperKind = state.kind === "video" ? "video" : "image";

				// Layer 1 + 2: a pointer move only wakes the renderer; it never starts
				// a second loop, and the highlight itself is throttled to one rAF.
				useEffect(() => {
					if (!value.enabled) return;
					const root = document.documentElement;
					let queued = 0;
					const onMove = (event) => {
						if (queued) return;
						queued = requestAnimationFrame(() => {
							queued = 0;
							root.style.setProperty("--lg-mx", `${event.clientX}px`);
							root.style.setProperty("--lg-my", `${event.clientY}px`);
							liquidRef.current?.setMouse(event.clientX, event.clientY);
							liquidRef.current?.wake();
						});
					};
					window.addEventListener("pointermove", onMove, { passive: true });
					return () => {
						if (queued) cancelAnimationFrame(queued);
						window.removeEventListener("pointermove", onMove);
					};
				}, [value.enabled]);

				// Layer 5: a lost context freezes WebGL and drops to static CSS glass;
				// a second failure inside ten minutes turns the plugin off entirely.
				const onFault = (kind) => {
					if (kind === "restored") return;
					const now = Date.now();
					const record = lossRef.current;
					record.count = now - record.at < 10 * 60 * 1000 ? record.count + 1 : 1;
					record.at = now;
					reportClientError(`context: ${kind} count=${record.count}`, true);
					if (record.count >= 2) {
						setDegrade("off");
						setNotice(translate("autoDisabled"));
						setSettings({ enabled: false });
						reportClientError("degrade: off", true);
					} else {
						setDegrade("css");
						setNotice(translate("cssMode"));
						reportClientError("degrade: css", true);
					}
				};

				useEffect(() => {
					if (!value.enabled || degrade !== "webgl") return;
					const liquid = createLiquidCanvas({ onFault });
					if (!liquid) {
						setDegrade("css");
						setNotice(translate("cssMode"));
						return;
					}
					document.body.appendChild(liquid.canvas);
					liquidRef.current = liquid;
					activeRenderer = liquid;
					document.documentElement.dataset.lgWebgl = "on";
					liquid.setParams({ sat: value.saturation, dim: value.dim, flow: value.flow });
					liquid.setTargetFps(value.fps);
					liquid.setAutoScale(value.autoScale);
					liquid.start();
					return () => {
						liquid.dispose();
						liquidRef.current = null;
						if (activeRenderer === liquid) activeRenderer = null;
						if (document.documentElement.dataset.lgWebgl === "on") {
							document.documentElement.dataset.lgWebgl = "off";
						}
					};
					// eslint-disable-next-line react-hooks/exhaustive-deps
				}, [value.enabled, degrade, webglEpoch]);

				// Keep the renderer's own protection state (fps / DRS) in sync.
				useEffect(() => {
					liquidRef.current?.setTargetFps(value.fps);
				}, [value.fps]);

				useEffect(() => {
					liquidRef.current?.setAutoScale(value.autoScale);
				}, [value.autoScale]);

				// Layer 1: hidden window, blurred window, or lost focus stops the loop;
				// coming back waits 300 ms so rapid Alt+Tab cannot thrash the GPU.
				// Polled as well as event-driven: programmatic window raises do not
				// always emit focus events, and a stale "running" is the expensive bug.
				useEffect(() => {
					const sync = () => {
						const liquid = liquidRef.current;
						if (!liquid) return;
						const hidden = document.visibilityState === "hidden" || !document.hasFocus();
						liquid.setPaused("window", hidden);
						// A hidden window throttles video decode, so a video wallpaper can
						// still be missing when focus comes back: retry once it is shown.
						if (!hidden && wallpaperUrl && !liquid.hasTexture()) {
							liquid.setWallpaper(wallpaperUrl, wallpaperKind);
						}
					};
					document.addEventListener("visibilitychange", sync);
					window.addEventListener("blur", sync);
					window.addEventListener("focus", sync);
					const timer = setInterval(sync, 700);
					sync();
					return () => {
						clearInterval(timer);
						document.removeEventListener("visibilitychange", sync);
						window.removeEventListener("blur", sync);
						window.removeEventListener("focus", sync);
					};
				}, [value.enabled, degrade, wallpaperUrl, wallpaperKind]);

				// Layer 4: wake on any pointer activity so "flow = 0" is not a dead end.
				useEffect(() => {
					if (!value.enabled) return;
					const wake = () => liquidRef.current?.wake();
					window.addEventListener("pointerdown", wake, { passive: true });
					window.addEventListener("wheel", wake, { passive: true });
					return () => {
						window.removeEventListener("pointerdown", wake);
						window.removeEventListener("wheel", wake);
					};
				}, [value.enabled]);

				// Keep shader parameters in sync with the sliders.
				useEffect(() => {
					liquidRef.current?.setParams({ sat: value.saturation, dim: value.dim, flow: value.flow });
				}, [value.saturation, value.dim, value.flow]);

				// (Re)load the wallpaper texture whenever the fingerprint advances.
				useEffect(() => {
					if (!wallpaperUrl) return;
					liquidRef.current?.setWallpaper(wallpaperUrl, wallpaperKind);
				}, [wallpaperUrl, wallpaperKind]);

				// Token layering is the supported way to restyle shipped surfaces:
				// the theme service composes our layer above the active theme.
				useEffect(() => {
					const api = theme();
					if (!api?.overrideTokens) return;
					let dispose;
					try {
						if (value.enabled) dispose = api.overrideTokens(SOURCE, glassTokens(value.tint));
					} catch (error) {
						reportClientError(`overrideTokens: ${String(error?.stack ?? error)}`);
					}
					return () => {
						if (typeof dispose === "function") {
							try {
								dispose();
							} catch {
								// A stale layer is harmless.
							}
						}
					};
				}, [value.enabled, value.tint]);

				useEffect(() => {
					if (!value.enabled || !value.wallpaper) {
						setWallpaper({
							status: value.enabled ? "missing" : "off",
							url: "",
							kind: "image",
							name: "",
							mtime: 0,
							bytes: 0,
							error: ""
						});
						return;
					}

					let alive = true;
					const tick = async () => {
						if (!alive) return;
						try {
							const response = await fetch(`${API}/state?source=${encodeURIComponent(value.source)}`, { cache: "no-store", credentials: "same-origin" });
							if (!alive) return;
							if (!response.ok) throw new Error(`HTTP ${response.status}`);
							const data = await response.json();
							if (!alive) return;
							if (data?.available) {
								setWallpaper({
									status: "ready",
									url: `${API}/wallpaper?rev=${data.mtime ?? 0}&source=${encodeURIComponent(value.source)}`,
									kind: data.kind === "video" ? "video" : "image",
									name: typeof data.name === "string" ? data.name : "",
									mtime: typeof data.mtime === "number" ? data.mtime : 0,
									bytes: typeof data.bytes === "number" ? data.bytes : 0,
									appsBehind: data.appsBehind === true,
									error: ""
								});
							} else {
								setWallpaper({ status: "missing", url: "", kind: "image", name: "", mtime: 0, bytes: 0, appsBehind: false, error: "" });
							}
						} catch (error) {
							if (!alive) return;
							setWallpaper({ status: "error", url: "", kind: "image", name: "", mtime: 0, bytes: 0, error: String(error?.message ?? error) });
						}
					};

					refreshNow = tick;
					tick();
					const timer = setInterval(tick, Math.max(5, value.refreshSec) * 1000);
					const onVisible = () => {
						if (document.visibilityState === "visible") tick();
					};
					document.addEventListener("visibilitychange", onVisible);
					return () => {
						alive = false;
						refreshNow = () => {};
						clearInterval(timer);
						document.removeEventListener("visibilitychange", onVisible);
					};
				}, [value.enabled, value.wallpaper, value.refreshSec, value.source]);

				// Report guard-state transitions (mode/scale/fps/pause set) so the
				// host's lastClientError doubles as a live perf log during testing.
				useEffect(() => {
					let last = "";
					const timer = setInterval(() => {
						try {
							const stats = activeRenderer?.stats() ?? null;
							const signature = JSON.stringify({ degrade, stats });
							if (signature === last) return;
							last = signature;
							reportClientError(`perf: ${signature}`);
						} catch {
							/* ignore */
						}
					}, 1000);
					return () => clearInterval(timer);
				}, [degrade]);

				useEffect(() => {
					// One small, local-only snapshot so the host can report whether the
					// glass actually mounted (and why not) without a DevTools session.
					try {
						const root = document.documentElement;
						const rootEl = document.getElementById("root");
						const rootStyle = rootEl ? getComputedStyle(rootEl) : null;
						const bodyBefore = getComputedStyle(document.body, "::before");
						reportClientError(`ready: ${CLIENT_BUILD} load=${LOAD_TAG} source=${value.source} surface=screen`, true);
						reportClientError(
							JSON.stringify({
								diag: 1,
								enabled: root.dataset.lgEnabled ?? null,
								webgl: root.dataset.lgWebgl ?? null,
								suppressed: false,
								appsBehind: state.appsBehind === true,
								kind: state.kind ?? null,
								mode: root.dataset.lgMode ?? null,
								blur: root.style.getPropertyValue("--lg-blur"),
								wallpaper: root.style.getPropertyValue("--lg-wallpaper").slice(0, 72),
								rootBackground: rootStyle?.backgroundColor ?? null,
								rootBackdrop: rootStyle?.backdropFilter || rootStyle?.webkitBackdropFilter || null,
								bodyBeforeImage: String(bodyBefore.backgroundImage || "").slice(0, 72),
								canvases: document.querySelectorAll("canvas").length,
								liquidCanvas: Boolean(document.querySelector("canvas[data-liquid-glass]")),
								viewport: [window.innerWidth, window.innerHeight, window.devicePixelRatio],
								lang: activeLang,
								sample: makeTranslate(activeLang)("section"),
								bodyToken: getComputedStyle(document.body).getPropertyValue("--dsw-alias-bg-base").trim(),
								perf: (() => {
									try {
										return activeRenderer?.stats() ?? null;
									} catch {
										return null;
									}
								})(),
								settings: value
							})
						);
					} catch (error) {
						reportClientError(`diag: ${String(error?.stack ?? error)}`);
					}
				}, []);

				return h(
					Fragment,
					null,
					h("style", { "data-liquid-glass": "true" }, CSS),
					value.enabled ? h("div", { className: "lg-light", "data-liquid-glass": "light" }) : null,
					notice || degrade !== "webgl"
						? h(
								"div",
								{ className: "lg-warn", "data-degrade": degrade, "data-liquid-glass": "warn" },
								h("span", { className: "lg-warn-text" }, notice || t("cssMode")),
								degrade !== "webgl"
									? h(
											"button",
											{
												type: "button",
												className: "lg-button",
												onClick: () => {
													setNotice("");
													setDegrade("webgl");
													setWebglEpoch((epoch) => epoch + 1);
													if (!value.enabled) setSettings({ enabled: true });
												}
											},
											t("retry")
										)
									: null,
								h(
									"button",
									{ type: "button", className: "lg-button", onClick: () => setNotice("") },
									t("noticeClose")
								)
							)
						: null
				);
			}

			function SettingsPanel() {
				const value = useSettings();
				const state = useWallpaper();
				const lang = useLang();
				const translate = makeTranslate(lang);
				const t = (key) => translate(key);
				const [perf, setPerf] = useState(null);
				useEffect(() => {
					const timer = setInterval(() => {
						try {
							setPerf(activeRenderer?.stats() ?? null);
						} catch {
							setPerf(null);
						}
					}, 1000);
					return () => clearInterval(timer);
				}, []);
				const modeText = perf
					? perf.mode === "running"
						? t("running")
						: perf.mode === "idle"
							? t("idleState")
							: perf.mode === "paused"
								? t("pausedState")
								: t("frozen")
					: t("frozen");
				const statusText =
					state.status === "ready" ? t("ready") : state.status === "off" ? t("off") : state.status === "error" ? t("error") : t("missing");
				return h(
					"section",
					{ className: "lg-panel" },
					h("header", { className: "lg-head" }, h("h2", null, t("title")), h("p", null, t("intro"))),
					h(
						"div",
						{ className: "lg-card" },
						h(
							Row,
							{ label: t("enable"), hint: t("enableHint") },
							h(Switch, { on: value.enabled, onChange: (next) => setSettings({ enabled: next }), label: t("enable") })
						),
						h(
							Row,
							{ label: t("wallpaper"), hint: t("wallpaperHint") },
							h(Switch, { on: value.wallpaper, onChange: (next) => setSettings({ wallpaper: next }), label: t("wallpaper") })
						),
						h(
							"div",
							{ className: "lg-row" },
							h("div", { className: "lg-label" }, h("span", null, t("source")), h("span", { className: "lg-hint" }, t("sourceHint"))),
							h(
								"select",
								{ className: "lg-select", value: value.source, onChange: (event) => setSettings({ source: event.target.value }) },
								h("option", { value: "desktop" }, t("sourceDesktop")),
								h("option", { value: "wallpaper" }, t("sourceWallpaper"))
							)
						),
						h(Slider, {
							label: t("blur"),
							value: value.blur,
							min: 0,
							max: 48,
							step: 1,
							display: `${value.blur} px`,
							onChange: (next) => setSettings({ blur: next })
						}),
						h(Slider, {
							label: t("saturation"),
							value: value.saturation,
							min: 1,
							max: 2.4,
							step: 0.05,
							display: value.saturation.toFixed(2),
							onChange: (next) => setSettings({ saturation: next })
						}),
						h(Slider, {
							label: t("tint"),
							value: value.tint,
							min: 0,
							max: 1,
							step: 0.01,
							display: `${Math.round(value.tint * 100)}%`,
							onChange: (next) => setSettings({ tint: next })
						}),
						h(Slider, {
							label: t("dim"),
							value: value.dim,
							min: 0,
							max: 0.6,
							step: 0.01,
							display: `${Math.round(value.dim * 100)}%`,
							onChange: (next) => setSettings({ dim: next })
						}),
						h(Slider, {
							label: t("flow"),
							value: value.flow,
							min: 0,
							max: 1.5,
							step: 0.05,
							display: value.flow.toFixed(2),
							onChange: (next) => setSettings({ flow: next })
						}),
						h(Slider, {
							label: t("refresh"),
							value: value.refreshSec,
							min: 5,
							max: 300,
							step: 5,
							display: `${value.refreshSec} s`,
							onChange: (next) => setSettings({ refreshSec: next })
						}),
						h("div", { className: "lg-hint" }, t("flowHint")),
						h("div", { className: "lg-hint" }, t("moveHint"))
					),
					h(
						"div",
						{ className: "lg-card" },
						h(
							"div",
							{ className: "lg-row" },
							h("div", { className: "lg-label" }, h("span", null, t("perf")), h("span", { className: "lg-hint" }, t("autoScaleHint"))),
							h(
								"select",
								{ className: "lg-select", value: String(value.fps), onChange: (event) => setSettings({ fps: Number(event.target.value) }) },
								[24, 30, 40, 48, 60, 90, 120, 144, 0].map((option) =>
									h("option", { key: option, value: String(option) }, option === 0 ? t("unlimited") : `${option} FPS`)
								)
							)
						),
						h(
							Row,
							{ label: t("autoScale"), hint: t("autoScaleHint") },
							h(Switch, { on: value.autoScale, onChange: (next) => setSettings({ autoScale: next }), label: t("autoScale") })
						),
						h(
							"div",
							{ className: "lg-metrics" },
							h("div", { className: "lg-metric" }, h("span", null, t("renderer")), h("b", null, modeText)),
							h("div", { className: "lg-metric" }, h("span", null, t("fps")), h("b", null, perf ? (perf.fps === 0 ? "∞" : `${perf.fps}`) : "—")),
							h("div", { className: "lg-metric" }, h("span", null, t("scale")), h("b", null, perf ? `${Math.round(perf.scale * 100)}%` : "—")),
							h("div", { className: "lg-metric" }, h("span", null, t("frames")), h("b", null, perf ? `${perf.frames}` : "—"))
						),
						h("div", { className: "lg-hint" }, t("fpsHint"))
					),
					h(
						"div",
						{ className: "lg-card" },
						h(
							"div",
							{ className: "lg-status" },
							h("span", { className: "lg-dot", "data-state": state.status }),
							h(
								"div",
								null,
								h("b", null, `${t("status")}: ${statusText}`),
								state.name ? h("div", null, `${state.name} · ${formatBytes(state.bytes)}`) : null,
								state.error ? h("div", null, state.error) : null,
								!state.name && state.status === "missing"
									? h("div", null, lang.startsWith("zh") ? "在系统设置里设置桌面壁纸后，回到这里刷新。" : "Set a desktop wallpaper in the system settings, then refresh here.")
									: null
							)
						),
						h(
							"div",
							{ className: "lg-actions" },
							h(
								"button",
								{ type: "button", className: "lg-button", onClick: () => refreshNow() },
								t("refreshNow")
							),
							h(
								"button",
								{ type: "button", className: "lg-button", onClick: () => setSettings(DEFAULT_SETTINGS) },
								t("reset")
							)
						)
					)
				);
			}

			ctx.slots.inject("shell.overlay", () =>
				ctx.slots.register(
					{ name: "shell.overlay", id: "liquid-glass-backdrop", label: () => "liquid-glass" },
					() => h(Guard, null, h(GlassLayer))
				)
			);

			ctx.slots.inject("settings.section", () =>
				ctx.slots.register(
					{ name: "settings.section", id: "liquid-glass", order: 55, label: () => makeTranslate(activeLang)("section") },
					() => h(SettingsPanel)
				)
			);
		}

		return { name: "liquid-glass", inject: ["slots", "theme", "locale"], apply };
	}
});
