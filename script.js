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
  const removeBgBtn = document.getElementById('remove-bg-btn');
  const undoBgBtn = document.getElementById('undo-bg-btn');

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
  
  // Image objects for background removal
  let originalImgObj = new window.Image();  // Original uploaded image (never modified)
  let processedImgObj = null;               // Background-removed version
  let imgObj = originalImgObj;              // Points to current active image
  let isBgRemoved = false;                  // Tracks if background removal is active
  
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

  // ==== Helper: Get Current Cropped Image Canvas ====
  /**
   * Creates an offscreen canvas with the currently visible/cropped region
   * of the original image based on zoom, pan, rotation, and crop settings.
   * @returns {HTMLCanvasElement} Canvas with the cropped image
   */
  function getCurrentCroppedImageCanvas() {
    if (!imgLoaded || !originalImgObj.complete) {
      throw new Error('No image loaded');
    }
    
    const imgW = originalImgObj.naturalWidth;
    const imgH = originalImgObj.naturalHeight;
    const cropParams = getCropParams(imgW, imgH);
    
    // Create offscreen canvas for the cropped region
    const canvas = document.createElement('canvas');
    canvas.width = cropParams.sw;
    canvas.height = cropParams.sh;
    const ctx = canvas.getContext('2d');
    
    // Draw the cropped region from the original image
    ctx.drawImage(
      originalImgObj,
      cropParams.sx, cropParams.sy, cropParams.sw, cropParams.sh,
      0, 0, canvas.width, canvas.height
    );
    
    return canvas;
  }

  // ==== Background Segmentation Stub ====
  /**
   * Placeholder for client-side background segmentation.
   * In a future PR, this should be replaced with an actual segmentation model
   * using WebAssembly or TensorFlow.js (e.g., BodyPix, MediaPipe Selfie Segmentation).
   * 
   * For now, this returns the input ImageData unchanged to demonstrate the pipeline.
   * 
   * @param {ImageData} imageData - Input image data
   * @returns {Promise<ImageData>} Processed image data with background removed
   */
  async function runBackgroundSegmentation(imageData) {
    // TODO: Replace this stub with actual client-side segmentation
    // Example implementation could use:
    // - TensorFlow.js BodyPix model
    // - MediaPipe Selfie Segmentation
    // - A custom WASM module
    //
    // Expected behavior:
    // 1. Run segmentation to identify person/foreground
    // 2. Create alpha mask from segmentation
    // 3. Apply mask to remove background (set alpha to 0 for background pixels)
    // 4. Return modified ImageData
    
    // For now, return the original ImageData unchanged
    return imageData;
  }

  // ==== NEW: Remove Background Function ====
  async function removeBackground() {
    if (!imgLoaded) {
      alert('Please upload a photo first!');
      return;
    }
    
    let originalText = removeBgBtn.innerHTML;
    removeBgBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Processing...';
    removeBgBtn.disabled = true;
    
    try {
      // Get the current cropped image as a canvas
      const croppedCanvas = getCurrentCroppedImageCanvas();
      const ctx = croppedCanvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, croppedCanvas.width, croppedCanvas.height);
      
      // Run background segmentation (currently a stub that returns unchanged ImageData)
      const processedImageData = await runBackgroundSegmentation(imageData);
      
      // Draw processed ImageData onto a new canvas
      const resultCanvas = document.createElement('canvas');
      resultCanvas.width = processedImageData.width;
      resultCanvas.height = processedImageData.height;
      const resultCtx = resultCanvas.getContext('2d');
      resultCtx.putImageData(processedImageData, 0, 0);
      
      // Convert to PNG data URL
      const processedDataURL = resultCanvas.toDataURL('image/png');
      
      // Create new processedImgObj from the data URL
      processedImgObj = new window.Image();
      processedImgObj.onload = function() {
        // Update state
        isBgRemoved = true;
        imgObj = processedImgObj;
        
        // Update preview to show processed image
        photoPreview.src = processedDataURL;
        
        // Re-render canvas so all passport copies use the processed image
        renderCanvas();
        
        // Show undo button
        if (undoBgBtn) {
          undoBgBtn.style.display = '';
        }
        
        // Restore button state
        removeBgBtn.innerHTML = originalText;
        removeBgBtn.disabled = false;
      };
      processedImgObj.onerror = function() {
        throw new Error('Failed to load processed image');
      };
      processedImgObj.src = processedDataURL;
      
    } catch (error) {
      console.error('Background removal error:', error);
      alert('Error removing background. Please try again.');
      
      // Restore button state
      removeBgBtn.innerHTML = originalText;
      removeBgBtn.disabled = false;
    }
  }

  // ==== NEW: Undo Background Function ====
  function undoBackground() {
    if (!imgLoaded) {
      return;
    }
    
    if (!isBgRemoved) {
      return;
    }
    
    // Reset state
    isBgRemoved = false;
    processedImgObj = null;
    imgObj = originalImgObj;
    
    // Restore preview to original image
    photoPreview.src = imgURL;
    
    // Re-render canvas so all passport copies use original image
    renderCanvas();
    
    // Hide undo button
    if (undoBgBtn) {
      undoBgBtn.style.display = 'none';
    }
  }

  // ==== NEW: Event Listeners for Quick Adjustments ====
  if (autofixBtn) autofixBtn.addEventListener('click', autoFix);
  if (increaseSpaceBtn) increaseSpaceBtn.addEventListener('click', increaseSpace);
  if (decreaseSpaceBtn) decreaseSpaceBtn.addEventListener('click', decreaseSpace);
  if (removeBgBtn) removeBgBtn.addEventListener('click', removeBackground);
  if (undoBgBtn) undoBgBtn.addEventListener('click', undoBackground);

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
  photoUploadInput.addEventListener('change', (e) => {
    if (photoUploadInput.files && photoUploadInput.files[0]) {
      let file = photoUploadInput.files[0];
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file!');
        return;
      }
      if (imgURL) URL.revokeObjectURL(imgURL);
      imgURL = URL.createObjectURL(file);
      
      // Reset all state for new upload
      originalImgObj = new window.Image();
      processedImgObj = null;
      imgObj = originalImgObj;
      isBgRemoved = false;
      
      originalImgObj.onload = function () {
        imgLoaded = true;
        photoPreviewContainer.classList.remove('hidden');
        photoPreview.src = imgURL;
        zoomTarget = 1.0;
        panTarget = { x: 0, y: 0 };
        rotate = 0;
        cropRect = null;
        cropActive = false;
        cropBox.classList.add('hidden');
        showCropUI(false);
        snapPreviewTransform();
        
        // Reset button states
        if (removeBgBtn) {
          removeBgBtn.style.display = '';
          removeBgBtn.disabled = false;
        }
        if (undoBgBtn) {
          undoBgBtn.style.display = 'none';
        }
        
        renderCanvas();
      };
      originalImgObj.src = imgURL;
    }
  });

  // ==== Ultra-smooth pinch/zoom/pan for mobile & mouse ====
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

  function animatePhoto() {
    zoomDisplay += (zoomTarget - zoomDisplay) * 0.23;
    panDisplay.x += (panTarget.x - panDisplay.x) * 0.23;
    panDisplay.y += (panTarget.y - panDisplay.y) * 0.23;
    photoPreview.style.transform =
      `translate(${panDisplay.x}px,${panDisplay.y}px) scale(${zoomDisplay}) rotate(${rotate}deg)`;
    if (
      Math.abs(zoomTarget - zoomDisplay) > 0.0005 ||
      Math.abs(panTarget.x - panDisplay.x) > 0.05 ||
      Math.abs(panTarget.y - panDisplay.y) > 0.05
    ) {
      requestAnimationFrame(animatePhoto);
    }
  }
  function updatePreviewTransform(snap = false) {
    if (snap) {
      zoomDisplay = zoomTarget;
      panDisplay.x = panTarget.x;
      panDisplay.y = panTarget.y;
      photoPreview.style.transform =
        `translate(${panDisplay.x}px,${panDisplay.y}px) scale(${zoomDisplay}) rotate(${rotate}deg)`;
    } else {
      requestAnimationFrame(animatePhoto);
    }
    if (cropActive && cropRect) updateCropBox();
  }
  function snapPreviewTransform() { updatePreviewTransform(true); }

  photoPreviewWrapper.addEventListener('gesturestart', e => e.preventDefault());
  photoPreviewWrapper.addEventListener('gesturechange', e => e.preventDefault());
  photoPreviewWrapper.addEventListener('gestureend', e => e.preventDefault());
  photoPreviewWrapper.addEventListener('touchstart', function(e) {
    if (!imgLoaded) return;
    if (e.touches.length === 2) {
      pinchZooming = true;
      pinchStart.dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchStart.mid = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2
      };
      pinchStart.zoom = zoomTarget;
      pinchStart.pan = { ...panTarget };
      e.preventDefault();
    } else if (e.touches.length === 1 && !cropActive) {
      isImgPanning = true;
      lastPan = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      e.preventDefault();
    }
  }, { passive: false });
  photoPreviewWrapper.addEventListener('touchmove', function(e) {
    if (!imgLoaded) return;
    if (e.touches.length === 2 && pinchZooming) {
      let dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      let scale = dist / pinchStart.dist;
      let newZoom = Math.max(0.1, Math.min(pinchStart.zoom * scale, 8));
      let mid = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2
      };
      panTarget.x = pinchStart.pan.x + (mid.x - pinchStart.mid.x) + (mid.x - photoPreviewWrapper.clientWidth/2) * (1 - newZoom/pinchStart.zoom);
      panTarget.y = pinchStart.pan.y + (mid.y - pinchStart.mid.y) + (mid.y - photoPreviewWrapper.clientHeight/2) * (1 - newZoom/pinchStart.zoom);
      zoomTarget = newZoom;
      updatePreviewTransform();
      renderCanvas();
      e.preventDefault();
    } else if (e.touches.length === 1 && isImgPanning && !cropActive) {
      let dx = e.touches[0].clientX - lastPan.x;
      let dy = e.touches[0].clientY - lastPan.y;
      panTarget.x += dx;
      panTarget.y += dy;
      const maxPanX = Math.max(0, (photoPreview.clientWidth * zoomTarget - photoPreviewWrapper.clientWidth) / 2);
      const maxPanY = Math.max(0, (photoPreview.clientHeight * zoomTarget - photoPreviewWrapper.clientHeight) / 2);
      panTarget.x = clamp(panTarget.x, -maxPanX, maxPanX);
      panTarget.y = clamp(panTarget.y, -maxPanY, maxPanY);

      lastPan = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      updatePreviewTransform();
      renderCanvas();
      e.preventDefault();
    }
  }, { passive: false });
  photoPreviewWrapper.addEventListener('touchend', function(e) {
    if (e.touches.length < 2) pinchZooming = false;
    if (e.touches.length === 0) isImgPanning = false;
  }, { passive: false });
  photoPreviewWrapper.addEventListener('pointerdown', (e) => {
    if (!imgLoaded || (cropActive && e.target === cropBox)) return;
    isImgPanning = true;
    lastPan = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  });
  photoPreviewWrapper.addEventListener('pointermove', (e) => {
    if (isImgPanning && !cropActive) {
      let dx = e.clientX - lastPan.x, dy = e.clientY - lastPan.y;
      panTarget.x += dx;
      panTarget.y += dy;      
      const maxPanX = Math.max(0, (photoPreview.clientWidth * zoomTarget - photoPreviewWrapper.clientWidth) / 2);
      const maxPanY = Math.max(0, (photoPreview.clientHeight * zoomTarget - photoPreviewWrapper.clientHeight) / 2);
      panTarget.x = clamp(panTarget.x, -maxPanX, maxPanX);
      panTarget.y = clamp(panTarget.y, -maxPanY, maxPanY);
      lastPan = { x: e.clientX, y: e.clientY };

      updatePreviewTransform();
      renderCanvas();
      e.preventDefault();
    }
  });
  window.addEventListener('pointerup', () => { isImgPanning = false; });
  photoPreviewWrapper.addEventListener('wheel', (e) => {
    if (!imgLoaded) return;
    e.preventDefault();
    let scale = Math.exp(-e.deltaY / 240000);
    let prevZoom = zoomTarget;
    zoomTarget = Math.max(0.1, Math.min(zoomTarget * scale, 8));
    let rect = photoPreview.getBoundingClientRect();
    let cx = e.clientX - rect.left;
    let cy = e.clientY - rect.top;
    panTarget.x = (panTarget.x - cx) * (zoomTarget / prevZoom) + cx;
    panTarget.y = (panTarget.y - cy) * (zoomTarget / prevZoom) + cy;
    const maxPanX = Math.max(0, (photoPreview.clientWidth * zoomTarget - photoPreviewWrapper.clientWidth) / 2);
    const maxPanY = Math.max(0, (photoPreview.clientHeight * zoomTarget - photoPreviewWrapper.clientHeight) / 2);
    panTarget.x = clamp(panTarget.x, -maxPanX, maxPanX);
    panTarget.y = clamp(panTarget.y, -maxPanY, maxPanY);
    updatePreviewTransform();
    renderCanvas();
  }, { passive: false });

  // ==== Cropping (FULLY RESIZABLE) ====
  let cropOverlay = null;
  function showCropUI(show) {
    if (!cropOverlay) {
      cropOverlay = document.createElement('div');
      cropOverlay.className = 'crop-overlay';
      photoPreviewWrapper.appendChild(cropOverlay);
    }
    cropOverlay.style.display = show ? 'block' : 'none';
    cropBox.classList.toggle('active', show);
  }
  function addCropHandles() {
    cropBox.innerHTML = '';
    ['nw','n','ne','e','se','s','sw','w'].forEach(pos => {
      let h = document.createElement('div');
      h.className = `crop-handle ${pos}`;
      h.dataset.handle = pos;
      cropBox.appendChild(h);
    });
    cropBox.style.cursor = 'move';
    let size = document.createElement('div');
    size.className = 'crop-size-indicator';
    size.id = 'crop-size-indicator';
    cropBox.appendChild(size);
  }
  function updateCropSizeIndicator() {
    const dims = getPhotoDimsPx();
    let w = dims.width, h = dims.height, unitStr = unit;
    if (cropRect) {
      if (unit === 'px') {
        w = Math.round(cropRect.w);
        h = Math.round(cropRect.h);
      } else if (unit === 'mm') {
        w = (cropRect.w * 25.4 / dpi).toFixed(1);
        h = (cropRect.h * 25.4 / dpi).toFixed(1);
      } else {
        w = (cropRect.w / dpi).toFixed(2);
        h = (cropRect.h / dpi).toFixed(2);
      }
    }
    let el = document.getElementById('crop-size-indicator');
    if (el) el.textContent = `${w} × ${h} ${unitStr}`;
  }
  function updateCropBox() {
    if (!cropRect) return;
    cropBox.style.left = cropRect.x + 'px';
    cropBox.style.top = cropRect.y + 'px';
    cropBox.style.width = cropRect.w + 'px';
    cropBox.style.height = cropRect.h + 'px';
    if (!cropBox.querySelector('.crop-handle')) addCropHandles();
    updateCropSizeIndicator();
  }
  let cropDragMode = null, cropStartMouse = null, cropStartRect = null;
  function getPointer(e) {
    if (e.touches && e.touches.length) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }
  function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }
  function cropPointerDown(e) {
    if (!cropActive) return;
    e.preventDefault();
    const pointer = getPointer(e);
    const handle = e.target.classList.contains('crop-handle') ? e.target.dataset.handle : null;
    cropDragMode = handle || 'move';
    cropStartMouse = pointer;
    cropStartRect = { ...cropRect };
    cropBox.classList.add('active');
    document.body.style.userSelect = 'none';
  }
  function cropPointerMove(e) {
    if (!cropActive || !cropDragMode) return;
    e.preventDefault();
    const pointer = getPointer(e);
    let dx = pointer.x - cropStartMouse.x;
    let dy = pointer.y - cropStartMouse.y;
    let pvW = photoPreviewWrapper.clientWidth;
    let pvH = photoPreviewWrapper.clientHeight;
    let dims = getPhotoDimsPx();
    let asp = dims.width / dims.height;
    let minW = 36, minH = minW / asp;
    let r = { ...cropStartRect };
    if (cropDragMode === 'move') {
      r.x = clamp(cropStartRect.x + dx, 0, pvW - r.w);
      r.y = clamp(cropStartRect.y + dy, 0, pvH - r.h);
      cropRect.x = r.x;
      cropRect.y = r.y;
    } else {
      switch (cropDragMode) {
        case 'nw': r.x += dx; r.y += dy; r.w -= dx; r.h -= dy; break;
        case 'n':  r.y += dy; r.h -= dy; break;
        case 'ne': r.y += dy; r.w += dx; r.h -= dy; break;
        case 'e':  r.w += dx; break;
        case 'se': r.w += dx; r.h += dy; break;
        case 's':  r.h += dy; break;
        case 'sw': r.x += dx; r.w -= dx; r.h += dy; break;
        case 'w':  r.x += dx; r.w -= dx; break;
      }
      let newAsp = r.w / r.h;
      if (Math.abs(newAsp - asp) > 0.01) {
        if (['n','s'].includes(cropDragMode)) {
          r.w = r.h * asp;
          if (cropDragMode === 'n') r.x = cropStartRect.x + cropStartRect.w - r.w;
        } else if (['e','w'].includes(cropDragMode)) {
          r.h = r.w / asp;
          if (cropDragMode === 'w') r.y = cropStartRect.y + cropStartRect.h - r.h;
        } else {
          let dw = r.w - cropStartRect.w, dh = r.h - cropStartRect.h;
          if (Math.abs(dw) > Math.abs(dh)) {
            r.h = r.w / asp;
            if (cropDragMode.endsWith('n')) r.y = cropStartRect.y + cropStartRect.h - r.h;
          } else {
            r.w = r.h * asp;
            if (cropDragMode.endsWith('w')) r.x = cropStartRect.x + cropStartRect.w - r.w;
          }
        }
      }
      r.w = Math.max(minW, r.w);
      r.h = Math.max(minH, r.h);
      if (r.x < 0) { r.w += r.x; r.x = 0;}
      if (r.y < 0) { r.h += r.y; r.y = 0;}
      if (r.x + r.w > pvW) r.w = pvW - r.x;
      if (r.y + r.h > pvH) r.h = pvH - r.y;
      cropRect = r;
    }
    updateCropBox();
    updateCropSizeIndicator();
    renderCanvas();
  }
  function cropPointerUp(e) {
    cropDragMode = null;
    document.body.style.userSelect = '';
    cropBox.classList.remove('active');
  }
  cropBox.addEventListener('mousedown', cropPointerDown);
  cropBox.addEventListener('touchstart', cropPointerDown, { passive: false });
  window.addEventListener('mousemove', cropPointerMove);
  window.addEventListener('touchmove', cropPointerMove, { passive: false });
  window.addEventListener('mouseup', cropPointerUp);
  window.addEventListener('touchend', cropPointerUp);

  cropToggleBtn.addEventListener('click', () => {
    cropActive = !cropActive;
    cropToggleBtn.classList.toggle('active', cropActive);
    showCropUI(cropActive);
    if (cropActive) {
      let pvW = photoPreviewWrapper.clientWidth, pvH = photoPreviewWrapper.clientHeight;
      let dims = getPhotoDimsPx();
      let asp = dims.width / dims.height;
      let w = pvW * 0.7, h = pvH * 0.7;
      if (w / h > asp) w = h * asp; else h = w / asp;
      cropRect = { x: (pvW - w)/2, y: (pvH-h)/2, w: w, h: h };
      updateCropBox();
      cropBox.classList.remove('hidden');
      addCropHandles();
      updateCropSizeIndicator();
    } else {
      cropBox.classList.add('hidden');
      showCropUI(false);
    }
    updatePreviewTransform();
  });

  rotateLeftBtn.addEventListener('click', () => {
    rotate = (rotate - 90) % 360;
    snapPreviewTransform();
    renderCanvas();
  });
  rotateRightBtn.addEventListener('click', () => {
    rotate = (rotate + 90) % 360;
    snapPreviewTransform();
    renderCanvas();
  });

  function getCropParams(imgW, imgH) {
    if (cropActive && cropRect) {
      let pvW = photoPreviewWrapper.clientWidth;
      let pvH = photoPreviewWrapper.clientHeight;
      let scale = Math.min(pvW / imgW, pvH / imgH) * zoomTarget;
      let rad = rotate * Math.PI / 180;
      let offsetX = (pvW - imgW * scale) / 2 + panTarget.x;
      let offsetY = (pvH - imgH * scale) / 2 + panTarget.y;
      function inverseTransform(px, py) {
        let cx = px - pvW/2;
        let cy = py - pvH/2;
        let ix = cx * Math.cos(-rad) - cy * Math.sin(-rad);
        let iy = cx * Math.sin(-rad) + cy * Math.cos(-rad);
        ix = ix + pvW/2 - offsetX;
        iy = iy + pvH/2 - offsetY;
        return { x: ix / scale, y: iy / scale };
      }
      let p1 = inverseTransform(cropRect.x, cropRect.y);
      let p2 = inverseTransform(cropRect.x + cropRect.w, cropRect.y);
      let p3 = inverseTransform(cropRect.x, cropRect.y + cropRect.h);
      let p4 = inverseTransform(cropRect.x + cropRect.w, cropRect.y + cropRect.h);
      let xs = [p1.x,p2.x,p3.x,p4.x], ys = [p1.y,p2.y,p3.y,p4.y];
      let sx = Math.max(0, Math.min(...xs));
      let sy = Math.max(0, Math.min(...ys));
      let sw = Math.min(imgW, Math.max(...xs)) - sx;
      let sh = Math.min(imgH, Math.max(...ys)) - sy;
      return { sx, sy, sw, sh };
    }
    let pvW = photoPreviewWrapper.clientWidth, pvH = photoPreviewWrapper.clientHeight;
    let scale = Math.min(pvW / imgW, pvH / imgH) * zoomTarget;
    let offsetX = (pvW - imgW * scale) / 2 + panTarget.x;
    let offsetY = (pvH - imgH * scale) / 2 + panTarget.y;
    let sx = Math.max(0, -offsetX / scale);
    let sy = Math.max(0, -offsetY / scale);
    let sw = Math.min(imgW - sx, pvW / scale);
    let sh = Math.min(imgH - sy, pvH / scale);
    return { sx, sy, sw, sh };
  }

  downloadBtn.addEventListener('click', () => {
    let format = formatSelect.value;
    let link = document.createElement('a');
    link.download = `passport-photo.${format}`;
    link.href = outputCanvas.toDataURL(`image/${format === 'jpg' ? 'jpeg' : 'png'}`, 0.95);
    link.click();
  });
  downloadHQBtn.addEventListener('click', () => {
    let originalText = downloadHQBtn.innerHTML;
    downloadHQBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Processing...';
    downloadHQBtn.disabled = true;
    
    setTimeout(() => {
      let origW = outputCanvas.width, origH = outputCanvas.height;
      outputCanvas.width = origW * 4;
      outputCanvas.height = origH * 4;
      renderCanvas();
      let format = formatSelect.value;
      let link = document.createElement('a');
      link.download = `passport-photo-hq.${format}`;
      link.href = outputCanvas.toDataURL(`image/${format === 'jpg' ? 'jpeg' : 'png'}`, 1.0);
      link.click();
      outputCanvas.width = origW;
      outputCanvas.height = origH;
      renderCanvas();
      
      downloadHQBtn.innerHTML = originalText;
      downloadHQBtn.disabled = false;
    }, 50);
  });
  shareBtn.addEventListener('click', async () => {
    const shareData = {
      title: "Nishix Passport Photo Maker",
      text: "Create passport photos easily! Try Nishix Passport Photo Maker.",
      url: window.location.href
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (e) { }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        shareBtn.innerHTML = '<i class="fa fa-check"></i> Link Copied!';
        setTimeout(() => {
          shareBtn.innerHTML = '<i class="fa fa-share-alt"></i> Share this App';
        }, 1800);
      } catch (e) {
        prompt("Copy this link:", window.location.href);
      }
    }
  });

  function setDefaultMargins() {
    marginTopInput.value = 10;
    marginLeftInput.value = 10;
  }
  function init() {
    if (unitSelect.value === "px") {
      photoWidthInput.value = 300;
      photoHeightInput.value = 400;
    } else {
      photoWidthInput.value = 35;
      photoHeightInput.value = 45;
    }
    customWidthInput.value = 210;
    customHeightInput.value = 297;
    hSpacingInput.value = 10;
    vSpacingInput.value = 10;
    setDefaultMargins();
    autocenterCheck.checked = false;
    if (showCutlinesCheck) showCutlinesCheck.checked = true;
    renderCanvas();
  }
  init();

  function renderCanvas() {
    let dims = getPhotoDimsPx();
    let pageDims = getPageDimsPx();
    let spacing = getSpacingPx();
    let margins = getMarginsPx();
    let np = Math.max(1, parseInt(numPhotosInput.value) || 8);
    let maxCols = Math.floor((pageDims.width - margins.left - margins.right + spacing.h) / (dims.width + spacing.h));
    maxCols = Math.max(1, maxCols);
    let maxRows = Math.floor((pageDims.height - margins.top - margins.bottom + spacing.v) / (dims.height + spacing.v));
    maxRows = Math.max(1, maxRows);
    let maxPhotos = maxCols * maxRows;
    np = Math.min(np, maxPhotos);
    let cols = Math.min(maxCols, np);
    let rows = Math.ceil(np / cols);

    if (autocenterCheck.checked && np <= maxCols * maxRows) {
      let usedW = cols * dims.width + (cols - 1) * spacing.h;
      let usedH = rows * dims.height + (rows - 1) * spacing.v;
      let freeW = Math.max(0, pageDims.width - usedW);
      let freeH = Math.max(0, pageDims.height - usedH);
      margins.left = margins.right = Math.floor(freeW / 2);
      margins.top = margins.bottom = Math.floor(freeH / 2);
      marginTopInput.value = (unit === 'px') ? margins.top : (unit === 'mm' ? (margins.top*25.4/dpi).toFixed(2) : (margins.top/dpi).toFixed(2));
      marginLeftInput.value = (unit === 'px') ? margins.left : (unit === 'mm' ? (margins.left*25.4/dpi).toFixed(2) : (margins.left/dpi).toFixed(2));
    }

    outputCanvas.width = pageDims.width;
    outputCanvas.height = pageDims.height;
    let ctx = outputCanvas.getContext('2d');
    ctx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
    ctx.fillStyle = isDark ? '#23293b' : '#fff';
    ctx.fillRect(0, 0, pageDims.width, pageDims.height);

    let showCutlines = showCutlinesCheck ? showCutlinesCheck.checked : true;
    if (showCutlines) {
      ctx.save();
      ctx.strokeStyle = "#e57300";
      ctx.setLineDash([5, 7]);
      ctx.lineWidth = 1.1;
      for (let c = 1; c < cols; c++) {
        let x = margins.left + c * dims.width + (c - 1) * spacing.h + spacing.h / 2;
        ctx.beginPath();
        ctx.moveTo(x, margins.top);
        ctx.lineTo(x, pageDims.height - margins.bottom);
        ctx.stroke();
      }
      for (let r = 1; r < rows; r++) {
        let y = margins.top + r * dims.height + (r - 1) * spacing.v + spacing.v / 2;
        ctx.beginPath();
        ctx.moveTo(margins.left, y);
        ctx.lineTo(pageDims.width - margins.right, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (imgLoaded) {
      let imgW = imgObj.naturalWidth, imgH = imgObj.naturalHeight;
      let cropParams = getCropParams(imgW, imgH);
      let drawn = 0;
      for (let r = 0; r < rows && drawn < np; r++) {
        for (let c = 0; c < cols && drawn < np; c++, drawn++) {
          let x = margins.left + c * (dims.width + spacing.h);
          let y = margins.top + r * (dims.height + spacing.v);
          ctx.save();
          ctx.drawImage(
            imgObj,
            cropParams.sx, cropParams.sy, cropParams.sw, cropParams.sh,
            x, y, dims.width, dims.height
          );
          ctx.save();
          ctx.strokeStyle = "#111";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([]);
          ctx.strokeRect(x, y, dims.width, dims.height);
          ctx.restore();
          ctx.restore();
        }
      }
    }
    ctx.save();
    ctx.strokeStyle = "#b0bec5";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, pageDims.width, pageDims.height);
    ctx.restore();
  }
});
