<template>
  <v-container>
    <v-data-table
      :headers="headers"
      :items="results"
      :items-per-page="10"
      class="elevation-1"
    >
      <template v-slot:top>
        <v-toolbar flat>
          <v-toolbar-title>RL Algorithm Ladder</v-toolbar-title>
        </v-toolbar>
      </template>
      <template v-slot:item.actions="{ item }">
        <v-btn small @click="showDetails(item)">Details</v-btn>
      </template>
    </v-data-table>
    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title>Details</v-card-title>
        <v-card-text>
          <v-simple-table>
            <template v-slot:default>
              <tbody>
                <tr v-for="(value, key) in selectedItem" :key="key">
                  <td>{{ key }}</td>
                  <td>{{ value }}</td>
                </tr>
              </tbody>
            </template>
          </v-simple-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="dialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import axios from 'axios';

export default {
  data: () => ({
    headers: [
      { text: 'Name', value: 'name' },
      { text: 'Algorithm', value: 'algo' },
      { text: 'Pong', value: 'Pong' },
      { text: 'Breakout', value: 'Breakout' },
      { text: 'SpaceInvaders', value: 'SpaceInvaders' },
      { text: 'Actions', value: 'actions', sortable: false },
    ],
    results: [],
    dialog: false,
    selectedItem: null,
  }),
  mounted() {
    this.fetchResults();
  },
  methods: {
    async fetchResults() {
      try {
        const response = await axios.get('https://api.github.com/repos/justbechit/rl_ladder/issues?labels=benchmark');
        this.results = response.data.map(issue => this.parseIssue(issue));
      } catch (error) {
        console.error('Error fetching results:', error);
      }
    },
    parseIssue(issue) {
      const lines = issue.body.split('\n');
      const result = {};
      lines.forEach(line => {
        const [key, value] = line.split(':').map(s => s.trim());
        if (key && value) {
          result[key] = value;
        }
      });
      return result;
    },
    showDetails(item) {
      this.selectedItem = item;
      this.dialog = true;
    },
  },
};
</script>
