import { FormEvent, useEffect, useMemo, useState } from 'react'
import SwipeDeck, { Book } from './components/SwipeDeck'
import { useLibrioArtCssVariables } from './art/librioArt'

type Tab = 'discover' | 'library' | 'matches' | 'profile'

type ShelfBook = {
  id: number
  title: string
  author: string
  available: boolean
}

type ChatMessage = {
  id: number
  fromMe: boolean
  text: string
  time: string
}

const discoverBooks: Book[] = [
  {
    id: 1,
    title: 'Duna',
    author: 'Frank Herbert',
    owner: 'Marina Alves',
    course: 'Engenharia Mecatrônica',
    campus: 'IFCE · Limoeiro do Norte',
    rating: 4.9,
    loans: 11,
    maxDays: 30,
    cover: 'https://covers.openlibrary.org/b/isbn/9780441172719-L.jpg',
    note: 'Livro bem conservado. Posso entregar no intervalo da tarde.',
    tags: ['Ficção', 'Clássico', 'Sci-fi'],
  },
  {
    id: 2,
    title: 'O Hobbit',
    author: 'J. R. R. Tolkien',
    owner: 'Lucas Matos',
    course: 'Sistemas de Informação',
    campus: 'IFCE · Limoeiro do Norte',
    rating: 4.8,
    loans: 7,
    maxDays: 21,
    cover: 'https://covers.openlibrary.org/b/isbn/9780547928227-L.jpg',
    note: 'Edição de bolso. Algumas marcações a lápis.',
    tags: ['Fantasia', 'Aventura', 'Clássico'],
  },
  {
    id: 3,
    title: '1984',
    author: 'George Orwell',
    owner: 'Ana Clara',
    course: 'Tecnologia em Alimentos',
    campus: 'IFCE · Limoeiro do Norte',
    rating: 5,
    loans: 5,
    maxDays: 15,
    cover: 'https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg',
    note: 'Pode pegar na biblioteca do campus.',
    tags: ['Distopia', 'Política', 'Clássico'],
  },
  {
    id: 4,
    title: 'Neuromancer',
    author: 'William Gibson',
    owner: 'Rodrigo Lima',
    course: 'Redes de Computadores',
    campus: 'IFCE · Limoeiro do Norte',
    rating: 4.7,
    loans: 9,
    maxDays: 20,
    cover: 'https://covers.openlibrary.org/b/isbn/9780441569595-L.jpg',
    note: 'Cyberpunk clássico. Ótimo estado de conservação.',
    tags: ['Cyberpunk', 'Sci-fi', 'Clássico'],
  },
  {
    id: 5,
    title: 'Fahrenheit 451',
    author: 'Ray Bradbury',
    owner: 'Beatriz Costa',
    course: 'Licenciatura em Física',
    campus: 'IFCE · Limoeiro do Norte',
    rating: 4.9,
    loans: 12,
    maxDays: 25,
    cover: 'https://covers.openlibrary.org/b/isbn/9781451673319-L.jpg',
    note: 'Leitura essencial sobre livros e liberdade.',
    tags: ['Distopia', 'Literatura', 'Clássico'],
  },
]

const initialShelf: ShelfBook[] = [
  { id: 1, title: 'Fundação', author: 'Isaac Asimov', available: true },
  { id: 2, title: 'Sapiens', author: 'Yuval Noah Harari', available: false },
  { id: 3, title: 'O Guia do Mochileiro das Galáxias', author: 'Douglas Adams', available: true },
]

const navItems: Array<{ id: Tab; icon: string; label: string }> = [
  { id: 'discover', icon: '⌕', label: 'Descobrir' },
  { id: 'library', icon: '▥', label: 'Estante' },
  { id: 'matches', icon: '♡', label: 'Matches' },
  { id: 'profile', icon: '◉', label: 'Perfil' },
]

