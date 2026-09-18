import {
  PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

export type Book = {
  id: number
  title: string
  author: string
  owner: string
  course: string
  campus: string
  rating: number
  loans: number
  maxDays: number
  cover: string
  note: string
  tags: string[]
}

type Decision = 'like' | 'pass'

type HistoryEntry = {
  index: number
  decision: Decision
  book: Book
}

type SwipeDeckProps = {
  books: Book[]
  onLike: (book: Book) => void
  onUndoLike: (book: Book) => void
  onFeedback: (message: string) => void
}

const COMMIT_DELAY = 260
const VELOCITY_THRESHOLD = 0.62
const MIN_FLICK_DISTANCE = 34

export default function SwipeDeck({
  books,
  onLike,
  onUndoLike,
  onFeedback,
}: SwipeDeckProps) {
  const [index, setIndex] = useState(0)
  const [drag, setDrag] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [exitDirection, setExitDirection] = useState<-1 | 0 | 1>(0)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const cardRef = useRef<HTMLElement | null>(null)

  const gesture = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastTime: 0,
  })

  const currentBook = books[index % books.length]

  const progress = Math.min(Math.abs(drag.x) / 110, 1)
  const likeOpacity = drag.x > 0 ? progress : 0
  const passOpacity = drag.x < 0 ? progress : 0

  const topTransform = useMemo(() => {
    if (exitDirection !== 0) {
      const travel = Math.max(window.innerWidth * 1.25, 520)
      return `translate3d(${exitDirection * travel}px, ${drag.y * 0.35}px, 0) rotate(${exitDirection * 17}deg)`
    }

    return `translate3d(${drag.x}px, ${drag.y * 0.16}px, 0) rotate(${drag.x / 18}deg)`
  }, [drag.x, drag.y, exitDirection])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowLeft') commit('pass')
      if (event.key === 'ArrowRight') commit('like')
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        rewind()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  function bookAt(depth: number) {
    return books[(index + depth) % books.length]
  }

  function commit(decision: Decision) {
    if (exitDirection !== 0 || !currentBook) return

    const direction = decision === 'like' ? 1 : -1
    setDragging(false)
    setExitDirection(direction)

    if ('vibrate' in navigator) navigator.vibrate(10)

    window.setTimeout(() => {
      setHistory((items) => [
        ...items.slice(-9),
        { index, decision, book: currentBook },
      ])

      if (decision === 'like') {
        onLike(currentBook)
        onFeedback('Interesse enviado ✨')
      }

      setIndex((value) => value + 1)
      setDrag({ x: 0, y: 0 })
      setExitDirection(0)
    }, COMMIT_DELAY)
  }

  function rewind() {
    if (exitDirection !== 0 || history.length === 0) return

    const last = history[history.length - 1]
    setHistory((items) => items.slice(0, -1))
    setIndex(last.index)
    setDrag({ x: 0, y: 0 })

    if (last.decision === 'like') onUndoLike(last.book)
    onFeedback('Última deslizada desfeita')
  }

  function onPointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (exitDirection !== 0 || event.button !== 0) return

    gesture.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastTime: performance.now(),
    }

    event.currentTarget.setPointerCapture(event.pointerId)
    setDragging(true)
  }

  function onPointerMove(event: ReactPointerEvent<HTMLElement>) {
    if (!gesture.current.active || gesture.current.pointerId !== event.pointerId) return

    const dx = event.clientX - gesture.current.startX
    const dy = event.clientY - gesture.current.startY

    setDrag({
      x: dx,
      y: Math.max(-80, Math.min(80, dy)),
    })

    gesture.current.lastX = event.clientX
    gesture.current.lastTime = performance.now()
  }

  function finishPointer(event: ReactPointerEvent<HTMLElement>) {
    if (!gesture.current.active || gesture.current.pointerId !== event.pointerId) return

    const now = performance.now()
    const dx = event.clientX - gesture.current.startX
    const elapsed = Math.max(now - gesture.current.lastTime, 1)
    const velocity = (event.clientX - gesture.current.lastX) / elapsed
    const cardWidth = cardRef.current?.offsetWidth ?? 360
    const distanceThreshold = Math.max(92, cardWidth * 0.27)
    const distanceCommit = Math.abs(dx) >= distanceThreshold
    const flickCommit =
      Math.abs(velocity) >= VELOCITY_THRESHOLD &&
      Math.abs(dx) >= MIN_FLICK_DISTANCE

    gesture.current.active = false
    setDragging(false)

    if (distanceCommit || flickCommit) {
      commit(dx >= 0 ? 'like' : 'pass')
      return
    }

    setDrag({ x: 0, y: 0 })
  }

  function cancelPointer() {
    gesture.current.active = false
    setDragging(false)
    setDrag({ x: 0, y: 0 })
  }

  if (!currentBook) return null

  return (
    <div className="deck-shell">
      <div
        className="swipe-deck"
        role="group"
        aria-label="Descoberta de livros. Deslize para a esquerda para passar ou para a direita para demonstrar interesse."
      >
        {[2, 1].map((depth) => {
          const book = bookAt(depth)
          const scaleBoost = progress * (depth === 1 ? 0.025 : 0.012)
          const baseScale = depth === 1 ? 0.965 : 0.935
          const baseY = depth === 1 ? 11 : 21

          return (
            <article
              className="swipe-card swipe-card--behind"
              key={`${book.id}-${depth}-${index}`}
              style={{
                transform: `translate3d(0, ${baseY * (1 - progress * 0.7)}px, 0) scale(${baseScale + scaleBoost})`,
                zIndex: 3 - depth,
              }}
              aria-hidden="true"
            >
              <BookCardContent book={book} muted />
            </article>
          )
        })}

        <article
          ref={cardRef}
          className={`swipe-card swipe-card--top ${dragging ? 'is-dragging' : ''} ${exitDirection ? 'is-exiting' : ''}`}
          style={{ transform: topTransform }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={finishPointer}
          onPointerCancel={cancelPointer}
          tabIndex={0}
        >
          <div
            className="swipe-stamp swipe-stamp--like"
            style={{ opacity: likeOpacity }}
          >
            QUERO LER
          </div>
          <div
            className="swipe-stamp swipe-stamp--pass"
            style={{ opacity: passOpacity }}
          >
            PASSAR
          </div>
          <BookCardContent book={currentBook} />
        </article>
      </div>

      <div className="swipe-actions" aria-label="Ações do cartão">
        <div className="swipe-action-item swipe-action-item--rewind">
          <button
            className="swipe-action swipe-action--rewind"
            onClick={rewind}
            disabled={history.length === 0}
            aria-label="Desfazer última deslizada"
            title="Desfazer"
          >
            <img src="/assets/librio/action-rewind.svg" alt="" aria-hidden="true" />
          </button>
          <strong>VOLTAR</strong>
          <span>talvez depois</span>
        </div>

        <div className="swipe-action-item swipe-action-item--pass">
          <button
            className="swipe-action swipe-action--pass"
            onClick={() => commit('pass')}
            aria-label="Passar este livro"
          >
            <img src="/assets/librio/action-pass.svg" alt="" aria-hidden="true" />
          </button>
          <strong>PASSAR</strong>
          <span>não é agora</span>
        </div>

        <div className="swipe-action-item swipe-action-item--like">
          <button
            className="swipe-action swipe-action--like"
            onClick={() => commit('like')}
            aria-label="Quero ler este livro"
          >
            <img src="/assets/librio/action-like.svg" alt="" aria-hidden="true" />
          </button>
          <strong>QUERO LER</strong>
          <span>essa sim!</span>
        </div>
      </div>
    </div>
  )
}

