import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { useToast } from './Toast';
import { useConfirm } from './ConfirmDialog';

const AVATAR_COLORS = ['', 'avatar-green', 'avatar-blue', 'avatar-amber', 'avatar-purple'];

function PostCard({ post, currentUserId, onUpdate, onDelete }) {
  const [editing, setEditing]           = useState(false);
  const [editContent, setEditContent]   = useState(post.content);
  const [commentText, setCommentText]   = useState('');
  const [showComments, setShowComments] = useState(false);
  const [likes, setLikes]               = useState(post.likes?.length || 0);
  const [liked, setLiked]               = useState(
    post.likes?.some(l => String(l?._id || l) === String(currentUserId)) || false
  );
  const [actionLoading, setActionLoading] = useState(false);

  // ── Likes modal state ────────────────────────────────────────────────
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [likersList, setLikersList]         = useState([]);
  const [likersLoading, setLikersLoading]   = useState(false);

  const cardRef  = useRef(null);
  const modalRef = useRef(null); // ref for focus trap on open
  const toast    = useToast();
  const confirm  = useConfirm();

  const isAuthor = String(post.author?._id) === String(currentUserId);
  const initial  = post.author?.name?.charAt(0)?.toUpperCase() || '?';
  const colorIdx = post.author?.name ? post.author.name.charCodeAt(0) % AVATAR_COLORS.length : 0;
  const typeClass = post.type ? `type-${post.type}` : '';

  useEffect(() => {
    const $ = window.jQuery;
    if ($ && cardRef.current) $(cardRef.current).hide().fadeIn(400);
  }, []);

  // ── Close modal on Escape key ────────────────────────────────────────
  useEffect(() => {
    if (!showLikesModal) return;
    const onKey = (e) => { if (e.key === 'Escape') setShowLikesModal(false); };
    document.addEventListener('keydown', onKey);
    // Move focus into the modal panel so screen-readers announce it
    modalRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [showLikesModal]);

  // ── Fetch likers and open modal ──────────────────────────────────────
  const handleShowLikes = useCallback(async () => {
    if (likes === 0) return;          // nothing to show
    setShowLikesModal(true);
    setLikersLoading(true);
    try {
      const res = await API.get(`/posts/${post._id}/likes`);
      setLikersList(res.data || []);
    } catch (err) {
      toast('Could not load likes', 'error');
      setShowLikesModal(false);
    }
    setLikersLoading(false);
  }, [post._id, likes, toast]);

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
    <>
      <article className={`post-card ${typeClass}`} ref={cardRef}>

        {/* ── Post header ───────────────────────────────────────────── */}
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

        {/* ── Post content ──────────────────────────────────────────── */}
        {editing ? (
          <div>
            <label htmlFor={`edit-${post._id}`} className="sr-only">Edit post content</label>
            <textarea id={`edit-${post._id}`} className="form-input" value={editContent}
              onChange={e => setEditContent(e.target.value)} />
            <div className="flex gap-2 mt-10">
              <button className="btn btn-primary btn-small" onClick={handleUpdate}>Save</button>
              <button className="btn btn-secondary btn-small" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <p className="post-content">{post.content}</p>
        )}

        {/* ── Media attachments ─────────────────────────────────────── */}
        {post.mediaType === 'video' && post.mediaUrl && (
          <video className="post-video" controls>
            <source src={post.mediaUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )}
        {post.mediaType === 'image' && post.mediaUrl && (
          <img src={post.mediaUrl} alt="Post media" className="post-image" />
        )}
        {post.mediaType === 'file' && post.mediaUrl && (
          <a href={post.mediaUrl} target="_blank" rel="noopener noreferrer"
            className="file-preview"
            style={{ textDecoration: 'none', display: 'flex', marginTop: 'var(--space-3)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
            </svg>
            <span>{post.mediaOriginalName || post.mediaUrl.split('/').pop()}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              aria-hidden="true" style={{ marginLeft: 'auto' }}>
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
          </a>
        )}

        {/* ── Tags ──────────────────────────────────────────────────── */}
        {post.tags?.length > 0 && (
          <div className="post-tags">
            {post.tags.map((tag, i) => (
              <Link key={i} to={`/tag/${encodeURIComponent(tag)}`} className="tag"
                title={`See everything tagged #${tag}`}>
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* ── Action bar ────────────────────────────────────────────── */}
        <div className="post-actions">
          {/* Heart icon — toggles the like */}
          <button
            className={`post-action-btn ${liked ? 'liked' : ''}`}
            onClick={handleLike}
            aria-label={liked ? 'Unlike post' : 'Like post'}
          >
            <svg viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'}
              stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
          </button>

          {/* Like count — separate clickable button that opens the modal */}
          <button
            className="post-action-btn"
            onClick={handleShowLikes}
            disabled={likes === 0}
            aria-label={`${likes} likes — click to see who liked this`}
            style={{
              paddingLeft: 4,
              marginLeft: -4,
              cursor: likes === 0 ? 'default' : 'pointer',
              opacity: likes === 0 ? 0.5 : 1,
            }}
          >
            {likes}
          </button>

          {/* Comment toggle */}
          <button className="post-action-btn"
            onClick={() => setShowComments(!showComments)}
            aria-label={`${post.comments?.length || 0} comments`}
            aria-expanded={showComments}>
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
            <button className="post-action-btn" onClick={handleDelete} disabled={actionLoading}
              style={{ marginLeft: 'auto' }} aria-label="Delete post">
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

        {/* ── Comments section ──────────────────────────────────────── */}
        {showComments && (
          <div className="comments-section">
            {post.comments?.length === 0 && (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', padding: 'var(--space-2) 0' }}>
                No comments yet. Be the first!
              </p>
            )}
            {post.comments?.map((c) => {
              const cInitial = c.author?.name?.charAt(0)?.toUpperCase() || '?';
              const cColor   = c.author?.name ? c.author.name.charCodeAt(0) % AVATAR_COLORS.length : 0;
              return (
                <div key={c._id} className="comment-item">
                  <div className={`comment-avatar ${AVATAR_COLORS[cColor]}`}
                    style={{ background: AVATAR_COLORS[cColor] ? undefined : 'var(--info)' }}
                    aria-hidden="true">
                    {cInitial}
                  </div>
                  <div className="comment-body">
                    <span className="comment-author">{c.author?.name || 'User'}</span>
                    <span className="comment-text">{c.text}</span>
                  </div>
                  {(c.author?._id === currentUserId || isAuthor) && (
                    <button className="comment-delete-btn" onClick={() => handleDeleteComment(c._id)}
                      aria-label="Delete comment">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
              </button>
            </form>
          </div>
        )}
      </article>

      {/* ── Likes Modal ───────────────────────────────────────────────── */}
      {showLikesModal && (
        // Overlay — click outside the panel to close
        <div
          role="dialog"
          aria-modal="true"
          aria-label="People who liked this post"
          onClick={() => setShowLikesModal(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 'var(--space-4)',
          }}
        >
          {/* Panel — stopPropagation prevents the overlay click-to-close
              from firing when the user clicks inside the panel */}
          <div
            ref={modalRef}
            tabIndex={-1}
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              width: '100%',
              maxWidth: 360,
              maxHeight: '70vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Modal header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: 'var(--space-4) var(--space-5)',
              borderBottom: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24"
                  fill="var(--danger, #f93a5b)" stroke="none" aria-hidden="true">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                </svg>
                <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                  {likes} {likes === 1 ? 'Like' : 'Likes'}
                </span>
              </div>
              <button
                onClick={() => setShowLikesModal(false)}
                aria-label="Close likes list"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-tertiary)', padding: 4, borderRadius: 'var(--radius-sm)',
                  display: 'flex', alignItems: 'center',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Modal body — scrollable list */}
            <div style={{ overflowY: 'auto', padding: 'var(--space-3) var(--space-5)' }}>
              {likersLoading ? (
                // Skeleton rows while fetching
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                    padding: 'var(--space-3) 0',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
                    <div className="skeleton" style={{ height: 14, width: '55%', borderRadius: 'var(--radius-sm)' }} />
                  </div>
                ))
              ) : likersList.length === 0 ? (
                <p style={{
                  fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)',
                  textAlign: 'center', padding: 'var(--space-6) 0',
                }}>
                  No likes yet.
                </p>
              ) : (
                likersList.map((user) => {
                  const uInitial  = user.name?.charAt(0)?.toUpperCase() || '?';
                  const uColorIdx = user.name ? user.name.charCodeAt(0) % AVATAR_COLORS.length : 0;
                  return (
                    <div key={user._id} style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                      padding: 'var(--space-3) 0',
                      borderBottom: '1px solid var(--border)',
                    }}>
                      <div
                        className={`avatar ${AVATAR_COLORS[uColorIdx]}`}
                        style={{ width: 36, height: 36, fontSize: 15, flexShrink: 0 }}
                        aria-hidden="true"
                      >
                        {uInitial}
                      </div>
                      <Link
                        to={`/profile/${user._id}`}
                        onClick={() => setShowLikesModal(false)}
                        style={{
                          fontSize: 'var(--text-sm)', fontWeight: 500,
                          color: 'var(--text-primary)', textDecoration: 'none',
                        }}
                      >
                        {user.name}
                      </Link>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default PostCard;