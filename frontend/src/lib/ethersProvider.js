import { ethers } from 'ethers'
import { ABI, CONTRACT_ADDRESS } from '../constants/contract'

const TARGET_CHAIN_ID = 31337
const TARGET_CHAIN_HEX = `0x${TARGET_CHAIN_ID.toString(16)}`
const LOCAL_RPC_URL = 'http://127.0.0.1:8545'

let browserProvider
let signer
let contract

const publicProvider = new ethers.JsonRpcProvider(LOCAL_RPC_URL)

const resetCachedInstances = () => {
  browserProvider = undefined
  signer = undefined
  contract = undefined
}

const emitWalletChanged = (account, error) => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('walletChanged', { detail: { account, error } }))
}

const attachEventHandlers = (eth) => {
  if (!eth || eth.__erc20LiteHandlersAttached) return
  eth.__erc20LiteHandlersAttached = true

  eth.on('accountsChanged', (accounts) => {
    resetCachedInstances()
    emitWalletChanged(accounts?.[0] ?? null)
  })

  eth.on('chainChanged', async (chainId) => {
    if (parseInt(chainId, 16) !== TARGET_CHAIN_ID) {
      await ensureCorrectNetwork(eth)
    }
    resetCachedInstances()
    window.location.reload()
  })
}

const ensureCorrectNetwork = async (eth) => {
  if (!eth) throw new Error('MetaMask is required')
  const currentChain = await eth.request({ method: 'eth_chainId' })
  if (parseInt(currentChain, 16) === TARGET_CHAIN_ID) return

  try {
    await eth.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: TARGET_CHAIN_HEX }],
    })
  } catch (switchError) {
    if (switchError.code === 4902) {
      await eth.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: TARGET_CHAIN_HEX,
            rpcUrls: [LOCAL_RPC_URL],
            chainName: 'Hardhat Localhost',
            nativeCurrency: { name: 'Hardhat ETH', symbol: 'ETH', decimals: 18 },
          },
        ],
      })
    } else {
      throw switchError
    }
  }
}

export const connectWallet = async () => {
  if (!window.ethereum) throw new Error('MetaMask not detected')
  const eth = window.ethereum

  await ensureCorrectNetwork(eth)
  const accounts = await eth.request({ method: 'eth_requestAccounts' })
  if (!accounts?.length) throw new Error('Account access rejected')

  browserProvider = new ethers.BrowserProvider(eth)
  signer = await browserProvider.getSigner()
  contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer)

  attachEventHandlers(eth)
  emitWalletChanged(accounts[0])

  return { account: accounts[0], contract }
}

export const getProvider = async () => {
  if (browserProvider) return browserProvider
  if (!window.ethereum) throw new Error('MetaMask not detected')
  browserProvider = new ethers.BrowserProvider(window.ethereum)
  return browserProvider
}

export const getContract = async () => {
  if (!window.ethereum) throw new Error('No ethereum provider')
  const provider = new ethers.BrowserProvider(window.ethereum)
  const activeSigner = await provider.getSigner()
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, activeSigner)
}

export const getReadOnlyContract = () => {
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, publicProvider)
}

export const getConnectedAccount = async () => {
  if (signer) return signer.getAddress()
  if (!window.ethereum) return null
  const accounts = await window.ethereum.request({ method: 'eth_accounts' })
  return accounts?.[0] ?? null
}

export const requestWallet = async () => {
  if (!window.ethereum) throw new Error('No ethereum provider')
  await ensureCorrectNetwork(window.ethereum)
  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts',
  })
  return accounts && accounts.length ? accounts[0] : null
}

export const getConnectedAccounts = async () => {
  if (!window.ethereum) return []
  const accounts = await window.ethereum.request({ method: 'eth_accounts' })
  return accounts ?? []
}

