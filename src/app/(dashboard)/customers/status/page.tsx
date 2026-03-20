'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, AlertCircle, Clock, TrendingUp } from 'lucide-react';
import { motion } from "framer-motion";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export default function CustomerStatusPage() {
  const [customers] = useState([
    { id: '1', name: 'João Silva', status: 'current', priority: 'high', debt: 5000, score: 850 },
    { id: '2', name: 'Maria Santos', status: 'overdue', priority: 'high', debt: 3500, score: 720 },
    { id: '3', name: 'Pedro Costa', status: 'default', priority: 'high', debt: 4800, score: 580 },
    { id: '4', name: 'Ana Pereira', status: 'current', priority: 'medium', debt: 1000, score: 790 },
  ])

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'current': return { label: 'Em dia', color: 'bg-green-100 text-green-700' };
      case 'overdue': return { label: 'Atrasado', color: 'bg-yellow-100 text-yellow-700' };
      case 'default': return { label: 'Inadimplente', color: 'bg-red-100 text-red-700' };
      default: return { label: 'Novo', color: 'bg-blue-100 text-blue-700' };
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 700) return 'text-green-600'
    if (score >= 600) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <motion.div 
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-gray-900">Status e Prioridade de Clientes</h1>
        <p className="text-gray-500 mt-1">Visualize o status e prioridade dos seus clientes</p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4" variants={itemVariants}>
        <Card className="border-l-4 border-l-[#22C55E] border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Em dia</p>
                <p className="text-2xl font-bold text-gray-900">{customers.filter(c => c.status === 'current').length}</p>
              </div>
              <div className="p-2 rounded-lg bg-[#22C55E]/10">
                <Users className="h-5 w-5 text-[#22C55E]" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-[#F59E0B] border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Atrasados</p>
                <p className="text-2xl font-bold text-[#F59E0B]">{customers.filter(c => c.status === 'overdue').length}</p>
              </div>
              <div className="p-2 rounded-lg bg-[#F59E0B]/10">
                <Clock className="h-5 w-5 text-[#F59E0B]" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-[#EF4444] border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Inadimplentes</p>
                <p className="text-2xl font-bold text-[#EF4444]">{customers.filter(c => c.status === 'default').length}</p>
              </div>
              <div className="p-2 rounded-lg bg-[#EF4444]/10">
                <AlertCircle className="h-5 w-5 text-[#EF4444]" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500 border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Alta Prioridade</p>
                <p className="text-2xl font-bold text-orange-600">{customers.filter(c => c.priority === 'high').length}</p>
              </div>
              <div className="p-2 rounded-lg bg-orange-100">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Table */}
      <motion.div variants={itemVariants}>
        <Card className="border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="pb-4 border-b border-gray-100/50">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-[#1E3A8A]/10">
                <Users className="h-5 w-5 text-[#1E3A8A]" />
              </div>
              <CardTitle className="text-lg font-semibold">Lista de Clientes</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="rounded-md border border-gray-100">
              <table className="w-full">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Cliente</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Prioridade</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Dívida</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customers.map((customer) => {
                    const statusInfo = getStatusInfo(customer.status);
                    return (
                      <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium">{customer.name}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={customer.priority === 'high' ? 'text-red-600 font-medium' : 'text-yellow-600'}>
                            {customer.priority === 'high' ? 'Alta' : 'Média'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">R$ {customer.debt.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={getScoreColor(customer.score)}>{customer.score}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
