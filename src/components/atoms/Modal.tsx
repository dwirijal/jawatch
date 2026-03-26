'use client';

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { Backdrop } from '@/components/atoms/Backdrop';

export const ModalRoot = Dialog.Root;
export const ModalTrigger = Dialog.Trigger;
export const ModalClose = Dialog.Close;
export const ModalTitle = Dialog.Title;
export const ModalDescription = Dialog.Description;

interface ModalContentProps extends React.ComponentPropsWithoutRef<typeof Dialog.Content> {
  overlayClassName?: string;
}

export const ModalContent = React.forwardRef<
  React.ElementRef<typeof Dialog.Content>,
  ModalContentProps
>(({ className, overlayClassName, children, ...props }, ref) => {
  return (
    <Dialog.Portal>
      <Backdrop className={cn('z-[200]', overlayClassName)} />
      <Dialog.Content
        ref={ref}
        className={cn(
          'fixed left-1/2 top-1/2 z-[201] -translate-x-1/2 -translate-y-1/2 outline-none',
          className
        )}
        {...props}
      >
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  );
});

ModalContent.displayName = 'ModalContent';
