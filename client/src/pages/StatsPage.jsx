import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import API from '../api/axios';

function StatsPage() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({ totalPosts: 0, totalGroups: 0, topType: '-', avgPerMonth: 0 });

  const [monthData, setMonthData]   = useState([]);
  const [typeData,  setTypeData]    = useState([]);
  const [dailyData, setDailyData]   = useState([]);

  const barRef  = useRef(null);
  const pieRef  = useRef(null);
  const lineRef = useRef(null);

  useEffect(() => {
    API.get('/groups').then(res => {
      const data = Array.isArray(res.data) ? res.data : [];
      setGroups(data);
      setKpis(prev => ({ ...prev, totalGroups: data.length }));
    }).catch(console.error);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const params = selectedGroup ? { groupId: selectedGroup } : {};
    try {
      const [monthRes, typeRes, dailyRes] = await Promise.all([
        API.get('/stats/posts-per-month', { params }),
        API.get('/stats/post-types',      { params }),
        API.get('/stats/daily-activity',  { params }),
      ]);

      const month = monthRes.data || [];
      const type  = typeRes.data  || [];
      const daily = dailyRes.data || [];

      const totalPosts  = type.reduce((s, d) => s + d.count, 0);
      const topType     = type.length > 0
        ? type.reduce((a, b) => a.count > b.count ? a : b, type[0]).type
        : '-';
      const avgPerMonth = month.length > 0 ? Math.round(totalPosts / month.length) : 0;

      setKpis(prev => ({ ...prev, totalPosts, topType, avgPerMonth }));
      setMonthData(month);
      setTypeData(type);
      setDailyData(daily);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [selectedGroup]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (loading) return;          
    if (!barRef.current || !pieRef.current || !lineRef.current) return; 
    drawBarChart(monthData);
    drawPieChart(typeData);
    drawLineChart(dailyData);
  }, [loading, monthData, typeData, dailyData]);

  const getChartColors = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      text:     isDark ? '#a0a8c0' : '#475569',
      gridLine: isDark ? '#252540' : '#e2e8f0',
      accent:   '#f93a5b',
      bg:       isDark ? '#16162a' : '#ffffff',
    };
  };

  const drawBarChart = (data) => {
    const container = barRef.current;
    d3.select(container).selectAll('*').remove();
    const colors = getChartColors();

    if (!data.length) {
      d3.select(container).append('div')
        .style('text-align','center').style('padding','40px')
        .style('color', colors.text).style('font-size','13px')
        .text('No data available');
      return;
    }

    const margin = { top: 20, right: 16, bottom: 40, left: 40 };
    const width  = 400 - margin.left - margin.right;
    const height = 250 - margin.top  - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('viewBox', '0 0 400 250')
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand().domain(data.map(d => d.month)).range([0, width]).padding(0.35);
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d.count)]).nice().range([height, 0]);

    const defs     = svg.append('defs');
    const gradient = defs.append('linearGradient').attr('id','barGrad').attr('x1',0).attr('y1',0).attr('x2',0).attr('y2',1);
    gradient.append('stop').attr('offset','0%').attr('stop-color','#f93a5b');
    gradient.append('stop').attr('offset','100%').attr('stop-color','#e71d47');

    svg.selectAll('rect')
      .data(data).enter().append('rect')
      .attr('x',      d => x(d.month))
      .attr('y',      d => y(d.count))
      .attr('width',  x.bandwidth())
      .attr('height', d => height - y(d.count))
      .attr('fill',   'url(#barGrad)')
      .attr('rx', 6).attr('ry', 6);

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickSize(0))
      .selectAll('text')
      .style('font-size','10px').style('fill', colors.text)
      .attr('transform','rotate(-30)').style('text-anchor','end');

    svg.append('g')
      .call(d3.axisLeft(y).ticks(5).tickSize(-width))
      .selectAll('text')
      .style('fill', colors.text).style('font-size','10px');

    svg.selectAll('.tick line').style('stroke', colors.gridLine).style('opacity', 0.5);
    svg.selectAll('.domain').style('stroke', colors.gridLine);
  };

  const drawPieChart = (data) => {
    const container = pieRef.current;
    d3.select(container).selectAll('*').remove();
    const colors = getChartColors();

    if (!data.length) {
      d3.select(container).append('div')
        .style('text-align','center').style('padding','40px')
        .style('color', colors.text).style('font-size','13px')
        .text('No data available');
      return;
    }

    const size   = 250;
    const radius = size / 2 - 20;
    const typeColors = { question: '#f59e0b', material: '#6366f1', announcement: '#f93a5b' };

    const svg = d3.select(container)
      .append('svg')
      .attr('viewBox', `0 0 ${size} ${size}`)
      .append('g')
      .attr('transform', `translate(${size / 2},${size / 2})`);

    const pie = d3.pie().value(d => d.count).padAngle(0.03);
    const arc = d3.arc().innerRadius(radius * 0.55).outerRadius(radius).cornerRadius(4);

    svg.selectAll('path')
      .data(pie(data)).enter().append('path')
      .attr('d', arc)
      .attr('fill', d => typeColors[d.data.type] || '#94a3b8');

    const total = data.reduce((s, d) => s + d.count, 0);

    svg.append('text')
      .attr('text-anchor','middle').attr('dy',-2)
      .style('font-size','22px').style('font-weight','700').style('fill', colors.text)
      .text(total);
    svg.append('text')
      .attr('text-anchor','middle').attr('dy',14)
      .style('font-size','9px').style('font-weight','500')
      .style('fill', colors.text).style('opacity',0.7)
      .text('total');
  };

  const drawLineChart = (data) => {
    const container = lineRef.current;
    d3.select(container).selectAll('*').remove();
    const colors = getChartColors();

    if (!data.length) {
      d3.select(container).append('div')
        .style('text-align','center').style('padding','40px')
        .style('color', colors.text).style('font-size','13px')
        .text('No data available');
      return;
    }

    const margin = { top: 20, right: 20, bottom: 36, left: 36 };
    const width  = 820 - margin.left - margin.right;
    const height = 220 - margin.top  - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('viewBox','0 0 820 220')
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const parseDate = d3.timeParse('%Y-%m-%d');
    const points    = data.map(d => ({ date: parseDate(d.date), count: d.count }));

    const x = d3.scaleTime().domain(d3.extent(points, p => p.date)).range([0, width]);
    const y = d3.scaleLinear().domain([0, d3.max(points, p => p.count) || 1]).nice().range([height, 0]);

    const defs = svg.append('defs');
    const grad = defs.append('linearGradient').attr('id','lineGrad').attr('x1',0).attr('y1',0).attr('x2',0).attr('y2',1);
    grad.append('stop').attr('offset','0%').attr('stop-color','#f93a5b').attr('stop-opacity',0.35);
    grad.append('stop').attr('offset','100%').attr('stop-color','#f93a5b').attr('stop-opacity',0);

    const line = d3.line().x(p => x(p.date)).y(p => y(p.count)).curve(d3.curveMonotoneX);
    const area = d3.area().x(p => x(p.date)).y0(height).y1(p => y(p.count)).curve(d3.curveMonotoneX);

    svg.append('path').datum(points).attr('fill','url(#lineGrad)').attr('d', area);
    svg.append('path').datum(points).attr('fill','none').attr('stroke','#f93a5b').attr('stroke-width',2.5).attr('d', line);

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat(d3.timeFormat('%b %d')))
      .selectAll('text')
      .style('font-size','10px').style('fill', colors.text);

    svg.append('g')
      .call(d3.axisLeft(y).ticks(5).tickSize(-width))
      .selectAll('text')
      .style('fill', colors.text).style('font-size','10px');

    svg.selectAll('.tick line').style('stroke', colors.gridLine).style('opacity',0.5);
    svg.selectAll('.domain').style('stroke', colors.gridLine);
  };

  const typeLabels = { question: 'Questions', material: 'Study Materials', announcement: 'Announcements' };

  return (
    <div>
      <h1 className="page-title">Statistics Dashboard</h1>
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-value">{kpis.totalPosts}</div>
          <div className="kpi-label">Total Posts</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{kpis.totalGroups}</div>
          <div className="kpi-label">Active Groups</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{typeLabels[kpis.topType] || kpis.topType}</div>
          <div className="kpi-label">Most Popular Type</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{kpis.avgPerMonth}</div>
          <div className="kpi-label">Avg Posts / Month</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}>
          <option value="">All groups</option>
          {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
        </select>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <h2>Daily Activity</h2>
        {loading ? <div>Loading charts...</div> : <div ref={lineRef} />}
      </div>

      <div className="charts-grid" style={{ display: 'flex', gap: '20px' }}>
        <div className="card" style={{ flex: 1 }}>
          <h2>Posts per Month</h2>
          {loading ? <div>Loading...</div> : <div ref={barRef} />}
        </div>
        <div className="card" style={{ flex: 1 }}>
          <h2>Post Types Distribution</h2>
          {loading ? <div>Loading...</div> : <div ref={pieRef} />}
        </div>
      </div>
    </div>
  );
}

export default StatsPage;