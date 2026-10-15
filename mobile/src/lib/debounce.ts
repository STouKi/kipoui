// Runs `fn` once the calls stop for `delay` ms, so quick successive changes make a single save.
// `flush` runs a pending call right away (when leaving the screen)
export function debounce(fn: () => unknown, delay: number) {
  let timer: ReturnType<typeof setTimeout> | undefined

  function run() {
    timer = undefined
    void fn()
  }

  return {
    schedule() {
      clearTimeout(timer)
      timer = setTimeout(run, delay)
    },
    flush() {
      if (timer !== undefined) {
        clearTimeout(timer)
        run()
      }
    }
  }
}
