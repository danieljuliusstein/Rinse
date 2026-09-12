'use client'

import { useEffect, useState } from 'react'
import { Images } from '@phosphor-icons/react'
import { ListRow } from '@/components/ui'
import { getJobPhotos } from '@/lib/api'
import type { JobWithRelations } from '@/lib/types'

interface JobPhotosEntryProps {
  job: JobWithRelations
  onPress: () => void
}

export default function JobPhotosEntry({ job, onPress }: JobPhotosEntryProps) {
  const [beforeCount, setBeforeCount] = useState(0)
  const [afterCount, setAfterCount] = useState(0)

  useEffect(() => {
    getJobPhotos(job.id).then((photos) => {
      setBeforeCount(photos.filter((p) => p.type === 'before').length)
      setAfterCount(photos.filter((p) => p.type === 'after').length)
    })
  }, [job.id])

  const subtitle =
    beforeCount + afterCount > 0
      ? `${beforeCount} before · ${afterCount} after`
      : 'No photos yet'

  return (
    <ListRow
      icon={<Images size={18} weight="duotone" />}
      iconTone="green"
      title="Photos"
      subtitle={subtitle}
      onClick={onPress}
    />
  )
}