function App() {
  useLibrioArtCssVariables()
  const [tab, setTab] = useState<Tab>('discover')
  const [likedIds, setLikedIds] = useState<number[]>([])
  const [shelf, setShelf] = useState<ShelfBook[]>(initialShelf)
  const [showAddBook, setShowAddBook] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [toast, setToast] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, fromMe: false, text: 'Oi! Vi que você curtiu Duna 😊', time: '13:41' },
    { id: 2, fromMe: true, text: 'Sim! Faz tempo que quero ler.', time: '13:42' },
    { id: 3, fromMe: false, text: 'Posso levar amanhã. Estarei perto da biblioteca às 15h.', time: '13:43' },
  ])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [tab])

  const availableCount = useMemo(
    () => shelf.filter((book) => book.available).length,
    [shelf],
  )

  function showFeedback(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 1800)
  }

  function handleLike(book: Book) {
    setLikedIds((ids) => (ids.includes(book.id) ? ids : [...ids, book.id]))
  }

  function handleUndoLike(book: Book) {
    setLikedIds((ids) => ids.filter((id) => id !== book.id))
  }

  function addBook(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const title = String(form.get('title') ?? '').trim()
    const author = String(form.get('author') ?? '').trim()

    if (!title || !author) return

    setShelf((books) => [
      { id: Date.now(), title, author, available: true },
      ...books,
    ])
    setShowAddBook(false)
    showFeedback('Livro adicionado à sua estante')
  }

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const text = String(form.get('message') ?? '').trim()
    if (!text) return

    setMessages((items) => [
      ...items,
      {
        id: Date.now(),
        fromMe: true,
        text,
        time: new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    ])
    event.currentTarget.reset()
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <div className="brand">Librio<span>.</span></div>
          <div className="campus">IFCE · Limoeiro do Norte</div>
        </div>
        <button className="avatar-button" aria-label="Abrir perfil" onClick={() => setTab('profile')}>
          G
        </button>
      </header>

      <main className="content">
        {tab === 'discover' && (
          <section className="discover swipe-discover">
            <div className="swipe-titlebar">
              <div>
                <p className="eyebrow">LIVROS MAIS PERTO</p>
                <h1>Descubra sua próxima leitura.</h1>
              </div>
              <button className="round-button filter-button" aria-label="Filtros">☷</button>
            </div>

            <div className="discovery-tabs" aria-label="Filtros de descoberta">
              <button className="active">Descobrir</button>
              <button onClick={() => showFeedback('Em alta entra quando tivermos dados reais')}>Em alta</button>
              <button onClick={() => showFeedback('Filtro por proximidade entra com comunidades reais')}>Perto de você</button>
            </div>

            <SwipeDeck
              books={discoverBooks}
              onLike={handleLike}
              onUndoLike={handleUndoLike}
              onFeedback={showFeedback}
            />
          </section>
        )}

        {tab === 'library' && (
          <section className="library-screen">
            <div className="section-heading">
              <div>
                <p className="eyebrow">MINHA BIBLIOTECA</p>
                <h1>Sua estante, do seu jeito.</h1>
              </div>
              <button className="round-button accent" onClick={() => setShowAddBook(true)} aria-label="Adicionar livro">+</button>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <span>Livros</span>
                <strong>{shelf.length}</strong>
              </div>
              <div className="stat-card">
                <span>Disponíveis</span>
                <strong>{availableCount}</strong>
              </div>
              <div className="stat-card">
                <span>Emprestados</span>
                <strong>{shelf.length - availableCount}</strong>
              </div>
            </div>

            <div className="library-list">
              {shelf.map((book) => (
                <article className="library-item" key={book.id}>
                  <div className="mini-cover">{book.title.charAt(0)}</div>
                  <div className="library-copy">
                    <strong>{book.title}</strong>
                    <span>{book.author}</span>
                  </div>
                  <button
                    className={'availability ' + (book.available ? 'is-available' : '')}
                    onClick={() =>
                      setShelf((books) =>
                        books.map((item) =>
                          item.id === book.id ? { ...item, available: !item.available } : item,
                        ),
                      )
                    }
                  >
                    {book.available ? 'Disponível' : 'Indisponível'}
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === 'matches' && (
          <section className="matches-screen">
            <div className="section-heading">
              <div>
                <p className="eyebrow">CONEXÕES</p>
                <h1>Leitura também aproxima.</h1>
              </div>
            </div>

            <div className="interest-banner">
              <div>
                <span className="spark">✦</span>
                <strong>{likedIds.length + 3} interesses recebidos</strong>
                <p>Veja quem quer ler livros da sua estante.</p>
              </div>
              <button onClick={() => showFeedback('Lista de interessados será conectada ao backend')}>Ver</button>
            </div>

            <h2 className="list-title">Seus matches</h2>
            <article className="match-card" onClick={() => setShowChat(true)}>
              <div className="match-avatar">M</div>
              <div className="match-copy">
                <div>
                  <strong>Marina Alves</strong>
                  <span className="match-badge">Duna</span>
                </div>
                <p>Posso levar amanhã. Estarei perto da biblioteca...</p>
              </div>
              <span className="match-time">13:43</span>
            </article>

            <article className="match-card muted">
              <div className="match-avatar">L</div>
              <div className="match-copy">
                <div>
                  <strong>Lucas Matos</strong>
                  <span className="match-badge">O Hobbit</span>
                </div>
                <p>Match recente · diga oi 👋</p>
              </div>
              <span className="match-time">ontem</span>
            </article>
          </section>
        )}

        {tab === 'profile' && (
          <section className="profile-screen">
            <div className="profile-hero">
              <div className="profile-avatar">G</div>
              <div>
                <p className="eyebrow">MEU PERFIL</p>
                <h1>Georlan</h1>
                <p>IFCE · Limoeiro do Norte</p>
              </div>
            </div>

            <div className="profile-score">
              <div><strong>4.9</strong><span>reputação</span></div>
              <div><strong>14</strong><span>empréstimos</span></div>
              <div><strong>8</strong><span>quero ler</span></div>
            </div>

            <div className="profile-section">
              <div className="profile-section-title">
                <h2>Quero ler</h2>
                <button>Ver tudo</button>
              </div>
              <div className="wish-grid">
                {['Neuromancer', 'Cosmos', 'O Problema dos Três Corpos'].map((title) => (
                  <div className="wish-card" key={title}>
                    <div>{title.charAt(0)}</div>
                    <span>{title}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="profile-section">
              <div className="profile-section-title">
                <h2>Sobre a comunidade</h2>
              </div>
              <div className="community-card">
                <span>◌</span>
                <div>
                  <strong>IFCE · Limoeiro do Norte</strong>
                  <p>Compartilhe livros com pessoas que circulam pelo mesmo campus.</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <nav className="bottom-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={tab === item.id ? 'active' : ''}
            onClick={() => setTab(item.id)}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {showAddBook && (
        <div className="modal-backdrop" onMouseDown={() => setShowAddBook(false)}>
          <div className="modal" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAddBook(false)}>×</button>
            <p className="eyebrow">NOVA ADIÇÃO</p>
            <h2>Coloque um livro na sua estante</h2>
            <form onSubmit={addBook} className="book-form">
              <label>
                Título
                <input name="title" placeholder="Ex.: Duna" autoFocus />
              </label>
              <label>
                Autor
                <input name="author" placeholder="Ex.: Frank Herbert" />
              </label>
              <button type="submit" className="submit-button">Adicionar livro</button>
            </form>
          </div>
        </div>
      )}

      {showChat && (
        <div className="chat-panel">
          <header className="chat-header">
            <button onClick={() => setShowChat(false)}>←</button>
            <div className="match-avatar small">M</div>
            <div>
              <strong>Marina Alves</strong>
              <span>match por Duna</span>
            </div>
          </header>
          <div className="chat-book-context">
            <span>📕</span>
            <div><strong>Duna</strong><small>até 30 dias</small></div>
            <button onClick={() => showFeedback('Fluxo de empréstimo entra na próxima fase')}>Combinar retirada</button>
          </div>
          <div className="messages">
            {messages.map((message) => (
              <div className={'message ' + (message.fromMe ? 'mine' : '')} key={message.id}>
                <p>{message.text}</p>
                <span>{message.time}</span>
              </div>
            ))}
          </div>
          <form className="message-form" onSubmit={sendMessage}>
            <input name="message" placeholder="Escreva uma mensagem..." autoComplete="off" />
            <button type="submit">↑</button>
          </form>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

export default App
