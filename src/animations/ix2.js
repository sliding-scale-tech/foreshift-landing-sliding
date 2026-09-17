// Minimal re-implementation of Webflow's IX2 runtime (webflow.js modules IX2VanillaEngine,
// IX2VanillaEvents, IX2VanillaUtils, ixInstances/ixElements reducers) for the event types the
// ported pages use: SCROLL_INTO_VIEW, SCROLLING_IN_VIEW, MOUSE_OUT, MOUSE_MOVE with
// TRANSFORM_MOVE / TRANSFORM_SCALE / TRANSFORM_ROTATE / STYLE_OPACITY actions.
// Semantics (target resolution incl. page-id check, initial states, group chaining via the
// "carrier" item, loops, quick-effect delays, continuous smoothing, keyframe interpolation,
// will-change bookkeeping, media-query restarts) follow the original line by line.
import { ACTION_LISTS, EVENTS as EXPORT_EVENTS, MEDIA_QUERIES } from './data/ix2Data.js'
import { applyEasing, bezier, optimizeFloat } from './easings.js'

// Mobile hero override (user-approved deviation from the export, mobile LCP): the Home hero text
// entrance e-233 (a-148: opacity 0 + 15% drop, 1.5s delay, 1s outQuart) runs only at the `main` and
// `medium` breakpoints (>=768px), exactly as exported. At `small`/`tiny` (<=767px) the text is painted
// from the prerendered HTML at first paint with a short CSS entrance instead — see the
// "Mobile hero entrance" block in src/styles/interactions.css.
const EVENTS = { ...EXPORT_EVENTS, 'e-233': { ...EXPORT_EVENTS['e-233'], mediaQueries: ['main', 'medium'] } }

const MOVE = 'TRANSFORM_MOVE'
const SCALE = 'TRANSFORM_SCALE'
const ROTATE = 'TRANSFORM_ROTATE'
const SKEW = 'TRANSFORM_SKEW'
const OPACITY = 'STYLE_OPACITY'
const SCROLL_INTO_VIEW = 'SCROLL_INTO_VIEW'
const SCROLLING_IN_VIEW = 'SCROLLING_IN_VIEW'
const MOUSE_OUT = 'MOUSE_OUT'
const MOUSE_MOVE = 'MOUSE_MOVE'
const CONTINUOUS = 'GENERAL_CONTINUOUS_ACTION'
const START = 'GENERAL_START_ACTION'
const QUICK = new Set(['FADE_EFFECT', 'SLIDE_EFFECT', 'GROW_EFFECT', 'SHRINK_EFFECT', 'SPIN_EFFECT', 'FLY_EFFECT', 'POP_EFFECT', 'FLIP_EFFECT', 'JIGGLE_EFFECT', 'PULSE_EFFECT', 'DROP_EFFECT', 'BLINK_EFFECT', 'BOUNCE_EFFECT', 'FLIP_LEFT_TO_RIGHT_EFFECT', 'FLIP_RIGHT_TO_LEFT_EFFECT', 'RUBBER_BAND_EFFECT', 'JELLO_EFFECT', 'GROW_BIG_EFFECT', 'SHRINK_BIG_EFFECT'])
const TRANSFORM_DEFAULTS = {
  [MOVE]: { xValue: 0, yValue: 0, zValue: 0 },
  [SCALE]: { xValue: 1, yValue: 1, zValue: 1 },
  [ROTATE]: { xValue: 0, yValue: 0, zValue: 0 },
  [SKEW]: { xValue: 0, yValue: 0 },
}
const TRANSFORM_TYPES = [MOVE, SCALE, ROTATE, SKEW]
const UNIT_PAIRS = [['xValue', 'xUnit'], ['yValue', 'yUnit'], ['zValue', 'zUnit'], ['value', 'unit']]
const TYPE_ORDER = [SCROLL_INTO_VIEW, SCROLLING_IN_VIEW, MOUSE_OUT, MOUSE_MOVE]
const MQ_KEYS = MEDIA_QUERIES.map((m) => m.key)
const isTransform = (t) => t.startsWith('TRANSFORM_')

