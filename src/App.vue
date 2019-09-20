<template>
  <div id="app">
    <TurnCard playerName="David"/>
  </div>
</template>

<script>
import TurnCard from './components/TurnCard.vue'

export default {
  name: 'app',
  components: {
    TurnCard
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
