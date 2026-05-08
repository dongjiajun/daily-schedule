interface EventModalProps {
  eventId: number | null
  onClose: () => void
}

export function EventModal({ eventId, onClose }: EventModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {eventId ? '编辑日程' : '新建日程'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">✕</button>
        </div>
        <p className="text-sm text-gray-400">
          事件表单将在下一阶段实现
        </p>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg hover:bg-gray-100">取消</button>
          <button className="px-4 py-2 text-sm rounded-lg bg-gray-900 text-white">保存</button>
        </div>
      </div>
    </div>
  )
}
