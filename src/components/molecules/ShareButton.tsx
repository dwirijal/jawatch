'use client';

import * as React from 'react';
import { Share2, Link as LinkIcon, Twitter, MessageCircle, Send, Check } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Kbd } from '@/components/atoms/Kbd';
import { PopperContent, PopperRoot, PopperTrigger } from '@/components/atoms/Popper';
import { cn, ThemeType } from '@/lib/utils';

interface ShareButtonProps {
  title: string;
  theme?: ThemeType;
  className?: string;
}

export function ShareButton({ title, theme = 'default', className }: ShareButtonProps) {
  const [copied, setCopied] = React.useState(false);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = `Check out ${title} on dwizzyWEEB!`;

  const onCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const socialLinks = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
      color: 'text-green-500 hover:bg-green-500/10'
    },
    {
      name: 'Twitter',
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      color: 'text-sky-400 hover:bg-sky-400/10'
    },
    {
      name: 'Telegram',
      icon: Send,
      href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
      color: 'text-blue-400 hover:bg-blue-400/10'
    }
  ];

  return (
    <PopperRoot>
      <PopperTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className={cn("rounded-2xl border-zinc-800 hover:bg-white/5 transition-all", className)}
        >
          <Share2 className="w-5 h-5 text-zinc-400" />
        </Button>
      </PopperTrigger>
      
      <PopperContent
        data-theme={theme}
        className="w-64"
        contentClassName="space-y-4"
      >
          <h4 className="px-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Share this content</h4>
            
          <div className="grid grid-cols-1 gap-1">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'flex items-center gap-3 rounded-2xl p-3 text-sm font-bold transition-all',
                  link.color
                )}
              >
                <link.icon className="w-4 h-4" />
                {link.name}
              </a>
            ))}
          </div>

          <div className="mx-2 h-px bg-zinc-900" />

          <button
            type="button"
            onClick={onCopy}
            className="group flex w-full items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900 p-3 transition-all hover:bg-zinc-800"
          >
            <div className="flex items-center gap-3">
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <LinkIcon className="w-4 h-4 text-zinc-500" />}
              <span className={cn('text-sm font-bold', copied ? 'text-green-500' : 'text-zinc-300')}>
                {copied ? 'Copied!' : 'Copy Link'}
              </span>
            </div>
            {!copied && <Kbd>URL</Kbd>}
          </button>
      </PopperContent>
    </PopperRoot>
  );
}
