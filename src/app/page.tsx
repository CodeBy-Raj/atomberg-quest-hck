"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Zap, Target, ShieldCheck, Sparkles, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function LandingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard")
    }
  }, [user, loading, router])

  if (loading) return null

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Navbar */}
      <nav className="h-20 border-b border-white/5 glass fixed top-0 w-full z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center lime-glow">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-headline font-bold tracking-tight">
            Atom<span className="text-primary">Quest</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/auth" className="text-sm font-medium hover:text-primary transition-colors hidden sm:block">
            Sign In
          </Link>
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20">
            <Link href="/auth">Get Started</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[160px] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-primary animate-bounce">
            <Sparkles className="w-4 h-4" />
            Empowering Modern Teams
          </div>
          <h1 className="text-6xl md:text-8xl font-black font-headline tracking-tighter leading-none">
            IGNITE YOUR <span className="text-primary italic">PRODUCTIVITY</span> ENGINE.
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-light">
            AtomQuest combines deep charcoal aesthetics with high-performance AI goal tracking to propel your organizational milestones.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-16 px-10 text-xl shadow-2xl shadow-primary/30 group">
              <Link href="/auth" className="flex items-center gap-2">
                Launch My Quest
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="border-white/10 hover:bg-white/5 h-16 px-10 text-xl">
              Watch Deployment
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
        <div className="p-8 rounded-3xl glass border-white/10 hover:border-primary/20 transition-all group">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
            <Target className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold mb-4">AI Milestone Guard</h3>
          <p className="text-muted-foreground leading-relaxed">
            Our neural engine breaks down complex goals into achievable, high-velocity sub-tasks in seconds.
          </p>
        </div>
        <div className="p-8 rounded-3xl glass border-white/10 hover:border-accent/20 transition-all group">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-6 group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold mb-4">Command Control</h3>
          <p className="text-muted-foreground leading-relaxed">
            Sophisticated role-based access ensuring every employee, manager, and admin has their perfect workspace.
          </p>
        </div>
        <div className="p-8 rounded-3xl glass border-white/10 hover:border-primary/20 transition-all group">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
            <Zap className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold mb-4">Pulse Sync</h3>
          <p className="text-muted-foreground leading-relaxed">
            Real-time persistence layer powered by Firestore for zero-latency cross-device synchronization.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/5 mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-headline font-bold">AtomQuest</span>
          </div>
          <div className="flex gap-8 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-primary transition-colors">Privacy Shield</Link>
            <Link href="#" className="hover:text-primary transition-colors">Neural Policy</Link>
            <Link href="#" className="hover:text-primary transition-colors">Fleet Status</Link>
          </div>
          <p className="text-xs text-muted-foreground/50 uppercase tracking-widest font-bold">
            © 2024 ATOMQUEST OPERATIONS DEPT.
          </p>
        </div>
      </footer>
    </div>
  )
}