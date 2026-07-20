import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/core/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs'

export interface TabDefinition {
  id: string
  label: string
  content: React.ReactNode
}

export interface TabbedDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  tabs: TabDefinition[]
  /** 受控模式：当前激活的标签页 ID */
  activeTab?: string
  /** 受控模式：标签页切换回调 */
  onActiveTabChange?: (tabId: string) => void
  /** 非受控模式：默认激活的标签页 ID */
  defaultTab?: string
}

export function TabbedDialog({ open, onOpenChange, title, tabs, activeTab, onActiveTabChange, defaultTab }: TabbedDialogProps) {
  // 受控模式
  const controlled = activeTab !== undefined && onActiveTabChange !== undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="px-6 py-4">
          {controlled ? (
            <Tabs value={activeTab} onValueChange={onActiveTabChange}>
              <TabsList className="w-full">
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} className="flex-1">
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {tabs.map((tab) => (
                <TabsContent key={tab.id} value={tab.id} className="mt-4">
                  {tab.content}
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <Tabs defaultValue={defaultTab ?? tabs[0]?.id}>
              <TabsList className="w-full">
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} className="flex-1">
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {tabs.map((tab) => (
                <TabsContent key={tab.id} value={tab.id} className="mt-4">
                  {tab.content}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
