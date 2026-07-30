import React, { useState } from 'react';
import { ApiClient } from '@/lib/api';
import { useToast } from '@/components/ui/Toast/ToastProvider';
import { X, Star } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export function FeedbackModal({ eventId, eventTitle, onClose }: { eventId: string, eventTitle: string, onClose: () => void }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast('You must be logged in to leave feedback', 'error');
      return;
    }
    if (rating === 0) {
      toast('Please select a rating', 'error');
      return;
    }

    try {
      await ApiClient.post('/events/feedback', {
        event_id: eventId,
        event_name: eventTitle,
        rating,
        comment
      });
      toast('Feedback submitted successfully!', 'success');
      onClose();
    } catch (err: any) {
      toast(err.message || 'Failed to submit feedback', 'error');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'var(--color-bg-page)', padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '400px', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
          <X size={20} />
        </button>
        
        <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--color-text-primary)', marginBottom: '8px' }}>Event Feedback</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>{eventTitle}</p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px', color: 'var(--color-text-primary)', fontWeight: 600 }}>Rate this event</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0' }}
                >
                  <Star 
                    size={32} 
                    fill={(hoverRating || rating) >= star ? '#fbbf24' : 'transparent'} 
                    color={(hoverRating || rating) >= star ? '#fbbf24' : 'var(--color-border)'} 
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px', color: 'var(--color-text-primary)', fontWeight: 600 }}>Share your experience (Optional)</label>
            <textarea 
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you enjoy? What could be improved?"
              style={{ width: '100%', background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px', color: 'var(--color-text-primary)', resize: 'vertical' }}
            />
          </div>

          <button type="submit" style={{ background: 'var(--color-primary)', color: 'white', padding: '12px', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
            Submit Feedback
          </button>
        </form>
      </div>
    </div>
  );
}
