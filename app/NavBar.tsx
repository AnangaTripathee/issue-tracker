import Link from 'next/link'
import React from 'react'
import { BiSolidBug } from "react-icons/bi";


const NavBar = () => {
  
  const links = [
    { label: 'Dashboard', href: '/'},
    { label: 'Issues', href: '/'}

  ]
  return (
    <nav className='flex space-x-6 border-b mb-5 px-5 h-14 n items-center'> 
        <Link href="/"><BiSolidBug></BiSolidBug></Link>
        <ul className='flex space-x-6'>
          {links.map(link => 
           <Link 
            key={link.href} 
            className= 'text-zinc-500 hover:text-zinc-800 transition-colors' 
            href={link.href}>{link.label}</Link> )}
          
        </ul>
    </nav>
  )
}

export default NavBar