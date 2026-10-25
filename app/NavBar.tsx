'use client';

import Link from 'next/link'
import { usePathname } from 'next/navigation';
import React from 'react'
import { BiSolidBug } from "react-icons/bi";
import classnames from 'classnames'; //contains classes we want to render

const links = [
  { label: 'Issues', href: '/issues' },
  { label: 'New Issue', href: '/issues/new' }
]

// "Issues" stays highlighted on an issue's detail and edit pages too.
const isActive = (href: string, currentPath: string) =>
  href === '/issues'
    ? currentPath === '/issues' || (currentPath.startsWith('/issues/') && currentPath !== '/issues/new')
    : currentPath === href;

const NavBar = () => {
  const currentPath = usePathname();

  return (
    <nav className='flex space-x-6 border-b mb-5 px-5 h-14 items-center'>
        <Link href="/issues" aria-label="Issue Tracker home"><BiSolidBug aria-hidden="true" /></Link>
        <ul className='flex space-x-6'>
          {links.map(link =>
            <li key={link.href}>
              <Link
                // styling active links
                className={classnames({
                  'text-zinc-900 font-medium': isActive(link.href, currentPath),
                  'text-zinc-500': !isActive(link.href, currentPath),
                  'hover:text-zinc-800 transition-colors': true
                })}
                aria-current={isActive(link.href, currentPath) ? 'page' : undefined}
                href={link.href}>{link.label}</Link>
            </li>)}
        </ul>
    </nav>
  )
}

export default NavBar
