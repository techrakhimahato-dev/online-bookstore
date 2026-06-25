import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BookOpen,
  Boxes,
  Camera,
  CheckCircle2,
  Edit3,
  Filter,
  LibraryBig,
  LockKeyhole,
  LogIn,
  LogOut,
  PackagePlus,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import './styles.css';

const storageKey = 'patan-dhoka-books-inventory';
const authStorageKey = 'patan-dhoka-books-auth-token';
const apiBaseUrl = (import.meta.env.VITE_API_URL || 'https://online-bookstore-uj9y.onrender.com').replace(/\/$/, '');

const availabilityOptions = [
  { value: 'available', label: 'Available', tone: 'success' },
  { value: 'needs-ordering', label: 'Needs ordering', tone: 'warn' },
  { value: 'out-of-stock', label: 'Out of stock', tone: 'danger' },
];

const defaultCover =
  'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=900&q=80';

const seedBooks = [
  {
    id: 101,
    title: 'Karnali Blues',
    author: 'Buddhisagar',
    category: 'Nepali Literature',
    price: 650,
    description:
      'A moving Nepali novel about family, memory, and growing up across western Nepal.',
    coverImage:
      'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=900&q=80',
    stockQuantity: 12,
    availabilityStatus: 'available',
  },
  {
    id: 102,
    title: 'Muna Madan',
    author: 'Laxmi Prasad Devkota',
    category: 'Poetry',
    price: 180,
    description:
      'A classic Nepali poetic work loved for its direct language, emotional weight, and cultural place.',
    coverImage:
      'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=900&q=80',
    stockQuantity: 3,
    availabilityStatus: 'needs-ordering',
  },
  {
    id: 103,
    title: 'Atomic Habits',
    author: 'James Clear',
    category: 'Self Development',
    price: 980,
    description:
      'A practical framework for building better habits through small improvements and identity based change.',
    coverImage:
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80',
    stockQuantity: 0,
    availabilityStatus: 'out-of-stock',
  },
  {
    id: 104,
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    category: 'History',
    price: 1250,
    description:
      'A broad, readable look at human history, culture, cooperation, and the stories societies build around.',
    coverImage:
      'https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=900&q=80',
    stockQuantity: 7,
    availabilityStatus: 'available',
  },
  {
    id: 105,
    title: 'The Psychology of Money',
    author: 'Morgan Housel',
    category: 'Finance',
    price: 850,
    description:
      'Short lessons on wealth, behavior, risk, patience, and the human side of financial decisions.',
    coverImage:
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80',
    stockQuantity: 2,
    availabilityStatus: 'needs-ordering',
  },
  {
    id: 106,
    title: 'The Alchemist',
    author: 'Paulo Coelho',
    category: 'Fiction',
    price: 720,
    description:
      'A compact adventure about dreams, travel, purpose, and listening closely to the signs around you.',
    coverImage:
      'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=900&q=80',
    stockQuantity: 16,
    availabilityStatus: 'available',
  },
];

const emptyBook = {
  title: '',
  author: '',
  category: '',
  price: '',
  description: '',
  coverImage: '',
  stockQuantity: '',
  availabilityStatus: 'available',
};

const money = new Intl.NumberFormat('en-NP', {
  style: 'currency',
  currency: 'NPR',
  maximumFractionDigits: 0,
});

function statusFromStock(stockQuantity) {
  const stock = Number(stockQuantity);
  if (stock <= 0) return 'out-of-stock';
  if (stock <= 3) return 'needs-ordering';
  return 'available';
}

function statusMeta(status) {
  return availabilityOptions.find((option) => option.value === status) || availabilityOptions[0];
}

function AnimatedWords({ text }) {
  const words = text.split(' ');

  return words.map((word, index) => (
    <span
      className="animated-word"
      style={{ '--word-delay': `${index * 65}ms` }}
      key={`${word}-${index}`}
    >
      {word}
      {index < words.length - 1 ? '\u00a0' : ''}
    </span>
  ));
}

