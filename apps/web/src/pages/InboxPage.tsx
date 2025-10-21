import { useEffect, useState } from 'react';
import { useStore } from '../lib/store';
import RoomList from '../components/RoomList';
import MessageView from '../components/MessageView';
import DraftPanel from '../components/DraftPanel';

export default function InboxPage() {
  const { rooms, selectedRoomId, selectRoom, userId, logout } = useStore();
  const [showDraft, setShowDraft] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // j - next room
      if (e.key === 'j' && !e.metaKey && !e.ctrlKey) {
        const currentIndex = rooms.findIndex(r => r.id === selectedRoomId);
        if (currentIndex < rooms.length - 1) {
          selectRoom(rooms[currentIndex + 1].id);
        }
      }
      
      // k - previous room
      if (e.key === 'k' && !e.metaKey && !e.ctrlKey) {
        const currentIndex = rooms.findIndex(r => r.id === selectedRoomId);
        if (currentIndex > 0) {
          selectRoom(rooms[currentIndex - 1].id);
        }
      }

      // s - suggest draft
      if (e.key === 's' && !e.metaKey && !e.ctrlKey) {
        setShowDraft(true);
      }

      // r - reply (toggle draft)
      if (e.key === 'r' && !e.metaKey && !e.ctrlKey) {
        setShowDraft(!showDraft);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rooms, selectedRoomId, showDraft]);

  return (
    <div className="inbox-page">
      <header className="inbox-header">
        <h1>📨 InboxForge</h1>
        <div className="user-info">
          <span>{userId}</span>
          <button onClick={logout} className="btn-small">Logout</button>
        </div>
      </header>

      <div className="inbox-layout">
        <aside className="room-sidebar">
          <RoomList
            rooms={rooms}
            selectedRoomId={selectedRoomId}
            onSelectRoom={selectRoom}
          />
        </aside>

        <main className="message-area">
          {selectedRoomId ? (
            <MessageView roomId={selectedRoomId} />
          ) : (
            <div className="empty-state">
              <p>Select a room to view messages</p>
              <p className="hint">Use <kbd>j</kbd>/<kbd>k</kbd> to navigate</p>
            </div>
          )}
        </main>

        {showDraft && selectedRoomId && (
          <aside className="draft-sidebar">
            <DraftPanel
              roomId={selectedRoomId}
              onClose={() => setShowDraft(false)}
            />
          </aside>
        )}
      </div>

      <footer className="keyboard-hints">
        <span><kbd>j</kbd>/<kbd>k</kbd> navigate</span>
        <span><kbd>s</kbd> suggest</span>
        <span><kbd>r</kbd> reply</span>
        <span><kbd>v</kbd> verify</span>
        <span><kbd>Cmd+Enter</kbd> send</span>
      </footer>
    </div>
  );
}

