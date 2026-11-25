import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { CalendarDaysIcon, PencilIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { submitHandler, useAppForm, validateOnBlurThenChange } from '@/components/form'
import { FormError } from '@/components/form-error'
import { PageHeader } from '@/components/page-header'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { FieldGroup } from '@/components/ui/field'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useMembership } from '@/features/business/use-membership'
import { calendarsQueryOptions, useUpdateCalendar } from '@/features/team/api'
import { errorMessage } from '@/lib/api/errors'
import { initials } from '@/lib/format'
import { can, canRenameCalendar } from '@/lib/permissions'
import type { StaffCalendar } from '@/lib/types'
import { personNameSchema } from '@/lib/validation'

/** Bookable calendars (any member can view): `/staff`. */
export const Route = createFileRoute('/app/$slug/calendars')({
  validateSearch: z.object({ show: z.enum(['active', 'inactive']).default('active').catch('active') }),
  loaderDeps: ({ search }) => ({ active: search.show === 'active' }),
  loader: ({ context: { queryClient, membership }, deps }) =>
    queryClient.ensureQueryData(calendarsQueryOptions(membership.tenantId, deps.active)),
  head: () => ({ meta: [{ title: 'Calendars · SlotWise' }] }),
  component: CalendarsPage,
})

function CalendarsPage() {
  const { show } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { membership } = useMembership()
  const { data: calendars } = useSuspenseQuery(calendarsQueryOptions(membership.tenantId, show === 'active'))
  const update = useUpdateCalendar(membership.tenantId)
  const [renaming, setRenaming] = useState<StaffCalendar | null>(null)
  const canToggle = can.manageCalendars(membership.role)

  const setActive = (calendar: StaffCalendar, active: boolean) =>
    update.mutate(
      { id: calendar.id, active },
      {
        onSuccess: () =>
          toast.success(
            active ? `${calendar.displayName} is bookable again.` : `${calendar.displayName} no longer takes bookings.`,
          ),
        onError: (error) => toast.error(errorMessage(error)),
      },
    )

  return (
    <>
      <PageHeader
        title="Calendars"
        description="Everyone customers can book. The name here is what customers see."
      />

      <Tabs
        value={show}
        onValueChange={(value) => void navigate({ search: { show: value as 'active' | 'inactive' }, replace: true })}
        className="mb-4"
      >
        <TabsList>
          <TabsTrigger value="active">Taking bookings</TabsTrigger>
          <TabsTrigger value="inactive">Turned off</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="py-0">
        {calendars.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CalendarDaysIcon />
              </EmptyMedia>
              <EmptyTitle>{show === 'active' ? 'No one is bookable yet' : 'No calendars are turned off'}</EmptyTitle>
              <EmptyDescription>
                {show === 'active'
                  ? 'Team members with “Takes bookings” on show up here.'
                  : 'Calendars you turn off are kept here.'}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Name</TableHead>
                <TableHead>Takes bookings</TableHead>
                <TableHead className="w-24 pr-4">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calendars.map((calendar) => {
                const isYours = membership.staffId === calendar.id
                return (
                  <TableRow key={calendar.id}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback>{initials(calendar.displayName)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{calendar.displayName}</span>
                        {isYours ? <Badge variant="secondary">You</Badge> : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={calendar.active}
                        onCheckedChange={(active) => setActive(calendar, active)}
                        disabled={!canToggle || update.isPending}
                        aria-label={`${calendar.displayName} takes bookings`}
                      />
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      {canRenameCalendar(membership, calendar.id) ? (
                        <Button variant="ghost" size="sm" onClick={() => setRenaming(calendar)}>
                          <PencilIcon />
                          Rename
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={renaming !== null} onOpenChange={(open) => !open && setRenaming(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename calendar</DialogTitle>
            <DialogDescription>Customers see this name when they book.</DialogDescription>
          </DialogHeader>
          {renaming ? (
            <RenameForm tenantId={membership.tenantId} calendar={renaming} onDone={() => setRenaming(null)} />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}

function RenameForm({
  tenantId,
  calendar,
  onDone,
}: {
  tenantId: string
  calendar: StaffCalendar
  onDone: () => void
}) {
  const update = useUpdateCalendar(tenantId)
  const form = useAppForm({
    defaultValues: { displayName: calendar.displayName },
    validationLogic: validateOnBlurThenChange(),
    validators: { onDynamic: z.object({ displayName: personNameSchema }) },
    onSubmit: async ({ value }) => {
      const displayName = value.displayName.trim()
      if (displayName === calendar.displayName) return onDone()
      try {
        await update.mutateAsync({ id: calendar.id, displayName })
        toast.success('Calendar renamed.')
        onDone()
      } catch {
        // Shown by <FormError>.
      }
    },
  })

  return (
    <form onSubmit={submitHandler(form)} noValidate>
      <FieldGroup>
        <form.AppField name="displayName">
          {(field) => <field.TextField label="Display name" autoFocus />}
        </form.AppField>
        <FormError error={update.error} />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <form.AppForm>
            <form.SubmitButton>Save</form.SubmitButton>
          </form.AppForm>
        </DialogFooter>
      </FieldGroup>
    </form>
  )
}
