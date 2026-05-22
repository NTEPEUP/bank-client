<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { apiClient } from '../services/api'

const auth = useAuthStore()
const user = computed(() => auth.currentUser.value || {})
const idCliente = computed(() => user.value.idCliente || user.value.clienteId || user.value.id || null)

const cliente = ref(null)
const cuentas = ref([])
const prestamos = ref([])
const tarjetas = ref([])
const reclamos = ref([])
const loading = ref(false)
const error = ref(null)

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

const selectedCuenta = computed(() =>
    cuentas.value.find((cuenta) => cuenta.idCuenta === selectedCuentaId.value || cuenta.id === selectedCuentaId.value) || null,
)

const cuentasPropias = computed(() =>
    cuentas.value.filter(
        (cuenta) => cuenta.idCuenta !== selectedCuentaId.value && cuenta.id !== selectedCuentaId.value,
    ),
)

const correoCliente = computed(
    () => cliente.value?.correo || cliente.value?.email || user.value.correo || user.value.email || '',
)

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

        if (!selectedCuentaId.value && cuentas.value.length > 0) {
            selectCuenta(cuentas.value[0])
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
        return
    }

    const numeroCuenta = (transferenciasAjenas.value.cuentaDestino || '').trim()

    if (!numeroCuenta) {
        ajenaValidation.value.message = 'Ingresa el número de cuenta destino.'
        return
    }

    ajenaValidation.value.loading = true
    ajenaValidation.value.message = ''
    ajenaValidation.value.validated = false

    try {
        const response = await apiClient.get(`/cuentas/validar/${encodeURIComponent(numeroCuenta)}`, {
            idCliente: idCliente.value,
            idCuentaOrigen: selectedCuenta.value.idCuenta ?? selectedCuenta.value.id,
            numeroCuenta,
            tipoCuenta: 'AHORRO',
            nombreCliente: cliente.value?.nombres || `${user.value.nombres || ''} ${user.value.apellidos || ''}`.trim(),
        }, { skipSessionExpiredAlert: true })

        ajenaValidation.value.validated = true
        ajenaValidation.value.data = response.data || null
        ajenaValidation.value.message = 'Cuenta validada correctamente. Ahora puedes continuar con el envío del token.'
        ajenaTokenStep.value = { loading: false, sent: false, tokenId: '', expiresAt: '', message: '' }
    } catch (e) {
        ajenaValidation.value.message = e?.response?.status === 401
            ? 'No fue posible validar la cuenta destino. Verifica tu sesión e inténtalo de nuevo.'
            : e?.response?.data?.message || e.message || 'No fue posible validar la cuenta destino.'
    } finally {
        ajenaValidation.value.loading = false
    }
}

async function iniciarTransferenciaAjena() {
    if (!selectedCuenta.value) {
        ajenaTokenStep.value.message = 'Selecciona una cuenta origen primero.'
        return
    }

    if (!ajenaValidation.value.validated) {
        ajenaTokenStep.value.message = 'Primero valida la cuenta destino.'
        return
    }

    requestingToken.value = true
    ajenaTokenStep.value.message = ''

    try {
        const numeroCuentaOrigen = selectedCuenta.value.numeroCuenta ?? selectedCuenta.value.id
        const numeroCuentaDestino = (transferenciasAjenas.value.cuentaDestino || '').trim()

        const response = await apiClient.post('/transacciones/transferencia', {
            idCliente: idCliente.value,
            cuentaOrigen: numeroCuentaOrigen,
            cuentaDestino: numeroCuentaDestino,
            monto: transferenciasAjenas.value.monto,
            descripcion: transferenciasAjenas.value.comentario,
        }, { skipSessionExpiredAlert: true })

        if (response.status === 202 && response.data?.tokenId) {
            ajenaTokenStep.value.sent = true
            ajenaTokenStep.value.tokenId = response.data.tokenId
            ajenaTokenStep.value.expiresAt = response.data.expiresAt || ''
            ajenaTokenStep.value.message = response.data?.message || 'Te enviamos un token al correo. Ingresa el código para confirmar.'
            foreignTransferMessage.value = ''
            return
        }

        ajenaTokenStep.value.message = 'No se recibió token para confirmar. Revisa la respuesta del backend.'
    } catch (e) {
        ajenaTokenStep.value.message = e?.response?.data?.message || e.message || 'No fue posible enviar el token.'
    } finally {
        requestingToken.value = false
    }
}

