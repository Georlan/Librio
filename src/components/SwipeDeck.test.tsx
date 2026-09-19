import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SwipeDeck, { Book } from './SwipeDeck'

const mockBooks: Book[] = [
  {
    id: 1,
    title: 'Livro A (Duna)',
    author: 'Frank Herbert',
    owner: 'Marina Alves',
    course: 'Engenharia',
    campus: 'IFCE Limoeiro',
    rating: 4.9,
    loans: 11,
    maxDays: 30,
    cover: 'https://example.com/cover1.jpg',
    note: 'Nota do livro A',
    tags: ['Sci-fi', 'Clássico'],
  },
  {
    id: 2,
    title: 'Livro B (O Hobbit)',
    author: 'J. R. R. Tolkien',
    owner: 'Lucas Matos',
    course: 'Sistemas',
    campus: 'IFCE Limoeiro',
    rating: 4.8,
    loans: 7,
    maxDays: 21,
    cover: 'https://example.com/cover2.jpg',
    note: 'Nota do livro B',
    tags: ['Fantasia', 'Aventura'],
  },
  {
    id: 3,
    title: 'Livro C (1984)',
    author: 'George Orwell',
    owner: 'Ana Clara',
    course: 'Alimentos',
    campus: 'IFCE Limoeiro',
    rating: 5.0,
    loans: 5,
    maxDays: 15,
    cover: 'https://example.com/cover3.jpg',
    note: 'Nota do livro C',
    tags: ['Distopia'],
  },
  {
    id: 4,
    title: 'Livro D (Neuromancer)',
    author: 'William Gibson',
    owner: 'Rodrigo Lima',
    course: 'Redes',
    campus: 'IFCE Limoeiro',
    rating: 4.7,
    loans: 9,
    maxDays: 20,
    cover: 'https://example.com/cover4.jpg',
    note: 'Nota do livro D',
    tags: ['Cyberpunk'],
  },
  {
    id: 5,
    title: 'Livro E (Fahrenheit 451)',
    author: 'Ray Bradbury',
    owner: 'Beatriz Costa',
    course: 'Física',
    campus: 'IFCE Limoeiro',
    rating: 4.9,
    loans: 12,
    maxDays: 25,
    cover: 'https://example.com/cover5.jpg',
    note: 'Nota do livro E',
    tags: ['Distopia', 'Clássico'],
  },
]

