/** Preview a dragged view just before or after the row whose midpoint was crossed. */
export function reorderSavedViewIds(order: readonly string[], sourceId: string, targetId: string, after: boolean): string[] {
  if (sourceId === targetId || !order.includes(sourceId) || !order.includes(targetId)) return [...order];
  const next = order.filter((id) => id !== sourceId);
  const targetIndex = next.indexOf(targetId);
  next.splice(targetIndex + (after ? 1 : 0), 0, sourceId);
  return next;
}

/** The repository inserts before targetId; an unknown target appends at the end. */
export function savedViewInsertionTarget(order: readonly string[], sourceId: string): string {
  const index = order.indexOf(sourceId);
  return index >= 0 ? (order[index + 1] ?? "__end__") : "__end__";
}