async function enviarTransferenciaPropia() {
    if (!selectedCuenta.value) {
        ownTransferMessage.value = 'Selecciona una cuenta origen.'
        return
    }

    sendingPropia.value = true
    ownTransferMessage.value = ''

    try {
        const numeroCuentaOrigen = selectedCuenta.value.numeroCuenta ?? selectedCuenta.value.id
        const destino = cuentas.value.find(c => (c.idCuenta ?? c.id) === transferenciasPropias.value.cuentaDestinoId)
        const numeroCuentaDestino = destino?.numeroCuenta ?? transferenciasPropias.value.cuentaDestinoId

        await apiClient.post('/transacciones/transferencia', {
            idCliente: idCliente.value,
            cuentaOrigen: numeroCuentaOrigen,
            cuentaDestino: numeroCuentaDestino,
            monto: transferenciasPropias.value.monto,
            descripcion: transferenciasPropias.value.comentario,
        })

        ownTransferMessage.value = 'Transferencia propia enviada correctamente.'
        transferenciasPropias.value.monto = ''
        transferenciasPropias.value.comentario = ''
        transferenciasPropias.value.cuentaDestinoId = null
    } catch (e) {
        ownTransferMessage.value = e?.response?.data?.message || e.message || 'No fue posible enviar la transferencia propia.'
    } finally {
        sendingPropia.value = false
    }
}

