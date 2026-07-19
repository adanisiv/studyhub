import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import PostCard from '../components/common/PostCard';
import { useLanguage } from '../contexts/LanguageContext';

function SearchPage({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const urlParams = new URLSearchParams(location.search);
  const urlTab = urlParams.get('tab');
  const urlTag = urlParams.get('tag') || '';
  const initialTab = ['groups', 'posts', 'users'].includes(urlTab) ? urlTab : 'groups';

  // useState: which tab is active ('groups' | 'posts' | 'users')
  const [tab, setTab] = useState(initialTab);
  // useState: the values typed into the group search filters
  // Four optional filter fields — only non-empty ones are sent as query params
  const [groupFilters, setGroupFilters] = useState({ name: '', year: '', semester: '', department: '' });
  const [groupResults, setGroupResults] = useState([]); // useState — the groups returned by the last search
  const [groupSearched, setGroupSearched] = useState(false); // useState — has the user searched yet?

  // Collect only non-empty filters and call GET /api/groups/search
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
  // useState: the values typed into the post search filters. Five optional filter
  // fields for post search. Pre-fill 'tag' from URL.
  const [postFilters, setPostFilters] = useState({ keyword: '', type: '', dateFrom: '', dateTo: '', tag: urlTag });
  const [postResults, setPostResults] = useState([]); // useState — the posts returned by the last search
  const [postSearched, setPostSearched] = useState(false); // useState — has the user searched yet?

  // useEffect: runs once on mount (empty deps). Auto-runs the post search when
  // the URL has a tag param (e.g. clicked a hashtag elsewhere in the app).
  // Auto-run the post search when the URL has a tag param (clicked hashtag flow).
  // Intentionally fires only on mount — query params don't change without remounting.
  useEffect(() => {
    if (urlTag && initialTab === 'posts') {
      const timer = setTimeout(() => searchPosts(), 0);
      return () => clearTimeout(timer);
    }
  }, []); // eslint-disable-line

  // Collect only non-empty filters and call GET /api/posts/search
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
  // useRef x2: direct pointers to the DOM elements that jQuery needs.
  // We don't use React state here because jQuery manages these elements directly.
  const jqueryInputRef = useRef(null);
  const jqueryResultsRef = useRef(null);

  // useEffect: runs every time `tab` changes. Wires up all the jQuery event
  // listeners (keyup search, click-to-navigate) on the Find People input.
  useEffect(() => {
    // jQuery is loaded globally in index.html as window.jQuery
    const $ = window.jQuery;
    if (!$ || !jqueryInputRef.current) return;

    const $input = $(jqueryInputRef.current);
    const $results = $(jqueryResultsRef.current);
    // Read the JWT from localStorage for the Authorization header
    const token = localStorage.getItem('token');

    // 'keyup' fires after every keystroke in the search input
    $input.on('keyup', function () {
      const val = $(this).val().trim();
      // Require at least 2 characters to start searching (avoid empty/trivial searches)
      if (val.length < 2) {
        $results.slideUp(200).empty(); // hide and clear the dropdown
        return;
      }
      // AJAX call to GET /api/users/search?name=...
      $.ajax({
        url: `http://localhost:5000/api/users/search?name=${encodeURIComponent(val)}`,
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }, // send JWT so the server recognizes us
        success: function (data) {
          $results.empty(); // clear previous results before adding new ones
          if (data.length === 0) {
            // No users found: show a "not found" message
            $results.append('<div class="search-result-item" style="color:var(--text-tertiary)">' + t('noUsersFound') + '</div>');
          } else {
            // Build an item for each user using jQuery DOM creation (not innerHTML)
            // This avoids XSS — jQuery's .text() escapes user content automatically
            data.forEach(function (u) {
              var $item = $('<div class="search-result-item"></div>').attr('data-id', u._id);
              $item.append($('<strong></strong>').text(u.name));
              $item.append($('<span style="color:var(--text-tertiary); margin-left:8px"></span>').text((u.department || 'N/A') + ' · Year ' + u.year));
              $results.append($item);
            });
          }
          $results.slideDown(200); // animate dropdown open
        },
        error: function () {
          $results.slideUp(200); // hide dropdown on error
        }
      });
    });

    // Clicking a result item navigates to that user's profile via React Router
    // (avoids a full page reload so JWT state and dark mode stay intact).
    // We use mousedown instead of click so it fires BEFORE the blur handler
    // hides the dropdown — preventing the race that sent users to '/' instead.
    $results.on('mousedown', '.search-result-item', function (e) {
      e.preventDefault();
      const id = $(this).attr('data-id');
      if (id) {
        $results.slideUp(200);
        navigate(`/profile/${id}`);
      }
    });

    // When the input loses focus, hide the dropdown after a short delay
    // The delay allows click events on results to fire before the dropdown closes
    $input.on('blur', function () {
      setTimeout(() => $results.slideUp(200), 200);
    });

    // Cleanup: remove all jQuery event listeners when the tab changes or component unmounts
    return () => { $input.off(); $results.off(); };
  }, [tab]); // re-run when tab changes so jQuery rebinds to the correct DOM elements

  return (
    <div>
      <h1 className="page-title">{t('searchTitle')}</h1>

      <div className="search-tabs" role="tablist" aria-label="Search categories">
        <button className={`search-tab ${tab === 'groups' ? 'active' : ''}`}
          onClick={() => setTab('groups')} role="tab" aria-selected={tab === 'groups'}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline', verticalAlign: -2 }} aria-hidden="true"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          {' '}{t('groups')}
        </button>
        <button className={`search-tab ${tab === 'posts' ? 'active' : ''}`}
          onClick={() => setTab('posts')} role="tab" aria-selected={tab === 'posts'}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline', verticalAlign: -2 }} aria-hidden="true"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
          {' '}{t('posts')}
        </button>
        <button className={`search-tab ${tab === 'users' ? 'active' : ''}`}
          onClick={() => setTab('users')} role="tab" aria-selected={tab === 'users'}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline', verticalAlign: -2 }} aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          {' '}{t('findPeople')}
        </button>
      </div>

      {/* ── Groups tab ───────────────────────────────────────────────────── */}
      {tab === 'groups' && (
        <div role="tabpanel">
          <div className="card">
            <h2 className="section-title" style={{ marginBottom: 'var(--space-3)' }}>{t('searchGroups')}</h2>
            <div className="flex gap-2 flex-wrap">
              <label htmlFor="sg-name" className="sr-only">{t('groupName')}</label>
              <input id="sg-name" className="form-input" style={{ flex: 1, minWidth: 150 }} placeholder={t('groupName')}
                value={groupFilters.name} onChange={e => setGroupFilters({ ...groupFilters, name: e.target.value })} />
              <label htmlFor="sg-year" className="sr-only">{t('year')}</label>
              <select id="sg-year" className="form-input" style={{ width: 90 }} value={groupFilters.year}
                onChange={e => setGroupFilters({ ...groupFilters, year: e.target.value })}>
                <option value="">{t('year')}</option>
                {[1,2,3,4].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <label htmlFor="sg-sem" className="sr-only">{t('semester')}</label>
              <select id="sg-sem" className="form-input" style={{ width: 110 }} value={groupFilters.semester}
                onChange={e => setGroupFilters({ ...groupFilters, semester: e.target.value })}>
                <option value="">{t('semester')}</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="Summer">{t('semesterSummer')}</option>
              </select>
              <label htmlFor="sg-dept" className="sr-only">{t('department')}</label>
              <input id="sg-dept" className="form-input" style={{ flex: 1, minWidth: 150 }} placeholder={t('department')}
                value={groupFilters.department} onChange={e => setGroupFilters({ ...groupFilters, department: e.target.value })} />
              <button className="btn btn-primary" onClick={searchGroups}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                {t('search')}
              </button>
            </div>
          </div>
          {groupSearched && groupResults.length === 0 && (
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
              <div className="empty-state-text">{t('noGroupsFound')}</div>
            </div>
          )}
          {/* Render each matching group as a card */}
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

      {/* ── Posts tab ────────────────────────────────────────────────────── */}
      {tab === 'posts' && (
        <div role="tabpanel">
          <div className="card">
            <h2 className="section-title" style={{ marginBottom: 'var(--space-3)' }}>{t('searchPosts')}</h2>
            <div className="flex gap-2 flex-wrap">
              <label htmlFor="sp-keyword" className="sr-only">{t('keyword')}</label>
              <input id="sp-keyword" className="form-input" style={{ flex: 1, minWidth: 150 }} placeholder={t('keyword')}
                value={postFilters.keyword} onChange={e => setPostFilters({ ...postFilters, keyword: e.target.value })} />
              <label htmlFor="sp-type" className="sr-only">{t('postTypes')}</label>
              <select id="sp-type" className="form-input" style={{ width: 130 }} value={postFilters.type}
                onChange={e => setPostFilters({ ...postFilters, type: e.target.value })}>
                <option value="">{t('allTypes')}</option>
                <option value="question">{t('questions')}</option>
                <option value="material">{t('studyMaterials')}</option>
                <option value="announcement">{t('announcements')}</option>
              </select>
              <label htmlFor="sp-from" className="sr-only">{t('dateFrom')}</label>
              <input id="sp-from" className="form-input" style={{ width: 140 }} type="date"
                value={postFilters.dateFrom} onChange={e => setPostFilters({ ...postFilters, dateFrom: e.target.value })} />
              <label htmlFor="sp-to" className="sr-only">{t('dateTo')}</label>
              <input id="sp-to" className="form-input" style={{ width: 140 }} type="date"
                value={postFilters.dateTo} onChange={e => setPostFilters({ ...postFilters, dateTo: e.target.value })} />
              <label htmlFor="sp-tag" className="sr-only">{t('tag')}</label>
              <input id="sp-tag" className="form-input" style={{ width: 110 }} placeholder={t('tag')}
                value={postFilters.tag} onChange={e => setPostFilters({ ...postFilters, tag: e.target.value })} />
              <button className="btn btn-primary" onClick={searchPosts}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                {t('search')}
              </button>
            </div>
          </div>
          {postSearched && postResults.length === 0 && (
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
              <div className="empty-state-text">{t('noPostsFound')}</div>
            </div>
          )}
          {/* Render each matching post using the shared PostCard component */}
          {postResults.map(post => (
            <PostCard key={post._id} post={post} currentUserId={user._id} />
          ))}
        </div>
      )}

      {/* ── Users tab (jQuery Ajax live search) ─────────────────────────── */}
      {tab === 'users' && (
        <div role="tabpanel">
          <div className="card">
            <h2 className="section-title" style={{ marginBottom: 'var(--space-3)' }}>{t('findPeople')}</h2>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-3)' }}>
              {t('typeAtLeast2')}
            </p>
            <div className="search-bar-container">
              <label htmlFor="user-search" className="sr-only">{t('search')}</label>
              <input ref={jqueryInputRef} id="user-search" className="form-input" placeholder={t('startTyping')} />
              {/* jqueryResultsRef is the dropdown container that jQuery populates */}
              <div ref={jqueryResultsRef} className="search-results-dropdown"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchPage;
