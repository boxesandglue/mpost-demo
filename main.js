// mpgo WASM Interactive Demo

// Coordinate transformation: world coords are centered (0,0 at center), Y-up (like MetaPost)
function canvasToWorld(canvasX, canvasY) {
    return {
        x: canvasX - canvas.width / 2,
        y: canvas.height / 2 - canvasY  // Flip Y
    };
}

function worldToCanvas(worldX, worldY) {
    return {
        x: worldX + canvas.width / 2,
        y: canvas.height / 2 - worldY  // Flip Y
    };
}

// i18n
const translations = {
    en: {
        title: "hobby.boxesandglue.dev - Interactive Hobby Curves",
        heading: "hobby.boxesandglue.dev - Interactive Hobby Curves",
        about: "About",
        aboutText: "This is an interactive demo of the Hobby-Knuth algorithm — a method for computing aesthetically pleasing smooth Bézier curves through a set of points.\n\nClick on the canvas to place points, and the algorithm automatically computes a smooth curve. You can drag points, adjust tension, direction, and curl at each point to control the curve shape.\n\nThe core algorithm was developed by Donald Knuth for the METAFONT system. John Hobby later generalized and formalized it in his dissertation (1985), and this extended version became the basis for MetaPost. This demo uses mpgo, a Go implementation of the algorithm.",
        loading: "Loading WASM...",
        ready: "Click on canvas to place points",
        errorLoading: "Error loading: ",
        error: "Error: ",
        pathType: "Path Type",
        open: "Open",
        closed: "Closed",
        actions: "Actions",
        undo: "Undo",
        clearAll: "Clear All",
        points: "Points",
        helpText: "Click on canvas to add points",
        deselect: "Deselect",
        editPointTitle: "Edit Point {n}",
        straightLine: "Straight Line (--)",
        closeWithLine: "Close with Line (--)",
        tension: "Tension",
        incoming: "Incoming",
        outgoing: "Outgoing",
        direction: "Direction",
        curl: "Curl",
        metapostCode: "MetaPost Code",
        showPathCode: "Show Path Code",
        copyToClipboard: "Copy to Clipboard",
        display: "Display",
        strokeWidth: "Stroke Width",
        showGrid: "Show Coordinate System",
        showControlPoints: "Show Control Points",
        showTicks: "Show Ticks",
        tickCount: "Tick Count",
        statusPoints: "{n} points, {type}",
        statusOpen: "open",
        statusClosed: "closed",
        minPoints: "% At least 2 points required",
        constraintPosition: "Position by Constraint",
        constraintType: "Type",
        midpoint: "Midpoint",
        between: "Between",
        intersection: "Intersection",
        refPointA: "Point A",
        refPointB: "Point B",
        refPointC: "Point C",
        refPointD: "Point D",
        parameter: "Parameter t",
        constraintError: "Constraint error",
        constraintNotDraggable: "Constrained points cannot be dragged",
        referenceOnly: "Reference only (not in path)",
    },
    de: {
        title: "hobby.boxesandglue.dev - Interaktive Hobby-Kurven",
        heading: "hobby.boxesandglue.dev - Interaktive Hobby-Kurven",
        about: "Info",
        aboutText: "Dies ist eine interaktive Demo des Hobby-Knuth-Algorithmus — ein Verfahren zur Berechnung ästhetisch ansprechender, glatter Bézier-Kurven durch eine Menge von Punkten.\n\nKlicke auf das Canvas, um Punkte zu setzen. Der Algorithmus berechnet automatisch eine glatte Kurve. Du kannst Punkte verschieben und Tension, Richtung und Curl an jedem Punkt anpassen, um die Kurvenform zu steuern.\n\nDer Kern-Algorithmus wurde von Donald Knuth für das METAFONT-System entwickelt. John Hobby hat ihn in seiner Dissertation (1985) verallgemeinert und formalisiert, und diese erweiterte Version wurde zur Grundlage von MetaPost. Diese Demo verwendet mpgo, eine Go-Implementierung des Algorithmus.",
        loading: "Lade WASM...",
        ready: "Klicke auf das Canvas, um Punkte zu setzen",
        errorLoading: "Fehler beim Laden: ",
        error: "Fehler: ",
        pathType: "Pfad-Typ",
        open: "Offen",
        closed: "Geschlossen",
        actions: "Aktionen",
        undo: "Undo",
        clearAll: "Alle löschen",
        points: "Punkte",
        helpText: "Klicke auf das Canvas, um Punkte hinzuzufügen",
        deselect: "Auswahl aufheben",
        editPointTitle: "Punkt {n} bearbeiten",
        straightLine: "Gerade Linie (--)",
        closeWithLine: "Schließen mit Linie (--)",
        tension: "Tension",
        incoming: "Eingehend",
        outgoing: "Ausgehend",
        direction: "Richtung",
        curl: "Curl",
        metapostCode: "MetaPost Code",
        showPathCode: "Pfad-Code anzeigen",
        copyToClipboard: "In Zwischenablage kopieren",
        display: "Darstellung",
        strokeWidth: "Linienstärke",
        showGrid: "Koordinatensystem anzeigen",
        showControlPoints: "Kontrollpunkte anzeigen",
        showTicks: "Ticks anzeigen",
        tickCount: "Anzahl Ticks",
        statusPoints: "{n} Punkte, {type}",
        statusOpen: "offen",
        statusClosed: "geschlossen",
        minPoints: "% Mindestens 2 Punkte benötigt",
        constraintPosition: "Position durch Constraint",
        constraintType: "Typ",
        midpoint: "Mittelpunkt",
        between: "Zwischen",
        intersection: "Schnittpunkt",
        refPointA: "Punkt A",
        refPointB: "Punkt B",
        refPointC: "Punkt C",
        refPointD: "Punkt D",
        parameter: "Parameter t",
        constraintError: "Constraint-Fehler",
        constraintNotDraggable: "Constraint-Punkte können nicht verschoben werden",
        referenceOnly: "Nur Referenzpunkt (nicht im Pfad)",
    }
};

let currentLang = 'en';

function detectLanguage() {
    currentLang = (navigator.language || '').startsWith('de') ? 'de' : 'en';
    document.documentElement.lang = currentLang;
}

function t(key) {
    return (translations[currentLang] && translations[currentLang][key]) || translations.en[key] || key;
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        el.title = t(el.getAttribute('data-i18n-title'));
    });
    document.title = t('title');

    // About dialog content (split newlines into paragraphs)
    const aboutContent = document.getElementById('aboutContent');
    if (aboutContent) {
        aboutContent.innerHTML = t('aboutText').split('\n\n').map(p => '<p>' + p + '</p>').join('');
    }
}

