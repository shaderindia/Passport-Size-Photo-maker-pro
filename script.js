// FULL ADVANCED PASSPORT PHOTO MAKER - ULTRA SMOOTH MOBILE PINCH ZOOM & ALL FEATURES + RESIZABLE CROP + NEW QUICK ADJUSTMENTS
document.addEventListener('DOMContentLoaded', function () {
  // ==== Element References ====
  const unitSelect = document.getElementById('unit');
  const dpiInput = document.getElementById('dpi');
  const photoWidthInput = document.getElementById('photo-width');
  const photoHeightInput = document.getElementById('photo-height');
  const numPhotosInput = document.getElementById('num-photos');
  const pageSizeSelect = document.getElementById('page-size');
  const customPageSizeDiv = document.getElementById('custom-page-size');
  const customWidthInput = document.getElementById('custom-width');
  const customHeightInput = document.getElementById('custom-height');
  const hSpacingInput = document.getElementById('h-spacing');
  const vSpacingInput = document.getElementById('v-spacing');
  const marginTopInput = document.getElementById('margin-top');
  const marginLeftInput = document.getElementById('margin-left');
  const autocenterCheck = document.getElementById('autocenter-margin');
  const showCutlinesCheck = document.getElementById('show-cutlines');
  const photoUploadInput = document.getElementById('photo-upload');
  const photoPreviewContainer = document.getElementById('preview-section');
  const photoPreview = document.getElementById('photo-preview');
  const photoPreviewWrapper = document.getElementById('photo-preview-wrapper');
  const cropBox = document.getElementById('crop-box');
  const rotateLeftBtn = document.getElementById('rotate-left');
  const rotateRightBtn = document.getElementById('rotate-right');
  const cropToggleBtn = document.getElementById('crop-toggle');
  const outputCanvas = document.getElementById('output-canvas');
  const formatSelect = document.getElementById('format');
  const downloadBtn = document.getElementById('download-btn');
  const downloadHQBtn = document.getElementById('download-hq-btn');
  const shareBtn = document.getElementById('share-btn');
  const infoBtn = document.getElementById('info-btn');
  const infoModal = document.getElementById('info-modal');
  const closeInfo = document.getElementById('close-info');
  const themeBtn = document.getElementById('theme-btn');

  // NEW: Quick Adjustment Buttons
  const autofixBtn = document.getElementById('autofix-btn');
  const increaseSpaceBtn = document.getElementById('increase-space-btn');
  const decreaseSpaceBtn = document.getElementById('decrease-space-btn');

  // ==== Add "Reset Margins" Button Next to Auto-Center Switch ====
  const resetMarginsBtn = document.createElement('button');
  resetMarginsBtn.textContent = "Reset Margins";
  resetMarginsBtn.className = "btn-main";
  resetMarginsBtn.style.marginLeft = "0.7em";
  resetMarginsBtn.type = "button";
  const autoCenterGroup = autocenterCheck ? autocenterCheck.closest('.form-group') : null;
  if (autoCenterGroup && autoCenterGroup.parentNode) {
    autoCenterGroup.appendChild(resetMarginsBtn);
  }
  resetMarginsBtn.addEventListener('click', () => {
    marginTopInput.value = 0;
    marginLeftInput.value = 0;
    renderCanvas();
  });

  // ==== State ====
  let unit = 'mm';
  let dpi = 300;
  let pageSize = 'a4';

  let originalImgObj = new window.Image();  // Original uploaded image
  let imgObj = originalImgObj;              // Current active image

  let imgLoaded = false;
  let imgURL = null;
  let rotate = 0;
  let cropActive = false, cropRect = null;
  let isDark = false;

  // ==== Unit Conversion ====
  function mmToInch(mm) { return mm / 25.4; }
  function inchToMm(inch) { return inch * 25.4; }
  function mmToPx(mm, dpi) { return mm * dpi / 25.4; }
  function inchToPx(inch, dpi) { return inch * dpi; }
  function pxToMm(px, dpi) { return px * 25.4 / dpi; }
  function pxToInch(px, dpi) { return px / dpi; }

  function updateFieldsForUnitChange(oldUnit, newUnit) {
    function convert(val, from, to) {
      if (from === to) return val;
      if (from === 'mm' && to === 'inch') return mmToInch(val);
      if (from === 'inch' && to === 'mm') return inchToMm(val);
      if (from === 'mm' && to === 'px') return mmToPx(val, dpi);
      if (from === 'px' && to === 'mm') return pxToMm(val, dpi);
      if (from === 'inch' && to === 'px') return inchToPx(val, dpi);
      if (from === 'px' && to === 'inch') return pxToInch(val, dpi);
      return val;
    }
    photoWidthInput.value = +convert(+photoWidthInput.value, oldUnit, newUnit).toFixed(2);
    photoHeightInput.value = +convert(+photoHeightInput.value, oldUnit, newUnit).toFixed(2);
    customWidthInput.value = +convert(+customWidthInput.value, oldUnit, newUnit).toFixed(2);
    customHeightInput.value = +convert(+customHeightInput.value, oldUnit, newUnit).toFixed(2);
    hSpacingInput.value = +convert(+hSpacingInput.value, oldUnit, newUnit).toFixed(2);
    vSpacingInput.value = +convert(+vSpacingInput.value, oldUnit, newUnit).toFixed(2);
    marginTopInput.value = +convert(+marginTopInput.value, oldUnit, newUnit).toFixed(2);
    marginLeftInput.value = +convert(+marginLeftInput.value, oldUnit, newUnit).toFixed(2);
  }

  function getPhotoDimsPx() {
    let w = parseFloat(photoWidthInput.value);
    let h = parseFloat(photoHeightInput.value);
    if (unit === 'mm') return { width: mmToPx(w, dpi), height: mmToPx(h, dpi) };
    if (unit === 'inch') return { width: inchToPx(w, dpi), height: inchToPx(h, dpi) };
    return { width: w, height: h };
  }

  function getPageDimsPx() {
    let w, h;
    if (pageSize === 'a4') {
      w = unit === 'mm' ? 210 : unit === 'inch' ? mmToInch(210) : mmToPx(210, dpi);
      h = unit === 'mm' ? 297 : unit === 'inch' ? mmToInch(297) : mmToPx(297, dpi);
    } else if (pageSize === '4r') {
      w = unit === 'mm' ? 102 : unit === 'inch' ? mmToInch(102) : mmToPx(102, dpi);
      h = unit === 'mm' ? 152 : unit === 'inch' ? mmToInch(152) : mmToPx(152, dpi);
    } else {
      w = parseFloat(customWidthInput.value) || 210;
      h = parseFloat(customHeightInput.value) || 297;
    }
    if (unit === 'mm') return { width: mmToPx(w, dpi), height: mmToPx(h, dpi) };
    if (unit === 'inch') return { width: inchToPx(w, dpi), height: inchToPx(h, dpi) };
    return { width: w, height: h };
  }

  function getSpacingPx() {
    let h = parseFloat(hSpacingInput.value) || 0, v = parseFloat(vSpacingInput.value) || 0;
    if (unit === 'mm') return { h: mmToPx(h, dpi), v: mmToPx(v, dpi) };
    if (unit === 'inch') return { h: inchToPx(h, dpi), v: inchToPx(v, dpi) };
    return { h: h, v: v };
  }

  function getMarginsPx() {
    function conv(x) {
      if (unit === 'mm') return mmToPx(x, dpi);
      if (unit === 'inch') return inchToPx(x, dpi);
      return x;
    }
    let top = conv(parseFloat(marginTopInput.value) || 0);
    let left = conv(parseFloat(marginLeftInput.value) || 0);
    return {
      top: top,
      bottom: top,
      left: left,
      right: left
    };
  }

  // ==== NEW: AutoFix Function ====
  function autoFix() {
    let dims = getPhotoDimsPx();
    let pageDims = getPageDimsPx();
    let targetPhotos = Math.max(1, parseInt(numPhotosInput.value) || 8);
    
    let minSpacing = unit === 'mm' ? 2 : (unit === 'inch' ? mmToInch(2) : mmToPx(2, dpi));
    let optimalSpacing = minSpacing;
    
    for (let spacing = minSpacing; spacing <= 20; spacing += 0.5) {
      let spacingPx = unit === 'mm' ? mmToPx(spacing, dpi) : (unit === 'inch' ? inchToPx(spacing, dpi) : spacing);
      let testCols = Math.floor((pageDims.width + spacingPx) / (dims.width + spacingPx));
      let testRows = Math.floor((pageDims.height + spacingPx) / (dims.height + spacingPx));
      let fitsPhotos = testCols * testRows;
      
      if (fitsPhotos >= targetPhotos) {
        optimalSpacing = spacing;
        break;
      }
    }
    
    hSpacingInput.value = optimalSpacing.toFixed(2);
    vSpacingInput.value = optimalSpacing.toFixed(2);
    autocenterCheck.checked = true;
    
    if (autofixBtn) {
      let originalText = autofixBtn.innerHTML;
      autofixBtn.innerHTML = '<i class="fa fa-check"></i> Optimized!';
      autofixBtn.style.backgroundColor = '#10b981';
      setTimeout(() => {
        autofixBtn.innerHTML = originalText;
        autofixBtn.style.backgroundColor = '';
      }, 2000);
    }
    
    renderCanvas();
  }

  // ==== NEW: Increase Space Function ====
  function increaseSpace() {
    let increment = unit === 'mm' ? 2 : (unit === 'inch' ? mmToInch(2) : mmToPx(2, dpi));
    let currentH = parseFloat(hSpacingInput.value) || 0;
    let currentV = parseFloat(vSpacingInput.value) || 0;
    
    hSpacingInput.value = (currentH + increment).toFixed(2);
    vSpacingInput.value = (currentV + increment).toFixed(2);
    
    renderCanvas();
  }

  // ==== NEW: Decrease Space Function ====
  function decreaseSpace() {
    let decrement = unit === 'mm' ? 2 : (unit === 'inch' ? mmToInch(2) : mmToPx(2, dpi));
    let currentH = parseFloat(hSpacingInput.value) || 0;
    let currentV = parseFloat(vSpacingInput.value) || 0;
    
    hSpacingInput.value = Math.max(0, currentH - decrement).toFixed(2);
    vSpacingInput.value = Math.max(0, currentV - decrement).toFixed(2);
    
    renderCanvas();
  }

  // ==== NEW: Event Listeners for Quick Adjustments ====
  if (autofixBtn) autofixBtn.addEventListener('click', autoFix);
  if (increaseSpaceBtn) increaseSpaceBtn.addEventListener('click', increaseSpace);
  if (decreaseSpaceBtn) decreaseSpaceBtn.addEventListener('click', decreaseSpace);

  // ==== UI Event Handlers ====
  unitSelect.addEventListener('change', () => {
    let oldUnit = unit;
    unit = unitSelect.value;
    if (unit === "px") {
      photoWidthInput.value = 300;
      photoHeightInput.value = 400;
    } else {
      photoWidthInput.value = 35;
      photoHeightInput.value = 45;
    }
    updateFieldsForUnitChange(oldUnit, unit);
    renderCanvas();
  });
  dpiInput.addEventListener('input', () => { dpi = parseInt(dpiInput.value) || 300; renderCanvas(); });
  photoWidthInput.addEventListener('input', renderCanvas);
  photoHeightInput.addEventListener('input', renderCanvas);
  numPhotosInput.addEventListener('input', renderCanvas);
  hSpacingInput.addEventListener('input', renderCanvas);
  vSpacingInput.addEventListener('input', renderCanvas);
  marginTopInput.addEventListener('input', renderCanvas);
  marginLeftInput.addEventListener('input', renderCanvas);
  autocenterCheck.addEventListener('change', renderCanvas);
  pageSizeSelect.addEventListener('change', () => {
    pageSize = pageSizeSelect.value;
    customPageSizeDiv.style.display = (pageSize === 'custom') ? 'flex' : 'none';
    renderCanvas();
  });
  customWidthInput.addEventListener('input', renderCanvas);
  customHeightInput.addEventListener('input', renderCanvas);
  if (showCutlinesCheck) showCutlinesCheck.addEventListener('change', renderCanvas);

  // ==== Modal and Theme ====
  infoBtn.onclick = () => infoModal.classList.add('active');
  closeInfo.onclick = () => infoModal.classList.remove('active');
  infoModal.onclick = (e) => { if (e.target === infoModal) infoModal.classList.remove('active'); };
  themeBtn.onclick = () => {
    isDark = !isDark;
    document.body.classList.toggle('dark', isDark);
    themeBtn.innerHTML = isDark
      ? '<i class="fa fa-sun"></i>'
      : '<i class="fa fa-moon"></i>';
    renderCanvas();
  };

  // ==== Photo Upload ====
  let isImgPanning = false, lastPan = { x: 0, y: 0 };
  let pinchZooming = false;
  let pinchStart = {
    dist: 0,
    mid: { x: 0, y: 0 },
    zoom: 1,
    pan: { x: 0, y: 0 }
  };
  let zoomTarget = 1, zoomDisplay = 1;
  let panTarget = { x: 0, y: 0 }, panDisplay = { x: 0, y: 0 };

  photoUploadInput.addEventListener('change', (e) => {
    if (photoUploadInput.files && photoUploadInput
