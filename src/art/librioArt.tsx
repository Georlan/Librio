import {
  ImgHTMLAttributes,
  useEffect,
  useMemo,
  useState,
} from 'react'

export type ArtSlot =
  | 'actions.like'
  | 'actions.pass'
  | 'actions.rewind'
  | 'paper.background'
  | 'labels.campus'
  | 'swatches.active'

type ArtSpec = {
  primary: string
  fallbacks?: string[]
  fallbackGlyph?: string
  cssVariable?: `--art-${string}`
}

export const LIBRIO_ART: Record<ArtSlot, ArtSpec> = {
  'actions.like': {
    primary: '/assets/librio/actions/like.png',
    fallbacks: ['/assets/librio/action-like.svg'],
    fallbackGlyph: '♥',
  },
  'actions.pass': {
    primary: '/assets/librio/actions/pass.png',
    fallbacks: ['/assets/librio/action-pass.svg'],
    fallbackGlyph: '×',
  },
  'actions.rewind': {
    primary: '/assets/librio/actions/rewind.png',
    fallbacks: ['/assets/librio/action-rewind.svg'],
    fallbackGlyph: '↶',
  },
  'paper.background': {
    primary: '/assets/librio/paper/background.png',
    fallbacks: ['/assets/librio/paper-bg.svg'],
    cssVariable: '--art-paper-image',
  },
  'labels.campus': {
    primary: '/assets/librio/labels/campus.png',
    fallbacks: ['/assets/librio/paper-label.svg'],
    cssVariable: '--art-campus-label-image',
  },
  'swatches.active': {
    primary: '/assets/librio/swatches/active.png',
    fallbacks: ['/assets/librio/active-swatch.svg'],
    cssVariable: '--art-active-swatch-image',
  },
}

function candidatesFor(slot: ArtSlot) {
  const spec = LIBRIO_ART[slot]
  return [spec.primary, ...(spec.fallbacks ?? [])]
}

type ArtAssetProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'alt' | 'onError'
> & {
  slot: ArtSlot
  alt?: string
  decorative?: boolean
  wrapperClassName?: string
  fallbackText?: string
}

export function ArtAsset({
  slot,
  alt = '',
  decorative = false,
  wrapperClassName = '',
  fallbackText,
  className = '',
  ...imageProps
}: ArtAssetProps) {
  const sources = useMemo(() => candidatesFor(slot), [slot])
  const [sourceIndex, setSourceIndex] = useState(0)

  useEffect(() => {
    setSourceIndex(0)
  }, [slot])

  const source = sources[sourceIndex]
  const exhausted = sourceIndex >= sources.length
  const spec = LIBRIO_ART[slot]

  if (exhausted) {
    return (
      <span
        className={`art-asset art-asset--fallback ${wrapperClassName}`.trim()}
        data-art-slot={slot}
        aria-hidden={decorative || alt === '' ? true : undefined}
        role={!decorative && alt ? 'img' : undefined}
        aria-label={!decorative && alt ? alt : undefined}
      >
        {fallbackText ?? spec.fallbackGlyph ?? ''}
      </span>
    )
  }

  return (
    <span
      className={`art-asset art-asset--image ${wrapperClassName}`.trim()}
      data-art-slot={slot}
      aria-hidden={decorative ? true : undefined}
    >
      <img
        {...imageProps}
        className={`art-asset__img ${className}`.trim()}
        src={source}
        alt={decorative ? '' : alt}
        draggable={false}
        onError={() => setSourceIndex((index) => index + 1)}
      />
    </span>
  )
}

function canLoad(url: string) {
  return new Promise<boolean>((resolve) => {
    const image = new Image()
    image.onload = () => resolve(true)
    image.onerror = () => resolve(false)
    image.src = url
  })
}

async function resolveArtSlot(slot: ArtSlot) {
  for (const source of candidatesFor(slot)) {
    if (await canLoad(source)) return source
  }

  return null
}

const CSS_ART_SLOTS: ArtSlot[] = [
  'paper.background',
  'labels.campus',
  'swatches.active',
]

export function useLibrioArtCssVariables() {
  useEffect(() => {
    let cancelled = false

    async function install() {
      await Promise.all(
        CSS_ART_SLOTS.map(async (slot) => {
          const spec = LIBRIO_ART[slot]
          if (!spec.cssVariable) return

          const resolved = await resolveArtSlot(slot)
          if (cancelled || !resolved) return

          document.documentElement.style.setProperty(
            spec.cssVariable,
            `url("${resolved}")`,
          )
        }),
      )
    }

    install()

    return () => {
      cancelled = true
    }
  }, [])
}
