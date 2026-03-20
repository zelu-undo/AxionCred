"use client"

import { useMemo } from "react"

interface Company {
  name: string
  type: string
  color: string
}

const companies: Company[] = [
  { name: "Mercado Central", type: "Supermercado", color: "from-amber-500 to-orange-600" },
  { name: "Farmácia Saúde", type: "Farmácia", color: "from-green-500 to-emerald-600" },
  { name: "Restaurante Sabor", type: "Restaurante", color: "from-red-500 to-rose-600" },
  { name: "Loja Mode", type: "Moda", color: "from-purple-500 to-violet-600" },
  { name: "Atelier Costura", type: "Confecção", color: "from-pink-500 to-rose-500" },
  { name: "Auto Peças", type: "Automotivo", color: "from-slate-500 to-zinc-600" },
  { name: "Pet Shop Amigo", type: "Petshop", color: "from-teal-500 to-cyan-600" },
  { name: "Padaria Pão", type: "Padaria", color: "from-yellow-500 to-amber-600" },
]

function CompanyLogo({ company, index }: { company: Company; index: number }) {
  const initials = company.name.split(" ").map((w) => w[0]).slice(0, 2).join("")
  
  return (
    <div 
      className="group relative bg-white/5 border border-white/10 rounded-xl p-4 hover:border-[#22C55E]/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#22C55E]/10"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-center gap-3">
        {/* Logo Circle */}
        <div 
          className={`w-12 h-12 rounded-lg bg-gradient-to-br ${company.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
        >
          <span className="text-white font-bold text-sm">{initials}</span>
        </div>
        
        {/* Company Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-semibold text-sm truncate group-hover:text-[#22C55E] transition-colors">
            {company.name}
          </h4>
          <p className="text-white/50 text-xs">{company.type}</p>
        </div>
      </div>
      
      {/* Status Badge */}
      <div className="absolute -top-2 -right-2 bg-[#22C55E] text-white text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Ativo
      </div>
    </div>
  )
}

export function TrustedCompanies() {
  const memoizedCompanies = useMemo(() => companies, [])
  
  return (
    <section className="py-16 bg-[#0B1F3A] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#22C55E]/5 rounded-full blur-3xl" />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#22C55E]/10 text-[#22C55E] px-4 py-2 rounded-full text-sm font-medium mb-4">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            +500 comerciantes ativos
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Empresas que confiam no AXION
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            Milhares de pequenos negócios já simplificaram sua cobrança diária
          </p>
        </div>
        
        {/* Companies Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {memoizedCompanies.map((company, index) => (
            <CompanyLogo 
              key={company.name} 
              company={company} 
              index={index}
            />
          ))}
        </div>
        
        {/* Stats Row */}
        <div className="mt-12 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-[#22C55E] mb-2">+500</div>
            <div className="text-white/60 text-sm">Comércios</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-[#22C55E] mb-2">R$2M+</div>
            <div className="text-white/60 text-sm">Cobrados</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-[#22C55E] mb-2">98%</div>
            <div className="text-white/60 text-sm">Satisfação</div>
          </div>
        </div>
      </div>
    </section>
  )
}
