import React, { useEffect, useRef } from 'react';

const EMOJIS = [
  '😀','😂','😊','😍','🤔','😎','🙄','😢','😡','🤗',
  '👍','👎','👏','🙌','🤝','👋','✌️','🤞','🙏','💪',
  '❤️','💕','💯','✅','❌','⭐','🔥','💡','🎉','🎊',
  '📚','📝','📌','💻','📱','🎓','🏆','💬','🔔','⚡',
  '😴','🤯','🥳','🤓','😇','🤩','😬','🥺','😤','🤪',
  '🍕','🍔','☕','🍎','🎵','🎮','⚽','🏀','🌟','🌈',
];

function EmojiPicker({ onSelect, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    // Delay attaching the listener by one tick so the same click that opened
    // the picker (on the 😊 button) doesn't immediately close it.
    let attached = false;
    function handleClick(e) {
      // Ignore clicks on the toggle button itself (data-emoji-toggle) — its own
      // onClick will handle closing. Otherwise mousedown here would close the picker,
      // and then the toggle click would re-open it.
      if (e.target.closest('[data-emoji-toggle]')) return;
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    }
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
      attached = true;
    }, 0);
    return () => {
      clearTimeout(timer);
      if (attached) document.removeEventListener('mousedown', handleClick);
    };
  }, [onClose]);

  return (
    <div ref={ref} style={{
      position: 'absolute',
      bottom: '100%',
      left: 0,
      zIndex: 200,
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-lg)',
      padding: 'var(--space-2)',
      width: 260,
      maxHeight: 200,
      overflowY: 'auto',
      display: 'grid',
      gridTemplateColumns: 'repeat(10, 1fr)',
      gap: 2,
      marginBottom: 4,
    }}>
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onSelect(emoji)}
          title={emoji}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 18,
            padding: '3px 2px',
            borderRadius: 4,
            lineHeight: 1,
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

export default EmojiPicker;
