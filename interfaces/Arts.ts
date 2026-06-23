export interface IArts {
  id: number;
  title: string;
  description: string;
  type: ArtTypes;
  category: string;
  uri: string;
}

export enum ArtTypes {
  VIDEO = "video",
  IMG = "image",
  MODEL = "model",
}
