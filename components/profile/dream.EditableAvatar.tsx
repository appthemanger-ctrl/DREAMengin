'use client';

import type { CSSProperties, MouseEvent, ReactNode } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

type EditableAvatarProps = {
  src?: string | null;
  name: string;
  size: number;
  href?: string;
  className?: string;
  style?: CSSProperties;
  imageClassName?: string;
  imageStyle?: CSSProperties;
  fallbackClassName?: string;
  fallbackStyle?: CSSProperties;
  title?: string;
  ariaLabel?: string;
  stopPropagation?: boolean;
  onClick?: () => void;
  children?: ReactNode;
};

export default function EditableAvatar({
  src,
  name,
  size,
  href,
  className,
  style,
  imageClassName,
  imageStyle,
  fallbackClassName,
  fallbackStyle,
  title,
  ariaLabel,
  stopPropagation = false,
  onClick,
  children,
}: EditableAvatarProps) {
  const router = useRouter();
  const isInteractive = Boolean(href || onClick);
  const initials = (name || '?').trim().charAt(0).toUpperCase() || '?';

  const sharedStyle: CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    overflow: 'hidden',
    position: 'relative',
    flexShrink: 0,
    ...style,
  };

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (stopPropagation) {
      event.stopPropagation();
    }
    onClick?.();
    if (href) {
      router.push(href);
    }
  };

  const content = src ? (
    <Image
      src={src}
      alt={name}
      width={size}
      height={size}
      className={imageClassName}
      style={imageStyle}
    />
  ) : (
    <span className={fallbackClassName} style={fallbackStyle}>
      {initials}
    </span>
  );

  if (!isInteractive) {
    return (
      <div className={className} style={sharedStyle} title={title} aria-hidden={title ? undefined : true}>
        {content}
        {children}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
      style={{
        ...sharedStyle,
        border: 'none',
        padding: 0,
        background: 'none',
        cursor: 'pointer',
      }}
      title={title}
      aria-label={ariaLabel ?? title ?? 'Edit profile'}
    >
      {content}
      {children}
    </button>
  );
}
