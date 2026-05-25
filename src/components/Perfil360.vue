<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { apiClient } from '../services/api'

const auth = useAuthStore()
const user = computed(() => auth.currentUser.value || {})
const idCliente = computed(
  () => user.value.idCliente || user.value.clienteId || user.value.id || null,
)

const cliente = ref(null)
const cuentas = ref([])
const prestamos = ref([])
const tarjetas = ref([])
const reclamos = ref([])
const loading = ref(false)
const loadingPrestamos = ref(false)
const error = ref(null)
const limpiarMensajeReclamo = ref(false)

const tipoCasoItems = [
  { title: 'Reclamo', value: 'Reclamo' },
  { title: 'Solicitud', value: 'Solicitud' },
]

const reclamoForm = ref({
  tipoCaso: 'Reclamo',
  categoria: '',
  descripcion: '',
})

const mostrarFormularioReclamo = ref(false)

const sendingReclamo = ref(false)
const reclamoFeedback = ref({ type: '', message: '' })

const selectedCuentaId = ref(null)
const transferMode = ref('propias')

const transferenciasPropias = ref({
  cuentaDestinoId: null,
  monto: '',
  comentario: '',
})

const transferenciasAjenas = ref({
  cuentaDestino: '',
  monto: '',
  comentario: '',
  tokenCorreo: '',
})

const ajenaValidation = ref({
  loading: false,
  validated: false,
  data: null,
  message: '',
})

const ajenaTokenStep = ref({
  loading: false,
  sent: false,
  tokenId: '',
  expiresAt: '',
  message: '',
})

const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
})

const sendingPropia = ref(false)
const sendingAjena = ref(false)
const requestingToken = ref(false)
const ownTransferMessage = ref('')
const foreignTransferMessage = ref('')
const summaryCards = computed(() => [
  { label: 'Cuentas', value: cuentas.value.length, icon: 'mdi-bank-outline' },
  { label: 'Préstamos', value: prestamos.value.length, icon: 'mdi-cash-multiple' },
  { label: 'Tarjetas', value: tarjetas.value.length, icon: 'mdi-credit-card-outline' },
])

const selectedCuenta = computed(
  () =>
    cuentas.value.find(
      (cuenta) =>
        cuenta.idCuenta === selectedCuentaId.value || cuenta.id === selectedCuentaId.value,
    ) || null,
)

const cuentasPropias = computed(() =>
  cuentas.value.filter(
    (cuenta) => cuenta.idCuenta !== selectedCuentaId.value && cuenta.id !== selectedCuentaId.value,
  ),
)

const correoCliente = computed(
  () =>
    cliente.value?.correo || cliente.value?.email || user.value.correo || user.value.email || '',
)

const cuentaValidadaInfo = computed(() => {
  const rawData = ajenaValidation.value.data
  if (!rawData) {
    return null
  }

  const cuenta = rawData.cuenta || rawData.data || rawData
  const nombreCompuesto = `${cuenta.nombres || ''} ${cuenta.apellidos || ''}`.trim()

  return {
    numeroCuenta: cuenta.numeroCuenta || cuenta.cuentaDestino || transferenciasAjenas.value.cuentaDestino,
    titular: cuenta.nombreCliente || cuenta.titular || nombreCompuesto || 'No disponible',
    tipoCuenta: cuenta.tipoCuenta || cuenta.tipo || 'No disponible',
    estado: cuenta.estado || 'Activa',
    banco: cuenta.banco || 'Shensei Bank',
  }
})

const categoriaItems = [
  { title: 'Cuentas', value: 'Cuentas' },
  { title: 'Préstamos', value: 'Préstamos' },
  { title: 'Tarjetas', value: 'Tarjetas' },
  { title: 'Banca digital', value: 'Banca digital' },
]

const reclamoHeaders = [
  { title: 'Caso', value: 'codigoReclamo' },
  { title: 'Tipo de caso', value: 'tipoCaso' },
  { title: 'Categoría', value: 'categoria' },
  { title: 'Descripcion', value: 'descripcion' },
  { title: 'Estado', value: 'estado' },
]

const prestamoHeaders = [
  { title: 'No. Préstamo', value: 'idPrestamo' },
  { title: 'Monto', value: 'monto' },
  { title: 'Saldo Pendiente', value: 'saldoPendiente' },
  { title: 'Tasa interés', value: 'tasaInteres' },
  { title: 'Plazo', value: 'plazoMeses' },
  { title: 'Estado', value: 'estado' },
  { title: 'Fecha de creación', value: 'fechaCreacion' },
]

function showSnackbar(message, color = 'success') {
  snackbar.value.show = false
  snackbar.value.message = message
  snackbar.value.color = color
  snackbar.value.show = true
}

