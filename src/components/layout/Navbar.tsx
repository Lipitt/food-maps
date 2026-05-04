import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-sm border-b">
      <span className="font-semibold text-sm">Food Maps</span>
      <div className="flex items-center gap-3">
        {user ? (
          <>
            <span className="text-xs text-muted-foreground">{user.email}</span>
            <Button variant="outline" size="sm" onClick={signOut}>Sign out</Button>
          </>
        ) : (
          <Button size="sm" onClick={() => navigate('/auth')}>Sign in</Button>
        )}
      </div>
    </div>
  )
}