const state = {
    points: [],
    closed: false,
    strokeWidth: 2,
    showControlPoints: false,
    showTicks: false,
    tickCount: 10,
    showMetaPostCode: false,
    showGrid: false,
    selectedPointIndex: -1,
    draggingPointIndex: -1,
    dragStartPos: null,      // Position where drag started
    hasDragged: false,       // Did the mouse actually move during drag?
    wasmReady: false,
    history: []
};

// DOM Elements
let canvas, ctx, svgOverlay, statusEl;
let strokeWidthSlider, strokeWidthValue;
let pointList, selectedPointEditor;
let pointTensionSlider, pointTensionValue;
let pointInDirectionSlider, pointInDirectionValue;
let pointOutDirectionSlider, pointOutDirectionValue;
let pointInCurlSlider, pointInCurlValue;
let pointOutCurlSlider, pointOutCurlValue;
let useInConstraintCheckbox, inConstraintTypeSelect, inDirectionGroup, inCurlGroup;
let useOutConstraintCheckbox, outConstraintTypeSelect, outDirectionGroup, outCurlGroup;
// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initElements();
    initCanvas();
    initControls();
    initWasm();
});

function initElements() {
    detectLanguage();

    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    svgOverlay = document.getElementById('svgOverlay');
    statusEl = document.getElementById('status');

    strokeWidthSlider = document.getElementById('strokeWidthSlider');
    strokeWidthValue = document.getElementById('strokeWidthValue');

    pointList = document.getElementById('pointList');
    selectedPointEditor = document.getElementById('selectedPointEditor');
    pointTensionSlider = document.getElementById('pointTensionSlider');
    pointTensionValue = document.getElementById('pointTensionValue');

    pointInDirectionSlider = document.getElementById('pointInDirectionSlider');
    pointInDirectionValue = document.getElementById('pointInDirectionValue');
    pointInCurlSlider = document.getElementById('pointInCurlSlider');
    pointInCurlValue = document.getElementById('pointInCurlValue');
    useInConstraintCheckbox = document.getElementById('useInConstraint');
    inConstraintTypeSelect = document.getElementById('inConstraintType');
    inDirectionGroup = document.getElementById('inDirectionGroup');
    inCurlGroup = document.getElementById('inCurlGroup');

    pointOutDirectionSlider = document.getElementById('pointOutDirectionSlider');
    pointOutDirectionValue = document.getElementById('pointOutDirectionValue');
    pointOutCurlSlider = document.getElementById('pointOutCurlSlider');
    pointOutCurlValue = document.getElementById('pointOutCurlValue');
    useOutConstraintCheckbox = document.getElementById('useOutConstraint');
    outConstraintTypeSelect = document.getElementById('outConstraintType');
    outDirectionGroup = document.getElementById('outDirectionGroup');
    outCurlGroup = document.getElementById('outCurlGroup');

    applyTranslations();

    // About dialog
    const aboutOverlay = document.getElementById('aboutOverlay');
    document.getElementById('btnAbout').addEventListener('click', () => {
        aboutOverlay.classList.add('visible');
    });
    document.getElementById('aboutClose').addEventListener('click', () => {
        aboutOverlay.classList.remove('visible');
    });
    aboutOverlay.addEventListener('click', (e) => {
        if (e.target === aboutOverlay) aboutOverlay.classList.remove('visible');
    });
}

function initCanvas() {
    // Use mousedown/mouseup instead of click for better drag handling
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    // Touch support
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);
}

function syncStateFromDOM() {
    // Read current values from form elements (browser may have restored cached values)
    state.strokeWidth = parseFloat(strokeWidthSlider.value);
    strokeWidthValue.textContent = state.strokeWidth.toFixed(1);

    const showControlPointsCheckbox = document.getElementById('showControlPoints');
    state.showControlPoints = showControlPointsCheckbox.checked;

    const showTicksCheckbox = document.getElementById('showTicks');
    state.showTicks = showTicksCheckbox.checked;
    document.getElementById('tickCountGroup').style.display = state.showTicks ? 'block' : 'none';

    const tickCountSlider = document.getElementById('tickCountSlider');
    state.tickCount = parseInt(tickCountSlider.value);
    document.getElementById('tickCountValue').textContent = state.tickCount;

    const showMetaPostCodeCheckbox = document.getElementById('showMetaPostCode');
    state.showMetaPostCode = showMetaPostCodeCheckbox.checked;
    document.getElementById('metaPostCodeContainer').style.display = state.showMetaPostCode ? 'block' : 'none';

    const showGridCheckbox = document.getElementById('showGrid');
    state.showGrid = showGridCheckbox.checked;
}

