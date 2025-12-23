import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Shield, RefreshCw, Key, Send } from 'lucide-react'

export function InfoPanel() {
  const features = [
    {
      icon: Key,
      title: 'OAuth 2.0 로그인',
      description: '카페24 OAuth로 안전하게 인증합니다.',
    },
    {
      icon: Shield,
      title: '토큰 보안 저장',
      description: '토큰을 로컬에 안전하게 저장합니다.',
    },
    {
      icon: RefreshCw,
      title: '자동 갱신',
      description: '토큰 만료 시 자동으로 갱신합니다.',
    },
    {
      icon: Send,
      title: 'API 호출',
      description: '액세스 토큰으로 리뷰를 등록합니다.',
    },
  ]

  return (
    <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <CardHeader>
        <CardTitle className="text-base">인증 & 토큰 관리</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="rounded-md bg-primary/10 p-2">
                <feature.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{feature.title}</p>
                <p className="text-xs text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

