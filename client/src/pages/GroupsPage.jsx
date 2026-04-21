import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';

function GroupsPage({ user }) {
  const [groups, setGroups] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', subject: '', year: 1, semester: 'A', department: '', isPrivate: false });
  const [error, setError] = useState('');

  const loadGroups = async () => {
    try {
      const res = await API.get('/groups');
      setGroups(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { loadGroups(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await API.post('/groups', form);
      setShowForm(false);
      setForm({ name: '', description: '', subject: '', year: 1, semester: 'A', department: '', isPrivate: false });
      loadGroups();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create group');
    }
  };

  const handleJoin = async (groupId) => {
    try {
      const res = await API.post(`/groups/${groupId}/join`);
      alert(res.data.message);
      loadGroups();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to join');
    }
  };

  return (
    <div>
      <div className="flex-between mb-10">
        <h1 className="page-title" style={{ marginBottom: 0 }}>Groups</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Create Group'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Group Name</label>
              <input className="form-input" value={form.name} required
                onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea className="form-input" value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex gap-8">
              <div className="form-group" style={{ flex: 1 }}>
                <label>Subject</label>
                <input className="form-input" value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Year</label>
                <select className="form-input" value={form.year}
                  onChange={e => setForm({ ...form, year: Number(e.target.value) })}>
                  {[1,2,3,4,5,6].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Semester</label>
                <select className="form-input" value={form.semester}
                  onChange={e => setForm({ ...form, semester: e.target.value })}>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="Summer">Summer</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Department</label>
              <input className="form-input" value={form.department}
                onChange={e => setForm({ ...form, department: e.target.value })} />
            </div>
            <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={form.isPrivate}
                onChange={e => setForm({ ...form, isPrivate: e.target.checked })} />
              Private group (requires approval to join)
            </label>
            {error && <p className="error-text">{error}</p>}
            <button className="btn btn-primary mt-10" type="submit">Create</button>
          </form>
        </div>
      )}

      {/* CSS3: multiple-columns layout */}
      <div className="columns-layout">
        {groups.map(group => {
          const isMember = group.members?.some(m => (m._id || m) === user._id);
          return (
            <div key={group._id} className="card" style={{ breakInside: 'avoid' }}>
              <div className="flex-between">
                <Link to={`/groups/${group._id}`} style={{ fontWeight: 700, fontSize: 16, textDecoration: 'none', color: '#1a1a2e' }}>
                  {group.name}
                </Link>
                {group.isPrivate && <span className="tag">🔒 Private</span>}
              </div>
              <p className="text-muted" style={{ margin: '6px 0' }}>{group.description}</p>
              <p style={{ fontSize: 13 }}>
                {group.subject} · Year {group.year} · Sem {group.semester} · {group.members?.length || 0} members
              </p>
              {!isMember && (
                <button className="btn btn-secondary btn-small mt-10" onClick={() => handleJoin(group._id)}>
                  Join
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default GroupsPage;
