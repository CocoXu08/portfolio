
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';

// ---------------------------------------------------------------------------
// Load + process data
// ---------------------------------------------------------------------------

async function loadData() {
  const data = await d3.csv('./loc.csv', (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));

  return data;
}

function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;
      let ret = {
        id: commit,
        url: 'https://github.com/vis-society/lab-7/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, 'lines', {
        value: lines,
      });

      return ret;
    });
}

let data = await loadData();
let commits = processCommits(data);

// ---------------------------------------------------------------------------
// Stats (commit info)
// ---------------------------------------------------------------------------

function renderCommitInfo(data, commits) {
  // helpers
  const fileLengths = d3.rollups(
    data,
    (v) => d3.max(v, (d) => +d.line),
    (d) => d.file
  );
  const totalFiles = fileLengths.length;
  const maxFileEntry = d3.greatest(fileLengths, (d) => d[1]);
  const maxFileLen = maxFileEntry ? maxFileEntry[1] : 0;
  const longestFile = maxFileEntry ? maxFileEntry[0] : '(n/a)';
  const avgFileLen = d3.mean(fileLengths, (d) => d[1]) ?? 0;

  // container
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');

  // small helper to add one tile
  const addStat = (label, value, isNumber = true) => {
    const tile = dl.append('div').attr('class', 'stat');
    tile.append('dt').html(label);
    tile.append('dd').attr('class', isNumber ? 'num' : 'text').text(value);
  };

  // tiles
  addStat('Total <abbr title="Lines of code">LOC</abbr>', data.length);
  addStat('Total commits', commits.length);
  addStat('Number of files', totalFiles);
  addStat('Maximum file length (lines)', maxFileLen);
  addStat('Longest file', longestFile, /*isNumber=*/ false);
  addStat('Average file length (lines)', Math.round(avgFileLen));
}

function updateCommitInfo(data, commits) {
  // which commits are included
  const commitIds = new Set(commits.map((d) => d.id));

  // filter data rows to only those commits
  const filteredData = data.filter((d) => commitIds.has(d.commit));

  // clear old stats
  d3.select('#stats').selectAll('*').remove();

  // re-render stats
  renderCommitInfo(filteredData, commits);
}

// initial stats
renderCommitInfo(data, commits);

// ---------------------------------------------------------------------------
// Scatter plot
// ---------------------------------------------------------------------------

let xScale;
let yScale;

function renderScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 40 };

  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  // scales
  xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([margin.left, width - margin.right])
    .nice();

  yScale = d3
    .scaleLinear()
    .domain([0, 24])
    .range([height - margin.bottom, margin.top]);

  const colorScale = d3
    .scaleSequential()
    .domain([0, 24])
    .interpolator(d3.interpolateHsl('#1e3a8a', '#f97316'));

  // gridlines (before axes)
  svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${margin.left},0)`)
    .call(
      d3
        .axisLeft(yScale)
        .tickFormat('')
        .tickSize(-(width - margin.left - margin.right))
    );

  // axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

  svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .attr('class', 'x-axis')
    .call(xAxis);

  svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .attr('class', 'y-axis')
    .call(yAxis);

  // size scale + sorted data
  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);
  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

  // dots
  const dots = svg.append('g').attr('class', 'dots');

  dots
    .selectAll('circle')
    .data(sortedCommits, (d) => d.id) // key by id
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', (d) => colorScale(d.hourFrac))
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mousemove', (event) => {
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });

  // ----- brushing -----
  function isCommitSelected(selection, commit) {
    if (!selection) return false;
    const [[x0, y0], [x1, y1]] = selection;
    const cx = xScale(commit.datetime);
    const cy = yScale(commit.hourFrac);
    return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
  }

  function renderSelectionCount(selection) {
    const selected = selection ? commits.filter((d) => isCommitSelected(selection, d)) : [];
    const el = document.querySelector('#selection-count');
    if (el) el.textContent = `${selected.length || 'No'} commits selected`;
    return selected;
  }

  function renderLanguageBreakdown(selection) {
    const selectedCommits = selection
      ? commits.filter((d) => isCommitSelected(selection, d))
      : [];
    const container = document.getElementById('language-breakdown');

    if (selectedCommits.length === 0) {
      container.innerHTML = '';
      return;
    }
    const requiredCommits = selectedCommits.length ? selectedCommits : commits;
    const lines = requiredCommits.flatMap((d) => d.lines);

    const breakdown = d3.rollup(lines, (v) => v.length, (d) => d.type);

    container.innerHTML = '';

    for (const [language, count] of breakdown) {
      const proportion = count / lines.length;
      const formatted = d3.format('.1~%')(proportion);

      container.innerHTML += `
        <dt>${language}</dt>
        <dd>${count} lines (${formatted})</dd>
      `;
    }
  }

  function brushed(event) {
    const selection = event.selection;
    svg
      .selectAll('circle')
      .classed('selected', (d) => isCommitSelected(selection, d));
    renderSelectionCount(selection);
    renderLanguageBreakdown(selection);
  }

  svg.call(d3.brush().on('start brush end', brushed));
  svg.selectAll('.dots, .overlay ~ *').raise();
}

renderScatterPlot(data, commits);

// ---------------------------------------------------------------------------
// Tooltip helpers
// ---------------------------------------------------------------------------

function renderTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');
  const time = document.getElementById('commit-time-tooltip');
  const author = document.getElementById('commit-author');
  const lines = document.getElementById('commit-lines');

  if (Object.keys(commit).length === 0) return;

  link.href = commit.url;
  link.textContent = commit.id;

  date.textContent = commit.datetime?.toLocaleString('en', {
    dateStyle: 'full',
  });

  time.textContent = commit.datetime?.toLocaleTimeString('en', {
    hour: '2-digit',
    minute: '2-digit',
  });

  author.textContent = commit.author ?? '(unknown)';

  lines.textContent = `${commit.totalLines ?? 0} line${
    commit.totalLines === 1 ? '' : 's'
  }`;
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;
}

// ---------------------------------------------------------------------------
// Lab 8: time slider + filtering
// ---------------------------------------------------------------------------

let commitProgress = 100;

let timeScale = d3
  .scaleTime()
  .domain([d3.min(commits, (d) => d.datetime), d3.max(commits, (d) => d.datetime)])
  .range([0, 100]);

let commitMaxTime = timeScale.invert(commitProgress);

// Will get updated as user changes slider
let filteredCommits = commits;

//LAB 8
function updateFileDisplay(filteredCommits) {

  let colors = d3.scaleOrdinal(d3.schemeTableau10);
  
  let lines = filteredCommits.flatMap((d) => d.lines);

  let files = d3
    .groups(lines, (d) => d.file)
    .map(([name, lines]) => {
      return { name, lines };
    })
    .sort((a, b) => b.lines.length - a.lines.length);

  let filesContainer = d3
  .select('#files')
  .selectAll('div')
  .data(files, (d) => d.name)
  .join((enter) =>
    enter.append('div').call((div) => {
      div.append('dt').append('code');
      div.append('dd');
    }),
  )

  filesContainer.select('dt > code').text((d) => d.name);

  filesContainer
    .select('dd')
    .selectAll('div')
    .data((d) => d.lines)
    .join('div')
    .attr('class', 'loc')
    .attr('style', (d) => `--color: ${colors(d.type)}`);
}

//-----

function updateScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 40 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3.select('#chart').select('svg');

  // update x-scale domain
  xScale = xScale.domain(d3.extent(commits, (d) => d.datetime));

  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  const xAxis = d3.axisBottom(xScale);

  const xAxisGroup = svg.select('g.x-axis');
  xAxisGroup.selectAll('*').remove();
  xAxisGroup.call(xAxis);

  const dots = svg.select('g.dots');

  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

  dots
    .selectAll('circle')
    .data(sortedCommits, (d) => d.id) // key by id
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });
}

function onTimeSliderChange(event) {
  commitProgress = +event.target.value;
  commitMaxTime = timeScale.invert(commitProgress);

  document.getElementById('commit-time').textContent =
    commitMaxTime.toLocaleString(undefined, {
      dateStyle: 'long',
      timeStyle: 'short',
    });

  filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);

  updateScatterPlot(data, filteredCommits);
  updateCommitInfo(data, filteredCommits);
  updateFileDisplay(filteredCommits); 
}


document
  .getElementById('commit-progress')
  .addEventListener('input', onTimeSliderChange);

// initialize slider display
onTimeSliderChange({ target: document.getElementById('commit-progress') });


d3.select('#scatter-story')
  .selectAll('.step')
  .data(commits)
  .join('div')
  .attr('class', 'step')
  .html(
    (d, i) => `
		On ${d.datetime.toLocaleString('en', {
      dateStyle: 'full',
      timeStyle: 'short',
    })},
		I made <a href="${d.url}" target="_blank">${
      i > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'
    }</a>.
		I edited ${d.totalLines} lines across ${
      d3.rollups(
        d.lines,
        (D) => D.length,
        (d) => d.file,
      ).length
    } files.
		Then I looked over all I had made, and I saw that it was very good.
	`,
  );


  function onStepEnter(response) {
  console.log(response.element.__data__.datetime);
}

const scroller = scrollama();
scroller
  .setup({
    container: '#scrolly-1',
    step: '#scrolly-1 .step',
  })
  .onStepEnter(onStepEnter);