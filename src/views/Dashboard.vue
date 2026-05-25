<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const drawer = ref(true)

const userName = computed(() => {
    const firstName = auth.currentUser.value?.nombres || ''
    const lastName = auth.currentUser.value?.apellidos || ''
    return `${firstName} ${lastName}`.trim() || 'Usuario'
})

const menuItems = [
    {
        title: 'Perfil 360',
        subtitle: 'Ver productos y movimientos',
        icon: 'mdi-account-details-outline',
        route: 'perfil360',
        highlight: true,
    },
    /* {
        title: 'Cuentas',
        subtitle: 'Acceso rápido',
        icon: 'mdi-bank-outline',
        route: 'perfil360',
    },
    {
        title: 'Transferencias',
        subtitle: 'Propias y ajenas',
        icon: 'mdi-swap-horizontal',
        route: 'perfil360',
    },
    {
        title: 'Reclamos',
        subtitle: 'Gestionar solicitudes',
        icon: 'mdi-alert-circle-outline',
        route: 'perfil360',
    }, */
]

function goTo(routeName) {
    router.push({ name: routeName })
}

function handleLogout() {
    auth.logout()
    router.push({ name: 'login' })
}
</script>

<template>
    <v-app class="dashboard-app">
        <v-navigation-drawer v-model="drawer" permanent class="sidebar" width="290">
            <div class="brand-block">
                <div class="brand-mark">S</div>
                <div>
                    <div class="brand-name">SHENSEI</div>
                    <div class="brand-caption">Banca digital</div>
                </div>
            </div>

            <div class="side-section-title">Menú</div>
            <v-list nav class="menu-list">
                <v-list-item v-for="item in menuItems" :key="item.title"
                    :class="['menu-item', { 'menu-item-active': item.highlight }]" rounded="lg"
                    @click="goTo(item.route)">
                    <template #prepend>
                        <v-icon :icon="item.icon" />
                    </template>
                    <v-list-item-title>{{ item.title }}</v-list-item-title>
                    <v-list-item-subtitle>{{ item.subtitle }}</v-list-item-subtitle>
                </v-list-item>
            </v-list>

            <v-divider class="my-4" />

          <!--   <div class="side-card">
                <div class="side-card-badge">Cuenta habiente</div>
                <div class="side-card-title">Acceso rápido</div>
                <div class="side-card-text">Entra al Perfil 360 para ver cuentas, tarjetas y préstamos.</div>
                <v-btn class="mt-4" color="primary" block @click="goTo('perfil360')">Ir a Perfil 360</v-btn>
            </div> -->
        </v-navigation-drawer>

        <v-app-bar flat class="topbar">
            <v-app-bar-nav-icon variant="text" @click="drawer = !drawer" />
            <div class="topbar-title">
                <div class="eyebrow">Bienvenido</div>
                <div class="title">Hola, {{ userName }}</div>
            </div>

            <v-spacer />

            <v-btn class="topbar-action" variant="tonal" color="primary" @click="goTo('perfil360')">
                Perfil 360
            </v-btn>
            <v-btn class="ml-3" icon variant="text" @click="handleLogout">
                <v-icon icon="mdi-logout" />
            </v-btn>
        </v-app-bar>

        <v-main>
            <v-container fluid class="dashboard-shell">
                <v-row class="hero-row" align="stretch">
                    <v-col cols="12" md="8">
                        <v-card class="hero-card" elevation="0">
                            <div class="hero-kicker">Banca en línea</div>
                            <h1 class="hero-title">Accede a tu Perfil 360</h1>
                            <p class="hero-copy">
                                Desde aquí puedes entrar a tu vista completa de productos
                            </p>

                            <div class="hero-actions">
                                <v-btn color="primary" size="large" @click="goTo('perfil360')">Abrir Perfil 360</v-btn>
                                <v-btn variant="tonal" color="primary" size="large" @click="goTo('perfil360')">Ver
                                    productos</v-btn>
                            </div>
                        </v-card>
                    </v-col>

                    <v-col cols="12" md="4">
                     <!--    <v-card class="info-card info-card-accent" elevation="0">
                            <div class="info-label">Estado</div>
                            <div class="info-value">Listo para navegar</div>
                            <div class="info-text">El menú lateral te lleva directo al perfil 360 sin saturar la
                                pantalla.</div>
                        </v-card> -->

                        <v-card class="info-card mt-4" elevation="0">
                            <div class="info-label">Productos</div>
                            <div class="info-value">Cuentas, préstamos y tarjetas</div>
                            <div class="info-text">La información se mostrará al entrar a cada módulo.</div>
                        </v-card>
                    </v-col>
                </v-row>

                <v-row class="quick-grid">
                    <v-col cols="12" sm="6" lg="3">
                        <v-card class="quick-card" elevation="0" @click="goTo('perfil360')">
                            <v-icon icon="mdi-account-details-outline" class="quick-icon" />
                            <div class="quick-title">Perfil 360</div>
                            <div class="quick-text">Ver productos</div>
                        </v-card>
                    </v-col>

                    <v-col cols="12" sm="6" lg="3">
                        <v-card class="quick-card" elevation="0" @click="goTo('perfil360')">
                            <v-icon icon="mdi-bank-outline" class="quick-icon" />
                            <div class="quick-title">Cuentas</div>
                            <div class="quick-text">Entrar a una cuenta</div>
                        </v-card>
                    </v-col>

                    <v-col cols="12" sm="6" lg="3">
                        <v-card class="quick-card" elevation="0" @click="goTo('perfil360')">
                            <v-icon icon="mdi-swap-horizontal" class="quick-icon" />
                            <div class="quick-title">Transferencias</div>
                            <div class="quick-text">Propias y ajenas</div>
                        </v-card>
                    </v-col>

                    <v-col cols="12" sm="6" lg="3">
                        <v-card class="quick-card" elevation="0" @click="goTo('perfil360')">
                            <v-icon icon="mdi-alert-circle-outline" class="quick-icon" />
                            <div class="quick-title">Reclamos</div>
                            <div class="quick-text">Solicitudes y seguimiento</div>
                        </v-card>
                    </v-col>
                </v-row>
            </v-container>
        </v-main>
    </v-app>
