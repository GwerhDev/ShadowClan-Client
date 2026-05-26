<script setup lang="ts">
defineProps<{ type: 'accepted' | 'removed'; clanName: string }>();
defineEmits<{ (e: 'close'): void }>();
</script>

<template>
  <div class="clan-event-overlay" @click.self="$emit('close')">
    <div class="clan-event-modal">
      <div class="clan-event-icon" :class="type">
        <i :class="type === 'accepted' ? 'fas fa-shield-halved' : 'fas fa-door-open'"></i>
      </div>

      <template v-if="type === 'accepted'">
        <h2>¡Bienvenido al clan!</h2>
        <p class="clan-event-name">{{ clanName }}</p>
        <p class="clan-event-sub">Has sido aceptado como miembro. Ya tienes acceso a las funciones del clan.</p>
      </template>

      <template v-else>
        <h2>Has salido del clan</h2>
        <p class="clan-event-name">{{ clanName }}</p>
        <p class="clan-event-sub">Has sido removido del clan. Puedes solicitar unirte a otro cuando quieras.</p>
      </template>

      <button class="clan-event-btn" @click="$emit('close')">Entendido</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
$gold: rgb(227, 210, 168);
$gold-dim: rgba(227, 210, 168, .15);

.clan-event-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.clan-event-modal {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
  background: #121212;
  border: 1px solid $gold-dim;
  border-radius: 12px;
  padding: 2.5rem 2rem;
  max-width: 380px;
  width: 90%;
  box-shadow: 0 0 40px rgba(0, 0, 0, .6);

  h2 {
    margin: 0;
    font-size: 1.2rem;
    color: var(--color-app-white);
  }
}

.clan-event-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  i { font-size: 1.7rem; }

  &.accepted {
    background: rgba(40, 120, 40, .15);
    border: 1px solid rgba(80, 180, 80, .25);
    i { color: #81c784; filter: drop-shadow(0 0 8px rgba(80, 180, 80, .4)); }
  }

  &.removed {
    background: rgba(180, 40, 40, .12);
    border: 1px solid rgba(180, 40, 40, .25);
    i { color: rgba(229, 115, 115, .85); filter: drop-shadow(0 0 8px rgba(200, 40, 40, .4)); }
  }
}

.clan-event-name {
  margin: 0;
  font-family: 'Cinzel', serif;
  font-size: 1rem;
  color: $gold;
  letter-spacing: .05em;
}

.clan-event-sub {
  margin: 0;
  font-size: .85rem;
  color: rgba(255, 255, 255, .45);
  line-height: 1.6;
}

.clan-event-btn {
  margin-top: .5rem;
  padding: .55rem 1.6rem;
  border-radius: 6px;
  font-family: 'Cinzel', serif;
  font-size: .8rem;
  letter-spacing: .05em;
  background: transparent;
  border: 1px solid rgba(227, 210, 168, .4);
  color: $gold;
  cursor: pointer;
  transition: background .2s, border-color .2s;

  &:hover {
    background: rgba(227, 210, 168, .08);
    border-color: $gold;
  }
}
</style>
