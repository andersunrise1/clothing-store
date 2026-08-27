import { useEffect, useState } from 'react'
import { API_URL } from '../../config'

function VideoForm({ token, onCreated }) {
  const [title, setTitle] = useState('')
  const [videoFile, setVideoFile] = useState(null)
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null)
  const [isHero, setIsHero] = useState(false)
  const [isFeatured, setIsFeatured] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setVideoFile(file)
    setVideoPreviewUrl(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Título do vídeo é obrigatório')
      return
    }
    if (!videoFile) {
      setError('Escolha o arquivo de vídeo')
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('video', videoFile)
      formData.append('isHero', isHero ? 'true' : 'false')
      formData.append('isFeatured', isFeatured ? 'true' : 'false')

      const res = await fetch(`${API_URL}/api/admin/videos`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao salvar vídeo')

      onCreated(data)
      setTitle('')
      setVideoFile(null)
      setVideoPreviewUrl(null)
      setIsHero(false)
      setIsFeatured(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-gray-200 p-5">
      <h2 className="text-lg font-semibold text-gray-900">Adicionar vídeo</h2>

      <input
        type="text"
        placeholder="Título do vídeo"
        aria-label="Título do vídeo"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="rounded border border-gray-300 px-3 py-2 text-sm"
      />

      <label className="text-sm text-gray-600">
        Arquivo de vídeo
        <input
          type="file"
          accept="video/*"
          aria-label="Arquivo de vídeo"
          onChange={handleVideoChange}
          className="mt-1 block text-sm"
        />
      </label>

      {videoPreviewUrl && (
        <video
          src={videoPreviewUrl}
          controls
          className="h-40 w-full rounded border border-gray-100 bg-black object-contain"
        />
      )}

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={isHero} onChange={(e) => setIsHero(e.target.checked)} />
        Usar como vídeo de abertura (hero) da home — toca sozinho, mudo, em loop
      </label>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={isFeatured}
          onChange={(e) => setIsFeatured(e.target.checked)}
        />
        Destacar na home (ex: divulgação de evento) — player normal, com som
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="self-start rounded bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-500 disabled:opacity-50"
      >
        {submitting ? 'Enviando...' : 'Salvar vídeo'}
      </button>
    </form>
  )
}

function VideoGrid({ token, videos, onDeleted, onHeroChanged, onFeaturedChanged }) {
  const handleDelete = async (id) => {
    await fetch(`${API_URL}/api/admin/videos/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    onDeleted(id)
  }

  const handleSetHero = async (id, makeHero) => {
    await fetch(`${API_URL}/api/admin/videos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isHero: makeHero }),
    })
    onHeroChanged(id, makeHero)
  }

  const handleSetFeatured = async (id, makeFeatured) => {
    await fetch(`${API_URL}/api/admin/videos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isFeatured: makeFeatured }),
    })
    onFeaturedChanged(id, makeFeatured)
  }

  if (videos.length === 0) {
    return <p className="text-sm text-gray-500">Nenhum vídeo cadastrado ainda.</p>
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {videos.map((video) => (
        <div key={video.id} className="group relative flex flex-col gap-2 rounded border border-gray-200 p-2">
          <video
            src={`${API_URL}${video.video_url}`}
            controls
            className="h-32 w-full rounded bg-black object-contain"
          />
          <p className="truncate text-xs font-medium text-gray-700">{video.title}</p>

          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {video.is_hero ? (
              <button
                type="button"
                onClick={() => handleSetHero(video.id, false)}
                title="Clique para remover"
                className="rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-semibold text-purple-700 hover:bg-purple-200"
              >
                Vídeo de abertura ✕
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSetHero(video.id, true)}
                className="text-[11px] text-purple-600 hover:underline"
              >
                Usar como abertura
              </button>
            )}

            {video.is_featured ? (
              <button
                type="button"
                onClick={() => handleSetFeatured(video.id, false)}
                title="Clique para remover"
                className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 hover:bg-amber-200"
              >
                Em destaque na home ✕
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSetFeatured(video.id, true)}
                className="text-[11px] text-purple-600 hover:underline"
              >
                Destacar na home
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleDelete(video.id)}
            aria-label={`Excluir vídeo ${video.title}`}
            className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm text-red-500 opacity-0 shadow ring-1 ring-red-200 transition group-hover:opacity-100 hover:bg-red-500 hover:text-white"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}

function AdminVideos({ token, onAuthError }) {
  const [videos, setVideos] = useState([])

  useEffect(() => {
    fetch(`${API_URL}/api/admin/videos`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then(setVideos)
      .catch(() => onAuthError())
  }, [token, onAuthError])

  return (
    <div className="flex flex-col gap-8">
      <VideoForm
        token={token}
        onCreated={(v) =>
          setVideos((prev) => [
            v,
            ...prev.map((p) => ({
              ...p,
              is_hero: v.is_hero ? 0 : p.is_hero,
              is_featured: v.is_featured ? 0 : p.is_featured,
            })),
          ])
        }
      />

      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Vídeos cadastrados</h2>
        <VideoGrid
          token={token}
          videos={videos}
          onDeleted={(id) => setVideos((prev) => prev.filter((v) => v.id !== id))}
          onHeroChanged={(id, makeHero) =>
            setVideos((prev) =>
              prev.map((v) => {
                if (v.id === id) return { ...v, is_hero: makeHero ? 1 : 0 }
                return makeHero ? { ...v, is_hero: 0 } : v
              }),
            )
          }
          onFeaturedChanged={(id, makeFeatured) =>
            setVideos((prev) =>
              prev.map((v) => {
                if (v.id === id) return { ...v, is_featured: makeFeatured ? 1 : 0 }
                return makeFeatured ? { ...v, is_featured: 0 } : v
              }),
            )
          }
        />
      </div>
    </div>
  )
}

export default AdminVideos
