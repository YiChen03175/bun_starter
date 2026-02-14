import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TodoList } from "./_components/todo-list";

export default function TodosPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Todo App</CardTitle>
        </CardHeader>
        <CardContent>
          <TodoList />
        </CardContent>
      </Card>
    </main>
  );
}
