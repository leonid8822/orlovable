import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit, Save, X, RefreshCw, Eye, EyeOff, Upload, Box, ArrowUp, ArrowDown, Download } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Example {
  id: string;
  title: string | null;
  description: string | null;
  before_image_url: string | null;
  after_image_url: string | null;
  model_3d_url: string | null;
  display_order: number | null;
  is_active: boolean | null;
  theme: string | null;
  created_at: string;
}

interface Generation {
  id: string;
  input_image_url: string | null;
  output_images: string[];
  form_factor: string;
  material: string;
  size: string;
  created_at: string;
}

export function ExamplesTab() {
  const [examples, setExamples] = useState<Example[]>([]);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Example>>({});
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [themeFilter, setThemeFilter] = useState<string>('all');

  const fetchExamples = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('examples')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching examples:', error);
      toast.error('Ошибка загрузки примеров');
    } else {
      setExamples(data || []);
    }
    setLoading(false);
  };

  const fetchGenerations = async () => {
    const { data, error } = await supabase
      .from('pendant_generations')
      .select('id, input_image_url, output_images, form_factor, material, size, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      // Filter out generations with base64 input images (too large) and empty output
      const validGenerations = data.filter(g => 
        g.output_images && g.output_images.length > 0 &&
        (!g.input_image_url || !g.input_image_url.startsWith('data:'))
      );
      setGenerations(validGenerations);
    }
  };

  useEffect(() => {
    fetchExamples();
  }, []);

  const handleCreate = async () => {
    const maxOrder = examples.reduce((max, e) => Math.max(max, e.display_order || 0), 0);
    const { data, error } = await supabase
      .from('examples')
      .insert({
        title: 'Новый пример',
        display_order: maxOrder + 1,
        is_active: false,
        theme: themeFilter !== 'all' ? themeFilter : 'main',
      })
      .select()
      .single();

    if (error) {
      toast.error('Ошибка создания примера');
    } else {
      setExamples([...examples, data]);
      setEditingId(data.id);
      setEditData(data);
      toast.success('Пример создан');
    }
  };

  const handleImportFromGeneration = async (generation: Generation) => {
    const maxOrder = examples.reduce((max, e) => Math.max(max, e.display_order || 0), 0);
    
    // Use first output image as after_image
    const afterUrl = generation.output_images[0] || null;
    
    const { data, error } = await supabase
      .from('examples')
      .insert({
        title: `${generation.form_factor === 'round' ? 'Круглый' : 'По контуру'} кулон`,
        description: `${generation.material === 'gold' ? 'Золото' : 'Серебро'}, ${generation.size === 'pendant' ? 'подвеска' : generation.size === 'bracelet' ? 'браслет' : 'интерьер'}`,
        before_image_url: null, // We don't store input images as URLs anymore
        after_image_url: afterUrl,
        display_order: maxOrder + 1,
        is_active: false,
      })
      .select()
      .single();

    if (error) {
      toast.error('Ошибка импорта');
    } else {
      setExamples([...examples, data]);
      toast.success('Пример импортирован');
      setImportDialogOpen(false);
    }
  };

  const handleSave = async (id: string) => {
    const { error } = await supabase
      .from('examples')
      .update(editData)
      .eq('id', id);

    if (error) {
      toast.error('Ошибка сохранения');
    } else {
      setExamples(examples.map(e => e.id === id ? { ...e, ...editData } : e));
      setEditingId(null);
      setEditData({});
      toast.success('Сохранено');
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('examples')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Ошибка удаления');
    } else {
      setExamples(examples.filter(e => e.id !== id));
      toast.success('Удалено');
    }
  };

  const toggleActive = async (id: string, current: boolean | null) => {
    const { error } = await supabase
      .from('examples')
      .update({ is_active: !current })
      .eq('id', id);

    if (error) {
      toast.error('Ошибка');
    } else {
      setExamples(examples.map(e => e.id === id ? { ...e, is_active: !current } : e));
    }
  };

  const moveExample = async (id: string, direction: 'up' | 'down') => {
    const index = examples.findIndex(e => e.id === id);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= examples.length) return;
    
    const newExamples = [...examples];
    const temp = newExamples[index];
    newExamples[index] = newExamples[newIndex];
    newExamples[newIndex] = temp;
    
    // Update display_order for both
    const updates = newExamples.map((e, i) => ({
      id: e.id,
      display_order: i,
    }));
    
    for (const update of updates) {
      await supabase.from('examples').update({ display_order: update.display_order }).eq('id', update.id);
    }
    
    setExamples(newExamples.map((e, i) => ({ ...e, display_order: i })));
    toast.success('Порядок изменен');
  };

  const handleFileUpload = async (
    id: string, 
    field: 'before_image_url' | 'after_image_url' | 'model_3d_url',
    file: File
  ) => {
    const uploadKey = `${id}-${field}`;
    setUploading(prev => ({ ...prev, [uploadKey]: true }));

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `examples/${id}/${field}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('pendant-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('pendant-images')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('examples')
        .update({ [field]: publicUrl })
        .eq('id', id);

      if (updateError) throw updateError;

      setExamples(examples.map(e => e.id === id ? { ...e, [field]: publicUrl } : e));
      if (editingId === id) {
        setEditData(prev => ({ ...prev, [field]: publicUrl }));
      }
      toast.success('Файл загружен');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Ошибка загрузки файла');
    } finally {
      setUploading(prev => ({ ...prev, [uploadKey]: false }));
    }
  };

  const FileUploadButton = ({ 
    exampleId, 
    field, 
    accept,
    label
  }: { 
    exampleId: string; 
    field: 'before_image_url' | 'after_image_url' | 'model_3d_url';
    accept: string;
    label: string;
  }) => {
    const uploadKey = `${exampleId}-${field}`;
    const isUploading = uploading[uploadKey];

    return (
      <label className="cursor-pointer">
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(exampleId, field, file);
          }}
        />
        <Button variant="outline" size="sm" disabled={isUploading} asChild>
          <span>
            {isUploading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : field === 'model_3d_url' ? (
              <Box className="h-4 w-4" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            <span className="ml-2">{label}</span>
          </span>
        </Button>
      </label>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Примеры работ</CardTitle>
          <div className="flex gap-2 items-center">
            <Select value={themeFilter} onValueChange={setThemeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Все темы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все темы</SelectItem>
                <SelectItem value="main">main (Основной)</SelectItem>
                <SelectItem value="kids">kids (Детский)</SelectItem>
                <SelectItem value="totems">totems (Тотемы)</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchExamples} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Dialog open={importDialogOpen} onOpenChange={(open) => {
              setImportDialogOpen(open);
              if (open) fetchGenerations();
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Из генераций
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Импорт из генераций</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {generations.length === 0 ? (
                    <p className="col-span-2 text-center text-muted-foreground py-8">
                      Нет доступных генераций с URL-изображениями
                    </p>
                  ) : (
                    generations.map((gen) => (
                      <Card 
                        key={gen.id} 
                        className="cursor-pointer hover:border-gold/50 transition-colors"
                        onClick={() => handleImportFromGeneration(gen)}
                      >
                        <CardContent className="p-3">
                          <img 
                            src={gen.output_images[0]} 
                            alt="Generated" 
                            className="w-full aspect-square object-cover rounded mb-2"
                          />
                          <div className="text-xs text-muted-foreground">
                            {gen.form_factor === 'round' ? 'Круглый' : 'По контуру'} • {gen.material === 'gold' ? 'Золото' : 'Серебро'}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>
            <Button onClick={handleCreate} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Добавить
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : examples.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Нет примеров. Нажмите "Добавить" или "Из генераций" для создания.
            </div>
          ) : (
            <div className="space-y-4">
              {examples
                .filter(e => themeFilter === 'all' || (e.theme || 'main') === themeFilter)
                .map((example, index) => (
                <Card key={example.id} className={`${!example.is_active ? 'opacity-60' : ''}`}>
                  <CardContent className="pt-4">
                    {editingId === example.id ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="text-sm text-muted-foreground">Название</label>
                            <Input
                              value={editData.title || ''}
                              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="text-sm text-muted-foreground">Порядок</label>
                            <Input
                              type="number"
                              value={editData.display_order ?? 0}
                              onChange={(e) => setEditData({ ...editData, display_order: parseInt(e.target.value) })}
                            />
                          </div>
                          <div>
                            <label className="text-sm text-muted-foreground">Тема</label>
                            <Select
                              value={editData.theme || 'main'}
                              onValueChange={(v) => setEditData({ ...editData, theme: v })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="main">main (Основной)</SelectItem>
                                <SelectItem value="kids">kids (Детский)</SelectItem>
                                <SelectItem value="totems">totems (Тотемы)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Описание</label>
                          <Textarea
                            value={editData.description || ''}
                            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm text-muted-foreground">До (исходник)</label>
                            {editData.before_image_url && (
                              <img src={editData.before_image_url} alt="До" className="w-full h-32 object-cover rounded" />
                            )}
                            <FileUploadButton
                              exampleId={example.id}
                              field="before_image_url"
                              accept="image/*"
                              label="Загрузить"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm text-muted-foreground">После (рендер)</label>
                            {editData.after_image_url && (
                              <img src={editData.after_image_url} alt="После" className="w-full h-32 object-cover rounded" />
                            )}
                            <FileUploadButton
                              exampleId={example.id}
                              field="after_image_url"
                              accept="image/*"
                              label="Загрузить"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm text-muted-foreground">3D модель</label>
                            {editData.model_3d_url ? (
                              <div className="w-full h-32 bg-muted rounded flex items-center justify-center">
                                <Box className="h-8 w-8 text-muted-foreground" />
                              </div>
                            ) : null}
                            <FileUploadButton
                              exampleId={example.id}
                              field="model_3d_url"
                              accept=".glb,.gltf,.obj,.stl"
                              label="3D файл"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => handleSave(example.id)} size="sm">
                            <Save className="h-4 w-4 mr-2" />
                            Сохранить
                          </Button>
                          <Button variant="outline" onClick={() => { setEditingId(null); setEditData({}); }} size="sm">
                            <X className="h-4 w-4 mr-2" />
                            Отмена
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        {/* Order controls */}
                        <div className="flex flex-col gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0"
                            disabled={index === 0}
                            onClick={() => moveExample(example.id, 'up')}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0"
                            disabled={index === examples.length - 1}
                            onClick={() => moveExample(example.id, 'down')}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          {example.before_image_url ? (
                            <img src={example.before_image_url} alt="До" className="w-16 h-16 object-cover rounded" />
                          ) : (
                            <div className="w-16 h-16 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">До</div>
                          )}
                          <span className="text-muted-foreground self-center">→</span>
                          {example.after_image_url ? (
                            <img src={example.after_image_url} alt="После" className="w-16 h-16 object-cover rounded" />
                          ) : (
                            <div className="w-16 h-16 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">После</div>
                          )}
                          {example.model_3d_url && (
                            <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                              <Box className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{example.title || 'Без названия'}</div>
                          <div className="text-sm text-muted-foreground truncate">{example.description || 'Нет описания'}</div>
                        </div>
                        <Badge variant="outline" className="mr-1">
                          {example.theme || 'main'}
                        </Badge>
                        <Badge variant={example.is_active ? 'default' : 'secondary'}>
                          {example.is_active ? 'Активен' : 'Скрыт'}
                        </Badge>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActive(example.id, example.is_active)}
                          >
                            {example.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setEditingId(example.id); setEditData({ ...example, theme: example.theme || 'main' }); }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(example.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
