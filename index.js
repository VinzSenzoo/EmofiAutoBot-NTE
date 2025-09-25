import axios from 'axios';
import cfonts from 'cfonts';
import gradient from 'gradient-string';
import chalk from 'chalk';
import fs from 'fs/promises';
import readline from 'readline';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import ProgressBar from 'progress';
import ora from 'ora';

const logger = {
  info: (msg, options = {}) => {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const emoji = options.emoji || 'ℹ️  ';
    const context = options.context ? `[${options.context}] ` : '';
    const level = chalk.green('INFO');
    const formattedMsg = `[ ${chalk.gray(timestamp)} ] ${emoji}${level} ${chalk.white(context.padEnd(20))}${chalk.white(msg)}`;
    console.log(formattedMsg);
  },
  warn: (msg, options = {}) => {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const emoji = options.emoji || '⚠️  ';
    const context = options.context ? `[${options.context}] ` : '';
    const level = chalk.yellow('WARN');
    const formattedMsg = `[ ${chalk.gray(timestamp)} ] ${emoji}${level} ${chalk.white(context.padEnd(20))}${chalk.white(msg)}`;
    console.log(formattedMsg);
  },
  error: (msg, options = {}) => {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const emoji = options.emoji || '❌  ';
    const context = options.context ? `[${options.context}] ` : '';
    const level = chalk.red('ERROR');
    const formattedMsg = `[ ${chalk.gray(timestamp)} ] ${emoji}${level} ${chalk.white(context.padEnd(20))}${chalk.white(msg)}`;
    console.log(formattedMsg);
  }
};

