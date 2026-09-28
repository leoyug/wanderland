import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { RiLoader4Line } from "@remixicon/react";
import { Button } from "@/src/components/ui/Button";
import { digestRepository } from "@/src/db/digestRepository";
import { digestDateLabel } from "@/src/domain/digest";
import { SettingsCard, SettingsHeader, SettingsRow, SettingsSectionHeading } from "@/src/features/settings/SettingsPrimitives";
import { t } from "@/src/i18n/ui";
import { useDigestDate } from "./useDigestDate";

export function DigestSettings() {
  const date = useDigestDate();
  const today = useLiveQuery(() => digestRepository.get(`daily-${date}`), [date]);
  const weekly = useLiveQuery(() => digestRepository.list("weekly"), []);
  const latest = weekly?.[0];
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [weeklyError, setWeeklyError] = useState("");
  const refreshWeekly = () => { setWeeklyError(""); void digestRepository.ensureWeeklyDigests().catch(() => setWeeklyError(t("一周简报生成失败，请重试。"))); };
  useEffect(refreshWeekly, [date]);
  const generate = async () => {
    setGenerating(true); setError("");
    try { await digestRepository.generate("daily"); }
    catch { setError(t("今日总结生成失败，请重试。")); }
    finally { setGenerating(false); }
  };
  return <div className="settings-form digest-settings">
    <SettingsHeader title={t("内容简报")} description={t("定期回顾新收藏，发现值得继续探索的内容。")} />
    <section className="settings-form-section">
      <SettingsSectionHeading title={t("简报类型")} description={t("将收藏整理成简报，留一份可以随时重读的记录。")} />
      <SettingsCard>
        <SettingsRow title={t("今日总结")} description={t("从今天新增的收藏中提炼主题，生成一份简短总结。")} control={<div className="settings-list-actions">
          {today && !generating ? <a className="button button-secondary" href={`#digest/${today.id}?from=settings`}>{t("查看今日总结")}</a> : <Button variant="secondary" isDisabled={generating} aria-busy={generating} onPress={() => void generate()}>{generating ? <><RiLoader4Line className="digest-spinner" size={16} aria-hidden="true" />{t("生成中…")}</> : t("生成")}</Button>}
          <a className="button button-secondary" href="#settings/digest/daily">{t("往期")}</a>
        </div>}><div role="status" aria-live="polite">{error ? <span className="is-error">{error}</span> : generating ? t("正在整理今天的收藏…") : today ? t("今日总结已生成，可以开始阅读。") : null}</div></SettingsRow>
        <SettingsRow title={t("一周简报")} description={t("每周自动汇总新收藏，并穿插值得重温的旧内容。")} control={<div className="settings-list-actions">
          {latest ? <a className="button button-secondary digest-latest-link" href={`#digest/${latest.id}?from=settings`} aria-label={`${t("最新一期")} ${digestDateLabel(latest)}${!latest.readAt ? ` · ${t("未读")}` : ""}`}>{digestDateLabel(latest)}{!latest.readAt ? <span className="digest-unread-dot" aria-hidden="true" /> : null}</a> : null}
          <a className="button button-secondary" href="#settings/digest/weekly">{t("往期")}</a>
        </div>}>{weeklyError ? <div className="digest-error-row" role="alert"><span className="is-error">{weeklyError}</span><Button size="sm" onPress={refreshWeekly}>{t("重试")}</Button></div> : weekly?.length === 0 ? t("完整的一周结束后，有收藏内容时会生成首期简报。") : null}</SettingsRow>
      </SettingsCard>
    </section>
  </div>;
}
