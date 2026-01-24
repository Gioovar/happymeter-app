---
description: Protocol to ensure data safety before cleanup operations
---

# 🛡️ Data Safety Protocol

To prevent accidental data loss during maintenance or cleanup, follow this strict protocol.

## 1. Pre-Cleanup Backup
Before running ANY script that deletes data (e.g., `cleanup_*.ts`), ALWAYS run the backup utility:

```bash
# Verify connection
npx prisma db pull --print

# Run Backup Script (Exports critical tables to backups/ directory)
npx tsx scripts/backup_data.ts
```

## 2. Identify "Protected" Users
Never delete users programmatically without checking the **Protected List**.
Add known active users to `PROTECTED_USERS` in any cleanup script.

## 3. Use Soft Deletes (Recommended)
Instead of `deleteMany`, prefer flagging:
```typescript
await prisma.user.update({ where: { id }, data: { isActive: false, deletedAt: new Date() } });
```
*(Requires Schema Update)*

## 4. Supabase / Database Provider
- Check the Supabase Dashboard -> Database -> Backups.
- Ensure Point-in-Time Recovery (PITR) is enabled if budget allows.
- Before major operations, click "Create Backup" manually in the dashboard.
