import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useCalendarStore } from '../../store/calendarStore'

const SHORTCUTS: Array<{ keys: string[]; desc: string }> = [
  { keys: ['N'], desc: '新建日程' },
  { keys: ['T'], desc: '回到今天' },
  { keys: ['←', '→'], desc: '上一页 / 下一页' },
  { keys: ['1', '2', '3', '4'], desc: '月 / 周 / 日 / 议程视图' },
  { keys: ['/'], desc: '聚焦搜索框' },
  { keys: ['Esc'], desc: '关闭弹窗' },
  { keys: ['?'], desc: '打开本帮助' },
]

export function ShortcutsDialog() {
  const showShortcuts = useCalendarStore((s) => s.showShortcuts)
  const setShowShortcuts = useCalendarStore((s) => s.setShowShortcuts)

  return (
    <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>键盘快捷键</DialogTitle>
        </DialogHeader>
        <div className="px-6 py-4 space-y-2.5">
          {SHORTCUTS.map(({ keys, desc }) => (
            <div key={desc} className="flex items-center justify-between">
              <span className="text-sm text-foreground-secondary">{desc}</span>
              <span className="flex items-center gap-1">
                {keys.map((k) => (
                  <kbd
                    key={k}
                    className="min-w-[24px] px-1.5 py-1 text-[11px] font-mono text-center bg-hover border border-border rounded-md text-foreground-secondary shadow-sm"
                  >
                    {k}
                  </kbd>
                ))}
              </span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
