'use client'

import type { ReactNode } from 'react'
import Sidebar from '@/app/components/Sidebar'
import Input from '@/app/components/Input'

interface AppShellProps {
   children: ReactNode
}

export default function AppShell({ children }: AppShellProps) {
   return (
      <div className="app-shell">
         <div className="app-overlay">
            <Sidebar />
            <Input />
         </div>
         <main className="app-content">
            {children}
         </main>

      </div>
   )
}
