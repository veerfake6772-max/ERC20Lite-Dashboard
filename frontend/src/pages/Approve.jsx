import { useState } from 'react'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'
import { emitTxComplete } from '../lib/events'
import { connectWallet, getContract, getReadOnlyContract } from '../lib/ethersProvider'

const Approve = () => {
  const [approveForm, setApproveForm] = useState({ spender: '', amount: '' })
  const [allowanceForm, setAllowanceForm] = useState({ owner: '', spender: '' })
  const [allowanceResult, setAllowanceResult] = useState(null)
  const [isApproving, setIsApproving] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  const handleApproveChange = (event) => {
    const { name, value } = event.target
    setApproveForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleAllowanceChange = (event) => {
    const { name, value } = event.target
    setAllowanceForm((prev) => ({ ...prev, [name]: value }))
  }

  const approveSpender = async (event) => {
    event.preventDefault()
    if (!ethers.isAddress(approveForm.spender)) {
      toast.error('Spender must be a valid address')
      return
    }
    if (!approveForm.amount || Number(approveForm.amount) <= 0) {
      toast.error('Amount must be greater than zero')
      return
    }

    try {
      setIsApproving(true)
      await connectWallet()
      const contract = await getContract()
      const decimals = await contract.decimals()
      const parsedAmount = ethers.parseUnits(approveForm.amount, decimals)

      const tx = await contract.approve(approveForm.spender, parsedAmount)
      toast.loading('Approving spender…', { id: 'approve' })
      await tx.wait()
      toast.dismiss('approve')
      toast.success('Approval successful')
      emitTxComplete()
      setApproveForm({ spender: '', amount: '' })
    } catch (error) {
      toast.dismiss('approve')
      const message = error?.shortMessage || error?.message
      if (message?.toLowerCase().includes('user rejected')) {
        toast.error('Transaction rejected')
      } else {
        toast.error(message || 'Approval failed')
      }
    } finally {
      setIsApproving(false)
    }
  }

  const checkAllowance = async (event) => {
    event.preventDefault()
    if (!ethers.isAddress(allowanceForm.owner) || !ethers.isAddress(allowanceForm.spender)) {
      toast.error('Provide valid owner and spender addresses')
      return
    }
    try {
      setIsChecking(true)
      const contract = getReadOnlyContract()
      const [allowance, decimals] = await Promise.all([
        contract.allowance(allowanceForm.owner, allowanceForm.spender),
        contract.decimals(),
      ])
      setAllowanceResult(`${ethers.formatUnits(allowance, decimals)}`)
    } catch (error) {
      console.error(error)
      toast.error('Unable to fetch allowance')
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <section className="bg-white/5 border border-white/10 rounded-3xl p-8 shadow-xl shadow-black/30">
        <h2 className="text-2xl font-semibold mb-6">Approve Spender</h2>
        <form className="space-y-6" onSubmit={approveSpender}>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Spender Address</label>
            <input
              name="spender"
              value={approveForm.spender}
              onChange={handleApproveChange}
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
              value={approveForm.amount}
              onChange={handleApproveChange}
              placeholder="Enter amount"
              className="w-full rounded-2xl bg-white/10 border border-white/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-slate-400 mt-2">
              Amount converted to the correct on-chain units automatically.
            </p>
          </div>
          <button
            type="submit"
            disabled={isApproving}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-3 font-semibold transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {isApproving && <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {isApproving ? 'Approving…' : 'Approve'}
          </button>
        </form>
      </section>

      <section className="bg-white/5 border border-white/10 rounded-3xl p-8 shadow-xl shadow-black/30">
        <h2 className="text-2xl font-semibold mb-6">Check Allowance</h2>
        <form className="space-y-6" onSubmit={checkAllowance}>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Owner Address</label>
            <input
              name="owner"
              value={allowanceForm.owner}
              onChange={handleAllowanceChange}
              placeholder="0x..."
              className="w-full rounded-2xl bg-white/10 border border-white/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Spender Address</label>
            <input
              name="spender"
              value={allowanceForm.spender}
              onChange={handleAllowanceChange}
              placeholder="0x..."
              className="w-full rounded-2xl bg-white/10 border border-white/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            disabled={isChecking}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white/10 border border-white/20 py-3 font-semibold transition hover:bg-white/20 disabled:opacity-50"
          >
            {isChecking && <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {isChecking ? 'Checking…' : 'Check Allowance'}
          </button>
        </form>
        {allowanceResult !== null && (
          <p className="mt-6 text-sm text-slate-200">
            Allowance: <span className="font-semibold">{allowanceResult}</span> tokens
          </p>
        )}
      </section>
    </div>
  )
}

export default Approve