function normalizeBook(book) {
  const stockQuantity = Math.max(0, Number(book.stockQuantity) || 0);

  return {
    ...book,
    title: book.title.trim(),
    author: book.author.trim(),
    category: book.category.trim(),
    price: Math.max(0, Number(book.price) || 0),
    description: book.description.trim(),
    coverImage: book.coverImage || defaultCover,
    stockQuantity,
    availabilityStatus: book.availabilityStatus || statusFromStock(stockQuantity),
  };
}

function imageUrlFromApi(imageUrl) {
  if (!imageUrl) return defaultCover;
  if (imageUrl.startsWith('/')) return `${apiBaseUrl}${imageUrl}`;
  return imageUrl;
}

function toClientBook(book) {
  const stockQuantity = Number(book.stock ?? book.stockQuantity ?? 0);

  return {
    id: book.id,
    title: book.title || '',
    author: book.author || '',
    category: book.category_name || book.category || 'Uncategorized',
    price: Number(book.price) || 0,
    description: book.description || '',
    coverImage: imageUrlFromApi(book.image_url || book.coverImage),
    stockQuantity,
    availabilityStatus: book.availability_status || book.availabilityStatus || statusFromStock(stockQuantity),
  };
}

function toApiBook(book) {
  return {
    title: book.title,
    author: book.author,
    category: book.category,
    description: book.description,
    price: Number(book.price) || 0,
    stock: Number(book.stockQuantity) || 0,
    availability_status: book.availabilityStatus,
    image_url: book.coverImage,
  };
}

