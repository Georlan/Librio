import {
  PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { ArtAsset } from '../art/librioArt'

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
  bookId: number
  decision: Decision
  previousIndex: number
  book: Book
}

type ExitingCard = {
  id: string
  book: Book
  direction: -1 | 1
  startX: number
  startY: number
}

type SwipeDeckProps = {
  books: Book[]
  onLike: (book: Book) => void
  onUndoLike: (book: Book) => void
  onFeedback: (message: string) => void
}

const VELOCITY_THRESHOLD = 0.62
const MIN_FLICK_DISTANCE = 34

export default function SwipeDeck({
  books,
  onLike,
  onUndoLike,
  onFeedback,
}: SwipeDeckProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [drag, setDrag] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [exitingCards, setExitingCards] = useState<ExitingCard[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])

  const activeIndexRef = useRef(activeIndex)
  activeIndexRef.current = activeIndex

  const dragRef = useRef(drag)
  dragRef.current = drag

  const cardRef = useRef<HTMLElement | null>(null)

  const gesture = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastTime: 0,
  })

  const currentBook = books[activeIndex]
  const visibleBooks = books.slice(activeIndex, activeIndex + 3)

  // Invariant check in development
  if (import.meta.env.DEV && currentBook) {
    console.assert(
      books[activeIndex]?.id === currentBook.id,
      `[Invariant] topCard.book.id (${currentBook.id}) !== books[activeIndex].id (${books[activeIndex]?.id})`,
    )
  }

  const progress = Math.min(Math.abs(drag.x) / 110, 1)
  const likeOpacity = drag.x > 0 ? progress : 0
  const passOpacity = drag.x < 0 ? progress : 0

  const commitDecision = useCallback(
    (decision: Decision, fromDrag: boolean = false) => {
      const currentIndex = activeIndexRef.current
      const bookToCommit = books[currentIndex]
      if (!bookToCommit) return

      const direction: -1 | 1 = decision === 'like' ? 1 : -1
      const startX = fromDrag ? dragRef.current.x : 0
      const startY = fromDrag ? dragRef.current.y : 0

      const exitItem: ExitingCard = {
        id: `${bookToCommit.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        book: bookToCommit,
        direction,
        startX,
        startY,
      }

      // Marcar card atual como saindo (ele continuará saindo até ser desmontado)
      setExitingCards((prev) => [...prev, exitItem])

      // Registrar histórico com referência real ao livro
      setHistory((prev) => [
        ...prev.slice(-9),
        {
          bookId: bookToCommit.id,
          decision,
          previousIndex: currentIndex,
          book: bookToCommit,
        },
      ])

      if (decision === 'like') {
        onLike(bookToCommit)
        onFeedback('Interesse enviado ✨')
      }

      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(10)
        } catch {
          // Fallback silencioso se vibrate não for suportado
        }
      }

      // Avançar imediatamente com atualização funcional
      setActiveIndex((prev) => prev + 1)
      activeIndexRef.current = currentIndex + 1

      // Zerar estado de drag para o novo card que assume o topo
      setDrag({ x: 0, y: 0 })
      setDragging(false)
      dragRef.current = { x: 0, y: 0 }
    },
    [books, onFeedback, onLike],
  )

  const undoLastDecision = useCallback(() => {
    if (history.length === 0) return

    const last = history[history.length - 1]
    setHistory((items) => items.slice(0, -1))
    setActiveIndex(last.previousIndex)
    activeIndexRef.current = last.previousIndex

    setDrag({ x: 0, y: 0 })
    setDragging(false)
    dragRef.current = { x: 0, y: 0 }

    if (last.decision === 'like') {
      onUndoLike(last.book)
    }
    onFeedback('Última deslizada desfeita')
  }, [history, onFeedback, onUndoLike])

  const removeExitingCard = useCallback((id: string) => {
    setExitingCards((prev) => prev.filter((c) => c.id !== id))
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowLeft') commitDecision('pass')
      if (event.key === 'ArrowRight') commitDecision('like')
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        undoLastDecision()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [commitDecision, undoLastDecision])

  function onPointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (event.button !== 0 || !currentBook) return

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

    const nextDrag = {
      x: dx,
      y: Math.max(-80, Math.min(80, dy)),
    }
    setDrag(nextDrag)
    dragRef.current = nextDrag

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

    if (distanceCommit || flickCommit) {
      commitDecision(dx >= 0 ? 'like' : 'pass', true)
      return
    }

    // Gesto cancelado: somente aqui o card retorna suavemente para 0,0
    setDragging(false)
    setDrag({ x: 0, y: 0 })
    dragRef.current = { x: 0, y: 0 }
  }

  function cancelPointer() {
    gesture.current.active = false
    setDragging(false)
    setDrag({ x: 0, y: 0 })
    dragRef.current = { x: 0, y: 0 }
  }

  return (
    <div className="deck-shell">
      <div
        className="swipe-deck"
        role="group"
        aria-label="Descoberta de livros. Deslize para a esquerda para passar ou para a direita para demonstrar interesse."
        data-testid="swipe-deck"
        data-active-index={activeIndex}
        data-top-book-id={currentBook?.id ?? ''}
      >
        {visibleBooks.length === 0 && exitingCards.length === 0 && (
          <div className="deck-empty" data-testid="deck-empty">
            <p className="eyebrow">FIM DA PILHA</p>
            <h3>Você viu todos os livros disponíveis!</h3>
            <p>Novos títulos chegam frequentemente da sua comunidade acadêmica.</p>
          </div>
        )}

        {/* Renderiza a pilha de trás para a frente */}
        {visibleBooks
          .slice()
          .reverse()
          .map((book) => {
            const stackIndex = visibleBooks.indexOf(book)
            const isTop = stackIndex === 0
            const depth = stackIndex

            let transform = 'translate3d(0, 0, 0) scale(1)'
            if (isTop) {
              transform = dragging
                ? `translate3d(${drag.x}px, ${drag.y * 0.16}px, 0) rotate(${drag.x / 18}deg)`
                : 'translate3d(0, 0, 0) rotate(0deg) scale(1)'
            } else {
              const scaleBoost = dragging ? progress * (depth === 1 ? 0.025 : 0.012) : 0
              const baseScale = depth === 1 ? 0.965 : 0.935
              const baseY = depth === 1 ? 11 : 21
              const currentY = dragging ? baseY * (1 - progress * 0.7) : baseY
              transform = `translate3d(0, ${currentY}px, 0) scale(${baseScale + scaleBoost})`
            }

            return (
              <article
                key={book.id}
                ref={isTop ? cardRef : undefined}
                data-testid={isTop ? 'top-card' : `behind-card-${book.id}`}
                data-book-id={book.id}
                data-book-title={book.title}
                data-stack-index={stackIndex}
                className={`swipe-card ${isTop ? 'swipe-card--top' : 'swipe-card--behind'} ${isTop && dragging ? 'is-dragging' : ''}`}
                style={{
                  transform,
                  zIndex: 4 - depth,
                }}
                onPointerDown={isTop ? onPointerDown : undefined}
                onPointerMove={isTop ? onPointerMove : undefined}
                onPointerUp={isTop ? finishPointer : undefined}
                onPointerCancel={isTop ? cancelPointer : undefined}
                tabIndex={isTop ? 0 : undefined}
                aria-hidden={isTop ? undefined : true}
              >
                {isTop && (
                  <>
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
                  </>
                )}
                <BookCardContent book={book} muted={!isTop} />
              </article>
            )
          })}

        {/* Cards em saída animando até fora da tela */}
        {exitingCards.map((item) => (
          <ExitingCardItem
            key={item.id}
            item={item}
            onComplete={removeExitingCard}
          />
        ))}
      </div>

      <div className="swipe-actions" aria-label="Ações do cartão">
        <div className="swipe-action-item swipe-action-item--rewind">
          <button
            className="swipe-action swipe-action--rewind"
            onClick={undoLastDecision}
            disabled={history.length === 0}
            aria-label="Desfazer última deslizada"
            title="Desfazer"
            data-testid="action-rewind"
          >
            <ArtAsset slot="actions.rewind" decorative />
          </button>
          <strong>VOLTAR</strong>
          <span>talvez depois</span>
        </div>

        <div className="swipe-action-item swipe-action-item--pass">
          <button
            className="swipe-action swipe-action--pass"
            onClick={() => commitDecision('pass')}
            disabled={!currentBook}
            aria-label="Passar este livro"
            data-testid="action-pass"
          >
            <ArtAsset slot="actions.pass" decorative />
          </button>
          <strong>PASSAR</strong>
          <span>não é agora</span>
        </div>

        <div className="swipe-action-item swipe-action-item--like">
          <button
            className="swipe-action swipe-action--like"
            onClick={() => commitDecision('like')}
            disabled={!currentBook}
            aria-label="Quero ler este livro"
            data-testid="action-like"
          >
            <ArtAsset slot="actions.like" decorative />
          </button>
          <strong>QUERO LER</strong>
          <span>essa sim!</span>
        </div>
      </div>
    </div>
  )
}

function ExitingCardItem({
  item,
  onComplete,
}: {
  item: ExitingCard
  onComplete: (id: string) => void
}) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setAnimated(true)
    })
    const timer = setTimeout(() => {
      onComplete(item.id)
    }, 280)

    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timer)
    }
  }, [item.id, onComplete])

  const travel =
    typeof window !== 'undefined' ? Math.max(window.innerWidth * 1.25, 520) : 600

  const transform = animated
    ? `translate3d(${item.direction * travel}px, ${item.startY * 0.35}px, 0) rotate(${item.direction * 17}deg)`
    : `translate3d(${item.startX}px, ${item.startY * 0.16}px, 0) rotate(${item.startX / 18}deg)`

  return (
    <article
      data-testid={`exiting-card-${item.book.id}`}
      data-book-id={item.book.id}
      className="swipe-card swipe-card--exiting"
      style={{
        transform,
        zIndex: 10,
      }}
      aria-hidden="true"
    >
      <div
        className="swipe-stamp swipe-stamp--like"
        style={{ opacity: item.direction === 1 ? 1 : 0 }}
      >
        QUERO LER
      </div>
      <div
        className="swipe-stamp swipe-stamp--pass"
        style={{ opacity: item.direction === -1 ? 1 : 0 }}
      >
        PASSAR
      </div>
      <BookCardContent book={item.book} muted />
    </article>
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
