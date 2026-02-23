'use client'

import { useState, useOptimistic } from 'react'
import { Todo } from './page'

interface TodoListProps {
  initialTodos: Todo[]
}

async function toggleTodo(id: string, completed: boolean) {
  const res = await fetch('/api/toggle-todo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ id, completed })
  })
  return res.json()
}

async function deleteTodo(id: string) {
  const res = await fetch('/api/delete-todo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ id })
  })
  return res.json()
}

function TodoList({ initialTodos }: TodoListProps) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos)

  // 乐观更新 - 切换待办状态
  const [optimisticTodos, setOptimisticTodos] = useOptimistic(
    todos,
    (state, id: string, completed: boolean) => {
      return state.map(todo =>
        todo.id === id ? { ...todo, completed: !completed } : todo
      )
    }
  )

  // 乐观更新 - 删除待办
  const [optimisticTodosDelete, setOptimisticTodosDelete] = useOptimistic(
    todos,
    (state, id: string) => {
      return state.filter(todo => todo.id !== id)
    }
  )

  const handleToggle = async (id: string, completed: boolean) => {
    // 立即更新UI
    setOptimisticTodos(id, completed)
    
    try {
      // 发送请求到服务器
      await toggleTodo(id, completed)
      // 更新真实状态
      setTodos(prev => prev.map(todo =>
        todo.id === id ? { ...todo, completed: !completed } : todo
      ))
    } catch (error) {
      // 错误处理 - 可以添加回滚逻辑
      console.error('Error toggling todo:', error)
    }
  }

  const handleDelete = async (id: string) => {
    // 立即更新UI
    setOptimisticTodosDelete(id)
    
    try {
      // 发送请求到服务器
      await deleteTodo(id)
      // 更新真实状态
      setTodos(prev => prev.filter(todo => todo.id !== id))
    } catch (error) {
      // 错误处理 - 可以添加回滚逻辑
      console.error('Error deleting todo:', error)
    }
  }

  return (
    <ul className="space-y-4">
      {optimisticTodos.map((todo: Todo) => (
        <li key={todo.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg dark:border-gray-800">
          {/* 完成状态切换 */}
          <button
            onClick={() => handleToggle(todo.id, todo.completed)}
            className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${todo.completed ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600'}`}
          >
            {todo.completed && (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          {/* 待办标题 */}
          <div className="flex-1">
            <span className={`text-lg ${todo.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
              {todo.title}
            </span>
          </div>

          {/* 删除按钮 */}
          <button
            onClick={() => handleDelete(todo.id)}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            删除
          </button>
        </li>
      ))}
    </ul>
  )
}

export default TodoList