# Tasks: Core Directory Restructure

## 1. 创建目标目录

- [x] 1.1 创建 `frontend/src/core/store/` 目录
- [x] 1.2 创建 `frontend/src/core/hooks/` 目录
- [x] 1.3 创建 `frontend/src/core/styles/` 目录

## 2. 迁移 Stores

- [x] 2.1 移动 `store/authStore.ts` → `core/store/authStore.ts`，更新内部 import
- [x] 2.2 移动 `store/settingsStore.ts` → `core/store/settingsStore.ts`，更新内部 import
- [x] 2.3 移动 `store/__tests__/authStore.test.ts` → `core/store/__tests__/authStore.test.ts`，更新 import

## 3. 迁移 Lib 文件

- [x] 3.1 移动 `lib/utils.ts` → `core/lib/utils.ts`
- [x] 3.2 移动 `lib/unwrap.ts` → `core/lib/unwrap.ts`
- [x] 3.3 移动 `lib/ics.ts` → `core/lib/ics.ts`
- [x] 3.4 移动 `lib/authInterceptor.ts` → `core/lib/authInterceptor.ts`
- [x] 3.5 移动 `lib/__tests__/unwrap.test.ts` → `core/lib/__tests__/unwrap.test.ts`，更新 import
- [x] 3.6 移动 `lib/__tests__/utils.test.ts` → `core/lib/__tests__/utils.test.ts`，更新 import

## 4. 迁移 UI 组件

- [x] 4.1 移动 `components/ui/button.tsx` → `core/components/ui/button.tsx`
- [x] 4.2 移动 `components/ui/dialog.tsx` → `core/components/ui/dialog.tsx`
- [x] 4.3 移动 `components/ui/input.tsx` → `core/components/ui/input.tsx`
- [x] 4.4 移动 `components/ui/label.tsx` → `core/components/ui/label.tsx`
- [x] 4.5 移动 `components/ui/popover.tsx` → `core/components/ui/popover.tsx`
- [x] 4.6 移动 `components/ui/select.tsx` → `core/components/ui/select.tsx`
- [x] 4.7 移动 `components/ui/switch.tsx` → `core/components/ui/switch.tsx`
- [x] 4.8 移动 `components/ui/tabs.tsx` → `core/components/ui/tabs.tsx`
- [x] 4.9 移动 `components/ui/textarea.tsx` → `core/components/ui/textarea.tsx`

## 5. 迁移 Hooks

- [x] 5.1 移动 `hooks/useTheme.ts` → `core/hooks/useTheme.ts`，更新内部 import
- [x] 5.2 移动 `hooks/useNotification.ts` → `core/hooks/useNotification.ts`，更新内部 import
- [x] 5.3 移动 `hooks/useSseNotifications.ts` → `core/hooks/useSseNotifications.ts`，更新内部 import

## 6. 迁移 Styles

- [x] 6.1 移动 `styles/themes.css` → `core/styles/themes.css`

## 7. 全局 Import 路径更新

- [x] 7.1 全局替换 `@/store/authStore` → `@/core/store/authStore`
- [x] 7.2 全局替换 `@/store/settingsStore` → `@/core/store/settingsStore`
- [x] 7.3 全局替换 `@/lib/utils` → `@/core/lib/utils`
- [x] 7.4 全局替换 `@/lib/unwrap` → `@/core/lib/unwrap`
- [x] 7.5 全局替换 `@/lib/ics` → `@/core/lib/ics`
- [x] 7.6 全局替换 `@/lib/authInterceptor` → `@/core/lib/authInterceptor`
- [x] 7.7 全局替换 `@/hooks/useTheme` → `@/core/hooks/useTheme`
- [x] 7.8 全局替换 `@/hooks/useNotification` → `@/core/hooks/useNotification`
- [x] 7.9 全局替换 `@/hooks/useSseNotifications` → `@/core/hooks/useSseNotifications`
- [x] 7.10 全局替换 `@/components/ui/` → `@/core/components/ui/`

## 8. 全量验证

- [x] 8.1 `turbo run build` 全量构建通过
- [x] 8.2 `cd frontend && pnpm run verify`（lint + build + test）全部通过（25 tests）
- [x] 8.3 `cd backend && mvn test` 不受影响（BUILD SUCCESS）

## 9. 文档同步

- [x] 9.1 架构变动 → 更新 `docs/architecture.md`（core/ 目录结构）
- [x] 9.2 架构变动 → 更新 `CLAUDE.md`（core/ 路径说明，已在 event-bus 变更中完成）
- [x] 9.3 无新组件/实体/API → 跳过其他文档