async function apiRequest(path, { method = 'GET', token, body } = {}) {
  const headers = {};
  const options = { method, headers };

  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

function App() {
  const [books, setBooks] = useState([]);
  const [view, setView] = useState('home');
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeBookId, setActiveBookId] = useState(null);
  const [authToken, setAuthToken] = useState(() => window.localStorage.getItem(authStorageKey) || '');
  const [isAdmin, setIsAdmin] = useState(() => Boolean(window.localStorage.getItem(authStorageKey)));
  const [login, setLogin] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyBook);
  const [isLoading, setIsLoading] = useState(true);
  const [appError, setAppError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadBooks();
  }, []);

  async function loadBooks() {
    setIsLoading(true);
    setAppError('');

    try {
      const data = await apiRequest('/api/books?limit=1000');
      const mappedBooks = (data.books || []).map(toClientBook);
      setBooks(mappedBooks);
      setActiveBookId((currentId) => currentId || mappedBooks[0]?.id || null);
    } catch (error) {
      setAppError(`Could not load books from the backend. ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  const categories = useMemo(
    () => [...new Set(books.map((book) => book.category).filter(Boolean))].sort(),
    [books],
  );

  const filteredBooks = useMemo(() => {
    const term = query.trim().toLowerCase();

    return books.filter((book) => {
      const matchesQuery =
        !term ||
        [book.title, book.author, book.category].some((field) =>
          field.toLowerCase().includes(term),
        );
      const matchesCategory = categoryFilter === 'all' || book.category === categoryFilter;
      const matchesStatus =
        statusFilter === 'all' || book.availabilityStatus === statusFilter;

      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [books, categoryFilter, query, statusFilter]);

  const activeBook =
    books.find((book) => book.id === activeBookId) || filteredBooks[0] || books[0];
  const totalStock = books.reduce((sum, book) => sum + Number(book.stockQuantity), 0);
  const needsAction = books.filter((book) => book.availabilityStatus !== 'available').length;
  const outOfStock = books.filter((book) => book.availabilityStatus === 'out-of-stock').length;

  async function handleLogin(event) {
    event.preventDefault();
    const loginId = login.email.trim();

    try {
      const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: {
          username: loginId,
          email: loginId,
          password: login.password,
        },
      });
      window.localStorage.setItem(authStorageKey, data.token);
      setAuthToken(data.token);
      setIsAdmin(true);
      setView('admin');
      setLoginError('');
    } catch (error) {
      setLoginError(error.message || 'Login failed');
    }
  }

  function beginEdit(book) {
    setEditingId(book.id);
    setForm({
      title: book.title,
      author: book.author,
      category: book.category,
      price: book.price,
      description: book.description,
      coverImage: book.coverImage,
      stockQuantity: book.stockQuantity,
      availabilityStatus: book.availabilityStatus,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyBook);
  }

  async function saveBook(event) {
    event.preventDefault();
    const payload = normalizeBook(form);
    setIsSaving(true);
    setAppError('');

    try {
      if (editingId) {
        const data = await apiRequest(`/api/books/${editingId}`, {
          method: 'PUT',
          token: authToken,
          body: toApiBook(payload),
        });
        const updatedBook = toClientBook(data.book);
        setBooks((current) =>
          current.map((book) => (book.id === editingId ? updatedBook : book)),
        );
      } else {
        const data = await apiRequest('/api/books', {
          method: 'POST',
          token: authToken,
          body: toApiBook(payload),
        });
        const nextBook = toClientBook(data.book);
        setBooks((current) => [nextBook, ...current]);
        setActiveBookId(nextBook.id);
      }

      resetForm();
    } catch (error) {
      setAppError(error.message || 'Could not save book');
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteBook(bookId) {
    const book = books.find((item) => item.id === bookId);
    if (!book || !window.confirm(`Delete "${book.title}" from inventory?`)) return;

    try {
      await apiRequest(`/api/books/${bookId}`, {
        method: 'DELETE',
        token: authToken,
      });
      setBooks((current) => {
        const remaining = current.filter((item) => item.id !== bookId);
        if (activeBookId === bookId) setActiveBookId(remaining[0]?.id || null);
        return remaining;
      });
    } catch (error) {
      setAppError(error.message || 'Could not delete book');
    }
  }

  async function updateStock(bookId, nextStock) {
    const stockQuantity = Math.max(0, Number(nextStock) || 0);
    const book = books.find((item) => item.id === bookId);
    if (!book) return;

    setBooks((current) =>
      current.map((book) =>
        book.id === bookId
          ? {
            ...book,
            stockQuantity,
            availabilityStatus: statusFromStock(stockQuantity),
          }
          : book,
      ),
    );

    try {
      const data = await apiRequest(`/api/books/${bookId}`, {
        method: 'PUT',
        token: authToken,
        body: toApiBook({
          ...book,
          stockQuantity,
          availabilityStatus: statusFromStock(stockQuantity),
        }),
      });
      const updatedBook = toClientBook(data.book);
      setBooks((current) => current.map((item) => (item.id === bookId ? updatedBook : item)));
    } catch (error) {
      setAppError(error.message || 'Could not update stock');
      loadBooks();
    }
  }

  async function updateAvailability(bookId, availabilityStatus) {
    const book = books.find((item) => item.id === bookId);
    if (!book) return;

    setBooks((current) =>
      current.map((book) => (book.id === bookId ? { ...book, availabilityStatus } : book)),
    );

    try {
      const data = await apiRequest(`/api/books/${bookId}`, {
        method: 'PUT',
        token: authToken,
        body: toApiBook({ ...book, availabilityStatus }),
      });
      const updatedBook = toClientBook(data.book);
      setBooks((current) => current.map((item) => (item.id === bookId ? updatedBook : item)));
    } catch (error) {
      setAppError(error.message || 'Could not update availability');
      loadBooks();
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f4ee] text-[#251c16]">
      <header className="sticky top-0 z-40 border-b border-[#ded6c8] bg-[#f6f4ee]/95 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <button
            className="flex min-w-0 items-center gap-3"
            onClick={() => setView('home')}
            aria-label="Go to home page"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#28483b] text-white shadow-sm">
              <LibraryBig size={22} />
            </span>
            <span className="min-w-0 text-left">
              <span className="block truncate text-base font-black tracking-normal">
                Patan Dhoka Books
              </span>
              <span className="block truncate text-xs font-bold text-[#75695d]">
                Inventory Management
              </span>
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button className="nav-button" onClick={() => setView('home')}>
              Store
            </button>
            <button className="nav-button" onClick={() => setView(isAdmin ? 'admin' : 'login')}>
              {isAdmin ? 'Dashboard' : 'Admin'}
            </button>
            {isAdmin && (
              <button
                className="icon-button"
                onClick={() => {
                  window.localStorage.removeItem(authStorageKey);
                  setAuthToken('');
                  setIsAdmin(false);
                  setView('home');
                }}
                aria-label="Log out"
                title="Log out"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </nav>
      </header>

      {view === 'home' && (
        <main className="page-enter">
          <section className="hero-section border-b border-[#ded6c8] bg-[#fffdf8]">
            <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_390px] lg:px-8">
              <div className="hero-copy flex flex-col justify-center">
                <div className="hero-kicker mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-[#ded6c8] bg-[#f6f4ee] px-3 py-1 text-sm font-bold text-[#5c5047]">
                  <BookOpen size={16} />
                  Customer catalog
                </div>
                <h1 className="hero-title max-w-3xl text-3xl font-black leading-tight tracking-normal text-[#251c16] sm:text-5xl">
                  Find books, check stock, and see what needs ordering.
                </h1>

                <div className="hero-controls mt-7 grid gap-3 lg:grid-cols-[1fr_180px_180px]">
                  <label className="search-shell">
                    <Search className="shrink-0 text-[#75695d]" size={22} />
                    <input
                      className="min-w-0 flex-1 bg-transparent text-base outline-none"
                      placeholder="Search title, author, or category"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                    />
                  </label>
                  <label className="select-shell">
                    <Filter size={18} />
                    <select
                      value={categoryFilter}
                      onChange={(event) => setCategoryFilter(event.target.value)}
                    >
                      <option value="all">All categories</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="select-shell">
                    <CheckCircle2 size={18} />
                    <select
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                    >
                      <option value="all">All statuses</option>
                      {availabilityOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className="hero-image-panel relative min-h-[320px] overflow-hidden rounded-lg bg-[#28483b] shadow-xl">
                <img
                  className="hero-shelf-image absolute inset-0 h-full w-full object-cover opacity-70"
                  src="https://images.unsplash.com/photo-1526243741027-444d633d7365?auto=format&fit=crop&w=1200&q=80"
                  alt="Bookstore shelves"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#17251f] via-[#17251f]/80 to-transparent p-5 text-white">
                  <p className="text-sm font-bold text-[#f1c86b]">Inventory Snapshot</p>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <Metric value={books.length} label="Titles" />
                    <Metric value={totalStock} label="Copies" />
                    <Metric value={needsAction} label="Actions" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_370px] lg:px-8">
            <div>
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black tracking-normal">Store Catalog</h2>
                  <p className="mt-1 text-sm font-semibold text-[#75695d]">
                    {isLoading ? 'Loading from database...' : `${filteredBooks.length} matching books`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="chip" onClick={() => setCategoryFilter('all')}>
                    All
                  </button>
                  {categories.slice(0, 5).map((category) => (
                    <button
                      key={category}
                      className="chip"
                      onClick={() => setCategoryFilter(category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {appError && (
                <div className="mb-4 rounded-lg border border-[#e9b4bd] bg-[#fff1f1] px-4 py-3 text-sm font-bold text-[#9b2436]">
                  {appError}
                </div>
              )}

              {isLoading ? (
                <div className="rounded-lg border border-[#ded6c8] bg-white p-8 text-center">
                  <h3 className="text-xl font-black">Loading books...</h3>
                  <p className="mt-2 text-sm font-semibold text-[#75695d]">
                    Reading inventory from SQLite through the backend.
                  </p>
                </div>
              ) : filteredBooks.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredBooks.map((book, index) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      index={index}
                      selected={activeBook?.id === book.id}
                      onSelect={() => setActiveBookId(book.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-[#cfc4b3] bg-white p-8 text-center">
                  <Search className="mx-auto text-[#75695d]" size={34} />
                  <h3 className="mt-4 text-xl font-black">No books found</h3>
                  <p className="mt-2 text-sm font-semibold text-[#75695d]">
                    Try a different title, author, category, or status.
                  </p>
                </div>
              )}
            </div>

            {activeBook && <BookDetails book={activeBook} />}
          </section>
        </main>
      )}

      {view === 'login' && (
        <main className="page-enter mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl place-items-center px-4 py-10 sm:px-6 lg:px-8">
          <section className="auth-panel grid w-full max-w-5xl overflow-hidden rounded-lg border border-[#ded6c8] bg-white shadow-xl lg:grid-cols-[0.95fr_1.05fr]">
            <div className="bg-[#28483b] p-8 text-white sm:p-10">
              <ShieldCheck size={34} className="text-[#f1c86b]" />
              <h1 className="mt-6 text-3xl font-black tracking-normal">
                Store Admin Access
              </h1>
              <p className="mt-3 leading-7 text-[#dfe8df]">
                Manage books, covers, prices, stock, and shelf availability from one clean desk.
              </p>
              <div className="mt-8 rounded-lg border border-white/15 bg-white/10 p-4 text-sm font-semibold text-white">
                Demo login: admin / admin123
              </div>
            </div>
            <form className="p-8 sm:p-10" onSubmit={handleLogin}>
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#f6f4ee] text-[#28483b]">
                  <LockKeyhole size={22} />
                </span>
                <div>
                  <h2 className="text-2xl font-black tracking-normal">Admin Login</h2>
                  <p className="text-sm font-semibold text-[#75695d]">Protected staff dashboard</p>
                </div>
              </div>
              <label className="form-label mt-6">
                Username or email
                <input
                  className="field"
                  type="text"
                  autoComplete="username"
                  value={login.email}
                  onChange={(event) => setLogin({ ...login, email: event.target.value })}
                  required
                />
              </label>
              <label className="form-label mt-4">
                Password
                <input
                  className="field"
                  type="password"
                  autoComplete="current-password"
                  value={login.password}
                  onChange={(event) => setLogin({ ...login, password: event.target.value })}
                  required
                />
              </label>
              {loginError && (
                <p className="mt-4 rounded-md bg-[#fff1f1] px-3 py-2 text-sm font-bold text-[#9b2436]">
                  {loginError}
                </p>
              )}
              <button className="primary-button mt-6 w-full" type="submit">
                <LogIn size={18} />
                Sign in
              </button>
            </form>
          </section>
        </main>
      )}

      {view === 'admin' && isAdmin && (
        <AdminDashboard
          books={books}
          form={form}
          setForm={setForm}
          editingId={editingId}
          resetForm={resetForm}
          saveBook={saveBook}
          beginEdit={beginEdit}
          deleteBook={deleteBook}
          updateStock={updateStock}
          updateAvailability={updateAvailability}
          outOfStock={outOfStock}
          totalStock={totalStock}
          appError={appError}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}

function Metric({ value, label }) {
  return (
    <div className="metric-card rounded-lg border border-white/15 bg-white/10 p-3">
      <span className="block text-2xl font-black">{value}</span>
      <span className="text-xs font-bold text-white/75">{label}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const option = statusMeta(status);
  const styles = {
    success: 'border-[#b7dbc8] bg-[#ecf8f0] text-[#216244]',
    warn: 'border-[#efd183] bg-[#fff7df] text-[#8a5b09]',
    danger: 'border-[#e9b4bd] bg-[#fff1f1] text-[#9b2436]',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-black ${styles[option.tone]}`}
    >
      {option.label}
    </span>
  );
}

