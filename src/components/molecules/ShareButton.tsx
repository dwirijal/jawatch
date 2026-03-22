'use client';

import * as React from 'react';
import { Share2, Link as LinkIcon, Twitter, MessageCircle, Send, Check } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { Button } from '@/components/atoms/Button';
import { cn, THEME_CONFIG, ThemeType } from '@/lib/utils';

interface ShareButtonProps {
  title: string;
  theme?: ThemeType;
  className?: string;
}

export function ShareButton({ title, theme = 'default', className }: ShareButtonProps) {
  const [copied, setCopied] = React.useState(false);
  const config = THEME_CONFIG[theme] || THEME_CONFIG.default;

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
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className={cn("rounded-2xl border-zinc-800 hover:bg-white/5 transition-all", className)}
        >
          <Share2 className="w-5 h-5 text-zinc-400" />
        </Button>
      </Popover.Trigger>
      
      <Popover.Portal>
        <Popover.Content 
          className="z-[250] w-64 p-4 rounded-[2rem] bg-zinc-950 border border-zinc-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          sideOffset={8}
          align="end"
        >
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 px-2">Share this content</h4>
            
            <div className="grid grid-cols-1 gap-1">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-2xl transition-all font-bold text-sm",
                    link.color
                  )}
                >
                  <link.icon className="w-4 h-4" />
                  {link.name}
                </a>
              ))}
            </div>

            <div className="h-px bg-zinc-900 mx-2" />

            <button
              onClick={onCopy}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-all group"
            >
              <div className="flex items-center gap-3">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <LinkIcon className="w-4 h-4 text-zinc-500" />}
                <span className={cn("text-sm font-bold", copied ? "text-green-500" : "text-zinc-300")}>
                  {copied ? 'Copied!' : 'Copy Link'}
                </span>
              </div>
              {!copied && <kbd className="text-[9px] font-black bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800 text-zinc-600">URL</kbd>}
            </button>
          </div>
          <Popover.Arrow className="fill-zinc-800" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
