import { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

export function useSubscribe() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [subscribed, setSubscribed] = useState(false)

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    try {
      const res = await axios.post('/api/subscribe', { email })
      setSubscribed(true)
      toast.success(res.data.message || 'You\'re in! 🔥')
      setEmail('')
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.error || 'Something went wrong')
      } else {
        toast.error('Something went wrong')
      }
    } finally {
      setLoading(false)
    }
  }

  return { email, setEmail, loading, subscribed, subscribe }
}
