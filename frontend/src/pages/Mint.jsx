import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'
import { emitTxComplete } from '../lib/events'
import { connectWallet, getConnectedAccount, getContract, getReadOnlyContract } from '../lib/ethersProvider'

const Mint = () => {
  const [owner, setOwner] = useState('')
  const [form, setForm] = useState({ recipient: '', amount: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchOwner = async () => {
      try {
        const contract = getReadOnlyContract()
        const ownerAddress = await contract.owner()
        setOwner(ownerAddress)
      } catch (error) {
        console.error(error)
      }
    }
    fetchOwner()
  }, [])

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleMint = async (event) => {
    event.preventDefault()
    if (!ethers.isAddress(form.recipient)) {
      toast.error('Recipient must be a valid address')
      return
    }
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error('Amount must be greater than zero')
      return
    }

    try {
      setIsSubmitting(true)
      if (!owner) {
        toast.error('Owner address not loaded yet')
        return
      }
      let currentAccount = await getConnectedAccount()
      if (!currentAccount) {
        const { account } = await connectWallet()
        currentAccount = account
      }

      if (currentAccount?.toLowerCase() !== owner.toLowerCase()) {
        toast.error('Not owner')
        return
      }

      const contract = await getContract()
      const decimals = await contract.decimals()
      const parsedAmount = ethers.parseUnits(form.amount, decimals)

      const tx = await contract.mint(form.recipient, parsedAmount)
      toast.loading('Minting in progress...', { id: 'mint' })
      await tx.wait()
      toast.dismiss('mint')
      toast.success('Mint successful')
      emitTxComplete()
      setForm({ recipient: '', amount: '' })
    } catch (error) {
      toast.dismiss('mint')
      const message = error?.shortMessage || error?.message
      if (message?.toLowerCase().includes('not owner')) {
        toast.error('Not owner')
      } else if (message?.toLowerCase().includes('user rejected')) {
        toast.error('Transaction rejected')
      } else {
        toast.error(message || 'Mint failed')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-3xl p-8 shadow-xl shadow-black/30">
      <div className="mb-6">
        <h2 className="text-3xl font-semibold">Mint Tokens</h2>
        <p className="text-sm text-slate-300 mt-2">Only the owner can mint. Owner: {owner || 'Loading...'}</p>
      </div>
      <form className="space-y-6" onSubmit={handleMint}>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Recipient</label>
          <input
            name="recipient"
            value={form.recipient}
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
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-3 font-semibold transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {isSubmitting && <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {isSubmitting ? 'Minting…' : 'Mint Tokens'}
        </button>
      </form>
    </section>
  )
}

export default Mint

