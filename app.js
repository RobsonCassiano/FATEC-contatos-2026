'use strict'
import {
  atualizarContato,
  criarContato,
  deletarContato,
  getContatos
} from "./contatos.js"

import {
  uploadParaCloudinary
} from "./cloudinary.js"

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
const logoutButton = document.getElementById("logout-button")

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
    errorElement.className = "feedback-message error"
    errorElement.textContent = "Erro ao carregar avatares"

    searchResults.appendChild(errorElement)
    searchResults.style.display = "grid"
  }
}

function displayImageResults(images) {
  searchResults.textContent = ""

  if (images.length === 0) {
    const message = document.createElement("p")
    message.className = "feedback-message info"
    message.textContent = "Nenhuma imagem encontrada"

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
    try {
      const cloudinaryResponse = await uploadParaCloudinary(fotoInput.files[0])
      foto = cloudinaryResponse.secure_url
    } catch (error) {
      console.error("Erro no upload:", error)
      throw new Error("Falha ao enviar imagem para o Cloudinary")
    }
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

  // Imagem
  const img = document.createElement("img")
  img.src = contato.foto
  img.alt = `Foto de ${contato.nome}`

  // Container info
  const contactInfo = document.createElement("div")
  contactInfo.className = "contact-info"

  // Header
  const cardHeader = document.createElement("div")
  cardHeader.className = "card-header"
  // Nome
  const title = document.createElement("h3")
  title.textContent = contato.nome

  // Actions
  const cardActions = document.createElement("div")
  cardActions.className = "card-actions"

  cardActions.style.display = "flex"
  cardActions.style.gap = "16px"

  // Botão editar
  const editButton = document.createElement("button")
  editButton.className = "edit"
  editButton.type = "button"
  editButton.textContent = "Editar"

  // Botão excluir
  const deleteButton = document.createElement("button")
  deleteButton.className = "delete"
  deleteButton.type = "button"
  deleteButton.textContent = "Excluir"

  cardActions.appendChild(editButton)
  cardActions.appendChild(deleteButton)

  cardHeader.appendChild(title)
  cardHeader.appendChild(cardActions)

  // Details
  const contactDetails = document.createElement("div")
  contactDetails.className = "contact-details"

  function createInfo(label, value) {
    const p = document.createElement("p")

    const strong = document.createElement("strong")
    strong.textContent = `${label}: `

    p.appendChild(strong)
    p.append(value)

    return p
  }

  contactDetails.appendChild(createInfo("Telefone", contato.celular))
  contactDetails.appendChild(createInfo("E-mail", contato.email))
  contactDetails.appendChild(createInfo("Cidade", contato.cidade))
  contactDetails.appendChild(createInfo("Endereço", contato.endereco))

  // Montagem
  contactInfo.appendChild(cardHeader)
  contactInfo.appendChild(contactDetails)

  article.appendChild(img)
  article.appendChild(contactInfo)

  // Eventos
  editButton.addEventListener("click", () => fillForm(contato))

  deleteButton.addEventListener("click", async () => {
    const confirmDelete = window.confirm(
      `Deseja realmente excluir ${contato.nome}?`
    )

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
      setStatus(
        error.message || "Nao foi possivel excluir o contato.",
        "error"
      )
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
// Ouvinte para filtrar a lista em tempo real
contactListSearch.addEventListener("input", renderContacts)

/**
 * Tela de login
 */
function showLoginScreen() {
  const appContainer = document.querySelector('.app')
  const pageTitle = document.querySelector('.hero h1').textContent
  appContainer.classList.add('hidden')

  const loginOverlay = document.createElement('div')
  loginOverlay.id = 'login-overlay'

  // Painel
  const panel = document.createElement('div')
  panel.className = 'panel login-panel'

  // Header
  const panelHeader = document.createElement('div')
  panelHeader.className = 'panel-header login-header'

  // Título
  const title = document.createElement('h2')
  title.className = 'login-title'
  title.textContent = pageTitle

  panelHeader.appendChild(title)

  // Form
  const form = document.createElement('form')
  form.id = 'login-form'
  form.className = 'contact-form'

  // Label email
  const emailLabel = document.createElement('label')
  emailLabel.textContent = 'E-mail '

  const emailInput = document.createElement('input')
  emailInput.type = 'email'
  emailInput.id = 'login-email'
  emailInput.required = true
  emailInput.placeholder = 'usuario@email.com'

  emailLabel.appendChild(emailInput)

  // Label senha
  const passwordLabel = document.createElement('label')
  passwordLabel.textContent = 'Digite sua senha '

  const passwordInput = document.createElement('input')
  passwordInput.type = 'password'
  passwordInput.id = 'login-password'
  passwordInput.required = true
  passwordInput.placeholder = '••••••'

  passwordLabel.appendChild(passwordInput)

  // Actions
  const formActions = document.createElement('div')
  formActions.className = 'form-actions'

  // Botão
  const submitButton = document.createElement('button')
  submitButton.type = 'submit'
  submitButton.className = 'primary-button'
  submitButton.textContent = 'Entrar'

  formActions.appendChild(submitButton)

  const newUserRegistration = document.createElement('p')
  newUserRegistration.className = 'login-footer-text'
  newUserRegistration.innerHTML = 'Novo por aqui? <a href="#">Cadastre-se</a>'

  formActions.appendChild(newUserRegistration)  

  // Montagem
  form.appendChild(emailLabel)
  form.appendChild(passwordLabel)
  form.appendChild(formActions)

  panel.appendChild(panelHeader)
  panel.appendChild(form)

  loginOverlay.appendChild(panel)

  document.body.appendChild(loginOverlay)

  form.addEventListener('submit', (e) => {
    e.preventDefault()

    loginOverlay.remove()
    appContainer.classList.remove('hidden')

    resetForm()
    loadContacts()
  })
}

showLoginScreen()

logoutButton.addEventListener('click', showLoginScreen)