function normalizarCuentas(data) {
  return Array.isArray(data) ? data : []
}

async function fetchAll() {
  if (!idCliente.value) {
    error.value = 'No se encontró idCliente en la sesión.'
    return
  }

  loading.value = true
  error.value = null
  try {
    const [cRes, pRes, tRes, clienteRes, reclamosRes] = await Promise.all([
      apiClient.get(`/cuentas/cliente/${idCliente.value}`),
      apiClient.get(`/prestamos/cliente/${idCliente.value}`),
      apiClient.get(`/tarjetas/cliente/${idCliente.value}`),
      apiClient.get(`/clientes/${idCliente.value}`),
      apiClient.get(`/reclamos/cliente/${idCliente.value}`),
    ])

    cuentas.value = normalizarCuentas(cRes.data)
    prestamos.value = normalizarCuentas(pRes.data)
    tarjetas.value = normalizarCuentas(tRes.data)
    cliente.value = clienteRes.data || null
    reclamos.value = normalizarCuentas(reclamosRes.data)

    if (!reclamoForm.value.categoria) {
      reclamoForm.value.categoria = categoriaItems[0].value
    }
  } catch (e) {
    error.value = e.message || String(e)
  } finally {
    loading.value = false
  }
}

function selectCuenta(cuenta) {
  selectedCuentaId.value = cuenta.idCuenta ?? cuenta.id ?? null
  ownTransferMessage.value = ''
  foreignTransferMessage.value = ''
  transferMode.value = 'propias'
  transferenciasPropias.value.cuentaDestinoId = null
  transferenciasPropias.value.monto = ''
  transferenciasPropias.value.comentario = ''
  transferenciasAjenas.value.cuentaDestino = ''
  transferenciasAjenas.value.monto = ''
  transferenciasAjenas.value.comentario = ''
  transferenciasAjenas.value.tokenCorreo = ''
  ajenaValidation.value = { loading: false, validated: false, data: null, message: '' }
  ajenaTokenStep.value = { loading: false, sent: false, tokenId: '', expiresAt: '', message: '' }
}

function limpiarValidacionAjena() {
  ajenaValidation.value = { loading: false, validated: false, data: null, message: '' }
  ajenaTokenStep.value = { loading: false, sent: false, tokenId: '', expiresAt: '', message: '' }
  transferenciasAjenas.value.tokenCorreo = ''
}

async function validarCuentaAjena() {
  if (!selectedCuenta.value) {
    ajenaValidation.value.message = 'Selecciona una cuenta origen primero.'
    showSnackbar(ajenaValidation.value.message, 'warning')
    return
  }

  const numeroCuenta = (transferenciasAjenas.value.cuentaDestino || '').trim()

  if (!numeroCuenta) {
    ajenaValidation.value.message = 'Ingresa el número de cuenta destino.'
    showSnackbar(ajenaValidation.value.message, 'warning')
    return
  }

  ajenaValidation.value.loading = true
  ajenaValidation.value.message = ''
  ajenaValidation.value.validated = false

  try {
    const response = await apiClient.get(
      `/cuentas/validar/${encodeURIComponent(numeroCuenta)}`,
      {
        idCliente: idCliente.value,
        idCuentaOrigen: selectedCuenta.value.idCuenta ?? selectedCuenta.value.id,
        numeroCuenta,
        tipoCuenta: 'AHORRO',
        nombreCliente:
          cliente.value?.nombres ||
          `${user.value.nombres || ''} ${user.value.apellidos || ''}`.trim(),
      },
      { skipSessionExpiredAlert: true },
    )

    ajenaValidation.value.validated = true
    ajenaValidation.value.data = response.data || null
    ajenaValidation.value.message =
      'Cuenta validada correctamente. Ahora puedes continuar con el envío del token.'
    ajenaTokenStep.value = { loading: false, sent: false, tokenId: '', expiresAt: '', message: '' }
    showSnackbar('Cuenta validada correctamente.', 'success')
  } catch (e) {
    const status = e?.response?.status
    ajenaValidation.value.validated = false
    ajenaValidation.value.data = null
    ajenaValidation.value.message =
      status === 404
        ? 'La cuenta destino no existe.'
        : status === 401
          ? 'No fue posible validar la cuenta destino. Verifica tu sesión e inténtalo de nuevo.'
          : e?.response?.data?.message || e.message || 'No fue posible validar la cuenta destino.'
    showSnackbar(ajenaValidation.value.message, 'error')
  } finally {
    ajenaValidation.value.loading = false
  }
}

