import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Star, Package, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  image_url: string;
  gallery_urls?: string[];
  price_silver: number;
  price_gold?: number;
  sizes_available?: string[];
  is_available: boolean;
  is_featured: boolean;
  display_order: number;
  slug?: string;
  created_at?: string;
}

const CATEGORIES = [
  { value: "totem", label: "Тотем" },
  { value: "pendant", label: "Кулон" },
  { value: "bracelet", label: "Браслет" },
];

const SIZES = ["s", "m", "l"];

export function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "totem",
    image_url: "",
    gallery_urls: "",
    price_silver: "",
    price_gold: "",
    sizes_available: ["s", "m", "l"] as string[],
    is_available: true,
    is_featured: false,
    display_order: "0",
  });

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await api.adminGetProducts();
    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "totem",
      image_url: "",
      gallery_urls: "",
      price_silver: "",
      price_gold: "",
      sizes_available: ["s", "m", "l"],
      is_available: true,
      is_featured: false,
      display_order: "0",
    });
  };

  const openCreateDialog = () => {
    setEditingProduct(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      category: product.category,
      image_url: product.image_url,
      gallery_urls: product.gallery_urls?.join("\n") || "",
      price_silver: product.price_silver.toString(),
      price_gold: product.price_gold?.toString() || "",
      sizes_available: product.sizes_available || ["s", "m", "l"],
      is_available: product.is_available,
      is_featured: product.is_featured,
      display_order: product.display_order.toString(),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.image_url.trim() || !formData.price_silver) {
      toast.error("Заполните обязательные поля");
      return;
    }

    setSaving(true);

    const productData = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      category: formData.category,
      image_url: formData.image_url.trim(),
      gallery_urls: formData.gallery_urls
        .split("\n")
        .map((url) => url.trim())
        .filter(Boolean),
      price_silver: parseInt(formData.price_silver),
      price_gold: formData.price_gold ? parseInt(formData.price_gold) : undefined,
      sizes_available: formData.sizes_available,
      is_available: formData.is_available,
      is_featured: formData.is_featured,
      display_order: parseInt(formData.display_order) || 0,
    };

    try {
      if (editingProduct) {
        const { error } = await api.adminUpdateProduct(editingProduct.id, productData);
        if (error) throw error;
        toast.success("Товар обновлен");
      } else {
        const { error } = await api.adminCreateProduct(productData);
        if (error) throw error;
        toast.success("Товар создан");
      }
      setDialogOpen(false);
      loadProducts();
    } catch (err) {
      toast.error("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Удалить товар "${product.name}"?`)) return;

    const { error } = await api.adminDeleteProduct(product.id);
    if (error) {
      toast.error("Ошибка удаления");
    } else {
      toast.success("Товар удален");
      loadProducts();
    }
  };

  const toggleSize = (size: string) => {
    setFormData((prev) => ({
      ...prev,
      sizes_available: prev.sizes_available.includes(size)
        ? prev.sizes_available.filter((s) => s !== size)
        : [...prev.sizes_available, size],
    }));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ru-RU").format(price);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          <h2 className="text-xl font-semibold">Товары магазина</h2>
          <Badge variant="outline">{products.length}</Badge>
        </div>
        <div className="flex gap-2">
          <a href="/shop" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              Открыть магазин
            </Button>
          </a>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Добавить товар
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Товаров пока нет</p>
          <Button onClick={openCreateDialog} className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Добавить первый товар
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Фото</TableHead>
              <TableHead>Название</TableHead>
              <TableHead>Категория</TableHead>
              <TableHead>Цена</TableHead>
              <TableHead className="text-center">Статус</TableHead>
              <TableHead className="text-center">Порядок</TableHead>
              <TableHead className="w-24">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-12 h-12 rounded object-cover"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{product.name}</span>
                    {product.is_featured && (
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                  {product.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {product.description}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {CATEGORIES.find((c) => c.value === product.category)?.label ||
                      product.category}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{formatPrice(product.price_silver)} ₽</div>
                    {product.price_gold && (
                      <div className="text-xs text-muted-foreground">
                        Золото: {formatPrice(product.price_gold)} ₽
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={product.is_available ? "default" : "secondary"}>
                    {product.is_available ? "Активен" : "Скрыт"}
                  </Badge>
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {product.display_order}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(product)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(product)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Редактировать товар" : "Новый товар"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Название *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Волк-хранитель"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Описание товара..."
                rows={3}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Категория</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Image URL */}
            <div className="space-y-2">
              <Label htmlFor="image_url">URL изображения *</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, image_url: e.target.value }))
                }
                placeholder="https://..."
              />
              {formData.image_url && (
                <img
                  src={formData.image_url}
                  alt="Preview"
                  className="w-24 h-24 rounded object-cover mt-2"
                />
              )}
            </div>

            {/* Gallery URLs */}
            <div className="space-y-2">
              <Label htmlFor="gallery_urls">Дополнительные фото (по одному URL на строку)</Label>
              <Textarea
                id="gallery_urls"
                value={formData.gallery_urls}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, gallery_urls: e.target.value }))
                }
                placeholder="https://...&#10;https://..."
                rows={3}
              />
            </div>

            {/* Prices */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price_silver">Цена серебро (руб.) *</Label>
                <Input
                  id="price_silver"
                  type="number"
                  value={formData.price_silver}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, price_silver: e.target.value }))
                  }
                  placeholder="7500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price_gold">Цена золото (руб.)</Label>
                <Input
                  id="price_gold"
                  type="number"
                  value={formData.price_gold}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, price_gold: e.target.value }))
                  }
                  placeholder="35000"
                />
              </div>
            </div>

            {/* Sizes */}
            <div className="space-y-2">
              <Label>Доступные размеры</Label>
              <div className="flex gap-2">
                {SIZES.map((size) => (
                  <Button
                    key={size}
                    type="button"
                    variant={formData.sizes_available.includes(size) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleSize(size)}
                    className="uppercase"
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>

            {/* Display Order */}
            <div className="space-y-2">
              <Label htmlFor="display_order">Порядок сортировки</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, display_order: e.target.value }))
                }
                placeholder="0"
              />
            </div>

            {/* Switches */}
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="is_available"
                  checked={formData.is_available}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, is_available: checked }))
                  }
                />
                <Label htmlFor="is_available">Активен</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, is_featured: checked }))
                  }
                />
                <Label htmlFor="is_featured">Хит продаж</Label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
