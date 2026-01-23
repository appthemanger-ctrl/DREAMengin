'use client'
import { useRef } from 'react'

export function UploadcareFileUploader({ onUpload }) {
  const ref = useRef(null)
  return (
    <>
      <input
        ref={ref}
        type="file"
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (!file) return
          const form = new FormData()
          form.append('file', file)
          form.append('UPLOADCARE_PUB_KEY', 'demopublickey') // replace with your key
          const res = await fetch('https://upload.uploadcare.com/base/', { method: 'POST', body: form })
          const uuid = await res.text()
          onUpload?.(`https://ucarecdn.com/${uuid}/${file.name}`)
        }}
      />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="bg-white/10 px-3 py-2 rounded-lg text-sm"
      >
        Choose file
      </button>
    </>
  )
}