async function enviarTransferenciaAjena() {
    if (!selectedCuenta.value) {
        foreignTransferMessage.value = 'Selecciona una cuenta origen.'
        return
    }

    if (!ajenaValidation.value.validated) {
        foreignTransferMessage.value = 'Primero valida la cuenta destino.'
        return
    }

    if (!ajenaTokenStep.value.sent) {
        foreignTransferMessage.value = 'Primero envía el token al correo.'
        return
    }

    if (!transferenciasAjenas.value.tokenCorreo) {
        foreignTransferMessage.value = 'Ingresa el token recibido por correo.'
        return
    }

    if (!ajenaTokenStep.value.tokenId) {
        foreignTransferMessage.value = 'No hay tokenId pendiente. Inicia la transferencia nuevamente.'
        return
    }

    sendingAjena.value = true
    foreignTransferMessage.value = ''

    try {
        const response = await apiClient.post('/transacciones/confirmar', {
            tokenId: ajenaTokenStep.value.tokenId,
            token: transferenciasAjenas.value.tokenCorreo,
        }, { skipSessionExpiredAlert: true })

        foreignTransferMessage.value = typeof response.data === 'string'
            ? response.data
            : response.data?.message || 'Transferencia ejecutada correctamente.'
        transferenciasAjenas.value.cuentaDestino = ''
        transferenciasAjenas.value.monto = ''
        transferenciasAjenas.value.comentario = ''
        transferenciasAjenas.value.tokenCorreo = ''
        ajenaValidation.value = { loading: false, validated: false, data: null, message: '' }
        ajenaTokenStep.value = { loading: false, sent: false, tokenId: '', expiresAt: '', message: '' }
    } catch (e) {
        foreignTransferMessage.value = e?.response?.status === 401
            ? 'Tu sesión ya no es válida. Vuelve a iniciar sesión para continuar.'
            : e?.response?.data?.message || e.message || 'No fue posible enviar la transferencia ajena.'
    } finally {
        sendingAjena.value = false
    }
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
                    <div class="perfil360-subtitle">{{ user.roleName || user.username || 'Cuentahabiente' }}</div>
                    <div class="perfil360-subtitle">idCliente: {{ idCliente || 'sin asignar' }}</div>
                </div>
            </div>

            <div class="perfil360-header__actions">
                <v-btn variant="tonal" color="primary" :loading="loading" @click="fetchAll">Actualizar</v-btn>
            </div>
        </v-card>

        <v-row class="perfil360-summary" dense>
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
        </v-row>

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
                            <v-card v-for="cuenta in cuentas" :key="cuenta.idCuenta || cuenta.id"
                                :class="['account-card', { 'account-card--selected': (cuenta.idCuenta || cuenta.id) === selectedCuentaId }]"
                                variant="outlined" @click="selectCuenta(cuenta)">
                                <div class="account-card__top">
                                    <div>
                                        <div class="product-name">{{ cuenta.tipoCuenta || cuenta.tipo || 'Cuenta' }}
                                        </div>
                                        <div class="product-meta">{{ cuenta.numeroCuenta || 'Sin número registrado' }}
                                        </div>
                                    </div>
                                    <v-chip color="primary" variant="tonal" size="small">Seleccionar</v-chip>
                                </div>

                                <div class="product-balance">{{ cuenta.saldo !== undefined ? cuenta.saldo : '—' }}</div>
                            </v-card>
                        </div>

                        <v-divider class="my-6" />

                        <div class="transfer-panel" v-if="selectedCuenta">
                            <div class="transfer-panel__header">
                                <div>
                                    <div class="section-kicker">Operaciones</div>
                                    <h3>Cuenta seleccionada: {{ selectedCuenta.tipoCuenta || selectedCuenta.tipo ||
                                        'Cuenta' }}</h3>
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
                                                <v-text-field :model-value="selectedCuenta.numeroCuenta || ''"
                                                    label="Cuenta origen" variant="outlined" readonly />
                                            </v-col>
                                            <v-col cols="12" md="6">
                                                <v-select v-model="transferenciasPropias.cuentaDestinoId"
                                                    :items="cuentasPropias" item-title="numeroCuenta"
                                                    item-value="idCuenta" label="Cuenta destino propia"
                                                    variant="outlined" :disabled="cuentasPropias.length === 0" />
                                            </v-col>
                                            <v-col cols="12" md="6">
                                                <v-text-field v-model="transferenciasPropias.monto" label="Monto"
                                                    type="number" variant="outlined" />
                                            </v-col>
                                            <v-col cols="12" md="6">
                                                <v-text-field v-model="transferenciasPropias.comentario"
                                                    label="Comentario" variant="outlined" />
                                            </v-col>
                                        </v-row>

                                        <div class="transfer-actions">
                                            <v-btn color="primary" :loading="sendingPropia"
                                                @click="enviarTransferenciaPropia">
                                                Enviar transferencia propia
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
                                                <v-text-field :model-value="selectedCuenta.numeroCuenta || ''"
                                                    label="Cuenta origen" variant="outlined" readonly />
                                            </v-col>
                                            <v-col cols="12" md="6">
                                                <v-text-field v-model="transferenciasAjenas.cuentaDestino"
                                                    label="Cuenta destino ajena" variant="outlined"
                                                    hint="Ingresa el número de cuenta destino manualmente"
                                                    persistent-hint @input="limpiarValidacionAjena" />
                                            </v-col>
                                            <v-col cols="12" md="6">
                                                <v-text-field v-model="transferenciasAjenas.monto" label="Monto"
                                                    type="number" variant="outlined" />
                                            </v-col>
                                            <v-col cols="12" md="6">
                                                <v-text-field v-model="transferenciasAjenas.comentario"
                                                    label="Comentario" variant="outlined" />
                                            </v-col>
                                            <v-col cols="12">
                                                <div class="token-box">
                                                    <div>
                                                        <div class="token-box__title">Paso 1: Validar cuenta destino
                                                        </div>
                                                        <div class="product-meta">Primero validamos que la cuenta exista
                                                            y pertenezca al tipo esperado.</div>
                                                    </div>
                                                    <v-btn variant="tonal" color="primary"
                                                        :loading="ajenaValidation.loading" @click="validarCuentaAjena">
                                                        Validar cuenta
                                                    </v-btn>
                                                </div>
                                            </v-col>

                                            <v-col cols="12" v-if="ajenaValidation.message">
                                                <v-alert :type="ajenaValidation.validated ? 'success' : 'info'"
                                                    variant="tonal">
                                                    {{ ajenaValidation.message }}
                                                </v-alert>
                                            </v-col>

                                            <v-col cols="12" v-if="ajenaValidation.validated">
                                                <div class="token-box token-box--step">
                                                    <div>
                                                        <div class="token-box__title">Paso 2: Iniciar transferencia
                                                        </div>
                                                        <div class="product-meta">El backend enviará el token al correo
                                                            y devolverá
                                                            un tokenId para confirmar en el siguiente paso.</div>
                                                    </div>
                                                    <v-btn variant="tonal" color="primary" :loading="requestingToken"
                                                        @click="iniciarTransferenciaAjena">
                                                        Iniciar y enviar token
                                                    </v-btn>
                                                </div>
                                            </v-col>

                                            <v-col cols="12" v-if="ajenaTokenStep.message">
                                                <v-alert :type="ajenaTokenStep.sent ? 'success' : 'info'"
                                                    variant="tonal">
                                                    {{ ajenaTokenStep.message }}
                                                </v-alert>
                                            </v-col>

                                            <v-col cols="12" md="6" v-if="ajenaTokenStep.sent">
                                                <v-text-field v-model="transferenciasAjenas.tokenCorreo"
                                                    label="Token recibido por correo" variant="outlined" />
                                            </v-col>

                                            <v-col cols="12" v-if="ajenaTokenStep.sent && ajenaTokenStep.expiresAt">
                                                <div class="product-meta">Expira: {{ ajenaTokenStep.expiresAt }}</div>
                                            </v-col>
                                        </v-row>

                                        <div class="transfer-actions">
                                            <v-btn color="primary" :loading="sendingAjena"
                                                :disabled="!ajenaValidation.validated || !ajenaTokenStep.sent"
                                                @click="enviarTransferenciaAjena">
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
                <v-card class="section-card section-card--accent" elevation="0">
                    <div class="section-heading section-heading--light">
                        <div>
                            <div class="section-kicker">Tarjetas</div>
                            <h3>Productos plásticos</h3>
                        </div>
                    </div>

                    <div v-if="!tarjetas || tarjetas.length === 0" class="state-box state-box--light">
                        No hay tarjetas registradas.
                    </div>
                    <div v-else class="card-list">
                        <v-card v-for="t in tarjetas" :key="t.id" class="card-item" elevation="0">
                            <div class="card-item__top">
                                <div>
                                    <div class="product-name">{{ t.tipo || ('Tarjeta ' + t.numero) }}</div>
                                    <div class="product-meta">Límite disponible</div>
                                </div>
                                <v-icon icon="mdi-credit-card-outline" />
                            </div>
                            <div class="card-value">{{ t.limite ?? '—' }}</div>
                        </v-card>
                    </div>

                    <v-divider class="my-6" />

                    <div class="product-group">
                        <div class="product-title product-title--light">Reclamos</div>
                        <div v-if="!reclamos || reclamos.length === 0" class="state-box state-box--light">
                            No hay reclamos registrados.
                        </div>
                        <div v-else class="card-list">
                            <v-card v-for="r in reclamos" :key="r.idPrestamo || r.id" class="card-item" elevation="0">
                                <div class="product-name">{{ r.asunto || r.titulo || ('Reclamo ' + r.id) }}</div>
                                <div class="product-meta">{{ r.estado || 'Pendiente de atención' }}</div>
                                <div class="card-value">{{ r.descripcion || r.detalle || 'Sin descripción' }}</div>
                            </v-card>
                        </div>
                    </div>
                </v-card>
            </v-col>
        </v-row>
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
    border-radius: 24px;
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
    border: 1px solid rgba(6, 57, 108, 0.08);
}

