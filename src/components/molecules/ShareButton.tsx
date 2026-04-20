'use client';

import * as React from 'react';
import { Share2, Link as LinkIcon, Twitter, MessageCircle, Send, Check } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Kbd } from '@/components/atoms/Kbd';
import { PopperContent, PopperRoot, PopperTrigger } from '@/components/atoms/Popper';
import { trackMarketingEvent } from '@/lib/marketing-events';
import { buildShareText, type ShareMediaType } from '@/lib/marketing';
import { cn, ThemeType } from '@/lib/utils';

interface ShareButtonProps {
  title: string;
  mediaType?: ShareMediaType;
  theme?: ThemeType;
  className?: string;
}

export function ShareButton({ title, mediaType = 'media', theme = 'default', className }: ShareButtonProps) {
  const [copied, setCopied] = React.useState(false);
  const [shareUrl, setShareUrl] = React.useState('');
  const [canUseNativeShare, setCanUseNativeShare] = React.useState(false);

  React.useEffect(() => {
    setShareUrl(window.location.href);
    setCanUseNativeShare(typeof navigator.share === 'function');
  }, []);

  const shareText = buildShareText({ title, mediaType });
  const resolvedShareUrl = shareUrl || (typeof window !== 'undefined' ? window.location.href : '');

  const onNativeShare = async () => {
    if (!canUseNativeShare) {
      return;
    }

    await navigator.share({
      title,
      text: shareText,
      url: resolvedShareUrl,
    }).catch(() => undefined);
    trackMarketingEvent('share_native', { title, mediaType });
  };

  const onCopy = async () => {
    await navigator.clipboard?.writeText(resolvedShareUrl).catch(() => undefined);
    trackMarketingEvent('share_copy', { title, mediaType });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const socialLinks = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${resolvedShareUrl}`)}`,
      color: 'text-green-500 hover:bg-green-500/10'
    },
    {
      name: 'X / Twitter',
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(resolvedShareUrl)}`,
      color: 'text-sky-400 hover:bg-sky-400/10'
    },
    {
      name: 'Telegram',
      icon: Send,
      href: `https://t.me/share/url?url=${encodeURIComponent(resolvedShareUrl)}&text=${encodeURIComponent(shareText)}`,
      color: 'text-blue-400 hover:bg-blue-400/10'
    }
  ];

  return (
    <PopperRoot>
      <PopperTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className={cn("h-11 w-11 rounded-2xl border-zinc-800 hover:bg-white/5 transition-all", className)}
          aria-label="Bagikan konten"
        >
          <Share2 className="w-5 h-5 text-zinc-400" />
        </Button>
      </PopperTrigger>
      
      <PopperContent
        data-theme={theme}
        className="w-64"
        contentClassName="space-y-4"
      >
          <h4 className="px-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Bagikan konten ini</h4>

          {canUseNativeShare ? (
            <button
              type="button"
              onClick={onNativeShare}
              className="flex w-full cursor-pointer items-center gap-3 rounded-2xl p-3 text-sm font-bold text-zinc-200 transition-all hover:bg-white/10"
            >
              <Share2 className="h-4 w-4 text-zinc-500" />
              Bagikan via perangkat
            </button>
          ) : null}
            
          <div className="grid grid-cols-1 gap-1">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackMarketingEvent('share_social', { title, mediaType, network: link.name })}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-2xl p-3 text-sm font-bold transition-all',
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
            className="group flex w-full cursor-pointer items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900 p-3 transition-all hover:bg-zinc-800"
          >
            <div className="flex items-center gap-3">
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <LinkIcon className="w-4 h-4 text-zinc-500" />}
              <span className={cn('text-sm font-bold', copied ? 'text-green-500' : 'text-zinc-300')}>
                {copied ? 'Link disalin' : 'Salin link'}
              </span>
            </div>
            {!copied && <Kbd>URL</Kbd>}
          </button>
      </PopperContent>
    </PopperRoot>
  );
}
