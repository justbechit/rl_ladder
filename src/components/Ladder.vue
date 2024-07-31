<template>
  <v-container>
    <v-data-table
        :headers="filteredHeaders"
        :items="results"
        :items-per-page="10"
        :sort-by="['avg_score']"
        :sort-desc="[true]"
        class="elevation-1"
    >
      <template v-slot:top>
        <v-toolbar flat>
          <v-toolbar-title>RL Algorithm Ladder</v-toolbar-title>
        </v-toolbar>
      </template>
      <template v-slot:item.avatar="{ item }">
        <a :href="item.html_url" target="_blank" rel="noopener noreferrer">
          <v-avatar size="40">
            <v-img :src="item.avatar_url" :alt="item.name"></v-img>
          </v-avatar>
        </a>
      </template>
      <template v-slot:item.name="{ item }">
        <a :href="item.html_url" target="_blank" rel="noopener noreferrer">
          {{ item.name }}
        </a>
      </template>
      <template v-slot:item.created_at="{ item }">
        {{ formatDate(item.created_at) }}
      </template>
      <template v-slot:item.avg_score="{ item }">
        {{ item.avg_score != null ? item.avg_score.toFixed(2) : 'N/A' }}
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
      { text: 'Avatar', value: 'avatar', sortable: false },
      { text: 'Name', value: 'name' },
      { text: 'Algorithm', value: 'algorithm' },
      { text: 'Avg Score', value: 'avg_score' },
      { text: 'Submitted At', value: 'created_at' },
      { text: 'Actions', value: 'actions', sortable: false },
    ],
    results: [],
    dialog: false,
    selectedItem: null,
    baseUrl: process.env.NODE_ENV === 'production' ? '/rl_ladder/' : '/',
  }),
  computed: {
    filteredHeaders() {
      const dynamicHeaders = this.results.reduce((acc, result) => {
        Object.keys(result).forEach(key => {
          const cleanKey = this.cleanKey(key);
          if (!['avatar', 'name', 'algorithm', 'avg_score', 'created_at', 'actions', 'avatar_url', 'html_url', 'train episodes', 'eval episodes'].includes(cleanKey.toLowerCase()) &&
              !acc.some(header => header.value === cleanKey) &&
              typeof result[key] === 'number') {
            acc.push({ text: cleanKey, value: cleanKey });
          }
        });
        return acc;
      }, []);

      dynamicHeaders.sort((a, b) => a.text.localeCompare(b.text));

      const trainEpisodes = this.results.some(result => 'Train episodes' in result)
          ? [{ text: 'Train Episodes', value: 'Train episodes' }]
          : [];
      const evalEpisodes = this.results.some(result => 'Eval episodes' in result)
          ? [{ text: 'Eval Episodes', value: 'Eval episodes' }]
          : [];

      return [
        this.headers[0], // Avatar
        this.headers[1], // Name
        this.headers[2], // Algorithm
        this.headers[3], // Avg Score
        ...dynamicHeaders,
        this.headers[4], // Submitted At
        ...trainEpisodes,
        ...evalEpisodes,
        this.headers[5], // Actions
      ];
    },
    isDevelopment() {
      return process.env.NODE_ENV === 'development';
    },
  },
  mounted() {
    this.fetchResults();
  },
  methods: {
    async fetchResults() {
      try {
        console.log('Fetching results...');
        if (this.isDevelopment) {
          const response = await axios.get('https://api.github.com/repos/justbechit/rl_ladder/issues?labels=benchmark');
          this.results = response.data.map(issue => this.parseIssue(issue));
        } else {
          const url = this.baseUrl + 'ladder_data.json';
          console.log('Fetching from URL:', url);
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          this.results = await response.json();
        }
        this.results = this.cleanResults(this.results);
        console.log('Fetched results:', this.results);
      } catch (error) {
        console.error('Error fetching results:', error);
      }
    },
    parseIssue(issue) {
      const result = {
        name: issue.user.login,
        avatar_url: issue.user.avatar_url,
        html_url: issue.user.html_url,
        algorithm: '',
        created_at: issue.created_at
      };

      const lines = issue.body.split('\n');
      lines.forEach(line => {
        line = line.trim();
        const [key, value] = line.split(':').map(s => s.trim());
        if (key && value) {
          const cleanKey = this.cleanKey(key);
          if (cleanKey.toLowerCase() === 'algorithm') {
            result.algorithm = value;
          } else if (!['Pretrained', 'Comment'].includes(cleanKey)) {
            result[cleanKey] = isNaN(parseFloat(value)) ? value : parseFloat(value);
          }
        }
      });

      return result;
    },
    cleanResults(results) {
      return results.map(result => {
        const cleanResult = {};
        for (const [key, value] of Object.entries(result)) {
          const cleanKey = this.cleanKey(key);
          cleanResult[cleanKey] = value;
        }

        // Calculate average score
        const scores = Object.entries(cleanResult)
            .filter(([key, value]) => key !== 'avg_score' && typeof value === 'number' &&
                !['Train episodes', 'Eval episodes'].includes(key))
            .map(([_, value]) => value);
        cleanResult.avg_score = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null;

        return cleanResult;
      });
    },
    cleanKey(key) {
      // 只清除两侧的特殊字符，保留中间的内容和大小写
      return key.replace(/^[-@.\s]+|[-@.\s]+$/g, '');
    },
    showDetails(item) {
      this.selectedItem = item;
      this.dialog = true;
    },
    formatDate(dateString) {
      const options = {year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'};
      return new Date(dateString).toLocaleDateString('en-US', options);
    },
  },
};
</script>

<style scoped>
a {
  text-decoration: none;
  color: inherit;
}
</style>