// generate-json.mjs

import { Octokit } from "@octokit/rest";
import fetch from 'node-fetch';
import fs from 'fs/promises';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  request: {
    fetch: fetch
  }
});

async function fetchIssues() {
  const issues = await octokit.issues.listForRepo({
    owner: 'justbechit',
    repo: 'rl_ladder.github.io',
    labels: 'benchmark',
    state: 'all',
    per_page: 100
  });

  return issues.data.map(issue => ({
    name: issue.user.login,
    avatar_url: issue.user.avatar_url,
    html_url: issue.user.html_url,
    created_at: issue.created_at,
    body: issue.body
  }));
}

async function main() {
  try {
    const issues = await fetchIssues();
    await fs.writeFile('ladder_data.json', JSON.stringify(issues, null, 2));
    console.log('JSON file generated successfully');
  } catch (error) {
    console.error('Error generating JSON file:', error);
    process.exit(1);
  }
}

main();