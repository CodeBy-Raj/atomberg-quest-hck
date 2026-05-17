"use client"

import * as React from "react"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Zap, Mail, Lock, Loader2, UserCircle, ShieldCheck, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function AuthPage() {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleAuth = async (type: 'login' | 'signup') => {
    setLoading(true)
    try {
      if (type === 'login') {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        await createUserWithEmailAndPassword(auth, email, password)
      }
      router.push("/dashboard")
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message || "Something went wrong.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = async (roleEmail: string) => {
    setLoading(true)
    setEmail(roleEmail)
    setPassword("Demo@123")
    try {
      await signInWithEmailAndPassword(auth, roleEmail, "Demo@123")
      toast({ title: "Authorized", description: `Accessed as ${roleEmail.split('@')[0]}` })
      router.push("/dashboard")
    } catch (error: any) {
      toast({
        title: "Portal Access Error",
        description: "Please ensure you have clicked 'Initialize Demo Data' on the dashboard first.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setLoading(true)
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
      router.push("/dashboard")
    } catch (error: any) {
      toast({
        title: "Google Auth Failed",
        description: error.message || "Failed to sign in with Google.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center relative z-10">
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary lime-glow mb-4">
              <Zap className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-5xl font-headline font-black tracking-tighter text-foreground leading-none">
              ATOM<span className="text-primary">QUEST</span>
            </h1>
            <p className="text-muted-foreground text-xl max-w-sm">Ignite your organizational productivity trajectory.</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Hackathon Quick Access Portals</h3>
            <div className="grid gap-3">
              {[
                { label: "Admin Access", email: "admin@demo.com", icon: ShieldCheck, color: "hover:border-primary/50" },
                { label: "Manager Access", email: "manager1@demo.com", icon: Users, color: "hover:border-accent/50" },
                { label: "Employee Access", email: "emp1@demo.com", icon: UserCircle, color: "hover:border-white/50" }
              ].map((role) => (
                <button
                  key={role.email}
                  onClick={() => quickLogin(role.email)}
                  disabled={loading}
                  className={`flex items-center gap-4 p-4 rounded-xl glass border-white/5 transition-all text-left group ${role.color}`}
                >
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <role.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">{role.label}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{role.email}</div>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground italic">Note: These shortcuts work after the Demo Data is initialized.</p>
          </div>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10 mb-6 p-1">
            <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold">Login</TabsTrigger>
            <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold">Register</TabsTrigger>
          </TabsList>

          <Card className="glass border-white/10 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-xl">Authentication Portal</CardTitle>
              <CardDescription>Enter your credentials to access the command center.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@company.com" 
                    className="pl-10 bg-white/5 border-white/10 focus:border-primary h-11"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Security Token</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10 bg-white/5 border-white/10 focus:border-primary h-11"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <TabsContent value="login" className="w-full mt-0">
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11 shadow-lg shadow-primary/20"
                  onClick={() => handleAuth('login')}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="animate-spin mr-2" /> : "Access Dashboard"}
                </Button>
              </TabsContent>
              <TabsContent value="signup" className="w-full mt-0">
                <Button 
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold h-11 shadow-lg shadow-accent/20"
                  onClick={() => handleAuth('signup')}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="animate-spin mr-2" /> : "Initiate Account"}
                </Button>
              </TabsContent>
              
              <div className="relative w-full py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/5" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-transparent px-2 text-muted-foreground font-bold">Or sync via</span>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full border-white/10 hover:bg-white/5 h-11 font-medium"
                onClick={handleGoogleAuth}
                disabled={loading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google Identity Sync
              </Button>
            </CardFooter>
          </Card>
        </Tabs>
      </div>
    </div>
  )
}
