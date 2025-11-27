import { useCallback, useEffect, useState } from 'react'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'
import { connectWallet, getConnectedAccounts, getReadOnlyContract } from '../lib/ethersProvider'
import { subscribeToTxComplete } from '../lib/events'
import { ABI, CONTRACT_ADDRESS } from '../constants/contract'

const StatCard = ({ label, value, subtext }) => (
  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg shadow-black/30">
    <p className="text-sm uppercase tracking-widest text-slate-300">{label}</p>
    <p className="text-2xl font-semibold text-white mt-2 break-words">{value ?? '--'}</p>
    {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
  </div>
)

const Home = () => {
  const [tokenData, setTokenData] = useState({
    name: '',
    symbol: '',
    decimals: 18,
    totalSupply: '0',
    cap: '0',
    owner: '',
  })
  const [connectedAccount, setConnectedAccount] = useState(null)
  const [balance, setBalance] = useState(null)
  const [isBalanceLoading, setIsBalanceLoading] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  const loadTokenMetadata = useCallback(async () => {
    try {
      const contract = getReadOnlyContract()
      const [name, symbol, decimals, totalSupply, cap, owner] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.totalSupply(),
        contract.cap(),
        contract.owner(),
      ])
      setTokenData({
        name,
        symbol,
        decimals: Number(decimals),
        totalSupply: ethers.formatUnits(totalSupply, decimals),
        cap: ethers.formatUnits(cap, decimals),
        owner,
      })
    } catch (error) {
      console.error(error)
      toast.error('Unable to load token data')
    }
  }, [])

  const refreshBalance = useCallback(async (address) => {
    if (!address || !window.ethereum) {
      setBalance(null)
      return
    }
    try {
      setIsBalanceLoading(true)
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer)
      const rawBal = await contract.balanceOf(address)
      const tokenDecimals = await contract.decimals()
      const formatted = Number(rawBal) / 10 ** Number(tokenDecimals)
      setBalance(formatted)
    } catch (error) {
      console.error('refreshBalance error:', error)
      setBalance('Error')
    } finally {
      setIsBalanceLoading(false)
    }
  }, [])

  useEffect(() => {
    const bootstrap = async () => {
      await loadTokenMetadata()
      const accounts = await getConnectedAccounts()
      if (accounts?.length) {
        setConnectedAccount(accounts[0])
        await refreshBalance(accounts[0])
      }
    }
    bootstrap()
  }, [loadTokenMetadata, refreshBalance])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = async (event) => {
      const acc = event?.detail?.account || null
      setConnectedAccount(acc)
      if (acc) {
        await refreshBalance(acc)
      } else {
        setBalance(null)
      }
    }
    window.addEventListener('walletChanged', handler)
    return () => {
      window.removeEventListener('walletChanged', handler)
    }
  }, [refreshBalance])

  useEffect(() => {
    const unsubscribe = subscribeToTxComplete(() => {
      loadTokenMetadata()
      if (connectedAccount) {
        refreshBalance(connectedAccount)
      }
    })
    return unsubscribe
  }, [connectedAccount, loadTokenMetadata, refreshBalance])

  const handleConnect = async () => {
    try {
      setIsConnecting(true)
      const { account: connected } = await connectWallet()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('walletChanged', { detail: { account: connected } }))
      }
      toast.success('Wallet connected')
    } catch (error) {
      toast.error(error?.message ?? 'Failed to connect wallet')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleSwitchWallet = async () => {
    try {
      if (!window.ethereum) throw new Error("MetaMask not detected");
  
      // 1️⃣ Force MetaMask to allow selecting a NEW account
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }]
      });
  
      // 2️⃣ Now request accounts (MetaMask will show popup AGAIN)
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts"
      });
  
      // 3️⃣ Build fresh provider + signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
  
      // 4️⃣ Get the REAL selected wallet address
      const activeAddress = await signer.getAddress();
  
      // 5️⃣ Broadcast change to the app (Home listens to this)
      window.dispatchEvent(
        new CustomEvent("walletChanged", { detail: { account: activeAddress } })
      );
  
      toast.success("Wallet switched");
    } catch (error) {
      console.error("Switch Wallet error:", error);
      toast.error(error?.message ?? "Unable to switch wallet");
    }
  };
  

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm text-slate-300 uppercase tracking-[0.3em]">Hardhat Localhost · Chain 31337</p>
          <h2 className="text-4xl font-bold mt-2">
            {tokenData.name || 'ERC20 Token'} <span className="text-primary">({tokenData.symbol || '--'})</span>
          </h2>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleConnect}
            disabled={!!connectedAccount || isConnecting}
            className={`px-6 py-3 rounded-full font-semibold transition-all ${
              connectedAccount ? 'bg-primary hover:bg-indigo-500 cursor-default text-white' : 'bg-primary hover:bg-indigo-500 text-white'
            }`}
          >
            {connectedAccount ? 'Wallet Connected' : isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
          {connectedAccount && (
            <button
              type="button"
              onClick={handleSwitchWallet}
              className="px-6 py-3 rounded-full font-semibold transition-all bg-primary hover:bg-indigo-500 text-white"
            >
              Switch Wallet
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Token Name" value={tokenData.name || '—'} subtext="ERC20Lite" />
        <StatCard label="Symbol" value={tokenData.symbol || '—'} />
        <StatCard label="Decimals" value={tokenData.decimals} />
        <StatCard label="Total Supply" value={`${tokenData.totalSupply} ${tokenData.symbol}`} />
        <StatCard label="Cap" value={`${tokenData.cap} ${tokenData.symbol}`} />
        <StatCard label="Owner" value={tokenData.owner} subtext="Contract owner address" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <StatCard
          label="Connected Wallet"
          value={connectedAccount || 'Not connected'}
          subtext="MetaMask account"
        />
        <StatCard
          label="Wallet Balance"
          value={
            connectedAccount
              ? isBalanceLoading
                ? 'Loading…'
                : balance !== null
                  ? `${balance} ${tokenData.symbol}`
                  : '—'
              : 'Connect to view balance'
          }
        />
      </div>
      
    </div>
  )
}

export default Home

