import { useEffect, useLayoutEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { RiArrowLeftLine, RiCloseLine, RiSearchLine } from "@remixicon/react";
import { Button } from "@/src/components/ui/Button";
import { SearchField, SearchInput } from "@/src/components/ui/SearchField";
import { DigestEditionCard } from "@/src/components/inspiration/DigestEditionCard";
import { digestRepository } from "@/src/db/digestRepository";
import { digestRangeLabel, type DigestKind } from "@/src/domain/digest";
import { SettingsHeader } from "@/src/features/settings/SettingsPrimitives";
import { t, tf } from "@/src/i18n/ui";

const historyState = new Map<DigestKind, { search: string; scroll: number; selected?: string }>();
export function DigestHistoryPage({ kind }: { kind: DigestKind }) {
  const [search, setSearch] = useState(historyState.get(kind)?.search ?? "");
  const digests = useLiveQuery(() => digestRepository.list(kind), [kind]);
  const [error, setError] = useState("");
  const refresh = () => { setError(""); if (kind === "weekly") void digestRepository.ensureWeeklyDigests().catch(() => setError(t("一周简报生成失败，请重试。"))); };
  useEffect(refresh, [kind]);
  useLayoutEffect(() => {
    if (!digests) return;
    const saved = historyState.get(kind);
    if (saved) {
      window.scrollTo(0, saved.scroll);
      if (saved.selected) document.getElementById(`edition-${saved.selected}`)?.querySelector("a")?.focus({ preventScroll: true });
    } else window.scrollTo(0, 0);
  }, [kind, !!digests]);
  const query = search.trim().toLocaleLowerCase();
  const filtered = digests?.filter((digest) => `${digest.title} ${digest.introduction} ${digestRangeLabel(digest)}`.toLocaleLowerCase().includes(query));
  return <div className="settings-form digest-history">
    <div><a className="button button-ghost digest-history-back" href="#settings/digest"><RiArrowLeftLine size={16} aria-hidden="true" />{t("内容简报")}</a>
      <SettingsHeader title={kind === "weekly" ? t("一周简报") : t("今日总结")} description={t("把收藏串成记录，再读一次，发现新的联系。")} />
    </div>
    <div className="digest-history-toolbar"><span>{digests ? tf("共 {count} 期", { count: digests.length }) : t("正在读取…")}</span>
      <SearchField className="tag-search-field" aria-label={t("搜索往期简报")} value={search} onChange={setSearch}><RiSearchLine size={16} aria-hidden="true" /><SearchInput placeholder={t("搜索标题或日期…")} />{search ? <Button variant="ghost" size="icon" aria-label={t("清空搜索")} onPress={() => setSearch("")}><RiCloseLine size={15} aria-hidden="true" /></Button> : null}</SearchField>
    </div>
    {error ? <div role="alert" className="digest-error-row"><p>{error}</p><Button onPress={refresh}>{t("重试")}</Button></div> : null}
    <div className="digest-edition-grid">{filtered?.map((digest) => <div key={digest.id} id={`edition-${digest.id}`}><DigestEditionCard digest={digest} href={`#digest/${digest.id}?from=${kind}`} onOpen={() => historyState.set(kind, { search, scroll: window.scrollY, selected: digest.id })} /></div>)}</div>
    {filtered?.length === 0 ? <div className="digest-empty"><h2>{query ? t("没有找到匹配的简报") : t("还没有往期简报")}</h2><p>{query ? t("试试其他标题或日期。") : kind === "daily" ? t("返回内容简报，生成你的第一份今日总结。") : t("完整的一周结束后，有收藏内容时会生成首期简报。")}</p></div> : null}
  </div>;
}
