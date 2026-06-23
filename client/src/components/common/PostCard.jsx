import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';

const AVATAR_COLORS = ['', 'avatar-green', 'avatar-blue', 'avatar-amber', 'avatar-purple'];

function PostCard({ post, currentUserId, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [likes, setLikes] = useState(post.likes?.length || 0);
  const [liked, setLiked] = useState(post.likes?.includes(currentUserId));
  const cardRef = useRef(null);

  const isAuthor = post.author?._id === currentUserId;
  const initial = post.author?.name?.charAt(0)?.toUpperCase() || '?';
  const colorIdx = post.author?.name ? post.author.name.charCodeAt(0) % AVATAR_COLORS.length : 0;

  // jQuery fade-in animation
  useEffect(() => {
    const $ = window.jQuery;
    if ($ && cardRef.current) {
      $(cardRef.current).hide().fadeIn(400);
    }
  }, []);

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

  const handleDeleteComment = async (commentId) => {
    try {
      await API.delete(`/posts/${post._id}/comment/${commentId}`);
      if (onUpdate) onUpdate();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete comment');
    }
  };

  return (
    <div className="post-card" ref={cardRef}>
      {/* Header */}
      <div className="post-header">
        <div className={`avatar ${AVATAR_COLORS[colorIdx]}`}>{initial}</div>
        <div className="post-author-info">
          <Link to={`/profile/${post.author?._id}`} className="post-author-name">
            {post.author?.name}
          </Link>
          <div className="post-meta">
            <span>{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            {post.group && (
              <>
                <span>·</span>
                <Link to={`/groups/${post.group._id || post.group}`}>{post.group.name || 'Group'}</Link>
              </>
            )}
          </div>
        </div>
        <span className={`post-type-badge ${post.type}`}>{post.type}</span>
      </div>

      {/* Content */}
      {editing ? (
        <div>
          <textarea className="form-input" value={editContent} onChange={e => setEditContent(e.target.value)} />
          <div className="flex gap-2 mt-10">
            <button className="btn btn-primary btn-small" onClick={handleUpdate}>Save</button>
            <button className="btn btn-secondary btn-small" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <p className="post-content">{post.content}</p>
      )}

      {/* Video */}
      {post.mediaType === 'video' && post.mediaUrl && (
        <video className="post-video" controls>
          <source src={post.mediaUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}

      {/* Image */}
      {post.mediaType === 'image' && post.mediaUrl && (
        <img src={post.mediaUrl} alt="Post media" className="post-image" />
      )}

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="post-tags">
          {post.tags.map((tag, i) => <span key={i} className="tag">#{tag}</span>)}
        </div>
      )}

      {/* Actions */}
      <div className="post-actions">
        <button className={`post-action-btn ${liked ? 'liked' : ''}`} onClick={handleLike}>
          <svg viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
          </svg>
          {likes}
        </button>
        <button className="post-action-btn" onClick={() => setShowComments(!showComments)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          {post.comments?.length || 0}
        </button>
        {isAuthor && (
          <button className="post-action-btn" onClick={() => setEditing(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit
          </button>
        )}
        {isAuthor && (
          <button className="post-action-btn" onClick={handleDelete} style={{ marginLeft: 'auto' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
          </button>
        )}
      </div>

      {/* Comments */}
      {showComments && (
        <div className="comments-section">
          {post.comments?.length === 0 && (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', padding: 'var(--space-2) 0' }}>
              No comments yet. Be the first!
            </p>
          )}
          {post.comments?.map((c) => {
            const cInitial = c.author?.name?.charAt(0)?.toUpperCase() || '?';
            const cColor = c.author?.name ? c.author.name.charCodeAt(0) % AVATAR_COLORS.length : 0;
            return (
              <div key={c._id} className="comment-item">
                <div className={`comment-avatar ${AVATAR_COLORS[cColor]}`} style={{ background: AVATAR_COLORS[cColor] ? undefined : 'var(--info)' }}>
                  {cInitial}
                </div>
                <div className="comment-body">
                  <span className="comment-author">{c.author?.name || 'User'}</span>
                  <span className="comment-text">{c.text}</span>
                </div>
                {(c.author?._id === currentUserId || isAuthor) && (
                  <button className="comment-delete-btn" onClick={() => handleDeleteComment(c._id)} title="Delete">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                )}
              </div>
            );
          })}
          <form onSubmit={handleComment} className="comment-form">
            <input className="form-input" placeholder="Write a comment..."
              value={commentText} onChange={e => setCommentText(e.target.value)} />
            <button className="btn btn-primary btn-small" type="submit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default PostCard;