// lodash.throttle(fn, wait) — leading + trailing, maxWait = wait.
function throttle(fn, wait) {
  let last = 0
  let timer = null
  let args = null
  const invoke = () => {
    last = Date.now()
    timer = null
    fn(...args)
  }
  const t = (...a) => {
    args = a
    const remaining = wait - (Date.now() - last)
    if (remaining <= 0 || remaining > wait) {
      if (timer) clearTimeout(timer)
      invoke()
    } else if (!timer) timer = setTimeout(invoke, remaining)
  }
  t.cancel = () => timer && clearTimeout(timer)
  return t
}

const shallowEqual = (a, b) => {
  if (Object.is(a, b)) return true
  if (typeof a !== 'object' || !a || typeof b !== 'object' || !b) return false
  const ka = Object.keys(a)
  if (ka.length !== Object.keys(b).length) return false
  return ka.every((k) => Object.hasOwn(b, k) && Object.is(a[k], b[k]))
}

const viewport = () => {
  const d = document.documentElement
  return {
    scrollTop: window.pageYOffset,
    scrollHeight: d.scrollHeight,
    clientWidth: d.clientWidth,
    clientHeight: d.clientHeight,
  }
}

// will-change bookkeeping (IX2VanillaUtils ej / eB)
function addWillChange(el, prop) {
  const cur = el.style.willChange
  if (!cur) return void (el.style.willChange = prop)
  const list = cur.split(',').map((s) => s.trim())
  if (!list.includes(prop)) el.style.willChange = list.concat(prop).join(',')
}
function removeWillChange(el, prop) {
  const cur = el.style.willChange
  if (cur && cur.includes(prop)) el.style.willChange = cur.split(',').map((s) => s.trim()).filter((s) => s !== prop).join(',')
}
const styleProp = (type) => (isTransform(type) ? 'transform' : type === OPACITY ? 'opacity' : null)

/** Remove every inline style IX2 can set for the ported action lists (clearAllStyles). */
function clearAllStyles(ctx) {
  const clearList = (list, event) => {
    const groups = [
      ...(list.actionItemGroups || []),
      ...(list.continuousParameterGroups || []).flatMap((p) => p.continuousActionGroups),
    ]
    for (const g of groups)
      for (const item of g.actionItems) {
        const prop = styleProp(item.actionTypeId)
        if (!prop) continue
        for (const el of ctx.affected({ config: item.config, event })) {
          removeWillChange(el, prop)
          el.style[prop] = ''
          if (prop === 'transform') el.style.transformStyle = ''
        }
      }
  }
  for (const ev of Object.values(EVENTS)) {
    const list = ACTION_LISTS[ev.action.config.actionListId]
    if (list) clearList(list, ev)
  }
  for (const list of Object.values(ACTION_LISTS)) clearList(list)
}