function initControls() {
    // Sync state from DOM (browser may restore cached form values)
    syncStateFromDOM();

    // Path type toggle
    document.getElementById('btnOpen').addEventListener('click', () => {
        state.closed = false;
        updateToggleButtons();
        render();
    });

    document.getElementById('btnClosed').addEventListener('click', () => {
        state.closed = true;
        updateToggleButtons();
        render();
    });

    // Clear and Undo
    document.getElementById('btnClear').addEventListener('click', () => {
        saveHistory();
        state.points = [];
        state.selectedPointIndex = -1;
        render();
    });

    document.getElementById('btnUndo').addEventListener('click', () => {
        if (state.history.length > 0) {
            state.points = state.history.pop();
            state.selectedPointIndex = -1;
            render();
        }
    });

    document.getElementById('btnDeselect').addEventListener('click', () => {
        deselectPoint();
    });

    // Stroke width
    strokeWidthSlider.addEventListener('input', () => {
        state.strokeWidth = parseFloat(strokeWidthSlider.value);
        strokeWidthValue.textContent = state.strokeWidth.toFixed(1);
        render();
    });

    // Show grid
    document.getElementById('showGrid').addEventListener('change', (e) => {
        state.showGrid = e.target.checked;
        render();
    });

    // Show control points
    document.getElementById('showControlPoints').addEventListener('change', (e) => {
        state.showControlPoints = e.target.checked;
        render();
    });

    // Show ticks
    document.getElementById('showTicks').addEventListener('change', (e) => {
        state.showTicks = e.target.checked;
        document.getElementById('tickCountGroup').style.display = e.target.checked ? 'block' : 'none';
        render();
    });

    // Tick count
    document.getElementById('tickCountSlider').addEventListener('input', (e) => {
        state.tickCount = parseInt(e.target.value);
        document.getElementById('tickCountValue').textContent = state.tickCount;
        render();
    });

    // MetaPost code display
    document.getElementById('showMetaPostCode').addEventListener('change', (e) => {
        state.showMetaPostCode = e.target.checked;
        document.getElementById('metaPostCodeContainer').style.display = e.target.checked ? 'block' : 'none';
        updateMetaPostCode();
    });

    // Copy MetaPost code to clipboard
    document.getElementById('copyMetaPostCode').addEventListener('click', () => {
        const code = document.getElementById('metaPostCode').textContent;
        navigator.clipboard.writeText(code).then(() => {
            const btn = document.getElementById('copyMetaPostCode');
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
            setTimeout(() => { btn.innerHTML = originalHTML; }, 1500);
        });
    });

    // Point-specific controls
    document.getElementById('isLine').addEventListener('change', (e) => {
        if (state.selectedPointIndex >= 0) {
            state.points[state.selectedPointIndex].isLine = e.target.checked;
            render();
        }
    });

    pointTensionSlider.addEventListener('input', () => {
        if (state.selectedPointIndex >= 0) {
            const tension = parseFloat(pointTensionSlider.value);
            state.points[state.selectedPointIndex].tension = tension;
            pointTensionValue.textContent = tension.toFixed(1);
            render();
        }
    });

    // Helper to update incoming constraint UI visibility
    function updateInConstraintUI() {
        const enabled = useInConstraintCheckbox.checked;
        const type = inConstraintTypeSelect.value;
        inDirectionGroup.style.display = enabled && type === 'direction' ? 'block' : 'none';
        inCurlGroup.style.display = enabled && type === 'curl' ? 'block' : 'none';
    }

    // Helper to update outgoing constraint UI visibility
    function updateOutConstraintUI() {
        const enabled = useOutConstraintCheckbox.checked;
        const type = outConstraintTypeSelect.value;
        outDirectionGroup.style.display = enabled && type === 'direction' ? 'block' : 'none';
        outCurlGroup.style.display = enabled && type === 'curl' ? 'block' : 'none';
    }

    // Incoming constraint checkbox
    useInConstraintCheckbox.addEventListener('change', () => {
        if (state.selectedPointIndex >= 0) {
            const pt = state.points[state.selectedPointIndex];
            if (useInConstraintCheckbox.checked) {
                const type = inConstraintTypeSelect.value;
                if (type === 'direction') {
                    pt.inDirection = parseFloat(pointInDirectionSlider.value);
                    pt.inCurl = null;
                } else {
                    pt.inCurl = parseFloat(pointInCurlSlider.value);
                    pt.inDirection = null;
                }
            } else {
                pt.inDirection = null;
                pt.inCurl = null;
            }
            updateInConstraintUI();
            render();
        }
    });

    // Incoming constraint type selector
    inConstraintTypeSelect.addEventListener('change', () => {
        if (state.selectedPointIndex >= 0 && useInConstraintCheckbox.checked) {
            const pt = state.points[state.selectedPointIndex];
            const type = inConstraintTypeSelect.value;
            if (type === 'direction') {
                pt.inDirection = parseFloat(pointInDirectionSlider.value);
                pt.inCurl = null;
            } else {
                pt.inCurl = parseFloat(pointInCurlSlider.value);
                pt.inDirection = null;
            }
            updateInConstraintUI();
            render();
        }
    });

    // Incoming direction slider
    pointInDirectionSlider.addEventListener('input', () => {
        if (state.selectedPointIndex >= 0 && useInConstraintCheckbox.checked && inConstraintTypeSelect.value === 'direction') {
            const dir = parseFloat(pointInDirectionSlider.value);
            state.points[state.selectedPointIndex].inDirection = dir;
            pointInDirectionValue.textContent = dir + '°';
            render();
        }
    });

    // Incoming curl slider
    pointInCurlSlider.addEventListener('input', () => {
        if (state.selectedPointIndex >= 0 && useInConstraintCheckbox.checked && inConstraintTypeSelect.value === 'curl') {
            const curl = parseFloat(pointInCurlSlider.value);
            state.points[state.selectedPointIndex].inCurl = curl;
            pointInCurlValue.textContent = curl.toFixed(1);
            render();
        }
    });

    // Outgoing constraint checkbox
    useOutConstraintCheckbox.addEventListener('change', () => {
        if (state.selectedPointIndex >= 0) {
            const pt = state.points[state.selectedPointIndex];
            if (useOutConstraintCheckbox.checked) {
                const type = outConstraintTypeSelect.value;
                if (type === 'direction') {
                    pt.outDirection = parseFloat(pointOutDirectionSlider.value);
                    pt.outCurl = null;
                } else {
                    pt.outCurl = parseFloat(pointOutCurlSlider.value);
                    pt.outDirection = null;
                }
            } else {
                pt.outDirection = null;
                pt.outCurl = null;
            }
            updateOutConstraintUI();
            render();
        }
    });

    // Outgoing constraint type selector
    outConstraintTypeSelect.addEventListener('change', () => {
        if (state.selectedPointIndex >= 0 && useOutConstraintCheckbox.checked) {
            const pt = state.points[state.selectedPointIndex];
            const type = outConstraintTypeSelect.value;
            if (type === 'direction') {
                pt.outDirection = parseFloat(pointOutDirectionSlider.value);
                pt.outCurl = null;
            } else {
                pt.outCurl = parseFloat(pointOutCurlSlider.value);
                pt.outDirection = null;
            }
            updateOutConstraintUI();
            render();
        }
    });

    // Outgoing direction slider
    pointOutDirectionSlider.addEventListener('input', () => {
        if (state.selectedPointIndex >= 0 && useOutConstraintCheckbox.checked && outConstraintTypeSelect.value === 'direction') {
            const dir = parseFloat(pointOutDirectionSlider.value);
            state.points[state.selectedPointIndex].outDirection = dir;
            pointOutDirectionValue.textContent = dir + '°';
            render();
        }
    });

    // Outgoing curl slider
    pointOutCurlSlider.addEventListener('input', () => {
        if (state.selectedPointIndex >= 0 && useOutConstraintCheckbox.checked && outConstraintTypeSelect.value === 'curl') {
            const curl = parseFloat(pointOutCurlSlider.value);
            state.points[state.selectedPointIndex].outCurl = curl;
            pointOutCurlValue.textContent = curl.toFixed(1);
            render();
        }
    });

    // Reference-only checkbox
    document.getElementById('isReference').addEventListener('change', (e) => {
        if (state.selectedPointIndex >= 0) {
            state.points[state.selectedPointIndex].isReference = e.target.checked;
            // Show/hide path-specific controls
            document.getElementById('pathPointControls').style.display = e.target.checked ? 'none' : 'block';
            render();
        }
    });

    // Constraint checkbox
    document.getElementById('useConstraint').addEventListener('change', (e) => {
        if (state.selectedPointIndex >= 0) {
            const constraintEditor = document.getElementById('constraintEditor');
            if (e.target.checked) {
                constraintEditor.style.display = 'block';
                buildConstraintRefSelectors(state.selectedPointIndex);
                applyConstraintFromUI(state.selectedPointIndex);
            } else {
                constraintEditor.style.display = 'none';
                state.points[state.selectedPointIndex].constraint = null;
                render();
            }
        }
    });

    // Constraint type change
    document.getElementById('constraintType').addEventListener('change', () => {
        if (state.selectedPointIndex >= 0 && document.getElementById('useConstraint').checked) {
            buildConstraintRefSelectors(state.selectedPointIndex);
            applyConstraintFromUI(state.selectedPointIndex);
        }
    });
}

