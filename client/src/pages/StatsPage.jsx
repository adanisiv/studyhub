import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3'; // D3.js — the industry-standard data visualization library
import API from '../api/axios';
import { useLanguage } from '../contexts/LanguageContext';

function StatsPage() {
  const { t } = useLanguage();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(''); // empty = all groups
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null); // platform-wide KPIs
  const [typeData, setTypeData] = useState([]);

  const barRef = useRef(null);
  const pieRef = useRef(null);
  const lineRef = useRef(null);

  useEffect(() => {
    API.get('/groups').then(res => {
      setGroups(Array.isArray(res.data) ? res.data : []);
    }).catch(console.error);
    // Load platform-wide KPIs (users, groups, posts this week, new members)
    API.get('/stats/dashboard').then(res => setDashboard(res.data)).catch(console.error);
  }, []);

  // Fetches chart data and redraws all three D3 charts when selectedGroup changes.
  const loadCharts = useCallback(async () => {
    setLoading(true);
    const params = selectedGroup ? { groupId: selectedGroup } : {};
    try {
      const [monthRes, typeRes, dailyRes] = await Promise.all([
        API.get('/stats/posts-per-month', { params }),
        API.get('/stats/post-types', { params }),
        API.get('/stats/daily-activity', { params })
      ]);
      setTypeData(typeRes.data || []);
      drawBarChart(monthRes.data || []);
      drawPieChart(typeRes.data || []);
      drawLineChart(dailyRes.data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [selectedGroup]);

  useEffect(() => { loadCharts(); }, [loadCharts]);

  // D3 can't read CSS variables — read concrete color values from the theme attribute
  const getChartColors = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      text: isDark ? '#a0a8c0' : '#475569',
      gridLine: isDark ? '#252540' : '#e2e8f0',
      accent: '#f93a5b',
      bg: isDark ? '#16162a' : '#ffffff'
    };
  };

  // data: array of { month: "Jan 2025", count: 12 }
  const drawBarChart = (data) => {
    const container = barRef.current;
    d3.select(container).selectAll('*').remove();
    const colors = getChartColors();

    if (data.length === 0) {
      d3.select(container).append('div')
        .style('text-align', 'center').style('padding', '40px')
        .style('color', colors.text).style('font-size', '13px')
        .text('No data available');
      return;
    }

    const margin = { top: 20, right: 16, bottom: 40, left: 40 };
    const width = 400 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('viewBox', '0 0 400 250')
      .attr('role', 'img')
      .attr('aria-label', 'Bar chart showing posts per month')
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X: categorical scale for month labels; Y: linear scale for post count
    const x = d3.scaleBand().domain(data.map(d => d.month)).range([0, width]).padding(0.35);
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d.count)]).nice().range([height, 0]);

    // Gradient fill: bright red top → darker red bottom
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient').attr('id', 'barGrad').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 1);
    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#f93a5b');
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#e71d47');

    svg.selectAll('rect')
      .data(data).enter()
      .append('rect')
      .attr('x', d => x(d.month))
      .attr('y', d => y(d.count))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.count))
      .attr('fill', 'url(#barGrad)')
      .attr('rx', 6).attr('ry', 6);

    // X axis with rotated labels to prevent overlap
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickSize(0))
      .selectAll('text')
      .style('font-size', '10px').style('fill', colors.text)
      .attr('transform', 'rotate(-30)').style('text-anchor', 'end');

    // Y axis with horizontal grid lines extending across the chart
    svg.append('g')
      .call(d3.axisLeft(y).ticks(5).tickSize(-width))
      .selectAll('text').style('fill', colors.text).style('font-size', '10px');

    svg.selectAll('.tick line').style('stroke', colors.gridLine).style('opacity', 0.5);
    svg.selectAll('.domain').style('stroke', colors.gridLine);

    // Count labels above each bar
    svg.selectAll('.label').data(data).enter()
      .append('text')
      .attr('x', d => x(d.month) + x.bandwidth() / 2)
      .attr('y', d => y(d.count) - 6)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px').style('font-weight', '600').style('fill', colors.text)
      .text(d => d.count);
  };

  // data: array of { type: "question"|"material"|"announcement", count: N }
  const drawPieChart = (data) => {
    const container = pieRef.current;
    d3.select(container).selectAll('*').remove();
    const colors = getChartColors();

    if (data.length === 0) {
      d3.select(container).append('div')
        .style('text-align', 'center').style('padding', '40px')
        .style('color', colors.text).style('font-size', '13px')
        .text('No data available');
      return;
    }

    const size = 250;
    const radius = size / 2 - 20;

    const typeColors = {
      question: '#f59e0b',
      material: '#6366f1',
      announcement: '#f93a5b'
    };

    const svg = d3.select(container)
      .append('svg')
      .attr('viewBox', `0 0 ${size} ${size}`)
      .attr('role', 'img')
      .attr('aria-label', 'Donut chart showing post type distribution')
      .append('g')
      .attr('transform', `translate(${size / 2},${size / 2})`);

    // d3.pie() converts raw values to start/end angles; innerRadius creates a donut
    const pie = d3.pie().value(d => d.count).padAngle(0.03);
    const arc = d3.arc().innerRadius(radius * 0.55).outerRadius(radius).cornerRadius(4);

    svg.selectAll('path')
      .data(pie(data)).enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', d => typeColors[d.data.type] || '#94a3b8')
      .style('filter', 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))');

    // Small percentage labels inside each slice (hidden for slices < 8%)
    const labelArc = d3.arc().innerRadius(radius * 0.78).outerRadius(radius * 0.78);
    const total = data.reduce((s, d) => s + d.count, 0);
    svg.selectAll('text')
      .data(pie(data)).enter()
      .append('text')
      .attr('transform', d => `translate(${labelArc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px').style('font-weight', '600').style('fill', '#fff')
      .text(d => (d.data.count / total) < 0.08 ? '' : `${d.data.count}`);

    // Center total count
    svg.append('text').attr('text-anchor', 'middle').attr('dy', -2)
      .style('font-size', '22px').style('font-weight', '700').style('fill', colors.text)
      .text(total);
    svg.append('text').attr('text-anchor', 'middle').attr('dy', 14)
      .style('font-size', '9px').style('font-weight', '500').style('fill', colors.text).style('opacity', 0.7)
      .text('total');
  };

  // data: array of { date: 'YYYY-MM-DD', label: 'Jun 26', count: 4 }
  const drawLineChart = (data) => {
    const container = lineRef.current;
    d3.select(container).selectAll('*').remove();
    const colors = getChartColors();

    if (!data.length) {
      d3.select(container).append('div')
        .style('text-align', 'center').style('padding', '40px')
        .style('color', colors.text).style('font-size', '13px')
        .text('No data available');
      return;
    }

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

    // Parse YYYY-MM-DD strings into JS Date objects for scaleTime
    const parseDate = d3.timeParse('%Y-%m-%d');
    const points = data.map(d => ({ date: parseDate(d.date), label: d.label, count: d.count }));

    const x = d3.scaleTime().domain(d3.extent(points, p => p.date)).range([0, width]);
    const maxCount = d3.max(points, p => p.count) || 1;
    const y = d3.scaleLinear().domain([0, maxCount]).nice().range([height, 0]);

    // Gradient fill under the curve for visual depth
    const defs = svg.append('defs');
    const grad = defs.append('linearGradient')
      .attr('id', 'lineGrad').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 1);
    grad.append('stop').attr('offset', '0%').attr('stop-color', '#f93a5b').attr('stop-opacity', 0.35);
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#f93a5b').attr('stop-opacity', 0);

    // curveMonotoneX: smooth line that preserves monotonicity (no overshoot)
    const line = d3.line().x(p => x(p.date)).y(p => y(p.count)).curve(d3.curveMonotoneX);
    const area = d3.area().x(p => x(p.date)).y0(height).y1(p => y(p.count)).curve(d3.curveMonotoneX);

    svg.append('path').datum(points).attr('fill', 'url(#lineGrad)').attr('d', area);
    svg.append('path').datum(points)
      .attr('fill', 'none').attr('stroke', '#f93a5b').attr('stroke-width', 2.5).attr('d', line);

    // Dots on days that have at least one post
    svg.selectAll('circle.dot')
      .data(points.filter(p => p.count > 0)).enter()
      .append('circle').attr('class', 'dot')
      .attr('cx', p => x(p.date)).attr('cy', p => y(p.count))
      .attr('r', 3).attr('fill', '#fff').attr('stroke', '#f93a5b').attr('stroke-width', 2);

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat(d3.timeFormat('%b %d')))
      .selectAll('text').style('font-size', '10px').style('fill', colors.text);

    svg.append('g')
      .call(d3.axisLeft(y).ticks(5).tickSize(-width))
      .selectAll('text').style('fill', colors.text).style('font-size', '10px');

    svg.selectAll('.tick line').style('stroke', colors.gridLine).style('opacity', 0.5);
    svg.selectAll('.domain').style('stroke', colors.gridLine);
  };

  const totalChartPosts = typeData.reduce((s, d) => s + d.count, 0);
  const topType = typeData.length > 0 ? typeData.reduce((a, b) => a.count > b.count ? a : b).type : null;
  const typeLabels = { question: t('questions'), material: t('studyMaterials'), announcement: t('announcements') };

  const selectedGroupName = selectedGroup
    ? groups.find(g => g._id === selectedGroup)?.name || t('allGroups')
    : 'the entire platform';

  // Section header component used to visually separate the two halves of the page
  const SectionHeader = ({ icon, title, subtitle }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: 'var(--space-6) 0 var(--space-4)' }}>
      <div style={{
        width: 36, height: 36, borderRadius: 'var(--radius-md)',
        background: 'var(--accent-light, rgba(99,102,241,0.1))',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        color: 'var(--accent)',
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>{subtitle}</div>
      </div>
    </div>
  );

  return (
    <div>
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 'var(--space-2)' }}>
        <h1 className="page-title" style={{ marginBottom: 4 }}>{t('statsDashboard')}</h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
          Live data about students, groups, and posts across the StudyHub platform
        </p>
      </div>

      {/* ══ SECTION 1: Platform overview ════════════════════════════════════ */}
      <SectionHeader
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
          </svg>
        }
        title="Platform Overview"
        subtitle="These 4 numbers always reflect the entire platform — they are not affected by the group filter below"
      />

      <div className="kpi-grid">
        {/* ── Total Students ── */}
        <div className="kpi-card">
          <div className="kpi-icon" style={{ color: '#6366f1' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
            </svg>
          </div>
          <div className="kpi-value">{dashboard?.totalUsers ?? '–'}</div>
          <div className="kpi-label">{t('totalStudents')}</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 6, lineHeight: 1.4 }}>
            Total registered accounts on the platform
          </div>
        </div>

        {/* ── Study Groups ── */}
        <div className="kpi-card">
          <div className="kpi-icon" style={{ color: '#f93a5b' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
            </svg>
          </div>
          <div className="kpi-value">{dashboard?.activeGroups ?? '–'}</div>
          <div className="kpi-label">{t('studyGroups')}</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 6, lineHeight: 1.4 }}>
            All groups ever created on the platform (by everyone, not just you)
          </div>
        </div>

        {/* ── Posts This Week ── */}
        <div className="kpi-card">
          <div className="kpi-icon" style={{ color: '#f59e0b' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
            </svg>
          </div>
          <div className="kpi-value">{dashboard?.postsThisWeek ?? '–'}</div>
          <div className="kpi-label">{t('postsThisWeek')}</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 6, lineHeight: 1.4 }}>
            Posts published across all groups in the last 7 days
          </div>
        </div>

        {/* ── New Members ── */}
        <div className="kpi-card">
          <div className="kpi-icon" style={{ color: '#10b981' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/>
              <path d="M20 8v6M23 11h-6"/>
            </svg>
          </div>
          <div className="kpi-value">{dashboard?.newMembers ?? '–'}</div>
          <div className="kpi-label">{t('newMembers')}</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 6, lineHeight: 1.4 }}>
            Students who signed up in the last 30 days
          </div>
        </div>
      </div>

      {/* ══ SECTION 2: Chart analysis ════════════════════════════════════════ */}
      <SectionHeader
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        }
        title="Chart Analysis"
        subtitle="Interactive charts — use the filter below to drill into a specific group or view all groups at once"
      />

      {/* ── Group filter ──────────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 'var(--space-5)', borderLeft: '4px solid var(--accent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-3)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" aria-hidden="true">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
            Filter: which group do you want to analyse?
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <select
            className="form-input"
            style={{ maxWidth: 280 }}
            value={selectedGroup}
            onChange={e => setSelectedGroup(e.target.value)}
          >
            <option value="">All groups — entire platform</option>
            {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
          </select>
          {/* Live indicator showing what is currently being shown */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: selectedGroup ? 'rgba(99,102,241,0.08)' : 'var(--bg-hover)',
            border: `1px solid ${selectedGroup ? 'rgba(99,102,241,0.3)' : 'var(--border-light)'}`,
            borderRadius: 'var(--radius-md)', padding: '8px 14px',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: selectedGroup ? '#6366f1' : '#10b981', flexShrink: 0 }} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              Charts show: <strong style={{ color: 'var(--text-primary)' }}>
                {selectedGroup ? groups.find(g => g._id === selectedGroup)?.name : 'All groups'}
              </strong>
              {!loading && <> · <strong>{totalChartPosts}</strong> posts</>}
              {!loading && topType && <> · mostly <strong>{typeLabels[topType]}</strong></>}
            </span>
          </div>
        </div>
      </div>

      {/* ── Chart 1: Daily activity line chart (full width) ──────────────── */}
      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
          <div>
            <h2 className="section-title" style={{ marginBottom: 4 }}>{t('dailyActivity')}</h2>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: 0 }}>
              Each point = how many posts were published on that day.
              A spike means students were very active. A flat line means no posts that day.
            </p>
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', background: 'var(--bg-hover)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', whiteSpace: 'nowrap' }}>
            Last 30 days
          </span>
        </div>
        {loading ? (
          <div className="skeleton" style={{ height: 220, borderRadius: 'var(--radius-md)' }} />
        ) : (
          <div ref={lineRef} />
        )}
      </div>

      {/* ── Charts 2 & 3: Bar + Donut side by side ──────────────────────── */}
      <div className="charts-grid">
        {/* Bar chart */}
        <div className="card">
          <h2 className="section-title" style={{ marginBottom: 4 }}>{t('postsPerMonth')}</h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-3)', lineHeight: 1.5 }}>
            Each bar = total posts published in that calendar month.
            Taller bar = more activity that month.
          </p>
          {loading ? (
            <div className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-md)' }} />
          ) : (
            <div ref={barRef} />
          )}
        </div>

        {/* Donut chart */}
        <div className="card">
          <h2 className="section-title" style={{ marginBottom: 4 }}>{t('postTypes')}</h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-3)', lineHeight: 1.5 }}>
            What kinds of posts students share — questions, study materials, or announcements.
            The number in the centre is the total.
          </p>
          {loading ? (
            <div className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-md)' }} />
          ) : (
            <>
              <div ref={pieRef} />
              <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-4)', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
                {[
                  { color: '#f59e0b', label: t('questions'), desc: 'Students asking for help' },
                  { color: '#6366f1', label: t('studyMaterials'), desc: 'Notes, files, resources' },
                  { color: '#f93a5b', label: t('announcements'), desc: 'Group announcements' },
                ].map(({ color, label, desc }) => (
                  <span key={label} title={desc} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', cursor: 'default' }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: 'inline-block', flexShrink: 0 }} />
                    {label}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default StatsPage;
