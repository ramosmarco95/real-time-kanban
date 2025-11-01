// Utility functions for order calculations
export function calculateOrder(
  beforeOrder?: number,
  afterOrder?: number
): number {
  if (beforeOrder === undefined && afterOrder === undefined) {
    return 1000;
  }
  
  if (beforeOrder === undefined) {
    return afterOrder! - 1000;
  }
  
  if (afterOrder === undefined) {
    return beforeOrder + 1000;
  }
  
  return (beforeOrder + afterOrder) / 2;
}

// Generate unique order for new items at the end
export function generateNewOrder(existingOrders: number[]): number {
  if (existingOrders.length === 0) {
    return 1000;
  }
  
  const maxOrder = Math.max(...existingOrders);
  return maxOrder + 1000;
}

// Rebalance orders when they get too close
export function rebalanceOrders(
  items: Array<{ id: string; order: number }>
): Array<{ id: string; order: number }> {
  const sorted = [...items].sort((a, b) => a.order - b.order);
  
  return sorted.map((item, index) => ({
    ...item,
    order: (index + 1) * 1000,
  }));
}

// ID generation
export function generateId(): string {
  return crypto.randomUUID();
}