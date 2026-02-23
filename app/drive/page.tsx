'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import AuthGuard from '../components/AuthGuard'

interface FileItem {
  id: string
  name: string
  size: number
  url: string
  created_at: string
}

export default function DrivePage() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // 获取文件列表
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setIsLoading(true)
        const supabase = createClient()

        const { data, error } = await supabase.storage
          .from('temp_1')
          .list()

        if (error) {
          throw error
        }

        // 获取每个文件的URL
        const filesWithUrl = await Promise.all(
          data.map(async (file) => {
            const { data: url } = await supabase.storage
              .from('temp_1')
              .getPublicUrl(file.name)

            return {
              id: file.id || file.name,
              name: file.name,
              size: file.size,
              url: url.publicUrl,
              created_at: file.created_at || new Date().toISOString()
            }
          })
        )

        setFiles(filesWithUrl)
      } catch (err: any) {
        setError('获取文件列表失败: ' + err.message)
        console.error('Error fetching files:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFiles()
  }, [])

  // 处理文件名，确保符合 Supabase Storage 的要求
  const sanitizeFileName = (fileName: string): string => {
    // 移除或替换不允许的字符，只保留安全字符
    // 安全字符：字母、数字、普通连字符、下划线、点
    let sanitized = fileName
      // 替换所有非安全字符为连字符
      .replace(/[^a-zA-Z0-9\-_.]/g, '-')
      // 替换特殊连字符为普通连字符
      .replace(/[‐‑–—]/g, '-')
      // 替换多个连字符为单个
      .replace(/-+/g, '-')
      // 移除首尾连字符
      .replace(/^-|-$/g, '')
      // 移除文件名开头的点
      .replace(/^\./, '')
    
    // 确保文件名长度合理
    if (sanitized.length > 200) {
      const extIndex = sanitized.lastIndexOf('.')
      if (extIndex > 0) {
        const ext = sanitized.substring(extIndex)
        const name = sanitized.substring(0, 200 - ext.length)
        sanitized = name + ext
      } else {
        sanitized = sanitized.substring(0, 200)
      }
    }
    
    // 确保文件名不为空
    if (!sanitized) {
      sanitized = 'file_' + Date.now()
    }
    
    return sanitized
  }

  // 处理文件上传
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      setUploadProgress(0)
      const supabase = createClient()

      // 处理文件名
      const sanitizedFileName = sanitizeFileName(file.name)

      const { error } = await supabase.storage
        .from('temp_1')
        .upload(sanitizedFileName, file, {
          cacheControl: '3600',
          upsert: true,
          onUploadProgress: (progress) => {
            setUploadProgress(Math.round((progress.loaded / progress.total) * 100))
          }
        })

      if (error) {
        throw error
      }

      // 重新获取文件列表
      const { data: updatedFiles } = await supabase.storage
        .from('temp_1')
        .list()

      // 获取每个文件的URL
      const filesWithUrl = await Promise.all(
        updatedFiles.map(async (file) => {
          const { data: url } = await supabase.storage
            .from('temp_1')
            .getPublicUrl(file.name)

          return {
            id: file.id || file.name,
            name: file.name,
            size: file.size,
            url: url.publicUrl,
            created_at: file.created_at || new Date().toISOString()
          }
        })
      )

      setFiles(filesWithUrl)
    } catch (err: any) {
      setError('文件上传失败: ' + err.message)
      console.error('Error uploading file:', err)
    } finally {
      setUploading(false)
      setUploadProgress(0)
      // 清空文件输入
      e.target.value = ''
    }
  }

  // 处理文件删除
  const handleFileDelete = async (fileName: string) => {
    try {
      const supabase = createClient()

      const { error } = await supabase.storage
        .from('temp_1')
        .remove([fileName])

      if (error) {
        throw error
      }

      // 从列表中移除文件
      setFiles(files.filter(file => file.name !== fileName))
    } catch (err: any) {
      setError('文件删除失败: ' + err.message)
      console.error('Error deleting file:', err)
    }
  }

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <main className="flex min-h-screen w-full max-w-4xl flex-col items-center justify-start py-16 px-16 bg-white dark:bg-black">
          <h1 className="text-3xl font-semibold mb-8">云盘</h1>

          {/* 错误信息 */}
          {error && (
            <div className="w-full mb-6 p-4 bg-red-100 text-red-700 rounded-lg dark:bg-red-900 dark:text-red-300">
              {error}
            </div>
          )}

          {/* 文件上传 */}
          <div className="w-full mb-12">
            <h2 className="text-xl font-medium mb-4">上传文件</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center dark:border-gray-700">
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
                className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              />
              {uploading && (
                <div className="mt-4">
                  <p>上传中... {uploadProgress}%</p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2 dark:bg-gray-700">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 文件列表 */}
          <div className="w-full">
            <h2 className="text-xl font-medium mb-4">文件列表</h2>
            {isLoading ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <p>加载中...</p>
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <p>暂无文件</p>
              </div>
            ) : (
              <div className="space-y-4">
                {files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg dark:border-gray-800">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center dark:bg-gray-700">
                        <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{file.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatFileSize(file.size)} • {new Date(file.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* 下载按钮 */}
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                      >
                        下载
                      </a>
                      {/* 删除按钮 */}
                      <button
                        onClick={() => handleFileDelete(file.name)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bucket 信息 */}
          <div className="mt-12 p-4 border border-gray-200 rounded-lg dark:border-gray-800">
            <h2 className="text-lg font-medium mb-2">Bucket 信息</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              当前使用的 Bucket: <strong>temp_1</strong> (Public)
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              注意：所有上传的文件都是公开可访问的，请不要上传敏感信息。
            </p>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}