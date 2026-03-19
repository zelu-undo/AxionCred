"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import { 
  TrendingUp, 
  Users, 
  CreditCard, 
  MessageCircle, 
  CheckCircle,
  ArrowRight,
  Menu,
  X,
  Lock,
  AlertCircle,
  Check,
  Wallet
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (user) {
      router.push("/dashboard")
    }
  }, [user, router])

  const features = [
    {
      icon: Users,
      title: "Veja quem te deve",
      description: "Lista completa de todos os clientes e o quanto cada um deve."
    },
    {
      icon: CreditCard,
      title: "Controle parcelas automaticamente",
      description: "O sistema controla as parcelas e avisa quando vence."
    },
    {
      icon: MessageCircle,
      title: "Cobre pelo WhatsApp",
      description: "Envie cobrança com 1 clique direto pelo WhatsApp."
    },
    {
      icon: AlertCircle,
      title: "Saiba quem está atrasado",
      description: "Visualize rapidamente quem está devendo e há quanto tempo."
    },
    {
      icon: CheckCircle,
      title: "Tenha tudo organizado",
      description: "Esqueça o papel e planilhas. Tudo salvo com segurança."
    },
    {
      icon: Wallet,
      title: "Receba mais",
      description: "Cobre em dia e pare de perder dinheiro no fiado."
    },
  ]

  const benefits = [
    "Nunca mais esqueça uma parcela",
    "Receba mais sem esforço",
    "Tenha controle total do seu dinheiro",
    "Pare de perder dinheiro no fiado"
  ]

  const testimonials = [
    {
      text: "Nunca mais perdi uma cobrança. O AXION me ajuda a receber tudo em dia.",
      name: "João",
      role: "Dono de mercado"
    },
    {
      text: "Agora sei exatamente quem me deve. Meu faturamento aumentou 30%.",
      name: "Maria",
      role: "Loja de variedades"
    }
  ]

  return (
    <div className="min-h-screen bg-[#1E3A8A]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#1E3A8A]/95 backdrop-blur-sm border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#22C55E]">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">AXION</span>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#problema" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Problema</a>
              <a href="#solucao" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Solução</a>
              <a href="#recursos" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Recursos</a>
            </nav>

            <div className="hidden md:flex items-center gap-4">
              <Button asChild variant="ghost" className="text-white hover:text-[#22C55E] hover:bg-white/10">
                <Link href="/login">Entrar</Link>
              </Button>
              <Button asChild className="bg-[#22C55E] hover:bg-[#4ADE80] text-white font-semibold">
                <Link href="/demo">Começar Agora</Link>
              </Button>
            </div>

            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6 text-white" /> : <Menu className="h-6 w-6 text-white" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-[#1E3A8A] px-4 py-4">
            <nav className="flex flex-col gap-4">
              <a href="#problema" className="text-sm font-medium text-white/70 py-2" onClick={() => setMobileMenuOpen(false)}>Problema</a>
              <a href="#solucao" className="text-sm font-medium text-white/70 py-2" onClick={() => setMobileMenuOpen(false)}>Solução</a>
              <a href="#recursos" className="text-sm font-medium text-white/70 py-2" onClick={() => setMobileMenuOpen(false)}>Recursos</a>
              <hr className="border-white/10 my-2" />
              <div className="flex gap-2">
                <Button asChild variant="ghost" className="text-white flex-1 hover:bg-white/10">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>Entrar</Link>
                </Button>
                <Button asChild className="bg-[#22C55E] hover:bg-[#4ADE80] text-white font-semibold flex-1">
                  <Link href="/demo" onClick={() => setMobileMenuOpen(false)}>Começar Agora</Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 px-4 py-2 text-sm font-medium text-[#22C55E] mb-6">
                <span className="flex h-2 w-2 rounded-full bg-[#22C55E] animate-pulse"></span>
                Para quem vende fiado e quer receber
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl leading-tight">
                .Saiba exatamente quem te <span className="text-[#22C55E]">deve</span> — e cobre em segundos
              </h1>
              <p className="mt-6 text-lg text-white/70 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Controle clientes, parcelas e atrasos em um só lugar. Envie cobranças pelo WhatsApp com um clique.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" asChild className="bg-[#22C55E] hover:bg-[#4ADE80] text-white font-semibold text-lg px-8">
                  <Link href="/demo">
                    Começar a cobrar agora
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="border-white/30 text-white hover:bg-white/10 hover:text-white">
                  <Link href="#recursos">Ver como funciona</Link>
                </Button>
              </div>
              <div className="mt-8 flex items-center gap-6 justify-center lg:justify-start">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-10 w-10 rounded-full bg-gradient-to-br from-[#22C55E] to-green-700 border-2 border-[#1E3A8A] flex items-center justify-center text-white text-xs font-bold">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <p className="text-white/70 text-sm">
                  <span className="text-white font-semibold">+500 comerciantes</span> já usam
                </p>
              </div>
            </div>

            {/* Phone Mockup */}
            <div className="mt-12 lg:mt-0 flex justify-center">
              <div className="relative">
                <div className="absolute -inset-4 bg-[#22C55E]/20 rounded-3xl"></div>
                <div className="relative w-[320px] h-[640px] bg-[#1E3A8A] rounded-[3rem] border-8 border-gray-800 overflow-hidden shadow-2xl">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-[#1E3A8A] rounded-b-2xl z-20"></div>
                  <div className="h-full pt-14 px-4 pb-4 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#22C55E]">
                          <TrendingUp className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-white font-bold">AXION</span>
                      </div>
                      <span className="text-white/50 text-xs">Hoje, 19 mar</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-white/10 rounded-xl p-3">
                        <p className="text-white/60 text-xs">A receber</p>
                        <p className="text-[#22C55E] font-bold text-xl">R$ 2.450</p>
                      </div>
                      <div className="bg-red-500/20 rounded-xl p-3">
                        <p className="text-red-400 text-xs">Atrasados</p>
                        <p className="text-red-400 font-bold text-xl">R$ 380</p>
                      </div>
                    </div>

                    <div className="flex-1 space-y-2 overflow-hidden">
                      <p className="text-white/50 text-xs mb-2">CLIENTES</p>
                      
                      <div className="bg-red-500/10 rounded-xl p-3 border border-red-500/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-red-500/30 flex items-center justify-center text-red-400 font-bold">J</div>
                            <div>
                              <p className="text-white font-medium text-sm">João</p>
                              <p className="text-red-400 text-xs">Atrasado 3 dias</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-semibold text-sm">R$ 150</p>
                            <button className="text-[#22C55E] text-xs flex items-center gap-1 hover:underline">
                              <MessageCircle className="h-3 w-3" /> Cobrar
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#22C55E]/10 rounded-xl p-3 border border-[#22C55E]/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-[#22C55E]/30 flex items-center justify-center text-[#22C55E] font-bold">M</div>
                            <div>
                              <p className="text-white font-medium text-sm">Maria</p>
                              <p className="text-[#22C55E] text-xs">Pago hoje</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-semibold text-sm">R$ 200</p>
                            <Check className="h-4 w-4 text-[#22C55E] ml-auto" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-yellow-500/10 rounded-xl p-3 border border-yellow-500/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-yellow-500/30 flex items-center justify-center text-yellow-400 font-bold">C</div>
                            <div>
                              <p className="text-white font-medium text-sm">Carlos</p>
                              <p className="text-yellow-500 text-xs">Vence hoje</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-semibold text-sm">R$ 100</p>
                            <button className="text-[#22C55E] text-xs flex items-center gap-1 hover:underline">
                              <MessageCircle className="h-3 w-3" /> Cobrar
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/5 rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 font-bold">A</div>
                            <div>
                              <p className="text-white font-medium text-sm">Ana</p>
                              <p className="text-white/40 text-xs">Vence em 2 dias</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-semibold text-sm">R$ 75</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button className="mt-3 w-full bg-[#22C55E] hover:bg-[#4ADE80] text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
                      <Users className="h-4 w-4" />
                      Ver todos os clientes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problema" className="py-20 bg-[#172554]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl mb-6">
            Você vende… mas não recebe como deveria
          </h2>
          <p className="text-lg text-white/60 mb-10 max-w-2xl mx-auto">
            Anotar no papel, esquecer cobranças e não saber quem está devendo faz você perder dinheiro todos os meses.
          </p>
          <div className="grid md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
            {[
              "Esquece quem já pagou",
              "Não sabe quem está atrasado",
              "Fica sem jeito de cobrar",
              "Perde dinheiro no fiado"
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3 bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="h-6 w-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <X className="h-4 w-4 text-red-400" />
                </div>
                <span className="text-white/80">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="solucao" className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 px-4 py-2 text-sm font-medium text-[#22C55E] mb-6">
            <CheckCircle className="h-4 w-4" />
            A solução
          </div>
          <h2 className="text-3xl font-bold text-white sm:text-4xl mb-6">
            O AXION organiza tudo pra você
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Tenha controle total dos seus recebimentos e saiba exatamente quem cobrar e quando.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="recursos" className="py-20 bg-[#172554]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Tudo que você precisa
            </h2>
            <p className="mt-4 text-lg text-white/60 max-w-2xl mx-auto">
              Recursos simples que funcionam de verdade
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="bg-[#2A4A9F] rounded-2xl p-6 border border-white/10 hover:border-[#22C55E]/50 transition-colors group">
                <div className="h-12 w-12 rounded-xl bg-[#22C55E]/10 flex items-center justify-center mb-4 group-hover:bg-[#22C55E]/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-[#22C55E]" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-white/60 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white sm:text-4xl mb-6">
                Por que usar o AXION?
              </h2>
              <p className="text-lg text-white/60 mb-8">
                Simples, prático e feito para quem quer receber mais.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-[#22C55E]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-4 w-4 text-[#22C55E]" />
                    </div>
                    <span className="text-white text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-12 lg:mt-0">
              <div className="bg-[#2A4A9F] rounded-2xl p-8 border border-white/10">
                <div className="space-y-6">
                  {[
                    { label: "Clientes cadastrados", value: "248", change: "+12%" },
                    { label: "Parcelas receber", value: "156", change: "+8%" },
                    { label: "Taxa de recebimento", value: "94%", change: "+5%" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                      <div>
                        <p className="text-sm text-white/60">{item.label}</p>
                        <p className="text-2xl font-bold text-white">{item.value}</p>
                      </div>
                      <span className="text-sm font-medium text-[#22C55E] bg-[#22C55E]/10 px-3 py-1 rounded-full">
                        {item.change}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-[#172554]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              O que dizem os comerciantes
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-[#2A4A9F] rounded-2xl p-8 border border-white/10">
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="h-5 w-5 text-[#22C55E]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-white/80 text-lg mb-6 italic">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#22C55E] to-green-700 flex items-center justify-center text-white font-bold">
                    {testimonial.name[0]}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{testimonial.name}</p>
                    <p className="text-white/60 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-3 text-white/60">
            <Lock className="h-5 w-5" />
            <span>Seus dados protegidos com segurança de nível bancário</span>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-[#2A4A9F] rounded-3xl p-12 border border-white/10">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">
              Pare de perder dinheiro no fiado
            </h2>
            <p className="text-lg text-white/60 mb-8 max-w-xl mx-auto">
              Comece agora e tenha controle total dos seus recebimentos.
            </p>
            <Button size="lg" asChild className="bg-[#22C55E] hover:bg-[#4ADE80] text-white font-semibold text-lg px-10 py-6">
              <Link href="/demo">
                Começar a cobrar agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#172554] py-12 border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#22C55E]">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">AXION</span>
              </div>
              <p className="text-white/50 text-sm">
                Sistema simples de controle de empréstimos, parcelas e cobranças via WhatsApp.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><a href="#recursos" className="hover:text-[#22C55E] transition-colors">Recursos</a></li>
                <li><a href="#" className="hover:text-[#22C55E] transition-colors">Preços</a></li>
                <li><a href="#" className="hover:text-[#22C55E] transition-colors">Como funciona</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Ajuda</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><a href="#" className="hover:text-[#22C55E] transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-[#22C55E] transition-colors">Contato</a></li>
                <li><a href="#" className="hover:text-[#22C55E] transition-colors">Suporte</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><a href="#" className="hover:text-[#22C55E] transition-colors">Privacidade</a></li>
                <li><a href="#" className="hover:text-[#22C55E] transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-[#22C55E] transition-colors">Segurança</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/40 text-sm">© 2024 AXION. Todos os direitos reservados.</p>
            <Button variant="ghost" className="text-[#22C55E] hover:text-[#22C55E] hover:bg-[#22C55E]/10">
              <MessageCircle className="h-4 w-4 mr-2" />
              Falar no WhatsApp
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}
