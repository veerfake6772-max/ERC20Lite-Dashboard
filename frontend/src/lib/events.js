export const TX_COMPLETE_EVENT = 'erc20-lite:tx-complete'
export const ACCOUNTS_CHANGED_EVENT = 'erc20-lite:accounts-changed'

export const emitTxComplete = () => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(TX_COMPLETE_EVENT))
}

export const subscribeToTxComplete = (handler) => {
  if (typeof window === 'undefined' || typeof handler !== 'function') {
    return () => {}
  }
  window.addEventListener(TX_COMPLETE_EVENT, handler)
  return () => window.removeEventListener(TX_COMPLETE_EVENT, handler)
}

export const emitAccountsChanged = (account) => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(ACCOUNTS_CHANGED_EVENT, { detail: account }))
}

export const subscribeToAccounts = (handler) => {
  if (typeof window === 'undefined' || typeof handler !== 'function') {
    return () => {}
  }
  const listener = (event) => handler(event.detail ?? null)
  window.addEventListener(ACCOUNTS_CHANGED_EVENT, listener)
  return () => window.removeEventListener(ACCOUNTS_CHANGED_EVENT, listener)
}

