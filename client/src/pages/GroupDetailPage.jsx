import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import PostCard from '../components/common/PostCard';
import PostForm from '../components/common/PostForm';

function GroupDetailPage({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState('');

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
    try {
      await API.post(`/groups/${id}/approve`, { userId });
      loadGroup();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Leave this group?')) return;
    try {
      await API.post(`/groups/${id}/leave`);
      navigate('/groups');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this group? This cannot be undone.')) return;
    try {
      await API.delete(`/groups/${id}`);
      navigate('/groups');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/groups/${id}`, editForm);
      setEditing(false);
      loadGroup();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  if (error) return <p className="error-text">{error}</p>;
  if (!group) return <p className="text-muted">Loading...</p>;

  return (
    <div>
      {/* Group header */}
      <div className="card">
        {editing ? (
          <form onSubmit={handleUpdate}>
            <div className="form-group">
              <label>Name</label>
              <input className="form-input" value={editForm.name}
                onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea className="form-input" value={editForm.description}
                onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
            </div>
            <div className="flex gap-8">
              <button className="btn btn-primary btn-small" type="submit">Save</button>
              <button className="btn btn-small" type="button" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex-between">
              <h1 className="page-title" style={{ marginBottom: 0 }}>{group.name}</h1>
              <div className="flex gap-8">
                {isAdmin && <button className="btn btn-small btn-secondary" onClick={() => setEditing(true)}>Edit</button>}
                {isAdmin && <button className="btn btn-small btn-danger" onClick={handleDelete}>Delete</button>}
                {isMember && !isAdmin && <button className="btn btn-small btn-outline" onClick={handleLeave}>Leave</button>}
              </div>
            </div>
            <p className="text-muted mt-10">{group.description}</p>
            <p style={{ fontSize: 13, marginTop: 6 }}>
              {group.subject} · Year {group.year} · Semester {group.semester} · {group.isPrivate ? '🔒 Private' : '🌐 Public'}
            </p>
          </>
        )}
      </div>

      {/* Pending requests (admin only) */}
      {isAdmin && group.pendingRequests?.length > 0 && (
        <div className="card">
          <h3>Pending Requests</h3>
          {group.pendingRequests.map(u => (
            <div key={u._id} className="flex-between" style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
              <span>{u.name} ({u.email})</span>
              <button className="btn btn-primary btn-small" onClick={() => handleApprove(u._id)}>Approve</button>
            </div>
          ))}
        </div>
      )}

      {/* Members */}
      <div className="card">
        <h3>Members ({group.members?.length})</h3>
        <div className="flex gap-8 mt-10" style={{ flexWrap: 'wrap' }}>
          {group.members?.map(m => (
            <Link key={m._id} to={`/profile/${m._id}`}
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: '#f5f5f5', borderRadius: 20, fontSize: 13 }}>
              <div className="avatar" style={{ width: 24, height: 24, fontSize: 11 }}>
                {m.name?.charAt(0)}
              </div>
              {m.name}
              {m._id === group.admin?._id && <span style={{ color: '#e94560', fontSize: 11 }}> (admin)</span>}
            </Link>
          ))}
        </div>
      </div>

      {/* Posts */}
      {isMember && <PostForm groupId={id} onCreated={loadPosts} />}
      {posts.map(post => (
        <PostCard key={post._id} post={post} currentUserId={user._id}
          onUpdate={loadPosts} onDelete={loadPosts} />
      ))}
    </div>
  );
}

export default GroupDetailPage;
