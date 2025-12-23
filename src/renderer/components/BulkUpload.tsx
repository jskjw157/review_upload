import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FileSpreadsheet, Upload, Loader2 } from 'lucide-react'

interface BulkUploadProps {
  onUpload: (file: File) => Promise<boolean>
  isSubmitting: boolean
  message: string
}

export function BulkUpload({ onUpload, isSubmitting, message }: BulkUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedFile) return

    const success = await onUpload(selectedFile)

    if (success) {
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
          자동 업로드 모드
        </CardTitle>
        <CardDescription>
          CSV / XLSX 파일을 선택해 여러 리뷰를 한 번에 업로드합니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bulk-file">업로드 파일</Label>
            <div className="relative">
              <Input
                ref={fileInputRef}
                id="bulk-file"
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
            </div>
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                선택된 파일: <span className="font-medium">{selectedFile.name}</span>
              </p>
            )}
          </div>

          <Button 
            type="submit" 
            variant="secondary"
            className="w-full" 
            disabled={isSubmitting || !selectedFile}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                처리 중...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                일괄 업로드 실행
              </>
            )}
          </Button>

          {message && (
            <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              {message}
            </p>
          )}
        </form>

        <div className="mt-6 rounded-lg border bg-muted/50 p-4">
          <h4 className="mb-2 font-medium">파일 형식 안내</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• CSV: UTF-8 인코딩 권장</li>
            <li>• 필수 컬럼: product_id, score, text</li>
            <li>• 선택 컬럼: image_url, nickname</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

