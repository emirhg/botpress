import { Client } from '@botpress/nlu-client'
import * as sdk from 'botpress/sdk'

import { makeNLUPassword } from 'common/nlu-token'
import _ from 'lodash'

import { Config, LanguageSource } from '../config'

import { getWebsocket } from './api'
import { BotFactory } from './application/bot-factory'
import { BotService } from './application/bot-service'
import { DefinitionsRepository } from './application/definitions-repository'
import { ModelRepository } from './application/model-repo'
import { NonBlockingNluApplication } from './application/non-blocking-app'
import { StanEngine } from './stan'

const getNLUServerConfig = (config: Config['nluServer']): LanguageSource => {
  if (config.autoStart) {
    return {
      endpoint: `http://localhost:${process.NLU_PORT}`,
      authToken: makeNLUPassword()
    }
  }

  const { endpoint, authToken } = config
  return {
    endpoint,
    authToken
  }
}

export async function bootStrap(bp: typeof sdk): Promise<NonBlockingNluApplication> {
  const globalConfig: Config = await bp.config.getModuleConfig('nlu')
  const { maxTrainingPerInstance, queueTrainingOnBotMount, legacyElection } = globalConfig

  if (legacyElection) {
    bp.logger.warn(
      'You are still using legacy election which is deprecated. Set { legacyElection: false } in your global nlu config to use the new election pipeline.'
    )
  }

  const { endpoint, authToken } = getNLUServerConfig(globalConfig.nluServer)
  const stanClient = new Client(endpoint, authToken)

  const modelPassword = '' // No need for password as Stan is protected by an auth token
  const engine = new StanEngine(stanClient, modelPassword)

  const socket = getWebsocket(bp)

  const botService = new BotService()

  const modelRepo: Partial<ModelRepository> = {} // TODO implement this

  const defRepo = new DefinitionsRepository(bp)
  const botFactory = new BotFactory(engine, bp.logger, defRepo, modelRepo as ModelRepository, socket)
  const application = new NonBlockingNluApplication(engine, botFactory, botService)

  // don't block entire server startup
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  application.initialize()

  return application
}
