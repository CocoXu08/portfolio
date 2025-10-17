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

const STORAGE_KEY = "colorScheme";
const AUTO  = "light dark"; // follow the spec
const LIGHT = "light";
const DARK  = "dark";

document.body.insertAdjacentHTML(
  "afterbegin",
  `<label class="color-scheme" aria-label="Theme selector">
     Theme:
     <select id="theme">
       <option value="${AUTO}">Automatic</option>
       <option value="${LIGHT}">Light</option>
       <option value="${DARK}">Dark</option>
     </select>
   </label>`
);

select.addEventListener('input', function (event) {
  console.log('color scheme changed to', event.target.value);
  document.documentElement.style.setProperty('color-scheme', event.target.value);
});