function BookCard({ book, index, selected, onSelect }) {
  return (
    <button
      className={`book-card text-left ${selected ? 'border-[#28483b] ring-4 ring-[#d8e7dc]' : 'border-[#ded6c8]'
        }`}
      style={{ '--card-delay': `${Math.min(index, 12) * 45}ms` }}
      onClick={onSelect}
    >
      <div className="book-cover-frame aspect-[4/5] overflow-hidden rounded-md bg-[#efe8dc]">
        <img className="book-cover h-full w-full object-cover" src={book.coverImage} alt={`${book.title} cover`} />
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-base font-black tracking-normal">{book.title}</h3>
          <p className="mt-1 truncate text-sm font-semibold text-[#75695d]">{book.author}</p>
        </div>
        <p className="shrink-0 font-black text-[#7d2638]">{money.format(Number(book.price))}</p>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <StatusBadge status={book.availabilityStatus} />
        <span className="text-sm font-bold text-[#75695d]">{book.stockQuantity} left</span>
      </div>
    </button>
  );
}

function BookDetails({ book }) {
  return (
    <aside key={book.id} className="details-panel h-fit rounded-lg border border-[#ded6c8] bg-white p-5 shadow-sm lg:sticky lg:top-24">
      <div className="flex items-center gap-2 text-sm font-black text-[#75695d]">
        <BookOpen size={17} />
        Book details
      </div>
      <img
        className="mt-4 aspect-[16/10] w-full rounded-md object-cover"
        src={book.coverImage}
        alt={`${book.title} cover`}
      />
      <div className="mt-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-normal">{book.title}</h2>
          <p className="mt-1 font-bold text-[#75695d]">{book.author}</p>
        </div>
        <StatusBadge status={book.availabilityStatus} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="chip">{book.category}</span>
        <span className="chip">{money.format(Number(book.price))}</span>
        <span className="chip">{book.stockQuantity} copies</span>
      </div>
      <p className="mt-5 leading-7 text-[#5c5047]">{book.description}</p>
    </aside>
  );
}

