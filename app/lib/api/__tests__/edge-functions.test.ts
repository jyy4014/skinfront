/**
 * TDD: Edge Functions 클라이언트 테스트
 */

import { createEdgeFunctionClient } from '../edge-functions'

global.fetch = jest.fn()

describe('Edge Functions Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  })

  it('analyze 함수를 호출할 수 있어야 함', async () => {
    const mockResponse = {
      status: 'success',
      result_id: '123',
      analysis: {},
      mapping: {},
      nlg: {},
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const client = createEdgeFunctionClient()
    const result = await client.analyze({
      image_url: 'https://example.com/image.jpg',
      user_id: 'user123',
      accessToken: 'token123',
    })

    expect(result).toEqual(mockResponse)
    expect(global.fetch).toHaveBeenCalledWith(
      'https://test.supabase.co/functions/v1/analyze',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token123',
        }),
      })
    )
  })

  it('save 함수를 호출할 수 있어야 함', async () => {
    const mockResponse = { status: 'success', id: '456' }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const client = createEdgeFunctionClient()
    const result = await client.save({
      userId: 'user123',
      imageUrl: 'https://example.com/image.jpg',
      result: {
        result_id: '123',
        analysis: {},
        mapping: {},
        nlg: {},
      },
      accessToken: 'token123',
    })

    expect(result).toEqual(mockResponse)
    expect(global.fetch).toHaveBeenCalledWith(
      'https://test.supabase.co/functions/v1/analyze/save',
      expect.objectContaining({
        method: 'POST',
      })
    )
  })
})

