'use client';

import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ShareButtonProps {
  title?: string;
  text?: string;
  url?: string;
  variant?: 'outline' | 'ghost' | 'default';
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ShareButton({
  title = 'Meet my AI Soulmate on LauraAI',
  text = 'I just minted my sovereign AI companion on BSC. Start your Chat-to-Earn journey with LauraAI!',
  url = typeof window !== 'undefined' ? window.location.href : 'https://laura-ai.com',
  variant = 'outline',
  className,
  size = 'default',
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // no-op fallback, keep UI stable
    }
  };

  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&via=LauraAI_BSC`;
    window.open(twitterUrl, '_blank');
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          size={size}
          type="button"
          className={cn('rounded-full border-white/10 hover:bg-white/10 text-white', className)}
        >
          <img
            src="/icons/3d/share_3d.png"
            className={size === 'icon' ? 'w-5 h-5 object-contain' : 'w-4 h-4 object-contain mr-2'}
            alt=""
          />
          {size !== 'icon' && 'Share'}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        side="top"
        align="center"
        sideOffset={12}
        className="z-[1400] w-[280px] liquid-glass-card rounded-2xl border-white/20 p-4"
      >
        <h3 className="text-base font-bold text-white mb-1">Share LauraAI</h3>
        <p className="text-white/90 text-xs mb-3">Spread the word and invite others.</p>

        <div className="space-y-2">
          <Button
            type="button"
            onClick={shareToTwitter}
            className="w-full bg-[#1DA1F2] hover:bg-[#1DA1F2]/90 text-white font-bold h-10 rounded-xl gap-2"
          >
            <img src="/icons/3d/share_3d.png" className="w-4 h-4 object-contain" alt="" />
            Share on Twitter
          </Button>

          <Button
            variant="outline"
            type="button"
            onClick={handleCopy}
            className="w-full bg-white/5 border border-white/20 hover:bg-white/10 text-white h-10 rounded-xl gap-2"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <img src="/icons/3d/copy_3d.png" className="w-4 h-4 object-contain" alt="" />
            )}
            {copied ? 'Copied!' : 'Copy Link'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
