import { fetchJSON, renderProjects } from '../global.js';
const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');

const title = document.querySelector('.projects-title');
title.textContent = `${projects.length} Projects`;


// STEP 1
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let colors = d3.scaleOrdinal(d3.schemeTableau10);
let selectedIndex = -1;
let selectedYear = null;
let query = '';


// Refactor all plotting into one function
function renderPieChart(projectsGiven) {
  // re-calculate rolled data
  let newRolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );
  // re-calculate data
  let newData = newRolledData.map(([year, count]) => ({value: count, label: year}));

  // re-calculate slice generator, arc data, arc, etc.
  let newSliceGenerator = d3.pie().value((d) => d.value);
  let newArcData = newSliceGenerator(newData);
  let newArcs = newArcData.map((d) => arcGenerator(d));

  // TODO: clear up paths and legends
  let newSVG = d3.select('#projects-plot');
  newSVG.selectAll('path').remove();
  d3.select('.legend').selectAll('li').remove();

  newArcs.forEach((arc, i) => {
  newSVG
    .append('path')
    .attr('d', arc)
    .attr('fill', colors(i))
    .on('click', () => {
      // toggle selection
        selectedIndex = selectedIndex === i ? -1 : i;
        selectedYear = (selectedIndex === -1) ? null : newData[selectedIndex].label;

        // update selected classes
        newSVG.selectAll('path')
        .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : null));
        d3.select('.legend').selectAll('li')
        .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : null));

        // ✅ Always combine filters from the ORIGINAL projects array
        let combined = projects.filter(p =>
        (selectedYear ? String(p.year) === String(selectedYear) : true) &&
        Object.values(p).join('\n').toLowerCase().includes(query)
        );

        // Re-render list + pie from the combined set
        renderProjects(combined, projectsContainer, 'h2');
        renderPieChart(combined);
    });
});


  // update paths and legends, refer to steps 1.4 and 2.2
//   newArcs.forEach((arc, i) => {
//   newSVG
//     .append('path')
//     .attr('d', arc)
//     .attr('fill', colors(i))
//     // .on('click', () => {
//     //   selectedIndex = selectedIndex === i ? -1 : i;
//     if (selectedIndex === -1) {
//         renderProjects(projectsGiven, projectsContainer, 'h2');
//     } else {
//         let yearLabel = newData[selectedIndex].label;
//         let filtered = projectsGiven.filter(p => String(p.year) === String(yearLabel));
//         renderProjects(filtered, projectsContainer, 'h2');
//     }

//       newSVG.selectAll('path')
//         .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : null));

//       d3.select('.legend').selectAll('li')
//         .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : null));

//       if (selectedIndex === -1) {
//         renderProjects(projectsGiven, projectsContainer, 'h2');
//       } else {
//         let yearLabel = newData[selectedIndex].label;
//         let filtered = projectsGiven.filter(p => String(p.year) === String(yearLabel));
//         renderProjects(filtered, projectsContainer, 'h2');
//       }
//     });
// });

let legend = d3.select('.legend');
newData.forEach((d, idx) => {
  legend
    .append('li')
    .attr('style', `--color:${colors(idx)}`)
    .attr('class', (_, i) => (i === selectedIndex ? 'selected' : null))
    .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
});
}

// Call this function on page load
renderPieChart(projects);


let searchInput = document.querySelector('.searchBar');
// searchInput.addEventListener('change', (event) => {
//   let query = event.target.value.toLowerCase();
//   let filteredProjects = projects.filter(project =>
//     Object.values(project).join('\n').toLowerCase().includes(query)
//   );
//   renderProjects(filteredProjects, projectsContainer, 'h2');
//   renderPieChart(filteredProjects);
// });

searchInput.addEventListener('change', (event) => {
  query = event.target.value.toLowerCase();

  let combined = projects.filter(p =>
    (selectedYear ? String(p.year) === String(selectedYear) : true) &&
    Object.values(p).join('\n').toLowerCase().includes(query)
  );

  renderProjects(combined, projectsContainer, 'h2');
  renderPieChart(combined);
});




