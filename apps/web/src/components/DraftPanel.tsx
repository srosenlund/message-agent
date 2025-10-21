import { useState, useEffect } from 'react';
import { useStore } from '../lib/store';

interface Props {
  roomId: string;
  onClose: () => void;
}

export default function DraftPanel({ roomId, onClose }: Props) {
  const { draft, setDraft, generateDraft, sendMessage } = useStore();
  const [activeTab, setActiveTab] = useState<'suggest' | 'prompt' | 'final' | 'diff'>('suggest');
  const [customPrompt, setCustomPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(false);

  const handleGenerate = async (prompt?: string) => {
    setLoading(true);
    try {
      await generateDraft(roomId, prompt);
      setActiveTab('final');
    } catch (error) {
      console.error('Generate failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!draft || !locked) return;
    
    try {
      await sendMessage(roomId, draft.content);
      setDraft(null);
      onClose();
    } catch (error) {
      console.error('Send failed:', error);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // v - verify and lock
      if (e.key === 'v' && !e.metaKey && !e.ctrlKey) {
        setLocked(!locked);
      }

      // Cmd+Enter - send
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        if (locked && draft) {
          handleSend();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [locked, draft]);

  return (
    <div className="draft-panel">
      <div className="draft-header">
        <h3>AI Draft</h3>
        <button onClick={onClose} className="btn-close">×</button>
      </div>

      <div className="draft-tabs">
        <button
          className={activeTab === 'suggest' ? 'active' : ''}
          onClick={() => setActiveTab('suggest')}
        >
          Suggest
        </button>
        <button
          className={activeTab === 'prompt' ? 'active' : ''}
          onClick={() => setActiveTab('prompt')}
        >
          Prompt
        </button>
        <button
          className={activeTab === 'final' ? 'active' : ''}
          onClick={() => setActiveTab('final')}
        >
          Final
        </button>
        <button
          className={activeTab === 'diff' ? 'active' : ''}
          onClick={() => setActiveTab('diff')}
        >
          Diff
        </button>
      </div>

      <div className="draft-content">
        {activeTab === 'suggest' && (
          <div>
            <p>Generate an AI-powered draft response</p>
            <button
              onClick={() => handleGenerate()}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Generating...' : 'Generate Draft'}
            </button>
          </div>
        )}

        {activeTab === 'prompt' && (
          <div>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Enter custom prompt for AI..."
              rows={5}
            />
            <button
              onClick={() => handleGenerate(customPrompt)}
              disabled={loading}
              className="btn-primary"
            >
              Generate with Prompt
            </button>
          </div>
        )}

        {activeTab === 'final' && draft && (
          <div>
            <textarea
              value={draft.content}
              onChange={(e) => setDraft({ ...draft, content: e.target.value })}
              rows={15}
              className={locked ? 'locked' : ''}
              disabled={locked}
            />
            <div className="draft-actions">
              <button
                onClick={() => setLocked(!locked)}
                className={locked ? 'btn-success' : 'btn-secondary'}
              >
                {locked ? '🔒 Locked' : '🔓 Verify & Lock'}
              </button>
              {locked && (
                <button onClick={handleSend} className="btn-primary">
                  📤 Send (Cmd+Enter)
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'diff' && draft && draft.originalContent && (
          <div className="diff-view">
            <div className="diff-original">
              <h4>Original</h4>
              <pre>{draft.originalContent}</pre>
            </div>
            <div className="diff-current">
              <h4>Current</h4>
              <pre>{draft.content}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

