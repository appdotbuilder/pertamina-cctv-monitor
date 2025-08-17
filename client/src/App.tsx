import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, Circle } from 'lucide-react';
import type { Task, CreateTaskInput, UpdateTaskInput } from '../../server/src/schema';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Form state for creating new tasks
  const [createFormData, setCreateFormData] = useState<CreateTaskInput>({
    title: '',
    description: null,
    is_completed: false
  });

  // Form state for editing tasks
  const [editFormData, setEditFormData] = useState<Partial<UpdateTaskInput>>({
    title: '',
    description: null,
    is_completed: false
  });

  const loadTasks = useCallback(async () => {
    try {
      const result = await trpc.getTasks.query();
      setTasks(result);
    } catch (error) {
      console.error('Gagal memuat tugas:', error);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createTask.mutate(createFormData);
      setTasks((prev: Task[]) => [...prev, response]);
      setCreateFormData({
        title: '',
        description: null,
        is_completed: false
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Gagal membuat tugas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    
    setIsLoading(true);
    try {
      const updateData: UpdateTaskInput = {
        id: editingTask.id,
        ...editFormData
      };
      const response = await trpc.updateTask.mutate(updateData);
      if (response) {
        setTasks((prev: Task[]) => prev.map((task: Task) => 
          task.id === editingTask.id ? response : task
        ));
      }
      setIsEditDialogOpen(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Gagal mengupdate tugas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (taskId: number) => {
    try {
      const success = await trpc.deleteTask.mutate({ id: taskId });
      if (success) {
        setTasks((prev: Task[]) => prev.filter((task: Task) => task.id !== taskId));
      }
    } catch (error) {
      console.error('Gagal menghapus tugas:', error);
    }
  };

  const toggleTaskCompletion = async (task: Task) => {
    try {
      const updateData: UpdateTaskInput = {
        id: task.id,
        is_completed: !task.is_completed
      };
      const response = await trpc.updateTask.mutate(updateData);
      if (response) {
        setTasks((prev: Task[]) => prev.map((t: Task) => 
          t.id === task.id ? response : t
        ));
      }
    } catch (error) {
      console.error('Gagal mengubah status tugas:', error);
    }
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setEditFormData({
      title: task.title,
      description: task.description,
      is_completed: task.is_completed
    });
    setIsEditDialogOpen(true);
  };

  const completedTasks = tasks.filter((task: Task) => task.is_completed);
  const pendingTasks = tasks.filter((task: Task) => !task.is_completed);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">📝 Manajemen Tugas</h1>
          <p className="text-gray-600">Kelola tugas-tugas Anda dengan mudah dan efisien</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{tasks.length}</div>
              <div className="text-sm text-gray-600">Total Tugas</div>
            </CardContent>
          </Card>
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{pendingTasks.length}</div>
              <div className="text-sm text-gray-600">Belum Selesai</div>
            </CardContent>
          </Card>
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
              <div className="text-sm text-gray-600">Sudah Selesai</div>
            </CardContent>
          </Card>
        </div>

        {/* Add Task Button */}
        <div className="mb-6">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Tugas Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>✨ Tambah Tugas Baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Judul Tugas</label>
                  <Input
                    placeholder="Masukkan judul tugas..."
                    value={createFormData.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateTaskInput) => ({ ...prev, title: e.target.value }))
                    }
                    required
                    className="border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Deskripsi (Opsional)</label>
                  <Textarea
                    placeholder="Tambahkan deskripsi tugas..."
                    value={createFormData.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setCreateFormData((prev: CreateTaskInput) => ({
                        ...prev,
                        description: e.target.value || null
                      }))
                    }
                    className="border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="completed"
                    checked={createFormData.is_completed}
                    onCheckedChange={(checked: boolean) =>
                      setCreateFormData((prev: CreateTaskInput) => ({
                        ...prev,
                        is_completed: checked
                      }))
                    }
                  />
                  <label htmlFor="completed" className="text-sm font-medium text-gray-700">
                    Tandai sebagai selesai
                  </label>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="flex-1"
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={isLoading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    {isLoading ? 'Menyimpan...' : 'Simpan Tugas'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tasks List */}
        {tasks.length === 0 ? (
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Belum ada tugas</h3>
              <p className="text-gray-600">Mulai dengan menambahkan tugas pertama Anda!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {tasks.map((task: Task) => (
              <Card key={task.id} className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => toggleTaskCompletion(task)}
                      className="mt-1 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      {task.is_completed ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className={`font-medium text-lg ${
                          task.is_completed 
                            ? 'text-gray-500 line-through' 
                            : 'text-gray-800'
                        }`}>
                          {task.title}
                        </h3>
                        <Badge 
                          variant={task.is_completed ? "secondary" : "default"}
                          className={task.is_completed ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}
                        >
                          {task.is_completed ? 'Selesai' : 'Belum Selesai'}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className={`text-sm mb-3 ${
                          task.is_completed 
                            ? 'text-gray-400' 
                            : 'text-gray-600'
                        }`}>
                          {task.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-400">
                        Dibuat: {task.created_at.toLocaleDateString('id-ID')} • 
                        Diubah: {task.updated_at.toLocaleDateString('id-ID')}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Dialog open={isEditDialogOpen && editingTask?.id === task.id} onOpenChange={(open) => {
                        if (!open) {
                          setIsEditDialogOpen(false);
                          setEditingTask(null);
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(task)}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>✏️ Edit Tugas</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-1 block">Judul Tugas</label>
                              <Input
                                value={editFormData.title || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setEditFormData((prev) => ({ ...prev, title: e.target.value }))
                                }
                                required
                                className="border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-1 block">Deskripsi</label>
                              <Textarea
                                value={editFormData.description || ''}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                  setEditFormData((prev) => ({
                                    ...prev,
                                    description: e.target.value || null
                                  }))
                                }
                                className="border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                                rows={3}
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="edit-completed"
                                checked={editFormData.is_completed || false}
                                onCheckedChange={(checked: boolean) =>
                                  setEditFormData((prev) => ({
                                    ...prev,
                                    is_completed: checked
                                  }))
                                }
                              />
                              <label htmlFor="edit-completed" className="text-sm font-medium text-gray-700">
                                Tandai sebagai selesai
                              </label>
                            </div>
                            <div className="flex gap-2 pt-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditDialogOpen(false)}
                                className="flex-1"
                              >
                                Batal
                              </Button>
                              <Button type="submit" disabled={isLoading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                                {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>🗑️ Hapus Tugas</AlertDialogTitle>
                            <AlertDialogDescription>
                              Apakah Anda yakin ingin menghapus tugas "{task.title}"? 
                              Tindakan ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(task.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Ya, Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;