'use client';

import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';

import { cn } from '../../lib/utils';

const buttonBase = `
  relative
  inline-flex items-center justify-center
  cursor-pointer
  space-x-2
  text-center
  font-normal
  ease-out
  duration-200
  rounded-md
  transition-all
  outline-0
  focus-visible:outline-4
  focus-visible:outline-offset-1
  border
  disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
`;

const buttonVariants = cva(buttonBase, {
  variants: {
    type: {
      primary: `
        bg-brand-500
        hover:brightness-110
        text-white
        border border-brand-highlight
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-brand-highlight
        focus-visible:ring-offset-2
        focus-visible:ring-offset-background
      `,
      default: `
        text-foreground
        bg-surface-100 dark:bg-surface-200
        hover:brightness-110
        border-border-strong hover:border-border-stronger
        focus-visible:outline-brand-highlight
      `,
      outline: `
        text-foreground
        bg-transparent
        hover:brightness-110
        border-border-strong hover:border-foreground-muted
        focus-visible:outline-border-strong
      `,
      danger: `
        text-foreground
        bg-destructive-300 dark:bg-destructive-400
        hover:brightness-110
        border-destructive-500 hover:border-destructive
      `,
    },
    size: {
      tiny: 'text-xs px-2.5 py-1 h-[26px]',
      small: 'text-sm px-3 py-2 h-[34px]',
      medium: 'text-sm px-4 py-2 h-[38px]',
      large: 'text-base px-4 py-2 h-[42px]',
    },
    block: { true: 'w-full' },
  },
  defaultVariants: { type: 'default', size: 'small' },
});

export interface ButtonProps
  extends
    Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  htmlType?: 'button' | 'submit' | 'reset';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, type, size, block, asChild, iconLeft, iconRight, htmlType, children, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    // Default native button type to "button" so a <Button> inside a <form>
    // doesn't accidentally submit when the caller hasn't opted in.
    const nativeType = asChild ? undefined : (htmlType ?? 'button');
    const content = asChild ? (
      children
    ) : (
      <>
        {iconLeft && <span className="inline-flex shrink-0">{iconLeft}</span>}
        {children && <span className="truncate">{children}</span>}
        {iconRight && <span className="inline-flex shrink-0">{iconRight}</span>}
      </>
    );
    return (
      <Comp
        ref={ref}
        type={nativeType}
        className={cn(buttonVariants({ type, size, block }), className)}
        {...props}
      >
        {content}
      </Comp>
    );
  }
);
Button.displayName = 'Button';