function AdminDashboard({
  books,
  form,
  setForm,
  editingId,
  resetForm,
  saveBook,
  beginEdit,
  deleteBook,
  updateStock,
  updateAvailability,
  outOfStock,
  totalStock,
  appError,
  isSaving,
}) {
  function updateFormStock(stockQuantity) {
    setForm({
      ...form,
      stockQuantity,
      availabilityStatus: statusFromStock(stockQuantity),
    });
  }

  function uploadCover(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setForm({ ...form, coverImage: reader.result });
    reader.readAsDataURL(file);
  }

  return (
    <main className="page-enter mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="admin-heading mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-normal">Admin Dashboard</h1>
          <p className="mt-2 font-semibold text-[#75695d]">
            Manage titles, cover images, stock quantity, and availability status.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <MetricBlock icon={<LibraryBig size={20} />} label="Titles" value={books.length} />
          <MetricBlock icon={<Boxes size={20} />} label="Copies" value={totalStock} />
          <MetricBlock icon={<PackagePlus size={20} />} label="Out" value={outOfStock} />
        </div>
      </div>

      {appError && (
        <div className="mb-5 rounded-lg border border-[#e9b4bd] bg-[#fff1f1] px-4 py-3 text-sm font-bold text-[#9b2436]">
          {appError}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
        <form className="admin-form h-fit rounded-lg border border-[#ded6c8] bg-white p-5 shadow-sm" onSubmit={saveBook}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black tracking-normal">
              {editingId ? 'Edit Book' : 'Add New Book'}
            </h2>
            {editingId && (
              <button type="button" className="secondary-button" onClick={resetForm}>
                Clear
              </button>
            )}
          </div>

          <div className="mt-5 grid gap-4">
            <label className="form-label">
              Title
              <input
                className="field"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                required
              />
            </label>
            <label className="form-label">
              Author
              <input
                className="field"
                value={form.author}
                onChange={(event) => setForm({ ...form, author: event.target.value })}
                required
              />
            </label>
            <label className="form-label">
              Category
              <input
                className="field"
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
                required
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="form-label">
                Price
                <input
                  className="field"
                  min="0"
                  step="1"
                  type="number"
                  value={form.price}
                  onChange={(event) => setForm({ ...form, price: event.target.value })}
                  required
                />
              </label>
              <label className="form-label">
                Stock
                <input
                  className="field"
                  min="0"
                  type="number"
                  value={form.stockQuantity}
                  onChange={(event) => updateFormStock(event.target.value)}
                  required
                />
              </label>
            </div>
            <label className="form-label">
              Availability Status
              <select
                className="field"
                value={form.availabilityStatus}
                onChange={(event) => setForm({ ...form, availabilityStatus: event.target.value })}
              >
                {availabilityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-label">
              Description
              <textarea
                className="field min-h-28 resize-y"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                required
              />
            </label>
            <label className="form-label">
              Cover Image URL
              <span className="flex items-center gap-2">
                <Camera size={18} className="text-[#75695d]" />
                <input
                  className="field"
                  placeholder="Paste image URL"
                  value={form.coverImage}
                  onChange={(event) => setForm({ ...form, coverImage: event.target.value })}
                />
              </span>
            </label>
            <label className="form-label">
              Upload Cover Image
              <input
                className="field file:mr-3 file:rounded-md file:border-0 file:bg-[#28483b] file:px-3 file:py-2 file:text-sm file:font-black file:text-white"
                type="file"
                accept="image/*"
                onChange={uploadCover}
              />
            </label>
            {form.coverImage && (
              <img
                className="aspect-[16/9] w-full rounded-md border border-[#ded6c8] object-cover"
                src={form.coverImage}
                alt="Selected cover preview"
              />
            )}
          </div>
          <button className="primary-button mt-5 w-full" type="submit">
            <Plus size={18} />
            {isSaving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Book'}
          </button>
        </form>

        <section className="inventory-panel overflow-hidden rounded-lg border border-[#ded6c8] bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ded6c8] p-5">
            <h2 className="text-xl font-black tracking-normal">Inventory</h2>
            <span className="rounded-full bg-[#f6f4ee] px-3 py-1 text-xs font-black text-[#75695d]">
              {books.length} records
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead className="bg-[#f1ece2] text-xs uppercase text-[#75695d]">
                <tr>
                  <th className="px-5 py-3">Book</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Stock</th>
                  <th className="px-5 py-3">Availability</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book, index) => (
                  <tr
                    key={book.id}
                    className="inventory-row border-t border-[#eee6da]"
                    style={{ '--row-delay': `${Math.min(index, 12) * 35}ms` }}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img className="h-14 w-11 rounded object-cover" src={book.coverImage} alt="" />
                        <div className="min-w-0">
                          <p className="max-w-[260px] truncate font-black">{book.title}</p>
                          <p className="max-w-[260px] truncate text-sm font-semibold text-[#75695d]">
                            {book.author}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-[#5c5047]">{book.category}</td>
                    <td className="px-5 py-4 font-black text-[#7d2638]">
                      {money.format(Number(book.price))}
                    </td>
                    <td className="px-5 py-4">
                      <input
                        className="field h-10 w-24"
                        min="0"
                        type="number"
                        value={book.stockQuantity}
                        onChange={(event) => updateStock(book.id, event.target.value)}
                        aria-label={`Stock for ${book.title}`}
                      />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={book.availabilityStatus} />
                        <select
                          className="compact-select"
                          value={book.availabilityStatus}
                          onChange={(event) => updateAvailability(book.id, event.target.value)}
                          aria-label={`Availability for ${book.title}`}
                        >
                          {availabilityOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          className="icon-button"
                          onClick={() => beginEdit(book)}
                          aria-label={`Edit ${book.title}`}
                          title="Edit"
                        >
                          <Edit3 size={17} />
                        </button>
                        <button
                          className="icon-button danger"
                          onClick={() => deleteBook(book.id)}
                          aria-label={`Delete ${book.title}`}
                          title="Delete"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricBlock({ icon, label, value }) {
  return (
    <div className="metric-block min-w-24 rounded-lg border border-[#ded6c8] bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2 text-[#2f6f5b]">{icon}</div>
      <p className="mt-2 text-2xl font-black">{value}</p>
      <p className="text-xs font-black uppercase text-[#75695d]">{label}</p>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