describe('SwipeDeck - Máquina de Estados e Invariantes da Pilha', () => {
  let onLike: (book: Book) => void
  let onUndoLike: (book: Book) => void
  let onFeedback: (msg: string) => void

  beforeEach(() => {
    onLike = vi.fn()
    onUndoLike = vi.fn()
    onFeedback = vi.fn()
    vi.useFakeTimers()
  })

  it('Invariante 1: O card no topo deve sempre corresponder a books[activeIndex]', () => {
    render(
      <SwipeDeck
        books={mockBooks}
        onLike={onLike}
        onUndoLike={onUndoLike}
        onFeedback={onFeedback}
      />,
    )

    const deck = screen.getByTestId('swipe-deck')
    expect(deck).toHaveAttribute('data-active-index', '0')

    const topCard = screen.getByTestId('top-card')
    expect(topCard).toHaveAttribute('data-book-id', '1')
    expect(topCard).toHaveTextContent('Livro A (Duna)')

    // O próximo livro (B) já deve estar renderizado atrás
    const behindCardB = screen.getByTestId('behind-card-2')
    expect(behindCardB).toBeInTheDocument()
    expect(behindCardB).toHaveTextContent('Livro B (O Hobbit)')
  })

  it('Invariante 2: Swipe / Botão PASSAR consome exatamente 1 livro e avança activeIndex para o próximo', () => {
    render(
      <SwipeDeck
        books={mockBooks}
        onLike={onLike}
        onUndoLike={onUndoLike}
        onFeedback={onFeedback}
      />,
    )

    const passButton = screen.getByTestId('action-pass')
    fireEvent.click(passButton)

    // activeIndex agora é 1
    const deck = screen.getByTestId('swipe-deck')
    expect(deck).toHaveAttribute('data-active-index', '1')

    // O novo card no topo é imediatamente o Livro B (2)
    const newTop = screen.getByTestId('top-card')
    expect(newTop).toHaveAttribute('data-book-id', '2')
    expect(newTop).toHaveTextContent('Livro B (O Hobbit)')

    // O card anterior (A) está em exitingCards (saindo) e não volta ao centro
    const exitingA = screen.getByTestId('exiting-card-1')
    expect(exitingA).toBeInTheDocument()

    // Ao avançar timers, o card em saída é desmontado
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(screen.queryByTestId('exiting-card-1')).not.toBeInTheDocument()
  })

  it('Invariante 3: Botão QUERO LER consome exatamente 1 livro, chama onLike e avança activeIndex', () => {
    render(
      <SwipeDeck
        books={mockBooks}
        onLike={onLike}
        onUndoLike={onUndoLike}
        onFeedback={onFeedback}
      />,
    )

    const likeButton = screen.getByTestId('action-like')
    fireEvent.click(likeButton)

    expect(onLike).toHaveBeenCalledWith(mockBooks[0])
    expect(onFeedback).toHaveBeenCalledWith('Interesse enviado ✨')

    const deck = screen.getByTestId('swipe-deck')
    expect(deck).toHaveAttribute('data-active-index', '1')

    const newTop = screen.getByTestId('top-card')
    expect(newTop).toHaveAttribute('data-book-id', '2')
  })

  it('Invariante 4: Gesto cancelado (drag pequeno < threshold) realiza snap-back sem alterar activeIndex nem livro', () => {
    render(
      <SwipeDeck
        books={mockBooks}
        onLike={onLike}
        onUndoLike={onUndoLike}
        onFeedback={onFeedback}
      />,
    )

    const topCard = screen.getByTestId('top-card')
    // Simula mock de setPointerCapture
    topCard.setPointerCapture = vi.fn()

    // Começa drag
    fireEvent.pointerDown(topCard, {
      button: 0,
      pointerId: 1,
      clientX: 200,
      clientY: 300,
    })

    // Move apenas 20px (bem abaixo do threshold de 92px)
    fireEvent.pointerMove(topCard, {
      pointerId: 1,
      clientX: 180,
      clientY: 300,
    })

    // Solta
    fireEvent.pointerUp(topCard, {
      pointerId: 1,
      clientX: 180,
      clientY: 300,
    })

    // activeIndex continua 0
    const deck = screen.getByTestId('swipe-deck')
    expect(deck).toHaveAttribute('data-active-index', '0')

    // O card no topo continua sendo o Livro 1
    const stillTop = screen.getByTestId('top-card')
    expect(stillTop).toHaveAttribute('data-book-id', '1')
    expect(stillTop).toHaveTextContent('Livro A (Duna)')

    // Nenhum card foi colocado em exiting
    expect(screen.queryByTestId('exiting-card-1')).not.toBeInTheDocument()
    expect(onLike).not.toHaveBeenCalled()
  })

  it('Invariante 5: Gesto confirmado (> threshold) consome o card e avança para o próximo imediatamente', () => {
    render(
      <SwipeDeck
        books={mockBooks}
        onLike={onLike}
        onUndoLike={onUndoLike}
        onFeedback={onFeedback}
      />,
    )

    const topCard = screen.getByTestId('top-card')
    topCard.setPointerCapture = vi.fn()

    // Começa drag
    fireEvent.pointerDown(topCard, {
      button: 0,
      pointerId: 1,
      clientX: 200,
      clientY: 300,
    })

    // Move 150px para a esquerda (PASSAR)
    fireEvent.pointerMove(topCard, {
      pointerId: 1,
      clientX: 50,
      clientY: 300,
    })

    // Solta confirmando swipe
    fireEvent.pointerUp(topCard, {
      pointerId: 1,
      clientX: 50,
      clientY: 300,
    })

    // activeIndex avançou imediatamente
    const deck = screen.getByTestId('swipe-deck')
    expect(deck).toHaveAttribute('data-active-index', '1')

    // Livro B é o novo topo
    const newTop = screen.getByTestId('top-card')
    expect(newTop).toHaveAttribute('data-book-id', '2')
    expect(newTop).toHaveTextContent('Livro B (O Hobbit)')

    // Livro A está saindo
    expect(screen.getByTestId('exiting-card-1')).toBeInTheDocument()
  })

  it('Invariante 6: Undo (Voltar) restaura o livro anterior com sua integridade real', () => {
    render(
      <SwipeDeck
        books={mockBooks}
        onLike={onLike}
        onUndoLike={onUndoLike}
        onFeedback={onFeedback}
      />,
    )

    const likeButton = screen.getByTestId('action-like')
    fireEvent.click(likeButton) // Curte Livro A

    expect(screen.getByTestId('top-card')).toHaveAttribute('data-book-id', '2')

    // Clica em VOLTAR
    const rewindButton = screen.getByTestId('action-rewind')
    fireEvent.click(rewindButton)

    // Livro A deve voltar ao topo como card real da pilha
    const restoredTop = screen.getByTestId('top-card')
    expect(restoredTop).toHaveAttribute('data-book-id', '1')
    expect(restoredTop).toHaveTextContent('Livro A (Duna)')

    // onUndoLike foi chamado para Livro A
    expect(onUndoLike).toHaveBeenCalledWith(mockBooks[0])
    expect(onFeedback).toHaveBeenCalledWith('Última deslizada desfeita')
  })

  it('Invariante 7: Múltiplos swipes rápidos em sequência avançam 1 por 1 sem pular nem duplicar', () => {
    render(
      <SwipeDeck
        books={mockBooks}
        onLike={onLike}
        onUndoLike={onUndoLike}
        onFeedback={onFeedback}
      />,
    )

    const passButton = screen.getByTestId('action-pass')
    const likeButton = screen.getByTestId('action-like')

    // 3 ações rápidas consecutivas: Passar A, Curtir B, Passar C
    fireEvent.click(passButton) // Descarta A
    fireEvent.click(likeButton) // Descarta B
    fireEvent.click(passButton) // Descarta C

    const deck = screen.getByTestId('swipe-deck')
    expect(deck).toHaveAttribute('data-active-index', '3')

    // O topo agora DEVE ser o Livro D (id: 4)
    const topCard = screen.getByTestId('top-card')
    expect(topCard).toHaveAttribute('data-book-id', '4')
    expect(topCard).toHaveTextContent('Livro D (Neuromancer)')

    // Próximo livro atrás deve ser o Livro E (id: 5)
    expect(screen.getByTestId('behind-card-5')).toBeInTheDocument()
  })

  it('Invariante 8: Teste manual de 5 livros completo (A pass, B like, C pass, D like, E cancel)', () => {
    render(
      <SwipeDeck
        books={mockBooks}
        onLike={onLike}
        onUndoLike={onUndoLike}
        onFeedback={onFeedback}
      />,
    )

    // 1. A no topo
    expect(screen.getByTestId('top-card')).toHaveAttribute('data-book-id', '1')

    // A -> swipe esquerda / pass
    fireEvent.click(screen.getByTestId('action-pass'))
    expect(screen.getByTestId('top-card')).toHaveAttribute('data-book-id', '2')

    // B -> swipe direita / like
    fireEvent.click(screen.getByTestId('action-like'))
    expect(screen.getByTestId('top-card')).toHaveAttribute('data-book-id', '3')

    // C -> botão PASSAR
    fireEvent.click(screen.getByTestId('action-pass'))
    expect(screen.getByTestId('top-card')).toHaveAttribute('data-book-id', '4')

    // D -> botão QUERO LER
    fireEvent.click(screen.getByTestId('action-like'))
    expect(screen.getByTestId('top-card')).toHaveAttribute('data-book-id', '5')

    // E -> drag pequeno e cancela
    const topE = screen.getByTestId('top-card')
    topE.setPointerCapture = vi.fn()
    fireEvent.pointerDown(topE, { button: 0, pointerId: 1, clientX: 200, clientY: 200 })
    fireEvent.pointerMove(topE, { pointerId: 1, clientX: 215, clientY: 200 })
    fireEvent.pointerUp(topE, { pointerId: 1, clientX: 215, clientY: 200 })

    // E continua no topo
    expect(screen.getByTestId('top-card')).toHaveAttribute('data-book-id', '5')
    expect(screen.getByTestId('top-card')).toHaveTextContent('Livro E (Fahrenheit 451)')
  })
})
