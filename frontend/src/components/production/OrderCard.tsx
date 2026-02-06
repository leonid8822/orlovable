import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Package } from 'lucide-react';

interface Order {
  id: string;
  order_number?: string;
  status: string;
  customer_name: string;
  customer_email?: string;
  customer_telegram?: string;
  product_type: string;
  material: string;
  size?: string;
  form_factor?: string;
  reference_images?: string[];
  generated_images?: string[];
  final_price?: number;
  quoted_price?: number;
  total_cost?: number;
  created_at: string;
  time_in_status_seconds?: number;
}

interface OrderCardProps {
  order: Order;
  onClick: () => void;
}

const PRODUCT_TYPES: Record<string, string> = {
  pendant: 'Кулон',
  bracelet: 'Браслет',
  ring: 'Кольцо',
  earrings: 'Серьги',
  brooch: 'Брошь',
  other: 'Другое',
};

const MATERIALS: Record<string, string> = {
  silver: 'Серебро',
  gold: 'Золото',
  gold_white: 'Белое золото',
  platinum: 'Платина',
};

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}с`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}м`;
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}ч ${mins}м`;
  }
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return `${days}д ${hours}ч`;
}

function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined) return '—';
  return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
}

export function OrderCard({ order, onClick }: OrderCardProps) {
  const thumbnail = useMemo(() => {
    // Try generated images first, then reference images
    const images = order.generated_images || order.reference_images || [];
    return images[0] || null;
  }, [order.generated_images, order.reference_images]);

  const price = order.final_price || order.quoted_price;

  return (
    <div
      onClick={onClick}
      className="bg-card border rounded-lg p-3 cursor-pointer hover:shadow-md hover:border-primary/50 transition-all"
    >
      {/* Order number */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono text-muted-foreground">
          {order.order_number || order.id.slice(0, 8)}
        </span>
      </div>

      {/* Customer */}
      <div className="flex items-center gap-1.5 mb-2">
        <User className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-sm font-medium truncate">{order.customer_name}</span>
      </div>

      {/* Product info */}
      <div className="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground">
        <Package className="w-3.5 h-3.5" />
        <span>
          {PRODUCT_TYPES[order.product_type] || order.product_type}
          {' • '}
          {MATERIALS[order.material] || order.material}
          {order.size && ` • ${order.size.toUpperCase()}`}
        </span>
      </div>

      {/* Thumbnail */}
      {thumbnail && (
        <div className="mb-2 rounded overflow-hidden bg-muted aspect-square">
          <img
            src={thumbnail}
            alt="Preview"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Time in status and price */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatDuration(order.time_in_status_seconds || 0)}</span>
        </div>
        {price && (
          <Badge variant="secondary" className="text-xs">
            {formatPrice(price)}
          </Badge>
        )}
      </div>
    </div>
  );
}
