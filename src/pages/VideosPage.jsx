import { useEffect, useState } from 'react'
import { API_URL } from '../config'

function VideosPage() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${API_URL}/api/videos`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then(setVideos)
      .catch(() => setError('Não foi possível carregar os vídeos.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Vídeos</h1>
      <p className="mb-6 text-sm text-gray-500">Skate de verdade, direto da rua.</p>

      {loading && <p className="text-sm text-gray-500">Carregando...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !error && videos.length === 0 && (
        <p className="text-sm text-gray-500">Nenhum vídeo por aqui ainda.</p>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <figure key={video.id} className="overflow-hidden rounded-lg border border-gray-200">
            <video
              src={`${API_URL}${video.video_url}`}
              controls
              className="aspect-video w-full bg-black object-contain"
            />
            <figcaption className="p-3 text-sm font-medium text-gray-800">{video.title}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}

export default VideosPage
