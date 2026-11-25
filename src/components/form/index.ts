import { createFormHook, revalidateLogic } from '@tanstack/react-form'
import {
  PasswordField,
  SelectField,
  SwitchField,
  TextareaField,
  TextField,
} from './fields'
import { SubmitButton } from './form-components'
import { fieldContext, formContext } from './form-context'

/**
 * The app's form hook: `useAppForm` + `<form.AppField>` render our shadcn
 * field components with labels, descriptions and errors wired up.
 */
export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField,
    TextareaField,
    PasswordField,
    SelectField,
    SwitchField,
  },
  formComponents: { SubmitButton },
})

/** Validate on blur at first; after a submit attempt, on every change. */
export const validateOnBlurThenChange = () =>
  revalidateLogic({ mode: 'blur', modeAfterSubmission: 'change' })

export type { SelectOption } from './fields'

/**
 * `<form onSubmit={submitHandler(form)}>`. Stops propagation too: React
 * bubbles events through portals, so a dialog's form would otherwise also
 * submit a form on the page behind it.
 */
export const submitHandler =
  (form: { handleSubmit: () => Promise<unknown> }) =>
  (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    event.stopPropagation()
    void form.handleSubmit()
  }
