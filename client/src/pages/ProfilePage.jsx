import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../api/axios';
import PostCard from '../components/common/PostCard';

function ProfilePage({ currentUser }) {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const canvasRef = useRef(null);

  const isOwnProfile = id === currentUser._id;
  const isFriend = currentUser.friends?.includes(id);

  const loadProfile = async () => {
    try {
      const res = await API.get(`/users/${id}`);
      setProfile(res.data);
      setEditForm({ name: res.data.name, department: res.data.department, year: res.data.year });
    } catch (err) {
      console.error(err);
    }
  };

  const loadPosts = async () => {
    if (!isOwnProfile) return; // only show own posts on own profile
    try {
      const res = await API.get('/posts/my');
      setPosts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { loadProfile(); loadPosts(); }, [id]);

  // --- Canvas: draw a simple profile banner (React Canvas requirement) ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !profile) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // gradient background
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#1a1a2e');
    grad.addColorStop(0.5, '#16213e');
    grad.addColorStop(1, '#e94560');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // decorative circles
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.arc(80 + i * 120, 50 + Math.sin(i) * 20, 30 + i * 5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${0.04 + i * 0.01})`;
      ctx.fill();
    }

    // user initial (big letter)
    const initial = profile.name?.charAt(0)?.toUpperCase() || '?';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px Rubik, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(initial, 80, 80);

    // user name
    ctx.font = '24px Rubik, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(profile.name, 140, 60);

    // department + year
    ctx.font = '14px Rubik, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(`${profile.department || 'No department'} · Year ${profile.year}`, 140, 85);
  }, [profile]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/users/${id}`, editForm);
      setEditing(false);
      loadProfile();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  const handleAddFriend = async () => {
    try {
      await API.post(`/users/${currentUser._id}/friend`, { friendId: id });
      alert('Friend added!');
      loadProfile();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  const handleRemoveFriend = async () => {
    try {
      await API.delete(`/users/${currentUser._id}/friend`, { data: { friendId: id } });
      alert('Friend removed');
      loadProfile();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Delete your account? This cannot be undone.')) return;
    try {
      await API.delete(`/users/${id}`);
      localStorage.clear();
      window.location.href = '/login';
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  if (!profile) return <p className="text-muted">Loading...</p>;

  return (
    <div>
      {/* Canvas banner — React Canvas requirement */}
      <canvas ref={canvasRef} width={700} height={110} className="profile-canvas" />

      <div className="card">
        {editing ? (
          <form onSubmit={handleUpdate}>
            <div className="form-group">
              <label>Name</label>
              <input className="form-input" value={editForm.name}
                onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Department</label>
              <input className="form-input" value={editForm.department}
                onChange={e => setEditForm({ ...editForm, department: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Year</label>
              <select className="form-input" value={editForm.year}
                onChange={e => setEditForm({ ...editForm, year: Number(e.target.value) })}>
                {[1,2,3,4,5,6].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="flex gap-8">
              <button className="btn btn-primary btn-small" type="submit">Save</button>
              <button className="btn btn-small" type="button" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <>
            <h2>{profile.name}</h2>
            <p className="text-muted">{profile.email}</p>
            <p style={{ fontSize: 14 }}>{profile.department || 'No department'} · Year {profile.year}</p>
            <div className="flex gap-8 mt-10">
              {isOwnProfile && <button className="btn btn-secondary btn-small" onClick={() => setEditing(true)}>Edit Profile</button>}
              {isOwnProfile && <button className="btn btn-danger btn-small" onClick={handleDeleteAccount}>Delete Account</button>}
              {!isOwnProfile && !isFriend && <button className="btn btn-primary btn-small" onClick={handleAddFriend}>Add Friend</button>}
              {!isOwnProfile && isFriend && <button className="btn btn-outline btn-small" onClick={handleRemoveFriend}>Remove Friend</button>}
              {!isOwnProfile && <Link to={`/chat/${id}`} className="btn btn-secondary btn-small">Chat</Link>}
            </div>
          </>
        )}
      </div>

      {/* Friends list */}
      <div className="card">
        <h3>Friends ({profile.friends?.length || 0})</h3>
        <div className="flex gap-8 mt-10" style={{ flexWrap: 'wrap' }}>
          {profile.friends?.map(f => (
            <Link key={f._id} to={`/profile/${f._id}`}
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: '#f5f5f5', borderRadius: 20, fontSize: 13 }}>
              <div className="avatar" style={{ width: 24, height: 24, fontSize: 11 }}>{f.name?.charAt(0)}</div>
              {f.name}
            </Link>
          ))}
          {(!profile.friends || profile.friends.length === 0) && <p className="text-muted">No friends yet</p>}
        </div>
      </div>

      {/* Own posts */}
      {isOwnProfile && (
        <>
          <h2 className="mt-20" style={{ marginBottom: 12 }}>My Posts ({posts.length})</h2>
          {posts.map(post => (
            <PostCard key={post._id} post={post} currentUserId={currentUser._id}
              onUpdate={loadPosts} onDelete={loadPosts} />
          ))}
        </>
      )}
    </div>
  );
}

export default ProfilePage;
