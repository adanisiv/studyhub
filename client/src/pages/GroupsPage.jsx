import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import { useToast } from '../components/common/Toast';

function GroupsPage({ user }) {
  const [groups, setGroups] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', subject: '', year: 1, semester: 'A', department: '', isPrivate: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [joinLoading, setJoinLoading] = useState(null);
  const toast = useToast();

  const loadGroups = async () => {
    setLoading(true);
    try {
      const res = await API.get('/groups');
      setGroups(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { loadGroups(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await API.post('/groups', form);
      setShowForm(false);
      setForm({ name: '', description: '', subject: '', year: 1, semester: 'A', department: '', isPrivate: false });
      toast('Group created', 'success');
      loadGroups();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create group');
    }
  };

  const handleJoin = async (groupId) => {
    setJoinLoading(groupId);
    try {
      const res = await API.post(`/groups/${groupId}/join`);
      toast(res.data.message, 'success');
      loadGroups();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to join', 'error');
    }
    setJoinLoading(null);
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Groups</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
              Cancel
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
              New Group
            </>
          )}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ animation: 'slideDown 0.25s ease-out' }}>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label htmlFor="cg-name">Group Name</label>
              <input id="cg-name" className="form-input" value={form.name} required placeholder="e.g. Data Structures Study Group"
                onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="cg-desc">Description</label>
              <textarea id="cg-desc" className="form-input" value={form.description} placeholder="What is this group about?"
                onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 'var(--space-3)' }}>
              <div className="form-group">
                <label htmlFor="cg-subject">Subject</label>
                <input id="cg-subject" className="form-input" value={form.subject} placeholder="e.g. Algorithms"
                  onChange={e => setForm({ ...form, subject: e.target.value })} />
              </div>
              <div className="form-group">
                <label htmlFor="cg-year">Year</label>
                <select id="cg-year" className="form-input" value={form.year}
                  onChange={e => setForm({ ...form, year: Number(e.target.value) })}>
                  {[1,2,3,4,5,6].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="cg-sem">Semester</label>
                <select id="cg-sem" className="form-input" value={form.semester}
                  onChange={e => setForm({ ...form, semester: e.target.value })}>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="Summer">Summer</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="cg-dept">Department</label>
              <input id="cg-dept" className="form-input" value={form.department} placeholder="e.g. Computer Science"
                onChange={e => setForm({ ...form, department: e.target.value })} />
            </div>
            <label style={{ fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={form.isPrivate}
                onChange={e => setForm({ ...form, isPrivate: e.target.checked })} />
              Private group (requires approval to join)
            </label>
            {error && <p className="error-text" role="alert">{error}</p>}
            <div className="flex gap-2 mt-10" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" type="submit">Create Group</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
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
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
            </svg>
          </div>
          <div className="empty-state-title">No groups yet</div>
          <div className="empty-state-text">Create the first group and invite your classmates!</div>
          <button className="btn btn-primary btn-small" onClick={() => setShowForm(true)}>Create Group</button>
        </div>
      ) : (
        /* CSS3: multiple-columns layout */
        <div className="columns-layout">
          {groups.map(group => {
            const isMember = group.members?.some(m => String(m._id || m) === String(user._id));
            return (
              <div key={group._id} className="group-card">
                <div className="group-card-header">
                  <Link to={`/groups/${group._id}`} className="group-card-name">
                    {group.name}
                  </Link>
                  {group.isPrivate && (
                    <span className="private-badge">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                      Private
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 'var(--space-1) 0 var(--space-2)' }}>
                  {group.description}
                </p>
                <div className="group-card-meta">
                  {group.subject && <span>{group.subject}</span>}
                  <span>Year {group.year}</span>
                  <span>Sem {group.semester}</span>
                  <span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                    {group.members?.length || 0}
                  </span>
                </div>
                {!isMember && (
                  <button className="btn btn-outline btn-small mt-10" onClick={() => handleJoin(group._id)} disabled={joinLoading === group._id}>
                    {joinLoading === group._id ? <><span className="btn-spinner" /> Joining...</> : 'Join Group'}
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