async function iniciarTransferenciaAjena() {
  if (!selectedCuenta.value) {
    ajenaTokenStep.value.message = 'Selecciona una cuenta origen primero.'
    showSnackbar(ajenaTokenStep.value.message, 'warning')
    return
  }

  if (!ajenaValidation.value.validated) {
    ajenaTokenStep.value.message = 'Primero valida la cuenta destino.'
    showSnackbar(ajenaTokenStep.value.message, 'warning')
    return
  }

  requestingToken.value = true
  ajenaTokenStep.value.message = ''

  try {
    const numeroCuentaOrigen = selectedCuenta.value.numeroCuenta ?? selectedCuenta.value.id
    const numeroCuentaDestino = (transferenciasAjenas.value.cuentaDestino || '').trim()

    const response = await apiClient.post(
      '/transacciones/transferencia',
      {
        idCliente: idCliente.value,
        cuentaOrigen: numeroCuentaOrigen,
        cuentaDestino: numeroCuentaDestino,
        monto: transferenciasAjenas.value.monto,
        descripcion: transferenciasAjenas.value.comentario,
      },
      { skipSessionExpiredAlert: true },
    )

    if (response.status === 202 && response.data?.tokenId) {
      ajenaTokenStep.value.sent = true
      ajenaTokenStep.value.tokenId = response.data.tokenId
      ajenaTokenStep.value.expiresAt = response.data.expiresAt || ''
      ajenaTokenStep.value.message =
        response.data?.message ||
        'Te enviamos un token al correo. Ingresa el código para confirmar.'
      foreignTransferMessage.value = ''
      showSnackbar('Token enviado al correo correctamente.', 'success')
      return
    }

    ajenaTokenStep.value.message =
      'No se recibió token para confirmar. Revisa la respuesta del backend.'
    showSnackbar(ajenaTokenStep.value.message, 'error')
  } catch (e) {
    ajenaTokenStep.value.message =
      e?.response?.data?.message || e.message || 'No fue posible enviar el token.'
    showSnackbar(ajenaTokenStep.value.message, 'error')
  } finally {
    requestingToken.value = false
  }
}

async function enviarTransferenciaPropia() {
  if (!selectedCuenta.value) {
    ownTransferMessage.value = 'Selecciona una cuenta origen.'
    showSnackbar(ownTransferMessage.value, 'warning')
    return
  }

  sendingPropia.value = true
  ownTransferMessage.value = ''

  try {
    const numeroCuentaOrigen = selectedCuenta.value.numeroCuenta ?? selectedCuenta.value.id
    const destino = cuentas.value.find(
      (c) => (c.idCuenta ?? c.id) === transferenciasPropias.value.cuentaDestinoId,
    )
    const numeroCuentaDestino = destino?.numeroCuenta ?? transferenciasPropias.value.cuentaDestinoId

    await apiClient.post('/transacciones/transferencia', {
      idCliente: idCliente.value,
      cuentaOrigen: numeroCuentaOrigen,
      cuentaDestino: numeroCuentaDestino,
      monto: transferenciasPropias.value.monto,
      descripcion: transferenciasPropias.value.comentario,
    })

    ownTransferMessage.value = 'Transferencia realizada con éxito.'
    showSnackbar(ownTransferMessage.value, 'success')
    transferenciasPropias.value.monto = ''
    transferenciasPropias.value.comentario = ''
    transferenciasPropias.value.cuentaDestinoId = null
  } catch (e) {
    ownTransferMessage.value =
      e?.response?.data?.message || e.message || 'No fue posible enviar la transferencia propia.'
    showSnackbar(ownTransferMessage.value, 'error')
  } finally {
    sendingPropia.value = false
  }
}

async function enviarTransferenciaAjena() {
  if (!selectedCuenta.value) {
    foreignTransferMessage.value = 'Selecciona una cuenta origen.'
    showSnackbar(foreignTransferMessage.value, 'warning')
    return
  }

  if (!ajenaValidation.value.validated) {
    foreignTransferMessage.value = 'Primero valida la cuenta destino.'
    showSnackbar(foreignTransferMessage.value, 'warning')
    return
  }

  if (!ajenaTokenStep.value.sent) {
    foreignTransferMessage.value = 'Primero envía el token al correo.'
    showSnackbar(foreignTransferMessage.value, 'warning')
    return
  }

  if (!transferenciasAjenas.value.tokenCorreo) {
    foreignTransferMessage.value = 'Ingresa el token recibido por correo.'
    showSnackbar(foreignTransferMessage.value, 'warning')
    return
  }

  if (!ajenaTokenStep.value.tokenId) {
    foreignTransferMessage.value = 'No hay tokenId pendiente. Inicia la transferencia nuevamente.'
    showSnackbar(foreignTransferMessage.value, 'warning')
    return
  }

  sendingAjena.value = true
  foreignTransferMessage.value = ''

  try {
    const response = await apiClient.post(
      '/transacciones/confirmar',
      {
        tokenId: ajenaTokenStep.value.tokenId,
        token: transferenciasAjenas.value.tokenCorreo,
      },
      { skipSessionExpiredAlert: true },
    )

    foreignTransferMessage.value =
      typeof response.data === 'string'
        ? response.data
        : response.data?.message || 'Transferencia realizada con éxito.'
    showSnackbar(foreignTransferMessage.value, 'success')
    transferenciasAjenas.value.cuentaDestino = ''
    transferenciasAjenas.value.monto = ''
    transferenciasAjenas.value.comentario = ''
    transferenciasAjenas.value.tokenCorreo = ''
    ajenaValidation.value = { loading: false, validated: false, data: null, message: '' }
    ajenaTokenStep.value = { loading: false, sent: false, tokenId: '', expiresAt: '', message: '' }
  } catch (e) {
    foreignTransferMessage.value =
      e?.response?.status === 401
        ? 'Tu sesión ya no es válida. Vuelve a iniciar sesión para continuar.'
        : e?.response?.data?.message || e.message || 'No fue posible enviar la transferencia ajena.'
    showSnackbar(foreignTransferMessage.value, 'error')
  } finally {
    sendingAjena.value = false
  }
}

