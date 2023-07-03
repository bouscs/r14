export abstract class Asset {
  fileName: string
  dirPath: string

  get path() {
    return this.dirPath + this.fileName
  }

  constructor(fileName?: string, dirPath?: string) {
    this.fileName = fileName || ''
    this.dirPath = dirPath || ''
  }

  abstract load(): Promise<void>
}
