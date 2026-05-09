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

let contatos = []
let selectedImageUrl = null

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
    setStatus("Buscando imagens...", "")
    
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=12`,
      {
        headers: {
          "Authorization": "UKgVGgLe9WK8X7H6K5tVMMKjNQ7TQpfB5p3xfPvg0VL9sRfN7S2T8K"
        }
      }
    )
    
    if (!response.ok) {
      throw new Error(`Erro ${response.status}: Falha ao buscar imagens`)
    }
    
    const data = await response.json()
    
    if (!data.photos || data.photos.length === 0) {
      searchResults.innerHTML = '<p style="grid-column: 1/-1; color: var(--muted); text-align: center;">Nenhuma imagem encontrada</p>'
      searchResults.style.display = "grid"
      setStatus("Nenhuma imagem encontrada para essa busca.", "")
      return
    }
    
    displayImageResults(data.photos)
    setStatus(`${data.photos.length} imagem(ns) encontrada(s).`, "success")
  } catch (error) {
    console.error("Erro na busca:", error)
    setStatus(error.message || "Erro ao buscar imagens. Tente novamente.", "error")
    searchResults.innerHTML = '<p style="grid-column: 1/-1; color: var(--danger); text-align: center;">Erro ao carregar imagens</p>'
    searchResults.style.display = "grid"
  }
}

function displayImageResults(images) {
  searchResults.innerHTML = ""
  
  if (images.length === 0) {
    searchResults.innerHTML = '<p style="grid-column: 1/-1; color: var(--muted); text-align: center;">Nenhuma imagem encontrada</p>'
    searchResults.style.display = "grid"
    return
  }
  
  images.forEach((image) => {
    const thumb = document.createElement("div")
    thumb.className = "image-thumb"
    thumb.innerHTML = `<img src="${image.src.small}" alt="Foto por ${image.photographer || 'Pexels'}">`
    
    thumb.addEventListener("click", () => {
      selectImage(image.src.medium, thumb)
    })
    
    searchResults.appendChild(thumb)
  })
  
  searchResults.style.display = "grid"
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
}

async function getFormData() {
  let foto = selectedImageUrl || ""
  
  if (!foto && fotoInput.files && fotoInput.files[0]) {
    foto = await fileToBase64(fotoInput.files[0])
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
  imageSearchInput.value = ""
  searchResults.innerHTML = ""
  searchResults.style.display = "none"
  
  const previewImg = document.getElementById("preview-image")
  if (previewImg) {
    previewImg.src = ""
    previewImg.style.display = "none"
  }
}

function fillForm(contato) {
  contactIdInput.value = contato.id
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
      <h3>${contato.nome}</h3>
      <p><strong>Celular:</strong> ${contato.celular}</p>
      <p><strong>E-mail:</strong> ${contato.email}</p>
      <p><strong>Endereco:</strong> ${contato.endereco}</p>
      <p><strong>Cidade:</strong> ${contato.cidade}</p>
      <div class="card-actions">
        <button class="edit" type="button">Editar</button>
        <button class="delete" type="button">Excluir</button>
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

  if (contatos.length === 0) {
    const emptyState = document.createElement("div")
    emptyState.className = "empty-state"
    emptyState.textContent = "Nenhum contato encontrado. Cadastre o primeiro contato no formulario ao lado."
    contactList.append(emptyState)
    return
  }

  const cards = contatos.map(createContactCard)
  contactList.append(...cards)
}

async function loadContacts() {
  try {
    setStatus("Carregando contatos...", "")
    contatos = await getContatos()
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
    searchImages(query)
  }
})

imageSearchInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    const query = imageSearchInput.value.trim()
    if (query) {
      searchImages(query)
    }
  }
})

resetForm()
loadContacts()
