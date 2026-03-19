import Link from "next/link"
import Image from "next/image"
import { TrendingUp, Shield, Zap, Globe, CheckCircle, ArrowRight, CreditCard, Users, BarChart3, Clock, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="text-2xl font-bold text-[#1E3A8A]">AXI</span>
                <span className="text-2xl font-bold text-[#22C55E]">ON</span>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-[#374151] hover:text-[#1E3A8A] font-medium transition-colors">Recursos</a>
              <a href="#how-it-works" className="text-[#374151] hover:text-[#1E3A8A] font-medium transition-colors">Como Funciona</a>
              <a href="#pricing" className="text-[#374151] hover:text-[#1E3A8A] font-medium transition-colors">Planos</a>
            </nav>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" className="text-[#1E3A8A] hover:text-[#1E3A8A] hover:bg-blue-50">Entrar</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-[#22C55E] hover:bg-[#4ADE80] text-white font-semibold px-6">Começar Agora</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#1E3A8A] mb-6">
                Gestão de Crédito <span className="text-[#22C55E]">Inteligente</span> para Pequenos Negócios
              </h1>
              <p className="text-xl text-[#374151] mb-8">
                Simplifique a concessão de crédito, acompanhe inadimplência e expanda seus negócios com a plataforma mais completa do mercado.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/register">
                  <Button size="lg" className="bg-[#22C55E] hover:bg-[#4ADE80] text-white font-semibold text-lg px-8">
                    Criar Conta Grátis
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button size="lg" variant="outline" className="border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white text-lg px-8">
                    Ver Demonstração
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-sm text-gray-500">
                Não é necessário cartão de crédito • Configuração em 5 minutos
              </p>
            </div>
            <div className="relative hidden lg:block">
              <div className="relative w-full h-[400px]">
                <Image 
                  src="/hero-image-1.png" 
                  alt="AXION Cred Dashboard" 
                  fill
                  className="object-contain rounded-2xl shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1E3A8A] mb-4">
              Tudo o que você precisa para gerenciar crédito
            </h2>
            <p className="text-lg text-[#374151] max-w-2xl mx-auto">
              Uma plataforma completa com ferramentas poderosas para pequenas empresas e microempreendedores.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="h-12 w-12 bg-[#1E3A8A]/10 rounded-lg flex items-center justify-center mb-4">
                  <CreditCard className="h-6 w-6 text-[#1E3A8A]" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-[#1E3A8A]">Gestão de Empréstimos</h3>
                <p className="text-[#374151]">
                  Crie e gerencie contratos de crédito com cálculo automático de juros e parcelas.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="h-12 w-12 bg-[#1E3A8A]/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-[#1E3A8A]" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-[#1E3A8A]">Cadastro de Clientes</h3>
                <p className="text-[#374151]">
                  Gerencie sua base de clientes com histórico completo e limite de crédito personalizado.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="h-12 w-12 bg-[#1E3A8A]/10 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-[#1E3A8A]" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-[#1E3A8A]">Dashboard Inteligente</h3>
                <p className="text-[#374151]">
                  Visualize KPIs importantes e tome decisões baseadas em dados em tempo real.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="h-12 w-12 bg-[#22C55E]/10 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-[#22C55E]" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-[#1E3A8A]">Cobrança Automática</h3>
                <p className="text-[#374151]">
                  Envie lembretes automáticos pelo WhatsApp e reduza a inadimplência.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="h-12 w-12 bg-[#22C55E]/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-[#22C55E]" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-[#1E3A8A]">Segurança Avançada</h3>
                <p className="text-[#374151]">
                  Seus dados protegidos com criptografia de ponta e conformidade com LGPD.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="h-12 w-12 bg-[#22C55E]/10 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-[#22C55E]" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-[#1E3A8A]">Multi-idioma</h3>
                <p className="text-[#374151]">
                  Interface disponível em Português, Inglês e Espanhol para atender seus clientes.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-[#1E3A8A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Como funciona
            </h2>
            <p className="text-lg text-blue-200">
              Comece a usar em poucos minutos
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="h-16 w-16 bg-[#22C55E] rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Crie sua conta</h3>
              <p className="text-blue-200">
                Cadastre-se gratuitamente em poucos segundos
              </p>
            </div>
            <div className="text-center">
              <div className="h-16 w-16 bg-[#22C55E] rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Configure regras</h3>
              <p className="text-blue-200">
                Defina taxas de juros e faixas de parcelas
              </p>
            </div>
            <div className="text-center">
              <div className="h-16 w-16 bg-[#22C55E] rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Comece a usar</h3>
              <p className="text-blue-200">
                Gerencie seus clientes e empréstimos
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#1E3A8A] to-[#22C55E]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Pronto para transformar sua gestão de crédito?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Junte-se a milhares de pequenos negócios que já usam o AXION Cred
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-[#1E3A8A] hover:bg-gray-100 font-semibold text-lg px-8">
              Começar Gratuitamente
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1E3A8A] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl font-bold text-white">AXI</span>
                <span className="text-2xl font-bold text-[#22C55E]">ON</span>
              </div>
              <p className="text-sm text-blue-200">
                Plataforma de gestão de crédito para pequenos negócios na América Latina.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-blue-200">
                <li><a href="#features" className="hover:text-[#22C55E] transition-colors">Recursos</a></li>
                <li><a href="#pricing" className="hover:text-[#22C55E] transition-colors">Planos</a></li>
                <li><Link href="/demo" className="hover:text-[#22C55E] transition-colors">Demonstração</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-blue-200">
                <li><a href="#" className="hover:text-[#22C55E] transition-colors">Sobre</a></li>
                <li><a href="#" className="hover:text-[#22C55E] transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-[#22C55E] transition-colors">Contato</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-blue-200">
                <li><a href="#" className="hover:text-[#22C55E] transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-[#22C55E] transition-colors">Privacidade</a></li>
                <li><a href="#" className="hover:text-[#22C55E] transition-colors">LGPD</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-blue-800 mt-8 pt-8 text-sm text-center text-blue-200">
            <p>© 2024 AXION Cred. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
