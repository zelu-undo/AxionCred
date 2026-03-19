import Link from "next/link"
import Image from "next/image"
import { CheckCircle, ArrowRight, Users, Clock, AlertTriangle, Shield, MessageCircle, DollarSign, TrendingUp, CreditCard, BarChart3, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0B1F3A]">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0B1F3A]/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">AXI</span>
              <span className="text-2xl font-bold text-[#22C55E]">ON</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#como-funciona" className="text-white/70 hover:text-white font-medium transition-colors">Como Funciona</a>
              <a href="#beneficios" className="text-white/70 hover:text-white font-medium transition-colors">Benefícios</a>
            </nav>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10">Entrar</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-[#22C55E] hover:bg-[#4ADE80] text-white font-semibold px-6">Começar Agora</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-28 bg-[#0B1F3A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-[#22C55E]/20 text-[#22C55E] px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Users className="h-4 w-4" />
              Para quem vende fiado e quer receber
            </div>
            
            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Saiba exatamente quem te deve — e cobre em segundos
            </h1>
            
            {/* Subheadline */}
            <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto">
              Controle clientes, parcelas e atrasos em um só lugar. Envie cobranças pelo WhatsApp com um clique.
            </p>
            
            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/register">
                <Button size="lg" className="bg-[#22C55E] hover:bg-[#4ADE80] text-white font-semibold text-lg px-8">
                  Começar a cobrar agora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#como-funciona">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:text-white text-lg px-8">
                  Ver como funciona
                </Button>
              </Link>
            </div>
            
            {/* Prova social */}
            <p className="text-white/50 text-sm mb-8">
              +500 comerciantes já usam
            </p>
            
            {/* Mockup */}
            <div className="bg-[#1a2d4a] rounded-2xl p-6 max-w-lg mx-auto border border-white/10">
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-red-500/30 flex items-center justify-center text-white font-bold">J</div>
                    <div>
                      <p className="text-white font-medium">João</p>
                      <p className="text-white/60 text-sm">R$ 150,00</p>
                    </div>
                  </div>
                  <span className="text-red-400 text-sm font-medium flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Atrasado 3 dias
                  </span>
                </div>
                
                <div className="flex items-center justify-between bg-[#22C55E]/20 border border-[#22C55E]/30 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#22C55E]/30 flex items-center justify-center text-white font-bold">M</div>
                    <div>
                      <p className="text-white font-medium">Maria</p>
                      <p className="text-white/60 text-sm">R$ 80,00</p>
                    </div>
                  </div>
                  <span className="text-[#22C55E] text-sm font-medium flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Pago hoje
                  </span>
                </div>
                
                <div className="text-center text-white/50 text-sm py-2">
                  3 parcelas vencem hoje
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problema */}
      <section className="py-20 bg-[#0d2240]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Você vende… mas não recebe como deveria
          </h2>
          <p className="text-lg text-white/70 mb-10 max-w-2xl mx-auto">
            Anotar no papel, esquecer cobranças e não saber quem está devendo faz você perder dinheiro todos os meses.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-white/80">Esquece quem já pagou</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-start gap-3">
              <Clock className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <p className="text-white/80">Não sabe quem está atrasado</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-start gap-3">
              <Users className="h-5 w-5 text-white/60 mt-0.5 flex-shrink-0" />
              <p className="text-white/80">Fica sem jeito de cobrar</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-white/80">Perde dinheiro no fiado</p>
            </div>
          </div>
        </div>
      </section>

      {/* Solução */}
      <section className="py-20 bg-[#0B1F3A]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            O AXION organiza tudo pra você
          </h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Tenha controle total dos seus recebimentos e saiba exatamente quem cobrar e quando.
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="como-funciona" className="py-20 bg-[#0d2240]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-white/5 border-white/10 hover:border-[#22C55E]/50 transition-colors">
              <CardContent className="pt-6">
                <div className="h-12 w-12 bg-[#22C55E]/20 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-[#22C55E]" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Veja quem te deve</h3>
                <p className="text-white/60">
                  Lista completa de todos os seus clientes e quanto cada um deve.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 hover:border-[#22C55E]/50 transition-colors">
              <CardContent className="pt-6">
                <div className="h-12 w-12 bg-[#22C55E]/20 rounded-lg flex items-center justify-center mb-4">
                  <CreditCard className="h-6 w-6 text-[#22C55E]" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Controle parcelas automaticamente</h3>
                <p className="text-white/60">
                  O sistema calcula tudo: valor, datas e quantidade de parcelas.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 hover:border-[#22C55E]/50 transition-colors">
              <CardContent className="pt-6">
                <div className="h-12 w-12 bg-[#22C55E]/20 rounded-lg flex items-center justify-center mb-4">
                  <MessageCircle className="h-6 w-6 text-[#22C55E]" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Cobre pelo WhatsApp</h3>
                <p className="text-white/60">
                  Envie a cobrança direto no WhatsApp do cliente com um clique.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 hover:border-[#22C55E]/50 transition-colors">
              <CardContent className="pt-6">
                <div className="h-12 w-12 bg-red-500/20 rounded-lg flex items-center justify-center mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Saiba quem está atrasado</h3>
                <p className="text-white/60">
                  Sistema avisa quem está devendo e há quanto tempo.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 hover:border-[#22C55E]/50 transition-colors">
              <CardContent className="pt-6">
                <div className="h-12 w-12 bg-[#22C55E]/20 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-[#22C55E]" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Tenha tudo organizado</h3>
                <p className="text-white/60">
                  Nada de papelada. Tudo salvo e organizado no seu celular.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 hover:border-[#22C55E]/50 transition-colors">
              <CardContent className="pt-6">
                <div className="h-12 w-12 bg-[#22C55E]/20 rounded-lg flex items-center justify-center mb-4">
                  <Wallet className="h-6 w-6 text-[#22C55E]" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Receba mais</h3>
                <p className="text-white/60">
                  Com cobranças assertivas, você recebe mais e perde menos.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section id="beneficios" className="py-20 bg-[#0B1F3A]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 text-center">
            Por que usar o AXION?
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-[#22C55E] mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-semibold text-white mb-1">Nunca mais esqueça uma parcela</h3>
                <p className="text-white/60">O sistema lembra de tudo pra você</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-[#22C55E] mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-semibold text-white mb-1">Receba mais sem esforço</h3>
                <p className="text-white/60">Cobranças automáticas pelo WhatsApp</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-[#22C55E] mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-semibold text-white mb-1">Tenha controle total do seu dinheiro</h3>
                <p className="text-white/60">Saiba exatamente quanto tem para receber</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-[#22C55E] mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-semibold text-white mb-1">Pare de perder dinheiro no fiado</h3>
                <p className="text-white/60">Não deixe mais ninguém te dever</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Prova Social */}
      <section className="py-20 bg-[#0d2240]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-2xl mx-auto">
            <div className="h-16 w-16 bg-[#22C55E]/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="h-8 w-8 text-[#22C55E]" />
            </div>
            <blockquote className="text-xl text-white mb-6">
              "Nunca mais perdi uma cobrança. Agora sei exatamente quem me deve e consigo cobrar pelo WhatsApp em segundos."
            </blockquote>
            <cite className="text-white/60 not-italic">
              — João, dono de mercado
            </cite>
          </div>
        </div>
      </section>

      {/* Confiança */}
      <section className="py-12 bg-[#0B1F3A]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-3 text-white/60">
            <Shield className="h-6 w-6 text-[#22C55E]" />
            <span>Seus dados protegidos com segurança</span>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-r from-[#0B1F3A] to-[#22C55E]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Pare de perder dinheiro no fiado
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Comece agora e tenha controle total dos seus recebimentos.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-[#0B1F3A] hover:bg-gray-100 font-semibold text-lg px-8">
              Começar a cobrar agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a1829] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl font-bold text-white">AXI</span>
                <span className="text-xl font-bold text-[#22C55E]">ON</span>
              </div>
              <p className="text-white/50 text-sm">
                Sistema simples para controlar quem te deve.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><a href="#como-funciona" className="hover:text-[#22C55E] transition-colors">Como Funciona</a></li>
                <li><a href="#beneficios" className="hover:text-[#22C55E] transition-colors">Benefícios</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><a href="#" className="hover:text-[#22C55E] transition-colors">Sobre</a></li>
                <li><a href="#" className="hover:text-[#22C55E] transition-colors">Contato</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><a href="#" className="hover:text-[#22C55E] transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-[#22C55E] transition-colors">Privacidade</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/40 text-sm">© 2024 AXION. Todos os direitos reservados.</p>
            <a 
              href="https://wa.me/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[#22C55E] hover:text-[#4ADE80] transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