// Build reference point selectors for the constraint editor
function buildConstraintRefSelectors(pointIndex) {
    const container = document.getElementById('constraintRefs');
    const constraintType = document.getElementById('constraintType').value;
    const pt = state.points[pointIndex];
    const c = pt.constraint;

    // Build options for reference point selectors (all points except self)
    function refOptions(selectedIdx) {
        let html = '';
        for (let i = 0; i < state.points.length; i++) {
            if (i === pointIndex) continue;
            const sel = i === selectedIdx ? ' selected' : '';
            html += `<option value="${i}"${sel}>z${i} (${state.points[i].x.toFixed(0)}, ${state.points[i].y.toFixed(0)})</option>`;
        }
        return html;
    }

    // Default reference values
    const availableRefs = [];
    for (let i = 0; i < state.points.length; i++) {
        if (i !== pointIndex) availableRefs.push(i);
    }
    const defA = c ? c.refA : (availableRefs[0] ?? 0);
    const defB = c ? c.refB : (availableRefs[1] ?? availableRefs[0] ?? 0);
    const defC = c && c.refC !== null && c.refC !== undefined ? c.refC : (availableRefs[2] ?? availableRefs[0] ?? 0);
    const defD = c && c.refD !== null && c.refD !== undefined ? c.refD : (availableRefs[3] ?? availableRefs[1] ?? availableRefs[0] ?? 0);
    const defT = c && c.t !== null && c.t !== undefined ? c.t : 0.5;

    let html = '';

    // RefA and RefB (all types)
    html += `<div style="margin-bottom: 0.375rem;">
        <label style="font-size: 0.75rem; color: #6b7280;">${t('refPointA')}</label>
        <select id="constraintRefA" style="width: 100%; padding: 0.25rem 0.5rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.8rem;">
            ${refOptions(defA)}
        </select>
    </div>`;
    html += `<div style="margin-bottom: 0.375rem;">
        <label style="font-size: 0.75rem; color: #6b7280;">${t('refPointB')}</label>
        <select id="constraintRefB" style="width: 100%; padding: 0.25rem 0.5rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.8rem;">
            ${refOptions(defB)}
        </select>
    </div>`;

    // t-slider for "between"
    if (constraintType === 'between') {
        html += `<div class="slider-group" style="margin-bottom: 0.375rem;">
            <div class="slider-label">
                <span>${t('parameter')}</span>
                <span class="slider-value" id="constraintTValue">${defT.toFixed(2)}</span>
            </div>
            <input type="range" id="constraintTSlider" min="0" max="1" step="0.01" value="${defT}">
        </div>`;
    }

    // RefC and RefD for "intersection"
    if (constraintType === 'intersection') {
        html += `<div style="margin-bottom: 0.375rem;">
            <label style="font-size: 0.75rem; color: #6b7280;">${t('refPointC')}</label>
            <select id="constraintRefC" style="width: 100%; padding: 0.25rem 0.5rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.8rem;">
                ${refOptions(defC)}
            </select>
        </div>`;
        html += `<div style="margin-bottom: 0.375rem;">
            <label style="font-size: 0.75rem; color: #6b7280;">${t('refPointD')}</label>
            <select id="constraintRefD" style="width: 100%; padding: 0.25rem 0.5rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.8rem;">
                ${refOptions(defD)}
            </select>
        </div>`;
    }

    container.innerHTML = html;

    // Attach event listeners to new elements
    const refSelectors = ['constraintRefA', 'constraintRefB'];
    if (constraintType === 'intersection') {
        refSelectors.push('constraintRefC', 'constraintRefD');
    }
    refSelectors.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', () => applyConstraintFromUI(pointIndex));
    });

    if (constraintType === 'between') {
        const tSlider = document.getElementById('constraintTSlider');
        if (tSlider) {
            tSlider.addEventListener('input', () => {
                document.getElementById('constraintTValue').textContent = parseFloat(tSlider.value).toFixed(2);
                applyConstraintFromUI(pointIndex);
            });
        }
    }
}

// Read constraint settings from UI and apply to point
function applyConstraintFromUI(pointIndex) {
    const pt = state.points[pointIndex];
    const constraintType = document.getElementById('constraintType').value;
    const refA = parseInt(document.getElementById('constraintRefA').value);
    const refB = parseInt(document.getElementById('constraintRefB').value);

    const constraint = { type: constraintType, refA, refB };

    if (constraintType === 'between') {
        const tSlider = document.getElementById('constraintTSlider');
        constraint.t = tSlider ? parseFloat(tSlider.value) : 0.5;
    }

    if (constraintType === 'intersection') {
        const refC = document.getElementById('constraintRefC');
        const refD = document.getElementById('constraintRefD');
        constraint.refC = refC ? parseInt(refC.value) : 0;
        constraint.refD = refD ? parseInt(refD.value) : 0;
    }

    pt.constraint = constraint;
    render();
}

async function initWasm() {
    try {
        const go = new Go();
        const result = await WebAssembly.instantiateStreaming(
            fetch('main.wasm'),
            go.importObject
        );
        go.run(result.instance);
        state.wasmReady = true;
        statusEl.textContent = t('ready');
        statusEl.className = 'status';
    } catch (err) {
        statusEl.textContent = t('errorLoading') + err.message;
        statusEl.className = 'status error';
        console.error('WASM load error:', err);
    }
}

