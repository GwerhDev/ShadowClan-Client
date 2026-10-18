<script setup lang="ts">
import type { RaffleWin } from '../../../interfaces';

// Aviso al ganador de un sorteo (socket 'raffle:won' o pendiente al entrar).
defineProps<{ win: RaffleWin }>();
defineEmits<{ (e: 'close'): void }>();

const SPARKS = 14;
</script>

<template>
  <div class="raffle-won-overlay" @click.self="$emit('close')">
    <div class="raffle-won-modal">
      <div class="raffle-won-sparks" aria-hidden="true">
        <span v-for="n in SPARKS" :key="n" :style="{ '--i': n }"></span>
      </div>

      <div class="raffle-won-icon">
        <i class="fas fa-trophy"></i>
      </div>

      <h2>¡Ganaste un sorteo!</h2>

      <p class="raffle-won-prize">{{ win.prizeName }}</p>
      <p v-if="win.prizeDescription" class="raffle-won-desc">{{ win.prizeDescription }}</p>

      <p class="raffle-won-sub">
        Tu personaje <b>{{ win.characterName }}</b> resultó ganador en el clan
        <b>{{ win.clanName }}</b>.
      </p>
      <p class="raffle-won-sub">Ponte en contacto con los líderes de tu clan para cobrar tu premio.</p>

      <button class="raffle-won-btn" @click="$emit('close')">Entendido</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
$gold: rgb(227, 210, 168);
$gold-dim: rgba(227, 210, 168, .2);

.raffle-won-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.raffle-won-modal {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .85rem;
  text-align: center;
  background: #121212;
  border: 1px solid $gold-dim;
  border-radius: 12px;
  padding: 2.5rem 2rem 2rem;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 0 60px rgba(227, 210, 168, .12), 0 0 40px rgba(0, 0, 0, .6);
  overflow: hidden;
  animation: pop-in .45s cubic-bezier(.2, 1.4, .4, 1);

  h2 {
    margin: 0;
    font-size: 1.25rem;
    color: var(--color-app-white);
  }
}

.raffle-won-icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(227, 210, 168, .1);
  border: 1px solid rgba(227, 210, 168, .35);

  i {
    font-size: 2rem;
    color: $gold;
    filter: drop-shadow(0 0 10px rgba(227, 210, 168, .55));
    animation: glow 1.6s ease-in-out infinite;
  }
}

.raffle-won-prize {
  margin: 0;
  font-family: 'Cinzel', serif;
  font-size: 1.15rem;
  font-weight: 600;
  color: $gold;
}

.raffle-won-desc {
  margin: -.4rem 0 0;
  font-size: .82rem;
  color: rgba(255, 255, 255, .5);
}

.raffle-won-sub {
  margin: 0;
  font-size: .88rem;
  line-height: 1.55;
  color: rgba(255, 255, 255, .7);

  b { color: var(--color-app-white); }
}

.raffle-won-btn {
  margin-top: .5rem;
  padding: .55rem 2rem;
  border-radius: 8px;
  font-size: .88rem;
  background: rgba(227, 210, 168, .12);
  border: 1px solid rgba(227, 210, 168, .45);
  color: $gold;
  cursor: pointer;
  transition: background .15s;

  &:hover { background: rgba(227, 210, 168, .2); }
}

// Destellos que caen desde arriba.
.raffle-won-sparks {
  position: absolute;
  inset: 0;
  pointer-events: none;

  span {
    position: absolute;
    top: -10px;
    left: calc((var(--i) * 7%) - 3%);
    width: 6px;
    height: 10px;
    border-radius: 2px;
    background: $gold;
    opacity: 0;
    animation: fall 2.4s ease-in calc(var(--i) * .12s) infinite;

    &:nth-child(3n) { background: #e57373; }
    &:nth-child(4n) { background: #69a9e4; }
  }
}

@keyframes pop-in {
  from { transform: scale(.85); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
}

@keyframes glow {
  0%, 100% { filter: drop-shadow(0 0 6px rgba(227, 210, 168, .4)); }
  50%      { filter: drop-shadow(0 0 16px rgba(227, 210, 168, .85)); }
}

@keyframes fall {
  0%   { transform: translateY(0) rotate(0deg); opacity: 0; }
  10%  { opacity: .9; }
  100% { transform: translateY(460px) rotate(320deg); opacity: 0; }
}
</style>