function delay(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

async function countdownDelay() {
  const minSeconds = 240; 
  const maxSeconds = 450; 
  const waitTime = Math.floor(Math.random() * (maxSeconds - minSeconds + 1)) + minSeconds;
  let remaining = waitTime;

  const updateCountdown = () => {
    const min = Math.floor(remaining / 60);
    const sec = remaining % 60;
    process.stdout.write(`\rCooldown before next cycle: ${min}:${sec.toString().padStart(2, '0')}`);
  };

  updateCountdown();

  const interval = setInterval(() => {
    remaining--;
    if (remaining > 0) {
      updateCountdown();
    } else {
      clearInterval(interval);
      process.stdout.write('\r' + ' '.repeat(process.stdout.columns || 80) + '\r');
      console.log(); 
    }
  }, 1000);

  await delay(waitTime);
}

function stripAnsi(str) {
  return str.replace(/\x1B\[[0-9;]*m/g, '');
}

function centerText(text, width) {
  const cleanText = stripAnsi(text);
  const textLength = cleanText.length;
  const totalPadding = Math.max(0, width - textLength);
  const leftPadding = Math.floor(totalPadding / 2);
  const rightPadding = totalPadding - leftPadding;
  return `${' '.repeat(leftPadding)}${text}${' '.repeat(rightPadding)}`;
}

function printHeader(title) {
  const width = 80;
  console.log(gradient.morning(`┬${'─'.repeat(width - 2)}┬`));
  console.log(gradient.morning(`│ ${title.padEnd(width - 4)} │`));
  console.log(gradient.morning(`┴${'─'.repeat(width - 2)}┴`));
}

function printInfo(label, value, context) {
  logger.info(`${label.padEnd(15)}: ${chalk.cyan(value)}`, { emoji: '📍 ', context });
}

async function formatTaskTable(tasks, context) {
  console.log('\n');
  logger.info('Task List:', { context, emoji: '📋  ' });
  console.log('\n');

  const spinner = ora('Rendering tasks...').start();
  await new Promise(resolve => setTimeout(resolve, 1000));
  spinner.stop();

  const header = chalk.cyanBright('+----------------------+----------+-------+----------+\n| Task Name            | Category | Point |  Status  |\n+----------------------+----------+-------+----------+');
  const rows = tasks.map(task => {
    const displayName = task.name && typeof task.name === 'string'
      ? (task.name.length > 20 ? task.name.slice(0, 17) + '...' : task.name)
      : 'Unknown Task';
    const category = (task.category || 'N/A').padEnd(8);
    const point = (task.point || 'N/A').toString().padEnd(5);
    const status = task.status === 'COMPLETED' ? chalk.greenBright('COMPLTED') : chalk.yellowBright('Pending ');
    return `| ${displayName.padEnd(20)} | ${category} | ${point} | ${status.padEnd(6)} |`;
  }).join('\n');
  const footer = chalk.cyanBright('+----------------------+----------+-------+----------+');

  console.log(header + '\n' + rows + '\n' + footer);
  console.log('\n');
}

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/102.0'
];

function getRandomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

const emotionTypes = ['BULLISH', 'FOMO', 'NEUTRAL', 'CONFUSED', 'FUD', 'BEARISH'];

function getRandomEmotion() {
  return emotionTypes[Math.floor(Math.random() * emotionTypes.length)];
}

function getGlobalHeaders(token = null) {
  const headers = {
    'accept': '*/*',
    'accept-encoding': 'gzip, deflate, br',
    'accept-language': 'en-US,en;q=0.9,id;q=0.8',
    'content-type': 'application/json',
    'origin': 'https://emofi.xyz',
    'priority': 'u=1, i',
    'referer': 'https://emofi.xyz/',
    'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-site',
    'user-agent': getRandomUserAgent()
  };
  if (token) {
    headers['authorization'] = `Bearer ${token}`;
  }
  return headers;
}

function getAxiosConfig(proxy, token = null, extraHeaders = {}) {
  const config = {
    headers: { ...getGlobalHeaders(token), ...extraHeaders },
    timeout: 60000
  };
  if (proxy) {
    config.httpsAgent = newAgent(proxy);
    config.proxy = false;
  }
  return config;
}

function newAgent(proxy) {
  if (proxy.startsWith('http://') || proxy.startsWith('https://')) {
    return new HttpsProxyAgent(proxy);
  } else if (proxy.startsWith('socks4://') || proxy.startsWith('socks5://')) {
    return new SocksProxyAgent(proxy);
  } else {
    logger.warn(`Unsupported proxy: ${proxy}`);
    return null;
  }
}

async function requestWithRetry(method, url, payload = null, config = {}, retries = 5, backoff = 5000, context) {
  for (let i = 0; i < retries; i++) {
    try {
      let response;
      if (method.toLowerCase() === 'get') {
        response = await axios.get(url, config);
      } else if (method.toLowerCase() === 'post') {
        response = await axios.post(url, payload, config);
      } else {
        throw new Error(`Method ${method} not supported`);
      }
      return { success: true, response: response.data };
    } catch (error) {
      let status = error.response?.status;
      if (status === 429) {
        backoff = 30000;
      }
      if (status === 400 || status === 404) {
        return { success: false, message: error.response?.data?.message || 'Bad request', status };
      }
      if (i < retries - 1) {
        await delay(backoff / 1000);
        backoff *= 1.5;
        continue;
      }
      logger.error(`Request failed after ${retries} attempts: ${error.message} - Status: ${status}`, { context });
      return { success: false, message: error.message, status };
    }
  }
}

const SIGN_URL = 'https://emofi.xyz/api/sign';
const BASE_URL = 'https://api.emofi.xyz';

async function readTokens() {
  try {
    const data = await fs.readFile('token.txt', 'utf-8');
    const tokens = data.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    logger.info(`Loaded ${tokens.length} token${tokens.length === 1 ? '' : 's'}`, { emoji: '📄 ' });
    return tokens;
  } catch (error) {
    logger.error(`Failed to read token.txt: ${error.message}`, { emoji: '❌ ' });
    return [];
  }
}

async function readProxies() {
  try {
    const data = await fs.readFile('proxy.txt', 'utf-8');
    const proxies = data.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    if (proxies.length === 0) {
      logger.warn('No proxies found. Proceeding without proxy.', { emoji: '⚠️  ' });
    } else {
      logger.info(`Loaded ${proxies.length} prox${proxies.length === 1 ? 'y' : 'ies'}`, { emoji: '🌐  ' });
    }
    return proxies;
  } catch (error) {
    logger.warn('proxy.txt not found.', { emoji: '⚠️ ' });
    return [];
  }
}

async function getPublicIP(proxy, context) {
  try {
    const config = getAxiosConfig(proxy);
    delete config.headers.authorization;
    const response = await requestWithRetry('get', 'https://api.ipify.org?format=json', null, config, 5, 5000, context);
    return response.response.ip || 'Unknown';
  } catch (error) {
    logger.error(`Failed to get IP: ${error.message}`, { emoji: '❌  ', context });
    return 'Error retrieving IP';
  }
}

async function fetchUserInfo(token, proxy, context) {
  try {
    const res = await requestWithRetry('get', `${BASE_URL}/api/front/users/me`, null, getAxiosConfig(proxy, token), 5, 5000, context);
    if (!res.success) {
      throw new Error(res.message);
    }
    return {
      username: res.response.data.name || 'Unknown',
      points: res.response.data.point || 'N/A'
    };
  } catch (error) {
    logger.error(`Failed to fetch user info: ${error.message}`, { context });
    return { username: 'Unknown', points: 'N/A' };
  }
}

async function performSign(payload, token, proxy, context) {
  try {
    const res = await requestWithRetry('post', SIGN_URL, payload, getAxiosConfig(proxy, token), 5, 5000, context);
    if (!res.success) {
      throw new Error(res.message);
    }
    return res.response;
  } catch (error) {
    logger.error(`Failed to perform sign: ${error.message}`, { context });
    return null;
  }
}

async function performCheckinSubmit(payload, extraHeaders, token, proxy, context) {
  const url = `${BASE_URL}/api/front/tasks/daily-checkin/submit?locale=en`;
  try {
    const res = await requestWithRetry('post', url, payload, getAxiosConfig(proxy, token, extraHeaders), 5, 5000, context);
    if (!res.success) {
      throw new Error(res.message);
    }
    return res.response;
  } catch (error) {
    logger.error(`Failed to submit checkin: ${error.message}`, { context });
    return null;
  }
}

async function fetchTasks(token, proxy, context) {
  const url = `${BASE_URL}/api/front/tasks/social?limit=20&page=1&isAll=false`;
  try {
    const res = await requestWithRetry('get', url, null, getAxiosConfig(proxy, token), 5, 5000, context);
    if (!res.success) {
      throw new Error(res.message);
    }
    return res.response.data.items || [];
  } catch (error) {
    logger.error(`Failed to fetch tasks: ${error.message}`, { context });
    return [];
  }
}

async function performTaskSubmit(payload, extraHeaders, token, proxy, context) {
  const url = `${BASE_URL}/api/front/tasks/social/submit`;
  try {
    const res = await requestWithRetry('post', url, payload, getAxiosConfig(proxy, token, extraHeaders), 5, 5000, context);
    if (!res.success) {
      throw new Error(res.message);
    }
    return res.response;
  } catch (error) {
    logger.error(`Failed to submit task: ${error.message}`, { context });
    return null;
  }
}

async function processToken(token, index, total, proxy = null) {
  const context = `Account ${index + 1}/${total}`;
  logger.info(chalk.bold.magentaBright(`Starting account processing`), { emoji: '🚀 ', context });

  printHeader(`Account Info ${context}`);
  const ip = await getPublicIP(proxy, context);
  const userInfo = await fetchUserInfo(token, proxy, context);
  printInfo('IP', ip, context);
  printInfo('Username', userInfo.username, context);
  console.log('\n');

  console.log('\n');
  logger.info('Starting daily checkin process...', { context });
  console.log('\n');

  const emotion = getRandomEmotion();
  const signPayload = { emotionType: emotion };
  const signRes = await performSign(signPayload, token, proxy, context);
  if (signRes) {
    const extraHeaders = {
      'x-api-key': signRes.headers['x-api-key'],
      'x-api-timestamp': signRes.headers['x-api-timestamp']
    };
    const checkinRes = await performCheckinSubmit(signPayload, extraHeaders, token, proxy, context);
    if (checkinRes && checkinRes.statusCode === 200) {
      logger.info(chalk.bold.greenBright(`Checkin successful: +${checkinRes.data.reward} points, Streak: ${checkinRes.data.streak}`), { emoji: '✅  ', context });
    } else if (checkinRes && checkinRes.statusCode === 400 && checkinRes.message.includes('already completed')) {
      logger.warn(chalk.bold.yellowBright('Already checked in today'), { emoji: '⚠️  ', context });
    } else {
      logger.error('Checkin failed', { emoji: '❌  ', context });
    }
  } else {
    logger.error('Sign for checkin failed', { emoji: '❌  ', context });
  }

  let tasks = await fetchTasks(token, proxy, context);
  if (tasks.length === 0) {
    logger.info('No tasks available', { emoji: '⚠️  ', context });
    return;
  }

  console.log('\n');
  logger.info('Starting task completion process...', { context });
  console.log('\n');

  const uncompletedTasks = tasks.filter(task => task.status === 'UNCOMPLETED');
  if (uncompletedTasks.length > 0) {
    const bar = new ProgressBar('Completing [:bar] :percent :etas', {
      complete: '█',
      incomplete: '░',
      width: 30,
      total: uncompletedTasks.length
    });

    for (let i = 0; i < uncompletedTasks.length; i++) {
      const task = uncompletedTasks[i];
      const taskContext = `${context}|${task.name.slice(0, 10)}`;
      const spinner = ora({ text: `Processing task ${i + 1}: ${task.name}...`, spinner: 'dots' }).start();

      if (task.type === 'ADD_NAME_X') {
        spinner.warn(chalk.bold.yellowBright(`  Skipping task: ${task.name} (requires manual verification)`));
        bar.tick();
        if (i < uncompletedTasks.length - 1) {
          await delay(15);
        }
        continue;
      }

      const taskSignPayload = { type: task.type };
      const taskSignRes = await performSign(taskSignPayload, token, proxy, taskContext);
      if (!taskSignRes) {
        spinner.fail(chalk.bold.redBright(`Failed to sign for task`));
        bar.tick();
        if (i < uncompletedTasks.length - 1) {
          await delay(15);
        }
        continue;
      }

      const extraHeaders = {
        'x-api-key': taskSignRes.headers['x-api-key'],
        'x-api-timestamp': taskSignRes.headers['x-api-timestamp']
      };

      const taskSubmitRes = await performTaskSubmit(taskSignPayload, extraHeaders, token, proxy, taskContext);
      if (taskSubmitRes && taskSubmitRes.statusCode === 200) {
        spinner.succeed(chalk.bold.greenBright(`  Task completed: +${taskSubmitRes.data.reward} points`));
      } else {
        spinner.fail(chalk.bold.redBright(`  Failed to complete task`));
      }

      bar.tick();
      if (i < uncompletedTasks.length - 1) {
        await delay(15);
      }
    }
  } else {
    logger.info(chalk.bold.yellowBright('No uncompleted tasks found'), { emoji: '⚠️  ', context });
  }

  tasks = await fetchTasks(token, proxy, context);
  await formatTaskTable(tasks, context);

  printHeader(`Account Stats ${context}`);
  const finalUserInfo = await fetchUserInfo(token, proxy, context);
  printInfo('Username', finalUserInfo.username, context);
  printInfo('Points', finalUserInfo.points, context);

  logger.info(chalk.bold.greenBright(`Completed account processing`), { emoji: '🎉 ', context });
}

async function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

let globalUseProxy = false;
let globalProxies = [];

async function initializeConfig() {
  const useProxyAns = await askQuestion(chalk.cyanBright('🔌 Do You Want Use Proxy? (y/n): '));
  if (useProxyAns.trim().toLowerCase() === 'y') {
    globalUseProxy = true;
    globalProxies = await readProxies();
    if (globalProxies.length === 0) {
      globalUseProxy = false;
      logger.warn('No proxies available, proceeding without proxy.', { emoji: '⚠️ ' });
    }
  } else {
    logger.info('Proceeding without proxy.', { emoji: 'ℹ️ ' });
  }
}

async function runCycle() {
  const tokens = await readTokens();
  if (tokens.length === 0) {
    logger.error('No tokens found in token.txt. Exiting cycle.', { emoji: '❌ ' });
    return;
  }

  for (let i = 0; i < tokens.length; i++) {
    const proxy = globalUseProxy ? globalProxies[i % globalProxies.length] : null;
    try {
      await processToken(tokens[i], i, tokens.length, proxy);
    } catch (error) {
      logger.error(`Error processing account: ${error.message}`, { emoji: '❌ ', context: `Account ${i + 1}/${tokens.length}` });
    }
    if (i < tokens.length - 1) {
      console.log('\n\n');
    }
    await delay(5);
  }
}

async function run() {
  const terminalWidth = process.stdout.columns || 80;
  cfonts.say('NT EXHAUST', {
    font: 'block',
    align: 'center',
    colors: ['cyan', 'magenta'],
    background: 'transparent',
    letterSpacing: 1,
    lineHeight: 1,
    space: true
  });
  console.log(gradient.retro(centerText('=== Telegram Channel 🚀 : NT EXHAUST @NTExhaust ===', terminalWidth)));
  console.log(gradient.retro(centerText('✪ BOT EMOFI AUTO CHECKIN & COMPLETE TASKS ✪', terminalWidth)));
  console.log('\n');
  await initializeConfig();

  while (true) {
    await runCycle();
    logger.info(chalk.bold.yellowBright('Cycle completed. Waiting 9 Hours...'), { emoji: '🔄 ' });
    await delay(32400);
  }
}

run().catch(error => logger.error(`Fatal error: ${error.message}`, { emoji: '❌' }));