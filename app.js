'use strict'
import {
  atualizarContato,
  criarContato,
  deletarContato,
  getContatos
} from "./contatos.js"

import{
 preview 
} from "./preview.js"


const form = document.getElementById("contact-form")
const contactList = document.getElementById("contact-list")
const statusMessage = document.getElementById("status")
const formTitle = document.getElementById("form-title")
const submitButton = document.getElementById("submit-button")
const cancelEditButton = document.getElementById("cancel-edit")
const refreshListButton = document.getElementById("refresh-list")
const contactIdInput = document.getElementById("contact-id")

const fieldIds = ["nome", "celular", "email", "endereco", "cidade"]
const fields = Object.fromEntries(
  fieldIds.map((field) => [field, document.getElementById(field)])
)
const fotoInput = document.getElementById("preview-input")
const imageSearchInput = document.getElementById("image-search-input")
const searchImagesBtn = document.getElementById("search-images-btn")
const searchResults = document.getElementById("search-results")
const contactListSearch = document.getElementById("contact-list-search")

let contatos = []
let selectedImageUrl = null
let originalFoto = null

function setStatus(message, type = "") {
  statusMessage.textContent = message
  statusMessage.className = `status${type ? ` ${type}` : ""}`
}

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function searchImages(query) {
  try {
    setStatus("Buscando avatares...", "")

    searchResults.textContent = ""

    // lista 12 avatares com base no termo digitado
    const avatars = Array.from({ length: 12 }, (_, index) => ({
      url: `https://api.dicebear.com/9.x/adventurer/svg?seed=${query}-${index}`
    }))

    displayImageResults(avatars)

    setStatus(`${avatars.length} avatar(es) encontrado(s).`, "success")

  } catch (error) {
    console.error(error)

    setStatus(
      "Erro ao gerar avatares.",
      "error"
    )

    const errorElement = document.createElement("p")
    errorElement.textContent = "Erro ao carregar avatares"
    errorElement.style.gridColumn = "1 / -1"
    errorElement.style.color = "var(--danger)"
    errorElement.style.textAlign = "center"

    searchResults.appendChild(errorElement)
    searchResults.style.display = "grid"
  }
}

function displayImageResults(images) {
  searchResults.textContent = ""

  if (images.length === 0) {

    const message = document.createElement("p")

    message.textContent = "Nenhuma imagem encontrada"

    message.style.gridColumn = "1 / -1"
    message.style.color = "var(--gray)"
    message.style.textAlign = "center"

    searchResults.appendChild(message)

    searchResults.style.display = "grid"

    return
  }

  images.forEach((image) => {
    const thumb = document.createElement("div")
    thumb.className = "image-thumb"

    const img = document.createElement("img")
    const urlPreview = image.url || (image.src ? image.src.small : "")
    const urlFull = image.url || (image.src ? image.src.medium : "")

    img.src = urlPreview
    img.alt = image.url ? "Avatar" : "Imagem"

    thumb.appendChild(img)

    thumb.addEventListener("click", () => {
      selectImage(urlFull, thumb)
    })

    searchResults.appendChild(thumb)
  })

  searchResults.style.display = "grid"

    return
  }

function selectImage(imageUrl, thumbElement) {
  selectedImageUrl = imageUrl
  
  // Remover seleção anterior
  document.querySelectorAll(".image-thumb").forEach(thumb => {
    thumb.classList.remove("selected")
  })
  
  // Adicionar nova seleção
  thumbElement.classList.add("selected")
  
  // Exibir preview
  const previewImg = document.getElementById("preview-image")
  previewImg.src = imageUrl
  previewImg.style.display = "block"

  // Esconder a lista de sugestões após a seleção
  searchResults.style.display = "none"
}

async function getFormData() {
  let foto = selectedImageUrl || ""
  
  if (!foto && fotoInput.files && fotoInput.files[0]) {
    foto = await fileToBase64(fotoInput.files[0])
  }
  
  // Se estiver editando e não houver nova foto, manter a foto anterior
  if (!foto && originalFoto) {
    foto = originalFoto
  }
  
  return {
    nome: fields.nome.value.trim(),
    celular: fields.celular.value.trim(),
    foto: foto,
    email: fields.email.value.trim(),
    endereco: fields.endereco.value.trim(),
    cidade: fields.cidade.value.trim()
  }
}

function resetForm() {
  form.reset()
  contactIdInput.value = ""
  formTitle.textContent = "Novo contato"
  submitButton.textContent = "Salvar contato"
  cancelEditButton.classList.add("hidden")
  
  selectedImageUrl = null
  originalFoto = null
  imageSearchInput.value = ""
  searchResults.textContent = ""
  searchResults.style.display = "none"
  
  const previewImg = document.getElementById("preview-image")
  if (previewImg) {
    previewImg.src = ""
    previewImg.style.display = "none"
  }
}

function fillForm(contato) {
  contactIdInput.value = contato.id
  originalFoto = contato.foto || null
  fieldIds.forEach((field) => {
    fields[field].value = contato[field] ?? ""
  })

  const previewImg = document.getElementById("preview-image")
  if (previewImg && contato.foto) {
    previewImg.src = contato.foto
    previewImg.style.display = "block"
  }

  formTitle.textContent = "Editar contato"
  submitButton.textContent = "Atualizar contato"
  cancelEditButton.classList.remove("hidden")
  window.scrollTo({ top: 0, behavior: "smooth" })
}