</template>

<style scoped>
.dashboard-app {
    background:
        radial-gradient(circle at top left, rgba(11, 89, 156, 0.12), transparent 34%),
        radial-gradient(circle at top right, rgba(27, 127, 75, 0.12), transparent 28%),
        #f5f7fb;
}

.sidebar {
    background: linear-gradient(180deg, #ffffff 0%, #f4f7fc 100%);
    border-right: 1px solid rgba(6, 57, 108, 0.08);
    padding: 20px 16px;
}

.brand-block {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 28px;
}

.brand-mark {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    color: white;
    font-weight: 800;
    background: linear-gradient(135deg, #06396c, #1b7f4b);
}

.brand-name {
    font-size: 18px;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: #0f172a;
}

.brand-caption,
.side-section-title,
.info-label,
.quick-text,
.hero-copy,
.side-card-text,
.brand-caption {
    color: rgba(15, 23, 42, 0.58);
}

.side-section-title {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    margin: 10px 6px 12px;
}

.menu-list {
    background: transparent;
}

.menu-item {
    margin-bottom: 8px;
    border: 1px solid transparent;
    transition: all 0.2s ease;
}

.menu-item:hover {
    border-color: rgba(6, 57, 108, 0.12);
    background: rgba(6, 57, 108, 0.04);
}

.menu-item-active {
    background: linear-gradient(135deg, rgba(6, 57, 108, 0.1), rgba(27, 127, 75, 0.08));
    border-color: rgba(6, 57, 108, 0.14);
}

.side-card {
    border-radius: 24px;
    padding: 18px;
    background: linear-gradient(135deg, #06396c 0%, #1b7f4b 100%);
    color: white;
}

.side-card-badge,
.hero-kicker,
.eyebrow {
    font-size: 12px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    opacity: 0.82;
}

.side-card-title {
    font-size: 20px;
    font-weight: 800;
    margin: 8px 0;
}

.topbar {
    background: rgba(255, 255, 255, 0.72);
    backdrop-filter: blur(18px);
    border-bottom: 1px solid rgba(6, 57, 108, 0.08);
}

.topbar-title {
    margin-left: 8px;
}

.topbar-title .title {
    font-size: 18px;
    font-weight: 800;
    color: #0f172a;
}

.dashboard-shell {
    padding: 28px;
}

.hero-card,
.info-card,
.quick-card {
    border-radius: 26px;
    background: rgba(255, 255, 255, 0.84);
    border: 1px solid rgba(6, 57, 108, 0.08);
    box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
}

.hero-card {
    padding: 28px;
    min-height: 100%;
    background:
        radial-gradient(circle at top right, rgba(27, 127, 75, 0.12), transparent 26%),
        radial-gradient(circle at bottom left, rgba(6, 57, 108, 0.12), transparent 28%),
        rgba(255, 255, 255, 0.92);
}

.hero-title {
    margin: 10px 0 12px;
    font-size: clamp(28px, 3vw, 44px);
    line-height: 1.05;
    color: #0f172a;
    max-width: 12ch;
}

.hero-copy {
    max-width: 62ch;
    font-size: 15px;
    line-height: 1.7;
}

.hero-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 24px;
}

.info-card {
    padding: 22px;
}

.info-card-accent {
    background: linear-gradient(135deg, rgba(6, 57, 108, 0.96), rgba(27, 127, 75, 0.92));
    color: white;
}

.info-card-accent .info-label,
.info-card-accent .info-text {
    color: rgba(255, 255, 255, 0.8);
}

.info-value {
    font-size: 22px;
    font-weight: 800;
    margin: 6px 0 8px;
}

.quick-grid {
    margin-top: 8px;
}

.quick-card {
    padding: 18px;
    min-height: 148px;
    cursor: pointer;
    transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.quick-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 22px 40px rgba(15, 23, 42, 0.12);
}

.quick-icon {
    font-size: 28px;
    color: #06396c;
    margin-bottom: 14px;
}

.quick-title {
    font-size: 18px;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 6px;
}

@media (max-width: 960px) {
    .dashboard-shell {
        padding: 18px;
    }

    .hero-title {
        max-width: none;
    }
}
</style>
