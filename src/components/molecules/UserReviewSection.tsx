'use client';

import * as React from 'react';
import { Star, MessageSquare, Send, Trash2, User } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { cn, THEME_CONFIG, ThemeType } from '@/lib/utils';
import { Badge } from '@/components/atoms/Badge';

interface Review { id: string; rating: number; comment: string; username: string; timestamp: number; }

const ReviewItem = ({ review, onDelete }: { review: Review; onDelete: (id: string) => void }) => (
  <div className="p-6 bg-zinc-900/20 border border-zinc-900 rounded-3xl group animate-in fade-in slide-in-from-right-4 duration-500">
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
          <User className="w-5 h-5 text-zinc-500" />
        </div>
        <div>
          <h4 className="text-sm font-black text-white uppercase italic">{review.username}</h4>
          <p className="text-[10px] text-zinc-600 font-bold uppercase">{new Date(review.timestamp).toLocaleDateString()}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 bg-yellow-500/10 px-3 py-1 rounded-xl border border-yellow-500/20">
          <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
          <span className="text-xs font-black text-yellow-500">{review.rating}</span>
        </div>
        <button onClick={() => onDelete(review.id)} className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 rounded-lg transition-all text-zinc-700 hover:text-red-500">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
    <p className="text-zinc-400 text-sm leading-relaxed font-medium pl-1">{review.comment}</p>
  </div>
);

export function UserReviewSection({ mediaId, theme = 'default' }: { mediaId: string; theme?: ThemeType }) {
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [userRating, setUserRating] = React.useState(0);
  const [hoverRating, setHoverRating] = React.useState(0);
  const [comment, setComment] = React.useState('');
  const [username, setUsername] = React.useState('');
  const config = THEME_CONFIG[theme] || THEME_CONFIG.default;

  React.useEffect(() => {
    const saved = localStorage.getItem(`reviews_${mediaId}`);
    if (saved) setReviews(JSON.parse(saved));
    const savedUser = localStorage.getItem('dwizzy_user');
    if (savedUser) setUsername(savedUser);
  }, [mediaId]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userRating || !comment.trim()) return;
    const newRev = { id: Math.random().toString(36).substr(2, 9), rating: userRating, comment: comment.trim(), username: username.trim() || 'Anonymous User', timestamp: Date.now() };
    const updated = [newRev, ...reviews];
    setReviews(updated);
    localStorage.setItem(`reviews_${mediaId}`, JSON.stringify(updated));
    if (username.trim()) localStorage.setItem('dwizzy_user', username.trim());
    setComment(''); setUserRating(0);
  };

  return (
    <section className="space-y-12 py-12 border-t border-zinc-900">
      <div className="flex items-center gap-3">
        <MessageSquare className={cn("w-6 h-6", config.text)} />
        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Community Reviews</h2>
        <Badge variant="outline">{reviews.length}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-1 space-y-8 bg-zinc-900/30 border border-zinc-800 p-8 rounded-[2.5rem]">
          <h3 className="text-lg font-black italic uppercase text-zinc-200">Rate this content</h3>
          <div className="flex gap-1">
            {[1,2,3,4,5,6,7,8,9,10].map(s => (
              <button key={s} onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)} onClick={() => setUserRating(s)}>
                <Star className={cn("w-5 h-5", (hoverRating || userRating) >= s ? "fill-yellow-500 text-yellow-500" : "text-zinc-700")} />
              </button>
            ))}
            <span className="ml-3 text-xl font-black italic text-zinc-500">{(hoverRating || userRating)}/10</span>
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="Alias..." className="bg-black/40 border-zinc-800 rounded-xl" />
            <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Thoughts..." className="w-full h-32 bg-black/40 border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-zinc-700 transition-all resize-none" />
            <Button type="submit" variant={theme} className="w-full rounded-2xl h-14" disabled={!userRating || !comment.trim()}>Submit</Button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {reviews.map(r => <ReviewItem key={r.id} review={r} onDelete={id => {
            const updated = reviews.filter(rv => rv.id !== id);
            setReviews(updated);
            localStorage.setItem(`reviews_${mediaId}`, JSON.stringify(updated));
          }} />)}
          {!reviews.length && <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-zinc-900 rounded-[3rem] text-zinc-500 font-black uppercase">No reviews yet</div>}
        </div>
      </div>
    </section>
  );
}
