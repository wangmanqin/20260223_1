'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

// 客户端组件
import TodoList from './TodoList'
import AuthGuard from '../components/AuthGuard'

// 类型定义
export interface Todo {
  id: string
  title: string
  completed: boolean
  created_at: string
  updated_at: string
}



export default function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTodos = async () => {
      try {
        setIsLoading(true)
        const supabase = await createClient()
      
      // 尝试获取待办事项
      let { data: fetchedTodos, error: fetchError } = await supabase.from('todos').select().order('created_at', { ascending: false })

        if (fetchError) {
          setError(fetchError.message)
          setIsLoading(false)
          return
        }

        // 如果没有待办事项，自动添加示例数据
        if (!fetchedTodos || fetchedTodos.length === 0) {
          await supabase.from('todos').insert([
            { title: '完成项目集成' },
            { title: '测试待办应用' },
            { title: '优化用户体验' }
          ])
          // 重新获取待办事项
          const { data: newTodos } = await supabase.from('todos').select().order('created_at', { ascending: false })
          fetchedTodos = newTodos
        }

        setTodos(fetchedTodos || [])
        setError(null)
      } catch (err) {
        setError('获取待办事项失败')
        console.error('Error fetching todos:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTodos()
  }, [])

  // 处理添加待办
  const handleAddTodo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const title = formData.get('title') as string
    
    if (!title.trim()) return

    try {
      const supabase = await createClient()
      await supabase.from('todos').insert({ title })
      
      // 重新获取待办事项
      const { data: newTodos } = await supabase.from('todos').select().order('created_at', { ascending: false })
      setTodos(newTodos || [])
      
      // 清空表单
      e.currentTarget.reset()
    } catch (err) {
      setError('添加待办事项失败')
      console.error('Error adding todo:', err)
    }
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-start py-16 px-16 bg-white dark:bg-black">
          <h1 className="text-3xl font-semibold mb-8">待办事项</h1>

          {/* 连接状态和错误信息 */}
          {error && (
            <div className="w-full mb-6 p-4 bg-red-100 text-red-700 rounded-lg dark:bg-red-900 dark:text-red-300">
              <h3 className="font-medium mb-2">错误信息：</h3>
              <p>{error}</p>
              <p className="text-sm mt-2">
                这可能是因为您还没有在 Supabase 控制台执行 SQL 建表语句，或者表结构不正确。
              </p>
            </div>
          )}

          {/* 加载状态 */}
          {isLoading && (
            <div className="w-full mb-6 p-4 bg-blue-100 text-blue-700 rounded-lg dark:bg-blue-900 dark:text-blue-300">
              <p>加载中...</p>
            </div>
          )}

          {/* 添加待办表单 */}
          <form onSubmit={handleAddTodo} className="w-full mb-12">
            <div className="flex gap-4">
              <input
                type="text"
                name="title"
                placeholder="添加新的待办事项..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                required
              />
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                添加
              </button>
            </div>
          </form>

          {/* 待办列表 */}
          <div className="w-full">
            {todos && todos.length > 0 ? (
              <TodoList initialTodos={todos} />
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <p className="text-xl mb-4">暂无待办事项</p>
                <p className="text-sm">
                  {error ? '请先解决上面的错误，然后添加待办事项' : '请使用上方的表单添加您的第一个待办事项'}
                </p>
              </div>
            )}
          </div>

          {/* SQL 建表语句提示 */}
          <div className="mt-12 p-4 border border-gray-200 rounded-lg dark:border-gray-800">
            <h2 className="text-lg font-medium mb-2">SQL 建表语句</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              请按照以下步骤操作：
            </p>
            <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-300 mb-4 space-y-2">
              <li>登录 Supabase 控制台：https://supabase.com/dashboard</li>
              <li>选择您的项目：tupnpvplivzmhaedrsop</li>
              <li>点击左侧菜单中的 "SQL Editor"</li>
              <li>复制粘贴以下 SQL 语句到编辑器中</li>
              <li>点击 "Run" 按钮执行建表语句</li>
              <li>返回本页面，使用上方表单添加待办事项</li>
            </ol>
            <pre className="text-xs p-4 bg-gray-100 rounded overflow-x-auto dark:bg-gray-800">
              <code>
                {`CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建更新时间触发器
CREATE TRIGGER update_todos_updated_at
BEFORE UPDATE ON todos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();`}
              </code>
            </pre>
          </div>

          {/* 快速测试：添加示例待办事项 */}
          <div className="mt-8">
            <form onSubmit={handleAddTodo}>
              <input type="hidden" name="title" value="完成项目集成" />
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                添加示例待办事项
              </button>
            </form>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}