import type { ReactNode } from "react";

export function SettingsHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <header className="settings-page-header"><div><h1>{title}</h1>{description ? <p>{description}</p> : null}</div>{action}</header>;
}

export function SettingsSectionHeading({ title, description }: { title: string; description: string }) {
  return <div className="settings-section-heading"><h2>{title}</h2><p>{description}</p></div>;
}

export function SettingsCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`settings-card ${className}`.trim()}>{children}</div>;
}

export function SettingsRow({ title, description, control, children }: { title: string; description?: string; control?: ReactNode; children?: ReactNode }) {
  return <div className="settings-card-row">
    <div className="settings-card-row-copy"><strong>{title}</strong>{description ? <span>{description}</span> : null}</div>
    {control ? <div className="settings-card-row-control">{control}</div> : null}
    {children ? <div className="settings-card-row-detail">{children}</div> : null}
  </div>;
}

