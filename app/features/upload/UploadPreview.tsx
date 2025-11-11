'use client'

import { Upload } from 'lucide-react'
import Card from '@/app/components/ui/Card'

interface UploadPreviewProps {
  preview: string
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function UploadPreview({ preview, onFileChange }: UploadPreviewProps) {
  return (
    <div className="space-y-6">
      <div className="relative rounded-xl overflow-hidden bg-gray-100">
        <img
          src={preview}
          alt="업로드된 이미지"
          className="w-full h-auto max-h-96 object-contain mx-auto"
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 border-4 border-pink-400/50 rounded-full border-dashed"></div>
        </div>
      </div>
      
      <Card className="p-4">
        <p className="text-sm text-green-800 text-center">
          멋져요! 분석에 적합한 사진이네요 🔍
        </p>
      </Card>
      
      <label className="block cursor-pointer">
        <input
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="hidden"
        />
        <div className="border-2 border-gray-300 rounded-lg p-4 text-center hover:border-pink-500 transition-colors">
          <Upload className="w-5 h-5 mx-auto mb-2 text-gray-600" />
          <span className="text-sm text-gray-700">다른 사진 선택</span>
        </div>
      </label>
    </div>
  )
}

