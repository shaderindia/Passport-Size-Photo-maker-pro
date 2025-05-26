photoUploadInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        // Validate file type
        if (!file.type.match('image.*')) {
            showMessage('Please select a valid image file (JPEG, PNG, etc.)');
            return;
        }

        showLoading('Loading image...');
        nextToConfigurePreviewBtn.disabled = true;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            originalImage = new Image();
            originalImage.onload = () => {
                // Reset zoom and position
                currentZoom = 1.0;
                imgCurrentX = 0;
                imgCurrentY = 0;
                
                // Set up crop container
                cropContainer.classList.remove('hidden');
                uploadedImage.src = originalImage.src;
                uploadedImage.classList.remove('hidden');
                
                // Calculate initial crop area size based on passport photo aspect ratio
                const containerWidth = cropContainer.offsetWidth;
                const containerHeight = cropContainer.offsetHeight;
                
                let initialCropWidth = Math.min(containerWidth * 0.7, 300);
                let initialCropHeight = initialCropWidth / passportPhotoAspectRatio;
                
                if (initialCropHeight > containerHeight * 0.7) {
                    initialCropHeight = Math.min(containerHeight * 0.7, 400);
                    initialCropWidth = initialCropHeight * passportPhotoAspectRatio;
                }
                
                cropRect = {
                    x: (containerWidth - initialCropWidth) / 2,
                    y: (containerHeight - initialCropHeight) / 2,
                    width: initialCropWidth,
                    height: initialCropHeight
                };
                
                updateCropAreaStyle();
                
                // Calculate zoom to make image fit the crop area
                const imgAspect = originalImage.width / originalImage.height;
                const cropAspect = cropRect.width / cropRect.height;
                
                let zoom;
                if (imgAspect > cropAspect) {
                    // Image is wider than crop area - fit to width
                    zoom = cropRect.width / originalImage.width;
                } else {
                    // Image is taller than crop area - fit to height
                    zoom = cropRect.height / originalImage.height;
                }
                
                currentZoom = zoom;
                updateZoomLevelDisplay();
                
                // Set image dimensions and position
                const displayWidth = originalImage.width * currentZoom;
                const displayHeight = originalImage.height * currentZoom;
                
                uploadedImage.style.width = `${displayWidth}px`;
                uploadedImage.style.height = `${displayHeight}px`;
                
                // Center image in crop area
                imgCurrentX = cropRect.x + (cropRect.width - displayWidth) / 2;
                imgCurrentY = cropRect.y + (cropRect.height - displayHeight) / 2;
                
                uploadedImage.style.left = `${imgCurrentX}px`;
                uploadedImage.style.top = `${imgCurrentY}px`;
                
                nextToConfigurePreviewBtn.disabled = false;
                hideLoading();
            };
            
            originalImage.onerror = () => {
                hideLoading();
                showMessage('Failed to load image. Please try a different file.');
                nextToConfigurePreviewBtn.disabled = true;
                uploadedImage.classList.add('hidden');
                cropContainer.classList.add('hidden');
            };
            
            originalImage.src = e.target.result;
        };
        
        reader.onerror = () => {
            hideLoading();
            showMessage('Error reading file. Please try again.');
            nextToConfigurePreviewBtn.disabled = true;
            uploadedImage.classList.add('hidden');
            cropContainer.classList.add('hidden');
        };
        
        reader.readAsDataURL(file);
    } else {
        uploadedImage.classList.add('hidden');
        cropContainer.classList.add('hidden');
        nextToConfigurePreviewBtn.disabled = true;
        originalImage = null;
        croppedImageDataURL = null;
        croppedImage = null;
    }
});
