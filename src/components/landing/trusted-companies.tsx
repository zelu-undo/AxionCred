"use client"

import { useMemo } from "react"

interface Company {
  name: string
  type: string
  color: string
  location: string
  years: string
}

const companies: Company[] = [
  { name: "Supermercado Kyoto", type: "Supermercado", color: "from-amber-500 to-orange-600", location: "São Paulo, SP", years: "3 anos" },
  { name: "Drogaria Santa Marta", type: "Farmácia", color: "from-green-500 to-emerald-600", location: "Curitiba, PR", years: "2 anos" },
  { name: "Restaurante Tempero & Sabor", type: "Restaurante", color: "from-red-500 to-rose-600", location: "Belo Horizonte, MG", years: "4 anos" },
  { name: "Ateliê Costura Fina", type: "Confecção", color: "from-pink-500 to-rose-500", location: "Rio de Janeiro, RJ", years: "2 anos" },
  { name: "Auto Center Rodas & Pneus", type: "Automotivo", color: "from-slate-500 to-zinc-600", location: "Campinas, SP", years: "5 anos" },
  { name: "Pet Shop Patudo & Mia", type: "Petshop", color: "from-teal-500 to-cyan-600", location: "Porto Alegre, RS", years: "1 ano" },
  { name: "Padaria Artesanal do Bairro", type: "Padaria", color: "from-yellow-500 to-amber-600", location: "Recife, PE", years: "6 anos" },
  { name: "Loja de Roupas Essenza", type: "Moda", color: "from-purple-500 to-violet-600", location: "Salvador, BA", years: "2 anos" },
]

function CompanyLogo({ company, index }: { company: Company; index: number }) {
  const initials = company.name.split(" ").map((w) => w[0]).slice(0, 2).join("")
  
  return (
    <div 
      className="group relative bg-white/5 border border-white/10 rounded-xl p-4 hover:border-[#22C55E]/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#22C55E]/10 animate-fade-in-up"
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
      
      {/* Credibility Badges */}
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 text-xs text-white/40">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          {company.location}
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-[#22C55E]">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          Cliente há {company.years}
        </span>
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
