'use strict'
import {
  atualizarContato,
  criarContato,
  deletarContato,
  getContatos
} from "./contatos.js"

const form = document.getElementById("contact-form")
const contactList = document.getElementById("contact-list")
const statusMessage = document.getElementById("status")
const formTitle = document.getElementById("form-title")
const submitButton = document.getElementById("submit-button")
const cancelEditButton = document.getElementById("cancel-edit")
const refreshListButton = document.getElementById("refresh-list")
const contactIdInput = document.getElementById("contact-id")

const fieldIds = ["nome", "celular", "foto", "email", "endereco", "cidade"]
const fields = Object.fromEntries(
  fieldIds.map((field) => [field, document.getElementById(field)])
)

let contatos = []

function setStatus(message, type = "") {
  statusMessage.textContent = message
  statusMessage.className = `status${type ? ` ${type}` : ""}`
}

function getFormData() {
  return {
    nome: fields.nome.value.trim(),
    celular: fields.celular.value.trim(),
    foto: fields.foto.value.trim(),
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
}

function fillForm(contato) {
  contactIdInput.value = contato.id
  fieldIds.forEach((field) => {
    fields[field].value = contato[field] ?? ""
  })

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

  const contato = getFormData()
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

resetForm()
loadContacts()
