// Touch controls for sm64js: virtual analog stick + N64 buttons.
//
// This module only fills `window.touchInput`; player_input_manager.js merges it with
// keyboard / gamepad input every frame (see playerInputUpdate). It uses Pointer Events,
// so several fingers work at once (move + jump, for example).
//
// Shown automatically on touch devices. Add ?touch=1 to the URL to force it (testing).

export const STICK_DEADZONE = 0.12

// Converts the finger offset from the stick centre (in px, y grows downwards) into
// stick values in [-1, 1] with y positive = up, like the keyboard/gamepad code expects.
export function stickFromOffset(dx, dy, radius, deadzone = STICK_DEADZONE) {
    let x = dx / radius
    let y = -dy / radius
    const m = Math.hypot(x, y)
    if (m > 1) { x /= m; y /= m }
    const mag = Math.min(m, 1)
    if (mag < deadzone) return { x: 0, y: 0 }
    // re-scale so the usable range goes smoothly from 0 to 1 after the deadzone
    const k = (mag - deadzone) / (1 - deadzone) / mag
    return { x: x * k, y: y * k }
}

const BUTTON_KEYS = ['a', 'b', 'z', 'start', 'cu', 'cd', 'cl', 'cr', 'rt']

window.touchInput = {
    stickX: 0, stickY: 0,
    a: false, b: false, z: false, start: false,
    cu: false, cd: false, cl: false, cr: false, rt: false,
}

function releaseAll() {
    const t = window.touchInput
    t.stickX = 0
    t.stickY = 0
    BUTTON_KEYS.forEach(k => { t[k] = false })
    document.querySelectorAll('#touchControls .tc.on').forEach(el => el.classList.remove('on'))
    const knob = document.getElementById('tcKnob')
    if (knob) knob.style.transform = 'translate(-50%, -50%)'
}

const CSS = `
#touchControls{position:fixed;left:0;top:0;right:0;bottom:0;z-index:2147483000;pointer-events:none;
  user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;touch-action:none;
  font-family:system-ui,sans-serif}
#touchControls .tc{position:absolute;pointer-events:auto;touch-action:none;box-sizing:border-box;
  display:flex;align-items:center;justify-content:center;border-radius:50%;color:#fff;font-weight:800;
  font-size:clamp(14px,5vmin,28px);background:rgba(15,15,15,.45);border:2px solid rgba(255,255,255,.65);
  opacity:.6;-webkit-tap-highlight-color:transparent}
#touchControls .tc.on{opacity:1;background:rgba(255,255,255,.38)}
#tcStick{left:4vmin;bottom:7vmin;width:clamp(110px,34vmin,200px);height:clamp(110px,34vmin,200px)}
#tcKnob{position:absolute;left:50%;top:50%;width:42%;height:42%;border-radius:50%;
  background:rgba(255,255,255,.55);border:2px solid rgba(255,255,255,.9);transform:translate(-50%,-50%);
  pointer-events:none}
#tcA{right:5vmin;bottom:8vmin;width:clamp(64px,20vmin,110px);height:clamp(64px,20vmin,110px);background:rgba(40,160,60,.55)}
#tcB{right:calc(5vmin + clamp(64px,20vmin,110px) + 2vmin);bottom:5vmin;width:clamp(56px,17vmin,96px);height:clamp(56px,17vmin,96px);background:rgba(200,50,50,.55)}
#tcZ{left:4vmin;bottom:calc(7vmin + clamp(110px,34vmin,200px) + 2vmin);width:clamp(52px,15vmin,84px);height:clamp(40px,11vmin,60px);border-radius:14px}
#tcR{right:5vmin;top:5vmin;width:clamp(52px,15vmin,84px);height:clamp(40px,11vmin,60px);border-radius:14px}
#tcStart{left:50%;top:3vmin;transform:translateX(-50%);width:clamp(78px,22vmin,120px);height:clamp(34px,9vmin,48px);border-radius:14px;font-size:clamp(11px,3.2vmin,17px);letter-spacing:.5px}
.tcC{width:clamp(40px,11vmin,64px);height:clamp(40px,11vmin,64px);background:rgba(220,180,30,.5);font-size:clamp(12px,4vmin,22px)}
#tcCu{right:calc(5vmin + clamp(40px,11vmin,64px) + 1vmin);top:calc(5vmin + clamp(40px,11vmin,60px) + 3vmin)}
#tcCd{right:calc(5vmin + clamp(40px,11vmin,64px) + 1vmin);top:calc(5vmin + clamp(40px,11vmin,60px) + 3vmin + 2*clamp(40px,11vmin,64px) + 2vmin)}
#tcCl{right:calc(5vmin + 2*clamp(40px,11vmin,64px) + 2vmin);top:calc(5vmin + clamp(40px,11vmin,60px) + 3vmin + clamp(40px,11vmin,64px) + 1vmin)}
#tcCr{right:5vmin;top:calc(5vmin + clamp(40px,11vmin,60px) + 3vmin + clamp(40px,11vmin,64px) + 1vmin)}
`

