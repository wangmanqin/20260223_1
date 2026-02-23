import { createClient } from '@/utils/supabase/server-no-await'

export default async function Page() {
  const supabase = await createClient()

  const { data: todos } = await supabase.from('todos').select()

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black">
        <h1 className="text-3xl font-semibold mb-8">Supabase Todos</h1>
        <ul className="w-full">
          {todos?.map((todo, index) => (
            <li key={index} className="mb-4 p-4 border border-gray-200 rounded-lg">
              {JSON.stringify(todo)}
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
