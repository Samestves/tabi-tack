// Archivo: js/script.js

document.addEventListener('DOMContentLoaded', () => {
    // Get all necessary elements from the DOM
    const mainContent = document.getElementById('main-content');
    const fileUpload = document.getElementById('file-upload');
    const uploadButton = document.getElementById('upload-button');
    const canvasContainer = document.getElementById('canvas-container');
    const imagePreview = document.getElementById('image-preview');
    const canvas = document.getElementById('canvas');
    const menuToggle = document.getElementById('menu-toggle');
    const elementsPanel = document.getElementById('elements-panel');
    const menuIconOpen = document.getElementById('menu-icon-open');
    const menuIconClose = document.getElementById('menu-icon-close');
    const downloadBtn = document.getElementById('download-btn');
    const captureArea = document.getElementById('capture-area');
    const downloadActions = document.getElementById('download-actions');
    const resetBtn = document.getElementById('reset-btn');
    
    const panelWidth = getComputedStyle(document.documentElement).getPropertyValue('--panel-width');

    // --- Event Listeners Setup ---
    uploadButton.addEventListener('click', () => fileUpload.click());
    fileUpload.addEventListener('change', handleFileSelect);
    downloadBtn.addEventListener('click', downloadImage);
    resetBtn.addEventListener('click', resetEditor);
    
    ['dragover', 'dragleave', 'drop'].forEach(e => document.body.addEventListener(e, preventDefaults));
    
    captureArea.addEventListener('dragover', (e) => {
        preventDefaults(e);
        captureArea.classList.add('drag-over');
    });
    captureArea.addEventListener('dragleave', (e) => {
        preventDefaults(e);
        captureArea.classList.remove('drag-over');
    });
    captureArea.addEventListener('drop', (e) => {
        preventDefaults(e);
        captureArea.classList.remove('drag-over');
        handleDrop(e);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function handleDrop(e) {
        const src = e.dataTransfer.getData('element-src');
        if (src) {
            placeElement(e.clientX, e.clientY, src);
        } else if (e.dataTransfer.files.length) {
            fileUpload.files = e.dataTransfer.files;
            handleFileSelect();
        }
    }

    function handleFileSelect() {
        const file = fileUpload.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreview.onload = () => {
                    uploadButton.classList.add('hidden');
                    canvasContainer.classList.remove('hidden');
                    downloadActions.classList.remove('hidden');
                    downloadActions.classList.add('inline-flex');
                };
            };
            reader.readAsDataURL(file);
        }
    }
    
    function resetEditor() {
        imagePreview.src = '';
        imagePreview.onload = null;
        canvas.innerHTML = '';
        uploadButton.classList.remove('hidden');
        canvasContainer.classList.add('hidden');
        downloadActions.classList.add('hidden');
        downloadActions.classList.remove('inline-flex');
        fileUpload.value = '';
    }
    
    menuToggle.addEventListener('click', () => {
        const isOpen = elementsPanel.classList.toggle('open');
        mainContent.style.width = isOpen ? `calc(100% - ${panelWidth})` : '100%';
        
        menuIconOpen.classList.toggle('opacity-0');
        menuIconClose.classList.toggle('opacity-0');
    });

    document.querySelectorAll('.draggable-item').forEach(item => {
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('element-src', e.currentTarget.dataset.src);
        });
    });

    function getVisibleImageRect() {
        const container = canvas;
        const img = imagePreview;
        if (!img.naturalWidth) return { x: 0, y: 0, width: 0, height: 0 };

        const cW = container.offsetWidth;
        const cH = container.offsetHeight;
        const iW = img.naturalWidth;
        const iH = img.naturalHeight;
        const cRatio = cW / cH;
        const iRatio = iW / iH;

        let width, height, x, y;
        if (iRatio > cRatio) {
            width = cW;
            height = cW / iRatio;
            x = 0;
            y = (cH - height) / 2;
        } else {
            height = cH;
            width = cH * iRatio;
            y = 0;
            x = (cW - width) / 2;
        }
        return { x, y, width, height };
    }

    function placeElement(clientX, clientY, src) {
        const canvasRect = canvas.getBoundingClientRect();
        const imageRect = getVisibleImageRect();
        let x = clientX - canvasRect.left;
        let y = clientY - canvasRect.top;

        if (x < imageRect.x || x > imageRect.x + imageRect.width || y < imageRect.y || y > imageRect.y + imageRect.height) return;

        const newElementContainer = document.createElement('div');
        newElementContainer.classList.add('placed-element');
        newElementContainer.dataset.rotation = "0";
        const newElement = new Image();
        newElement.src = src;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '&#x2715;';
        deleteBtn.classList.add('delete-btn');
        deleteBtn.onclick = () => newElementContainer.remove();

        const rotateBtn = document.createElement('button');
        rotateBtn.classList.add('rotate-btn');
        rotateBtn.title = "Rotate element";
        rotateBtn.innerHTML = `<svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4"/><path d="M12 4V1L8 5"/></svg>`;

        newElementContainer.appendChild(newElement);
        newElementContainer.appendChild(deleteBtn);
        newElementContainer.appendChild(rotateBtn);

        ['tl', 'tr', 'bl', 'br'].forEach(pos => {
            const handle = document.createElement('div');
            handle.classList.add('resize-handle', pos);
            newElementContainer.appendChild(handle);
        });

        newElement.onload = () => {
            const initialWidth = 120;
            newElement.style.width = `100%`;
            newElement.style.height = `100%`;
            const elemHeight = initialWidth * (newElement.naturalHeight / newElement.naturalWidth);
            
            let initialX = x - initialWidth / 2;
            let initialY = y - elemHeight / 2;
            initialX = Math.max(imageRect.x, Math.min(initialX, imageRect.x + imageRect.width - initialWidth));
            initialY = Math.max(imageRect.y, Math.min(initialY, imageRect.y + imageRect.height - elemHeight));
            
            newElementContainer.style.left = `${initialX}px`;
            newElementContainer.style.top = `${initialY}px`;
            newElementContainer.style.width = `${initialWidth}px`;
            newElementContainer.style.height = `${elemHeight}px`;

            makeElementMovable(newElementContainer);
            makeElementResizable(newElementContainer);
            makeElementRotatable(newElementContainer);
            canvas.appendChild(newElementContainer);
        };
    }
    
    function makeElementMovable(element) {
        // Mouse
        element.addEventListener('mousedown', (e) => {
            if (e.target.closest('.resize-handle, .delete-btn, .rotate-btn')) return;
            e.preventDefault();

            let offsetX = e.clientX - element.offsetLeft;
            let offsetY = e.clientY - element.offsetTop;
            element.style.cursor = 'grabbing';
            element.style.zIndex = 10;

            function mouseMoveHandler(e) {
                const imageRect = getVisibleImageRect();
                let newX = e.clientX - offsetX;
                let newY = e.clientY - offsetY;

                newX = Math.max(imageRect.x, Math.min(newX, imageRect.x + imageRect.width - element.offsetWidth));
                newY = Math.max(imageRect.y, Math.min(newY, imageRect.y + imageRect.height - element.offsetHeight));

                element.style.left = `${newX}px`;
                element.style.top = `${newY}px`;
            }

            function mouseUpHandler() {
                element.style.cursor = 'move';
                element.style.zIndex = 1;
                document.removeEventListener('mousemove', mouseMoveHandler);
                document.removeEventListener('mouseup', mouseUpHandler);
            }

            document.addEventListener('mousemove', mouseMoveHandler);
            document.addEventListener('mouseup', mouseUpHandler);
        });

        // Touch
        element.addEventListener('touchstart', (e) => {
            if (e.target.closest('.resize-handle, .delete-btn, .rotate-btn')) return;
            e.preventDefault();

            const touch = e.touches[0];
            let offsetX = touch.clientX - element.offsetLeft;
            let offsetY = touch.clientY - element.offsetTop;
            element.style.cursor = 'grabbing';
            element.style.zIndex = 10;

            function touchMoveHandler(e) {
                const imageRect = getVisibleImageRect();
                const touch = e.touches[0];
                let newX = touch.clientX - offsetX;
                let newY = touch.clientY - offsetY;

                newX = Math.max(imageRect.x, Math.min(newX, imageRect.x + imageRect.width - element.offsetWidth));
                newY = Math.max(imageRect.y, Math.min(newY, imageRect.y + imageRect.height - element.offsetHeight));

                element.style.left = `${newX}px`;
                element.style.top = `${newY}px`;
            }

            function touchEndHandler() {
                element.style.cursor = 'move';
                element.style.zIndex = 1;
                document.removeEventListener('touchmove', touchMoveHandler);
                document.removeEventListener('touchend', touchEndHandler);
            }

            document.addEventListener('touchmove', touchMoveHandler, { passive: false });
            document.addEventListener('touchend', touchEndHandler);
        }, { passive: false });
    }

    function makeElementResizable(element) {
        const handles = element.querySelectorAll('.resize-handle');
        handles.forEach(handle => {
            // Mouse
            handle.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();

                let startX = e.clientX;
                let startWidth = parseInt(document.defaultView.getComputedStyle(element).width, 10);
                let startHeight = parseInt(document.defaultView.getComputedStyle(element).height, 10);
                let startLeft = element.offsetLeft;
                let startTop = element.offsetTop;
                const aspectRatio = startWidth / startHeight;

                function mouseMoveHandler(e) {
                    const imageRect = getVisibleImageRect();
                    let newWidth, newHeight, newLeft, newTop;
                    const dx = e.clientX - startX;

                    if (handle.classList.contains('br')) {
                        newWidth = startWidth + dx;
                    } else if (handle.classList.contains('bl')) {
                        newWidth = startWidth - dx;
                    } else if (handle.classList.contains('tr')) {
                        newWidth = startWidth + dx;
                    } else { // tl
                        newWidth = startWidth - dx;
                    }

                    newHeight = newWidth / aspectRatio;

                    if (handle.classList.contains('bl') || handle.classList.contains('tl')){
                        newLeft = startLeft + (startWidth - newWidth);
                    } else {
                        newLeft = startLeft;
                    }

                    if (handle.classList.contains('tr') || handle.classList.contains('tl')){
                        newTop = startTop + (startHeight - newHeight);
                    } else {
                        newTop = startTop;
                    }

                    if (newWidth > 30 && newHeight > 30 &&
                        newLeft >= imageRect.x &&
                        newTop >= imageRect.y &&
                        newLeft + newWidth <= imageRect.x + imageRect.width &&
                        newTop + newHeight <= imageRect.y + imageRect.height) 
                    {
                        element.style.width = newWidth + 'px';
                        element.style.height = newHeight + 'px';
                        element.style.left = newLeft + 'px';
                        element.style.top = newTop + 'px';
                    }
                }

                function mouseUpHandler() {
                    document.removeEventListener('mousemove', mouseMoveHandler);
                    document.removeEventListener('mouseup', mouseUpHandler);
                }

                document.addEventListener('mousemove', mouseMoveHandler);
                document.addEventListener('mouseup', mouseUpHandler);
            });

            // Touch
            handle.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const touch = e.touches[0];
                let startX = touch.clientX;
                let startWidth = parseInt(document.defaultView.getComputedStyle(element).width, 10);
                let startHeight = parseInt(document.defaultView.getComputedStyle(element).height, 10);
                let startLeft = element.offsetLeft;
                let startTop = element.offsetTop;
                const aspectRatio = startWidth / startHeight;

                function touchMoveHandler(e) {
                    const imageRect = getVisibleImageRect();
                    const touch = e.touches[0];
                    let newWidth, newHeight, newLeft, newTop;
                    const dx = touch.clientX - startX;

                    if (handle.classList.contains('br')) {
                        newWidth = startWidth + dx;
                    } else if (handle.classList.contains('bl')) {
                        newWidth = startWidth - dx;
                    } else if (handle.classList.contains('tr')) {
                        newWidth = startWidth + dx;
                    } else { // tl
                        newWidth = startWidth - dx;
                    }

                    newHeight = newWidth / aspectRatio;

                    if (handle.classList.contains('bl') || handle.classList.contains('tl')){
                        newLeft = startLeft + (startWidth - newWidth);
                    } else {
                        newLeft = startLeft;
                    }

                    if (handle.classList.contains('tr') || handle.classList.contains('tl')){
                        newTop = startTop + (startHeight - newHeight);
                    } else {
                        newTop = startTop;
                    }

                    if (newWidth > 30 && newHeight > 30 &&
                        newLeft >= imageRect.x &&
                        newTop >= imageRect.y &&
                        newLeft + newWidth <= imageRect.x + imageRect.width &&
                        newTop + newHeight <= imageRect.y + imageRect.height) 
                    {
                        element.style.width = newWidth + 'px';
                        element.style.height = newHeight + 'px';
                        element.style.left = newLeft + 'px';
                        element.style.top = newTop + 'px';
                    }
                }

                function touchEndHandler() {
                    document.removeEventListener('touchmove', touchMoveHandler);
                    document.removeEventListener('touchend', touchEndHandler);
                }

                document.addEventListener('touchmove', touchMoveHandler, { passive: false });
                document.addEventListener('touchend', touchEndHandler);
            }, { passive: false });
        });
    }

    function makeElementRotatable(element) {
        const rotateHandle = element.querySelector('.rotate-btn');
        // Mouse
        rotateHandle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const startAngleRad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
            const initialRotationDeg = parseFloat(element.dataset.rotation);

            function mouseMoveHandler(moveEvent) {
                const moveAngleRad = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX);
                const angleDifferenceDeg = (moveAngleRad - startAngleRad) * (180 / Math.PI);
                const newRotation = initialRotationDeg + angleDifferenceDeg;

                element.style.transform = `rotate(${newRotation}deg)`;
                element.dataset.rotation = newRotation;
            }

            function mouseUpHandler() {
                document.removeEventListener('mousemove', mouseMoveHandler);
                document.removeEventListener('mouseup', mouseUpHandler);
            }

            document.addEventListener('mousemove', mouseMoveHandler);
            document.addEventListener('mouseup', mouseUpHandler);
        });

        // Touch
        rotateHandle.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const touch = e.touches[0];
            const startAngleRad = Math.atan2(touch.clientY - centerY, touch.clientX - centerX);
            const initialRotationDeg = parseFloat(element.dataset.rotation);

            function touchMoveHandler(e) {
                const touch = e.touches[0];
                const moveAngleRad = Math.atan2(touch.clientY - centerY, touch.clientX - centerX);
                const angleDifferenceDeg = (moveAngleRad - startAngleRad) * (180 / Math.PI);
                const newRotation = initialRotationDeg + angleDifferenceDeg;

                element.style.transform = `rotate(${newRotation}deg)`;
                element.dataset.rotation = newRotation;
            }

            function touchEndHandler() {
                document.removeEventListener('touchmove', touchMoveHandler);
                document.removeEventListener('touchend', touchEndHandler);
            }

            document.addEventListener('touchmove', touchMoveHandler, { passive: false });
            document.addEventListener('touchend', touchEndHandler);
        }, { passive: false });
    }
    
    function downloadImage() {
        captureArea.classList.add('is-capturing');

        // 1. Obtén la imagen y el canvas de stickers
        const image = document.getElementById('image-preview');
        const stickers = Array.from(canvas.querySelectorAll('.placed-element'));

        // 2. Crea un contenedor temporal con el tamaño real de la imagen
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'fixed';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '0';
        tempContainer.style.width = image.naturalWidth + 'px';
        tempContainer.style.height = image.naturalHeight + 'px';
        tempContainer.style.overflow = 'hidden';
        tempContainer.style.background = 'transparent';

        // 3. Clona la imagen y ajústala al tamaño natural
        const imgClone = image.cloneNode(true);
        imgClone.style.width = image.naturalWidth + 'px';
        imgClone.style.height = image.naturalHeight + 'px';
        imgClone.style.position = 'absolute';
        imgClone.style.left = '0';
        imgClone.style.top = '0';
        tempContainer.appendChild(imgClone);

        // 4. Clona los stickers y ajústalos proporcionalmente
        const imageRect = getVisibleImageRect();
        const scaleX = image.naturalWidth / imageRect.width;
        const scaleY = image.naturalHeight / imageRect.height;

        stickers.forEach(sticker => {
            const clone = sticker.cloneNode(true);
            // Ajusta la posición y tamaño proporcionalmente SOLO respecto al área visible de la imagen
            const left = parseFloat(sticker.style.left) - imageRect.x;
            const top = parseFloat(sticker.style.top) - imageRect.y;
            clone.style.left = (left * scaleX) + 'px';
            clone.style.top = (top * scaleY) + 'px';
            clone.style.width = (parseFloat(sticker.style.width) * scaleX) + 'px';
            clone.style.height = (parseFloat(sticker.style.height) * scaleY) + 'px';
            clone.style.transform = sticker.style.transform; // mantiene la rotación
            tempContainer.appendChild(clone);
        });

        document.body.appendChild(tempContainer);

        // 5. Usa html2canvas sobre el contenedor temporal
        const exportScale = 2; // o 3 para aún más HD

        html2canvas(tempContainer, {
            backgroundColor: null,
            logging: false,
            useCORS: true,
            width: image.naturalWidth,
            height: image.naturalHeight,
            scale: exportScale
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = 'tabi-edit.png';
            link.href = canvas.toDataURL('image/png');
            link.click();

            captureArea.classList.remove('is-capturing');
            document.body.removeChild(tempContainer);
        }).catch(err => {
            console.error("Oops, html2canvas failed!", err);
            captureArea.classList.remove('is-capturing');
            document.body.removeChild(tempContainer);
        });
    }

    // Quesito flotante animado
    const cheese = document.getElementById('cheese-float');
    if (cheese) {
        let cheeseTimeout = null;

        cheese.style.transform = 'translateY(25%)';

        cheese.addEventListener('click', () => {
            cheese.style.transform = 'translateY(0)';
            cheese.style.opacity = '1';

            clearTimeout(cheeseTimeout);
            cheeseTimeout = setTimeout(() => {
                cheese.style.transform = 'translateY(25%)';
                cheese.style.opacity = '0.8';
            }, 3500);
        });
    }

    // --- Mobile panel logic ---
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobilePanel = document.getElementById('mobile-elements-panel');
    const mobilePanelClose = document.getElementById('mobile-panel-close');

    if (mobileMenuToggle && mobilePanel && mobilePanelClose) {
        mobileMenuToggle.addEventListener('click', () => {
            mobilePanel.classList.add('open');
        });
        mobilePanelClose.addEventListener('click', () => {
            mobilePanel.classList.remove('open');
        });
        // Permitir drag de stickers en móvil igual que en desktop
        mobilePanel.querySelectorAll('.draggable-item').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('element-src', e.currentTarget.dataset.src);
            });
        });
    }

    // --- Mobile sticker tap-to-place logic ---
    const mobileStickers = document.getElementById('mobile-stickers');

    if (mobileStickers && imagePreview && canvas) {
        mobileStickers.addEventListener('click', function(e) {
            const sticker = e.target.closest('.draggable-item');
            if (!sticker) return;
            // Solo si hay imagen cargada
            if (!imagePreview.src || imagePreview.src === window.location.href) return;

            // Calcula el centro del canvas para colocar el sticker
            const canvasRect = canvas.getBoundingClientRect();
            const centerX = canvasRect.width / 2;
            const centerY = canvasRect.height / 2;

            // Usa el src del sticker
            const src = sticker.dataset.src;
            if (!src) return;

            // Usa tu función existente para colocar el sticker
            placeElement(canvasRect.left + centerX, canvasRect.top + centerY, src);

            // Cierra el panel móvil con animación
            mobilePanel.classList.remove('open');
        });
    }

    // Copiar stickers del panel de escritorio al panel móvil automáticamente
    const desktopStickersGrid = document.querySelector('#elements-panel .grid');
    const mobileStickersGrid = document.getElementById('mobile-stickers');
    if (desktopStickersGrid && mobileStickersGrid) {
        mobileStickersGrid.innerHTML = desktopStickersGrid.innerHTML;
    }

    // Asignar dragstart a todos los stickers generados dinámicamente
    function assignDragEventsToStickers() {
        document.querySelectorAll('.draggable-item').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('element-src', e.currentTarget.dataset.src);
            });
        });
    }

    // Generar stickers automáticamente
    const stickersGrid = document.querySelector('#elements-panel .grid');
    if (stickersGrid) {
        // Primer sticker especial (angry)
        stickersGrid.innerHTML = `
            <div class="draggable-item bg-white p-4 w-full max-w-[220px] h-48 flex items-center justify-center rounded-2xl border-2 border-red-400 cursor-grab" draggable="true" data-src="imgs/1.png">
                <img src="imgs/red/angry.png" alt="Stylized red abstract shape resembling an angry face with furrowed brows, set against a plain background, conveying a strong and intense emotional tone" class="max-w-[80%] max-h-[80%] mx-auto my-auto object-contain pointer-events-none">
            </div>
        `;
        // Stickers del 1 al 37
        for (let i = 1; i <= 37; i++) {
            stickersGrid.innerHTML += `
                <div class="draggable-item bg-white p-4 w-full max-w-[220px] h-48 flex items-center justify-center rounded-2xl border-2 border-red-400 cursor-grab" draggable="true" data-src="imgs/red/${i}.png">
                    <img src="imgs/red/${i}.png" alt="Red Sticker ${i}" class="max-w-[80%] max-h-[80%] mx-auto my-auto object-contain pointer-events-none">
                </div>
            `;
        }
    }

    // Copiar stickers al panel móvil
    if (stickersGrid && mobileStickersGrid) {
        mobileStickersGrid.innerHTML = stickersGrid.innerHTML;
    }

    // Asigna los eventos dragstart a todos los stickers generados
    assignDragEventsToStickers();

    // Permitir colocar sticker con click en escritorio
    if (stickersGrid && imagePreview && canvas) {
        stickersGrid.addEventListener('click', function(e) {
            const sticker = e.target.closest('.draggable-item');
            if (!sticker) return;
            // Solo si hay imagen cargada
            if (!imagePreview.src || imagePreview.src === window.location.href) return;

            // Calcula el centro del canvas para colocar el sticker
            const canvasRect = canvas.getBoundingClientRect();
            const centerX = canvasRect.left + canvasRect.width / 2;
            const centerY = canvasRect.top + canvasRect.height / 2;

            // Usa el src del sticker
            const src = sticker.dataset.src;
            if (!src) return;

            // Usa tu función existente para colocar el sticker
            placeElement(centerX, centerY, src);
        });
    }
});