import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import { useToast } from '../components/common/Toast';
import { useLanguage } from '../contexts/LanguageContext';
import { useGroups, useGroupsInvalidate } from '../hooks/useGroups';

function GroupsPage({ user }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', subject: '', year: 1, semester: 'A', department: '', isPrivate: false, tags: '' });
  const [error, setError] = useState('');
  const [joinLoading, setJoinLoading] = useState(null);
  const toast = useToast();
  const { data: groups = [], isLoading: loading } = useGroups();
  const invalidateGroups = useGroupsInvalidate();
  const { t } = useLanguage();

  // Sends form data to POST /api/groups.
  // On success: hides form, resets fields, shows toast, reloads list.
  // On error: shows the server error message below the form.
  const handleCreate = async (e) => {
    e.preventDefault(); // prevent browser default form submission (page reload)
    setError('');
    try {
      // Split comma-separated tags into a clean array before sending
      const tagArray = form.tags
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(Boolean);
      await API.post('/groups', { ...form, tags: tagArray });
      setShowForm(false);
      setForm({ name: '', description: '', subject: '', year: 1, semester: 'A', department: '', isPrivate: false, tags: '' });
      toast('Group created', 'success');
      invalidateGroups(); // reload the list to include the new group
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create group');
    }
  };
  // Calls POST /api/groups/:id/join.
  // The server handles private vs. public automatically:
  //   Public  → user added immediately; message: "Joined group"
  //   Private → join request queued; message: "Join request sent"
  const handleJoin = async (groupId) => {
    setJoinLoading(groupId); // show spinner on only this specific button
    try {
      const res = await API.post(`/groups/${groupId}/join`);
      toast(res.data.message, 'success'); // server tells the user what happened
      loadGroups(); // reload to reflect updated membership
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to join', 'error');
    }
    setJoinLoading(null);
  };

  return (
    <div>
      {/* Page header: title on the left, New Group toggle button on the right */}
      <div className="section-header">
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>{t('groups')}</h1>
        </div>
        {/* The button shows an X icon when the form is open, a + icon when closed */}
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
              {t('cancel')}
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
              {t('newGroup')}
            </>
          )}
        </button>
      </div>

      {/* ── Group creation form ──────────────────────────────────────────── */}
      {/* Only rendered when showForm is true; animates in with slideDown */}
      {showForm && (
        <div className="card" style={{ animation: 'slideDown 0.25s ease-out' }}>
          <form onSubmit={handleCreate}>
            {/* Group name — required field */}
            <div className="form-group">
              <label htmlFor="cg-name">{t('groupNameLabel')}</label>
              <input id="cg-name" className="form-input" value={form.name} required placeholder={t('groupName')}
                onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="cg-desc">{t('groupDescription')}</label>
              <textarea id="cg-desc" className="form-input" value={form.description} placeholder={t('descriptionPlaceholder')}
                onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            {/* Subject, Year, and Semester arranged in a 3-column CSS grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 'var(--space-3)' }}>
              <div className="form-group">
                <label htmlFor="cg-subject">{t('subject')}</label>
                <input id="cg-subject" className="form-input" value={form.subject} placeholder={t('subjectPlaceholder')}
                  onChange={e => setForm({ ...form, subject: e.target.value })} />
              </div>
              <div className="form-group">
                <label htmlFor="cg-year">{t('year')}</label>
                <select id="cg-year" className="form-input" value={form.year}
                  onChange={e => setForm({ ...form, year: Number(e.target.value) })}>
                  {[1,2,3,4].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="cg-sem">{t('semester')}</label>
                <select id="cg-sem" className="form-input" value={form.semester}
                  onChange={e => setForm({ ...form, semester: e.target.value })}>
                  <option value="A">{t('semesterA')}</option>
                  <option value="B">{t('semesterB')}</option>
                  <option value="Summer">{t('semesterSummer')}</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="cg-dept">{t('department')}</label>
              <input id="cg-dept" className="form-input" value={form.department} placeholder={t('deptPlaceholder')}
                onChange={e => setForm({ ...form, department: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="cg-tags">{t('tags')}</label>
              <input id="cg-tags" className="form-input" value={form.tags}
                placeholder={t('tagsPlaceholder')}
                onChange={e => setForm({ ...form, tags: e.target.value })} />
            </div>
            <label style={{ fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={form.isPrivate}
                onChange={e => setForm({ ...form, isPrivate: e.target.checked })} />
              {t('privateGroup')}
            </label>
            {error && <p className="error-text" role="alert">{error}</p>}
            <div className="flex gap-2 mt-10" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" type="submit">{t('createGroup')}</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Group list ──────────────────────────────────────────────────── */}
      {loading ? (
        /* Skeleton cards shown while the groups API call is in flight */
        <div className="columns-layout">
          {[1,2,3,4].map(i => (
            <div key={i} className="skeleton-card" style={{ breakInside: 'avoid' }}>
              <div className="skeleton skeleton-text" style={{ width: '60%', height: 18 }} />
              <div className="skeleton skeleton-text" style={{ marginTop: 12 }} />
              <div className="skeleton skeleton-text" style={{ width: '80%' }} />
              <div className="skeleton skeleton-text" style={{ width: '40%', marginTop: 12, height: 10 }} />
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        /* Empty state: no groups exist yet — prompt the user to create one */
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
            </svg>
          </div>
          <div className="empty-state-title">{t('noGroupsYet')}</div>
          <div className="empty-state-text">{t('noGroupsDesc')}</div>
          <button className="btn btn-primary btn-small" onClick={() => setShowForm(true)}>{t('createGroup')}</button>
        </div>
      ) : (
        // CSS3 multi-column masonry layout — cards fill columns top-to-bottom automatically
        <div className="columns-layout">
          {groups.map(group => {
            // Check if the logged-in user is already a member of this group
            // Members may be stored as full objects ({_id, name}) or just IDs (strings)
            const isMember = group.members?.some(m => String(m._id || m) === String(user._id));
            return (
              <div key={group._id} className="group-card">
                <div className="group-card-header">
                  {/* Group name links to the group detail page */}
                  <Link to={`/groups/${group._id}`} className="group-card-name">
                    {group.name}
                  </Link>
                  {/* Lock icon + "Private" badge shown only for private groups */}
                  {group.isPrivate && (
                    <span className="private-badge">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                      {t('private')}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 'var(--space-1) 0 var(--space-2)' }}>
                  {group.description}
                </p>
                {/* Hashtags: each is a clickable Link to /tag/<name> */}
                {group.tags?.length > 0 && (
                  <div className="post-tags" style={{ marginBottom: 'var(--space-2)' }}>
                    {group.tags.map((tag, i) => (
                      <Link
                        key={i}
                        to={`/tag/${encodeURIComponent(tag)}`}
                        className="tag"
                        onClick={e => e.stopPropagation()}
                      >#{tag}</Link>
                    ))}
                  </div>
                )}
                {/* Metadata tags: subject, year, semester, member count */}
                <div className="group-card-meta">
                  {group.subject && <span>{group.subject}</span>}
                  <span>{t('year')} {group.year}</span>
                  <span>{t('sem')} {group.semester}</span>
                  <span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                    {group.members?.length || 0}
                  </span>
                </div>
                {/* Join button only shown to non-members; disabled and shows spinner while joining */}
                {!isMember && (
                  <button className="btn btn-outline btn-small mt-10" onClick={() => handleJoin(group._id)} disabled={joinLoading === group._id}>
                    {joinLoading === group._id ? <><span className="btn-spinner" /> {t('joining')}</> : t('joinGroup')}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default GroupsPage;
