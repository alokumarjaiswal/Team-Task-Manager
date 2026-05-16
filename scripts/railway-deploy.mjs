#!/usr/bin/env node
import crypto from 'crypto';
import fs from 'fs';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectName = path.basename(repoRoot);
const railwaySession = `railway-deploy-${Date.now()}-${process.pid}`;
const railwayEnv = {
  ...process.env,
  RAILWAY_CALLER: 'script:railway-deploy@1.0.0',
  RAILWAY_AGENT_SESSION: railwaySession,
};
const railwayPs1 = process.platform === 'win32'
  ? path.join(process.env.APPDATA || '', 'npm', 'railway.ps1')
  : null;

const args = process.argv.slice(2);
const options = {
  repo: null,
  branch: null,
  skipDeploy: false,
};

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === '--repo') {
    options.repo = args[++index] || null;
    continue;
  }
  if (arg === '--branch') {
    options.branch = args[++index] || null;
    continue;
  }
  if (arg === '--skip-deploy') {
    options.skipDeploy = true;
    continue;
  }
  if (arg === '--help' || arg === '-h') {
    console.log(`Usage: node scripts/railway-deploy.mjs [--repo owner/repo] [--branch branch-name] [--skip-deploy]`);
    process.exit(0);
  }
}

function runCommand(command, commandArgs, { cwd = repoRoot, input, allowFailure = false } = {}) {
  const useWindowsRailwayShim = process.platform === 'win32' && command === 'railway';
  const actualCommand = useWindowsRailwayShim && fs.existsSync(railwayPs1) ? 'powershell.exe' : command;
  const actualArgs = useWindowsRailwayShim && fs.existsSync(railwayPs1)
    ? ['-NoLogo', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', railwayPs1, ...commandArgs]
    : commandArgs;

  const result = spawnSync(actualCommand, actualArgs, {
    cwd,
    env: railwayEnv,
    input,
    encoding: 'utf8',
    shell: false,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0 && !allowFailure) {
    const stdout = result.stdout ? `\nSTDOUT:\n${result.stdout}` : '';
    const stderr = result.stderr ? `\nSTDERR:\n${result.stderr}` : '';
    throw new Error(`${command} ${commandArgs.join(' ')} failed with exit code ${result.status}${stdout}${stderr}`);
  }

  return {
    status: result.status,
    stdout: (result.stdout || '').trim(),
    stderr: (result.stderr || '').trim(),
  };
}

function runRailway(commandArgs, options = {}) {
  return runCommand('railway', commandArgs, options);
}

function runRailwayJson(commandArgs, options = {}) {
  const result = runRailway([...commandArgs, '--json'], options);
  if (!result.stdout) {
    return null;
  }
  return JSON.parse(result.stdout);
}

function normalizeServices(payload) {
  if (!payload) {
    return [];
  }
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload.services)) {
    return payload.services;
  }
  if (payload.services?.edges) {
    return payload.services.edges.map((edge) => edge.node).filter(Boolean);
  }
  if (payload.edges) {
    return payload.edges.map((edge) => edge.node).filter(Boolean);
  }
  return [];
}

function getServiceMap() {
  const payload = runRailwayJson(['service', 'list']);
  return new Map(normalizeServices(payload).map((service) => [service.name, service]));
}

function getStatus() {
  return runRailwayJson(['status']);
}

function getWorkspaceId() {
  const payload = runRailwayJson(['whoami']);
  return payload?.workspaces?.[0]?.id || payload?.workspaces?.[0]?.name || null;
}

function getRepoSlug() {
  if (options.repo) {
    return options.repo;
  }

  const remote = runCommand('git', ['remote', 'get-url', 'origin'], { allowFailure: true }).stdout;
  if (!remote) {
    return null;
  }

  const githubMatch = remote.match(/github\.com[:/](?<owner>[^/]+)\/(?<repo>[^/.]+)(?:\.git)?$/i);
  if (!githubMatch?.groups) {
    return null;
  }

  return `${githubMatch.groups.owner}/${githubMatch.groups.repo}`;
}