async function crearReclamo() {
  if (!idCliente.value) {
    reclamoFeedback.value = {
      type: 'error',
      message: 'No se encontró el idCliente en la sesión.',
    }
    return
  }

  const descripcion = (reclamoForm.value.descripcion || '').trim()

  if (!reclamoForm.value.tipoCaso) {
    reclamoFeedback.value = {
      type: 'error',
      message: 'Selecciona el tipo de caso.',
    }
    return
  }

  if (!reclamoForm.value.categoria) {
    reclamoFeedback.value = {
      type: 'error',
      message: 'Selecciona una categoría relacionada con un producto.',
    }
    return
  }

  if (!descripcion) {
    reclamoFeedback.value = {
      type: 'error',
      message: 'Escribe una descripción para el caso.',
    }
    return
  }

  sendingReclamo.value = true
  reclamoFeedback.value = { type: '', message: '' }

  try {
    const response = await apiClient.post(
      '/reclamos',
      {
        idCliente: idCliente.value,
        tipoCaso: reclamoForm.value.tipoCaso,
        categoria: reclamoForm.value.categoria,
        descripcion,
      },
      { skipSessionExpiredAlert: true },
    )

    const mensajeRespuesta =
      typeof response.data === 'string'
        ? response.data
        : response.data?.message || 'Reclamo registrado correctamente.'

    reclamoFeedback.value = {
      type: 'success',
      message: mensajeRespuesta,
    }

    const reclamoCreado = response.data?.reclamo ||
      response.data || {
        idCliente: idCliente.value,
        tipoCaso: reclamoForm.value.tipoCaso,
        categoria: reclamoForm.value.categoria,
        descripcion,
        estado: 'Pendiente',
      }

    reclamos.value = [reclamoCreado, ...reclamos.value]
    reclamoForm.value.descripcion = ''
    mostrarFormularioReclamo.value = false
  } catch (e) {
    reclamoFeedback.value = {
      type: 'error',
      message: e?.response?.data?.message || e.message || 'No fue posible registrar el reclamo.',
    }
  } finally {
    sendingReclamo.value = false
  }
}

function abrirFormularioReclamo() {
  mostrarFormularioReclamo.value = true
  reclamoFeedback.value = { type: '', message: '' }
}

function cerrarFormularioReclamo() {
  mostrarFormularioReclamo.value = false
  reclamoFeedback.value = { type: '', message: '' }
}

onMounted(fetchAll)
</script>

