'use client'

import { default as NextLink } from 'next/link'
import React from 'react'

type LinkProps = React.ComponentProps<typeof NextLink>

/**
 * 統一的鏈接組件
 */
export function Link(props: LinkProps) {
  return <NextLink {...props} />
}
