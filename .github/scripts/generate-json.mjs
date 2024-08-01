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

function parseIssueBody(body) {
  const result = {
    algorithm: '',
  };
  const lines = body.split('\n');
  lines.forEach(line => {
    line = line.trim();
    const [key, value] = line.split(':').map(s => s.trim());
    if (key && value) {
      const cleanKey = key.replace(/^[-@.\s]+|[-@.\s]+$/g, '');
      if (cleanKey.toLowerCase() === 'algorithm') {
        result.algorithm = value;
      } else if (!['Pretrained', 'Comment'].includes(cleanKey)) {
        result[cleanKey] = isNaN(parseFloat(value)) ? value : parseFloat(value);
      }
    }
  });
  return result;
}

async function fetchIssues() {
  const issues = await octokit.issues.listForRepo({
    owner: 'justbechit',
    repo: 'rl_ladder.github.io',
    labels: 'benchmark',
    state: 'all',
    per_page: 100
  });

  console.log(`Total issues fetched: ${issues.data.length}`);

  return issues.data.map(issue => {
    const parsedBody = parseIssueBody(issue.body);
    return {
      name: issue.user.login,
      avatar_url: issue.user.avatar_url,
      html_url: issue.user.html_url,
      created_at: issue.created_at,
      state: issue.state,
      algorithm: parsedBody.algorithm,
      ...parsedBody
    };
  });
}

function calculateAverageScore(issue) {
  const scores = Object.entries(issue)
      .filter(([key, value]) =>
          key !== 'avg_score' &&
          typeof value === 'number' &&
          !['Train episodes', 'Eval episodes'].includes(key)
      )
      .map(([_, value]) => value);

  return scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : null;
}

async function main() {
  try {
    let issues = await fetchIssues();

    // 计算平均分数
    issues = issues.map(issue => ({
      ...issue,
      avg_score: calculateAverageScore(issue)
    }));

    // 输出一些统计信息
    const openIssues = issues.filter(issue => issue.state === 'open');
    const closedIssues = issues.filter(issue => issue.state === 'closed');

    console.log(`Open issues: ${openIssues.length}`);
    console.log(`Closed issues: ${closedIssues.length}`);

    // 如果有关闭的issues，输出第一个关闭的issue的信息
    if (closedIssues.length > 0) {
      console.log('Sample closed issue:');
      console.log(JSON.stringify(closedIssues[0], null, 2));
    }

    await fs.writeFile('public/ladder_data.json', JSON.stringify(issues, null, 2));
    console.log('JSON file generated successfully');
  } catch (error) {
    console.error('Error generating JSON file:', error);
    process.exit(1);
  }
}

main();