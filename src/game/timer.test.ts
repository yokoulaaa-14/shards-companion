import { describe, expect, it } from 'vitest'
import { averageTurnMs, elapsedAt, formatDuration, isRunning, pauseTimer, resumeTimer, startTimer, stoppedTimer } from './timer'

describe('game timer', () => {
  it('runs from the start time', () => {
    const t = startTimer(1_000)
    expect(isRunning(t)).toBe(true)
    expect(elapsedAt(t, 6_000)).toBe(5_000)
  })

  it('does not count time while paused', () => {
    let t = startTimer(0)
    t = pauseTimer(t, 10_000)
    expect(elapsedAt(t, 60_000)).toBe(10_000)
    t = resumeTimer(t, 60_000)
    expect(elapsedAt(t, 65_000)).toBe(15_000)
  })

  it('pause and resume are idempotent', () => {
    const paused = pauseTimer(startTimer(0), 5_000)
    expect(pauseTimer(paused, 9_000)).toBe(paused)
    const running = resumeTimer(paused, 9_000)
    expect(resumeTimer(running, 12_000)).toBe(running)
  })

  it('a stopped timer reads zero', () => {
    expect(elapsedAt(stoppedTimer(), 99_999)).toBe(0)
  })

  it('formats minutes and hours', () => {
    expect(formatDuration(0)).toBe('0:00')
    expect(formatDuration(75_000)).toBe('1:15')
    expect(formatDuration(32 * 60_000 + 10_000)).toBe('32:10')
    expect(formatDuration(3_725_000)).toBe('1:02:05')
  })

  it('averages time per turn', () => {
    expect(averageTurnMs(14 * 60_000, 7)).toBe(120_000)
    expect(averageTurnMs(5_000, 0)).toBe(0)
  })
})