<template>
  <div class="perfil360-shell">
    <v-card class="perfil360-header" elevation="0">
      <div class="perfil360-header__left">
        <v-avatar size="64" color="primary" class="perfil360-avatar">
          {{ (user.nombres || user.username || 'U').charAt(0) }}
        </v-avatar>
        <div>
          <div class="perfil360-kicker">Perfil 360</div>
          <div class="perfil360-name">{{ user.nombres }} {{ user.apellidos }}</div>
          <div class="perfil360-subtitle">
            {{ user.roleName || user.username || 'Cuentahabiente' }}
          </div>
         <!--  <div class="perfil360-subtitle">idCliente: {{ idCliente || 'sin asignar' }}</div> -->
        </div>
      </div>

      <div class="perfil360-header__actions">
        <v-btn variant="tonal" class="text--white" :loading="loading" @click="fetchAll"
          >Actualizar</v-btn
        >
      </div>
    </v-card>

    <!-- <v-row class="perfil360-summary">
      <v-col v-for="card in summaryCards" :key="card.label" cols="12" sm="4">
        <v-card class="summary-card" elevation="0">
          <v-icon :icon="card.icon" class="summary-icon" />
          <div class="summary-value">{{ card.value }}</div>
          <div class="summary-label">{{ card.label }}</div>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="4">
        <v-card class="summary-card" elevation="0">
          <div class="summary-label">Cliente</div>
          <div class="summary-value">{{ cliente?.nombres || user.nombres || 'Pendiente' }}</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="summary-card" elevation="0">
          <div class="summary-label">Reclamos</div>
          <div class="summary-value">{{ reclamos.length }}</div>
          <div class="product-meta">Solicitudes registradas por cliente</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="summary-card" elevation="0">
          <div class="summary-label">Acceso</div>
          <div class="summary-value">Activo</div>
          <div class="product-meta">Transferencias, estados de cuenta y reclamos</div>
        </v-card>
      </v-col>
    </v-row> -->

    <v-row>
      <v-col cols="12" lg="7">
        <v-card class="section-card" elevation="0">
          <div class="section-heading">
            <div>
              <div class="section-kicker">Cuentas</div>
              <h3>Selecciona una cuenta para operar</h3>
            </div>
          </div>

          <div v-if="loading" class="state-box">Cargando información...</div>
          <div v-else>
            <div v-if="error" class="state-box state-box-error">Error: {{ error }}</div>

            <div v-if="!cuentas || cuentas.length === 0" class="state-box">
              No hay cuentas registradas.
            </div>

            <div v-else class="accounts-grid">
              <v-card
                v-for="cuenta in cuentas"
                :key="cuenta.idCuenta || cuenta.id"
                :class="[
                  'account-card',
                  { 'account-card--selected': (cuenta.idCuenta || cuenta.id) === selectedCuentaId },
                ]"
                variant="outlined"
                @click="selectCuenta(cuenta)"
              >
                <div class="account-card__top">
                  <div>
                    <div class="product-name">
                      {{ cuenta.tipoCuenta || cuenta.tipo || 'Cuenta' }}
                    </div>
                    <div class="product-meta">
                      {{ cuenta.numeroCuenta || 'Sin número registrado' }}
                    </div>
                  </div>
                  <v-chip color="primary" variant="tonal" size="small">Seleccionar</v-chip>
                </div>

                <div class="product-balance">
                  {{ cuenta.saldo !== undefined ? cuenta.saldo : '—' }}
                </div>
              </v-card>
            </div>

            <v-divider class="my-6" />

            <div class="transfer-panel" v-if="selectedCuenta">
              <div class="transfer-panel__header">
                <div>
                  <div class="section-kicker">Operaciones</div>
                  <h3>
                    Cuenta seleccionada:
                    {{ selectedCuenta.tipoCuenta || selectedCuenta.tipo || 'Cuenta' }}
                  </h3>
                  <div class="product-meta">Origen fijo: {{ selectedCuenta.numeroCuenta }}</div>
                </div>
              </div>

              <v-tabs v-model="transferMode" color="primary" class="transfer-tabs">
                <v-tab value="propias">Transferencias propias</v-tab>
                <v-tab value="ajenas">Transferencias ajenas</v-tab>
              </v-tabs>

              <v-window v-model="transferMode" class="mt-4">
                <v-window-item value="propias">
                  <v-card class="transfer-card" variant="outlined">
                    <v-row>
                      <v-col cols="12" md="6">
                        <v-text-field
                          :model-value="selectedCuenta.numeroCuenta || ''"
                          label="Cuenta origen"
                          variant="outlined"
                          readonly
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-select
                          v-model="transferenciasPropias.cuentaDestinoId"
                          :items="cuentasPropias"
                          item-title="numeroCuenta"
                          item-value="idCuenta"
                          label="Cuenta destino propia"
                          variant="outlined"
                          :disabled="cuentasPropias.length === 0"
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model="transferenciasPropias.monto"
                          label="Monto"
                          type="number"
                          variant="outlined"
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model="transferenciasPropias.comentario"
                          label="Concepto"
                          variant="outlined"
                        />
                      </v-col>
                    </v-row>

                    <div class="transfer-actions">
                      <v-btn
                        color="primary"
                        :loading="sendingPropia"
                        @click="enviarTransferenciaPropia"
                      >
                        Transferir
                      </v-btn>
                    </div>

                    <v-alert v-if="ownTransferMessage" class="mt-4" type="info" variant="tonal">
                      {{ ownTransferMessage }}
                    </v-alert>
                  </v-card>
                </v-window-item>

                <v-window-item value="ajenas">
                  <v-card class="transfer-card" variant="outlined">
                    <v-row>
                      <v-col cols="12" md="6">
                        <v-text-field
                          :model-value="selectedCuenta.numeroCuenta || ''"
                          label="Cuenta origen"
                          variant="outlined"
                          readonly
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model="transferenciasAjenas.cuentaDestino"
                          label="Cuenta destino ajena"
                          variant="outlined"
                          hint="Ingresa el número de cuenta destino manualmente"
                          persistent-hint
                          @input="limpiarValidacionAjena"
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model="transferenciasAjenas.monto"
                          label="Monto"
                          type="number"
                          variant="outlined"
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model="transferenciasAjenas.comentario"
                          label="Concepto"
                          variant="outlined"
                        />
                      </v-col>
                      <v-col cols="12">
                        <div class="token-box">
                          <div>
                            <div class="token-box__title">Paso 1: Validar cuenta destino</div>
                            <div class="product-meta">
                              Primero validamos que la cuenta exista y pertenezca al tipo esperado.
                            </div>
                          </div>
                          <v-btn
                            variant="tonal"
                            color="primary"
                            :loading="ajenaValidation.loading"
                            @click="validarCuentaAjena"
                          >
                            Validar
                          </v-btn>
                          
                        </div>
                      </v-col>

                      <v-col cols="12" v-if="ajenaValidation.message">
                        <v-alert
                          :type="ajenaValidation.validated ? 'success' : 'error'"
                          variant="tonal"
                        >
                          {{ ajenaValidation.message }}
                        </v-alert>
                      </v-col>

                      <v-col cols="12" v-if="ajenaValidation.validated && cuentaValidadaInfo">
                        <v-card class="validated-account" variant="outlined">
                          <div class="validated-account__title">Cuenta destino validada</div>
                          <div class="validated-account__grid">
                            <div>
                              <div class="product-meta">Titular</div>
                              <div class="validated-account__value">{{ cuentaValidadaInfo.titular }}</div>
                            </div>
                            <div>
                              <div class="product-meta">N° cuenta</div>
                              <div class="validated-account__value">{{ cuentaValidadaInfo.numeroCuenta }}</div>
                            </div>
                            <div>
                              <div class="product-meta">Tipo</div>
                              <div class="validated-account__value">{{ cuentaValidadaInfo.tipoCuenta }}</div>
                            </div>
                            <div>
                              <div class="product-meta">Estado</div>
                              <div class="validated-account__value">{{ cuentaValidadaInfo.estado }}</div>
                            </div>
                          </div>
                        </v-card>
                      </v-col>

                      <v-col cols="12" v-if="ajenaValidation.validated">
                        <div class="token-box token-box--step">
                          <div>
                            <div class="token-box__title">Paso 2: Iniciar transferencia</div>
                            <div class="product-meta">
                              Se enviará el token al correo para
                              confirmar en el siguiente paso.
                            </div>
                          </div>
                          <v-btn
                            variant="tonal"
                            color="primary"
                            :loading="requestingToken"
                            @click="iniciarTransferenciaAjena"
                          >
                            Iniciar y enviar token
                          </v-btn>
                        </div>
                      </v-col>

                      <v-col cols="12" v-if="ajenaTokenStep.message">
                        <v-alert :type="ajenaTokenStep.sent ? 'success' : 'info'" variant="tonal">
                          {{ ajenaTokenStep.message }}
                        </v-alert>
                      </v-col>

                      <v-col cols="12" md="6" v-if="ajenaTokenStep.sent">
                        <v-text-field
                          v-model="transferenciasAjenas.tokenCorreo"
                          label="Token recibido por correo"
                          variant="outlined"
                        />
                      </v-col>

                      <v-col cols="12" v-if="ajenaTokenStep.sent && ajenaTokenStep.expiresAt">
                        <div class="product-meta">Expira: {{ ajenaTokenStep.expiresAt }}</div>
                      </v-col>
                    </v-row>

                    <div class="transfer-actions">
                      <v-btn
                        color="primary"
                        :loading="sendingAjena"
                        :disabled="!ajenaValidation.validated || !ajenaTokenStep.sent"
                        @click="enviarTransferenciaAjena"
                      >
                        Confirmar transferencia
                      </v-btn>
                    </div>

                    <v-alert v-if="foreignTransferMessage" class="mt-4" type="info" variant="tonal">
                      {{ foreignTransferMessage }}
                    </v-alert>
                  </v-card>
                </v-window-item>
              </v-window>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" lg="5">
        <div class="right-stack">
          <v-card class="section-card section-card--accent section-card--stacked" elevation="0">
            <div class="section-heading section-heading--light">
              <div>
                <div class="section-kicker">Tarjetas</div>
                <h3>Débito / crédito</h3>
              </div>
            </div>

            <div v-if="!tarjetas || tarjetas.length === 0" class="state-box state-box--light">
              No hay tarjetas registradas.
            </div>
            <div v-else class="card-list">
              <v-card v-for="t in tarjetas" :key="t.id" class="card-item" elevation="0">
                <div class="card-item__top">
                  <div>
                    <div class="product-name">{{ t.tipo || 'Tarjeta ' + t.numero }}</div>
                    <div class="product-meta">Límite disponible</div>
                  </div>
                  <v-icon icon="mdi-credit-card-outline" />
                </div>
                <div class="card-value">{{ t.limite ?? '—' }}</div>
              </v-card>
            </div>
          </v-card>

          <v-card class="section-card section-card--accent section-card--stacked" elevation="0">
            <div class="section-heading section-heading--light">
              <div>
                <div class="section-kicker">Préstamos</div>
              </div>
            </div>

            <div v-if="!prestamos || prestamos.length === 0" class="state-box state-box--light">
              No hay préstamos registrados.
            </div>
            <div v-else class="card-list">
              <v-data-table
                :headers="prestamoHeaders"
                :items="prestamos"
                :loading="loadingPrestamos"
                class="elevation-0"
              >
                <template v-slot:item="{ item }">
                  <tr>
                    <th>{{ item.idPrestamo }}</th>
                    <td>{{ item.monto }}</td>
                    <td>{{ item.saldoPendiente }}</td>
                    <td>{{ item.tasaInteres }}%</td>
                    <td>{{ item.plazoMeses }} meses</td>
                    <td>{{ item.estado || '—' }}</td>
                    <td>
                      {{ item.fechaCreacion ? new Date(item.fechaCreacion).toLocaleDateString() : '—' }}
                    </td>
                  </tr>
                </template>
              </v-data-table>
            </div>
          </v-card>
        </div>
      </v-col>

      <v-col>
        <v-card class="section-card section-card--clean section-card--stacked mt-5" elevation="0">
          <div class="section-heading section-heading--light">
            <div>
              <div class="section-kicker">Solicitud y reclamos</div>
            </div>

            <v-btn
              v-if="!mostrarFormularioReclamo"
              variant="flat"
              color="primary"
              @click="abrirFormularioReclamo"
            >
              Nuevo
            </v-btn>
            <v-btn v-else variant="text" color="primary" @click="cerrarFormularioReclamo">
              Cerrar
            </v-btn>
          </div>

          <v-expand-transition>
            <v-card v-if="mostrarFormularioReclamo" class="reclamo-form mt-4" elevation="0">
              <div class="product-meta product-meta--subtle mb-4">
                El caso se enviará con la sesión activa, sin mostrar datos sensibles en pantalla.
              </div>

              <v-row>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="reclamoForm.tipoCaso"
                    :items="tipoCasoItems"
                    item-title="title"
                    item-value="value"
                    label="Tipo de caso"
                    variant="outlined"
                  />
                </v-col>

                <v-col cols="12" md="6">
                  <v-select
                    v-model="reclamoForm.categoria"
                    :items="categoriaItems"
                    item-title="title"
                    item-value="value"
                    label="Categoría"
                    variant="outlined"
                    @update:model-value="limpiarMensajeReclamo"
                  />
                </v-col>

                <v-col cols="12">
                  <v-textarea
                    v-model="reclamoForm.descripcion"
                    label="Descripción"
                    variant="outlined"
                    rows="4"
                    auto-grow
                    counter
                    maxlength="500"
                    hint="Describe el caso con el mayor detalle posible"
                    persistent-hint
                    @update:model-value="limpiarMensajeReclamo"
                  />
                </v-col>
              </v-row>

              <div class="transfer-actions transfer-actions--split">
                <v-btn variant="text" color="primary" @click="cerrarFormularioReclamo">
                  Cancelar
                </v-btn>

                <v-btn
                  color="primary"
                  variant="flat"
                  :loading="sendingReclamo"
                  :disabled="
                    !idCliente || !reclamoForm.categoria || !reclamoForm.descripcion?.trim()
                  "
                  @click="crearReclamo"
                >
                  Enviar caso
                </v-btn>
              </div>

              <v-alert
                v-if="reclamoFeedback.message"
                class="mt-4"
                :type="reclamoFeedback.type || 'info'"
                variant="tonal"
              >
                {{ reclamoFeedback.message }}
              </v-alert>
            </v-card>
          </v-expand-transition>

          <v-divider class="my-6" />

          <div class="section-heading section-heading--light">
            <div>
              <div class="section-kicker">Historial</div>
              <h3>Reclamos y solicitudes</h3>
            </div>
          </div>

          <div v-if="!reclamos || reclamos.length === 0" class="state-box state-box--light">
            No hay reclamos registrados todavía.
          </div>

          <div v-else class="card-list">
            <v-data-table :headers="reclamoHeaders" :items="reclamos" class="elevation-0">
              <template v-slot:item="{ item }">
                <tr>
                  <th>{{ item.codigoReclamo }}</th>
                  <td>{{ item.tipoCaso }}</td>
                  <td>{{ item.categoria }}</td>
                  <td>{{ item.descripcion }}</td>
                  <td>{{ item.estado || '—' }}</td>
                </tr>
              </template>
            </v-data-table>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="top right" timeout="3500">
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">Cerrar</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<style scoped>
.perfil360-shell {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.perfil360-header,
.section-card,
.summary-card,
.account-card,
.transfer-card,
.card-item,
.state-box {
  border-radius: 12px;
}

.perfil360-header {
  padding: 24px;
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: center;
  background: linear-gradient(135deg, rgba(6, 57, 108, 0.96), rgba(27, 127, 75, 0.9));
  color: white;
}

.perfil360-header__left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.perfil360-avatar {
  border: 3px solid rgba(255, 255, 255, 0.24);
}

.perfil360-kicker,
.section-kicker {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  opacity: 0.78;
}

.perfil360-name {
  font-size: 26px;
  font-weight: 800;
  line-height: 1.1;
}

.perfil360-subtitle {
  margin-top: 4px;
  opacity: 0.86;
}

.perfil360-summary {
  margin-top: 2px;
}

.summary-card,
.section-card,
.account-card,
.transfer-card,
.card-item {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.summary-card {
  padding: 18px;
  min-height: 120px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
}

.summary-icon {
  font-size: 28px;
  color: #06396c;
  margin-bottom: 14px;
}

.summary-value {
  font-size: 26px;
  font-weight: 800;
  line-height: 1;
}

.summary-label {
  margin-top: 6px;
  color: rgba(15, 23, 42, 0.62);
  font-weight: 600;
}

.section-card {
  padding: 24px;
  min-height: 100%;
}

.section-card--stacked {
  min-height: auto;
}

.section-card--clean {
  background: rgba(255, 255, 255, 0.96);
  color: #0f172a;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-top: 4px solid #0b5cab;
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.06);
}

.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 18px;
}

