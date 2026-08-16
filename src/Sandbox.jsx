import {useState} from 'react'
import CategorySelect from './components/CategorySelect'
import { useCategories } from './hooks/useCategories'
import './App.css'
import './styles/categories.css'


export default function Sandbox() {
    const { categories } = useCategories()
    const {value, setValue} = useState()

  return (
    <div style={{ padding: 40, maxWidth: 420 }}>
      <h2>CategorySelect</h2>

      <CategorySelect
        options={categories.expense}
        value={value}
        onChange={setValue}
      />

      <pre style={{ marginTop: 24, fontSize: 13, opacity: 0.7 }}>
        value: {JSON.stringify(value)}
      </pre>

      <h3 style={{ marginTop: 40 }}>Unknown value (fallback)</h3>
      <CategorySelect
        options={categories.expense}
        value="Deleted Category"
        onChange={() => {}}
      />
    </div>
  )

}