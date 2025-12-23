import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { History, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { HistoryEntry } from '../../types/review'

interface HistoryPanelProps {
  history: HistoryEntry[]
}

const statusConfig = {
  success: {
    icon: CheckCircle2,
    className: 'text-emerald-500',
    bgClassName: 'bg-emerald-500/10',
  },
  error: {
    icon: XCircle,
    className: 'text-red-500',
    bgClassName: 'bg-red-500/10',
  },
  pending: {
    icon: Clock,
    className: 'text-yellow-500',
    bgClassName: 'bg-yellow-500/10',
  },
}

export function HistoryPanel({ history }: HistoryPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-blue-500" />
          업로드 히스토리
        </CardTitle>
        <CardDescription>
          최근 업로드 기록을 확인하세요.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <History className="mb-2 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              아직 업로드 기록이 없습니다.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {history.map((entry, index) => {
              const status = statusConfig[entry.status as keyof typeof statusConfig] || statusConfig.pending
              const Icon = status.icon

              return (
                <li
                  key={index}
                  className={cn(
                    "flex items-center gap-3 rounded-lg p-3",
                    status.bgClassName
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", status.className)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {entry.type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.timestamp}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

