console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

const BASE_PATH =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "/"    
    : "/portfolio/"; 

// let navLinks = $$("nav a");

// let currentLink = navLinks.find(
//   (a) => a.host === location.host && a.pathname === location.pathname
// );
// currentLink?.classList.add("current");
let pages = [
    { url: "", title: "Home" },
    { url: "projects/", title: "Projects" },
    { url: "contact/", title: "Contact" },
    { url: "resume/", title: "Resume" },
    { url: "https://github.com/CocoXu08", title: "GitHub" },
  ];
let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
  let url = p.url;
  let title = p.title;
  url = !url.startsWith('http') ? BASE_PATH + url : url;

  // Create the link element
  let a = document.createElement("a");
  a.href = url;
  a.textContent = title;

  a.classList.toggle(
  'current',
  a.host === location.host && a.pathname === location.pathname,
);

  if (a.host !== location.host) {
      a.target = "_blank";
    }

  // Add link to nav
  nav.append(a);
}


document.body.insertAdjacentHTML(
  'afterbegin',
  `
	<label class="color-scheme">
		Theme:
		<select>
			<option value="${AUTO_VALUE}">${autoLabel}</option>
      <option value="${LIGHT_VALUE}">Light</option>
      <option value="${DARK_VALUE}">Dark</option>
		</select>
	</label>`,
);

select.addEventListener('input', function (event) {
  console.log('color scheme changed to', event.target.value);
});

document.documentElement.style.setProperty('color-scheme', event.target.value);

const select = document.querySelector('#theme');

// 1️⃣ When the user changes the theme
select.addEventListener('input', (event) => {
  const newScheme = event.target.value;

  // Log to confirm
  console.log('color scheme changed to', newScheme);

  // Apply the color scheme
  document.documentElement.style.setProperty('color-scheme', newScheme);

  // Save the preference in localStorage
  localStorage.colorScheme = newScheme;
});

// 2️⃣ When the page loads — restore user's previous choice
if ('colorScheme' in localStorage) {
  const savedScheme = localStorage.colorScheme;

  // Apply it immediately
  document.documentElement.style.setProperty('color-scheme', savedScheme);

  // Update the dropdown so it matches the saved choice
  select.value = savedScheme;
}

// button
// const STORAGE_KEY = "colorScheme";
// const AUTO_VALUE  = "light dark";
// const LIGHT_VALUE = "light";
// const DARK_VALUE  = "dark";

// const mql = window.matchMedia("(prefers-color-scheme: dark)");
// const osMode = () => (mql.matches ? "Dark" : "Light");

// function setColorScheme(value) {
//   document.documentElement.style.setProperty("color-scheme", value);
// }

// function insertThemeSwitch() {
//   const saved = localStorage.getItem(STORAGE_KEY) || AUTO_VALUE;
//   const autoLabel = `Automatic (${osMode()})`;

//   document.body.insertAdjacentHTML(
//     "afterbegin",
//     `
//     <label class="color-scheme" aria-label="Theme selector">
//       Theme:
//       <select id="theme-select">
//         <option value="${AUTO_VALUE}">${autoLabel}</option>
//         <option value="${LIGHT_VALUE}">Light</option>
//         <option value="${DARK_VALUE}">Dark</option>
//       </select>
//     </label>`
//   );

//   const select = document.getElementById("theme-select");
//   select.value = saved;
//   setColorScheme(saved);

//   select.addEventListener("input", (event) => {
//     const value = event.target.value;
//     setColorScheme(value);
//     localStorage.setItem(STORAGE_KEY, value);
//   });

//   mql.addEventListener("change", () => {
//     const opt = select.querySelector(`option[value="${AUTO_VALUE}"]`);
//     if (opt) opt.textContent = `Automatic (${osMode()})`;
//     if (select.value === AUTO_VALUE) setColorScheme(AUTO_VALUE);
//   });
// }

// // Ensure body exists before inserting
// if (document.readyState === "loading") {
//   document.addEventListener("DOMContentLoaded", insertThemeSwitch);
// } else {
//   insertThemeSwitch();
// }



