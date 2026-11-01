import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'

const API_BASE = 'http://localhost:5000/api'
const API = `${API_BASE}/transactions`
const AUTH_API = `${API_BASE}/auth`
const BUDGET_API = `${API_BASE}/budgets`

const colors = [
  '#14b8a6',
  '#f97316',
  '#8b5cf6',
  '#ec4899',
  '#3b82f6',
  '#eab308',
  '#64748b',
]

const budgetCategories = [
  'Food',
  'Education',
  'Transport',
  'Shopping',
  'Bills',
  'Entertainment',
  'Health',
  'Other',
]

const transactionCategories = [
  'Food',
  'Education',
  'Transport',
  'Shopping',
  'Salary',
  'Freelance',
  'Bills',
  'Entertainment',
  'Health',
  'Other',
]

const money = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount || 0)

function App() {
  const [activeTab, setActiveTab] = useState('Dashboard')

  const [token, setToken] = useState(
    () => localStorage.getItem('fintrack-token') || ''
  )

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('fintrack-user')) || null
    } catch {
      return null
    }
  })

  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: '',
  })

  const [authLoading, setAuthLoading] = useState(false)
  const [transactions, setTransactions] = useState([])
  const [budgets, setBudgets] = useState([])

  const [budgetForm, setBudgetForm] = useState({
    category: 'Food',
    limit: '',
  })

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [editForm, setEditForm] = useState({
    title: '',
    amount: '',
    type: 'Expense',
    category: 'Food',
    date: new Date().toISOString().slice(0, 10),
  })

  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [sortBy, setSortBy] = useState('newest')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [transactionLoading, setTransactionLoading] = useState(false)
  const [budgetLoading, setBudgetLoading] = useState(false)

  const [form, setForm] = useState({
    title: '',
    amount: '',
    type: 'Expense',
    category: 'Food',
    date: new Date().toISOString().slice(0, 10),
  })

  const inputStyle =
    'w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100'

  // Load transactions
  async function loadTransactions() {
    try {
      setLoading(true)

      const response = await axios.get(API, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setTransactions(response.data)
      setError('')
    } catch (err) {
      if (err.response?.status === 401) {
        logout()
        setError('Your session expired. Please login again.')
      } else {
        setError(
          err.response?.data?.message ||
            'Could not load transactions. Check your server.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  // Load budgets
  async function loadBudgets() {
    try {
      const response = await axios.get(BUDGET_API, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setBudgets(response.data)
    } catch (err) {
      if (err.response?.status === 401) {
        logout()
      } else {
        setError(
          err.response?.data?.message || 'Unable to load budgets.'
        )
      }
    }
  }

  // Load data whenever token changes
  useEffect(() => {
    if (token) {
      loadTransactions()
      loadBudgets()
    } else {
      setTransactions([])
      setBudgets([])
      setLoading(false)
    }
  }, [token])

  // Login and registration
  async function handleAuth(e) {
    e.preventDefault()

    try {
      setAuthLoading(true)
      setError('')

      const endpoint =
        authMode === 'login' ? '/login' : '/register'

      const response = await axios.post(
        `${AUTH_API}${endpoint}`,
        authForm
      )

      if (authMode === 'register') {
        alert('Registration successful! Please login.')
        setAuthMode('login')

        setAuthForm({
          name: '',
          email: authForm.email,
          password: '',
        })

        return
      }

      const {
        token: newToken,
        user: loggedInUser,
      } = response.data

      localStorage.setItem('fintrack-token', newToken)
      localStorage.setItem(
        'fintrack-user',
        JSON.stringify(loggedInUser)
      )

      setToken(newToken)
      setUser(loggedInUser)

      setAuthForm({
        name: '',
        email: '',
        password: '',
      })
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Authentication failed. Please try again.'
      )
    } finally {
      setAuthLoading(false)
    }
  }

  // Logout
  function logout() {
    localStorage.removeItem('fintrack-token')
    localStorage.removeItem('fintrack-user')

    setToken('')
    setUser(null)
    setTransactions([])
    setBudgets([])
    setError('')
    setShowForm(false)
    setEditingId(null)
    setActiveTab('Dashboard')
  }

  // Add transaction
  async function addTransaction(e) {
    e.preventDefault()

    const amount = Number(form.amount)

    if (!form.title.trim() || !amount || amount <= 0 || !form.date) {
      setError('Please enter a valid title, amount and date.')
      return
    }

    try {
      setTransactionLoading(true)
      setError('')

      const response = await axios.post(
        API,
        {
          ...form,
          title: form.title.trim(),
          amount,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      setTransactions((previous) => [
        response.data,
        ...previous,
      ])

      setForm({
        title: '',
        amount: '',
        type: 'Expense',
        category: 'Food',
        date: new Date().toISOString().slice(0, 10),
      })

      setShowForm(false)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to add transaction. Try again.'
      )
    } finally {
      setTransactionLoading(false)
    }
  }

  // Delete transaction
  async function deleteTransaction(id) {
    if (
      !window.confirm(
        'Are you sure you want to delete this transaction?'
      )
    ) {
      return
    }

    try {
      await axios.delete(`${API}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setTransactions((previous) =>
        previous.filter((t) => (t._id || t.id) !== id)
      )

      if (editingId === id) {
        setEditingId(null)
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to delete transaction. Please try again.'
      )
    }
  }

  // Start editing a transaction
  function startEditing(transaction) {
    setEditingId(transaction._id || transaction.id)

    setEditForm({
      title: transaction.title || '',
      amount: String(transaction.amount ?? ''),
      type: transaction.type || 'Expense',
      category: transaction.category || 'Food',
      date: String(transaction.date).slice(0, 10),
    })

    setError('')

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  // Save edited transaction
  async function updateTransaction(e) {
    e.preventDefault()

    const amount = Number(editForm.amount)

    if (
      !editForm.title.trim() ||
      !amount ||
      amount <= 0 ||
      !editForm.date
    ) {
      setError('Please enter valid transaction details.')
      return
    }

    try {
      setTransactionLoading(true)
      setError('')

      const response = await axios.put(
        `${API}/${editingId}`,
        {
          ...editForm,
          title: editForm.title.trim(),
          amount,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      setTransactions((previous) =>
        previous.map((t) =>
          (t._id || t.id) === editingId
            ? response.data
            : t
        )
      )

      setEditingId(null)
      setError('')
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to update transaction. Please try again.'
      )
    } finally {
      setTransactionLoading(false)
    }
  }

  // Add budget
  async function addBudget(e) {
    e.preventDefault()

    const amount = Number(budgetForm.limit)

    if (!amount || amount <= 0) {
      setError('Please enter a valid budget amount.')
      return
    }

    try {
      setBudgetLoading(true)
      setError('')

      const response = await axios.post(
        BUDGET_API,
        {
          category: budgetForm.category,
          limit: amount,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      setBudgets((previous) => [
        ...previous,
        response.data,
      ])

      setBudgetForm({
        category: 'Food',
        limit: '',
      })
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to save budget.'
      )
    } finally {
      setBudgetLoading(false)
    }
  }

  // Delete budget
  async function deleteBudget(id) {
    if (!window.confirm('Delete this budget?')) {
      return
    }

    try {
      setError('')

      await axios.delete(`${BUDGET_API}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setBudgets((previous) =>
        previous.filter((budget) => budget._id !== id)
      )
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to delete budget.'
      )
    }
  }

  // Authentication screen
  if (!token) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-cover bg-center p-5"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15,23,42,0.55), rgba(15,23,42,0.65)), url('/finance-bg.png')",
        }}
      >
        <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white/95 p-7 shadow-2xl backdrop-blur-xl sm:p-9">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500 text-3xl font-black text-white shadow-lg">
              ₹
            </div>

            <h1 className="text-3xl font-black text-slate-900">
              FinTrack<span className="text-teal-600">.</span>
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Your money, made simple.
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login')
                setError('')
              }}
              className={`rounded-lg py-3 text-sm font-bold transition ${
                authMode === 'login'
                  ? 'bg-teal-600 text-white shadow'
                  : 'text-slate-600 hover:bg-white'
              }`}
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('register')
                setError('')
              }}
              className={`rounded-lg py-3 text-sm font-bold transition ${
                authMode === 'register'
                  ? 'bg-teal-600 text-white shadow'
                  : 'text-slate-600 hover:bg-white'
              }`}
            >
              Register
            </button>
          </div>

          <h2 className="mb-2 text-2xl font-bold text-slate-900">
            {authMode === 'login'
              ? 'Welcome back!'
              : 'Create your account'}
          </h2>

          <p className="mb-6 text-sm text-slate-500">
            {authMode === 'login'
              ? 'Login to manage your finances.'
              : 'Join FinTrack and start managing your money.'}
          </p>

          {error && (
            <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === 'register' && (
              <input
                className={inputStyle}
                type="text"
                placeholder="Full name"
                value={authForm.name}
                onChange={(e) =>
                  setAuthForm({
                    ...authForm,
                    name: e.target.value,
                  })
                }
                required
              />
            )}

            <input
              className={inputStyle}
              type="email"
              placeholder="Email address"
              value={authForm.email}
              onChange={(e) =>
                setAuthForm({
                  ...authForm,
                  email: e.target.value,
                })
              }
              required
            />

            <input
              className={inputStyle}
              type="password"
              placeholder="Password (minimum 6 characters)"
              value={authForm.password}
              onChange={(e) =>
                setAuthForm({
                  ...authForm,
                  password: e.target.value,
                })
              }
              minLength={6}
              required
            />

            <button
              type="submit"
              disabled={authLoading}
              className="w-full rounded-xl bg-teal-600 py-3.5 font-bold text-white shadow-lg transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {authLoading
                ? 'Please wait...'
                : authMode === 'login'
                  ? 'Login to FinTrack'
                  : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            FinTrack · Personal Finance Tracker
          </p>
        </div>
      </div>
    )
  }

  // Dashboard calculations
  const income = transactions
    .filter((t) => t.type === 'Income')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const expenses = transactions
    .filter((t) => t.type === 'Expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const balance = income - expenses

  // Apply transaction filters and sorting
  const filtered = transactions
    .filter((t) => {
      const matchesType =
        filter === 'All' || t.type === filter

      const term = search.toLowerCase()

      const matchesSearch =
        (t.title || '').toLowerCase().includes(term) ||
        (t.category || '').toLowerCase().includes(term)

      const matchesCategory =
        categoryFilter === 'All' ||
        t.category === categoryFilter

      const transactionDate = String(t.date).slice(0, 10)

      const matchesStartDate =
        !startDate || transactionDate >= startDate

      const matchesEndDate =
        !endDate || transactionDate <= endDate

      return (
        matchesType &&
        matchesSearch &&
        matchesCategory &&
        matchesStartDate &&
        matchesEndDate
      )
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return String(b.date).localeCompare(String(a.date))
      }

      if (sortBy === 'oldest') {
        return String(a.date).localeCompare(String(b.date))
      }

      if (sortBy === 'highest') {
        return Number(b.amount) - Number(a.amount)
      }

      if (sortBy === 'lowest') {
        return Number(a.amount) - Number(b.amount)
      }

      return 0
    })

  // Export filtered transactions as CSV
  function exportCSV() {
    if (filtered.length === 0) {
      setError('No transactions available to export.')
      return
    }

    const headers = [
      'Date',
      'Title',
      'Category',
      'Type',
      'Amount',
    ]

    const escapeCSV = (value) =>
      `"${String(value ?? '').replace(/"/g, '""')}"`

    const rows = filtered.map((t) => [
      String(t.date).slice(0, 10),
      t.title,
      t.category,
      t.type,
      Number(t.amount).toFixed(2),
    ])

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map((row) =>
        row.map(escapeCSV).join(',')
      ),
    ].join('\n')

    const blob = new Blob(
      ['\uFEFF' + csvContent],
      { type: 'text/csv;charset=utf-8;' }
    )

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'fintrack-transactions.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  // Expense category chart
  const categoryTotals = transactions
    .filter((t) => t.type === 'Expense')
    .reduce((totals, t) => {
      totals[t.category] =
        (totals[t.category] || 0) + Number(t.amount)

      return totals
    }, {})

  const pieData = Object.entries(categoryTotals).map(
    ([name, value]) => ({ name, value })
  )

  // Monthly chart
  const monthlyTotals = transactions.reduce((totals, t) => {
    const month = String(t.date).slice(0, 7)

    if (!totals[month]) {
      totals[month] = {
        month,
        Income: 0,
        Expense: 0,
      }
    }

    totals[month][t.type] += Number(t.amount)

    return totals
  }, {})

  const barData = Object.values(monthlyTotals).sort(
    (a, b) => a.month.localeCompare(b.month)
  )

  const currentMonth = new Date()
    .toISOString()
    .slice(0, 7)

  // Main application
  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{
        backgroundImage:
          "linear-gradient(rgba(15,23,42,0.20), rgba(15,23,42,0.20)), url('/finance-bg.png')",
      }}
    >
      <div className="flex min-h-screen">

        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col bg-slate-950/90 p-6 text-white backdrop-blur-md md:flex">
          <div className="mb-12 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-400 text-xl font-black text-slate-950">
              ₹
            </div>

            <div>
              <h1 className="text-xl font-bold">FinTrack</h1>
              <p className="text-xs text-slate-400">
                Personal Finance Tracker
              </p>
            </div>
          </div>

          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Workspace
          </p>

          {['Dashboard', 'Transactions', 'Budgets'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab)
                setShowForm(false)
                setEditingId(null)
                setError('')
              }}
              className={`mt-2 w-full rounded-xl px-4 py-3 text-left font-semibold transition ${
                activeTab === tab
                  ? 'bg-teal-500 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {tab === 'Dashboard'
                ? '▦'
                : tab === 'Transactions'
                  ? '↗'
                  : '◷'}
              &nbsp; {tab}
            </button>
          ))}

          <div className="mt-auto rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
            <p className="font-semibold">Small steps count.</p>
            <p className="mt-2 text-sm text-slate-400">
              Track your money and build better financial habits.
            </p>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-10">

          {/* Mobile navigation */}
          <nav className="mb-6 grid grid-cols-3 gap-2 md:hidden">
            {['Dashboard', 'Transactions', 'Budgets'].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab)
                  setShowForm(false)
                  setEditingId(null)
                  setError('')
                }}
                className={`rounded-xl px-2 py-3 text-xs font-bold sm:text-sm ${
                  activeTab === tab
                    ? 'bg-teal-600 text-white'
                    : 'border border-white/70 bg-white/90 text-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>

          {/* Header */}
          <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-teal-900">
                YOUR FINANCIAL SPACE
              </p>

              <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                {activeTab === 'Budgets'
                  ? 'Budget Management'
                  : activeTab === 'Transactions'
                    ? 'Transactions'
                    : 'Finance Dashboard'}
                <span className="text-teal-600">.</span>
              </h2>

              <p className="mt-2 text-sm text-slate-800">
                Welcome, {user?.name || 'User'}! Your money, made simple.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {activeTab === 'Dashboard' && (
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white shadow-lg transition hover:bg-teal-700"
                >
                  {showForm
                    ? '✕ Close form'
                    : '+ Add transaction'}
                </button>
              )}

              <button
                onClick={logout}
                className="rounded-xl border border-white/70 bg-white/90 px-5 py-3 font-semibold text-slate-800 shadow-lg transition hover:bg-white"
              >
                Logout
              </button>
            </div>
          </header>

          {/* Error message */}
          {error && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <span>{error}</span>

              <button
                onClick={() => setError('')}
                className="font-bold underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Add transaction form */}
          {activeTab === 'Dashboard' && showForm && (
            <section className="mb-8 rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl backdrop-blur-md">
              <h3 className="mb-5 text-xl font-bold">
                Add a transaction
              </h3>

              <form
                onSubmit={addTransaction}
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              >
                <input
                  className={inputStyle}
                  placeholder="Transaction title"
                  value={form.title}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      title: e.target.value,
                    })
                  }
                  required
                />

                <input
                  className={inputStyle}
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Amount (₹)"
                  value={form.amount}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      amount: e.target.value,
                    })
                  }
                  required
                />

                <select
                  className={inputStyle}
                  value={form.type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      type: e.target.value,
                    })
                  }
                >
                  <option>Expense</option>
                  <option>Income</option>
                </select>

                <select
                  className={inputStyle}
                  value={form.category}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      category: e.target.value,
                    })
                  }
                >
                  {transactionCategories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>

                <input
                  className={inputStyle}
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      date: e.target.value,
                    })
                  }
                  required
                />

                <button
                  type="submit"
                  disabled={transactionLoading}
                  className="rounded-xl bg-teal-600 px-5 py-3 font-bold text-white transition hover:bg-teal-700 disabled:opacity-60"
                >
                  {transactionLoading
                    ? 'Saving...'
                    : 'Save transaction'}
                </button>
              </form>
            </section>
          )}

          {/* Dashboard summary cards */}
          {activeTab === 'Dashboard' && (
            <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-3xl bg-slate-950/90 p-6 text-white shadow-xl backdrop-blur-md">
                <p className="text-sm text-slate-300">
                  Current balance
                </p>

                <h3 className="mt-4 break-words text-3xl font-black">
                  {money(balance)}
                </h3>

                <p className="mt-3 text-sm text-teal-300">
                  Income minus expenses
                </p>
              </div>

              <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl backdrop-blur-md">
                <p className="text-sm font-medium text-emerald-800">
                  Total income
                </p>

                <h3 className="mt-4 break-words text-3xl font-black text-emerald-600">
                  {money(income)}
                </h3>

                <p className="mt-3 text-sm text-slate-500">
                  Money received
                </p>
              </div>

              <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl backdrop-blur-md">
                <p className="text-sm font-medium text-rose-800">
                  Total expenses
                </p>

                <h3 className="mt-4 break-words text-3xl font-black text-rose-600">
                  {money(expenses)}
                </h3>

                <p className="mt-3 text-sm text-slate-500">
                  Money spent
                </p>
              </div>
            </section>
          )}

          {/* Dashboard charts */}
          {activeTab === 'Dashboard' && (
            <section className="mt-8 grid gap-6 xl:grid-cols-2">
              <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl backdrop-blur-md sm:p-6">
                <h3 className="text-lg font-bold">
                  Expense by category
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  See where your money goes.
                </p>

                <div className="mt-4 h-72">
                  {pieData.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          label
                        >
                          {pieData.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={colors[index % colors.length]}
                            />
                          ))}
                        </Pie>

                        <Tooltip
                          formatter={(value) => money(value)}
                        />

                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-center text-sm text-slate-400">
                      Add an expense to see your chart.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl backdrop-blur-md sm:p-6">
                <h3 className="text-lg font-bold">
                  Monthly income vs expenses
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Compare your monthly money flow.
                </p>

                <div className="mt-4 h-72">
                  {barData.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />

                        <Tooltip
                          formatter={(value) => money(value)}
                        />

                        <Legend />

                        <Bar
                          dataKey="Income"
                          fill="#10b981"
                          radius={[5, 5, 0, 0]}
                        />

                        <Bar
                          dataKey="Expense"
                          fill="#f43f5e"
                          radius={[5, 5, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-center text-sm text-slate-400">
                      Add transactions to see monthly totals.
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Transactions page */}
          {activeTab !== 'Budgets' && (
            <section className="mt-8 rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl backdrop-blur-md sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold">
                    {activeTab === 'Transactions'
                      ? 'All transactions'
                      : 'Recent transactions'}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Your recorded income and expenses.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold">
                    {filtered.length} records
                  </span>

                  <button
                    onClick={exportCSV}
                    disabled={filtered.length === 0}
                    className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    ↓ Export CSV
                  </button>
                </div>
              </div>

              {/* Search and filters */}
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <input
                  className={inputStyle}
                  placeholder="Search title or category..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                <select
                  className={inputStyle}
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="All">All transactions</option>
                  <option value="Income">Income only</option>
                  <option value="Expense">Expenses only</option>
                </select>

                <select
                  className={inputStyle}
                  value={categoryFilter}
                  onChange={(e) =>
                    setCategoryFilter(e.target.value)
                  }
                >
                  <option value="All">All categories</option>

                  {[...new Set(transactions.map((t) => t.category))]
                    .sort()
                    .map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                </select>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    From date
                  </label>

                  <input
                    className={inputStyle}
                    type="date"
                    value={startDate}
                    max={endDate || undefined}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    To date
                  </label>

                  <input
                    className={inputStyle}
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                <select
                  className={inputStyle}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="highest">Highest amount</option>
                  <option value="lowest">Lowest amount</option>
                </select>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => {
                    setSearch('')
                    setFilter('All')
                    setCategoryFilter('All')
                    setStartDate('')
                    setEndDate('')
                    setSortBy('newest')
                  }}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  Clear filters
                </button>

                <span className="text-xs text-slate-500">
                  Showing {filtered.length} of {transactions.length} transactions
                </span>
              </div>

              {/* Edit transaction form */}
              {editingId && (
                <div className="mt-6 rounded-2xl border border-teal-200 bg-teal-50/80 p-5 sm:p-6">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">
                        Edit transaction
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Update the details and save your changes.
                      </p>
                    </div>

                    <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-700">
                      Editing
                    </span>
                  </div>

                  <form
                    onSubmit={updateTransaction}
                    className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                  >
                    <input
                      className={inputStyle}
                      placeholder="Transaction title"
                      value={editForm.title}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          title: e.target.value,
                        })
                      }
                      required
                    />

                    <input
                      className={inputStyle}
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="Amount (₹)"
                      value={editForm.amount}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          amount: e.target.value,
                        })
                      }
                      required
                    />

                    <select
                      className={inputStyle}
                      value={editForm.type}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          type: e.target.value,
                        })
                      }
                    >
                      <option>Expense</option>
                      <option>Income</option>
                    </select>

                    <select
                      className={inputStyle}
                      value={editForm.category}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          category: e.target.value,
                        })
                      }
                    >
                      {transactionCategories.map((category) => (
                        <option key={category}>{category}</option>
                      ))}
                    </select>

                    <input
                      className={inputStyle}
                      type="date"
                      value={editForm.date}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          date: e.target.value,
                        })
                      }
                      required
                    />

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="submit"
                        disabled={transactionLoading}
                        className="flex-1 rounded-xl bg-teal-600 px-5 py-3 font-bold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {transactionLoading
                          ? 'Updating...'
                          : 'Save changes'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null)
                          setError('')
                        }}
                        className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Transaction table */}
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-3 py-4">Transaction</th>
                      <th className="px-3 py-4">Category</th>
                      <th className="px-3 py-4">Date</th>
                      <th className="px-3 py-4">Type</th>
                      <th className="px-3 py-4 text-right">
                        Amount
                      </th>
                      <th className="px-3 py-4 text-right">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td
                          colSpan="6"
                          className="px-3 py-10 text-center text-slate-400"
                        >
                          Loading transactions...
                        </td>
                      </tr>
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td
                          colSpan="6"
                          className="px-3 py-10 text-center text-slate-400"
                        >
                          No transactions found. Add one to get started!
                        </td>
                      </tr>
                    ) : (
                      filtered.map((t) => (
                        <tr
                          key={t._id || t.id}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                        >
                          <td className="px-3 py-4 font-semibold">
                            {t.title}
                          </td>

                          <td className="px-3 py-4 text-slate-500">
                            {t.category}
                          </td>

                          <td className="px-3 py-4 text-slate-500">
                            {String(t.date).slice(0, 10)}
                          </td>

                          <td className="px-3 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${
                                t.type === 'Income'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {t.type}
                            </span>
                          </td>

                          <td
                            className={`px-3 py-4 text-right font-bold ${
                              t.type === 'Income'
                                ? 'text-emerald-600'
                                : 'text-rose-600'
                            }`}
                          >
                            {t.type === 'Income' ? '+' : '-'}
                            {money(t.amount)}
                          </td>

                          <td className="px-3 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => startEditing(t)}
                                className="rounded-lg px-3 py-2 font-semibold text-teal-700 transition hover:bg-teal-50"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() =>
                                  deleteTransaction(t._id || t.id)
                                }
                                className="rounded-lg px-3 py-2 font-semibold text-rose-600 transition hover:bg-rose-50"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Budgets page */}
          {activeTab === 'Budgets' && (
            <section className="space-y-6">

              {/* Create budget form */}
              <div className="rounded-3xl border border-white/70 bg-white/95 p-6 shadow-xl backdrop-blur-md">
                <h3 className="text-xl font-bold text-slate-900">
                  Create a monthly budget
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Set a spending limit for each category. Your budgets are stored securely in MongoDB.
                </p>

                <form
                  onSubmit={addBudget}
                  className="mt-5 grid gap-4 sm:grid-cols-3"
                >
                  <select
                    className={inputStyle}
                    value={budgetForm.category}
                    onChange={(e) =>
                      setBudgetForm({
                        ...budgetForm,
                        category: e.target.value,
                      })
                    }
                  >
                    {budgetCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>

                  <input
                    className={inputStyle}
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Monthly limit (₹)"
                    value={budgetForm.limit}
                    onChange={(e) =>
                      setBudgetForm({
                        ...budgetForm,
                        limit: e.target.value,
                      })
                    }
                    required
                  />

                  <button
                    className="rounded-xl bg-teal-600 px-5 py-3 font-bold text-white transition hover:bg-teal-700 disabled:opacity-60"
                    type="submit"
                    disabled={budgetLoading}
                  >
                    {budgetLoading ? 'Saving...' : 'Save budget'}
                  </button>
                </form>
              </div>

              {/* Budget cards */}
              <div className="grid gap-5 lg:grid-cols-2">
                {budgets.length === 0 ? (
                  <div className="rounded-3xl border border-white/70 bg-white/90 p-8 text-center text-slate-500 shadow-xl">
                    No budgets yet. Create your first monthly budget above.
                  </div>
                ) : (
                  budgets.map((budget) => {
                    const spent = transactions
                      .filter(
                        (t) =>
                          t.type === 'Expense' &&
                          t.category === budget.category &&
                          String(t.date).slice(0, 7) === currentMonth
                      )
                      .reduce(
                        (sum, t) => sum + Number(t.amount),
                        0
                      )

                    const limit = Number(budget.limit)

                    const percent = Math.min(
                      (spent / limit) * 100,
                      100
                    )

                    const actualPercent =
                      limit > 0
                        ? Math.round((spent / limit) * 100)
                        : 0

                    const over = spent > limit

                    return (
                      <div
                        key={budget._id}
                        className="rounded-3xl border border-white/70 bg-white/95 p-6 shadow-xl backdrop-blur-md"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm text-slate-500">
                              {budget.category}
                            </p>

                            <h4 className="mt-1 text-2xl font-black text-slate-900">
                              {money(limit)}
                            </h4>

                            <p className="text-xs text-slate-500">
                              Monthly spending limit
                            </p>
                          </div>

                          <button
                            onClick={() => deleteBudget(budget._id)}
                            className="rounded-lg px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                          >
                            Delete
                          </button>
                        </div>

                        <div className="mt-6 flex justify-between gap-3 text-sm">
                          <span className="text-slate-500">
                            Spent:{' '}
                            <b
                              className={
                                over
                                  ? 'text-rose-600'
                                  : 'text-slate-800'
                              }
                            >
                              {money(spent)}
                            </b>
                          </span>

                          <span className="font-bold text-slate-700">
                            {actualPercent}%
                          </span>
                        </div>

                        <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full transition-all ${
                              over
                                ? 'bg-rose-500'
                                : 'bg-teal-500'
                            }`}
                            style={{
                              width: `${percent}%`,
                            }}
                          />
                        </div>

                        <p
                          className={`mt-3 text-sm font-medium ${
                            over
                              ? 'text-rose-600'
                              : 'text-emerald-700'
                          }`}
                        >
                          {over
                            ? `Over budget by ${money(spent - limit)}`
                            : `${money(limit - spent)} remaining this month`}
                        </p>
                      </div>
                    )
                  })
                )}
              </div>
            </section>
          )}

          {/* Footer */}
          <footer className="py-8 text-center text-xs text-white drop-shadow">
            FinTrack · Personal Finance Tracker · Your money, your overview.
          </footer>
        </main>
      </div>
    </div>
  )
}

export default App