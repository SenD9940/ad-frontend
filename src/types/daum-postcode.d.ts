export {}

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: { zonecode: string; address: string }) => void
      }) => { open: () => void }
    }
  }
}