.section-heading h3 {
  margin: 6px 0 0;
  font-size: 22px;
}

.section-heading--light,
.section-card--clean .product-title,
.section-card--clean .product-meta,
.section-card--clean .state-box,
.section-card--clean .product-title--light,
.section-card--clean .product-name {
  color: inherit;
}

.accounts-grid,
.product-list,
.card-list {
  display: grid;
  gap: 12px;
}

.right-stack {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.account-card {
  padding: 16px;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.account-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.08);
}

.account-card--selected {
  border-color: rgba(11, 92, 171, 0.32);
  background: linear-gradient(135deg, rgba(11, 92, 171, 0.05), rgba(11, 92, 171, 0.02));
}

.account-card__top,
.card-item__top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.product-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reclamo-form {
  padding: 18px;
  border-radius: 20px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.product-meta--subtle {
  color: rgba(15, 23, 42, 0.62);
}

.product-title {
  font-size: 15px;
  font-weight: 800;
  color: #0f172a;
}

.product-title--light {
  color: #0f172a;
}

.product-name {
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
}

.product-meta {
  margin-top: 4px;
  color: rgba(15, 23, 42, 0.56);
  font-size: 13px;
}

.product-balance,
.card-value {
  margin-top: 12px;
  font-size: 24px;
  font-weight: 800;
}

.state-box {
  padding: 16px;
  background: rgba(245, 247, 251, 0.9);
  color: rgba(15, 23, 42, 0.7);
}

.state-box-error {
  background: rgba(255, 235, 238, 0.92);
  color: #b00020;
}

.state-box--light {
  background: #f8fafc;
  color: rgba(15, 23, 42, 0.72);
}

.transfer-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.transfer-panel__header h3 {
  margin: 6px 0 0;
  font-size: 20px;
}

.transfer-tabs {
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}

.transfer-card {
  padding: 18px;
}

.transfer-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.transfer-actions--split {
  justify-content: space-between;
}

.token-box {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  padding: 16px;
  border-radius: 20px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.token-box__title {
  font-weight: 800;
  color: #0f172a;
}

.validated-account {
  margin-top: 4px;
  padding: 16px;
  border-radius: 16px;
  border-color: rgba(11, 92, 171, 0.2);
  background: linear-gradient(135deg, rgba(11, 92, 171, 0.05), rgba(27, 127, 75, 0.03));
}

.validated-account__title {
  font-size: 15px;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 10px;
}

.validated-account__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.validated-account__value {
  font-weight: 700;
  color: #0f172a;
  margin-top: 4px;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.section-kicker {
  color: rgba(15, 23, 42, 0.52);
}

@media (max-width: 960px) {
  .perfil360-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .token-box {
    flex-direction: column;
    align-items: flex-start;
  }

  .validated-account__grid {
    grid-template-columns: 1fr;
  }
}
</style>