function getWorldCoords(e) {
    const rect = canvas.getBoundingClientRect();
    // Scale from display size to internal canvas size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;
    // Convert to world coordinates (centered, Y-up)
    return canvasToWorld(canvasX, canvasY);
}

function getTouchWorldCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    // Scale from display size to internal canvas size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = (touch.clientX - rect.left) * scaleX;
    const canvasY = (touch.clientY - rect.top) * scaleY;
    // Convert to world coordinates (centered, Y-up)
    return canvasToWorld(canvasX, canvasY);
}

function findPointNear(x, y, radius = 15) {
    for (let i = 0; i < state.points.length; i++) {
        const pt = state.points[i];
        const dx = pt.x - x;
        const dy = pt.y - y;
        if (dx * dx + dy * dy < radius * radius) {
            return i;
        }
    }
    return -1;
}

function handleMouseDown(e) {
    const coords = getWorldCoords(e);
    state.dragStartPos = coords;
    state.hasDragged = false;

    const nearPoint = findPointNear(coords.x, coords.y);
    if (nearPoint >= 0) {
        if (state.points[nearPoint].constraint) {
            // Constrained point: select only, no drag
            selectPoint(nearPoint);
        } else {
            // Start dragging free point
            saveHistory();
            state.draggingPointIndex = nearPoint;
            selectPoint(nearPoint);
            canvas.style.cursor = 'grabbing';
        }
    }
    e.preventDefault(); // Prevent text selection
}

function handleMouseMove(e) {
    const coords = getWorldCoords(e);

    // Check if we've moved enough to count as dragging
    if (state.dragStartPos) {
        const dx = coords.x - state.dragStartPos.x;
        const dy = coords.y - state.dragStartPos.y;
        if (dx * dx + dy * dy > 9) { // More than 3px movement
            state.hasDragged = true;
        }
    }

    // Update cursor based on hover (only when not dragging)
    if (state.draggingPointIndex < 0) {
        const nearPoint = findPointNear(coords.x, coords.y);
        if (nearPoint >= 0) {
            canvas.style.cursor = state.points[nearPoint].constraint ? 'pointer' : 'grab';
        } else {
            canvas.style.cursor = 'crosshair';
        }
    }

    // Handle dragging
    if (state.draggingPointIndex >= 0 && state.hasDragged) {
        state.points[state.draggingPointIndex].x = coords.x;
        state.points[state.draggingPointIndex].y = coords.y;
        render();
    }
}

function handleMouseUp(e) {
    const coords = getWorldCoords(e);

    if (!state.hasDragged && state.dragStartPos) {
        // This was a click, not a drag
        const nearPoint = findPointNear(coords.x, coords.y);
        if (nearPoint >= 0) {
            // Clicked on existing point - just select it
            selectPoint(nearPoint);
        } else {
            // Clicked on empty space - add new point
            saveHistory();
            state.points.push({
                x: coords.x,
                y: coords.y,
                tension: 1.0,
                direction: null
            });
            selectPoint(state.points.length - 1);
            render();
        }
    }

    // Reset drag state
    state.draggingPointIndex = -1;
    state.dragStartPos = null;
    state.hasDragged = false;
    canvas.style.cursor = 'crosshair';
}

function handleMouseLeave() {
    // Cancel drag if mouse leaves canvas
    state.draggingPointIndex = -1;
    state.dragStartPos = null;
    state.hasDragged = false;
    canvas.style.cursor = 'crosshair';
}

