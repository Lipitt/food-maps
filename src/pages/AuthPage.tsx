import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type FormValues = z.infer<typeof schema>

export default function AuthPage() {
  const navigate = useNavigate()
  const [loginError, setLoginError] = useState<string | null>(null)
  const [signupError, setSignupError] = useState<string | null>(null)

  const loginForm = useForm<FormValues>({ resolver: zodResolver(schema) })
  const signupForm = useForm<FormValues>({ resolver: zodResolver(schema) })

  const handleLogin = async (values: FormValues) => {
    setLoginError(null)
    const { error } = await supabase.auth.signInWithPassword(values)
    if (error) return setLoginError(error.message)
    toast.success('Welcome back!')
    navigate('/')
  }

  const handleSignup = async (values: FormValues) => {
    setSignupError(null)
    const { error } = await supabase.auth.signUp(values)
    if (error) return setSignupError(error.message)
    toast.success('Account created! Welcome to Food Maps.')
    navigate('/')
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Food Maps</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to add restaurants to the map</p>
        </div>

        <Tabs defaultValue="login" onValueChange={() => { setLoginError(null); setSignupError(null) }}>
          <TabsList className="w-full">
            <TabsTrigger value="login" className="flex-1">Login</TabsTrigger>
            <TabsTrigger value="signup" className="flex-1">Sign up</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4 mt-4">
              <div className="space-y-1">
                <Label htmlFor="login-email">Email</Label>
                <Input id="login-email" type="email" {...loginForm.register('email')} />
                {loginForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="login-password">Password</Label>
                <Input id="login-password" type="password" {...loginForm.register('password')} />
                {loginForm.formState.errors.password && (
                  <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>
                )}
              </div>
              {loginError && <p className="text-xs text-destructive">{loginError}</p>}
              <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting}>
                {loginForm.formState.isSubmitting ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4 mt-4">
              <div className="space-y-1">
                <Label htmlFor="signup-email">Email</Label>
                <Input id="signup-email" type="email" {...signupForm.register('email')} />
                {signupForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{signupForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="signup-password">Password</Label>
                <Input id="signup-password" type="password" {...signupForm.register('password')} />
                {signupForm.formState.errors.password && (
                  <p className="text-xs text-destructive">{signupForm.formState.errors.password.message}</p>
                )}
              </div>
              {signupError && <p className="text-xs text-destructive">{signupError}</p>}
              <Button type="submit" className="w-full" disabled={signupForm.formState.isSubmitting}>
                {signupForm.formState.isSubmitting ? 'Creating account...' : 'Create account'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
