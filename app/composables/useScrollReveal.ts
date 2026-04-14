export function useScrollReveal() {
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
            observer?.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' },
    )

    document.querySelectorAll('.reveal-on-scroll').forEach((el) => {
      observer!.observe(el)
    })
  })

  onUnmounted(() => {
    observer?.disconnect()
    observer = null
  })
}
