import { Button } from '@/components/ui/button'
import { LogIn, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HeaderProps {
  isLoggedIn: boolean
  statusMessage: string
  onLogin: () => void
}

export function Header({ isLoggedIn, statusMessage, onLogin }: HeaderProps) {
  const handleLoginClick = () => {
    console.log('[DEBUG] Login button clicked')
    onLogin()
  }
  
  return (
    <header className="relative overflow-hidden border-b bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDIwMjAiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJWMGgydjM0em0tNCAwVjBoLTJ2MzRoMnptLTQgMFYwaC0ydjM0aDJ6bS00IDBWMGgtMnYzNGgyem0tNCAwVjBoLTJ2MzRoMnptLTQgMFYwaC0ydjM0aDJ6bS00IDBWMGgtMnYzNGgyem0tNCAwVjBoLTJ2MzRoMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20" />
      
      <div className="container relative py-12">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Cafe24 Review Manager
            </h1>
            <p className="text-lg text-slate-300">
              Electron + React + TypeScript 기반의 리뷰 자동 등록 앱
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              onClick={handleLoginClick}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <LogIn className="mr-2 h-5 w-5" />
              OAuth 2.0 로그인
            </Button>
            
            <div className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium",
              isLoggedIn 
                ? "bg-emerald-500/20 text-emerald-300" 
                : "bg-slate-700/50 text-slate-400"
            )}>
              {isLoggedIn ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              {statusMessage}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

