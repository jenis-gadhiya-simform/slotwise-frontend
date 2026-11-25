import { createFileRoute } from '@tanstack/react-router'
import { requireStaff } from '@/features/auth/guards'

/** Staff-side app: business members only (platform admins use /admin). */
export const Route = createFileRoute('/app')({
  beforeLoad: async (args) => ({ viewer: await requireStaff(args) }),
})
