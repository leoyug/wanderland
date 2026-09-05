import type { AiStatus } from "@/src/domain/inspiration";

const statusText: Record<AiStatus, string> = {
  complete: "整理完成",
  pending: "待处理",
  failed: "整理失败",
};

export function StatusDot({ status }: { status: AiStatus }) {
  return (
    <span className={`status status-${status}`}>
      <span aria-hidden="true" />
      {statusText[status]}
    </span>
  );
}
