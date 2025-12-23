import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Star, Upload, Loader2 } from 'lucide-react'
import type { ReviewInput } from '../../types/review'

interface ReviewFormProps {
  onSubmit: (input: ReviewInput) => Promise<boolean>
  isSubmitting: boolean
  message: string
}

const PRODUCTS = [
  { id: 'coffee-set', name: '원두 세트' },
  { id: 'espresso-machine', name: '에스프레소 머신' },
  { id: 'tumbler', name: '텀블러' },
]

export function ReviewForm({ onSubmit, isSubmitting, message }: ReviewFormProps) {
  const [productId, setProductId] = useState('')
  const [score, setScore] = useState(5)
  const [text, setText] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!productId || !text.trim()) return

    const success = await onSubmit({
      productId,
      score,
      text: text.trim(),
    })

    if (success) {
      setProductId('')
      setScore(5)
      setText('')
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          단건 리뷰 등록
        </CardTitle>
        <CardDescription>
          상품 선택 후 텍스트, 별점, 이미지(옵션)를 입력해 리뷰를 등록하세요.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product">상품</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger id="product">
                <SelectValue placeholder="상품을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCTS.map(product => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="score">별점</Label>
            <div className="flex items-center gap-2">
              <Input
                id="score"
                type="number"
                min={1}
                max={5}
                value={score}
                onChange={e => setScore(Number(e.target.value))}
                className="w-20"
              />
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 cursor-pointer transition-colors ${
                      i < score ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'
                    }`}
                    onClick={() => setScore(i + 1)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="review-text">리뷰 내용</Label>
            <Textarea
              id="review-text"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="제품에 대한 솔직한 후기를 작성해주세요."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">이미지 업로드 (옵션)</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              className="cursor-pointer"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || !productId || !text.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                업로드 중...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                리뷰 업로드
              </>
            )}
          </Button>

          {message && (
            <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              {message}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