function makeButton(root, id, label, key, extraClass) {
    const el = document.createElement('div')
    el.id = id
    el.className = 'tc' + (extraClass ? ' ' + extraClass : '')
    el.textContent = label
    root.appendChild(el)

    const press = (e) => {
        e.preventDefault()
        try { el.setPointerCapture(e.pointerId) } catch (_) { /* not critical */ }
        window.touchInput[key] = true
        el.classList.add('on')
    }
    const release = () => {
        window.touchInput[key] = false
        el.classList.remove('on')
    }
    el.addEventListener('pointerdown', press)
    el.addEventListener('pointerup', release)
    el.addEventListener('pointercancel', release)
    el.addEventListener('lostpointercapture', release)
    return el
}

function makeStick(root) {
    const base = document.createElement('div')
    base.id = 'tcStick'
    base.className = 'tc'
    const knob = document.createElement('div')
    knob.id = 'tcKnob'
    base.appendChild(knob)
    root.appendChild(base)

    let activeId = null

    const update = (e) => {
        const r = base.getBoundingClientRect()
        const radius = r.width / 2 * 0.8   // full deflection at 80% of the base radius
        const dx = e.clientX - (r.left + r.width / 2)
        const dy = e.clientY - (r.top + r.height / 2)
        const s = stickFromOffset(dx, dy, radius)
        window.touchInput.stickX = s.x
        window.touchInput.stickY = s.y
        // knob follows the finger, limited to the base
        const m = Math.hypot(dx, dy) || 1
        const lim = Math.min(m, radius) / m
        knob.style.transform = `translate(calc(-50% + ${dx * lim}px), calc(-50% + ${dy * lim}px))`
    }

    base.addEventListener('pointerdown', (e) => {
        if (activeId !== null) return
        e.preventDefault()
        activeId = e.pointerId
        try { base.setPointerCapture(e.pointerId) } catch (_) { /* not critical */ }
        base.classList.add('on')
        update(e)
    })
    base.addEventListener('pointermove', (e) => {
        if (e.pointerId !== activeId) return
        e.preventDefault()
        update(e)
    })
    const end = (e) => {
        if (e.pointerId !== activeId) return
        activeId = null
        base.classList.remove('on')
        window.touchInput.stickX = 0
        window.touchInput.stickY = 0
        knob.style.transform = 'translate(-50%, -50%)'
    }
    base.addEventListener('pointerup', end)
    base.addEventListener('pointercancel', end)
    base.addEventListener('lostpointercapture', end)
}

export function initTouchControls() {
    if (document.getElementById('touchControls')) return

    const style = document.createElement('style')
    style.textContent = CSS
    document.head.appendChild(style)

    const root = document.createElement('div')
    root.id = 'touchControls'
    document.body.appendChild(root)

    makeStick(root)
    makeButton(root, 'tcA', 'A', 'a')
    makeButton(root, 'tcB', 'B', 'b')
    makeButton(root, 'tcZ', 'Z', 'z')
    makeButton(root, 'tcR', 'R', 'rt')
    makeButton(root, 'tcStart', 'START', 'start')
    makeButton(root, 'tcCu', '▲', 'cu', 'tcC')
    makeButton(root, 'tcCd', '▼', 'cd', 'tcC')
    makeButton(root, 'tcCl', '◀', 'cl', 'tcC')
    makeButton(root, 'tcCr', '▶', 'cr', 'tcC')

    // no stuck buttons if the page loses focus or the screen is rotated
    window.addEventListener('blur', releaseAll)
    window.addEventListener('orientationchange', releaseAll)
    document.addEventListener('visibilitychange', () => { if (document.hidden) releaseAll() })
    // no long-press menu / text selection on the controls
    root.addEventListener('contextmenu', (e) => e.preventDefault())
}

const wantsTouch = () => {
    try {
        if (new URLSearchParams(window.location.search).get('touch') === '1') return true
    } catch (_) { /* ignore */ }
    return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0)
}

if (typeof document !== 'undefined' && wantsTouch()) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTouchControls)
    } else {
        initTouchControls()
    }
}
