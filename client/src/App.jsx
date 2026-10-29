
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

const money = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount)

function App() {
  const [transactions, setTransactions] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('All')
  const [form, setForm] = useState({
    title: '',
    category: 'Food',
    amount: '',
    type: 'Expense',
    date: new Date().toISOString().slice(0, 10),
  })
  useEffect(() => {
    async function fetchTransactions() {
      try {
        const response = await axios.get(
          'http://localhost:5000/api/transactions'
        )

        setTransactions(
          response.data.map((transaction) => ({
            ...transaction,
            id: transaction._id,
            date: transaction.date.slice(0, 10),
          }))
        )
      } catch (error) {
        console.error('Failed to load transactions:', error)
        alert('Could not load transactions. Make sure your backend is running.')
      }
    }

    fetchTransactions()
  }, [])
  const income = transactions
    .filter((t) => t.type === 'Income')
    .reduce((sum, t) => sum + t.amount, 0)

  const expenses = transactions
    .filter((t) => t.type === 'Expense')
    .reduce((sum, t) => sum + t.amount, 0)

 const [search, setSearch] = useState('')

const filtered = transactions.filter((t) => {
  const matchesType = filter === 'All' || t.type === filter

  const matchesSearch =
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase())

  return matchesType && matchesSearch
})

  // Prepare expense totals for the pie chart
  const categoryTotals = transactions
    .filter((t) => t.type === 'Expense')
    .reduce((totals, transaction) => {
      totals[transaction.category] =
        (totals[transaction.category] || 0) + transaction.amount
      return totals
    }, {})

  const pieData = Object.entries(categoryTotals).map(
    ([category, amount]) => ({
      name: category,
      value: amount,
    })
  )

  // Prepare monthly income and expense totals
  const monthlyTotals = transactions.reduce((totals, transaction) => {
    const month = transaction.date.slice(0, 7)

    if (!totals[month]) {
      totals[month] = {
        month,
        Income: 0,
        Expense: 0,
      }
    }

    totals[month][transaction.type] += transaction.amount
    return totals
  }, {})

  const barData = Object.values(monthlyTotals).sort(
    (a, b) => a.month.localeCompare(b.month)
  )

  const chartColors = [
    '#14b8a6',
    '#f97316',
    '#8b5cf6',
    '#ec4899',
    '#3b82f6',
    '#eab308',
    '#64748b',
  ]



 async function addTransaction(e) {
  e.preventDefault()

  const amount = Number(form.amount)

  if (!form.title.trim() || !Number.isFinite(amount) || amount <= 0) {
    alert('Enter a description and an amount greater than zero.')
    return
  }

  try {
    const response = await axios.post(
      'http://localhost:5000/api/transactions',
      {
        title: form.title.trim(),
        amount,
        type: form.type,
        category: form.category,
        date: form.date,
      }
    )

    const savedTransaction = {
      ...response.data,
      id: response.data._id,
      date: response.data.date.slice(0, 10),
    }

    setTransactions((previous) => [
      savedTransaction,
      ...previous,
    ])

    setForm({
      title: '',
      category: 'Food',
      amount: '',
      type: 'Expense',
      date: new Date().toISOString().slice(0, 10),
    })

    setShowForm(false)
    alert('Transaction saved successfully!')
  } catch (error) {
    console.error('Failed to save transaction:', error)
    alert('Could not save the transaction. Please check your backend.')
  }
}
 async function deleteTransaction(id) {
  const confirmed = window.confirm(
    'Are you sure you want to delete this transaction?'
  )

  if (!confirmed) return

  try {
    await axios.delete(
      `http://localhost:5000/api/transactions/${id}`
    )

    setTransactions((previous) =>
      previous.filter((t) => t.id !== id)
    )

    alert('Transaction deleted successfully!')
  } catch (error) {
    console.error('Failed to delete transaction:', error)
    alert('Could not delete the transaction. Please try again.')
  }
}
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 md:flex">
      <aside className="bg-slate-900 p-6 text-white md:min-h-screen md:w-60 md:shrink-0">
        <h1 className="text-2xl font-bold">
          <span className="text-teal-400">₹</span> FinTrack
        </h1>
        <p className="mt-2 text-sm text-slate-400">Personal Finance Tracker</p>

        <nav className="mt-8 flex gap-3 md:flex-col">
          <span className="rounded-lg bg-teal-500 px-4 py-3 font-medium text-slate-950">
            Dashboard
          </span>
          <span className="rounded-lg px-4 py-3 text-slate-300">
            Transactions
          </span>
          <span className="rounded-lg px-4 py-3 text-slate-300">
            Budgets
          </span>
        </nav>

        <p className="mt-8 hidden text-xs text-slate-500 md:block">
          Day 1–2 · Frontend prototype
        </p>
      </aside>

      <main className="min-w-0 flex-1 p-5 md:p-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Your money, made simple</p>
            <h2 className="mt-1 text-2xl font-bold md:text-3xl">
              Finance Dashboard
            </h2>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-teal-700"
          >
            + Add transaction
          </button>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm">
            <p className="text-sm text-slate-300">Current balance</p>
            <p className="mt-3 text-3xl font-bold">{money(income - expenses)}</p>
            <p className="mt-2 text-sm text-slate-400">Income minus expenses</p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Total income</p>
            <p className="mt-3 text-3xl font-bold text-emerald-600">
              {money(income)}
            </p>
            <p className="mt-2 text-sm text-slate-400">Money received</p>
          </div>

          <div className="rounded-2xl border border-rose-100 bg-white p-6 shadow-sm sm:col-span-2 xl:col-span-1">
            <p className="text-sm text-slate-500">Total expenses</p>
            <p className="mt-3 text-3xl font-bold text-rose-600">
              {money(expenses)}
            </p>
            <p className="mt-2 text-sm text-slate-400">Money spent</p>
          </div>
        </section>

        {showForm && (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold">Add a transaction</h3>

            <form onSubmit={addTransaction} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="text-sm font-medium">
                Description
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Books"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 font-normal outline-none focus:border-teal-600"
                />
              </label>

              <label className="text-sm font-medium">
                Amount (₹)
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="e.g. 250"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 font-normal outline-none focus:border-teal-600"
                />
              </label>

              <label className="text-sm font-medium">
                Type
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 font-normal"
                >
                  <option>Expense</option>
                  <option>Income</option>
                </select>
              </label>

              <label className="text-sm font-medium">
                Category
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 font-normal"
                >
                  <option>Food</option>
                  <option>Transport</option>
                  <option>Education</option>
                  <option>Allowance</option>
                  <option>Shopping</option>
                  <option>Health</option>
                  <option>Other</option>
                </select>
              </label>

              <label className="text-sm font-medium">
                Date
                <input
                  required
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 font-normal"
                />
              </label>

              <div className="flex items-end gap-3">
                <button
                  type="submit"
                  className="rounded-lg bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-slate-300 px-5 py-3"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">Recent transactions</h3>
              <p className="mt-1 text-sm text-slate-500">
                Your recorded income and expenses
              </p>
            </div>
<input
  type="text"
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  placeholder="Search transactions..."
  className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
/>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              aria-label="Filter transactions by type"
            >
              <option>All</option>
              <option>Income</option>
              <option>Expense</option>
            </select>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-3 pr-4 font-medium">Transaction</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="py-3 pl-4 text-right font-medium">Action</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-4 pr-4">
                      <p className="font-semibold">{t.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{t.category}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                      {t.date}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        t.type === 'Income'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}>
                        {t.type}
                      </span>
                    </td>
                    <td className={`whitespace-nowrap px-4 py-4 text-right font-semibold ${
                      t.type === 'Income' ? 'text-emerald-600' : 'text-slate-800'
                    }`}>
                      {t.type === 'Income' ? '+' : '-'}{money(t.amount)}
                    </td>
                    <td className="py-4 pl-4 text-right">
                      <button
                        onClick={() => deleteTransaction(t.id)}
                        className="text-rose-600 hover:text-rose-800"
                        aria-label={`Delete ${t.title}`}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-500">
                      No transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <p className="mt-6 text-center text-xs text-slate-400">
          Personal Finance Tracker · Prototype with sample data
        </p>
      </main>
    </div>
  )
}

export default App
