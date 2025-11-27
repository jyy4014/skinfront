import { NextRequest, NextResponse } from 'next/server'

// OSM Nominatim API 응답 타입
interface NominatimResult {
  lat: string
  lon: string
  display_name: string
  type: string
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter is required' },
      { status: 400 }
    )
  }

  try {
    const encodedQuery = encodeURIComponent(query)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&countrycodes=kr&limit=1`,
      {
        headers: {
          'Accept-Language': 'ko',
          'User-Agent': 'SkinAnalysisApp/1.0', // Nominatim requires User-Agent
        },
      }
    )

    if (!response.ok) {
      throw new Error('Nominatim API error')
    }

    const results: NominatimResult[] = await response.json()

    if (results.length > 0) {
      const { lat, lon, display_name } = results[0]
      return NextResponse.json({
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        display_name: display_name.split(',')[0], // 첫 번째 부분만
      })
    }

    return NextResponse.json({ lat: null, lon: null, display_name: null })
  } catch (error) {
    console.error('Geocoding error:', error)
    return NextResponse.json(
      { error: 'Failed to geocode location' },
      { status: 500 }
    )
  }
}




