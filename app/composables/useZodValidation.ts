import { z } from 'zod'
import { ref, watch } from 'vue'

// Define a type for Zod schemas that we can use in our composable
type ZodFormSchema = z.ZodObject<Record<string, z.ZodTypeAny>>

/**
 * Composable for handling Zod validation in form components
 * @param schema The Zod schema to validate against
 * @param formData Reactive form data object
 * @returns Validation utilities
 */
export function useZodValidation<S extends ZodFormSchema>(
  schema: S,
  formData: Ref<z.infer<S>>
) {
  type FormData = z.infer<S>
  // Validation state
  const errors = ref<Partial<Record<keyof FormData, string>>>({})
  const isValid = ref(false)

  // Validate individual field
  const validateField = (field: keyof FormData, value: unknown) => {
    try {
      // We need to create a partial schema for just this field
      // This is a workaround for TypeScript type issues with Zod
      const partialSchema: Record<string, z.ZodTypeAny> = {}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      partialSchema[field as string] = (schema as any).shape[field as string]

      const fieldSchema = z.object(partialSchema)
      fieldSchema.parse({ [field]: value })
      // Clear error if validation passes
      if (errors.value[field]) {
        errors.value[field] = ''
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Set the error message for this field
        const fieldError = error.errors.find(err => err.path[0] === field)
        if (fieldError) {
          errors.value[field] = fieldError.message
        }
      }
    }
  }

  // Validate entire form
  const validateForm = () => {
    try {
      schema.parse(formData.value)
      errors.value = {}
      isValid.value = true
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Map errors to fields
        const newErrors: Partial<Record<keyof FormData, string>> = {}
        error.errors.forEach((err) => {
          const field = err.path[0] as keyof FormData
          newErrors[field] = err.message
        })
        errors.value = newErrors
        isValid.value = false
      }
      return false
    }
  }

  // Track which fields have been touched by the user
  const touchedFields = ref<Set<string>>(new Set())

  // Mark a field as touched
  const touchField = (field: keyof FormData) => {
    touchedFields.value.add(field as string)
  }

  // Setup watchers for all fields in the form
  const setupFieldWatchers = () => {
    // Get all keys from the schema
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fields = Object.keys((schema as any).shape) as Array<keyof FormData>
    // Create a watcher for each field
    fields.forEach((field) => {
      watch(
        () => formData.value[field],
        (value) => {
          // Only validate if the field has been touched
          if (touchedFields.value.has(field as string)) {
            validateField(field, value)
          }
        }
      )
    })
  }

  // Initialize validation
  setupFieldWatchers()
  // We don't validate the form initially anymore

  // Reset validation state (errors, touched fields, and validity)
  const resetValidation = () => {
    errors.value = {}
    isValid.value = false
    touchedFields.value = new Set()
  }

  return {
    errors,
    isValid,
    validateField,
    validateForm,
    touchField,
    resetValidation
  }
}
