import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import API from '../api/axios';

function StatsPage() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({ totalPosts: 0, totalGroups: 0, topType: '-', avgPerMonth: 0 });
  const barRef = useRef(null);
  const pieRef = useRef(null);

  useEffect(() => {
    API.get('/groups').then(res => {
      const data = Array.isArray(res.data) ? res.data : [];
      setGroups(data);
      setKpis(prev => ({ ...prev, totalGroups: data.length }));
    }).catch(console.error);
  }, []);

  const loadCharts = useCallback(async () => {
    setLoading(true);
    const params = selectedGroup ? { groupId: selectedGroup } : {};
    try {
      const [monthRes, typeRes] = await Promise.all([
        API.get('/stats/posts-per-month', { params }),
        API.get('/stats/post-types', { params })
      ]);

      const monthData = monthRes.data || [];
      const typeData = typeRes.data || [];

      const totalPosts = typeData.reduce((s, d) => s + d.count, 0);
      const topType = typeData.length > 0 ? typeData.reduce((a, b) => a.count > b.count ? a : b, typeData[0]).type : '-';
      const avgPerMonth = monthData.length > 0 ? Math.round(totalPosts / monthData.length) : 0;
      setKpis(prev => ({ ...prev, totalPosts, topType, avgPerMonth }));

      drawBarChart(monthData);
      drawPieChart(typeData);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [selectedGroup]); // drawBarChart/drawPieChart are stable refs, selectedGroup is the only real dep

  useEffect(() => {
    loadCharts();
  }, [loadCharts]);

  const getChartColors = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      text: isDark ? '#a0a8c0' : '#475569',
      gridLine: isDark ? '#252540' : '#e2e8f0',
      accent: '#f93a5b',
      bg: isDark ? '#16162a' : '#ffffff'
    };
  };

  // --- D3 Bar Chart: posts per month ---
  const drawBarChart = (data) => {
    const container = barRef.current;
    d3.select(container).selectAll('*').remove();
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

    const x = d3.scaleBand().domain(data.map(d => d.month)).range([0, width]).padding(0.35);
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d.count)]).nice().range([height, 0]);

    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient').attr('id', 'barGrad').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 1);
    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#f93a5b');
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#e71d47');

    svg.selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', d => x(d.month))
      .attr('y', d => y(d.count))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.count))
      .attr('fill', 'url(#barGrad)')
      .attr('rx', 6)
      .attr('ry', 6);

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickSize(0))
      .selectAll('text')
      .style('font-size', '10px')
      .style('fill', colors.text)
      .attr('transform', 'rotate(-30)')
      .style('text-anchor', 'end');

    svg.append('g')
      .call(d3.axisLeft(y).ticks(5).tickSize(-width))
      .selectAll('text')
      .style('fill', colors.text)
      .style('font-size', '10px');

    svg.selectAll('.tick line').style('stroke', colors.gridLine).style('opacity', 0.5);
    svg.selectAll('.domain').style('stroke', colors.gridLine);

    svg.selectAll('.label')
      .data(data)
      .enter()
      .append('text')
      .attr('x', d => x(d.month) + x.bandwidth() / 2)
      .attr('y', d => y(d.count) - 6)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', '600')
      .style('fill', colors.text)
      .text(d => d.count);
  };

  // --- D3 Pie Chart: post types ---
  const drawPieChart = (data) => {
    const container = pieRef.current;
    d3.select(container).selectAll('*').remove();
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
      .attr('aria-label', 'Pie chart showing post type distribution')
      .append('g')
      .attr('transform', `translate(${size / 2},${size / 2})`);

    const pie = d3.pie().value(d => d.count).padAngle(0.03);
    const arc = d3.arc().innerRadius(radius * 0.55).outerRadius(radius).cornerRadius(4);

    svg.selectAll('path')
      .data(pie(data))
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', d => typeColors[d.data.type] || '#94a3b8')
      .style('filter', 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))');

    const labelArc = d3.arc().innerRadius(radius * 0.78).outerRadius(radius * 0.78);
    svg.selectAll('text')
      .data(pie(data))
      .enter()
      .append('text')
      .attr('transform', d => `translate(${labelArc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('font-weight', '600')
      .style('fill', '#fff')
      .text(d => `${d.data.type} (${d.data.count})`);
  };

  return (
    <div>
      <h1 className="page-title">Statistics</h1>

      {/* KPI Summary Tiles */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-value">{kpis.totalPosts}</div>
          <div className="kpi-label">Total Posts</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{kpis.totalGroups}</div>
          <div className="kpi-label">Groups</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value" style={{ textTransform: 'capitalize' }}>{kpis.topType}</div>
          <div className="kpi-label">Top Post Type</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{kpis.avgPerMonth}</div>
          <div className="kpi-label">Avg / Month</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="flex items-center gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" aria-hidden="true">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          <label htmlFor="stats-filter" style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-secondary)' }}>Filter by group</label>
          <select id="stats-filter" className="form-input" style={{ width: 'auto', flex: 1, maxWidth: 300 }}
            value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}>
            <option value="">All groups</option>
            {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
          </select>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card">
          <h2 className="section-title" style={{ marginBottom: 'var(--space-3)' }}>Posts per Month</h2>
          {loading ? (
            <div className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-md)' }} />
          ) : (
            <div ref={barRef} />
          )}
        </div>
        <div className="card">
          <h2 className="section-title" style={{ marginBottom: 'var(--space-3)' }}>Post Types</h2>
          {loading ? (
            <div className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-md)' }} />
          ) : (
            <div ref={pieRef} />
          )}
        </div>
      </div>
    </div>
  );
}

export default StatsPage;
