import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import API from '../api/axios';

function StatsPage() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const barRef = useRef(null);
  const pieRef = useRef(null);

  useEffect(() => {
    API.get('/groups').then(res => setGroups(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    loadCharts();
  }, [selectedGroup]);

  const loadCharts = async () => {
    const params = selectedGroup ? { groupId: selectedGroup } : {};
    try {
      const [monthRes, typeRes] = await Promise.all([
        API.get('/stats/posts-per-month', { params }),
        API.get('/stats/post-types', { params })
      ]);
      drawBarChart(monthRes.data);
      drawPieChart(typeRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  // --- D3 Bar Chart: posts per month ---
  const drawBarChart = (data) => {
    const container = barRef.current;
    d3.select(container).selectAll('*').remove();
    if (data.length === 0) {
      d3.select(container).append('p').text('No data').style('color', '#999').style('text-align', 'center');
      return;
    }

    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const width = 400 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('viewBox', `0 0 400 250`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand().domain(data.map(d => d.month)).range([0, width]).padding(0.3);
    const y = d3.scaleLinear().domain([0, d3.max(data, d => d.count)]).nice().range([height, 0]);

    // bars
    svg.selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', d => x(d.month))
      .attr('y', d => y(d.count))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.count))
      .attr('fill', '#e94560')
      .attr('rx', 4);

    // x axis
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('font-size', '10px')
      .attr('transform', 'rotate(-30)')
      .style('text-anchor', 'end');

    // y axis
    svg.append('g').call(d3.axisLeft(y).ticks(5));

    // labels on bars
    svg.selectAll('.label')
      .data(data)
      .enter()
      .append('text')
      .attr('x', d => x(d.month) + x.bandwidth() / 2)
      .attr('y', d => y(d.count) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('fill', '#333')
      .text(d => d.count);
  };

  // --- D3 Pie Chart: post types ---
  const drawPieChart = (data) => {
    const container = pieRef.current;
    d3.select(container).selectAll('*').remove();
    if (data.length === 0) {
      d3.select(container).append('p').text('No data').style('color', '#999').style('text-align', 'center');
      return;
    }

    const size = 250;
    const radius = size / 2 - 20;
    const colors = { question: '#e94560', material: '#16213e', announcement: '#0f3460' };

    const svg = d3.select(container)
      .append('svg')
      .attr('viewBox', `0 0 ${size} ${size}`)
      .append('g')
      .attr('transform', `translate(${size / 2},${size / 2})`);

    const pie = d3.pie().value(d => d.count);
    const arc = d3.arc().innerRadius(40).outerRadius(radius);

    svg.selectAll('path')
      .data(pie(data))
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', d => colors[d.data.type] || '#999')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // labels
    const labelArc = d3.arc().innerRadius(radius * 0.7).outerRadius(radius * 0.7);
    svg.selectAll('text')
      .data(pie(data))
      .enter()
      .append('text')
      .attr('transform', d => `translate(${labelArc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('fill', '#fff')
      .text(d => `${d.data.type} (${d.data.count})`);
  };

  return (
    <div>
      <h1 className="page-title">Statistics</h1>

      <div className="card mb-10">
        <label style={{ fontSize: 13, fontWeight: 700, marginRight: 8 }}>Filter by group:</label>
        <select className="form-input" style={{ width: 'auto', display: 'inline-block' }}
          value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}>
          <option value="">All groups</option>
          {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
        </select>
      </div>

      <div className="charts-grid">
        <div className="card">
          <h3 style={{ marginBottom: 10 }}>Posts per Month</h3>
          <div ref={barRef}></div>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: 10 }}>Post Types</h3>
          <div ref={pieRef}></div>
        </div>
      </div>
    </div>
  );
}

export default StatsPage;
