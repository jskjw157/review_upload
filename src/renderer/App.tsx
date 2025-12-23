import { Header } from '@/components/Header'
import { ReviewForm } from '@/components/ReviewForm'
import { BulkUpload } from '@/components/BulkUpload'
import { HistoryPanel } from '@/components/HistoryPanel'
import { InfoPanel } from '@/components/InfoPanel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/useAuth'
import { useReview } from '@/hooks/useReview'
import { Star, FileSpreadsheet } from 'lucide-react'

export default function App() {
  const auth = useAuth()
  const review = useReview({
    config: auth.config,
    isLoggedIn: auth.isLoggedIn,
    onTokenExpired: auth.handleTokenExpired,
  })

  return (
    <div className="min-h-screen bg-background">
      <Header
        isLoggedIn={auth.isLoggedIn}
        statusMessage={auth.statusMessage}
        onLogin={auth.login}
      />

      <main className="container py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="single" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="single" className="gap-2">
                  <Star className="h-4 w-4" />
                  단건 등록
                </TabsTrigger>
                <TabsTrigger value="bulk" className="gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  일괄 업로드
                </TabsTrigger>
              </TabsList>
              <TabsContent value="single" className="mt-4">
                <ReviewForm
                  onSubmit={review.submitReview}
                  isSubmitting={review.isSubmitting}
                  message={review.message}
                />
              </TabsContent>
              <TabsContent value="bulk" className="mt-4">
                <BulkUpload
                  onUpload={review.uploadBulk}
                  isSubmitting={review.isSubmitting}
                  message={review.message}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <InfoPanel />
            <HistoryPanel history={review.history} />
          </div>
        </div>
      </main>

      <footer className="border-t bg-muted/50 py-6">
        <div className="container text-center text-sm text-muted-foreground">
          <p>
            네트워크 오류 재시도, 토큰 만료 시 갱신, 다크/라이트 모드와 같은
            추가 기능을 염두에 둔 프로토타입입니다.
          </p>
        </div>
      </footer>
    </div>
  )
}