function getCurrentBranch() {
  if (options.branch) {
    return options.branch;
  }

  const branch = runCommand('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { allowFailure: true }).stdout;
  return branch && branch !== 'HEAD' ? branch : 'main';
}

function ensureProject() {
  const status = runRailwayJson(['status'], { allowFailure: true });
  if (status?.id) {
    return status;
  }

  const workspace = getWorkspaceId();
  const initArgs = ['init', '--name', projectName];
  if (workspace) {
    initArgs.push('--workspace', workspace);
  }

  runRailwayJson(initArgs);
  const createdStatus = getStatus();
  if (!createdStatus?.id) {
    throw new Error('Unable to resolve Railway project after init.');
  }
  return createdStatus;
}

function ensureService(serviceName, repoSlug) {
  const services = getServiceMap();
  if (services.has(serviceName)) {
    return services.get(serviceName);
  }

  const addArgs = ['add', '--service', serviceName];
  if (repoSlug) {
    addArgs.push('--repo', repoSlug);
  }
  runRailwayJson(addArgs);

  const refreshed = getServiceMap();
  if (!refreshed.has(serviceName)) {
    throw new Error(`Failed to create Railway service: ${serviceName}`);
  }
  return refreshed.get(serviceName);
}

function setServiceConfig(projectId, environmentName, serviceName, configPath, value) {
  runRailway(['environment', 'edit', '--project', projectId, '--environment', environmentName, '--service-config', serviceName, configPath, value]);
}

function setVariable(projectId, environmentName, serviceName, key, value, { skipDeploys = false } = {}) {
  const commandArgs = ['variable', 'set', '--service', serviceName, '--project', projectId, '--environment', environmentName];
  if (skipDeploys) {
    commandArgs.push('--skip-deploys');
  }
  if (key === 'JWT_SECRET') {
    const result = runCommand('railway', [...commandArgs, key, '--stdin'], { input: value });
    if (result.status !== 0) {
      throw new Error(`Failed to set ${key} on ${serviceName}`);
    }
    return;
  }
  runRailway([...commandArgs, `${key}=${value}`]);
}

function getVariables(serviceName, projectId, environmentName) {
  const payload = runRailwayJson(['variable', 'list', '--service', serviceName, '--project', projectId, '--environment', environmentName]);
  if (!payload) {
    return {};
  }

  if (Array.isArray(payload)) {
    return Object.fromEntries(payload.map((entry) => [entry.key, entry.value]));
  }

  return payload;
}

function toHttpsUrl(domainValue) {
  if (!domainValue) {
    return null;
  }
  if (domainValue.startsWith('http://') || domainValue.startsWith('https://')) {
    return domainValue;
  }
  return `https://${domainValue}`;
}

function findRailwayDomain(value) {
  const seen = new Set();
  const queue = [value];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || seen.has(current)) {
      continue;
    }
    if (typeof current === 'string') {
      const match = current.match(/([a-z0-9-]+\.)?up\.railway\.app/i);
      if (match) {
        return match[0];
      }
      continue;
    }
    if (typeof current === 'object') {
      seen.add(current);
      for (const entry of Object.values(current)) {
        queue.push(entry);
      }
    }
  }

  return null;
}

function ensureDomain(projectId, environmentName, serviceName) {
  const payload = runRailwayJson(['domain', '--service', serviceName, '--project', projectId, '--environment', environmentName]);
  const domain = findRailwayDomain(payload);
  if (!domain) {
    throw new Error(`Unable to determine public domain for ${serviceName}`);
  }
  return toHttpsUrl(domain);
}

function deployService(projectId, environmentName, serviceName, relativePath) {
  if (options.skipDeploy) {
    return;
  }

  runRailway(['up', relativePath, '--path-as-root', '--service', serviceName, '--project', projectId, '--environment', environmentName, '--ci', '--message', `deploy ${serviceName}`]);
}

function configureService(projectId, environmentName, serviceName, relativePath, startCommand, healthcheckPath) {
  const repoSlug = getRepoSlug();
  const branch = getCurrentBranch();

  if (repoSlug) {
    setServiceConfig(projectId, environmentName, serviceName, 'source.repo', repoSlug);
    setServiceConfig(projectId, environmentName, serviceName, 'source.branch', branch);
  }
  setServiceConfig(projectId, environmentName, serviceName, 'source.rootDirectory', relativePath);
  setServiceConfig(projectId, environmentName, serviceName, 'deploy.startCommand', startCommand);
  setServiceConfig(projectId, environmentName, serviceName, 'deploy.restartPolicyType', 'ON_FAILURE');
  setServiceConfig(projectId, environmentName, serviceName, 'deploy.restartPolicyMaxRetries', '10');
  if (healthcheckPath) {
    setServiceConfig(projectId, environmentName, serviceName, 'deploy.healthcheckPath', healthcheckPath);
  }
}

async function main() {
  const status = ensureProject();
  const projectId = status.id;
  const environment = status.environments?.edges?.find((edge) => edge.node?.name === 'production')?.node || status.environments?.edges?.[0]?.node;
  const environmentName = environment?.name || 'production';

  const repoSlug = getRepoSlug();
  const backendService = ensureService('backend', repoSlug);
  const frontendService = ensureService('frontend', repoSlug);

  configureService(projectId, environmentName, backendService.name, 'backend', 'npm run start:prod', '/health');
  configureService(projectId, environmentName, frontendService.name, 'frontend', 'node serve.js');

  const existingBackendVars = getVariables(backendService.name, projectId, environmentName);
  const jwtSecret = existingBackendVars.JWT_SECRET || crypto.randomBytes(32).toString('hex');

  setVariable(projectId, environmentName, backendService.name, 'DATABASE_URL', '${{Postgres.DATABASE_URL}}', { skipDeploys: true });
  setVariable(projectId, environmentName, backendService.name, 'NODE_ENV', 'production', { skipDeploys: true });
  setVariable(projectId, environmentName, backendService.name, 'JWT_SECRET', jwtSecret, { skipDeploys: true });
  setVariable(projectId, environmentName, backendService.name, 'FRONTEND_URL', '*', { skipDeploys: true });

  deployService(projectId, environmentName, backendService.name, 'backend');
  const backendDomain = ensureDomain(projectId, environmentName, backendService.name);

  setVariable(projectId, environmentName, frontendService.name, 'VITE_API_URL', backendDomain, { skipDeploys: true });
  deployService(projectId, environmentName, frontendService.name, 'frontend');
  const frontendDomain = ensureDomain(projectId, environmentName, frontendService.name);

  setVariable(projectId, environmentName, backendService.name, 'FRONTEND_URL', frontendDomain, { skipDeploys: false });

  console.log(JSON.stringify({
    projectId,
    environment: environmentName,
    services: {
      backend: {
        name: backendService.name,
        domain: backendDomain,
      },
      frontend: {
        name: frontendService.name,
        domain: frontendDomain,
      },
      database: {
        name: 'Postgres',
      },
    },
    repo: repoSlug,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
