import React, { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import LoginPage from './LoginPage'
import ChatLayout from './ChatLayout'
import CallModal from '../components/CallModal'

export default function AppInner(){
  const { user } = useContext(AuthContext);
  return user ? (
    <>
      <ChatLayout />
      <CallModal />
    </>
  ) : (
    <LoginPage />
  );
}
