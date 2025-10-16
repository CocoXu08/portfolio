console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

const navLinks = $$("nav a");





// Helper
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// Normalize paths so "/", "/index.html", "/projects/", and "/projects/index.html" match correctly.
function normalizePath(pathname) {
  let p = pathname || "/";
  // Ensure it's an absolute-URL pathname
  try {
    p = new URL(p, location.origin).pathname;
  } catch {}
  // Strip index.html and trailing slash (except root)
  p = p.replace(/index\.html$/i, "");
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p || "/";
}

function markCurrentNav() {
  const navLinks = $$("nav a");
  const here = normalizePath(location.pathname);

  const currentLink = navLinks.find(a => {
    const sameHost = a.host === location.host;
    const samePath = normalizePath(a.pathname) === here;
    return sameHost && samePath;
  });

  currentLink?.classList.add("current");
}

// Run after DOM is ready (reuse your existing ready guard if you have one)
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", markCurrentNav);
} else {
  markCurrentNav();
}

const PAGES = [
  { url: "",            title: "Home" },
  { url: "projects/",   title: "Projects" },
  { url: "contact/",    title: "Contact" },
  { url: "resume/",     title: "Resume" },
  { url: "https://github.com/CocoXu08", title: "GitHub" },
];

function normalizePath(pathname) {
  let p = pathname || "/";
  try { p = new URL(p, location.origin).pathname; } catch {}
  p = p.replace(/index\.html$/i, "");
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p || "/";
}

function computeBasePath() {
  const host = location.hostname;
  const path = location.pathname;
  if (host === "localhost" || host === "127.0.0.1") return "/";
  if (host.endsWith(".github.io")) {
    const parts = path.split("/").filter(Boolean);
    return parts.length ? `/${parts[0]}/` : "/";
  }
  const seg = path.split("/").filter(Boolean)[0];
  return seg ? `/${seg}/` : "/";
}
const BASE_PATH = computeBasePath();

function buildNav() {
  const nav = document.createElement("nav");
  document.body.prepend(nav);

  const here = normalizePath(location.pathname);

  for (const p of PAGES) {
    const isExternal = /^https?:\/\//i.test(p.url);
    const url = isExternal ? p.url : (BASE_PATH + p.url);

    const a = document.createElement("a");
    a.href = url;
    a.textContent = p.title;
    if (isExternal) a.target = "_blank";

    try {
      const u = new URL(a.href, location.origin);
      a.classList.toggle("current",
        u.host === location.host && normalizePath(u.pathname) === here
      );
    } catch {}

    nav.append(a);
  }
}

// button
const STORAGE_KEY = "colorScheme";
const AUTO_VALUE  = "light dark";
const LIGHT_VALUE = "light";
const DARK_VALUE  = "dark";

const mql = window.matchMedia("(prefers-color-scheme: dark)");
const osMode = () => (mql.matches ? "Dark" : "Light");

function setColorScheme(value) {
  document.documentElement.style.setProperty("color-scheme", value);
}

function insertThemeSwitch() {
  const saved = localStorage.getItem(STORAGE_KEY) || AUTO_VALUE;
  const autoLabel = `Automatic (${osMode()})`;

  document.body.insertAdjacentHTML(
    "afterbegin",
    `
    <label class="color-scheme" aria-label="Theme selector">
      Theme:
      <select id="theme-select">
        <option value="${AUTO_VALUE}">${autoLabel}</option>
        <option value="${LIGHT_VALUE}">Light</option>
        <option value="${DARK_VALUE}">Dark</option>
      </select>
    </label>`
  );

  const select = document.getElementById("theme-select");
  select.value = saved;
  setColorScheme(saved);

  select.addEventListener("input", (event) => {
    const value = event.target.value;
    setColorScheme(value);
    localStorage.setItem(STORAGE_KEY, value);
  });

  mql.addEventListener("change", () => {
    const opt = select.querySelector(`option[value="${AUTO_VALUE}"]`);
    if (opt) opt.textContent = `Automatic (${osMode()})`;
    if (select.value === AUTO_VALUE) setColorScheme(AUTO_VALUE);
  });
}

// Ensure body exists before inserting
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", insertThemeSwitch);
} else {
  insertThemeSwitch();
}



