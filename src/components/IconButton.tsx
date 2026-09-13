import type { ReactNode } from 'react';

type Props = {
  label: string;
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'solid' | 'ghost';
  size?: 'medium' | 'large';
  disabled?: boolean;
};

/**
 * The one button shape in the app: outlined rounded rectangle, never a circle.
 * Size varies by context; the shape and radius family do not.
 */
export function IconButton({
  label,
  children,
  onClick,
  type = 'button',
  variant = 'solid',
  size = 'medium',
  disabled = false,
}: Props) {
  return (
    <button
      className="icon-button"
      data-variant={variant}
      data-size={size}
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}