function handleTouchStart(e) {
    e.preventDefault();
    const coords = getTouchWorldCoords(e);
    const nearPoint = findPointNear(coords.x, coords.y, 25);
    if (nearPoint >= 0) {
        if (state.points[nearPoint].constraint) {
            selectPoint(nearPoint);
        } else {
            state.draggingPointIndex = nearPoint;
            selectPoint(nearPoint);
        }
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    if (state.draggingPointIndex >= 0) {
        const coords = getTouchWorldCoords(e);
        state.points[state.draggingPointIndex].x = coords.x;
        state.points[state.draggingPointIndex].y = coords.y;
        render();
    }
}

function handleTouchEnd(e) {
    if (state.draggingPointIndex < 0 && e.changedTouches.length > 0) {
        // This was a tap, not a drag - add point
        const rect = canvas.getBoundingClientRect();
        const touch = e.changedTouches[0];
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const canvasX = (touch.clientX - rect.left) * scaleX;
        const canvasY = (touch.clientY - rect.top) * scaleY;
        const coords = canvasToWorld(canvasX, canvasY);
        const nearPoint = findPointNear(coords.x, coords.y, 25);
        if (nearPoint < 0) {
            saveHistory();
            state.points.push({
                x: coords.x,
                y: coords.y,
                tension: 1.0,
                direction: null
            });
            selectPoint(state.points.length - 1);
            render();
        }
    }
    state.draggingPointIndex = -1;
}

function deselectPoint() {
    state.selectedPointIndex = -1;
    selectedPointEditor.style.display = 'none';
    document.getElementById('btnDeselect').style.display = 'none';
    updatePointList();
    render();
}

function selectPoint(index) {
    state.selectedPointIndex = index;

    if (index >= 0 && index < state.points.length) {
        const pt = state.points[index];
        selectedPointEditor.style.display = 'block';
        document.getElementById('btnDeselect').style.display = 'block';
        document.getElementById('selectedPointHeader').textContent = t('editPointTitle').replace('{n}', index);

        // Reference-only checkbox
        const isReferenceCheckbox = document.getElementById('isReference');
        isReferenceCheckbox.checked = pt.isReference || false;
        document.getElementById('pathPointControls').style.display = pt.isReference ? 'none' : 'block';

        // isLine checkbox (for points after first, or first point when closed)
        const isLineGroup = document.getElementById('isLineGroup');
        const isLineCheckbox = document.getElementById('isLine');
        const isLineLabel = isLineGroup.querySelector('label');
        if (index > 0) {
            isLineGroup.style.display = 'flex';
            isLineLabel.textContent = t('straightLine');
            isLineCheckbox.checked = pt.isLine || false;
        } else if (index === 0 && state.closed) {
            // For first point when closed: controls the closing segment
            isLineGroup.style.display = 'flex';
            isLineLabel.textContent = t('closeWithLine');
            isLineCheckbox.checked = pt.isLine || false;
        } else {
            isLineGroup.style.display = 'none';
        }

        pointTensionSlider.value = pt.tension || 1;
        pointTensionValue.textContent = (pt.tension || 1).toFixed(1);

        // Incoming constraint (direction or curl)
        const hasInDirection = pt.inDirection !== null && pt.inDirection !== undefined;
        const hasInCurl = pt.inCurl !== null && pt.inCurl !== undefined;
        if (hasInDirection) {
            useInConstraintCheckbox.checked = true;
            inConstraintTypeSelect.value = 'direction';
            inDirectionGroup.style.display = 'block';
            inCurlGroup.style.display = 'none';
            pointInDirectionSlider.value = pt.inDirection;
            pointInDirectionValue.textContent = pt.inDirection + '°';
        } else if (hasInCurl) {
            useInConstraintCheckbox.checked = true;
            inConstraintTypeSelect.value = 'curl';
            inDirectionGroup.style.display = 'none';
            inCurlGroup.style.display = 'block';
            pointInCurlSlider.value = pt.inCurl;
            pointInCurlValue.textContent = pt.inCurl.toFixed(1);
        } else {
            useInConstraintCheckbox.checked = false;
            inConstraintTypeSelect.value = 'direction';
            inDirectionGroup.style.display = 'none';
            inCurlGroup.style.display = 'none';
            pointInDirectionSlider.value = 0;
            pointInDirectionValue.textContent = '0°';
            pointInCurlSlider.value = 1;
            pointInCurlValue.textContent = '1.0';
        }

        // Outgoing constraint (direction or curl)
        const hasOutDirection = pt.outDirection !== null && pt.outDirection !== undefined;
        const hasOutCurl = pt.outCurl !== null && pt.outCurl !== undefined;
        if (hasOutDirection) {
            useOutConstraintCheckbox.checked = true;
            outConstraintTypeSelect.value = 'direction';
            outDirectionGroup.style.display = 'block';
            outCurlGroup.style.display = 'none';
            pointOutDirectionSlider.value = pt.outDirection;
            pointOutDirectionValue.textContent = pt.outDirection + '°';
        } else if (hasOutCurl) {
            useOutConstraintCheckbox.checked = true;
            outConstraintTypeSelect.value = 'curl';
            outDirectionGroup.style.display = 'none';
            outCurlGroup.style.display = 'block';
            pointOutCurlSlider.value = pt.outCurl;
            pointOutCurlValue.textContent = pt.outCurl.toFixed(1);
        } else {
            useOutConstraintCheckbox.checked = false;
            outConstraintTypeSelect.value = 'direction';
            outDirectionGroup.style.display = 'none';
            outCurlGroup.style.display = 'none';
            pointOutDirectionSlider.value = 0;
            pointOutDirectionValue.textContent = '0°';
            pointOutCurlSlider.value = 1;
            pointOutCurlValue.textContent = '1.0';
        }
        // Constraint editor
        const useConstraintCheckbox = document.getElementById('useConstraint');
        const constraintEditor = document.getElementById('constraintEditor');
        const constraintTypeSelect = document.getElementById('constraintType');
        const constraintError = document.getElementById('constraintError');

        if (pt.constraint) {
            useConstraintCheckbox.checked = true;
            constraintEditor.style.display = 'block';
            constraintTypeSelect.value = pt.constraint.type;
            constraintError.style.display = 'none';
        } else {
            useConstraintCheckbox.checked = false;
            constraintEditor.style.display = 'none';
            constraintError.style.display = 'none';
        }
        buildConstraintRefSelectors(index);

    } else {
        selectedPointEditor.style.display = 'none';
        document.getElementById('btnDeselect').style.display = 'none';
    }

    updatePointList();
    render();
}

function deletePoint(index) {
    saveHistory();

    // Before removing: fix up constraints referencing this or higher indices
    for (let i = 0; i < state.points.length; i++) {
        if (i === index) continue;
        const c = state.points[i].constraint;
        if (!c) continue;

        // Check if any reference points to this index — dissolve constraint
        const refs = [c.refA, c.refB];
        if (c.refC !== null && c.refC !== undefined) refs.push(c.refC);
        if (c.refD !== null && c.refD !== undefined) refs.push(c.refD);

        if (refs.includes(index)) {
            // Dissolve: point becomes free at its current position
            state.points[i].constraint = null;
            continue;
        }

        // Adjust indices > deleted index
        if (c.refA > index) c.refA--;
        if (c.refB > index) c.refB--;
        if (c.refC !== null && c.refC !== undefined && c.refC > index) c.refC--;
        if (c.refD !== null && c.refD !== undefined && c.refD > index) c.refD--;
    }

    state.points.splice(index, 1);
    if (state.selectedPointIndex === index) {
        state.selectedPointIndex = -1;
        selectedPointEditor.style.display = 'none';
    } else if (state.selectedPointIndex > index) {
        state.selectedPointIndex--;
    }
    render();
}

function updateToggleButtons() {
    document.getElementById('btnOpen').classList.toggle('active', !state.closed);
    document.getElementById('btnClosed').classList.toggle('active', state.closed);
}

function updatePointList() {
    if (state.points.length === 0) {
        pointList.innerHTML = '<p class="help-text">' + t('helpText') + '</p>';
        return;
    }

    let html = '';
    state.points.forEach((pt, i) => {
        const isSelected = i === state.selectedPointIndex;
        const hasConstraint = !!pt.constraint;
        const isRef = pt.isReference || false;

        // Badge style: amber diamond for constrained, dashed for reference, colored circle for path points
        let badgeStyle;
        if (hasConstraint) {
            badgeStyle = 'background: #f59e0b; border-radius: 4px; transform: rotate(45deg);';
        } else if (isRef) {
            badgeStyle = 'background: transparent; border: 2px dashed #9ca3af; color: #6b7280;';
        } else if (i === 0) {
            badgeStyle = 'background: #22c55e;';
        } else if (i === state.points.length - 1 && !state.closed) {
            badgeStyle = 'background: #ef4444;';
        } else {
            badgeStyle = '';
        }

        // Constraint label
        let constraintLabel = '';
        if (hasConstraint) {
            const c = pt.constraint;
            if (c.type === 'midpoint') {
                constraintLabel = ` mid(z${c.refA},z${c.refB})`;
            } else if (c.type === 'between') {
                const tVal = c.t !== null && c.t !== undefined ? c.t : 0.5;
                constraintLabel = ` ${tVal.toFixed(2)}[z${c.refA},z${c.refB}]`;
            } else if (c.type === 'intersection') {
                constraintLabel = ` z${c.refA}z${c.refB}×z${c.refC}z${c.refD}`;
            }
        }

        html += `
            <div class="point-item" style="${isSelected ? 'background: #dbeafe;' : ''}" onclick="selectPoint(${i})">
                <div class="point-index" style="${badgeStyle}"><span style="${hasConstraint ? 'display:inline-block;transform:rotate(-45deg);' : ''}">${i}</span></div>
                <div class="point-coords">
                    (${pt.x.toFixed(0)}, ${pt.y.toFixed(0)})${constraintLabel}
                    ${pt.isLine ? ' --' : ''}
                    ${!hasConstraint && pt.tension !== 1 && !pt.isLine ? ` T=${pt.tension.toFixed(1)}` : ''}
                    ${pt.inDirection !== null && pt.inDirection !== undefined ? ` ←${pt.inDirection}°` : ''}
                    ${pt.inCurl !== null && pt.inCurl !== undefined ? ` ←C${pt.inCurl.toFixed(1)}` : ''}
                    ${pt.outDirection !== null && pt.outDirection !== undefined ? ` →${pt.outDirection}°` : ''}
                    ${pt.outCurl !== null && pt.outCurl !== undefined ? ` →C${pt.outCurl.toFixed(1)}` : ''}
                </div>
                <div class="point-controls">
                    <button class="point-btn point-btn-delete" onclick="event.stopPropagation(); deletePoint(${i})">×</button>
                </div>
            </div>
        `;
    });
    pointList.innerHTML = html;
}

function saveHistory() {
    // Deep copy current points
    state.history.push(JSON.parse(JSON.stringify(state.points)));
    // Keep only last 20 states
    if (state.history.length > 20) {
        state.history.shift();
    }
}

function drawGrid() {
    if (!state.showGrid) return;

    const w = canvas.width;
    const h = canvas.height;
    const halfW = w / 2;
    const halfH = h / 2;

    ctx.save();

    // Grid lines (every 50 units in world coords)
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5;

    const gridStep = 50;

    // Vertical grid lines
    for (let wx = -Math.floor(halfW / gridStep) * gridStep; wx <= halfW; wx += gridStep) {
        if (wx === 0) continue; // Skip axis
        const cx = wx + halfW;
        ctx.beginPath();
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, h);
        ctx.stroke();
    }

    // Horizontal grid lines
    for (let wy = -Math.floor(halfH / gridStep) * gridStep; wy <= halfH; wy += gridStep) {
        if (wy === 0) continue; // Skip axis
        const cy = halfH - wy;
        ctx.beginPath();
        ctx.moveTo(0, cy);
        ctx.lineTo(w, cy);
        ctx.stroke();
    }

    // Axes (thicker, darker)
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 1;

    // X axis (y=0 in world coords)
    ctx.beginPath();
    ctx.moveTo(0, halfH);
    ctx.lineTo(w, halfH);
    ctx.stroke();

    // Y axis (x=0 in world coords)
    ctx.beginPath();
    ctx.moveTo(halfW, 0);
    ctx.lineTo(halfW, h);
    ctx.stroke();

    // Origin label
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px sans-serif';
    ctx.fillText('0', halfW + 4, halfH + 14);

    // Axis labels
    ctx.fillText('x', w - 15, halfH + 14);
    ctx.fillText('y', halfW + 4, 15);

    // Tick labels on axes
    ctx.fillStyle = '#9ca3af';
    ctx.font = '10px sans-serif';
    for (let wx = -Math.floor(halfW / gridStep) * gridStep; wx <= halfW; wx += gridStep) {
        if (wx === 0) continue;
        const cx = wx + halfW;
        ctx.fillText(wx.toString(), cx - 10, halfH + 12);
    }
    for (let wy = -Math.floor(halfH / gridStep) * gridStep; wy <= halfH; wy += gridStep) {
        if (wy === 0) continue;
        const cy = halfH - wy;
        ctx.fillText(wy.toString(), halfW + 4, cy + 4);
    }

    ctx.restore();
}

