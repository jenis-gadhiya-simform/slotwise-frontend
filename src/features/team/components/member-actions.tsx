import { MailIcon, MoreHorizontalIcon, UserMinusIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { errorMessage } from '@/lib/api/errors'
import { manageableRoles, ROLE_LABELS } from '@/lib/permissions'
import { MemberRole, type Member } from '@/lib/types'
import { useRemoveMember, useResendMemberSetup, useUpdateMember } from '../api'

interface MemberActionsProps {
  member: Member
  tenantId: string
  actorRole: MemberRole
}

/** Row menu: change role, calendar on/off, resend invite, remove. */
export function MemberActions({ member, tenantId, actorRole }: MemberActionsProps) {
  const [confirmRemove, setConfirmRemove] = useState(false)
  const update = useUpdateMember(tenantId)
  const resend = useResendMemberSetup(tenantId)
  const remove = useRemoveMember(tenantId)
  const onError = (error: unknown) => toast.error(errorMessage(error))

  const changeRole = (role: string) => {
    if (role === member.role) return
    update.mutate(
      { id: member.id, role: role as MemberRole },
      {
        onSuccess: () => toast.success(`${member.name} is now ${ROLE_LABELS[role as MemberRole]}.`),
        onError,
      },
    )
  }

  const toggleBookable = (bookable: boolean) =>
    update.mutate(
      { id: member.id, bookable },
      {
        onSuccess: () =>
          toast.success(bookable ? `${member.name} now takes bookings.` : `${member.name}’s calendar is off.`),
        onError,
      },
    )

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${member.name}`}>
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="truncate">{member.name}</DropdownMenuLabel>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Change role</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup value={member.role} onValueChange={changeRole}>
                {manageableRoles(actorRole).map((role) => (
                  <DropdownMenuRadioItem key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuCheckboxItem
            checked={member.bookable}
            onCheckedChange={toggleBookable}
            disabled={member.role === MemberRole.STAFF}
          >
            Takes bookings
          </DropdownMenuCheckboxItem>
          {member.status === 'PENDING_SETUP' ? (
            <DropdownMenuItem
              onSelect={() =>
                resend.mutate(member.id, {
                  onSuccess: () => toast.success(`New invite sent to ${member.email}.`),
                  onError,
                })
              }
            >
              <MailIcon />
              Resend invite
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirmRemove(true)}>
            <UserMinusIcon />
            Remove from team
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmRemove}
        onOpenChange={setConfirmRemove}
        title={`Remove ${member.name}?`}
        description="They lose access to this business right away and their calendar is turned off. Their account and other businesses aren’t affected."
        confirmLabel="Remove"
        destructive
        pending={remove.isPending}
        onConfirm={() =>
          remove.mutate(member.id, {
            onSuccess: () => {
              setConfirmRemove(false)
              toast.success(`${member.name} was removed from the team.`)
            },
            onError,
          })
        }
      />
    </>
  )
}