export function createIX2(pageId) {
  const qs = ({ id, selector }) => {
    if (id) {
      let nodeId = id
      if (id.includes('|')) {
        const [page, node] = id.split('|')
        if (page !== pageId) return null
        nodeId = node
      }
      return `[data-w-id="${nodeId}"], [data-w-id^="${nodeId}_instance"]`
    }
    return selector
  }
  const queryAll = (sel) => Array.prototype.slice.call(document.querySelectorAll(sel))

  // IX2VanillaUtils.getAffectedElements (eT)
  function affected({ config, event, eventTarget }) {
    if (Array.isArray(config.targets) && config.targets.length)
      return config.targets.reduce((acc, t) => acc.concat(affected({ config: { target: t }, event, eventTarget })), [])
    const v = config.target
    if (!v) return []
    const A = event && qs(event.target)
    const l = qs(v)
    const S = v.useEventTarget
    if (event && S) {
      const e = eventTarget && (l || S === true) ? [eventTarget] : queryAll(A)
      if (l) {
        if (S === 'PARENT') return queryAll(l).filter((t) => e.some((p) => t.contains(p)))
        if (S === 'CHILDREN') return queryAll(l).filter((t) => e.some((p) => p.contains(t)))
        if (S === 'SIBLINGS') return queryAll(l).filter((t) => e.some((p) => p !== t && p.parentNode === t.parentNode))
      }
      return e
    }
    return l == null ? [] : queryAll(l)
  }

  let S // session
  let nextId = 1
  const newSession = () => ({
    active: false,
    tick: 0,
    listeners: [],
    eventState: {},
    mqKey: null,
    viewportWidth: 0,
    hasDefinedMQ: false,
    instances: new Map(),
    elements: new Map(),
    params: {},
    raf: 0,
    throttles: [],
  })

  const mqAllowed = (mqs) => S.mqKey == null || mqs.includes(S.mqKey)

  function updateViewport() {
    const w = window.innerWidth
    if (w === S.viewportWidth) return
    const prev = S.mqKey
    S.viewportWidth = w
    S.mqKey = (MEDIA_QUERIES.find((m) => w >= m.min && w <= m.max) || {}).key ?? null
    return prev !== S.mqKey
  }

  function refStateOf(el) {
    let s = S.elements.get(el)
    if (!s) S.elements.set(el, (s = {}))
    return s
  }
  function mergeState(el, type, values, item) {
    const ref = refStateOf(el)
    const units = {}
    for (const [vk, uk] of UNIT_PAIRS) if (item.config[vk] != null && item.config[uk] != null) units[uk] = item.config[uk]
    ref[type] = { ...ref[type], ...values, ...units }
  }

  function getOrigin(el, item) {
    const ref = refStateOf(el)
    if (isTransform(item.actionTypeId)) return ref[item.actionTypeId] || TRANSFORM_DEFAULTS[item.actionTypeId]
    if (item.actionTypeId === OPACITY) {
      const v = parseFloat(el.style.opacity)
      return { value: Number.isNaN(v) ? 1 : v }
    }
  }
  function getDestination(item) {
    const { xValue, yValue, zValue, value } = item.config
    return isTransform(item.actionTypeId) ? { xValue, yValue, zValue } : { value }
  }

  // IX2VanillaUtils.renderHTMLElement
  function render(el, item) {
    const type = item.actionTypeId
    const ref = refStateOf(el)
    if (isTransform(type)) {
      const str = TRANSFORM_TYPES.map((t) => {
        const d = TRANSFORM_DEFAULTS[t]
        const { xValue: x = d.xValue, yValue: y = d.yValue, zValue: z = d.zValue, xUnit: xu = '', yUnit: yu = '', zUnit: zu = '' } = ref[t] || {}
        if (t === MOVE) return `translate3d(${x}${xu}, ${y}${yu}, ${z}${zu})`
        if (t === SCALE) return `scale3d(${x}${xu}, ${y}${yu}, ${z}${zu})`
        if (t === ROTATE) return `rotateX(${x}${xu}) rotateY(${y}${yu}) rotateZ(${z}${zu})`
        return `skew(${x}${xu}, ${y}${yu})`
      }).join(' ')
      addWillChange(el, 'transform')
      el.style.transform = str
      const cur = ref[type] || {}
      if (((type === MOVE || type === SCALE) && cur.zValue !== undefined) || (type === ROTATE && (cur.xValue !== undefined || cur.yValue !== undefined)))
        el.style.transformStyle = 'preserve-3d'
    } else if (type === OPACITY) {
      addWillChange(el, 'opacity')
      el.style.opacity = ref[type].value + (item.config.unit || '')
    }
  }

  function addInstance(p) {
    const { el, item } = p
    const origin = getOrigin(el, item)
    const destination = getDestination(item)
    const easing = item.config.easing
    const inst = {
      ...p,
      id: nextId++,
      type: item.actionTypeId,
      origin,
      destination,
      destinationKeys: Object.keys(destination).filter((k) => destination[k] != null && typeof destination[k] !== 'string'),
      active: false,
      complete: false,
      position: 0,
      start: 0,
      current: null,
      customEasingFn: Array.isArray(easing) && easing.length === 4 ? bezier(...easing) : undefined,
    }
    mergeState(el, inst.type, origin, item)
    S.instances.set(inst.id, inst)
    if (p.immediate) {
      inst.active = true
      inst.start = 0
      frame(performance.now(), inst)
      return
    }
    if (!p.continuous) {
      inst.active = true
      inst.start = S.tick
    }
  }

  function removeInstance(inst) {
    const prop = styleProp(inst.type)
    if (prop && inst.el.style.willChange) removeWillChange(inst.el, prop)
    S.instances.delete(inst.id)
  }

  // ixInstances reducer, IX2_ANIMATION_FRAME_CHANGED (T / v)
  function compute(inst, now) {
    if (inst.continuous) return computeContinuous(inst)
    if (!inst.active || !inst.origin) return false
    let { duration, delay } = inst.item.config
    if (inst.instanceDelay != null) delay = inst.instanceDelay
    if (inst.immediate) duration = delay = 0
    const t = now - (inst.start + delay)
    if (t < 0) return false
    const n = optimizeFloat(Math.min(Math.max(0, t / duration), 1))
    const o = applyEasing(inst.item.config.easing, n, inst.customEasingFn)
    const cur = {}
    for (const k of inst.destinationKeys) {
      const r = parseFloat(inst.origin[k]) || 0
      cur[k] = (parseFloat(inst.destination[k]) - r) * o + r
    }
    inst.current = cur
    inst.position = n
    if (n === 1) {
      inst.active = false
      inst.complete = true
    }
    return true
  }

  function computeContinuous(inst) {
    let b = Math.max(1 - inst.smoothing, 0.01)
    let I = S.params[inst.parameterId]
    if (I == null) {
      b = 1
      I = inst.restingValue
    }
    const l = inst.position
    const O = optimizeFloat((Math.max(I, 0) || 0) - l)
    const pos = optimizeFloat(l + O * b)
    const pct = 100 * pos
    if (pos === l && inst.current) return false
    const groups = inst.actionGroups
    let n
    let i
    let r
    let o
    for (let e = 0; e < groups.length; e++) {
      const { keyframe, actionItems } = groups[e]
      if (e === 0) n = actionItems[0]
      if (pct >= keyframe) {
        n = actionItems[0]
        const next = groups[e + 1]
        const s = next && pct !== keyframe
        i = s ? next.actionItems[0] : null
        if (s) {
          r = keyframe / 100
          o = (next.keyframe - keyframe) / 100
        }
      }
    }
    const cur = {}
    if (n && !i) for (const k of inst.destinationKeys) cur[k] = n.config[k]
    else if (n && i && r !== undefined && o !== undefined) {
      const t = applyEasing(n.config.easing, (pos - r) / o, inst.customEasingFn)
      for (const k of inst.destinationKeys) {
        const a = n.config[k]
        cur[k] = (i.config[k] - a) * t + a
      }
    }
    inst.position = pos
    inst.current = cur
    return true
  }

  // IX2VanillaEngine eE
  function onChange(inst) {
    const ev = EVENTS[inst.eventId]
    if (!mqAllowed(ev?.mediaQueries || MQ_KEYS)) return
    if (!(inst.continuous || inst.active || inst.complete)) return
    if (inst.current) {
      mergeState(inst.el, inst.type, inst.current, inst.item)
      render(inst.el, inst.item)
    }
    if (inst.complete) {
      if (inst.isCarrier)
        startGroup({
          eventId: inst.eventId,
          eventTarget: inst.eventTarget,
          eventStateKey: inst.eventStateKey,
          actionListId: inst.actionListId,
          groupIndex: inst.groupIndex + 1,
        })
      removeInstance(inst)
    }
  }

  function frame(now, extra) {
    S.tick = now
    const changed = []
    for (const inst of S.instances.values()) if (inst !== extra && compute(inst, now)) changed.push(inst)
    for (const inst of changed) if (S.instances.has(inst.id)) onChange(inst)
    if (extra) {
      compute(extra, now)
      onChange(extra)
    }
  }

  function loop(now) {
    if (!S.active) return
    frame(now)
    S.raf = requestAnimationFrame(loop)
  }

  // startActionGroup (eg)
  function startGroup({ eventId, eventTarget, eventStateKey, actionListId, groupIndex = 0, immediate }) {
    const ev = EVENTS[eventId] || {}
    const mqs = ev.mediaQueries || MQ_KEYS
    const list = ACTION_LISTS[actionListId] || {}
    const groups = list.actionItemGroups
    if (!groups || !groups.length) return false
    let a = groupIndex
    if (a >= groups.length && ev.config?.loop) a = 0
    if (a === 0 && list.useFirstGroupAsInitialState) a++
    const delay = (a === 0 || (a === 1 && list.useFirstGroupAsInitialState)) && QUICK.has(ev.action?.actionTypeId) ? ev.config.delay : undefined
    const items = groups[a]?.actionItems || []
    if (!items.length || !mqAllowed(mqs)) return false
    let carrier = 0
    let max = 0
    items.forEach((it, idx) => {
      const d = it.config.delay + it.config.duration
      if (d >= max) {
        max = d
        carrier = idx
      }
    })
    let started = false
    items.forEach((item, c) => {
      if (!item.config.target) return
      affected({ config: item.config, event: ev, eventTarget }).forEach((el, f) => {
        started = true
        addInstance({ el, item, eventId, eventTarget, eventStateKey, actionListId, groupIndex: a, isCarrier: carrier === c && f === 0, immediate, instanceDelay: delay })
      })
    })
    return started
  }

  function stopGroup({ eventId, eventStateKey, actionListId }) {
    for (const inst of [...S.instances.values()])
      if (inst.actionListId === actionListId && inst.eventId === eventId && (!eventStateKey || inst.eventStateKey === eventStateKey)) removeInstance(inst)
  }

  // $ — run the event's action list
  function fire({ event, eventId, element, eventStateKey }) {
    const actionListId = event.action.config.actionListId
    stopGroup({ eventId, eventStateKey, actionListId })
    startGroup({ eventId, eventTarget: element, eventStateKey, actionListId })
  }

  // ed — useFirstGroupAsInitialState
  function initialState(actionListId, eventId) {
    const ev = EVENTS[eventId]
    const list = ACTION_LISTS[actionListId]
    if (!list || !list.useFirstGroupAsInitialState) return
    const items = list.actionItemGroups?.[0]?.actionItems || []
    if (!mqAllowed(ev.mediaQueries || MQ_KEYS)) return
    for (const item of items) {
      const t = item.config?.target
      const config = t?.useEventTarget === true && t?.objectId == null ? { target: ev.target, targets: ev.targets } : item.config
      affected({ config, event: ev }).forEach((el) => addInstance({ el, item, eventId, actionListId, immediate: true }))
    }
  }

  function createContinuous({ eventId, eventStateKey, element, eventConfig, actionListId, group }) {
    const ev = EVENTS[eventId]
    const smoothing = (eventConfig.smoothing || 0) / 100
    const restingValue = (eventConfig.restingState || 0) / 100
    let parameterId = group.id
    const basedOn = eventConfig.basedOn
    if ((ev.eventTypeId === SCROLLING_IN_VIEW && (basedOn === 'ELEMENT' || basedOn == null)) || (ev.eventTypeId === MOUSE_MOVE && basedOn === 'ELEMENT'))
      parameterId = `${eventStateKey}:${parameterId}`
    const byKey = {}
    const seen = {}
    const targets = []
    for (const { keyframe, actionItems } of group.continuousActionGroups)
      for (const item of actionItems) {
        const target = item.config.target
        if (!target) continue
        const key = `${target.id || ''}|${target.selector || ''}|${target.useEventTarget || ''}:${item.actionTypeId}`
        const list = (byKey[key] = byKey[key] || [])
        let entry = list.find((g) => g.keyframe === keyframe)
        if (!entry) list.push((entry = { keyframe, actionItems: [] }))
        entry.actionItems.push(item)
        if (!seen[key]) {
          seen[key] = true
          affected({ config: item.config, event: ev, eventTarget: element }).forEach((el) => targets.push({ el, key }))
        }
      }
    for (const { el, key } of targets) {
      const groups = byKey[key]
      const item = groups[0].actionItems[0]
      addInstance({ el, item, eventId, actionListId, continuous: true, parameterId, actionGroups: groups, smoothing, restingValue })
    }
  }

  // ---- event logic (IX2VanillaEvents) ----
  const isVisible = ({ element, event }) => {
    const { clientWidth, clientHeight } = viewport()
    const a = event.config.scrollOffsetValue
    const off = event.config.scrollOffsetUnit === 'PX' ? a : (clientHeight * (a || 0)) / 100
    const r = element.getBoundingClientRect()
    return !(r.left > clientWidth || r.right < 0 || r.top > clientHeight - off || r.bottom < off)
  }
  const withinTarget = ({ element, nativeEvent }) => element === nativeEvent.target || element.contains(nativeEvent.target)

  const LOGIC = {
    [SCROLL_INTO_VIEW]: {
      types: 'scroll',
      throttle: true,
      handler(ctx, prev) {
        const n = { ...prev, elementVisible: isVisible(ctx) }
        if (!(prev ? n.elementVisible !== prev.elementVisible : n.elementVisible)) return n
        if (n.triggered) return n // no autoStop events exist for the ported pages
        if ((ctx.event.eventTypeId === SCROLL_INTO_VIEW) === n.elementVisible) {
          fire(ctx)
          return { ...n, triggered: true }
        }
        return n
      },
    },
    [SCROLLING_IN_VIEW]: {
      types: 'scroll',
      throttle: true,
      handler({ element, eventConfig, eventStateKey }, prev = { scrollPercent: 0 }) {
        const { clientHeight: d, scrollHeight: u } = viewport()
        const { continuousParameterGroupId: g, startsEntering: h, startsExiting: m, addEndOffset: y, addStartOffset: E, addOffsetValue: v = 0, endOffsetValue: T = 0 } = eventConfig
        const key = `${eventStateKey}:${g}`
        const a = element.getBoundingClientRect()
        let o = (E ? v : 0) / 100
        let l = (y ? T : 0) / 100
        o = h ? o : 1 - o
        l = m ? l : 1 - l
        const s = a.top + Math.min(a.height * o, d)
        const f = Math.min(d + (a.top + a.height * l - s), u)
        const p = Math.min(Math.max(0, d - s), f) / f
        if (p !== prev.scrollPercent) S.params[key] = p
        return { scrollPercent: p }
      },
    },
    [MOUSE_OUT]: {
      types: 'mouseover mouseout',
      handler(ctx, prev) {
        if (!withinTarget(ctx)) return prev
        const { type, target, relatedTarget } = ctx.nativeEvent
        const inside = ctx.element.contains(target)
        const hovered = (type === 'mouseover' && inside) || (type === 'mouseout' && inside && ctx.element.contains(relatedTarget))
        const next = { elementHovered: hovered }
        if ((prev ? hovered !== prev.elementHovered : hovered) && !hovered) fire(ctx)
        return next
      },
    },
    [MOUSE_MOVE]: {
      types: 'mousemove mouseout scroll',
      handler({ element, eventConfig, nativeEvent, eventStateKey }, a = { clientX: 0, clientY: 0, pageX: 0, pageY: 0 }) {
        const { selectedAxis, continuousParameterGroupId, reverse, restingState = 0 } = eventConfig
        const { clientX: p = a.clientX, clientY: g = a.clientY, pageX: h = a.pageX, pageY: m = a.pageY } = nativeEvent
        const isX = selectedAxis === 'X_AXIS'
        const isOut = nativeEvent.type === 'mouseout'
        let v = restingState / 100
        let hovered = false
        const key = `${eventStateKey}:${continuousParameterGroupId}`
        const isMouse = nativeEvent.type.indexOf('mouse') === 0
        const r = element.getBoundingClientRect()
        if (!(isMouse && !withinTarget({ element, nativeEvent })) && (isMouse || (p > r.left && p < r.right && g > r.top && g < r.bottom))) {
          hovered = true
          v = isX ? (p - r.left) / r.width : (g - r.top) / r.height
        }
        if (isOut && (v > 0.95 || v < 0.05)) v = Math.round(v)
        if (hovered || hovered !== a.elementHovered) S.params[key] = reverse ? 1 - v : v
        return { elementHovered: hovered, clientX: p, clientY: g, pageX: h, pageY: m }
      },
    },
  }

  function bind() {
    updateViewport()
    for (const type of TYPE_ORDER) {
      const logic = LOGIC[type]
      const map = []
      for (const [eventId, ev] of Object.entries(EVENTS)) {
        if (ev.eventTypeId !== type) continue
        const els = affected({ config: { target: ev.target, targets: ev.targets } })
        if (els.length) map.push([eventId, ev, els])
      }
      if (!map.length) continue
      for (const [eventId, ev, els] of map) {
        const mqs = ev.mediaQueries || MQ_KEYS
        if (!(mqs.length === MQ_KEYS.length && [...mqs].sort().every((k, i) => k === [...MQ_KEYS].sort()[i]))) S.hasDefinedMQ = true
        const listId = ev.action.config.actionListId
        if (ev.action.actionTypeId === CONTINUOUS) {
          const groups = ACTION_LISTS[listId]?.continuousParameterGroups || []
          for (const cfg of Array.isArray(ev.config) ? ev.config : [ev.config]) {
            const group = groups.find((g) => g.id === cfg.continuousParameterGroupId)
            if (group) els.forEach((element, i) => createContinuous({ eventId, eventStateKey: `${eventId}:${i}`, element, eventConfig: cfg, actionListId: listId, group }))
          }
        }
        if (ev.action.actionTypeId === START || QUICK.has(ev.action.actionTypeId)) initialState(listId, eventId)
      }
      const handle = (nativeEvent) => {
        for (const [eventId, ev, els] of map) {
          els.forEach((element, idx) => {
            const eventStateKey = `${eventId}:${idx}`
            const prev = S.eventState[eventStateKey]
            if (!mqAllowed(ev.mediaQueries || MQ_KEYS)) return
            const run = (eventConfig = {}) => {
              const next = logic.handler({ element, event: ev, eventId, eventConfig, nativeEvent, eventStateKey }, prev)
              if (!shallowEqual(next, prev)) S.eventState[eventStateKey] = next
            }
            if (ev.action.actionTypeId === CONTINUOUS) (Array.isArray(ev.config) ? ev.config : [ev.config]).forEach(run)
            else run()
          })
        }
      }
      if (logic.throttle) {
        const t = throttle(handle, 12)
        S.throttles.push(t)
        listen(window, 'resize orientationchange', t)
        listen(document, 'scroll wheel readystatechange IX2_PAGE_UPDATE', t)
      } else listen(document, logic.types, handle)
    }
    if (S.listeners.length) {
      const onResize = () => {
        if (updateViewport() && S.hasDefinedMQ) restart()
      }
      listen(window, 'resize orientationchange', onResize)
    }
  }

  function listen(target, types, fn) {
    for (const type of types.split(' ')) {
      target.addEventListener(type, fn)
      S.listeners.push([target, type, fn])
    }
  }

  function start() {
    S = newSession()
    bind()
    const html = document.documentElement
    if (!html.classList.contains('w-mod-ix')) html.classList.add('w-mod-ix')
    S.active = true
    loop(performance.now())
  }

  function stop() {
    if (!S) return
    S.active = false
    cancelAnimationFrame(S.raf)
    S.throttles.forEach((t) => t.cancel())
    for (const [t, type, fn] of S.listeners) t.removeEventListener(type, fn)
    S.listeners = []
  }

  function restart() {
    stop()
    clearAllStyles({ affected })
    start()
    document.dispatchEvent(new CustomEvent('IX2_PAGE_UPDATE'))
  }

  start()
  return {
    /** Evaluate scroll-driven events now (Webflow does this on the next readystatechange). */
    pageUpdate: () => document.dispatchEvent(new CustomEvent('IX2_PAGE_UPDATE')),
    destroy() {
      stop()
      clearAllStyles({ affected })
    },
  }
}
