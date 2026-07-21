import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/core/components/ui/popover'
import { Button } from '@/core/components/ui/button'
import { usePetStore } from '../store/petStore'
import { useInteract, useShopItems, usePurchase, useMyPet } from '../hooks/usePet'
import { Utensils, Gamepad2, Loader2 } from 'lucide-react'

export function PetMenu() {
  const open = usePetStore((s) => s.menuOpen)
  const setOpen = usePetStore((s) => s.setMenuOpen)
  const [tab, setTab] = useState<'action' | 'shop'>('action')
  const { data: pet } = useMyPet()
  const interact = useInteract()
  const { data: shopItems } = useShopItems()
  const purchase = usePurchase()

  const coins = pet?.coins ?? 0
  const cheapestFood = shopItems?.reduce((min, item) => (item.price! < min ? item.price! : min), Infinity) ?? Infinity
  const canFeed = coins >= cheapestFood

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-0 right-0 w-7 h-7 rounded-full text-xs"
          title="互动"
        >
          ⋮
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" side="left" align="start">
        <div className="flex gap-1 mb-2">
          <Button
            variant={tab === 'action' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTab('action')}
            className="text-xs"
          >
            互动
          </Button>
          <Button
            variant={tab === 'shop' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTab('shop')}
            className="text-xs"
          >
            商店
          </Button>
        </div>

        {tab === 'action' ? (
          <div className="flex flex-col gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { interact.mutate({ type: 'FEED' }); setOpen(false) }}
              disabled={interact.isPending || !canFeed}
              title={!canFeed ? '专注币不足' : '喂食'}
            >
              {interact.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Utensils className="w-3 h-3 mr-1" />}
              喂食
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { interact.mutate({ type: 'PLAY' }); setOpen(false) }}
              disabled={interact.isPending}
            >
              {interact.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Gamepad2 className="w-3 h-3 mr-1" />}
              玩耍
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
            {shopItems?.map((item) => (
              <Button
                key={item.id}
                variant="outline"
                size="sm"
                className="flex justify-between text-xs"
                onClick={() => { purchase.mutate({ itemId: item.id!, quantity: 1 }); setOpen(false) }}
                disabled={purchase.isPending || coins < (item.price ?? 0)}
                title={coins < (item.price ?? 0) ? '专注币不足' : `购买 ${item.name}`}
              >
                <span>{item.name}</span>
                <span className="text-muted-foreground">🪙{item.price}</span>
              </Button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
