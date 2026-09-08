import { RiCloseLine, RiDownloadLine, RiPriceTag3Line } from "@remixicon/react";
import { Dialog, Heading, Modal, ModalOverlay } from "react-aria-components";
import { Button } from "@/src/components/ui/Button";

const settings = [
  ["外观", "亮色与暗色模式", "后续"],
  ["AI", "配置自己的 API Key 与模型", "后续"],
  ["内容简报", "按收藏密度生成日报或周刊", "后续"],
];

export function SettingsDialog({ isOpen, onClose, onOpenImport, onOpenTags }: { isOpen: boolean; onClose: () => void; onOpenImport: () => void; onOpenTags: () => void }) {
  return (
    <ModalOverlay className="detail-overlay" isOpen={isOpen} isDismissable onOpenChange={(open) => !open && onClose()}>
      <Modal className="form-modal settings-modal">
        <Dialog className="form-dialog">
          {({ close }) => <>
            <header className="form-dialog-header settings-header"><div><Heading slot="title">设置</Heading><p>低频能力统一放在这里，侧栏保持专注于找内容。</p></div><Button size="icon" variant="ghost" aria-label="关闭设置" onPress={close}><RiCloseLine size={19} /></Button></header>
            <div className="settings-list">
              <div className="settings-row"><div><strong>导入</strong><span>批量粘贴链接，或读取浏览器导出的书签 HTML。</span></div><Button size="sm" variant="secondary" onPress={() => { close(); onOpenImport(); }}><RiDownloadLine size={15} />开始导入</Button></div>
              <div className="settings-row"><div><strong>标签</strong><span>重命名、合并或删除本地标签。</span></div><Button size="sm" variant="secondary" onPress={() => { close(); onOpenTags(); }}><RiPriceTag3Line size={15} />管理标签</Button></div>
              {settings.map(([title, description, state]) => <div className="settings-row" key={title}><div><strong>{title}</strong><span>{description}</span></div><span className="settings-state">{state}</span></div>)}
            </div>
          </>}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
