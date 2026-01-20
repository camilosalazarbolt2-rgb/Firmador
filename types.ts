export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  content: ArrayBuffer;
}

export interface SignaturePosition {
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export enum AppState {
  UPLOAD = 'UPLOAD',
  SIGNATURE = 'SIGNATURE',
  POSITION = 'POSITION',
  PREVIEW = 'PREVIEW',
  SUCCESS = 'SUCCESS',
}