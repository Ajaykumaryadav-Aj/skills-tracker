import { execFile } from 'child_process'
import { promisify } from 'util'
import env from '../config/env.js'

const execFileAsync = promisify(execFile)
const portArg = process.argv.slice(2).find((arg) => !arg.startsWith('-'))
const port = Number(portArg || env.port)
const dryRun = process.argv.includes('--dry-run')
const detectionErrors = []

const run = async (command, args) => {
  const { stdout } = await execFileAsync(command, args, { windowsHide: true })
  return stdout.trim()
}

const findWindowsPids = async () => {
  const script = [
    `$connections = Get-NetTCPConnection -State Listen -LocalPort ${port} -ErrorAction SilentlyContinue`,
    'if ($connections) { $connections | Select-Object -ExpandProperty OwningProcess -Unique }',
  ].join('; ')

  let output = ''
  try {
    output = await run('powershell.exe', ['-NoProfile', '-Command', script])
  } catch (error) {
    detectionErrors.push(error.message)
    return []
  }

  return output
    .split(/\r?\n/)
    .map((value) => Number(value.trim()))
    .filter(Boolean)
}

const findUnixPids = async () => {
  try {
    const output = await run('lsof', ['-ti', `tcp:${port}`])
    return output
      .split(/\r?\n/)
      .map((value) => Number(value.trim()))
      .filter(Boolean)
  } catch {
    return []
  }
}

const stopPid = async (pid) => {
  if (dryRun) return
  if (process.platform === 'win32') {
    await run('powershell.exe', ['-NoProfile', '-Command', `Stop-Process -Id ${pid} -Force`])
    return
  }
  process.kill(pid, 'SIGTERM')
}

const main = async () => {
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('A valid port is required')
  }

  const pids = process.platform === 'win32' ? await findWindowsPids() : await findUnixPids()

  if (!pids.length) {
    if (detectionErrors.length) {
      console.log(`Could not inspect port ${port} automatically.`)
      console.log('If the port is still busy, run this in PowerShell:')
      console.log(`Get-NetTCPConnection -State Listen -LocalPort ${port} | Select-Object LocalAddress,LocalPort,OwningProcess`)
      console.log(`Stop-Process -Id <OwningProcess> -Force`)
    } else {
      console.log(`Port ${port} is free.`)
    }
    return
  }

  console.log(`${dryRun ? 'Would stop' : 'Stopping'} process(es) on port ${port}: ${pids.join(', ')}`)
  await Promise.all(pids.map(stopPid))
  if (!dryRun) console.log(`Port ${port} is free now.`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
