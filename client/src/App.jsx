import React from 'react'
import { AuthProvider } from './context/AuthContext'
import { CallProvider } from './context/CallContext'
import AppInner from './views/AppInner'

export default function App(){
  return (
    <AuthProvider>
      <CallProvider>
        <AppInner />
      </CallProvider>
    </AuthProvider>
  )
}
