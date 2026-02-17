# Iteration v5 - Mouse Reorder

**Datum:** 2026-02-17
**Typ:** Autonom (Claude)
**Baserad pa:** v4_autonom_reorder_fix

## Problem

HTML5 Drag & Drop (v4) fungerade i JavaScript-simulering men inte med riktig
musinteraktion eller Playwright-automation.

## Losning: Pure Mouse Events

Istallet for HTML5 drag-and-drop API, anvand rena mousedown/mousemove/mouseup events.
Detta ar mer kompatibelt och enklare att debugga.

### Implementation

1. `mousedown` pa videoklipp - spara startposition och index
2. `mousemove` - efter 8px rorelse, borja drag
3. `mouseup` - berakna ny position och utfor splice

### Kod

```javascript
// Mouse down - start potential drag
document.addEventListener('mousedown', (e) => {
    const clipEl = e.target.closest('.timeline-clip.video');
    if (!clipEl) return;
    // ... spara drag state
});

// Mouse move - drag clip
document.addEventListener('mousemove', (e) => {
    if (!reorderDrag) return;
    // ... flytta klipp visuellt
});

// Mouse up - complete drag
document.addEventListener('mouseup', (e) => {
    if (!reorderDrag) return;
    // ... utfor reorder
});
```

## Tester

Playwright-test misslyckades - mouse events triggras inte korrekt.
Behover manuell test.

### Manuell test

1. Oppna http://localhost:5012
2. Ladda upp 2-3 videor via drag-drop
3. Dra ett klipp at hoger
4. Verifiiera att det stannar pa nya platsen

## Port

5012
