<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <v-toolbar-title>RL Ladder</v-toolbar-title>
    </v-app-bar>

    <v-main>
      <Ladder />
    </v-main>
  </v-app>
</template>

<script>
import Ladder from './components/Ladder.vue'

export default {
  name: 'App',
  components: {
    Ladder
  },
};
</script>
