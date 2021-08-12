import { IO, NLU as SDKNLU } from 'botpress/sdk'

export interface BotConfig {
  id: string
  defaultLanguage: string
  languages: string[]
  nluSeed?: number
}

export interface BotDefinition {
  botId: string
  defaultLanguage: string
  languages: string[]
  seed: number
}

export type ProgressCallback = (p: number) => Promise<void>

export interface Trainable {
  startTraining(language: string, progressCallback: (ts: TrainingState) => void): Promise<string>
  setModel(language: string, modelId: string): void
  cancelTraining(language: string): Promise<void>
  getTraining(language: string): Promise<TrainingState | undefined>
  getAllTrainings(): Promise<TrainingSession[]>
}

export interface Predictor {
  predict(text: string, anticipatedLanguage?: string): Promise<EventUnderstanding>
}

export type EventUnderstanding = Omit<IO.EventUnderstanding, 'includedContexts' | 'ms'>

export interface TrainingState {
  status: SDKNLU.TrainingStatus
  progress: number
}

export interface TrainingId {
  botId: string
  language: string
}

export interface TrainingSession extends TrainingId, TrainingState {}
