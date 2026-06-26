import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { useToast } from './Toast';
import { useConfirm } from './ConfirmDialog';

const AVATAR_COLORS = ['', 'avatar-green', 'avatar-blue', 'avatar-amber', 'avatar-purple'];

function PostCard({ post, currentUserId, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [likes, setLikes] = useState(post.likes?.length || 0);
  const [liked, setLiked] = useState(post.likes?.some(l => (l._id || l) === currentUserId));
  const [actionLoading, setActionLoading] = useState(false);
  const cardRef = useRef(null);
  const toast = useToast();
  const confirm = useConfirm();

  const isAuthor = post.author?._id === currentUserId;
  const initial = post.author?.name?.charAt(0)?.toUpperCase() || '?';
  const colorIdx = post.author?.name ? post.author.name.charCodeAt(0) % AVATAR_COLORS.length : 0;
  const typeClass = post.type ? `type-${post.type}` : '';

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
      toast('Post updated', 'success');
      if (onUpdate) onUpdate();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to update', 'error');
    }
  };

  const handleDelete = async () => {
    const ok = await confirm('This post and all its comments will be permanently deleted.', 'Delete post?');
    if (!ok) return;
    setActionLoading(true);
    try {
      await API.delete(`/posts/${post._id}`);
      toast('Post deleted', 'success');
      if (onDelete) onDelete();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to delete', 'error');
    }
    setActionLoading(false);
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
      toast(err.response?.data?.error || 'Failed to comment', 'error');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await API.delete(`/posts/${post._id}/comment/${commentId}`);
      if (onUpdate) onUpdate();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to delete comment', 'error');
    }
  };

  return (
    <article className={`post-card ${typeClass}`} ref={cardRef}>
      {/* Header */}
      <div className="post-header">
        <div className={`avatar ${AVATAR_COLORS[colorIdx]}`} aria-hidden="true">{initial}</div>
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
          <label htmlFor={`edit-${post._id}`} className="sr-only">Edit post content</label>
          <textarea id={`edit-${post._id}`} className="form-input" value={editContent} onChange={e => setEditContent(e.target.value)} />
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

      {/* File attachment */}
      {post.mediaType === 'file' && post.mediaUrl && (
        <a href={post.mediaUrl} target="_blank" rel="noopener noreferrer" className="file-preview" style={{ textDecoration: 'none', display: 'flex', marginTop: 'var(--space-3)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
          <span>{post.mediaUrl.split('/').pop()}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{ marginLeft: 'auto' }}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
        </a>
      )}

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="post-tags">
          {post.tags.map((tag, i) => <span key={i} className="tag">#{tag}</span>)}
        </div>
      )}

      {/* Actions */}
      <div className="post-actions">
        <button className={`post-action-btn ${liked ? 'liked' : ''}`} onClick={handleLike} aria-label={liked ? 'Unlike post' : 'Like post'}>
          <svg viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
          </svg>
          {likes}
        </button>
        <button className="post-action-btn" onClick={() => setShowComments(!showComments)} aria-label={`${post.comments?.length || 0} comments`} aria-expanded={showComments}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          {post.comments?.length || 0}
        </button>
        {isAuthor && (
          <button className="post-action-btn" onClick={() => setEditing(true)} aria-label="Edit post">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit
          </button>
        )}
        {isAuthor && (
          <button className="post-action-btn" onClick={handleDelete} disabled={actionLoading} style={{ marginLeft: 'auto' }} aria-label="Delete post">
            {actionLoading ? (
              <span className="btn-spinner" style={{ width: 14, height: 14, borderColor: 'rgba(0,0,0,0.15)', borderTopColor: 'var(--text-tertiary)' }} />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
            )}
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
                <div className={`comment-avatar ${AVATAR_COLORS[cColor]}`} style={{ background: AVATAR_COLORS[cColor] ? undefined : 'var(--info)' }} aria-hidden="true">
                  {cInitial}
                </div>
                <div className="comment-body">
                  <span className="comment-author">{c.author?.name || 'User'}</span>
                  <span className="comment-text">{c.text}</span>
                </div>
                {(c.author?._id === currentUserId || isAuthor) && (
                  <button className="comment-delete-btn" onClick={() => handleDeleteComment(c._id)} aria-label="Delete comment">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                )}
              </div>
            );
          })}
          <form onSubmit={handleComment} className="comment-form">
            <label htmlFor={`comment-${post._id}`} className="sr-only">Write a comment</label>
            <input id={`comment-${post._id}`} className="form-input" placeholder="Write a comment..."
              value={commentText} onChange={e => setCommentText(e.target.value)} />
            <button className="btn btn-primary btn-small" type="submit" aria-label="Send comment">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
            </button>
          </form>
        </div>
      )}
    </article>
  );
}

export default PostCard;