function BookCardContent({ book, muted = false }: { book: Book; muted?: boolean }) {
  return (
    <>
      <div className="swipe-art">
        <div
          className="swipe-art-blur"
          style={{ backgroundImage: `url("${book.cover}")` }}
        />
        <img
          className="swipe-cover"
          src={book.cover}
          alt={muted ? '' : `Capa de ${book.title}`}
          draggable={false}
        />
        <div className="swipe-campus-pill">no seu campus</div>
        <div className="paper-tape paper-tape--one" aria-hidden="true" />
        <div className="paper-tape paper-tape--two" aria-hidden="true" />
      </div>

      <div className="swipe-book-body">
        <div className="swipe-book-main">
          <div>
            <p className="eyebrow">DISPONÍVEL</p>
            <h2>{book.title}</h2>
            <p className="swipe-author">{book.author}</p>
          </div>
          <div className="swipe-days">
            <strong>{book.maxDays}</strong>
            <span>dias</span>
          </div>
        </div>

        <div className="swipe-tags">
          {book.tags.slice(0, 3).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>

        <div className="swipe-owner-row">
          <div className="owner-avatar">{book.owner.charAt(0)}</div>
          <div className="swipe-owner-copy">
            <strong>{book.owner}</strong>
            <span>{book.course}</span>
          </div>
          <div className="swipe-rating">
            ★ {book.rating}
            <span>{book.loans} empréstimos</span>
          </div>
        </div>

        <p className="swipe-note">{book.note}</p>
      </div>
    </>
  )
}
