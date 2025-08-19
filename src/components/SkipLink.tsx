export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="skip-link"
      onFocus={(e) => e.currentTarget.classList.add("focus-visible-enhanced")}
      onBlur={(e) => e.currentTarget.classList.remove("focus-visible-enhanced")}
    >
      Skip to main content
    </a>
  );
}