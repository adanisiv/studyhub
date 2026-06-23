import React, { useState } from 'react';
import API from '../../api/axios';

function PostForm({ groupId, onCreated }) {
  const [content, setContent] = useState('');
  const [type, setType] = useState('question');
  const [tags, setTags] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('media', file);
      const res = await API.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        baseURL: 'http://localhost:5000/api'
      });
      setMediaUrl(res.data.url);
      setMediaType(res.data.mediaType);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    }
    setUploading(false);
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
        group: groupId || undefined
      });
      setContent('');
      setTags('');
      setMediaUrl('');
      setMediaType('');
      setExpanded(false);
      if (onCreated) onCreated();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create post');
    }
  };

  return (
    <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
      <form onSubmit={handleSubmit}>
        <textarea
          className="form-input"
          placeholder="Share something with your group..."
          value={content}
          onChange={e => { setContent(e.target.value); if (!expanded) setExpanded(true); }}
          onFocus={() => setExpanded(true)}
          required
          style={{ minHeight: expanded ? 80 : 48, transition: 'min-height 0.2s' }}
        />

        {expanded && (
          <div style={{ animation: 'slideDown 0.25s ease-out' }}>
            <div className="flex gap-2 mt-10" style={{ flexWrap: 'wrap' }}>
              <select className="form-input" style={{ width: 'auto', flex: 'none' }}
                value={type} onChange={e => setType(e.target.value)}>
                <option value="question">Question</option>
                <option value="material">Material</option>
                <option value="announcement">Announcement</option>
              </select>
              <input className="form-input" style={{ flex: 1, minWidth: 140 }} placeholder="Tags (comma separated)"
                value={tags} onChange={e => setTags(e.target.value)} />
            </div>

            {/* File upload with multer */}
            <div className="file-upload-area">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
              </svg>
              <input type="file" accept="image/*,video/*" onChange={handleFileUpload} />
              {uploading && <span className="upload-status">Uploading...</span>}
              {mediaUrl && !uploading && <span className="upload-status success">Uploaded</span>}
            </div>

            {/* Or paste URL manually */}
            <div className="flex gap-2 mt-10">
              <input className="form-input" style={{ flex: 1 }} placeholder="Or paste media URL"
                value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} />
              <select className="form-input" style={{ width: 'auto', flex: 'none' }}
                value={mediaType} onChange={e => setMediaType(e.target.value)}>
                <option value="">No media</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>

            {error && <p className="error-text">{error}</p>}

            <div className="flex gap-2 mt-10" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary btn-small" onClick={() => setExpanded(false)}>Cancel</button>
              <button className="btn btn-primary btn-small" type="submit">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
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
