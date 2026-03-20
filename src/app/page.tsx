"use client"

import Link from "next/link"
import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { CheckCircle, ArrowRight, Users, Clock, AlertTriangle, Shield, MessageCircle, DollarSign, TrendingUp, CreditCard, Star, Quote, BarChart3, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FadeIn, StaggerContainer, StaggerItem, AnimatedCounter } from "@/components/animations"

// Animated gradient background
function AnimatedGradient() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[#0B1F3A]" />
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(ellipse at 20% 50%, rgba(34, 197, 94, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(30, 58, 138, 0.3) 0%, transparent 40%), radial-gradient(ellipse at 60% 80%, rgba(34, 197, 94, 0.1) 0%, transparent 40%)',
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      {/* Animated floating orbs */}
      <motion.div
        className="absolute w-96 h-96 bg-[#22C55E]/10 rounded-full blur-3xl"
        style={{ top: '10%', left: '-10%' }}
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute w-64 h-64 bg-[#1E3A8A]/20 rounded-full blur-3xl"
        style={{ top: '60%', right: '-5%' }}
        animate={{
          x: [0, -30, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  )
}

// Animated mockup component
function AnimatedMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className="relative"
    >
      <div className="bg-[#1a2d4a] rounded-2xl p-6 max-w-lg mx-auto border border-white/10 backdrop-blur-sm shadow-2xl">
        {/* Animated status bar */}
        <motion.div 
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <motion.div 
            className="flex items-center justify-between bg-red-500/20 border border-red-500/30 rounded-lg p-3"
            whileHover={{ scale: 1.02, x: 5 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-3">
              <motion.div 
                className="h-10 w-10 rounded-full bg-red-500/30 flex items-center justify-center text-white font-bold"
                whileHover={{ scale: 1.1 }}
              >
                J
              </motion.div>
              <div>
                <p className="text-white font-medium">João</p>
                <p className="text-white/60 text-sm">R$ 150,00</p>
              </div>
            </div>
            <span className="text-red-400 text-sm font-medium flex items-center gap-1">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <AlertTriangle className="h-4 w-4" />
              </motion.div>
              Atrasado 3 dias
            </span>
          </motion.div>
          
          <motion.div 
            className="flex items-center justify-between bg-[#22C55E]/20 border border-[#22C55E]/30 rounded-lg p-3"
            whileHover={{ scale: 1.02, x: 5 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-3">
              <motion.div 
                className="h-10 w-10 rounded-full bg-[#22C55E]/30 flex items-center justify-center text-white font-bold"
                whileHover={{ scale: 1.1 }}
              >
                M
              </motion.div>
              <div>
                <p className="text-white font-medium">Maria</p>
                <p className="text-white/60 text-sm">R$ 80,00</p>
              </div>
            </div>
            <span className="text-[#22C55E] text-sm font-medium flex items-center gap-1">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <CheckCircle className="h-4 w-4" />
              </motion.div>
              Pago hoje
            </span>
          </motion.div>

          <motion.div 
            className="flex items-center justify-between bg-blue-500/20 border border-blue-500/30 rounded-lg p-3"
            whileHover={{ scale: 1.02, x: 5 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-3">
              <motion.div 
                className="h-10 w-10 rounded-full bg-blue-500/30 flex items-center justify-center text-white font-bold"
                whileHover={{ scale: 1.1 }}
              >
                P
              </motion.div>
              <div>
                <p className="text-white font-medium">Pedro</p>
                <p className="text-white/60 text-sm">R$ 250,00</p>
              </div>
            </div>
            <span className="text-blue-400 text-sm font-medium flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Vence amanhã
            </span>
          </motion.div>
          
          <motion.div 
            className="text-center text-white/50 text-sm py-2"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            3 parcelas vencem hoje
          </motion.div>
        </motion.div>
      </div>
      
      {/* Glow effect behind mockup */}
      <motion.div 
        className="absolute -inset-4 bg-gradient-to-r from-[#22C55E]/20 to-[#1E3A8A]/20 blur-2xl -z-10"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
    </motion.div>
  )
}

// Stats component with animated counters
function StatsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  
  return (
    <div ref={ref} className="flex flex-wrap justify-center gap-8 md:gap-16">
      {[
        { value: 500, suffix: '+', label: 'comerciantes atendidos' },
        { value: 2.5, suffix: 'M', prefix: 'R$ ', decimal: true, label: 'em cobranças' },
        { value: 98, suffix: '%', label: 'de satisfação' },
      ].map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: index * 0.2 }}
          className="text-center"
        >
          <div className="text-3xl md:text-4xl font-bold text-white">
            {stat.prefix}
            {isInView && <AnimatedCounter end={stat.value} suffix={stat.suffix} decimal={stat.decimal} duration={2} />}
          </div>
          <div className="text-white/50 text-sm mt-1">{stat.label}</div>
        </motion.div>
      ))}
    </div>
  )
}

// Testimonial card
function TestimonialCard({ quote, author, role, delay = 0 }: { quote: string, author: string, role: string, delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm h-full hover:border-[#22C55E]/30 hover:shadow-lg hover:shadow-[#22C55E]/10 transition-all duration-300">
        <CardContent className="pt-6">
          <Quote className="h-8 w-8 text-[#22C55E]/50 mb-4" />
          <p className="text-white/80 mb-4 leading-relaxed">{quote}</p>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#22C55E]/20 flex items-center justify-center text-[#22C55E] font-bold">
              {author.charAt(0)}
            </div>
            <div>
              <p className="text-white font-medium">{author}</p>
              <p className="text-white/50 text-sm">{role}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Company logos (placeholder)
function CompanyLogos() {
  const logos = ['Mercado', 'Loja', 'Farmácia', 'Restaurante', 'Atelier']
  
  return (
    <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
      {logos.map((logo, index) => (
        <motion.div
          key={logo}
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
          className="text-white/30 font-semibold text-lg md:text-xl"
        >
          {logo}
        </motion.div>
      ))}
    </div>
  )
}

// Premium card component
function PremiumCard({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <motion.div
      whileHover={{ y: -5, transition: { duration: 0.3 } }}
      className={`bg-white/5 border border-white/10 backdrop-blur-md rounded-xl shadow-lg hover:shadow-xl hover:border-[#22C55E]/30 transition-all duration-300 ${className}`}
    >
      {children}
    </motion.div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0B1F3A] relative overflow-hidden">
      {/* Animated Gradient Background */}
      <AnimatedGradient />

      {/* Header */}
      <header className="border-b border-white/10 bg-[#0B1F3A]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-2"
            >
              <span className="text-2xl font-bold text-white">AXI</span>
              <span className="text-2xl font-bold text-[#22C55E]">ON</span>
            </motion.div>
            <nav className="hidden md:flex items-center gap-8">
              {['Como Funciona', 'Benefícios', 'Planos'].map((item, index) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase().replace(' ', '-')}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (index + 1) }}
                  className="text-white/70 hover:text-white font-medium transition-all duration-300 hover:-translate-y-1"
                >
                  {item}
                </motion.a>
              ))}
            </nav>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10">Entrar</Button>
                </motion.div>
              </Link>
              <Link href="/register">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button className="bg-[#22C55E] hover:bg-[#4ADE80] text-white font-semibold px-6 transition-all duration-300 hover:shadow-lg hover:shadow-[#22C55E]/30">
                    Começar Agora
                  </Button>
                </motion.div>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="inline-flex items-center gap-2 bg-[#22C55E]/20 text-[#22C55E] px-4 py-2 rounded-full text-sm font-medium mb-8"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Users className="h-4 w-4" />
              </motion.div>
              Para quem vende fiado e quer receber
            </motion.div>
            
            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
            >
              Saiba exatamente quem te deve — e{' '}
              <span className="text-[#22C55E]">cobre em segundos</span>
            </motion.h1>
            
            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-xl text-white/70 mb-10 max-w-2xl mx-auto"
            >
              Controle clientes, parcelas e atrasos em um só lugar. Envie cobranças pelo WhatsApp com um clique.
            </motion.p>
            
            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            >
              <motion.a
                href="https://wa.me/5544999915226?text=Olá! Quero começar a cobrar agora com o AXION."
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-[#22C55E] hover:bg-[#4ADE80] text-white h-11 rounded-md px-8 text-lg shadow-lg shadow-[#22C55E]/25 hover:shadow-[#22C55E]/40 transition-all duration-300"
              >
                Começar a cobrar agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </motion.a>
              <Link href="#como-funciona">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:text-white bg-transparent text-lg px-8">
                    Ver como funciona
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
            
            {/* Animated Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mb-12"
            >
              <StatsSection />
            </motion.div>
            
            {/* Animated Mockup */}
            <AnimatedMockup />
          </div>
        </div>
      </section>

      {/* Problema */}
      <section id="como-funciona" className="py-20 bg-[#0d2240] relative">
        <AnimatedGradient />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold text-white mb-6"
          >
            Você vende… mas não recebe como deveria
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-white/70 mb-10 max-w-2xl mx-auto"
          >
            Anotar no papel, esquecer cobranças e não saber quem está devendo faz você perder dinheiro todos os meses.
          </motion.p>
          
          <StaggerContainer className="grid md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
            <StaggerItem direction="left">
              <PremiumCard className="p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-white/80">Esquece quem já pagou</p>
              </PremiumCard>
            </StaggerItem>
            <StaggerItem direction="right">
              <PremiumCard className="p-4 flex items-start gap-3">
                <Clock className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <p className="text-white/80">Não sabe quem está atrasado</p>
              </PremiumCard>
            </StaggerItem>
            <StaggerItem direction="left">
              <PremiumCard className="p-4 flex items-start gap-3">
                <Users className="h-5 w-5 text-white/60 mt-0.5 flex-shrink-0" />
                <p className="text-white/80">Fica sem jeito de cobrar</p>
              </PremiumCard>
            </StaggerItem>
            <StaggerItem direction="right">
              <PremiumCard className="p-4 flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-white/80">Perde dinheiro no fiado</p>
              </PremiumCard>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* Solução */}
      <section className="py-20 bg-[#0B1F3A] relative">
        <AnimatedGradient />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold text-white mb-6"
          >
            O AXION organiza tudo pra você
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-white/70 max-w-2xl mx-auto"
          >
            Tenha controle total dos seus recebimentos e saiba exatamente quem cobrar e quando.
          </motion.p>
        </div>
      </section>

      {/* Features */}
      <section id="beneficios" className="py-20 bg-gradient-to-b from-[#0B1F3A] to-[#0d2240]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StaggerItem>
              <PremiumCard className="p-6">
                <motion.div 
                  className="h-12 w-12 bg-[#22C55E]/20 rounded-lg flex items-center justify-center mb-4"
                  whileHover={{ scale: 1.1 }}
                >
                  <Users className="h-6 w-6 text-[#22C55E]" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-2 text-white">Veja quem te deve</h3>
                <p className="text-white/60">
                  Lista completa de todos os seus clientes e quanto cada um deve.
                </p>
              </PremiumCard>
            </StaggerItem>

            <StaggerItem>
              <PremiumCard className="p-6">
                <motion.div 
                  className="h-12 w-12 bg-[#22C55E]/20 rounded-lg flex items-center justify-center mb-4"
                  whileHover={{ scale: 1.1 }}
                >
                  <CreditCard className="h-6 w-6 text-[#22C55E]" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-2 text-white">Controle parcelas automaticamente</h3>
                <p className="text-white/60">
                  O sistema calcula tudo: valor, datas e quantidade de parcelas.
                </p>
              </PremiumCard>
            </StaggerItem>

            <StaggerItem>
              <PremiumCard className="p-6">
                <motion.div 
                  className="h-12 w-12 bg-[#22C55E]/20 rounded-lg flex items-center justify-center mb-4"
                  whileHover={{ scale: 1.1 }}
                >
                  <MessageCircle className="h-6 w-6 text-[#22C55E]" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-2 text-white">Cobre pelo WhatsApp</h3>
                <p className="text-white/60">
                  Envie a cobrança direto no WhatsApp do cliente com um clique.
                </p>
              </PremiumCard>
            </StaggerItem>

            <StaggerItem>
              <PremiumCard className="p-6">
                <motion.div 
                  className="h-12 w-12 bg-red-500/20 rounded-lg flex items-center justify-center mb-4"
                  whileHover={{ scale: 1.1 }}
                >
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-2 text-white">Saiba quem está atrasado</h3>
                <p className="text-white/60">
                  Sistema avisa quem está devendo e há quanto tempo.
                </p>
              </PremiumCard>
            </StaggerItem>

            <StaggerItem>
              <PremiumCard className="p-6">
                <motion.div 
                  className="h-12 w-12 bg-[#22C55E]/20 rounded-lg flex items-center justify-center mb-4"
                  whileHover={{ scale: 1.1 }}
                >
                  <BarChart3 className="h-6 w-6 text-[#22C55E]" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-2 text-white">Tenha tudo organizado</h3>
                <p className="text-white/60">
                  Nada de papelada. Tudo salvo e organizado no seu celular.
                </p>
              </PremiumCard>
            </StaggerItem>

            <StaggerItem>
              <PremiumCard className="p-6">
                <motion.div 
                  className="h-12 w-12 bg-[#22C55E]/20 rounded-lg flex items-center justify-center mb-4"
                  whileHover={{ scale: 1.1 }}
                >
                  <Wallet className="h-6 w-6 text-[#22C55E]" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-2 text-white">Receba mais</h3>
                <p className="text-white/60">
                  Com cobranças assertivas, você recebe mais e perde menos.
                </p>
              </PremiumCard>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* Benefícios */}
      <section className="py-20 bg-[#0d2240] relative">
        <AnimatedGradient />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-white mb-12 text-center"
          >
            Por que usar o AXION?
          </motion.h2>
          
          <StaggerContainer className="space-y-6">
            <StaggerItem>
              <motion.div whileHover={{ x: 10 }} className="flex items-start gap-4 p-4 rounded-lg hover:bg-white/5 transition-colors">
                <CheckCircle className="h-6 w-6 text-[#22C55E] mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">Nunca mais esqueça uma parcela</h3>
                  <p className="text-white/60">O sistema lembra de tudo pra você</p>
                </div>
              </motion.div>
            </StaggerItem>
            
            <StaggerItem>
              <motion.div whileHover={{ x: 10 }} className="flex items-start gap-4 p-4 rounded-lg hover:bg-white/5 transition-colors">
                <CheckCircle className="h-6 w-6 text-[#22C55E] mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">Receba mais sem esforço</h3>
                  <p className="text-white/60">Cobranças automáticas pelo WhatsApp</p>
                </div>
              </motion.div>
            </StaggerItem>
            
            <StaggerItem>
              <motion.div whileHover={{ x: 10 }} className="flex items-start gap-4 p-4 rounded-lg hover:bg-white/5 transition-colors">
                <CheckCircle className="h-6 w-6 text-[#22C55E] mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">Tenha controle total do seu dinheiro</h3>
                  <p className="text-white/60">Saiba exatamente quanto tem para receber</p>
                </div>
              </motion.div>
            </StaggerItem>
            
            <StaggerItem>
              <motion.div whileHover={{ x: 10 }} className="flex items-start gap-4 p-4 rounded-lg hover:bg-white/5 transition-colors">
                <CheckCircle className="h-6 w-6 text-[#22C55E] mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">Pare de perder dinheiro no fiado</h3>
                  <p className="text-white/60">Não deixe mais ninguém te dever</p>
                </div>
              </motion.div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* Planos */}
      <section className="py-20 bg-[#0B1F3A] relative">
        <AnimatedGradient />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-white mb-12 text-center"
          >
            Escolha seu plano
          </motion.h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Plano Starter */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <PremiumCard className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-white mb-2">Starter</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-white">R$29</span>
                    <span className="text-white/60">/mês</span>
                  </div>
                </div>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-white/80">
                    <CheckCircle className="h-5 w-5 text-[#22C55E]" />
                    Até 50 clientes
                  </li>
                  <li className="flex items-center gap-2 text-white/80">
                    <CheckCircle className="h-5 w-5 text-[#22C55E]" />
                    Controle de parcelas
                  </li>
                  <li className="flex items-center gap-2 text-white/80">
                    <CheckCircle className="h-5 w-5 text-[#22C55E]" />
                    Cobrança manual
                  </li>
                  <li className="flex items-center gap-2 text-white/50">
                    <span className="h-5 w-5 flex items-center justify-center">×</span>
                    Relatórios
                  </li>
                  <li className="flex items-center gap-2 text-white/50">
                    <span className="h-5 w-5 flex items-center justify-center">×</span>
                    Controle completo
                  </li>
                </ul>
                
                <motion.a 
                  href="https://wa.me/5544999915226?text=Olá! Quero saber mais sobre o Plano Starter (R$29/mês) do AXION. Preciso de até 50 clientes."
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="block w-full"
                >
                  <Button className="w-full bg-[#22C55E] hover:bg-[#4ADE80] text-white font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-[#22C55E]/30">
                    Escolher Starter
                  </Button>
                </motion.a>
              </PremiumCard>
            </motion.div>

            {/* Plano Pro */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <PremiumCard className="p-8 relative">
                <motion.div 
                  className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#22C55E] text-white text-sm font-medium px-4 py-1 rounded-full"
                  whileHover={{ scale: 1.05 }}
                >
                  Mais Popular
                </motion.div>
                <div className="text-center mb-6 pt-2">
                  <h3 className="text-xl font-semibold text-white mb-2">Pro</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-white">R$49</span>
                    <span className="text-white/60">/mês</span>
                  </div>
                </div>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-white/80">
                    <CheckCircle className="h-5 w-5 text-[#22C55E]" />
                    Clientes ilimitados
                  </li>
                  <li className="flex items-center gap-2 text-white/80">
                    <CheckCircle className="h-5 w-5 text-[#22C55E]" />
                    Controle de parcelas
                  </li>
                  <li className="flex items-center gap-2 text-white/80">
                    <CheckCircle className="h-5 w-5 text-[#22C55E]" />
                    Cobrança pelo WhatsApp
                  </li>
                  <li className="flex items-center gap-2 text-white/80">
                    <CheckCircle className="h-5 w-5 text-[#22C55E]" />
                    Relatórios
                  </li>
                  <li className="flex items-center gap-2 text-white/80">
                    <CheckCircle className="h-5 w-5 text-[#22C55E]" />
                    Controle completo
                  </li>
                </ul>
                
                <motion.a 
                  href="https://wa.me/5544999915226?text=Olá! Quero saber mais sobre o Plano Pro (R$49/mês) do AXION. Quero clientes ilimitados e relatórios."
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="block w-full"
                >
                  <Button className="w-full bg-[#22C55E] hover:bg-[#4ADE80] text-white font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-[#22C55E]/30">
                    Escolher Pro
                  </Button>
                </motion.a>
              </PremiumCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Proof - Depoimentos */}
      <section className="py-20 bg-[#0d2240] relative">
        <AnimatedGradient />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-white mb-4 text-center"
          >
            O que dizem nossos clientes
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-white/60 text-center mb-12"
          >
            Mais de 500 comerciantes já usam o AXION
          </motion.p>
          
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <TestimonialCard 
              quote="Nunca mais perdi uma cobrança. Agora sei exatamente quem me deve e consigo cobrar pelo WhatsApp em segundos."
              author="João Silva"
              role="Dono de mercado"
              delay={0}
            />
            <TestimonialCard 
              quote="O sistema me ajudou a organizar todas as minhas vendas fiadas. Minha receita aumentou 30% no primeiro mês!"
              author="Maria Santos"
              role="Dona de boutique"
              delay={0.1}
            />
            <TestimonialCard 
              quote="Finalmente sei quem está me devendo. Antes eu anotava no papel e sempre perdia."
              author="Pedro Costa"
              role="Proprietário de farmácia"
              delay={0.2}
            />
          </div>
          
          {/* Company Logos */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="pt-8 border-t border-white/10"
          >
            <p className="text-white/40 text-center mb-6 text-sm">Empresas que confiam no AXION</p>
            <CompanyLogos />
          </motion.div>
        </div>
      </section>

      {/* Confiança */}
      <section className="py-12 bg-[#0B1F3A]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <div className="flex flex-wrap items-center justify-center gap-6 text-white/60">
            <motion.div whileHover={{ scale: 1.1 }} className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-[#22C55E]" />
              <span>Seus dados protegidos com segurança</span>
            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }} className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-[#22C55E]" />
              <span>99.9% de uptime</span>
            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }} className="flex items-center gap-2">
              <Star className="h-6 w-6 text-[#22C55E]" />
              <span>Nota 4.9/5 nas avaliações</span>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-r from-[#0B1F3A] to-[#22C55E] relative overflow-hidden">
        <motion.div 
          className="absolute inset-0 opacity-20"
          style={{
            background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
          }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            Pare de perder dinheiro no fiado
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-white/90 mb-8"
          >
            Comece agora e tenha controle total dos seus recebimentos.
          </motion.p>
          <motion.a 
            href="https://wa.me/5544999915226?text=Olá! Quero começar a usar o AXION agora para controlar meus clientes e receber mais."
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-white text-[#0B1F3A] hover:bg-gray-100 h-11 rounded-md px-8 text-lg shadow-xl"
          >
            Começar a cobrar agora
            <ArrowRight className="ml-2 h-5 w-5" />
          </motion.a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a1829] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="col-span-1 md:col-span-1"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl font-bold text-white">AXI</span>
                <span className="text-xl font-bold text-[#22C55E]">ON</span>
              </div>
              <p className="text-white/50 text-sm">
                Sistema simples para controlar quem te deve.
              </p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <h4 className="font-semibold text-white mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><motion.a whileHover={{ x: 5 }} href="#como-funciona" className="hover:text-[#22C55E] transition-colors block">Como Funciona</motion.a></li>
                <li><motion.a whileHover={{ x: 5 }} href="#beneficios" className="hover:text-[#22C55E] transition-colors block">Benefícios</motion.a></li>
                <li><motion.a whileHover={{ x: 5 }} href="#planos" className="hover:text-[#22C55E] transition-colors block">Planos</motion.a></li>
              </ul>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <h4 className="font-semibold text-white mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><a href="#" className="hover:text-[#22C55E] transition-colors">Sobre</a></li>
                <li><a href="#" className="hover:text-[#22C55E] transition-colors">Contato</a></li>
              </ul>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><a href="#" className="hover:text-[#22C55E] transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-[#22C55E] transition-colors">Privacidade</a></li>
              </ul>
            </motion.div>
          </div>
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
          >
            <p className="text-white/40 text-sm">© 2024 AXION. Todos os direitos reservados.</p>
            <motion.a 
              href="https://wa.me/5544999915226?text=Olá! Gostaria de saber mais sobre o AXION. Pode me ajudar?" 
              target="_blank" 
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05, x: 5 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 text-[#22C55E] hover:text-[#4ADE80] transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
              Falar no WhatsApp
            </motion.a>
          </motion.div>
        </div>
      </footer>
    </div>
  )
}
