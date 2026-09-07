interface SidebarIconProps {
  src: string;
}

export function SidebarIcon({ src }: SidebarIconProps) {
  return <span className="sidebar-icon" style={{ maskImage: `url(${src})`, WebkitMaskImage: `url(${src})` }} aria-hidden="true" />;
}
