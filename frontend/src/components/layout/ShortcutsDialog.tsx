import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/core/components/ui/dialog'
import { Kbd } from '@/core/components/ui/kbd'
import { useShellStore } from '@/core/store/shellStore'

interface ShortcutGroup {
  title: string
  items: Array<{ keys: string[]; desc: string }>
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: '全局',
    items: [
      { keys: ['?'], desc: '打开本帮助' },
      { keys: ['Esc'], desc: '关闭弹窗' },
    ],
  },
  {
    title: '日历视图',
    items: [
      { keys: ['N'], desc: '新建日程' },
      { keys: ['T'], desc: '回到今天' },
      { keys: ['←', '→'], desc: '上一页 / 下一页' },
      { keys: ['1', '2', '3', '4'], desc: '月 / 周 / 日 / 议程视图' },
      { keys: ['/'], desc: '聚焦搜索框' },
    ],
  },
  {
    title: '任务看板',
    items: [
      { keys: ['N'], desc: '新建任务' },
      { keys: ['1', '2'], desc: '看板 / 列表视图' },
    ],
  },
]

export function ShortcutsDialog() {
  const showShortcuts = useShellStore((s) => s.showShortcuts)
  const setShowShortcuts = useShellStore((s) => s.setShowShortcuts)

  return (
    <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>键盘快捷键</DialogTitle>
        </DialogHeader>
        <div className="px-6 py-4 space-y-4">
          {SHORTCUT_GROUPS.map((group) => (
            <section key={group.title} className="space-y-2">
              <h3 className="text-xs font-medium text-foreground-muted">{group.title}</h3>
              <div className="space-y-2">
                {group.items.map(({ keys, desc }) => (
                  <div key={`${group.title}-${desc}`} className="flex items-center justify-between">
                    <span className="text-sm text-foreground-secondary">{desc}</span>
                    <span className="flex items-center gap-1">
                      {keys.map((k) => (
                        <Kbd key={k} className="text-foreground-secondary shadow-card">
                          {k}
                        </Kbd>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
