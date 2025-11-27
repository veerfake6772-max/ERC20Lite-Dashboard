import { useState } from 'react'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'
import { emitTxComplete } from '../lib/events'
import { connectWallet, getContract } from '../lib/ethersProvider'

const Transfer = () => {
  const [form, setForm] = useState({ to: '', amount: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleTransfer = async (event) => {
    event.preventDefault()

    if (!ethers.isAddress(form.to)) {
      toast.error('Enter a valid recipient address')
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

      const tx = await contract.transfer(form.to, parsedAmount)
      toast.loading('Submitting transfer...', { id: 'transfer' })
      await tx.wait()
      toast.dismiss('transfer')
      toast.success('Transfer confirmed')
      emitTxComplete()
      setForm({ to: '', amount: '' })
    } catch (error) {
      toast.dismiss('transfer')
      const message = error?.error?.reason || error?.shortMessage || error?.message
      if (message?.toLowerCase().includes('insufficient')) {
        toast.error('Insufficient balance')
      } else if (message?.toLowerCase().includes('user rejected')) {
        toast.error('Transaction rejected')
      } else {
        toast.error(message || 'Transfer failed')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-3xl p-8 shadow-xl shadow-black/30">
      <h2 className="text-3xl font-semibold mb-6">Transfer Tokens</h2>
      <form className="space-y-6" onSubmit={handleTransfer}>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Recipient Address</label>
          <input
            name="to"
            value={form.to}
            onChange={onChange}
            placeholder="0x..."
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
          <p className="text-xs text-slate-400 mt-2">Amount will be converted using token decimals automatically.</p>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-3 font-semibold transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {isSubmitting && <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {isSubmitting ? 'Processing...' : 'Send Tokens'}
        </button>
      </form>
    </section>
  )
}

export default Transfer