function render() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid if enabled
    drawGrid();

    // Update point list and MetaPost code
    updatePointList();
    updateMetaPostCode();

    const pathPointCount = state.points.filter(p => !p.isReference).length;
    if (!state.wasmReady || pathPointCount < 2) {
        // Draw just the points (including reference points)
        drawPointsOnCanvas();
        svgOverlay.innerHTML = '';
        return;
    }

    // Build config for WASM
    const config = {
        points: state.points.map(pt => ({
            x: pt.x,
            y: pt.y,
            tension: pt.tension || 1,
            inDirection: pt.inDirection !== null && pt.inDirection !== undefined ? pt.inDirection : undefined,
            outDirection: pt.outDirection !== null && pt.outDirection !== undefined ? pt.outDirection : undefined,
            inCurl: pt.inCurl !== null && pt.inCurl !== undefined ? pt.inCurl : undefined,
            outCurl: pt.outCurl !== null && pt.outCurl !== undefined ? pt.outCurl : undefined,
            isLine: pt.isLine || false,
            isReference: pt.isReference || false,
            constraint: pt.constraint || undefined
        })),
        closed: state.closed,
        strokeWidth: state.strokeWidth,
        strokeColor: '#2563eb',
        showPoints: true,
        showControlPoints: state.showControlPoints,
        showTicks: state.showTicks,
        tickCount: state.tickCount,
        selectedPointIndex: state.selectedPointIndex,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height
    };

    try {
        const resultJSON = mpgoGenerateSVG(JSON.stringify(config));
        const result = JSON.parse(resultJSON);

        if (result.error) {
            statusEl.textContent = t('error') + result.error;
            statusEl.className = 'status error';
            drawPointsOnCanvas();
            return;
        }

        // Update constrained point positions from resolved values
        if (result.resolvedPoints) {
            for (let i = 0; i < result.resolvedPoints.length; i++) {
                if (state.points[i] && state.points[i].constraint) {
                    state.points[i].x = result.resolvedPoints[i].x;
                    state.points[i].y = result.resolvedPoints[i].y;
                }
            }
        }

        // Debug: log SVG output and point coordinates
        if (result.debug) {
            console.log('SVG debug:', result.debug);
        }
        console.log('Points (world coords):', state.points.map(p => `(${p.x.toFixed(0)}, ${p.y.toFixed(0)})`));
        console.log('Points (canvas coords):', state.points.map(p => {
            const c = worldToCanvas(p.x, p.y);
            return `(${c.x.toFixed(0)}, ${c.y.toFixed(0)})`;
        }));

        // Display SVG with padding to prevent edge clipping
        svgOverlay.innerHTML = result.svg;

        const svgEl = svgOverlay.querySelector('svg');
        if (svgEl) {
            // Get the actual display size of the canvas
            const rect = canvas.getBoundingClientRect();
            const displayWidth = rect.width;
            const displayHeight = rect.height;

            // Add padding for curves that extend beyond control points
            const pad = 100;
            const scale = displayWidth / canvas.width;
            const displayPad = pad * scale;

            // SVG uses standard coordinates (0,0 at top-left, Y-down)
            // Go transforms world coords to SVG coords
            svgEl.setAttribute('viewBox', `${-pad} ${-pad} ${canvas.width + 2*pad} ${canvas.height + 2*pad}`);
            svgEl.setAttribute('width', displayWidth + 2*displayPad);
            svgEl.setAttribute('height', displayHeight + 2*displayPad);
            svgEl.style.position = 'absolute';
            svgEl.style.left = `${-displayPad}px`;
            svgEl.style.top = `${-displayPad}px`;
        }

        statusEl.textContent = t('statusPoints').replace('{n}', state.points.length).replace('{type}', state.closed ? t('statusClosed') : t('statusOpen'));
        statusEl.className = 'status';

    } catch (err) {
        statusEl.textContent = t('error') + err.message;
        statusEl.className = 'status error';
        console.error('Render error:', err);
        drawPointsOnCanvas();
    }
}

