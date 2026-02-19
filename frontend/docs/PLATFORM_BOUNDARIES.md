# Platform Boundaries (Web now, Native later)

## Why
To allow shared domain/use-case logic across Web + future Capacitor/React Native without rewriting core behavior.

## Keep platform-specific code behind adapters
- Storage (localStorage/IndexedDB vs native secure storage)
- Connectivity detection
- Draft queue persistence
- Notification scheduling bridge
- File export bridge (GDPR export download/share)

## Rules
1. Features import interfaces from `core/platform`, not browser globals directly.
2. Domain logic must be pure TypeScript where possible.
3. Route guards depend on canonical user lifecycle fields only.
4. Contracts mirror backend enums exactly.

## Planned adapter seams
- `StorageAdapter`
- `ConnectivityAdapter`
- `SyncQueueAdapter`
- `NotificationAdapter`
- `ExportAdapter`
