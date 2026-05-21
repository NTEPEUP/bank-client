<script setup>
import Perfil360 from '../components/Perfil360.vue'
import { useRouter } from 'vue-router'

const router = useRouter()

function goBack() {
    router.push({ name: 'panel' })
}
</script>

<template>
    <v-app class="perfil360-page">
        <v-app-bar flat class="toolbar">
            <v-btn icon variant="text" @click="goBack">
                <v-icon icon="mdi-arrow-left" />
            </v-btn>

            <div class="toolbar-copy">
                <div class="toolbar-kicker">Vista del cuentahabiente</div>
                <div class="toolbar-title">Perfil 360</div>
            </div>

            <v-spacer />

            <v-btn variant="tonal" color="primary" @click="goBack">Volver al panel</v-btn>
        </v-app-bar>

        <v-main>
            <v-container fluid class="page-shell">
                <!--    <v-card class="page-hero" elevation="0">
                    <div>
                        <div class="page-kicker">Banca en línea</div>
                        <h1 class="page-title">Todo lo importante de tu cliente, en una sola vista</h1>
                        <p class="page-text">
                            Revisa productos, prepara transferencias y centraliza la información del cliente sin saturar
                            la pantalla.
                        </p>
                    </div>

                    <div class="page-pill-row">
                        <v-chip color="primary" variant="tonal">Cuentas</v-chip>
                        <v-chip color="secondary" variant="tonal">Préstamos</v-chip>
                        <v-chip color="primary" variant="tonal">Tarjetas</v-chip>
                    </div>
                </v-card> -->

                <Perfil360 />
            </v-container>
        </v-main>
    </v-app>
</template>

<style scoped>
.perfil360-page {
    background:
        radial-gradient(circle at top left, rgba(11, 89, 156, 0.12), transparent 34%),
        radial-gradient(circle at top right, rgba(27, 127, 75, 0.12), transparent 28%),
        #f5f7fb;
}

.toolbar {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(18px);
    border-bottom: 1px solid rgba(6, 57, 108, 0.08);
}

.toolbar-copy {
    margin-left: 12px;
}

.toolbar-kicker,
.page-kicker {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: rgba(15, 23, 42, 0.55);
}

.toolbar-title {
    font-size: 18px;
    font-weight: 800;
    color: #0f172a;
}

.page-shell {
    padding: 28px;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.page-hero {
    border-radius: 28px;
    padding: 28px;
    border: 1px solid rgba(6, 57, 108, 0.08);
    background:
        radial-gradient(circle at top right, rgba(27, 127, 75, 0.12), transparent 25%),
        radial-gradient(circle at bottom left, rgba(6, 57, 108, 0.12), transparent 28%),
        rgba(255, 255, 255, 0.92);
    box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
    display: flex;
    justify-content: space-between;
    gap: 20px;
    align-items: flex-end;
}

.page-title {
    margin: 8px 0 10px;
    font-size: clamp(28px, 3vw, 40px);
    line-height: 1.05;
    color: #0f172a;
    max-width: 14ch;
}

.page-text {
    max-width: 62ch;
    color: rgba(15, 23, 42, 0.68);
    line-height: 1.7;
    margin: 0;
}

.page-pill-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: flex-end;
}

@media (max-width: 960px) {
    .page-hero {
        flex-direction: column;
        align-items: flex-start;
    }

    .page-pill-row {
        justify-content: flex-start;
    }
}
</style>
