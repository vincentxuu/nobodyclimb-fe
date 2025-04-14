'use client';

import React from 'react';
import { default as NextLink } from 'next/link';

type LinkProps = React.ComponentProps<typeof NextLink>;

/**
 * 統一的鏈接組件
 */
export function Link(props: LinkProps) {
  return <NextLink {...props} />;
}
