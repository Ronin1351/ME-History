declare module 'echarts' {
  export function init(element: HTMLElement, theme?: unknown, opts?: { renderer?: string }): {
    setOption(option: unknown): void
    resize(): void
    dispose(): void
  }
}
