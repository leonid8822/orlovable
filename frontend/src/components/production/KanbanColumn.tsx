import { Droppable, Draggable } from '@hello-pangea/dnd';
import { OrderCard } from './OrderCard';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

interface Status {
  value: string;
  label: string;
  color: string;
}

interface KanbanColumnProps {
  status: Status;
  orders: Order[];
  onOrderClick: (order: Order) => void;
}

export function KanbanColumn({ status, orders, onOrderClick }: KanbanColumnProps) {
  return (
    <div className="flex flex-col min-w-[280px] max-w-[280px] bg-muted/30 rounded-lg">
      {/* Column header */}
      <div className="p-3 border-b flex items-center justify-between sticky top-0 bg-muted/30 backdrop-blur-sm rounded-t-lg z-10">
        <div className="flex items-center gap-2">
          <div className={cn('w-3 h-3 rounded-full', status.color)} />
          <span className="font-medium text-sm">{status.label}</span>
        </div>
        <Badge variant="secondary" className="text-xs">
          {orders.length}
        </Badge>
      </div>

      {/* Droppable area */}
      <Droppable droppableId={status.value}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'flex-1 p-2 space-y-2 min-h-[200px] transition-colors overflow-y-auto',
              snapshot.isDraggingOver && 'bg-primary/5'
            )}
          >
            {orders.map((order, index) => (
              <Draggable key={order.id} draggableId={order.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={cn(
                      'transition-transform',
                      snapshot.isDragging && 'rotate-2 scale-105'
                    )}
                  >
                    <OrderCard
                      order={order}
                      onClick={() => onOrderClick(order)}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}

            {orders.length === 0 && !snapshot.isDraggingOver && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Нет заказов
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
