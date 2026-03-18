'use client';

import { useState } from 'react';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

export default function StaffManagementPage() {
  const [staff, setStaff] = useState<StaffMember[]>([
    { id: '1', name: 'João Silva', email: 'joao@axioncred.com.br', role: 'admin', status: 'active' },
    { id: '2', name: 'Maria Santos', email: 'maria@axioncred.com.br', role: 'operator', status: 'active' },
  ]);
  const [message, setMessage] = useState('');

  const handleAddStaff = () => {
    setStaff([...staff, { id: String(Date.now()), name: 'Novo Funcionário', email: 'email@empresa.com', role: 'operator', status: 'active' }]);
    setMessage('Funcionário adicionado!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleDeleteStaff = (id: string) => {
    setStaff(staff.filter(m => m.id !== id));
    setMessage('Funcionário removido!');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestão de Funcionários</h1>
        <button onClick={handleAddStaff} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          + Adicionar Funcionário
        </button>
      </div>
      {message && <div className="px-4 py-2 bg-green-100 text-green-700 rounded">{message}</div>}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Nome</th>
              <th className="px-4 py-3 text-left">E-mail</th>
              <th className="px-4 py-3 text-left">Perfil</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => (
              <tr key={member.id} className="border-t">
                <td className="px-4 py-3">{member.name}</td>
                <td className="px-4 py-3 text-gray-600">{member.email}</td>
                <td className="px-4 py-3">
                  <select defaultValue={member.role} className="px-2 py-1 border rounded text-sm">
                    <option value="admin">Administrador</option>
                    <option value="manager">Gerente</option>
                    <option value="operator">Operador</option>
                    <option value="viewer">Visualizador</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-sm ${member.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {member.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDeleteStaff(member.id)} className="text-red-600 hover:text-red-800">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