.summary-card {
    padding: 18px;
    min-height: 120px;
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

.section-card--accent {
    background: linear-gradient(135deg, #0b3b6b 0%, #184e8d 50%, #1b7f4b 100%);
    color: white;
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
.section-card--accent .product-title,
.section-card--accent .product-meta,
.section-card--accent .state-box,
.section-card--accent .product-title--light,
.section-card--accent .product-name {
    color: rgba(255, 255, 255, 0.88);
}

.accounts-grid,
.product-list,
.card-list {
    display: grid;
    gap: 12px;
}

.account-card {
    padding: 16px;
    cursor: pointer;
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.account-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 16px 34px rgba(15, 23, 42, 0.08);
}

.account-card--selected {
    border-color: rgba(6, 57, 108, 0.45);
    background: linear-gradient(135deg, rgba(6, 57, 108, 0.08), rgba(27, 127, 75, 0.08));
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

.product-title {
    font-size: 15px;
    font-weight: 800;
    color: #0f172a;
}

.product-title--light {
    color: white;
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
    background: rgba(255, 255, 255, 0.12);
    color: rgba(255, 255, 255, 0.84);
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
    border-bottom: 1px solid rgba(6, 57, 108, 0.08);
}

.transfer-card {
    padding: 18px;
}

.transfer-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 8px;
}

.token-box {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: center;
    padding: 16px;
    border-radius: 20px;
    background: rgba(6, 57, 108, 0.06);
}

.token-box__title {
    font-weight: 800;
    color: #0f172a;
}

.section-card--accent .token-box {
    background: rgba(255, 255, 255, 0.08);
}

.chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
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
}
</style>
