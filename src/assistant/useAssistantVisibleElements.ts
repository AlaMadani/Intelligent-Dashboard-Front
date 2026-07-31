// ---- Imports ----
import { computed, type ComputedRef } from 'vue'
import { useRoute } from 'vue-router'
import manifest from './dashboardAssistantManifest'
import type { AssistantVisibleElement } from 'src/types/dashboardAssistant'

// ---- Route ID Resolution ----
function resolveRouteId(route: ReturnType<typeof useRoute>): string {
  const name = route.name
  if (!name || typeof name !== 'string') return ''

  for (const r of manifest.routes) {
    if (r.routeName === name || r.id === name) {
      return r.id
    }
  }

  for (const r of manifest.routes) {
    if (r.path && route.path.startsWith(r.path)) {
      return r.id
    }
  }

  if (name.includes('security-overview') || route.path.startsWith('/security-overview')) return 'security-overview'
  if (name.includes('alert-investigation') || route.path.startsWith('/alerts/')) return 'alert-investigation'
  if (name.includes('alerts') || route.path.startsWith('/alerts')) return 'alerts'
  if (name.includes('user-360') || route.path.includes('/360') || route.path.startsWith('/users/')) return 'user-360'
  if (name.includes('user360') || route.path.startsWith('/users') || name.includes('User360')) return 'user360'
  if (name.includes('churn') || route.path.startsWith('/churn')) return 'churn'
  if (name.includes('forecast') || route.path.startsWith('/forecast')) return 'forecast'
  if (name.includes('runtime') || route.path.startsWith('/runtime')) return 'runtime-health'
  if (name.includes('account') || route.path.startsWith('/account')) return 'account'

  return ''
}

// ---- Visibility Check ----
function isElementVisible(el: Element): boolean {
  const rect = el.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight
  const visibleWidth = Math.min(rect.right, vw) - Math.max(rect.left, 0)
  const visibleHeight = Math.min(rect.bottom, vh) - Math.max(rect.top, 0)
  if (visibleWidth <= 0 || visibleHeight <= 0) return false
  const visibleArea = visibleWidth * visibleHeight
  const totalArea = rect.width * rect.height
  if (totalArea <= 0) return false
  return (visibleArea / totalArea) > 0.05
}

// ---- DOM Elements Collection ----
function collectDomAssistantElements(currentRouteId: string): AssistantVisibleElement[] {
  const results: AssistantVisibleElement[] = []
  const seen = new Set<string>()

  const nodes = document.querySelectorAll<HTMLElement>('[data-assistant-id]')
  for (const el of nodes) {
    const id = el.getAttribute('data-assistant-id')
    if (!id || seen.has(id)) continue
    seen.add(id)

    const type = el.getAttribute('data-assistant-type') || el.tagName.toLowerCase()
    const label = el.getAttribute('data-assistant-label') || id
    const description = el.getAttribute('data-assistant-description') || ''
    const actionsRaw = el.getAttribute('data-assistant-actions') || 'HIGHLIGHT_ELEMENT'
    const actions = actionsRaw.split(',').map(a => a.trim()).filter(Boolean)
    const ariaLabel = el.getAttribute('aria-label') || undefined
    const title = el.getAttribute('title') || undefined
    const disabled = el.hasAttribute('disabled') || el.classList.contains('disabled') || undefined
    const textContent = el.textContent?.trim().slice(0, 200) || undefined
    const visible = isElementVisible(el)
    const rect = el.getBoundingClientRect()
    const bounds = { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) }

    const entry: AssistantVisibleElement = { id, type, label, description, routeId: currentRouteId, visible, actions }
    if (textContent) entry.textContent = textContent
    if (ariaLabel) entry.ariaLabel = ariaLabel
    if (title) entry.title = title
    if (disabled) entry.disabled = disabled
    entry.bounds = bounds

    results.push(entry)
  }

  return results
}

// ---- Manifest Elements Collection ----
function collectManifestElements(currentRouteId: string): Map<string, AssistantVisibleElement> {
  const map = new Map<string, AssistantVisibleElement>()

  if (!manifest?.routes || !manifest?.elements) return map

  const routeElements = manifest.elements.filter(el => !el.routeId || el.routeId === currentRouteId)

  for (const el of routeElements) {
    const domEl = document.getElementById(el.id)
    const visible = domEl !== null && isElementVisible(domEl)
    const textContent = domEl ? domEl.textContent?.trim().slice(0, 200) : undefined
    const ariaLabel = domEl?.getAttribute('aria-label') || undefined
    const title = domEl?.getAttribute('title') || undefined
    const disabled = domEl?.hasAttribute('disabled') || domEl?.classList.contains('disabled') || undefined
    let bounds: { x: number; y: number; width: number; height: number } | undefined
    if (domEl) {
      const rect = domEl.getBoundingClientRect()
      bounds = { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) }
    }

    map.set(el.id, {
      id: el.id,
      type: el.type,
      label: el.label,
      description: el.description,
      routeId: currentRouteId,
      visible,
      actions: el.actionsSupported ?? ['HIGHLIGHT_ELEMENT'],
      ...(textContent !== undefined ? { textContent } : {}),
      ...(ariaLabel !== undefined ? { ariaLabel } : {}),
      ...(title !== undefined ? { title } : {}),
      ...(disabled !== undefined ? { disabled } : {}),
      ...(bounds !== undefined ? { bounds } : {}),
    })
  }

  return map
}

// ---- Composable ----
export function useAssistantVisibleElements(): ComputedRef<AssistantVisibleElement[]> {
  const route = useRoute()

  return computed(() => {
    const currentRouteId = resolveRouteId(route)

    const manifestMap = collectManifestElements(currentRouteId)
    const domElements = collectDomAssistantElements(currentRouteId)

    const merged = new Map<string, AssistantVisibleElement>()

    for (const el of domElements) {
      merged.set(el.id, el)
    }

    for (const [id, el] of manifestMap) {
      if (merged.has(id)) {
        const existing = merged.get(id)!
        merged.set(id, {
          ...existing,
          actions: el.actions.length > existing.actions.length ? el.actions : existing.actions,
        })
      } else {
        merged.set(id, el)
      }
    }

    return Array.from(merged.values())
  })
}
