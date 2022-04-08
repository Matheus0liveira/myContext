import {
  ReactNode,
  createContext,
  useRef,
  useCallback,
  useContext,
  useState,
  useEffect,
  useMemo
} from 'react'

import { isEqual } from 'lodash'
import { v4 as uuidV4 } from 'uuid'

type FormProviderProps = {
  children: ReactNode
}

type Store = {
  value: string
}

type FormContextValues = {
  setStore: ({ value }: { value: string }) => void
  getStore: () => { value: string }
  registerListener: (listenerId: string, fn: (store: Store) => void) => void
  unregisterListener: (listenerId: string) => void
}

export const MyContext = createContext({} as FormContextValues)

export const FormProvider = ({ children }: FormProviderProps) => {
  const listeners = useRef<Record<string, (s: Store) => void>>({})
  const store = useRef({ value: 'value' })

  const setStore = useCallback(({ value }: { value: string }) => {
    store.current.value = value

    console.log({ listeners })

    Object.values(listeners.current).forEach((listener) => {
      listener(store.current)
    })
  }, [])

  const getStore = useCallback(() => store.current, [])

  const registerListener = useCallback(
    (listenerId: string, fn) => (listeners.current[listenerId] = fn),
    []
  )
  const unregisterListener = useCallback(
    (listenerId: string) => delete listeners.current[listenerId],
    []
  )

  return (
    <MyContext.Provider
      value={{ setStore, getStore, registerListener, unregisterListener }}
    >
      {children}
    </MyContext.Provider>
  )
}

export const useStoreForm = (): FormContextValues => {
  return useContext(MyContext)
}

type Getter = (store: Partial<Store>) => unknown

export const useSelector = (getter: Getter) => {
  const { getStore, registerListener, unregisterListener } = useStoreForm()
  const store = getStore()
  const [state, setState] = useState(getter(store))

  const listenerId = useMemo(() => uuidV4(), [])

  console.log({ listenerId })

  const listener = useCallback(
    (newStore) => {
      const newValue = getter(newStore)
      const hasChanged = !isEqual(state, newValue)

      if (hasChanged) setState(newValue)
    },
    [getter, state]
  )

  useEffect(() => {
    registerListener(listenerId, listener)

    return () => unregisterListener(listenerId)
  }, [registerListener, listenerId, listener, unregisterListener])

  return state
}
