import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import PostCard from '../components/common/PostCard';

function SearchPage({ user }) {
  const [tab, setTab] = useState('groups'); // 'groups' | 'posts' | 'users'

  // --- Group search (Advanced Search #1: name, year, semester, department) ---
  const [groupFilters, setGroupFilters] = useState({ name: '', year: '', semester: '', department: '' });
  const [groupResults, setGroupResults] = useState([]);

  const searchGroups = async () => {
    const params = {};
    if (groupFilters.name) params.name = groupFilters.name;
    if (groupFilters.year) params.year = groupFilters.year;
    if (groupFilters.semester) params.semester = groupFilters.semester;
    if (groupFilters.department) params.department = groupFilters.department;
    try {
      const res = await API.get('/groups/search', { params });
      setGroupResults(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // --- Post search (Advanced Search #2: keyword, type, dateFrom/dateTo, tag) ---
  const [postFilters, setPostFilters] = useState({ keyword: '', type: '', dateFrom: '', dateTo: '', tag: '' });
  const [postResults, setPostResults] = useState([]);

  const searchPosts = async () => {
    const params = {};
    if (postFilters.keyword) params.keyword = postFilters.keyword;
    if (postFilters.type) params.type = postFilters.type;
    if (postFilters.dateFrom) params.dateFrom = postFilters.dateFrom;
    if (postFilters.dateTo) params.dateTo = postFilters.dateTo;
    if (postFilters.tag) params.tag = postFilters.tag;
    try {
      const res = await API.get('/posts/search', { params });
      setPostResults(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // --- jQuery Ajax live user search (course requirement) ---
  const jqueryInputRef = useRef(null);
  const jqueryResultsRef = useRef(null);

  useEffect(() => {
    // jQuery is loaded globally from index.html CDN
    const $ = window.jQuery;
    if (!$ || !jqueryInputRef.current) return;

    const $input = $(jqueryInputRef.current);
    const $results = $(jqueryResultsRef.current);
    const token = localStorage.getItem('token');

    // live search with jQuery Ajax on keyup
    $input.on('keyup', function () {
      const val = $(this).val().trim();
      if (val.length < 2) {
        $results.hide().empty();
        return;
      }
      $.ajax({
        url: `http://localhost:5000/api/users/search?name=${encodeURIComponent(val)}`,
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
        success: function (data) {
          $results.empty();
          if (data.length === 0) {
            $results.append('<div class="search-result-item">No users found</div>');
          } else {
            data.forEach(function (u) {
              $results.append(
                `<div class="search-result-item" data-id="${u._id}">
                  <strong>${u.name}</strong> — ${u.department || 'N/A'}, Year ${u.year}
                </div>`
              );
            });
          }
          $results.show();
        },
        error: function () {
          $results.hide();
        }
      });
    });

    // click on result → navigate
    $results.on('click', '.search-result-item', function () {
      const id = $(this).data('id');
      if (id) window.location.href = `/profile/${id}`;
    });

    // hide on blur
    $input.on('blur', function () {
      setTimeout(() => $results.hide(), 200);
    });

    return () => { $input.off(); $results.off(); };
  }, [tab]);

  return (
    <div>
      <h1 className="page-title">Search</h1>

      {/* Tab buttons */}
      <div className="flex gap-8 mb-10">
        <button className={`btn ${tab === 'groups' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('groups')}>Search Groups</button>
        <button className={`btn ${tab === 'posts' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('posts')}>Search Posts</button>
        <button className={`btn ${tab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('users')}>Search Users (jQuery)</button>
      </div>

      {/* === Group search === */}
      {tab === 'groups' && (
        <div>
          <div className="card">
            <h3 style={{ marginBottom: 12 }}>Search Groups (4 parameters)</h3>
            <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
              <input className="form-input" style={{ flex: 1, minWidth: 150 }} placeholder="Group name"
                value={groupFilters.name} onChange={e => setGroupFilters({ ...groupFilters, name: e.target.value })} />
              <select className="form-input" style={{ width: 100 }} value={groupFilters.year}
                onChange={e => setGroupFilters({ ...groupFilters, year: e.target.value })}>
                <option value="">Year</option>
                {[1,2,3,4,5,6].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select className="form-input" style={{ width: 120 }} value={groupFilters.semester}
                onChange={e => setGroupFilters({ ...groupFilters, semester: e.target.value })}>
                <option value="">Semester</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="Summer">Summer</option>
              </select>
              <input className="form-input" style={{ flex: 1, minWidth: 150 }} placeholder="Department"
                value={groupFilters.department} onChange={e => setGroupFilters({ ...groupFilters, department: e.target.value })} />
              <button className="btn btn-primary" onClick={searchGroups}>Search</button>
            </div>
          </div>
          {groupResults.map(g => (
            <div key={g._id} className="card">
              <Link to={`/groups/${g._id}`} style={{ fontWeight: 700, fontSize: 16, textDecoration: 'none', color: '#1a1a2e' }}>
                {g.name}
              </Link>
              <p className="text-muted">{g.description}</p>
              <p style={{ fontSize: 13 }}>{g.subject} · Year {g.year} · Sem {g.semester} · {g.department}</p>
            </div>
          ))}
        </div>
      )}

      {/* === Post search === */}
      {tab === 'posts' && (
        <div>
          <div className="card">
            <h3 style={{ marginBottom: 12 }}>Search Posts (4 parameters)</h3>
            <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
              <input className="form-input" style={{ flex: 1, minWidth: 150 }} placeholder="Keyword"
                value={postFilters.keyword} onChange={e => setPostFilters({ ...postFilters, keyword: e.target.value })} />
              <select className="form-input" style={{ width: 140 }} value={postFilters.type}
                onChange={e => setPostFilters({ ...postFilters, type: e.target.value })}>
                <option value="">All types</option>
                <option value="question">Question</option>
                <option value="material">Material</option>
                <option value="announcement">Announcement</option>
              </select>
              <input className="form-input" style={{ width: 140 }} type="date" placeholder="From"
                value={postFilters.dateFrom} onChange={e => setPostFilters({ ...postFilters, dateFrom: e.target.value })} />
              <input className="form-input" style={{ width: 140 }} type="date" placeholder="To"
                value={postFilters.dateTo} onChange={e => setPostFilters({ ...postFilters, dateTo: e.target.value })} />
              <input className="form-input" style={{ width: 120 }} placeholder="Tag"
                value={postFilters.tag} onChange={e => setPostFilters({ ...postFilters, tag: e.target.value })} />
              <button className="btn btn-primary" onClick={searchPosts}>Search</button>
            </div>
          </div>
          {postResults.map(post => (
            <PostCard key={post._id} post={post} currentUserId={user._id} />
          ))}
        </div>
      )}

      {/* === jQuery Ajax user search === */}
      {tab === 'users' && (
        <div>
          <div className="card">
            <h3 style={{ marginBottom: 12 }}>Live User Search (jQuery + Ajax)</h3>
            <div className="search-bar-container">
              <input ref={jqueryInputRef} className="form-input" placeholder="Start typing a name..." />
              <div ref={jqueryResultsRef} className="search-results-dropdown"></div>
            </div>
            <p className="text-muted" style={{ fontSize: 12 }}>
              This search uses jQuery $.ajax() — see SearchPage.jsx useEffect for the code.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchPage;
