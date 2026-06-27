import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { useToast } from './Toast';
import { useConfirm } from './ConfirmDialog';
import { useLanguage } from '../../contexts/LanguageContext';
import EmojiPicker from './EmojiPicker';

// Pre-defined color classes for the avatar background.
// The color is picked based on the first character of the author's name,
// so the same user always gets the same color across all their posts.
const AVATAR_COLORS = ['', 'avatar-green', 'avatar-blue', 'avatar-amber', 'avatar-purple'];

function PostCard({ post, currentUserId, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);           // inline edit mode
  const [editContent, setEditContent] = useState(post.content); // edit textarea value
  const [commentText, setCommentText] = useState('');      // new comment input value
  const [showComments, setShowComments] = useState(false); // whether comment section is expanded
  // Local like state — optimistic update: we update the UI immediately,
  // and the server confirms the new count in the response
  const [likes, setLikes] = useState(post.likes?.length || 0);
  // Cast to String on both sides — likes can be ObjectId hex strings or populated objects
  const [liked, setLiked] = useState(
    post.likes?.some(l => String(l?._id || l) === String(currentUserId)) || false
  );
  const [actionLoading, setActionLoading] = useState(false);
  const [showCommentEmoji, setShowCommentEmoji] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [likersList, setLikersList] = useState([]);
  const [likersLoading, setLikersLoading] = useState(false);
  const cardRef = useRef(null);
  const commentInputRef = useRef(null);
  const modalRef = useRef(null);
  const toast = useToast();
  const confirm = useConfirm();
  const { t } = useLanguage();
  const typeLabels = { question: t('postQuestion'), material: t('postMaterial'), announcement: t('postAnnouncement') };

  const handleShowLikes = useCallback(async () => {
    if (likes === 0) return;
    setShowLikesModal(true);
    setLikersLoading(true);
    try {
      const res = await API.get(`/posts/${post._id}/likes`);
      setLikersList(res.data || []);
    } catch (err) {
      toast(t('errLoadLikes'), 'error');
      setShowLikesModal(false);
    }
    setLikersLoading(false);
  }, [post._id, likes, toast, t]);

  useEffect(() => {
    if (!showLikesModal) return;
    const onKey = (e) => { if (e.key === 'Escape') setShowLikesModal(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showLikesModal]);

  const handleCommentEmoji = (emoji) => {
    const input = commentInputRef.current;
    if (!input) { setCommentText(prev => prev + emoji); return; }
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const next = commentText.slice(0, start) + emoji + commentText.slice(end);
    setCommentText(next);
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  };

  // Is the current user the author of this post? Wrap in String() for safety.
  const isAuthor = String(post.author?._id) === String(currentUserId);
  // First letter of the author's name (uppercased) for the avatar circle
  const initial = post.author?.name?.charAt(0)?.toUpperCase() || '?';
  // Pick a color index deterministically from the first character's char code
  const colorIdx = post.author?.name ? post.author.name.charCodeAt(0) % AVATAR_COLORS.length : 0;
  // CSS class for the post type border (e.g. "type-question" adds a colored left border)
  const typeClass = post.type ? `type-${post.type}` : '';
  // jQuery is loaded globally in index.html (window.jQuery).
  // We hide the card immediately and then fade it back in over 400ms.
  useEffect(() => {
    const $ = window.jQuery;
    if ($ && cardRef.current) {
      $(cardRef.current).hide().fadeIn(400);
    }
  }, []); // empty deps: only runs once when the card mounts
  const handleUpdate = async () => {
    try {
      await API.put(`/posts/${post._id}`, { content: editContent });
      setEditing(false);
      toast('Post updated', 'success');
      if (onUpdate) onUpdate(); // tell the parent to reload the post list
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to update', 'error');
    }
  };
  // Uses ConfirmDialog to ask before the irreversible delete
  const handleDelete = async () => {
    const ok = await confirm('This post and all its comments will be permanently deleted.', 'Delete post?');
    if (!ok) return;
    setActionLoading(true);
    try {
      await API.delete(`/posts/${post._id}`);
      toast('Post deleted', 'success');
      if (onDelete) onDelete(); // tell the parent to reload the post list
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to delete', 'error');
    }
    setActionLoading(false);
  };
  // POST /api/posts/:id/like is a toggle: calling it twice removes the like.
  // The server returns { liked: true/false, likes: N } so we update local state.
  const handleLike = async () => {
    try {
      const res = await API.post(`/posts/${post._id}/like`);
      setLikes(res.data.likes);  // server's authoritative like count
      setLiked(res.data.liked);  // whether the current user has now liked it
    } catch (err) {
      console.error(err);
    }
  };
  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return; // don't submit empty comments
    try {
      await API.post(`/posts/${post._id}/comment`, { text: commentText });
      setCommentText(''); // clear the input after successful comment
      if (onUpdate) onUpdate(); // reload to show the new comment
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to comment', 'error');
    }
  };
  // Both the comment author and the post author can delete a comment
  const handleDeleteComment = async (commentId) => {
    try {
      await API.delete(`/posts/${post._id}/comment/${commentId}`);
      if (onUpdate) onUpdate(); // reload to remove the deleted comment from the list
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to delete comment', 'error');
    }
  };

  return (
    // <article> is semantically correct for a self-contained piece of content
    <article className={`post-card ${typeClass}`} ref={cardRef}>

      {/* ── Post header: avatar, author name, date, group ─────────────── */}
      <div className="post-header">
        {/* Colored letter avatar — color chosen by author name hash */}
        <div className={`avatar ${AVATAR_COLORS[colorIdx]}`} aria-hidden="true">{initial}</div>
        <div className="post-author-info">
          {/* Author name links to their profile page */}
          <Link to={`/profile/${post.author?._id}`} className="post-author-name">
            {post.author?.name}
          </Link>
          <div className="post-meta">
            {/* Post date formatted as "Jan 5" */}
            <span>{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            {/* Group name (if the post belongs to a group) */}
            {post.group && (
              <>
                <span>·</span>
                <Link to={`/groups/${post.group._id || post.group}`}>{post.group.name || 'Group'}</Link>
              </>
            )}
          </div>
        </div>
        <span className={`post-type-badge ${post.type}`}>{typeLabels[post.type] || post.type}</span>
      </div>

      {/* ── Post content ──────────────────────────────────────────────── */}
      {editing ? (
        /* Inline edit form — shown when the author clicks "Edit" */
        <div>
          <label htmlFor={`edit-${post._id}`} className="sr-only">Edit post content</label>
          <textarea id={`edit-${post._id}`} className="form-input" value={editContent} onChange={e => setEditContent(e.target.value)} />
          <div className="flex gap-2 mt-10">
            <button className="btn btn-primary btn-small" onClick={handleUpdate}>{t('save')}</button>
            <button className="btn btn-secondary btn-small" onClick={() => setEditing(false)}>{t('cancel')}</button>
          </div>
        </div>
      ) : (
        <p className="post-content">{post.content}</p>
      )}

      {/* ── Media attachments ─────────────────────────────────────────── */}

      {/* Video: uses the HTML5 <video> element with controls */}
      {post.mediaType === 'video' && post.mediaUrl && (
        <video className="post-video" controls>
          <source src={post.mediaUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}

      {/* Image: straightforward <img> tag */}
      {post.mediaType === 'image' && post.mediaUrl && (
        <img src={post.mediaUrl} alt="Post media" className="post-image" />
      )}

      {/* File attachment: shows original filename (e.g. "homework.docx"),
          falling back to the hashed server name if mediaOriginalName wasn't saved */}
      {post.mediaType === 'file' && post.mediaUrl && (
        <a href={post.mediaUrl} target="_blank" rel="noopener noreferrer" className="file-preview" style={{ textDecoration: 'none', display: 'flex', marginTop: 'var(--space-3)' }}>
          {/* Document icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
          {/* Show the original filename if available, otherwise extract from the URL */}
          <span>{post.mediaOriginalName || post.mediaUrl.split('/').pop()}</span>
          {/* Download icon on the right */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{ marginLeft: 'auto' }}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
        </a>
      )}

      {/* ── Tags ─────────────────────────────────────────────────────── */}
      {/* Each tag is a Link to the search page with the tag pre-filled — clicking
          navigates to /search?tab=posts&tag=<name> and runs the search */}
      {post.tags?.length > 0 && (
        <div className="post-tags">
          {post.tags.map((tag, i) => (
            <Link
              key={i}
              to={`/tag/${encodeURIComponent(tag)}`}
              className="tag"
              title={`See everything tagged #${tag}`}
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}

      {/* ── Action bar ───────────────────────────────────────────────── */}
      <div className="post-actions">
        {/* Like button: heart toggles like; count opens "who liked" modal */}
        <button className={`post-action-btn ${liked ? 'liked' : ''}`} onClick={handleLike} aria-label={liked ? 'Unlike post' : 'Like post'}>
          <svg viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
          </svg>
        </button>
        <button
          className="post-action-btn"
          onClick={handleShowLikes}
          disabled={likes === 0}
          aria-label={`${likes} likes — click to see who liked this`}
          style={{ paddingLeft: 2, marginLeft: -6, cursor: likes === 0 ? 'default' : 'pointer', opacity: likes === 0 ? 0.5 : 1 }}
        >
          {likes}
        </button>

        {/* Comment count button — toggles the comments section */}
        <button className="post-action-btn" onClick={() => setShowComments(!showComments)} aria-label={`${post.comments?.length || 0} comments`} aria-expanded={showComments}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          {post.comments?.length || 0}
        </button>

        {/* Author-only: Edit button */}
        {isAuthor && (
          <button className="post-action-btn" onClick={() => setEditing(true)} aria-label="Edit post">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            {t('edit')}
          </button>
        )}

        {/* Author-only: Delete button — pushed to the right with marginLeft: auto */}
        {isAuthor && (
          <button className="post-action-btn" onClick={handleDelete} disabled={actionLoading} style={{ marginLeft: 'auto' }} aria-label="Delete post">
            {actionLoading ? (
              /* Spinner while the delete request is in flight */
              <span className="btn-spinner" style={{ width: 14, height: 14, borderColor: 'rgba(0,0,0,0.15)', borderTopColor: 'var(--text-tertiary)' }} />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
            )}
          </button>
        )}
      </div>

      {/* ── Comments section ─────────────────────────────────────────── */}
      {/* Only rendered when the user has clicked the comment button */}
      {showComments && (
        <div className="comments-section">
          {post.comments?.length === 0 && (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', padding: 'var(--space-2) 0' }}>
              {t('noCommentsYet')}
            </p>
          )}

          {/* Render each existing comment */}
          {post.comments?.map((c) => {
            const cInitial = c.author?.name?.charAt(0)?.toUpperCase() || '?';
            const cColor = c.author?.name ? c.author.name.charCodeAt(0) % AVATAR_COLORS.length : 0;
            return (
              <div key={c._id} className="comment-item">
                {/* Commenter's letter avatar */}
                <div className={`comment-avatar ${AVATAR_COLORS[cColor]}`} style={{ background: AVATAR_COLORS[cColor] ? undefined : 'var(--info)' }} aria-hidden="true">
                  {cInitial}
                </div>
                <div className="comment-body">
                  <span className="comment-author">{c.author?.name || 'User'}</span>
                  <span className="comment-text">{c.text}</span>
                </div>
                {/* Delete button shown to: the comment's author OR the post's author */}
                {(c.author?._id === currentUserId || isAuthor) && (
                  <button className="comment-delete-btn" onClick={() => handleDeleteComment(c._id)} aria-label="Delete comment">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                )}
              </div>
            );
          })}

          {/* New comment form */}
          <form onSubmit={handleComment} className="comment-form">
            <label htmlFor={`comment-${post._id}`} className="sr-only">Write a comment</label>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                ref={commentInputRef}
                id={`comment-${post._id}`}
                className="form-input"
                placeholder={t('addComment')}
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                style={{ paddingRight: 34 }}
              />
              <button
                type="button"
                data-emoji-toggle
                onClick={() => setShowCommentEmoji(v => !v)}
                aria-label="Insert emoji"
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 2, opacity: 0.7 }}
              >
                😊
              </button>
              {showCommentEmoji && (
                <EmojiPicker
                  onSelect={(emoji) => { handleCommentEmoji(emoji); }}
                  onClose={() => setShowCommentEmoji(false)}
                />
              )}
            </div>
            <button className="btn btn-primary btn-small" type="submit" aria-label="Send comment">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
            </button>
          </form>
        </div>
      )}
      {showLikesModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('likesModalTitle') || 'People who liked this post'}
          onClick={() => setShowLikesModal(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}
        >
          <div
            ref={modalRef}
            tabIndex={-1}
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: 360, maxHeight: '70vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--danger, #f93a5b)" stroke="none" aria-hidden="true">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                </svg>
                <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                  {likes} {likes === 1 ? t('likesSingular') : t('likesPlural')}
                </span>
              </div>
              <button onClick={() => setShowLikesModal(false)} aria-label="Close likes list" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div style={{ overflowY: 'auto', padding: 'var(--space-3) var(--space-5)' }}>
              {likersLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--border)' }}>
                    <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
                    <div className="skeleton" style={{ height: 14, width: '55%', borderRadius: 'var(--radius-sm)' }} />
                  </div>
                ))
              ) : likersList.length === 0 ? (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', textAlign: 'center', padding: 'var(--space-6) 0' }}>
                  {t('noLikesYet')}
                </p>
              ) : (
                likersList.map((user) => {
                  const uInitial = user.name?.charAt(0)?.toUpperCase() || '?';
                  const uColorIdx = user.name ? user.name.charCodeAt(0) % AVATAR_COLORS.length : 0;
                  return (
                    <div key={user._id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--border)' }}>
                      <div className={`avatar ${AVATAR_COLORS[uColorIdx]}`} style={{ width: 36, height: 36, fontSize: 15, flexShrink: 0 }} aria-hidden="true">
                        {uInitial}
                      </div>
                      <Link to={`/profile/${user._id}`} onClick={() => setShowLikesModal(false)} style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)', textDecoration: 'none' }}>
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
    </article>
  );
}

export default PostCard;
