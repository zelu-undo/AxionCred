"use client"

import { useEffect, useRef, useCallback } from "react"

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

export function FloatingParticles({ 
  particleCount = 30, 
  className = "" 
}: FloatingParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationRef = useRef<number>(0)

  const initParticles = useCallback((width: number, height: number) => {
    const particles: Particle[] = []
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 1,
        opacity: 0.3, // Uniform opacity for particles
      })
    }
    return particles
  }, [particleCount])

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

    // Optimized: Draw connections only for nearby particles (reduced distance for performance)
    const maxDistance = 80
    const particleCount = particlesRef.current.length
    
    // Only check a subset of particles for connections (every 3rd particle) to maintain performance
    for (let i = 0; i < particleCount; i += 3) {
      const p1 = particlesRef.current[i]
      for (let j = i + 1; j < particleCount; j += 3) {
        const p2 = particlesRef.current[j]
        const dx = p1.x - p2.x
        const dy = p1.y - p2.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < maxDistance) {
          const opacity = (1 - distance / maxDistance) * 0.3
          ctx.beginPath()
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(p2.x, p2.y)
          ctx.strokeStyle = `rgba(34, 197, 94, ${opacity})`
          ctx.lineWidth = 0.5
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
      // Use full document size, not just viewport
      const width = Math.max(document.documentElement.scrollWidth, window.innerWidth)
      const height = Math.max(document.documentElement.scrollHeight, window.innerHeight)
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.scale(dpr, dpr)
      
      // Reinitialize particles to cover full document
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

    // Handle scroll to reinitialize particles in new visible areas
    const handleScroll = () => {
      updateCanvasSize()
    }

    window.addEventListener("resize", handleResize)
    window.addEventListener("scroll", handleScroll)

    return () => {
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("scroll", handleScroll)
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
