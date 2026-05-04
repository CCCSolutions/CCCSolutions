import { cn } from '../../lib/utils';

interface SectionContainerProps extends React.HTMLAttributes<HTMLElement> {
  size?: 'small' | 'medium' | 'large' | 'default' | 'full';
}

const widths: Record<NonNullable<SectionContainerProps['size']>, string> = {
  small: 'max-w-3xl',
  medium: 'max-w-5xl',
  large: 'max-w-7xl',
  default: 'max-w-5xl',
  full: 'w-full',
};

export function SectionContainer({
  size = 'default',
  className,
  ...props
}: SectionContainerProps) {
  return <section className={cn(widths[size], 'mx-auto px-8', className)} {...props} />;
}
