import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import PostCard from '../components/common/PostCard';
import PostForm from '../components/common/PostForm';
import { useToast } from '../components/common/Toast';
import { useConfirm } from '../components/common/ConfirmDialog';

function GroupDetailPage({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState('');
  const [approveLoading, setApproveLoading] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadGroup = async () => {
    try {
      const res = await API.get(`/groups/${id}`);
      setGroup(res.data);
      setEditForm({ name: res.data.name, description: res.data.description, subject: res.data.subject });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load group');
    }
  };

  const loadPosts = async () => {
    try {
      const res = await API.get(`/posts/group/${id}`);
      setPosts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { loadGroup(); loadPosts(); }, [id]);

  const isAdmin = group?.admin?._id === user._id;
  const isMember = group?.members?.some(m => m._id === user._id);

  const handleApprove = async (userId) => {
    setApproveLoading(userId);
    try {
      await API.post(`/groups/${id}/approve`, { userId });
      toast('Member approved', 'success');
      loadGroup();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed', 'error');
    }
    setApproveLoading(null);
  };

  const handleLeave = async () => {
    if (!await confirm('Leave this group?', 'Leave Group')) return;
    setActionLoading(true);
    try {
      await API.post(`/groups/${id}/leave`);
      navigate('/groups');
    } catch (err) {
      toast(err.response?.data?.error || 'Failed', 'error');
    }
    setActionLoading(false);
  };

  const handleDelete = async () => {
    if (!await confirm('Delete this group? This cannot be undone.', 'Delete Group')) return;
    setActionLoading(true);
    try {
      await API.delete(`/groups/${id}`);
      navigate('/groups');
    } catch (err) {
      toast(err.response?.data?.error || 'Failed', 'error');
    }
    setActionLoading(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/groups/${id}`, editForm);
      setEditing(false);
      toast('Group updated', 'success');
      loadGroup();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed', 'error');
    }
  };

  if (error) return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
      </div>
      <div className="empty-state-title" style={{ color: 'var(--error)' }}>{error}</div>
    </div>
  );

  if (!group) return (
    <div>
      <div className="skeleton-card" style={{ height: 120 }}>
        <div className="skeleton skeleton-text" style={{ width: '40%', height: 24 }} />
        <div className="skeleton skeleton-text" style={{ marginTop: 16 }} />
        <div className="skeleton skeleton-text" style={{ width: '60%' }} />
      </div>
    </div>
  );

  return (
    <div>
      {/* Group header */}
      <div className="card">
        {editing ? (
          <form onSubmit={handleUpdate}>
            <div className="form-group">
              <label htmlFor="ge-name">Name</label>
              <input id="ge-name" className="form-input" value={editForm.name}
                onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="ge-desc">Description</label>
              <textarea id="ge-desc" className="form-input" value={editForm.description}
                onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <button className="btn btn-primary btn-small" type="submit">Save</button>
              <button className="btn btn-secondary btn-small" type="button" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex-between" style={{ marginBottom: 'var(--space-3)' }}>
              <div className="flex items-center gap-3">
                <h1 className="page-title" style={{ marginBottom: 0 }}>{group.name}</h1>
                {group.isPrivate && (
                  <span className="private-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                    Private
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {isAdmin && (
                  <button className="btn btn-small btn-secondary" onClick={() => setEditing(true)} aria-label="Edit group">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Edit
                  </button>
                )}
                {isAdmin && (
                  <button className="btn btn-small btn-danger" onClick={handleDelete} disabled={actionLoading}>
                    {actionLoading ? <><span className="btn-spinner" /> Deleting...</> : 'Delete'}
                  </button>
                )}
                {isMember && !isAdmin && (
                  <button className="btn btn-small btn-outline" onClick={handleLeave} disabled={actionLoading}>
                    {actionLoading ? <><span className="btn-spinner" /> Leaving...</> : 'Leave'}
                  </button>
                )}
              </div>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{group.description}</p>
            <div className="group-card-meta" style={{ marginTop: 'var(--space-3)' }}>
              {group.subject && <span>{group.subject}</span>}
              <span>Year {group.year}</span>
              <span>Semester {group.semester}</span>
              <span>{group.isPrivate ? 'Private' : 'Public'}</span>
            </div>
          </>
        )}
      </div>

      {/* Pending requests (admin only) */}
      {isAdmin && group.pendingRequests?.length > 0 && (
        <div className="card">
          <h2 className="section-title" style={{ marginBottom: 'var(--space-3)' }}>
            Pending Requests
            <span className="section-count" style={{ marginLeft: 'var(--space-2)' }}>{group.pendingRequests.length}</span>
          </h2>
          {group.pendingRequests.map(u => (
            <div key={u._id} className="flex-between" style={{ padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border-light)' }}>
              <div className="flex items-center gap-2">
                <div className="avatar avatar-sm">{u.name?.charAt(0) || '?'}</div>
                <span style={{ fontSize: 'var(--text-sm)' }}>{u.name} <span style={{ color: 'var(--text-tertiary)' }}>({u.email})</span></span>
              </div>
              <button className="btn btn-primary btn-small" onClick={() => handleApprove(u._id)} disabled={approveLoading === u._id}>
                {approveLoading === u._id ? <><span className="btn-spinner" /> Approving...</> : 'Approve'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Members */}
      <div className="card">
        <h2 className="section-title" style={{ marginBottom: 'var(--space-3)' }}>
          Members <span className="section-count">{group.members?.length}</span>
        </h2>
        <div className="flex gap-2 flex-wrap">
          {group.members?.map(m => (
            <Link key={m._id} to={`/profile/${m._id}`} className="member-chip">
              <div className="avatar avatar-sm" style={{ width: 22, height: 22, fontSize: 10 }}>
                {m.name?.charAt(0) || '?'}
              </div>
              {m.name}
              {m._id === group.admin?._id && <span style={{ color: 'var(--accent)', fontSize: 'var(--text-xs)' }}>(admin)</span>}
            </Link>
          ))}
        </div>
      </div>

      {/* Posts */}
      {isMember && <PostForm groupId={id} onCreated={loadPosts} />}
      {posts.length === 0 && isMember && (
        <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
          <div className="empty-state-text">No posts yet in this group. Start the conversation!</div>
        </div>
      )}
      {posts.map(post => (
        <PostCard key={post._id} post={post} currentUserId={user._id}
          onUpdate={loadPosts} onDelete={loadPosts} />
      ))}
    </div>
  );
}

export default GroupDetailPage;
