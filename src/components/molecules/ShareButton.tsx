'use client';

import * as React from 'react';
import { Share2, Link as LinkIcon, Twitter, MessageCircle, Send, Check } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Kbd } from '@/components/atoms/Kbd';
import { PopoverContent, PopoverRoot, PopoverTrigger } from '@/components/atoms/Popover';
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
      color: 'text-[var(--signal-success)] hover:bg-green-500/10'
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
    <PopoverRoot>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className={cn("h-[var(--size-control-md)] w-[var(--size-control-md)] rounded-2xl border-border-subtle hover:bg-white/5 transition-all", className)}
          aria-label="Bagikan konten"
        >
          <Share2 className="w-5 h-5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent
        data-theme={theme}
        className="w-64"
        contentClassName="space-y-4"
      >
          <h4 className="px-[var(--space-xs)] text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] text-muted-foreground">Bagikan konten ini</h4>

          {canUseNativeShare ? (
            <button
              type="button"
              onClick={onNativeShare}
              className="flex w-full cursor-pointer items-center gap-[var(--space-sm)] rounded-2xl p-[var(--space-sm)] text-sm font-bold text-foreground/90 transition-all hover:bg-white/10"
            >
              <Share2 className="h-4 w-4 text-muted-foreground" />
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
                  'flex cursor-pointer items-center gap-[var(--space-sm)] rounded-2xl p-[var(--space-sm)] text-sm font-bold transition-all',
                  link.color
                )}
              >
                <link.icon className="w-4 h-4" />
                {link.name}
              </a>
            ))}
          </div>

          <div className="mx-2 h-px bg-surface-1" />

          <button
            type="button"
            onClick={onCopy}
            className="group flex w-full cursor-pointer items-center justify-between rounded-2xl border border-border-subtle bg-surface-1 p-[var(--space-sm)] transition-all hover:bg-surface-2"
          >
            <div className="flex items-center gap-[var(--space-sm)]">
              {copied ? <Check className="w-4 h-4 text-[var(--signal-success)]" /> : <LinkIcon className="w-4 h-4 text-muted-foreground" />}
              <span className={cn('text-sm font-bold', copied ? 'text-[var(--signal-success)]' : 'text-foreground/80')}>
                {copied ? 'Link disalin' : 'Salin link'}
              </span>
            </div>
            {!copied && <Kbd>URL</Kbd>}
          </button>
      </PopoverContent>
    </PopoverRoot>
  );
}
