import styles from "./Button.module.css";

type Variant = "default" | "primary" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variantClass: Record<Variant, string> = {
  default: "",
  primary: styles.primary,
  ghost: styles.ghost,
};

/** Shared button. Keeps native button semantics; `variant` picks the token set. */
export function Button({
  variant = "default",
  className,
  type = "button",
  ...rest
}: ButtonProps): React.JSX.Element {
  const cls = [styles.btn, variantClass[variant], className].filter(Boolean).join(" ");
  return <button className={cls} type={type} {...rest} />;
}
