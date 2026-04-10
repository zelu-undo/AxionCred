"use client"

import { useAuth } from "@/contexts/auth-context"

export default function TestUserPage() {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }
  
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h1 className="text-xl font-bold text-red-600 mb-4">Usuário não está logado</h1>
          <a href="/login" className="text-blue-600 underline">Ir para login</a>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Dados do Usuário</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Email:</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Nome:</p>
              <p className="font-medium">{user.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Role:</p>
              <p className={`font-bold ${user.role === 'super_admin' ? 'text-amber-600' : 'text-gray-900'}`}>
                {user.role}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Plan:</p>
              <p className="font-medium">{user.plan}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tenant ID:</p>
              <p className="font-medium text-xs">{user.tenantId || 'Nenhum'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">User ID:</p>
              <p className="font-medium text-xs">{user.id}</p>
            </div>
          </div>
          
          {user.role === 'super_admin' ? (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800 font-bold">✓ Você é Super Admin!</p>
            </div>
          ) : (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-bold">✗ Você NÃO é Super Admin</p>
            </div>
          )}
        </div>
        
        <pre className="mt-6 bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto text-sm">
{JSON.stringify(user, null, 2)}
        </pre>
      </div>
    </div>
  )
}