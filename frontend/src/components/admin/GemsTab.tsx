import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Upload, Gem } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface GemData {
  id: string;
  name: string;
  name_en: string;
  shape: string;
  size_mm: number;
  color: string;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
}

interface GemShape {
  value: string;
  label: string;
  label_en: string;
}

const DEFAULT_SHAPES: GemShape[] = [
  { value: "round", label: "Круглый", label_en: "Round" },
  { value: "oval", label: "Овальный", label_en: "Oval" },
  { value: "square", label: "Квадратный", label_en: "Square" },
  { value: "marquise", label: "Маркиз", label_en: "Marquise" },
  { value: "pear", label: "Груша", label_en: "Pear" },
  { value: "heart", label: "Сердце", label_en: "Heart" },
];

export function GemsTab() {
  const [gems, setGems] = useState<GemData[]>([]);
  const [shapes, setShapes] = useState<GemShape[]>(DEFAULT_SHAPES);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGem, setEditingGem] = useState<GemData | null>(null);

  const loadGems = useCallback(async () => {
    setLoading(true);
    const { data } = await api.getAdminGems();
    if (data?.gems) {
      setGems(data.gems);
    }
    const { data: shapesData } = await api.getGemShapes();
    if (shapesData?.shapes) {
      setShapes(shapesData.shapes);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadGems();
  }, [loadGems]);

  const handleDelete = async (gem: GemData) => {
    if (!confirm(`Удалить камень "${gem.name}"?`)) return;

    const { error } = await api.deleteGem(gem.id);
    if (error) {
      toast.error("Ошибка удаления");
    } else {
      toast.success("Камень удален");
      loadGems();
    }
  };

  const openCreateDialog = () => {
    setEditingGem(null);
    setDialogOpen(true);
  };

  const openEditDialog = (gem: GemData) => {
    setEditingGem(gem);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Библиотека камней</h2>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить камень
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
      ) : gems.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Камни не найдены. Добавьте первый камень.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {gems.map((gem) => (
            <GemCard
              key={gem.id}
              gem={gem}
              shapes={shapes}
              onEdit={() => openEditDialog(gem)}
              onDelete={() => handleDelete(gem)}
            />
          ))}
        </div>
      )}

      <GemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        gem={editingGem}
        shapes={shapes}
        onSaved={() => {
          setDialogOpen(false);
          loadGems();
        }}
      />
    </div>
  );
}

function GemCard({
  gem,
  shapes,
  onEdit,
  onDelete,
}: {
  gem: GemData;
  shapes: GemShape[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const shapeName = shapes.find((s) => s.value === gem.shape)?.label || gem.shape;

  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex items-start gap-4">
        {/* Gem preview */}
        <div
          className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${gem.color}20` }}
        >
          {gem.image_url ? (
            <img
              src={gem.image_url}
              alt={gem.name}
              className="w-12 h-12 object-contain"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full"
              style={{ backgroundColor: gem.color }}
            />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate">{gem.name}</h3>
            {!gem.is_active && (
              <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
                Скрыт
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {shapeName} - {gem.size_mm}мм
          </p>
          <div className="flex items-center gap-2 mt-1">
            <div
              className="w-4 h-4 rounded-full border"
              style={{ backgroundColor: gem.color }}
            />
            <span className="text-xs text-muted-foreground">{gem.color}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function GemDialog({
  open,
  onOpenChange,
  gem,
  shapes,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gem: GemData | null;
  shapes: GemShape[];
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [shape, setShape] = useState("round");
  const [sizeMm, setSizeMm] = useState(1.5);
  const [color, setColor] = useState("#E31C25");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeBackground, setRemoveBackground] = useState(true);
  const [bgTolerance, setBgTolerance] = useState(30);
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (gem) {
        setName(gem.name);
        setNameEn(gem.name_en || "");
        setShape(gem.shape);
        setSizeMm(gem.size_mm);
        setColor(gem.color);
        setImageBase64(null);
        setImagePreview(gem.image_url);
        setIsActive(gem.is_active);
        setSortOrder(gem.sort_order);
      } else {
        setName("");
        setNameEn("");
        setShape("round");
        setSizeMm(1.5);
        setColor("#E31C25");
        setImageBase64(null);
        setImagePreview(null);
        setRemoveBackground(true);
        setBgTolerance(30);
        setIsActive(true);
        setSortOrder(0);
      }
    }
  }, [open, gem]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setImageBase64(base64);
      setImagePreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Введите название камня");
      return;
    }
    if (!color) {
      toast.error("Выберите цвет");
      return;
    }

    setSaving(true);

    const payload: any = {
      name: name.trim(),
      name_en: nameEn.trim() || name.trim().toLowerCase(),
      shape,
      size_mm: sizeMm,
      color,
      is_active: isActive,
      sort_order: sortOrder,
    };

    if (imageBase64) {
      payload.image_base64 = imageBase64;
      payload.remove_background = removeBackground;
      payload.bg_tolerance = bgTolerance;
    }

    let result;
    if (gem) {
      result = await api.updateGem(gem.id, payload);
    } else {
      result = await api.createGem(payload);
    }

    setSaving(false);

    if (result.error) {
      toast.error(gem ? "Ошибка обновления" : "Ошибка создания");
    } else {
      toast.success(gem ? "Камень обновлен" : "Камень создан");
      onSaved();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gem className="w-5 h-5" />
            {gem ? "Редактировать камень" : "Добавить камень"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image upload */}
          <div className="space-y-2">
            <Label>Изображение камня</Label>
            <div className="flex items-center gap-4">
              <div
                className="w-20 h-20 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden"
                style={{ borderColor: color + "50", backgroundColor: color + "10" }}
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                )}
              </div>
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="gem-image"
                />
                <Label
                  htmlFor="gem-image"
                  className="inline-flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-muted transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Загрузить фото
                </Label>
              </div>
            </div>

            {/* Background removal options */}
            {imageBase64 && (
              <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <Label htmlFor="remove-bg" className="text-sm">
                    Удалить фон автоматически
                  </Label>
                  <Switch
                    id="remove-bg"
                    checked={removeBackground}
                    onCheckedChange={setRemoveBackground}
                  />
                </div>
                {removeBackground && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Чувствительность удаления фона: {bgTolerance}
                    </Label>
                    <input
                      type="range"
                      min="10"
                      max="80"
                      value={bgTolerance}
                      onChange={(e) => setBgTolerance(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Название</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Рубин"
              />
            </div>
            <div className="space-y-1">
              <Label>Название (EN)</Label>
              <Input
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="ruby"
              />
            </div>
          </div>

          {/* Shape and size */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Форма</Label>
              <Select value={shape} onValueChange={setShape}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {shapes.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Размер (мм)</Label>
              <Input
                type="number"
                step="0.1"
                min="0.5"
                max="5"
                value={sizeMm}
                onChange={(e) => setSizeMm(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Color */}
          <div className="space-y-1">
            <Label>Цвет (для превью)</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 rounded border cursor-pointer"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#E31C25"
                className="flex-1"
              />
            </div>
          </div>

          {/* Active and sort order */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Switch
                id="is-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="is-active">Активен</Label>
            </div>
            <div className="space-y-1">
              <Label>Порядок</Label>
              <Input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Сохранение..." : gem ? "Сохранить" : "Создать"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
