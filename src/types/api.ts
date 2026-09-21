export type ApiResult = {
  resultCode: number
  resultMessage: string
  resultDescription?: string
}

export type Api<T> = {
  result: ApiResult
  body: T
}
