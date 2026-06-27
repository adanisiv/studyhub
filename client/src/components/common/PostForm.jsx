import React, { useState, useRef, useEffect } from 'react';
import API from '../../api/axios';
import { useToast } from './Toast';
import EmojiPicker from './EmojiPicker';

function PostForm({ groupId, onCreated }) {
  const [content, setContent] = useState('');
  const [type, setType] = useState('question');
  const [tags, setTags] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState('');
  const [mediaOriginalName, setMediaOriginalName] = useState('');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [popularTags, setPopularTags] = useState([]); // list of {tag, count} from trending
  const textareaRef = useRef(null);
  const toast = useToast();

  // Load popular tags once so users can click-to-insert instead of typing them out
  useEffect(() => {
    API.get('/stats/trending')
      .then(res => setPopularTags((res.data?.tags || []).slice(0, 8)))
      .catch(() => {});
  }, []);

  // Insert (or remove) a tag from the comma-separated tags input
  const handleTagChipClick = (tag) => {
    const current = tags.split(',').map(t => t.trim()).filter(Boolean);
    if (current.includes(tag)) {
      setTags(current.filter(t => t !== tag).join(', '));
    } else {
      setTags([...current, tag].join(', '));
    }
  };

  const handleCancel = () => {
    setExpanded(false);
    setContent('');
    setType('question');
    setTags('');
    setMediaUrl('');
    setMediaType('');
    setMediaOriginalName('');
    setFileName('');
    setError('');
    setShowEmojiPicker(false);
  };

  // Insert emoji at the current cursor position inside the textarea
  const handleEmojiSelect = (emoji) => {
    const ta = textareaRef.current;
    if (!ta) { setContent(prev => prev + emoji); return; }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const next = content.slice(0, start) + emoji + content.slice(end);
    setContent(next);
    // Restore cursor position right after the inserted emoji
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError('');
    setFileName(file.name);
    try {
      const formData = new FormData();
      formData.append('media', file);
      const res = await API.post('/upload', formData);
      setMediaUrl(res.data.url);
      setMediaType(res.data.mediaType);
      setMediaOriginalName(res.data.originalName || file.name);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
      setFileName('');
      setMediaOriginalName('');
    }
    setUploading(false);
  };

  const handleRemoveFile = () => {
    setMediaUrl('');
    setMediaType('');
    setMediaOriginalName('');
    setFileName('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await API.post('/posts', {
        content,
        type,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        mediaUrl: mediaUrl || undefined,
        mediaType: mediaType || undefined,
        mediaOriginalName: mediaOriginalName || undefined,
        group: groupId || undefined
      });
      handleCancel();
      toast('Post published', 'success');
      if (onCreated) onCreated();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create post');
    }
  };

  return (
    <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
      <form onSubmit={handleSubmit}>
        <label htmlFor="post-content" className="sr-only">Post content</label>
        <div style={{ position: 'relative' }}>
          <textarea
            id="post-content"
            ref={textareaRef}
            className="form-input"
            placeholder="Share something with your group..."
            value={content}
            onChange={e => { setContent(e.target.value); if (!expanded) setExpanded(true); }}
            onFocus={() => setExpanded(true)}
            required
            style={{ minHeight: expanded ? 80 : 48, transition: 'min-height 0.2s', paddingRight: 40 }}
          />
          {/* Emoji toggle button inside textarea corner */}
          <button
            type="button"
            aria-label="Insert emoji"
            onClick={() => { setExpanded(true); setShowEmojiPicker(v => !v); }}
            style={{
              position: 'absolute',
              right: 8,
              top: 8,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 18,
              lineHeight: 1,
              padding: 2,
              opacity: 0.7,
            }}
          >
            😊
          </button>
          {showEmojiPicker && (
            <EmojiPicker
              onSelect={handleEmojiSelect}
              onClose={() => setShowEmojiPicker(false)}
            />
          )}
        </div>

        {expanded && (
          <div style={{ animation: 'slideDown 0.25s ease-out' }}>
            <div className="flex gap-2 mt-10" style={{ flexWrap: 'wrap' }}>
              <label htmlFor="post-type" className="sr-only">Post type</label>
              <select id="post-type" className="form-input" style={{ width: 'auto', flex: 'none' }}
                value={type} onChange={e => setType(e.target.value)}>
                <option value="question">Question</option>
                <option value="material">Material</option>
                <option value="announcement">Announcement</option>
              </select>
              <label htmlFor="post-tags" className="sr-only">Tags</label>
              <input id="post-tags" className="form-input" style={{ flex: 1, minWidth: 140 }} placeholder="Tags (comma separated, e.g. js, react)"
                value={tags} onChange={e => setTags(e.target.value)} />
            </div>

            {/* Popular-tag chips: click to insert into the tags field */}
            {popularTags.length > 0 && (
              <div className="flex gap-1 mt-10" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginRight: 4 }}>
                  Popular:
                </span>
                {popularTags.map(t => {
                  const active = tags.split(',').map(x => x.trim()).includes(t.tag);
                  return (
                    <button
                      key={t.tag}
                      type="button"
                      className="tag"
                      onClick={() => handleTagChipClick(t.tag)}
                      title={active ? 'Click to remove' : 'Click to add'}
                      style={{
                        cursor: 'pointer',
                        border: 'none',
                        background: active ? 'var(--accent)' : undefined,
                        color: active ? '#fff' : undefined,
                        fontSize: 'var(--text-xs)',
                      }}
                    >
                      #{t.tag}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Styled file upload area */}
            <div className="file-upload-area">
              <input type="file" onChange={handleFileUpload} aria-label="Upload file" />
              <div className="file-upload-label">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                </svg>
                <span>{uploading ? 'Uploading...' : 'Click to upload file (images, videos, PDF, docs...)'}</span>
              </div>
              {mediaUrl && !uploading && <span className="upload-status success">Uploaded</span>}
            </div>

            {/* File preview */}
            {fileName && (
              <div className="file-preview">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
                <span>{fileName}</span>
                <button type="button" className="file-preview-remove" onClick={handleRemoveFile} aria-label="Remove file">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            )}

            {error && <p className="error-text">{error}</p>}

            <div className="flex gap-2 mt-10" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary btn-small" onClick={handleCancel}>Cancel</button>
              <button className="btn btn-primary btn-small" type="submit">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                Publish
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

export default PostForm;
