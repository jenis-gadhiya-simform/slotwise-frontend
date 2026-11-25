import { useStore } from '@tanstack/react-form'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useFieldContext } from './form-context'

/**
 * Field components for `useAppForm` (TanStack Form composition). Each reads
 * its field from context, so forms only write `<field.TextField label=… />`.
 * Errors show once a field was touched (blurred, or the form submitted).
 */

type ValidationError = string | { message?: string } | undefined | null

function useFieldErrors() {
  const field = useFieldContext<unknown>()
  const meta = useStore(field.store, (state) => state.meta)
  const visible = meta.isTouched && !meta.isValid
  const errors = visible
    ? (meta.errors as ValidationError[]).map((error) =>
        typeof error === 'string' ? { message: error } : (error ?? undefined),
      )
    : []
  return { invalid: visible, errors }
}

interface FieldShellProps {
  id: string
  label: ReactNode
  description?: ReactNode
  invalid: boolean
  errors: Array<{ message?: string } | undefined>
  children: ReactNode
}

function FieldShell({ id, label, description, invalid, errors, children }: FieldShellProps) {
  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {children}
      {description && !invalid ? (
        <FieldDescription id={`${id}-description`}>{description}</FieldDescription>
      ) : null}
      <FieldError id={`${id}-error`} errors={errors} />
    </Field>
  )
}

interface TextFieldProps
  extends Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange' | 'onBlur' | 'name' | 'id'> {
  label: ReactNode
  description?: ReactNode
  /** Normalises input as it's typed, e.g. lowercase. */
  transform?: (value: string) => string
}

export function TextField({ label, description, transform, ...inputProps }: TextFieldProps) {
  const field = useFieldContext<string>()
  const id = useId()
  const { invalid, errors } = useFieldErrors()
  return (
    <FieldShell id={id} label={label} description={description} invalid={invalid} errors={errors}>
      <Input
        id={id}
        name={field.name}
        value={field.state.value}
        onChange={(e) => field.handleChange(transform ? transform(e.target.value) : e.target.value)}
        onBlur={field.handleBlur}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${id}-error` : description ? `${id}-description` : undefined}
        {...inputProps}
      />
    </FieldShell>
  )
}

interface TextareaFieldProps
  extends Omit<React.ComponentProps<typeof Textarea>, 'value' | 'onChange' | 'onBlur' | 'name' | 'id'> {
  label: ReactNode
  description?: ReactNode
}

export function TextareaField({ label, description, ...props }: TextareaFieldProps) {
  const field = useFieldContext<string>()
  const id = useId()
  const { invalid, errors } = useFieldErrors()
  return (
    <FieldShell id={id} label={label} description={description} invalid={invalid} errors={errors}>
      <Textarea
        id={id}
        name={field.name}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        aria-invalid={invalid || undefined}
        {...props}
      />
    </FieldShell>
  )
}

interface PasswordFieldProps {
  label: ReactNode
  description?: ReactNode
  autoComplete: 'current-password' | 'new-password'
  autoFocus?: boolean
}

export function PasswordField({ label, description, autoComplete, autoFocus }: PasswordFieldProps) {
  const field = useFieldContext<string>()
  const id = useId()
  const [visible, setVisible] = useState(false)
  const { invalid, errors } = useFieldErrors()
  return (
    <FieldShell id={id} label={label} description={description} invalid={invalid} errors={errors}>
      <div className="relative">
        <Input
          id={id}
          name={field.name}
          type={visible ? 'text' : 'password'}
          value={field.state.value}
          onChange={(e) => field.handleChange(e.target.value)}
          onBlur={field.handleBlur}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          aria-invalid={invalid || undefined}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          {visible ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
        </button>
      </div>
    </FieldShell>
  )
}

export interface SelectOption<T extends string> {
  value: T
  label: string
  description?: string
}

interface SelectFieldProps<T extends string> {
  label: ReactNode
  description?: ReactNode
  options: readonly SelectOption<T>[]
  placeholder?: string
  disabled?: boolean
}

export function SelectField<T extends string>({
  label,
  description,
  options,
  placeholder,
  disabled,
}: SelectFieldProps<T>) {
  const field = useFieldContext<T>()
  const id = useId()
  const { invalid, errors } = useFieldErrors()
  return (
    <FieldShell id={id} label={label} description={description} invalid={invalid} errors={errors}>
      <Select
        name={field.name}
        value={field.state.value}
        onValueChange={(value) => field.handleChange(value as T)}
        disabled={disabled}
      >
        <SelectTrigger id={id} onBlur={field.handleBlur} aria-invalid={invalid || undefined} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldShell>
  )
}

interface SwitchFieldProps {
  label: ReactNode
  description?: ReactNode
  disabled?: boolean
}

export function SwitchField({ label, description, disabled }: SwitchFieldProps) {
  const field = useFieldContext<boolean>()
  const id = useId()
  return (
    <Field orientation="horizontal" data-disabled={disabled || undefined}>
      <FieldContent>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        {description ? <FieldDescription>{description}</FieldDescription> : null}
      </FieldContent>
      <Switch
        id={id}
        name={field.name}
        checked={field.state.value}
        onCheckedChange={field.handleChange}
        disabled={disabled}
      />
    </Field>
  )
}
