import { useContext } from 'react'
import { WorkspaceContext } from './workspaceContext'
export const useWorkspace = () => useContext(WorkspaceContext)
export function useWorkspaceStorage() {
  return useWorkspace()?.storage || localStorage
}
export function useWorkspaceSessionStorage() {
  return useWorkspace()?.sessionStorage || sessionStorage
}
