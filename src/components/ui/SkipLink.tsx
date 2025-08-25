export const SkipLink = () => {
  return (
    <a
      href="#main-content"
      className="skip-link"
      onFocus={(e) => e.currentTarget.classList.add('focus')}
      onBlur={(e) => e.currentTarget.classList.remove('focus')}
    >
      メインコンテンツにスキップ
    </a>
  )
}