import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3'; // D3.js — the industry-standard data visualization library
import API from '../api/axios';

function StatsPage() {
  const [groups, setGroups] = useState([]);          // for the group filter dropdown
  const [selectedGroup, setSelectedGroup] = useState(''); // empty = all groups
  const [loading, setLoading] = useState(true);
  // KPI card values
  const [kpis, setKpis] = useState({ totalPosts: 0, totalGroups: 0, topType: '-', avgPerMonth: 0 });

  // Refs to the container divs where D3 will draw SVGs
  const barRef = useRef(null);
  const pieRef = useRef(null);
  const lineRef = useRef(null);

  // Load the list of groups for the filter dropdown on mount
  useEffect(() => {
    API.get('/groups').then(res => {
      const data = Array.isArray(res.data) ? res.data : [];
      setGroups(data);
      setKpis(prev => ({ ...prev, totalGroups: data.length }));
    }).catch(console.error);
  }, []);
  // Fetches both chart datasets in parallel, computes KPIs, and draws the charts.
  // Wrapped in useCallback so it's only re-created when selectedGroup changes.
  const loadCharts = useCallback(async () => {
    setLoading(true);
    // If a group is selected, pass groupId as a query param to filter data
    const params = selectedGroup ? { groupId: selectedGroup } : {};
    try {
      // Fetch monthly counts, type distribution, and daily activity in parallel
      const [monthRes, typeRes, dailyRes] = await Promise.all([
        API.get('/stats/posts-per-month', { params }),
        API.get('/stats/post-types', { params }),
        API.get('/stats/daily-activity', { params })
      ]);

      const monthData = monthRes.data || [];
      const typeData = typeRes.data || [];
      const dailyData = dailyRes.data || [];

      // Compute KPI values from the raw data
      const totalPosts = typeData.reduce((s, d) => s + d.count, 0);
      // Find the type with the highest count using reduce
      const topType = typeData.length > 0 ? typeData.reduce((a, b) => a.count > b.count ? a : b, typeData[0]).type : '-';
      // Average posts per month (rounded to nearest whole number)
      const avgPerMonth = monthData.length > 0 ? Math.round(totalPosts / monthData.length) : 0;
      setKpis(prev => ({ ...prev, totalPosts, topType, avgPerMonth }));

      // Draw all three charts with the new data
      drawBarChart(monthData);
      drawPieChart(typeData);
      drawLineChart(dailyData);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [selectedGroup]); // re-runs whenever the group filter changes

  // Run loadCharts whenever selectedGroup changes (and on initial mount)
  useEffect(() => {
    loadCharts();
  }, [loadCharts]);
  // D3 draws SVG elements directly — it can't read CSS variables automatically.
  // We read the current theme from the <html> data-theme attribute and return
  // concrete color values for D3 to use.
  const getChartColors = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      text: isDark ? '#a0a8c0' : '#475569',        // axis labels and value labels
      gridLine: isDark ? '#252540' : '#e2e8f0',    // horizontal grid lines
      accent: '#f93a5b',                            // primary brand color
      bg: isDark ? '#16162a' : '#ffffff'            // chart background
    };
  };
  // data: array of { month: "Jan 2025", count: 12 }
  const drawBarChart = (data) => {
    const container = barRef.current;
    // Wipe any previous chart before drawing (D3 appends, doesn't replace)
    d3.select(container).selectAll('*').remove();
    const colors = getChartColors();

    // No data: show a text message instead of an empty chart
    if (data.length === 0) {
      d3.select(container).append('div')
        .style('text-align', 'center')
        .style('padding', '40px')
        .style('color', colors.text)
        .style('font-size', '13px')
        .text('No data available');
      return;
    }

    // Chart dimensions: margin.left/bottom leave room for axis labels
    const margin = { top: 20, right: 16, bottom: 40, left: 40 };
    const width = 400 - margin.left - margin.right;  // usable drawing area width
    const height = 250 - margin.top - margin.bottom; // usable drawing area height

    // Create the <svg> element and position the drawing group with the margin
    const svg = d3.select(container)
      .append('svg')
      .attr('viewBox', '0 0 400 250')      // responsive: scales to container width
      .attr('role', 'img')
      .attr('aria-label', 'Bar chart showing posts per month')
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X scale: maps month names to x positions (scaleBand for categorical data)
    const x = d3.scaleBand().domain(data.map(d => d.month)).range([0, width]).padding(0.35);
    // Y scale: maps post count to y position (scaleLinear for numerical data)
    // .nice() rounds the domain to clean numbers (e.g. 0–12 → 0–15)
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d.count)]).nice().range([height, 0]);

    // Gradient fill for bars (top: bright red → bottom: darker red)
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient').attr('id', 'barGrad').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 1);
    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#f93a5b');
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#e71d47');

    // Draw one <rect> per month
    svg.selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', d => x(d.month))          // left edge of the bar
      .attr('y', d => y(d.count))           // top edge (D3 SVG y-axis goes top-to-bottom)
      .attr('width', x.bandwidth())         // bandwidth = bar width from scaleBand
      .attr('height', d => height - y(d.count)) // bar height = distance from y(count) to axis
      .attr('fill', 'url(#barGrad)')        // apply the gradient
      .attr('rx', 6)                         // rounded corners (CSS3 equivalent: border-radius)
      .attr('ry', 6);

    // X axis with rotated labels to prevent overlap
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickSize(0))   // no tick marks, just labels
      .selectAll('text')
      .style('font-size', '10px')
      .style('fill', colors.text)
      .attr('transform', 'rotate(-30)')     // rotate labels 30° to prevent overlap
      .style('text-anchor', 'end');

    // Y axis with horizontal grid lines (negative tickSize extends lines across the chart)
    svg.append('g')
      .call(d3.axisLeft(y).ticks(5).tickSize(-width))
      .selectAll('text')
      .style('fill', colors.text)
      .style('font-size', '10px');

    // Style the grid lines and axis line
    svg.selectAll('.tick line').style('stroke', colors.gridLine).style('opacity', 0.5);
    svg.selectAll('.domain').style('stroke', colors.gridLine);

    // Value labels: the count number above each bar
    svg.selectAll('.label')
      .data(data)
      .enter()
      .append('text')
      .attr('x', d => x(d.month) + x.bandwidth() / 2) // horizontally centered on bar
      .attr('y', d => y(d.count) - 6)                 // 6px above the top of the bar
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', '600')
      .style('fill', colors.text)
      .text(d => d.count);
  };
  // data: array of { type: "question"|"material"|"announcement", count: N }
  const drawPieChart = (data) => {
    const container = pieRef.current;
    d3.select(container).selectAll('*').remove(); // clear previous chart
    const colors = getChartColors();

    if (data.length === 0) {
      d3.select(container).append('div')
        .style('text-align', 'center')
        .style('padding', '40px')
        .style('color', colors.text)
        .style('font-size', '13px')
        .text('No data available');
      return;
    }

    const size = 250;
    const radius = size / 2 - 20; // radius minus padding for labels

    // One color per post type
    const typeColors = {
      question: '#f59e0b',       // amber
      material: '#6366f1',       // indigo
      announcement: '#f93a5b'    // red
    };

    // Create the <svg> centered around (size/2, size/2)
    const svg = d3.select(container)
      .append('svg')
      .attr('viewBox', `0 0 ${size} ${size}`)
      .attr('role', 'img')
      .attr('aria-label', 'Pie chart showing post type distribution')
      .append('g')
      .attr('transform', `translate(${size / 2},${size / 2})`); // center of circle

    // d3.pie() converts raw data values to angular segments (start/end angles)
    const pie = d3.pie().value(d => d.count).padAngle(0.03); // 0.03 rad gap between slices
    // d3.arc() generates the SVG path for each slice
    // innerRadius > 0 creates a donut chart (vs. pie)
    const arc = d3.arc().innerRadius(radius * 0.55).outerRadius(radius).cornerRadius(4);

    // Draw each pie slice as a <path>
    svg.selectAll('path')
      .data(pie(data))
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', d => typeColors[d.data.type] || '#94a3b8') // fallback grey
      .style('filter', 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))');

    // Label arc: slightly inside the outer radius — used to position text labels
    const labelArc = d3.arc().innerRadius(radius * 0.78).outerRadius(radius * 0.78);
    const total = data.reduce((s, d) => s + d.count, 0);
    svg.selectAll('text')
      .data(pie(data))
      .enter()
      .append('text')
      .attr('transform', d => `translate(${labelArc.centroid(d)})`) // centroid = center of label arc
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('font-weight', '600')
      .style('fill', '#fff')
      // Hide labels on very small slices (< 8%) to avoid overlap
      .text(d => (d.data.count / total) < 0.08 ? '' : `${d.data.count}`);

    // Center total — replaces the cluttered per-slice labels with a single big number
    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', -2)
      .style('font-size', '22px')
      .style('font-weight', '700')
      .style('fill', colors.text)
      .text(total);
    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 14)
      .style('font-size', '9px')
      .style('font-weight', '500')
      .style('fill', colors.text)
      .style('opacity', 0.7)
      .text('total');
  };
  // data: array of { date: 'YYYY-MM-DD', label: 'Jun 26', count: 4 }
  const drawLineChart = (data) => {
    const container = lineRef.current;
    d3.select(container).selectAll('*').remove(); // clear previous chart
    const colors = getChartColors();

    if (!data.length) {
      d3.select(container).append('div')
        .style('text-align', 'center').style('padding', '40px')
        .style('color', colors.text).style('font-size', '13px')
        .text('No data available');
      return;
    }

    // Wide chart that spans both columns visually
    const margin = { top: 20, right: 20, bottom: 36, left: 36 };
    const width = 820 - margin.left - margin.right;
    const height = 220 - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('viewBox', '0 0 820 220')
      .attr('role', 'img')
      .attr('aria-label', 'Line chart of daily post activity over the last 30 days')
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Time-aware X scale based on parsed YYYY-MM-DD dates
    const parseDate = d3.timeParse('%Y-%m-%d');
    const points = data.map(d => ({ date: parseDate(d.date), label: d.label, count: d.count }));

    const x = d3.scaleTime()
      .domain(d3.extent(points, p => p.date))
      .range([0, width]);
    const maxCount = d3.max(points, p => p.count) || 1;
    const y = d3.scaleLinear().domain([0, maxCount]).nice().range([height, 0]);

    // Area gradient under the line for visual depth
    const defs = svg.append('defs');
    const grad = defs.append('linearGradient')
      .attr('id', 'lineGrad').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 1);
    grad.append('stop').attr('offset', '0%').attr('stop-color', '#f93a5b').attr('stop-opacity', 0.35);
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#f93a5b').attr('stop-opacity', 0);

    // Smooth line generator
    const line = d3.line()
      .x(p => x(p.date))
      .y(p => y(p.count))
      .curve(d3.curveMonotoneX);

    // Filled area below the curve
    const area = d3.area()
      .x(p => x(p.date))
      .y0(height)
      .y1(p => y(p.count))
      .curve(d3.curveMonotoneX);

    svg.append('path').datum(points).attr('fill', 'url(#lineGrad)').attr('d', area);
    svg.append('path')
      .datum(points)
      .attr('fill', 'none')
      .attr('stroke', '#f93a5b')
      .attr('stroke-width', 2.5)
      .attr('d', line);

    // Dots on data points where there's actual activity
    svg.selectAll('circle.dot')
      .data(points.filter(p => p.count > 0))
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', p => x(p.date))
      .attr('cy', p => y(p.count))
      .attr('r', 3)
      .attr('fill', '#fff')
      .attr('stroke', '#f93a5b')
      .attr('stroke-width', 2);

    // X axis with date ticks (show ~6 dates so it doesn't overlap)
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat(d3.timeFormat('%b %d')))
      .selectAll('text')
      .style('font-size', '10px')
      .style('fill', colors.text);

    // Y axis with horizontal grid lines
    svg.append('g')
      .call(d3.axisLeft(y).ticks(5).tickSize(-width))
      .selectAll('text')
      .style('fill', colors.text)
      .style('font-size', '10px');

    svg.selectAll('.tick line').style('stroke', colors.gridLine).style('opacity', 0.5);
    svg.selectAll('.domain').style('stroke', colors.gridLine);
  };

  // Human-readable label for each post type (used in the KPI card)
  const typeLabels = { question: 'Questions', material: 'Study Materials', announcement: 'Announcements' };

  return (
    <div>
      <h1 className="page-title">Statistics Dashboard</h1>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-5)', marginTop: '-var(--space-2)' }}>
        Overview of activity across all study groups. Use the filter to view stats for a specific group.
      </p>

      {/* ── KPI Summary Cards ──────────────────────────────────────────── */}
      {/* Four tiles: total posts, active groups, most popular type, avg per month */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon" style={{ color: '#6366f1' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
          </div>
          <div className="kpi-value">{kpis.totalPosts}</div>
          <div className="kpi-label">Total Posts</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ color: '#f93a5b' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          </div>
          <div className="kpi-value">{kpis.totalGroups}</div>
          <div className="kpi-label">Active Groups</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ color: '#f59e0b' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          {/* textTransform: capitalize converts "question" → "Question" */}
          <div className="kpi-value" style={{ textTransform: 'capitalize' }}>{typeLabels[kpis.topType] || kpis.topType}</div>
          <div className="kpi-label">Most Popular Type</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ color: '#10b981' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          </div>
          <div className="kpi-value">{kpis.avgPerMonth}</div>
          <div className="kpi-label">Avg Posts / Month</div>
        </div>
      </div>

      {/* ── Group filter ──────────────────────────────────────────────────── */}
      {/* Changing this dropdown triggers the loadCharts useCallback to re-run */}
      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="flex items-center gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" aria-hidden="true">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          <label htmlFor="stats-filter" style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-secondary)' }}>Filter by group</label>
          <select id="stats-filter" className="form-input" style={{ width: 'auto', flex: 1, maxWidth: 300 }}
            value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}>
            <option value="">All groups</option>
            {/* Render one option per group */}
            {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
          </select>
        </div>
      </div>

      {/* ── Full-width Line Chart: daily activity over the last 30 days ── */}
      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <h2 className="section-title" style={{ marginBottom: 'var(--space-1)' }}>Daily Activity</h2>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-3)' }}>
          Posts published each day in the last 30 days
        </p>
        {loading ? (
          <div className="skeleton" style={{ height: 220, borderRadius: 'var(--radius-md)' }} />
        ) : (
          <div ref={lineRef} />
        )}
      </div>

      {/* ── Charts ───────────────────────────────────────────────────────── */}
      {/* Two-column grid: bar chart on left, pie chart on right */}
      <div className="charts-grid">
        {/* Bar chart */}
        <div className="card">
          <h2 className="section-title" style={{ marginBottom: 'var(--space-1)' }}>Posts per Month</h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-3)' }}>
            Number of posts published each month
          </p>
          {loading ? (
            /* Skeleton placeholder while chart data is loading */
            <div className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-md)' }} />
          ) : (
            /* barRef div — D3 will append an <svg> here */
            <div ref={barRef} />
          )}
        </div>

        {/* Pie chart */}
        <div className="card">
          <h2 className="section-title" style={{ marginBottom: 'var(--space-1)' }}>Post Types Distribution</h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-3)' }}>
            Breakdown by category: questions, study materials, and announcements
          </p>
          {loading ? (
            <div className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-md)' }} />
          ) : (
            <>
              {/* pieRef div — D3 will append an <svg> here */}
              <div ref={pieRef} />
              {/* Manual color legend below the pie chart */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-4)', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#f59e0b', display: 'inline-block' }} /> Questions
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#6366f1', display: 'inline-block' }} /> Study Materials
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#f93a5b', display: 'inline-block' }} /> Announcements
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default StatsPage;