function drawPointsOnCanvas() {
    state.points.forEach((pt, i) => {
        const canvasPos = worldToCanvas(pt.x, pt.y);

        if (pt.isReference) {
            // Reference point: hollow circle with dashed outline
            ctx.beginPath();
            ctx.arc(canvasPos.x, canvasPos.y, 6, 0, Math.PI * 2);
            ctx.strokeStyle = '#9ca3af';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([3, 2]);
            ctx.stroke();
            ctx.setLineDash([]);
        } else {
            // Path point: filled circle
            ctx.beginPath();
            ctx.arc(canvasPos.x, canvasPos.y, 6, 0, Math.PI * 2);
            if (i === 0) {
                ctx.fillStyle = '#22c55e';
            } else if (i === state.points.length - 1 && !state.closed) {
                ctx.fillStyle = '#ef4444';
            } else {
                ctx.fillStyle = '#3b82f6';
            }
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        // Highlight selected
        if (i === state.selectedPointIndex) {
            ctx.beginPath();
            ctx.arc(canvasPos.x, canvasPos.y, 10, 0, Math.PI * 2);
            ctx.strokeStyle = '#2563eb';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    });
}

function updateMetaPostCode() {
    if (!state.showMetaPostCode) return;

    const codeEl = document.getElementById('metaPostCode');
    const pathPts = state.points.filter(p => !p.isReference);
    if (pathPts.length < 2) {
        codeEl.textContent = t('minPoints');
        return;
    }

    let code = '';
    const hasAnyConstraint = state.points.some(p => p.constraint);
    const hasAnyReference = state.points.some(p => p.isReference);
    const useZVars = hasAnyConstraint || hasAnyReference;

    // Emit equations for all points when using z-variables
    if (useZVars) {
        state.points.forEach((pt, i) => {
            if (pt.constraint) {
                const c = pt.constraint;
                if (c.type === 'midpoint') {
                    code += `z${i} = .5[z${c.refA},z${c.refB}];\n`;
                } else if (c.type === 'between') {
                    const tVal = c.t !== null && c.t !== undefined ? c.t : 0.5;
                    code += `z${i} = ${tVal.toFixed(2)}[z${c.refA},z${c.refB}];\n`;
                } else if (c.type === 'intersection') {
                    code += `z${i} = whatever[z${c.refA},z${c.refB}]\n    = whatever[z${c.refC},z${c.refD}];\n`;
                }
            } else {
                code += `z${i} = (${pt.x.toFixed(0)},${pt.y.toFixed(0)});\n`;
            }
        });
        code += '\ndraw ';
    }

    const formatOutConstraint = (p) => {
        if (p.outCurl !== null && p.outCurl !== undefined) return `{curl ${p.outCurl.toFixed(1)}}`;
        if (p.outDirection !== null && p.outDirection !== undefined) return `{dir ${p.outDirection}}`;
        return '';
    };
    const formatInConstraint = (p) => {
        if (p.inCurl !== null && p.inCurl !== undefined) return `{curl ${p.inCurl.toFixed(1)}}`;
        if (p.inDirection !== null && p.inDirection !== undefined) return `{dir ${p.inDirection}}`;
        return '';
    };

    // Build path using only non-reference points
    let isFirst = true;
    state.points.forEach((pt, i) => {
        if (pt.isReference) return; // Skip reference-only points in draw command

        const pointRef = useZVars ? `z${i}` : `(${pt.x.toFixed(0)},${pt.y.toFixed(0)})`;

        if (isFirst) {
            code += pointRef;
            code += formatOutConstraint(pt);
            isFirst = false;
        } else {
            if (pt.isLine) {
                code += '\n  --';
            } else {
                const hasTension = pt.tension && pt.tension !== 1;
                if (hasTension) {
                    code += `\n  ..tension ${pt.tension.toFixed(1)}..`;
                } else {
                    code += '\n  ..';
                }
                code += formatInConstraint(pt);
            }
            code += pointRef;
            code += formatOutConstraint(pt);
        }
    });

    if (state.closed && pathPts.length > 0) {
        const firstPathPt = pathPts[0];
        if (firstPathPt.isLine) {
            code += '\n  --cycle';
        } else {
            const hasTension = firstPathPt.tension && firstPathPt.tension !== 1;
            if (hasTension) {
                code += `\n  ..tension ${firstPathPt.tension.toFixed(1)}..`;
            } else {
                code += '\n  ..';
            }
            if (firstPathPt.inCurl !== null && firstPathPt.inCurl !== undefined) {
                code += `{curl ${firstPathPt.inCurl.toFixed(1)}}`;
            } else if (firstPathPt.inDirection !== null && firstPathPt.inDirection !== undefined) {
                code += `{dir ${firstPathPt.inDirection}}`;
            }
            code += 'cycle';
        }
    }

    code += ';';
    codeEl.textContent = code;
}

// Expose functions globally for onclick handlers
window.selectPoint = selectPoint;
window.deletePoint = deletePoint;
window.deselectPoint = deselectPoint;