function createContactCard(contato) {
  const article = document.createElement("article")
  article.className = "contact-card"

  article.innerHTML = `
    <img src="${contato.foto}" alt="Foto de ${contato.nome}">
    <div class="contact-info">
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <h3 style="margin: 0;">${contato.nome}</h3>
          <div class="card-actions" style="display: flex; gap: 16px; margin-top: 0;">
            <button class="edit" type="button">Editar</button>
            <button class="delete" type="button">Excluir</button>
          </div>
      </div>
      <div class="contact-details" style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px;">
        <p><strong>Telefone:</strong> ${contato.celular}</p>
        <p><strong>E-mail:</strong> ${contato.email}</p>
        <p><strong>Cidade:</strong> ${contato.cidade}</p>
        <p><strong>Endereço:</strong> ${contato.endereco}</p>
      </div>
    </div>
  `

  article.querySelector(".edit").addEventListener("click", () => fillForm(contato))
  article.querySelector(".delete").addEventListener("click", async () => {
    const confirmDelete = window.confirm(`Deseja realmente excluir ${contato.nome}?`)

    if (!confirmDelete) {
      return
    }

    try {
      setStatus("Excluindo contato...", "")
      await deletarContato(contato.id)
      setStatus("Contato excluido com sucesso.", "success")
      await loadContacts()

      if (contactIdInput.value === String(contato.id)) {
        resetForm()
      }
    } catch (error) {
      setStatus(error.message || "Nao foi possivel excluir o contato.", "error")
    }
  })

  return article
}

function renderContacts() {
  contactList.replaceChildren()
  
  const searchTerm = contactListSearch.value.toLowerCase()
  const filteredContatos = contatos.filter(contato => 
    contato.nome.toLowerCase().includes(searchTerm)
  )

  if (filteredContatos.length === 0) {
    const emptyState = document.createElement("div")
    emptyState.className = "empty-state"
    emptyState.textContent = contatos.length === 0 
      ? "Nenhum contato encontrado. Cadastre o primeiro contato no formulario ao lado."
      : "Nenhum contato corresponde à sua busca."
    contactList.append(emptyState)
    return
  }

  const cards = filteredContatos.map(createContactCard)
  contactList.append(...cards)
}

async function loadContacts() {
  try {
    setStatus("Carregando contatos...", "")
    contatos = await getContatos()
    // Ordenação Alfabética
    contatos.sort((a, b) => a.nome.localeCompare(b.nome))
    renderContacts()
    setStatus(`${contatos.length} contato(s) carregado(s).`, "success")
  } catch (error) {
    contactList.replaceChildren()
    setStatus(error.message || "Nao foi possivel carregar os contatos.", "error")
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault()

  const contato = await getFormData()
  const editingId = contactIdInput.value

  try {
    setStatus(editingId ? "Atualizando contato..." : "Criando contato...", "")

    if (editingId) {
      await atualizarContato(editingId, contato)
      setStatus("Contato atualizado com sucesso.", "success")
    } else {
      await criarContato(contato)
      setStatus("Contato cadastrado com sucesso.", "success")
    }

    resetForm()
    await loadContacts()
  } catch (error) {
    setStatus(error.message || "Nao foi possivel salvar o contato.", "error")
  }
})

cancelEditButton.addEventListener("click", () => {
  resetForm()
  setStatus("Edicao cancelada.", "")
})

refreshListButton.addEventListener("click", () => {
  loadContacts()
})

searchImagesBtn.addEventListener("click", () => {
  const query = imageSearchInput.value.trim()
  if (query) {
    imageSearchInput.classList.remove("input-error")
    searchImages(query)
  } else {
    setStatus("Por favor, digite uma palavra-chave para buscar um avatar.", "error")
    imageSearchInput.classList.add("input-error")
    imageSearchInput.focus()
  }
})

imageSearchInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    const query = imageSearchInput.value.trim()
    if (query) {
      imageSearchInput.classList.remove("input-error")
      searchImages(query)
    } else {
      setStatus("Por favor, digite uma palavra-chave para buscar um avatar.", "error")
      imageSearchInput.classList.add("input-error")
      imageSearchInput.focus()
    }
  }
})

// Limpa as sugestões de avatares se o usuário apagar o texto da busca
imageSearchInput.addEventListener("input", () => {
  imageSearchInput.classList.remove("input-error")
  if (imageSearchInput.value.trim() === "") {
    searchResults.innerHTML = ""
    searchResults.style.display = "none"
  }
})

// Ouvinte para filtrar a lista em tempo real
contactListSearch.addEventListener("input", renderContacts)

// Drag and Drop para o campo de foto
const uploadWrapper = document.querySelector(".upload-wrapper")

uploadWrapper.addEventListener("dragover", (event) => {
  event.preventDefault()
  uploadWrapper.classList.add("dragging")
})

uploadWrapper.addEventListener("dragleave", () => {
  uploadWrapper.classList.remove("dragging")
})

uploadWrapper.addEventListener("drop", (event) => {
  event.preventDefault()
  uploadWrapper.classList.remove("dragging")

  const files = event.dataTransfer.files
  if (files && files[0] && files[0].type.startsWith("image/")) {
    fotoInput.files = files
    fotoInput.dispatchEvent(new Event("change", { bubbles: true }))
  }
})

resetForm()
loadContacts()
