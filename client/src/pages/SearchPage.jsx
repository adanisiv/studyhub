import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import PostCard from '../components/common/PostCard';

function SearchPage({ user }) {
  const [tab, setTab] = useState('groups');

  // --- Group search ---
  const [groupFilters, setGroupFilters] = useState({ name: '', year: '', semester: '', department: '' });
  const [groupResults, setGroupResults] = useState([]);
  const [groupSearched, setGroupSearched] = useState(false);

  const searchGroups = async () => {
    const params = {};
    if (groupFilters.name) params.name = groupFilters.name;
    if (groupFilters.year) params.year = groupFilters.year;
    if (groupFilters.semester) params.semester = groupFilters.semester;
    if (groupFilters.department) params.department = groupFilters.department;
    try {
      const res = await API.get('/groups/search', { params });
      setGroupResults(res.data);
      setGroupSearched(true);
    } catch (err) {
      console.error(err);
    }
  };

  // --- Post search ---
  const [postFilters, setPostFilters] = useState({ keyword: '', type: '', dateFrom: '', dateTo: '', tag: '' });
  const [postResults, setPostResults] = useState([]);
  const [postSearched, setPostSearched] = useState(false);

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
      setPostSearched(true);
    } catch (err) {
      console.error(err);
    }
  };

  // --- jQuery Ajax live user search (course requirement) ---
  const jqueryInputRef = useRef(null);
  const jqueryResultsRef = useRef(null);

  useEffect(() => {
    const $ = window.jQuery;
    if (!$ || !jqueryInputRef.current) return;

    const $input = $(jqueryInputRef.current);
    const $results = $(jqueryResultsRef.current);
    const token = localStorage.getItem('token');

    $input.on('keyup', function () {
      const val = $(this).val().trim();
      if (val.length < 2) {
        $results.slideUp(200).empty();
        return;
      }
      $.ajax({
        url: `http://localhost:5000/api/users/search?name=${encodeURIComponent(val)}`,
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
        success: function (data) {
          $results.empty();
          if (data.length === 0) {
            $results.append('<div class="search-result-item" style="color:var(--text-tertiary)">No users found</div>');
          } else {
            data.forEach(function (u) {
              var $item = $('<div class="search-result-item"></div>').attr('data-id', u._id);
              $item.append($('<strong></strong>').text(u.name));
              $item.append($('<span style="color:var(--text-tertiary); margin-left:8px"></span>').text((u.department || 'N/A') + ' · Year ' + u.year));
              $results.append($item);
            });
          }
          $results.slideDown(200);
        },
        error: function () {
          $results.slideUp(200);
        }
      });
    });

    $results.on('click', '.search-result-item', function () {
      const id = $(this).data('id');
      if (id) window.location.href = `/profile/${id}`;
    });

    $input.on('blur', function () {
      setTimeout(() => $results.slideUp(200), 200);
    });

    return () => { $input.off(); $results.off(); };
  }, [tab]);

  return (
    <div>
      <h1 className="page-title">Search</h1>

      {/* Tab buttons */}
      <div className="search-tabs" role="tablist" aria-label="Search categories">
        <button className={`search-tab ${tab === 'groups' ? 'active' : ''}`}
          onClick={() => setTab('groups')} role="tab" aria-selected={tab === 'groups'}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline', verticalAlign: -2 }} aria-hidden="true"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          {' '}Groups
        </button>
        <button className={`search-tab ${tab === 'posts' ? 'active' : ''}`}
          onClick={() => setTab('posts')} role="tab" aria-selected={tab === 'posts'}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline', verticalAlign: -2 }} aria-hidden="true"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
          {' '}Posts
        </button>
        <button className={`search-tab ${tab === 'users' ? 'active' : ''}`}
          onClick={() => setTab('users')} role="tab" aria-selected={tab === 'users'}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline', verticalAlign: -2 }} aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          {' '}People
        </button>
      </div>

      {/* === Group search === */}
      {tab === 'groups' && (
        <div role="tabpanel">
          <div className="card">
            <h2 className="section-title" style={{ marginBottom: 'var(--space-3)' }}>Search Groups</h2>
            <div className="flex gap-2 flex-wrap">
              <label htmlFor="sg-name" className="sr-only">Group name</label>
              <input id="sg-name" className="form-input" style={{ flex: 1, minWidth: 150 }} placeholder="Group name"
                value={groupFilters.name} onChange={e => setGroupFilters({ ...groupFilters, name: e.target.value })} />
              <label htmlFor="sg-year" className="sr-only">Year</label>
              <select id="sg-year" className="form-input" style={{ width: 90 }} value={groupFilters.year}
                onChange={e => setGroupFilters({ ...groupFilters, year: e.target.value })}>
                <option value="">Year</option>
                {[1,2,3,4].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <label htmlFor="sg-sem" className="sr-only">Semester</label>
              <select id="sg-sem" className="form-input" style={{ width: 110 }} value={groupFilters.semester}
                onChange={e => setGroupFilters({ ...groupFilters, semester: e.target.value })}>
                <option value="">Semester</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="Summer">Summer</option>
              </select>
              <label htmlFor="sg-dept" className="sr-only">Department</label>
              <input id="sg-dept" className="form-input" style={{ flex: 1, minWidth: 150 }} placeholder="Department"
                value={groupFilters.department} onChange={e => setGroupFilters({ ...groupFilters, department: e.target.value })} />
              <button className="btn btn-primary" onClick={searchGroups}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                Search
              </button>
            </div>
          </div>
          {groupSearched && groupResults.length === 0 && (
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
              <div className="empty-state-text">No groups found matching your criteria</div>
            </div>
          )}
          {groupResults.map(g => (
            <div key={g._id} className="group-card">
              <Link to={`/groups/${g._id}`} className="group-card-name">{g.name}</Link>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 'var(--space-1) 0' }}>{g.description}</p>
              <div className="group-card-meta">
                {g.subject && <span>{g.subject}</span>}
                <span>Year {g.year}</span>
                <span>Sem {g.semester}</span>
                {g.department && <span>{g.department}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* === Post search === */}
      {tab === 'posts' && (
        <div role="tabpanel">
          <div className="card">
            <h2 className="section-title" style={{ marginBottom: 'var(--space-3)' }}>Search Posts</h2>
            <div className="flex gap-2 flex-wrap">
              <label htmlFor="sp-keyword" className="sr-only">Keyword</label>
              <input id="sp-keyword" className="form-input" style={{ flex: 1, minWidth: 150 }} placeholder="Keyword"
                value={postFilters.keyword} onChange={e => setPostFilters({ ...postFilters, keyword: e.target.value })} />
              <label htmlFor="sp-type" className="sr-only">Post type</label>
              <select id="sp-type" className="form-input" style={{ width: 130 }} value={postFilters.type}
                onChange={e => setPostFilters({ ...postFilters, type: e.target.value })}>
                <option value="">All types</option>
                <option value="question">Question</option>
                <option value="material">Material</option>
                <option value="announcement">Announcement</option>
              </select>
              <label htmlFor="sp-from" className="sr-only">Date from</label>
              <input id="sp-from" className="form-input" style={{ width: 140 }} type="date"
                value={postFilters.dateFrom} onChange={e => setPostFilters({ ...postFilters, dateFrom: e.target.value })} />
              <label htmlFor="sp-to" className="sr-only">Date to</label>
              <input id="sp-to" className="form-input" style={{ width: 140 }} type="date"
                value={postFilters.dateTo} onChange={e => setPostFilters({ ...postFilters, dateTo: e.target.value })} />
              <label htmlFor="sp-tag" className="sr-only">Tag</label>
              <input id="sp-tag" className="form-input" style={{ width: 110 }} placeholder="Tag"
                value={postFilters.tag} onChange={e => setPostFilters({ ...postFilters, tag: e.target.value })} />
              <button className="btn btn-primary" onClick={searchPosts}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                Search
              </button>
            </div>
          </div>
          {postSearched && postResults.length === 0 && (
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
              <div className="empty-state-text">No posts found matching your criteria</div>
            </div>
          )}
          {postResults.map(post => (
            <PostCard key={post._id} post={post} currentUserId={user._id} />
          ))}
        </div>
      )}

      {/* === jQuery Ajax user search === */}
      {tab === 'users' && (
        <div role="tabpanel">
          <div className="card">
            <h2 className="section-title" style={{ marginBottom: 'var(--space-3)' }}>Find People</h2>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-3)' }}>
              Type at least 2 characters to search
            </p>
            <div className="search-bar-container">
              <label htmlFor="user-search" className="sr-only">Search by name</label>
              <input ref={jqueryInputRef} id="user-search" className="form-input" placeholder="Start typing a name..." />
              <div ref={jqueryResultsRef} className="search-results-dropdown"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchPage;
