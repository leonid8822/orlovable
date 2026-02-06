import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { KanbanColumn } from './KanbanColumn';

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

interface KanbanBoardProps {
  kanban: Record<string, Order[]>;
  statuses: Status[];
  onMoveOrder: (orderId: string, newStatus: string) => Promise<void>;
  onOrderClick: (order: Order) => void;
}

export function KanbanBoard({ kanban, statuses, onMoveOrder, onOrderClick }: KanbanBoardProps) {
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Dropped outside any column
    if (!destination) return;

    // Dropped in same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Move to new status
    const newStatus = destination.droppableId;
    if (newStatus !== source.droppableId) {
      await onMoveOrder(draggableId, newStatus);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-280px)]">
        {statuses.map((status) => (
          <KanbanColumn
            key={status.value}
            status={status}
            orders={kanban[status.value] || []}
            onOrderClick={onOrderClick}
          />
        ))}
      </div>
    </DragDropContext>
  );
}
