import { getAiCredentials } from "./config";
import { AiProviderError, OpenAiCompatibleProvider } from "./openAiCompatibleProvider";
import { inspirationRepository } from "@/src/db/repository";

let activeRun: Promise<void> | undefined;
let rerunRequested = false;

async function runQueue() {
  const credentials = await getAiCredentials();
  if (!credentials) return;
  const provider = new OpenAiCompatibleProvider({
    endpoint: credentials.settings.endpoint,
    model: credentials.settings.model,
    apiKey: credentials.apiKey,
    extraBody: credentials.settings.provider === "deepseek" ? { thinking: { type: "disabled" } } : undefined,
  });
  const tasks = await inspirationRepository.listRunnableAiTasks();
  for (const task of tasks) {
    if (!(await inspirationRepository.isAiTaskReady(task.itemId))) continue;
    await inspirationRepository.markAiStarted(task.id);
    try {
      const input = await inspirationRepository.getAiAnalysisInput(task.itemId);
      if (!input) continue;
      const analysis = await provider.analyze(input);
      await inspirationRepository.completeAiTask(task.id, analysis);
    } catch (error) {
      const retryable = error instanceof AiProviderError ? error.retryable : true;
      const reason = error instanceof Error ? error.message : "AI 处理失败";
      await inspirationRepository.failAiTask(task.id, reason, retryable);
    }
  }
}

export function processAiQueue() {
  if (activeRun) {
    rerunRequested = true;
    return activeRun;
  }
  activeRun = (async () => {
    do {
      rerunRequested = false;
      await runQueue();
    } while (rerunRequested);
  })().finally(() => { activeRun = undefined; });
  return activeRun;
}
