import { useState } from 'react'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'
import { emitTxComplete } from '../lib/events'
import { connectWallet, getContract } from '../lib/ethersProvider'

const TransferFrom = () => {
  const [form, setForm] = useState({ from: '', to: '', amount: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleTransferFrom = async (event) => {
    event.preventDefault()

    if (!ethers.isAddress(form.from) || !ethers.isAddress(form.to)) {
      toast.error('From and To must be valid addresses')
      return
    }
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error('Amount must be greater than zero')
      return
    }

    try {
      setIsSubmitting(true)
      await connectWallet()
      const contract = await getContract()
      const decimals = await contract.decimals()
      const parsedAmount = ethers.parseUnits(form.amount, decimals)

      const tx = await contract.transferFrom(form.from, form.to, parsedAmount)
      toast.loading('Executing transferFrom…', { id: 'transferfrom' })
      await tx.wait()
      toast.dismiss('transferfrom')
      toast.success('transferFrom confirmed')
      emitTxComplete()
      setForm({ from: '', to: '', amount: '' })
    } catch (error) {
      toast.dismiss('transferfrom')
      const message = error?.error?.reason || error?.shortMessage || error?.message
      if (message?.toLowerCase().includes('allowance')) {
        toast.error('Allowance too low')
      } else if (message?.toLowerCase().includes('user rejected')) {
        toast.error('Transaction rejected')
      } else {
        toast.error(message || 'transferFrom failed')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-3xl p-8 shadow-xl shadow-black/30">
      <h2 className="text-3xl font-semibold mb-6">Transfer From</h2>
      <form className="space-y-6" onSubmit={handleTransferFrom}>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">From</label>
          <input
            name="from"
            value={form.from}
            onChange={onChange}
            placeholder="Spender approved address"
            className="w-full rounded-2xl bg-white/10 border border-white/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">To</label>
          <input
            name="to"
            value={form.to}
            onChange={onChange}
            placeholder="Recipient"
            className="w-full rounded-2xl bg-white/10 border border-white/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Amount</label>
          <input
            name="amount"
            type="number"
            min="0"
            step="0.0001"
            value={form.amount}
            onChange={onChange}
            placeholder="Enter amount"
            className="w-full rounded-2xl bg-white/10 border border-white/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-3 font-semibold transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {isSubmitting && <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {isSubmitting ? 'Processing…' : 'Execute transferFrom'}
        </button>
      </form>
    </section>
  )
}

export default TransferFrom

