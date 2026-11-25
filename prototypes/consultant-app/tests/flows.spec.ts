/**
 * End-to-end flows for the structure Jitendra Khimlani asked for (owner 2026-11-20). Run on phone, small phone, tablet and desktop.
 */
import { expect, test, type Page } from '@playwright/test'

const KEY = 'bewise.consult.v2'
const fresh = async (page: Page, hash = '/') => {
  await page.goto('./#' + hash)
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.waitForFunction((k) => localStorage.getItem(k), KEY)
}
const state = async (page: Page) => { await page.waitForTimeout(320); return page.evaluate((k) => JSON.parse(localStorage.getItem(k) || '{}'), KEY) } // saves are debounced 250 ms
const errors: string[] = []
test.beforeEach(({ page }) => {
  errors.length = 0
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
})
test.afterEach(() => expect(errors, 'no console errors').toEqual([]))

test.describe('@flows', () => {
  test('Today in the asked order: appointments, requests, missed remedy, remedy ending', async ({ page }) => {
    await fresh(page)
    const order = await page.evaluate(() => [...document.querySelectorAll('.today section[aria-label]')].map((x) => x.getAttribute('aria-label')))
    expect(order).toEqual(['Today at a glance', "Today's appointments", 'Asking for an appointment', 'Missed their remedy', 'Remedy about to end'])
    await expect(page.locator('.fab')).toHaveCount(0) // owner 2026-11-25: no floating pill on Today
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Jitendra Khimlani')
    await expect(page.locator('.tdl-row')).toHaveCount(5)
    await expect(page.locator('.tdl-row .type-scanning').first()).toBeVisible()
    await expect(page.locator('.tdl-row .type-bach').first()).toBeVisible()
  })

  test('assign a time to a request: call, pick, greet; request disappears', async ({ page }) => {
    await fresh(page)
    const before = (await state(page)).requests.length
    await page.locator('.req').first().getByRole('button', { name: 'Assign' }).click()
    const sheet = page.getByRole('dialog', { name: 'New appointment' })
    await expect(sheet.locator('.req-head')).toContainText('Prefers:')
    await expect(sheet.getByRole('link', { name: 'Call' })).toHaveAttribute('href', /^tel:/)
    await sheet.locator('.slot:not([disabled])').nth(3).click()
    await sheet.getByRole('button', { name: /Continue with/ }).click()
    await sheet.getByRole('button', { name: /Confirm and greet/ }).click()
    await expect(sheet.getByText('Payment link sent automatically')).toBeVisible({ timeout: 4000 })
    await sheet.getByRole('button', { name: 'Done' }).click()
    const after = await state(page)
    expect(after.requests.length).toBe(before - 1)
    expect(after.appts.some((a: { assignedBy?: string; greeting?: string }) => a.assignedBy === 'Jitendra Khimlani' && a.greeting)).toBe(true)
  })

  test('new scanning appointment, online, with a video link in the greeting', async ({ page }) => {
    await fresh(page)
    await page.getByRole('button', { name: 'New appointment' }).click()
    const sheet = page.getByRole('dialog', { name: 'New appointment' })
    await sheet.getByRole('button', { name: /Scanning/ }).click()
    await sheet.getByLabel('Search people').fill('a')
    await sheet.locator('.pick-list .row').first().click()
    await sheet.getByRole('tab', { name: 'Online' }).click()
    await sheet.getByLabel(/Video link/).fill('https://meet.google.com/abc-defg-hij')
    await sheet.locator('.tp-quick .chip').first().click()
    await sheet.getByRole('button', { name: /Continue with/ }).click()
    await expect(sheet.locator('.wa-bubble')).toHaveValue(/Scanning session[\s\S]*meet\.google\.com\/abc-defg-hij/)
    await sheet.getByRole('button', { name: /Confirm and greet/ }).click()
    await expect(sheet.getByText('Video link shared with the time')).toBeVisible()
    await sheet.getByRole('button', { name: 'Done' }).click({ timeout: 4000 })
    const s = await state(page)
    expect(s.appts.find((a: { meetingUrl?: string; service: string }) => a.meetingUrl === 'https://meet.google.com/abc-defg-hij')).toMatchObject({ service: 'scanning', durationMin: 45, mode: 'online' })
  })

  test('online session without a link: add it and share it on WhatsApp', async ({ page }) => {
    await fresh(page)
    const s = await state(page)
    const a = s.appts.find((x: { mode: string; meetingUrl?: string; start: number; status: string }) => x.mode === 'online' && !x.meetingUrl && x.start > Date.now() && x.status === 'confirmed')
    test.skip(!a, 'every online session already has a link in this seed')
    await page.goto('./#/sessions')
    await page.locator('.rows .row-hit', { hasText: s.people.find((p: { id: string }) => p.id === a.personId).name }).first().click()
    await expect(page).toHaveURL(new RegExp('#/appt/' + a.id))
    const card = page.getByRole('region', { name: 'Appointment' })
    await card.getByRole('button', { name: 'Use my room' }).click()
    await expect(card.getByRole('link', { name: 'Share link on WhatsApp' })).toHaveAttribute('href', /wa\.me\/\d+\?text=.*meet\.google\.com/)
    expect((await state(page)).appts.find((x: { id: string }) => x.id === a.id).meetingUrl).toContain('meet.google.com')
  })

  test('check in → start a Bach flower session → end → give remedy from suggestions', async ({ page }) => {
    await fresh(page)
    const s = await state(page)
    const a = s.appts.find((x: { service: string; status: string; start: number }) => x.service === 'bach' && (x.status === 'confirmed' || x.status === 'awaiting_payment') && x.start > Date.now())
    await page.goto('./#/session/' + a.id)
    await expect(page.locator('.live-top')).toBeVisible()
    await page.locator('.live .chips-wrap .chip', { hasText: 'Overthinking' }).click()
    await page.locator('textarea.notes').fill('Deadline on Friday.')
    await page.getByRole('button', { name: 'End session' }).click()
    await page.getByRole('button', { name: 'End and give remedy' }).click()
    const remedy = page.getByRole('dialog', { name: 'Give remedy' })
    await remedy.getByRole('button', { name: /Add all/ }).click()
    await remedy.getByRole('button', { name: /Give remedy · \d+\/7 flowers/ }).click()
    await expect(page.locator('.toast').last()).toContainText('Remedy given')
  })

  test('scanning session: notes only, no remedy step', async ({ page }) => {
    await fresh(page)
    const s = await state(page)
    const a = s.appts.find((x: { service: string; status: string; start: number }) => x.service === 'scanning' && x.status === 'confirmed' && x.start > Date.now())
    await page.goto('./#/session/' + a.id)
    await expect(page.getByRole('heading', { name: 'Scanning notes' })).toBeVisible()
    await expect(page.getByText("What's troubling")).toHaveCount(0)
    await expect(page.locator('.sugg')).toHaveCount(0)
    await page.locator('textarea.notes').fill('Energy steadier. Suggested a 10-minute walk after lunch.')
    await page.getByRole('button', { name: 'End session' }).click()
    await page.getByRole('button', { name: 'End and save notes' }).click()
    await expect(page.locator('.pf-head')).toBeVisible()
    await expect(page.getByRole('dialog', { name: 'Give remedy' })).toBeHidden()
    await expect(page.locator('.note-tl')).toContainText('Energy steadier')
    await expect(page.getByRole('tab', { name: 'Notes' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('.tab-sum')).toContainText('To follow up: Suggested a 10-minute walk after lunch.')
  })

  test('mood board: missed remedy first, open details, archive and bring back', async ({ page }) => {
    await fresh(page, '/people')
    await expect(page.getByRole('button', { name: /Missed remedy/ })).toHaveAttribute('aria-pressed', 'true')
    const card = page.locator('.board-card').first()
    await expect(card.locator('.bc-status')).toContainText(/Missed \d of 7 days/)
    const name = (await card.locator('b').textContent())!
    await card.click()
    await expect(page.getByRole('tab', { name: 'Remedy' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('.adh-pill')).toContainText(/Missed \d of last 7 days/)
    // every part of the profile is one tap away
    for (const t of ['Overview', 'Lo Shu', 'Sessions']) { await page.getByRole('tab', { name: new RegExp('^' + t) }).click(); await expect(page.getByRole('tab', { name: new RegExp('^' + t) })).toHaveAttribute('aria-selected', 'true') }
    await page.getByRole('tab', { name: 'About' }).click()
    await page.getByRole('button', { name: new RegExp(`Archive ${name.split(' ')[0]}`) }).click()
    await page.goto('./#/people?archived')
    await expect(page.locator('.board-card', { hasText: name })).toBeVisible()
    await page.locator('.board-card', { hasText: name }).click()
    await page.getByRole('tab', { name: 'About' }).click()
    await page.getByRole('button', { name: /Bring back/ }).click()
    expect((await state(page)).people.find((p: { name: string }) => p.name === name).archived).toBe(false)
  })

  test('remedy ending: within a week / 1–2 weeks, archive from the list', async ({ page }) => {
    await fresh(page)
    const sec = page.getByRole('region', { name: 'Remedy about to end' })
    const n = await sec.locator('.ending li').count()
    await sec.locator('.ending li').first().getByRole('button', { name: /^Archive / }).click()
    await expect(sec.locator('.ending li')).toHaveCount(n - 1)
    await sec.getByRole('tab', { name: /In 1–2 weeks/ }).click()
    await expect(sec.locator('.ending li').first()).toBeVisible()
  })

  test('messages: unread badge, open, reply, badge goes down', async ({ page }) => {
    await fresh(page, '/messages')
    const badge = page.locator('.nav-btn .nav-badge')
    const before = Number(await badge.textContent())
    await page.locator('.inbox-list .row.is-unread').first().click()
    await expect(page.locator('.bubble').first()).toBeVisible()
    await expect(badge).toHaveText(String(before - 1))
    await page.getByLabel(/^Message /).fill('Namaste, see you on Friday 🙏')
    await page.getByRole('button', { name: 'Send' }).click()
    await expect(page.locator('.bubble.b-me').last()).toContainText('see you on Friday')
  })

  test('dashboard: who is taking the remedy, message one personally', async ({ page }) => {
    await fresh(page, '/dashboard')
    await expect(page.locator('.rh-big')).toContainText('people are on a remedy right now')
    const legend = await page.locator('.stack-legend b').allTextContents()
    await expect(page.locator('.rh-big b')).toHaveText(String(legend.map(Number).reduce((a, b) => a + b, 0))) // count-up settles
    await page.getByRole('region', { name: 'Message people personally' }).getByRole('button', { name: 'Message', exact: true }).first().click()
    await expect(page.locator('.convo')).toBeVisible()
  })

  test('finance: today, month, products, daily bars', async ({ page }) => {
    await fresh(page, '/finance')
    await expect(page.getByText('Read-only')).toBeVisible()
    await expect(page.locator('.fin-big')).toHaveText(/₹[\d,]+/)
    await page.getByRole('tab', { name: 'Profit' }).click()
    await expect(page.locator('.prod-list li').first()).toBeVisible()
    await page.locator('.dbar').first().click()
    await expect(page.locator('.dbar-tip')).toContainText('₹')
  })

  test('share link, calendar, sessions still work', async ({ page }) => {
    await fresh(page)
    await page.getByRole('button', { name: 'Share my link' }).click()
    await expect(page.getByAltText('QR code for your booking link')).toBeVisible()
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Calendar' }).first().click()
    await expect(page.locator('.cal-grid')).toBeVisible()
    await page.keyboard.press('Escape')
    await page.goto('./#/sessions')
    await page.getByRole('tab', { name: /Past/ }).click()
    await expect(page.locator('.row-main small.felt').first()).toBeVisible()
  })

  test('move a session to any free time', async ({ page }) => {
    await fresh(page, '/sessions')
    const before = await state(page)
    await page.locator('.rows .row-hit').nth(1).click()
    await page.getByRole('region', { name: 'Appointment' }).getByRole('button', { name: 'Move' }).click()
    const pick = page.getByRole('dialog', { name: 'Pick a time' })
    await pick.locator('.day:not([disabled])').nth(2).click()
    await pick.locator('.slot:not([disabled])').first().click()
    await pick.getByRole('button', { name: /Move to/ }).click()
    await expect(page.locator('.toast').last()).toContainText('Moved to')
    const after = await state(page)
    expect(after.appts.filter((a: { id: string; start: number }) => before.appts.find((b: { id: string; start: number }) => b.id === a.id)?.start !== a.start)).toHaveLength(1)
  })

  test('new person: validation, then book', async ({ page }) => {
    await fresh(page, '/people')
    await page.getByRole('button', { name: 'New person' }).click()
    const form = page.getByRole('dialog', { name: 'Add a person' })
    await form.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(form.getByText('Enter their name.')).toBeVisible()
    await form.getByLabel('Full name').fill('Someone New')
    await form.getByLabel('Mobile number').fill('98250 11223')
    await form.getByRole('button', { name: 'Surat' }).click()
    await expect(form).toBeVisible()
    await form.getByRole('button', { name: 'Save and book' }).click()
    const sheet = page.getByRole('dialog', { name: 'New appointment' })
    await sheet.getByRole('button', { name: /Bach flower remedy/ }).click()
    await expect(sheet.getByRole('heading', { name: 'Book Someone' })).toBeVisible()
  })

  test('keyboard: Escape closes sheets, focus is visible', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'keyboard check on desktop')
    await fresh(page)
    await page.getByRole('button', { name: 'Calendar' }).first().click()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: 'Calendar' })).toBeHidden()
    await page.keyboard.press('Tab')
    expect(await page.evaluate(() => getComputedStyle(document.activeElement!).outlineStyle)).not.toBe('none')
  })

  test('Lo Shu: grid from the date of birth, missing date can be added, tab is remembered', async ({ page }) => {
    await fresh(page)
    const s = await state(page)
    const withDob = s.people.find((p: { dob?: string; archived?: boolean }) => p.dob && !p.archived)
    await page.goto('./#/people/' + withDob.id)
    await page.locator('.gl-tile', { hasText: 'Lo Shu' }).click()
    await expect(page.getByRole('heading', { name: 'General reading' })).toBeVisible()
    await expect(page.locator('.tab-sum')).toContainText(/Driver \d, conductor \d\. \d{4} is a personal year \d/)
    await expect(page.getByRole('tab', { name: 'Lo Shu' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('.ls-main .ls-cell')).toHaveCount(9)
    await expect(page.getByRole('heading', { name: /Missing numbers/ })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('tab', { name: 'Lo Shu' })).toHaveAttribute('aria-selected', 'true')

    const noDob = s.people.find((p: { dob?: string; archived?: boolean }) => !p.dob && !p.archived)
    await page.goto(`./#/people/${noDob.id}?loshu`)
    await expect(page.getByRole('heading', { name: 'No date of birth yet' })).toBeVisible()
    await page.getByLabel('Date of birth').fill('1987-08-15')
    await page.getByRole('button', { name: 'Show grid' }).click()
    await expect(page.locator('.ls-key').first()).toContainText('6') // driver
    await expect(page.locator('.ls-key').nth(1)).toContainText('3') // conductor
    expect((await state(page)).people.find((p: { id: string }) => p.id === noDob.id).dob).toBe('1987-08-15')
  })

  test('appointment opens with sliding tabs: summary on every tab, add a note, create a remedy', async ({ page, isMobile }) => {
    await fresh(page)
    await page.locator('.tl-hit').first().click()
    await expect(page).toHaveURL(/#\/appt\//)
    await expect(page.getByRole('region', { name: 'Appointment' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Wellness summary' })).toBeVisible()
    for (const t of ['Lo Shu', 'Moods', 'Notes', 'Remedy', 'Sessions', 'About']) {
      await page.getByRole('tab', { name: new RegExp('^' + t) }).click()
      await expect(page.getByRole('tab', { name: new RegExp('^' + t) })).toHaveAttribute('aria-selected', 'true')
      await expect(page.locator('.tab-sum')).toBeVisible()
    }
    // notes: add one
    await page.getByRole('tab', { name: 'Notes' }).click()
    await page.getByRole('button', { name: 'Add a note' }).click()
    await page.getByLabel(/New note for/).fill('Lighter today. Suggested a morning walk.')
    await page.getByRole('button', { name: 'Save note' }).click()
    await expect(page.locator('.note-tl li').first()).toContainText('Lighter today')
    await expect(page.locator('.tab-sum')).toContainText('Lighter today')
    // remedy: create a new one
    await page.getByRole('tab', { name: 'Remedy' }).click()
    await page.locator('.rm-create').click()
    const sheet = page.getByRole('dialog', { name: 'Give remedy' })
    if (await sheet.locator('.blend-chip').count() >= 7) await sheet.locator('.blend-chip').first().click()
    await sheet.getByLabel('Search flowers').fill('Hornb')
    await sheet.locator('.ftile', { hasText: 'Hornbeam' }).click()
    await sheet.getByRole('button', { name: /(Create|Give) remedy · \d+\/7 flowers/ }).click()
    await expect(page.locator('.toast').last()).toContainText(/Remedy (given|created)/)
    await expect(page.locator('.rm-current')).toContainText('Hornbeam')
    // swipe between tabs on touch screens
    if (isMobile) {
      await page.getByRole('tab', { name: 'Overview' }).click()
      const box = (await page.locator('.pf-panel').boundingBox())!
      await page.evaluate(() => document.querySelector('.pf-panel')!.scrollIntoView({ block: 'start' }))
      const cdp = await page.context().newCDPSession(page)
      const y = 160, tp = (type: string, x: number) => cdp.send('Input.dispatchTouchEvent', { type: type as 'touchStart', touchPoints: type === 'touchEnd' ? [] : [{ x, y }] })
      await tp('touchStart', box.width - 30); for (let x = box.width - 50; x > 60; x -= 30) await tp('touchMove', x); await tp('touchEnd', 60)
      await expect(page.getByRole('tab', { name: 'Lo Shu' })).toHaveAttribute('aria-selected', 'true')
    }
  })

  test('marketing: nudge people not using the app, broadcast, share a review image', async ({ page }) => {
    await fresh(page, '/marketing')
    await expect(page.getByRole('heading', { name: 'Grow BeWise' })).toBeVisible()
    await page.locator('.mk-row', { hasText: 'Not using the app' }).click()
    const nudge = page.getByRole('dialog', { name: 'Send a nudge' })
    await expect(nudge.locator('.nudge-preview')).toContainText(/^Namaste \w+/)
    const n = await nudge.locator('.nudge-list li').count()
    await nudge.locator('.nudge-list input').first().uncheck()
    await nudge.getByRole('button', { name: `Send to ${n - 1} people` }).click()
    await expect(page.locator('.toast').last()).toContainText(`Sent to ${n - 1} people`)
    expect((await state(page)).mkt.nudges).toHaveLength(n - 1)
    // the same people aren't offered again this week
    await expect(page.locator('.mk-row', { hasText: 'Not using the app' }).locator('em')).toHaveText('1')

    await page.getByRole('button', { name: /Broadcast to all/ }).click()
    const cast = page.getByRole('dialog', { name: 'Broadcast' })
    await cast.getByRole('button', { name: /Festival wishes/ }).click()
    await cast.getByRole('button', { name: /Review and send to \d+/ }).click()
    await cast.getByRole('button', { name: 'Yes, send now' }).click()
    await expect(page.locator('.toast').last()).toContainText('Broadcast sent')
    await expect(page.locator('.mk-recent')).toContainText('Broadcast to')

    await page.getByRole('button', { name: /Share a review/ }).click()
    const post = page.getByRole('dialog', { name: 'Share a post' })
    await expect(post.locator('canvas')).toBeVisible()
    await post.getByRole('tab', { name: 'Story (tall)' }).click()
    const dl = page.waitForEvent('download')
    await post.getByRole('button', { name: 'Save image' }).click()
    expect((await dl).suggestedFilename()).toBe('bewise-review-story.png')
  })
})
