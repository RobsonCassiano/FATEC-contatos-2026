'use strict'

export function preview ({target}) {
    const previewImg = document.getElementById('preview-image')
    if (target.files && target.files[0]) {
        previewImg.src = URL.createObjectURL(target.files[0])
        previewImg.style.display = 'block'
    }
}

const previewInput = document.getElementById('preview-input')
if (previewInput) {
    previewInput.addEventListener('change', preview)
}