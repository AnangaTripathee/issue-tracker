'use client';

import Link from 'next/link'
import { usePathname } from 'next/navigation';
import React from 'react'
import { BiSolidBug } from "react-icons/bi";
import classnames from 'classnames'; //contains classes we want to render



const NavBar = () => {
  const currentPath = usePathname();
  
  
  const links = [
    { label: 'Dashboard', href: '/'},
    { label: 'Issues', href: '/issues'}

  ]
  return (
    <nav className='flex space-x-6 border-b mb-5 px-5 h-14 n items-center'> 
        <Link href="/"><BiSolidBug></BiSolidBug></Link>
        <ul className='flex space-x-6'>
          {links.map(link => 
           <Link 
            key={link.href} 
            // styling active links
            className= {classnames({
              'text-zinc-900' : link.href == currentPath,
              'text-zinc-500' : link.href !== currentPath,
              'hover:text-zinc-800 transition-colors': true
            })} 
            href={link.href}>{link.label}</Link> )}
          
        </ul>
    </nav>
  )
}

export default NavBar