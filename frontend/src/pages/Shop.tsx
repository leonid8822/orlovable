import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { Loader2, ShoppingBag, Sparkles, Star } from "lucide-react";

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
  slug?: string;
}

const Shop = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const brownColor = "hsl(25, 45%, 35%)";
  const brownLightColor = "hsl(25, 50%, 45%)";

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data, error } = await api.getProducts('totem');
        if (!error && data) {
          setProducts(data);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price);
  };

  return (
    <div className="min-h-screen bg-background theme-totems">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="pt-28 pb-12 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center animate-fade-in">
              <div className="flex items-center justify-center gap-2 mb-4">
                <ShoppingBag className="w-8 h-8" style={{ color: brownColor }} />
                <Badge
                  variant="outline"
                  className="text-sm px-3 py-1"
                  style={{ borderColor: brownColor, color: brownColor }}
                >
                  Готовая коллекция
                </Badge>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display mb-6 leading-tight">
                Магазин <span className="text-gradient-brown">тотемов</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                Готовые ювелирные тотемы из нашей коллекции.
                Каждый — уникальный артефакт силы.
              </p>
            </div>
          </div>
        </section>

        {/* Products Grid */}
        <section className="pb-20 px-4">
          <div className="container mx-auto max-w-6xl">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: brownColor }} />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg text-muted-foreground mb-6">
                  Коллекция пополняется...
                </p>
                <Link to="/totems">
                  <Button
                    style={{ background: `linear-gradient(135deg, ${brownLightColor} 0%, ${brownColor} 100%)` }}
                    className="text-white"
                  >
                    Создать свой тотем
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-[hsl(25,45%,35%)] transition-all duration-300 hover:shadow-xl cursor-pointer"
                    onClick={() => setSelectedProduct(product)}
                  >
                    {/* Image */}
                    <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-background to-card">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {product.is_featured && (
                        <Badge
                          className="absolute top-3 left-3 gap-1"
                          style={{ background: brownColor }}
                        >
                          <Star className="w-3 h-3" />
                          Хит
                        </Badge>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-5">
                      <h3 className="text-lg font-display mb-2 group-hover:text-[hsl(25,45%,35%)] transition-colors">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {product.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xl font-display">
                            от {formatPrice(product.price_silver)} ₽
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">
                            серебро
                          </span>
                        </div>
                        <Button
                          size="sm"
                          style={{ background: `linear-gradient(135deg, ${brownLightColor} 0%, ${brownColor} 100%)` }}
                          className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Подробнее
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 bg-card/50">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-2xl md:text-3xl font-display mb-4">
              Не нашли подходящий тотем?
            </h2>
            <p className="text-muted-foreground mb-8">
              Создайте уникальное украшение по своему эскизу или фото
            </p>
            <Link to="/totems">
              <Button
                size="lg"
                style={{ background: `linear-gradient(135deg, ${brownLightColor} 0%, ${brownColor} 100%)` }}
                className="text-white px-10"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Создать свой тотем
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />

      {/* Product Modal */}
      {selectedProduct && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="bg-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Image */}
            <div className="aspect-square relative">
              <img
                src={selectedProduct.image_url}
                alt={selectedProduct.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <h2 className="text-2xl font-display mb-2">{selectedProduct.name}</h2>
              {selectedProduct.description && (
                <p className="text-muted-foreground mb-6">{selectedProduct.description}</p>
              )}

              {/* Prices */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <span>Серебро 925</span>
                  <span className="font-display text-xl">
                    от {formatPrice(selectedProduct.price_silver)} ₽
                  </span>
                </div>
                {selectedProduct.price_gold && (
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                    <span>Золото 585</span>
                    <span className="font-display text-xl">
                      от {formatPrice(selectedProduct.price_gold)} ₽
                    </span>
                  </div>
                )}
              </div>

              {/* Sizes */}
              {selectedProduct.sizes_available && selectedProduct.sizes_available.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground mb-2">Доступные размеры:</p>
                  <div className="flex gap-2">
                    {selectedProduct.sizes_available.map((size) => (
                      <Badge key={size} variant="outline" className="uppercase">
                        {size}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Order Button */}
              <a
                href="https://t.me/olai_support"
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button
                  size="lg"
                  className="w-full text-white"
                  style={{ background: `linear-gradient(135deg, ${brownLightColor} 0%, ${brownColor} 100%)` }}
                >
                  Заказать в Telegram
                </Button>
              </a>
              <p className="text-xs text-muted-foreground text-center mt-3">
                Напишите нам, и мы поможем с заказом
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shop;
