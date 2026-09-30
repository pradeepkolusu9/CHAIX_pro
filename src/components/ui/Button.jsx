import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

/**
 * Button — the only button primitive.
 *
 * HARD RULE from the council: **one `variant="primary"` per screen.** Two full-width
 * blue buttons on one screen is a colour error, not a layout one — demote the second
 * to `ghost` with a leading arrow.
 */
export const Button = forwardRef(function Button(
  {
    as: As = 'button',
    variant = 'primary',
    size,
    loading = false,
    icon: Icon,
    iconRight: IconRight,
    className = '',
    children,
    disabled,
    ...rest
  },
  ref,
) {
  const variants = {
    primary: 'btn-primary',
    violet: 'btn-violet',
    ghost: 'btn-ghost',
    quiet: 'btn-quiet',
    danger: 'btn-danger',
  }
  const sizes = { sm: 'btn-sm', lg: 'btn-lg' }
  return (
    <As
      ref={ref}
      disabled={As === 'button' ? disabled || loading : undefined}
      aria-busy={loading || undefined}
      className={`${variants[variant] || variants.primary} ${sizes[size] || ''} ${className}`}
      {...rest}
    >
      {loading ? (
        <Loader2 size={15} className="animate-spin" />
      ) : (
        Icon && <Icon size={15} strokeWidth={2.3} />
      )}
      {children}
      {!loading && IconRight && <IconRight size={15} strokeWidth={2.3} />}
    </As>
  )
})

export default Button
