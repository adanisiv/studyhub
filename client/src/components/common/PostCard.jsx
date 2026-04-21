import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';

function PostCard({ post, currentUserId, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [likes, setLikes] = useState(post.likes?.length || 0);
  const [liked, setLiked] = useState(post.likes?.includes(currentUserId));

  const isAuthor = post.author?._id === currentUserId;
  const initial = post.author?.name?.charAt(0)?.toUpperCase() || '?';

  const handleUpdate = async () => {
    try {
      await API.put(`/posts/${post._id}`, { content: editContent });
      setEditing(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await API.delete(`/posts/${post._id}`);
      if (onDelete) onDelete();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete');
    }
  };

  const handleLike = async () => {
    try {
      const res = await API.post(`/posts/${post._id}/like`);
      setLikes(res.data.likes);
      setLiked(res.data.liked);
    } catch (err) {
      console.error(err);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await API.post(`/posts/${post._id}/comment`, { text: commentText });
      setCommentText('');
      if (onUpdate) onUpdate();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to comment');
    }
  };

  return (
    <div className="post-card">
      {/* Header */}
      <div className="post-header">
        <div className="avatar">{initial}</div>
        <div>
          <Link to={`/profile/${post.author?._id}`} style={{ fontWeight: 700, textDecoration: 'none', color: '#1a1a2e' }}>
            {post.author?.name}
          </Link>
          <div className="post-meta">
            {new Date(post.createdAt).toLocaleDateString()}
            {post.group && <> · <Link to={`/groups/${post.group._id || post.group}`}>{post.group.name || 'Group'}</Link></>}
            {' · '}{post.type}
          </div>
        </div>
      </div>

      {/* Content */}
      {editing ? (
        <div>
          <textarea className="form-input" value={editContent} onChange={e => setEditContent(e.target.value)} />
          <div className="flex gap-8 mt-10">
            <button className="btn btn-primary btn-small" onClick={handleUpdate}>Save</button>
            <button className="btn btn-small" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <p className="post-content">{post.content}</p>
      )}

      {/* Video — React Video requirement */}
      {post.mediaType === 'video' && post.mediaUrl && (
        <video className="post-video" controls>
          <source src={post.mediaUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}

      {/* Image */}
      {post.mediaType === 'image' && post.mediaUrl && (
        <img src={post.mediaUrl} alt="Post media" style={{ width: '100%', borderRadius: 8, margin: '10px 0' }} />
      )}

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="post-tags">
          {post.tags.map((tag, i) => <span key={i} className="tag">#{tag}</span>)}
        </div>
      )}

      {/* Actions */}
      <div className="post-actions">
        <button onClick={handleLike}>
          {liked ? '❤️' : '🤍'} {likes}
        </button>
        <button onClick={() => setShowComments(!showComments)}>
          💬 {post.comments?.length || 0}
        </button>
        {isAuthor && <button onClick={() => setEditing(true)}>✏️ Edit</button>}
        {isAuthor && <button onClick={handleDelete}>🗑️ Delete</button>}
      </div>

      {/* Comments */}
      {showComments && (
        <div className="mt-10">
          {post.comments?.map((c, i) => (
            <div key={i} style={{ padding: '6px 0', borderTop: '1px solid #f0f0f0', fontSize: 13 }}>
              <strong>{c.author?.name || 'User'}</strong>: {c.text}
            </div>
          ))}
          <form onSubmit={handleComment} className="flex gap-8 mt-10">
            <input className="form-input" placeholder="Write a comment..."
              value={commentText} onChange={e => setCommentText(e.target.value)} />
            <button className="btn btn-primary btn-small" type="submit">Send</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default PostCard;
