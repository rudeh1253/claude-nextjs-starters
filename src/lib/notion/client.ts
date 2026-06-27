import { Client, isFullDatabase } from '@notionhq/client'

import { env, isNotionConfigured } from '@/lib/env'

export { isNotionConfigured }

let client: Client | null = null

/**
 * 싱글턴 Notion 클라이언트.
 * SDK v5는 기본적으로 `2025-09-03` API 버전(data source 모델)을 사용합니다.
 */
export function getNotionClient(): Client {
  if (!env.NOTION_TOKEN) {
    throw new Error(
      'NOTION_TOKEN 이 설정되지 않았습니다. .env.local 을 확인하세요.'
    )
  }
  if (!client) {
    client = new Client({ auth: env.NOTION_TOKEN })
  }
  return client
}

let cachedDataSourceId: string | null = env.NOTION_DATA_SOURCE_ID ?? null

/**
 * 쿼리에 사용할 data source ID 를 반환합니다.
 * `NOTION_DATA_SOURCE_ID` 가 있으면 그대로 사용하고,
 * 없으면 `NOTION_DATABASE_ID` 로 데이터베이스를 조회해 첫 data source 를 사용합니다.
 */
export async function getDataSourceId(): Promise<string> {
  if (cachedDataSourceId) return cachedDataSourceId

  if (!env.NOTION_DATABASE_ID) {
    throw new Error(
      'NOTION_DATA_SOURCE_ID 또는 NOTION_DATABASE_ID 중 하나는 반드시 설정해야 합니다.'
    )
  }

  const database = await getNotionClient().databases.retrieve({
    database_id: env.NOTION_DATABASE_ID,
  })

  const dataSourceId = isFullDatabase(database)
    ? database.data_sources[0]?.id
    : undefined

  if (!dataSourceId) {
    throw new Error(
      `데이터베이스(${env.NOTION_DATABASE_ID})에서 data source 를 찾지 못했습니다.`
    )
  }

  cachedDataSourceId = dataSourceId
  return dataSourceId
}
