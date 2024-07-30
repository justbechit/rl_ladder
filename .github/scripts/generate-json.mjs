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

function parseIssue(issue) {
  const result = {
    name: issue.name,
    avatar_url: issue.avatar_url,
    html_url: issue.html_url,
    algorithm: '',
    Pong: '',
    Breakout: '',
    SpaceInvaders: '',
    Pretrained: '',
    TrainEpisodes: '',
    EvalEpisodes: '',
    Comment: '',
    created_at: issue.created_at
  };

  const lines = issue.body.split('\n');
  lines.forEach(line => {
    line = line.trim();
    if (line.startsWith('Algorithm:')) {
      result.algorithm = line.split(':')[1].trim();
    } else if (line.startsWith('Pretrained:')) {
      result.Pretrained = line.split(':')[1].trim();
    } else if (line.startsWith('Train episodes:')) {
      result.TrainEpisodes = line.split(':')[1].trim();
    } else if (line.startsWith('Eval episodes:')) {
      result.EvalEpisodes = line.split(':')[1].trim();
    } else if (line.startsWith('Comment:')) {
      result.Comment = line.split(':')[1].trim();
    } else {
      const [key, value] = line.split(':').map(s => s.trim());
      if (key && value && result.hasOwnProperty(key)) {
        result[key] = value;
      }
    }
  });

  // Remove leading dash if present
  for (let key in result) {
    if (typeof result[key] === 'string' && result[key].startsWith('- ')) {
      result[key] = result[key].substring(2);
    }
  }

  // Calculate average score
  const scores = ['Pong', 'Breakout', 'SpaceInvaders'].map(game => parseFloat(result[game]));
  result.avg_score = scores.reduce((sum, score) => sum + score, 0) / scores.length;

  return result;
}

async function main() {
  try {
    const issues = await fetchIssues();
    const parsedIssues = issues.map(parseIssue);
    await fs.writeFile('ladder_data.json', JSON.stringify(parsedIssues, null, 2));
    console.log('JSON file generated successfully');
  } catch (error) {
    console.error('Error generating JSON file:', error);
    process.exit(1);
  }
}

main();