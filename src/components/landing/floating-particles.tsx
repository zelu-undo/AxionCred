"use client"

import { useEffect, useRef, useCallback, useState } from "react"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
}

interface FloatingParticlesProps {
  particleCount?: number
  className?: string
}

// Speed multiplier - 30% faster than default
const SPEED_MULTIPLIER = 1.3

// Get appropriate particle count based on device
function getParticleCount(): number {
  if (typeof window === 'undefined') return 300
  return window.innerWidth < 768 ? 180 : 300
}

export function FloatingParticles({ 
  particleCount: propParticleCount, 
  className = "" 
}: FloatingParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationRef = useRef<number>(0)
  const [particleCount, setParticleCount] = useState(300)

  useEffect(() => {
    // Set initial particle count based on device
    setParticleCount(getParticleCount())
    
    // Handle resize to adjust particle count
    const handleResize = () => {
      setParticleCount(getParticleCount())
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Use propParticleCount if provided, otherwise use responsive count
  const activeParticleCount = propParticleCount ?? particleCount

  const initParticles = useCallback((width: number, height: number) => {
    const particles: Particle[] = []
    const count = activeParticleCount
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.2 * SPEED_MULTIPLIER,
        vy: (Math.random() - 0.5) * 0.2 * SPEED_MULTIPLIER,
        size: Math.random() * 2.5 + 1.5,
        opacity: 0.5,
      })
    }
    return particles
  }, [activeParticleCount])

  const drawParticles = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height)
    
    // Draw particles
    particlesRef.current.forEach((particle) => {
      // Update position
      particle.x += particle.vx
      particle.y += particle.vy

      // Wrap around screen
      if (particle.x < 0) particle.x = width
      if (particle.x > width) particle.x = 0
      if (particle.y < 0) particle.y = height
      if (particle.y > height) particle.y = 0

      // Draw particle
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(34, 197, 94, ${particle.opacity})`
      ctx.fill()
    })

    // Conexões com distância maior - otimizado com verificação rápida
    const maxDistance = 120
    const maxDistanceSq = maxDistance * maxDistance // Usar distância quadrada para evitar sqrt
    const particles = particlesRef.current
    const len = particles.length
    
    // Verificar todas as partículas para conexões
    for (let i = 0; i < len; i++) {
      const p1 = particles[i]
      // Começar j de i+1 para evitar verificar duas vezes a mesma conexão
      for (let j = i + 1; j < len; j++) {
        const p2 = particles[j]
        
        // Verificação rápida usando distância quadrada
        const dx = p1.x - p2.x
        const dy = p1.y - p2.y
        const distanceSq = dx * dx + dy * dy

        if (distanceSq < maxDistanceSq) {
          const distance = Math.sqrt(distanceSq)
          const opacity = (1 - distance / maxDistance) * 0.25
          ctx.beginPath()
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(p2.x, p2.y)
          ctx.strokeStyle = `rgba(34, 197, 94, ${opacity})`
          ctx.lineWidth = 0.8
          ctx.stroke()
        }
      }
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const updateCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1
      // Use viewport size only
      const width = window.innerWidth
      const height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.scale(dpr, dpr)
      
      // Reinitialize particles to cover viewport
      particlesRef.current = initParticles(width, height)
    }

    const animate = () => {
      const width = parseFloat(canvas.style.width) || window.innerWidth
      const height = parseFloat(canvas.style.height) || window.innerHeight
      drawParticles(ctx, width, height)
      animationRef.current = requestAnimationFrame(animate)
    }

    updateCanvasSize()
    animate()

    const handleResize = () => {
      updateCanvasSize()
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [initParticles, drawParticles])

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      style={{ width: "100%", height: "100%" }}
    />
  )
}
