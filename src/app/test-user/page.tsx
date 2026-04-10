"use client"

import { useAuth } from "@/contexts/auth-context"

export default function TestUserPage() {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div className="p-8">Carregando...</div>
  }
  
  if (!user) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-600">Usuário não está logado</h1>
        <a href="/login" className="text-blue-600 underline">Ir para login</a>
      </div>
    )
  }
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dados do Usuário</h1>
      <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
        {JSON.stringify(user, null, 2)}
      </pre>
    </div>
  )
}