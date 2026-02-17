"""
Automated test for mouse-based reorder functionality.
Uses Playwright to simulate real mouse interaction.
"""
import asyncio
from playwright.async_api import async_playwright
from pathlib import Path

async def test_reorder():
    async with async_playwright() as p:
        print("Launching browser...")
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()

        print("Loading page...")
        await page.goto('http://localhost:5012')
        await page.wait_for_load_state('networkidle')
        await asyncio.sleep(1)

        # Check if there are clips loaded
        clips = await page.query_selector_all('.timeline-clip.video')
        print(f"Found {len(clips)} video clips")

        # If no clips, create mock clips via JavaScript
        if len(clips) < 2:
            print("Creating mock video clips for testing...")
            await page.evaluate('''() => {
                videoClips = [
                    { id: 'test_1', filename: 'clip_A.mp4', path: '/test/a.mp4', type: 'video', duration: 10, trimStart: 0, trimEnd: 0, preview_url: '' },
                    { id: 'test_2', filename: 'clip_B.mp4', path: '/test/b.mp4', type: 'video', duration: 8, trimStart: 0, trimEnd: 0, preview_url: '' },
                    { id: 'test_3', filename: 'clip_C.mp4', path: '/test/c.mp4', type: 'video', duration: 12, trimStart: 0, trimEnd: 0, preview_url: '' }
                ];
                renderTimeline();
            }''')
            await asyncio.sleep(0.5)
            clips = await page.query_selector_all('.timeline-clip.video')
            print(f"After mock injection: {len(clips)} video clips")

        if len(clips) < 2:
            print("ERROR: Not enough clips")
            await browser.close()
            return False

        # Get clip names before
        before_order = await page.evaluate('() => videoClips.map(c => c.filename)')
        print(f"Before: {before_order}")

        # Get positions of first two clips
        clip0 = clips[0]
        clip1 = clips[1]
        box0 = await clip0.bounding_box()
        box1 = await clip1.bounding_box()

        # Calculate drag coordinates
        start_x = box0['x'] + box0['width'] / 2
        start_y = box0['y'] + box0['height'] / 2
        end_x = box1['x'] + box1['width'] + 30  # Drop after clip 1
        end_y = start_y

        print(f"Dragging from ({start_x:.0f}, {start_y:.0f}) to ({end_x:.0f}, {end_y:.0f})")

        # Simulate mouse drag with explicit events
        await page.mouse.move(start_x, start_y)
        await asyncio.sleep(0.05)

        await page.mouse.down()
        await asyncio.sleep(0.05)

        # Move in steps - this should trigger the drag
        steps = 15
        for i in range(1, steps + 1):
            x = start_x + (end_x - start_x) * i / steps
            await page.mouse.move(x, start_y)
            await asyncio.sleep(0.02)

        await asyncio.sleep(0.1)
        await page.mouse.up()

        print("Drag completed, waiting for re-render...")
        await asyncio.sleep(0.5)

        # Get clip names after
        after_order = await page.evaluate('() => videoClips.map(c => c.filename)')
        print(f"After: {after_order}")

        # Check result
        if before_order != after_order:
            print("SUCCESS: Clips were reordered!")

            # Verify persistence
            await asyncio.sleep(1)
            final_order = await page.evaluate('() => videoClips.map(c => c.filename)')
            if final_order == after_order:
                print("SUCCESS: Order persisted!")
                await browser.close()
                return True
            else:
                print(f"FAILURE: Order reverted to {final_order}")
                await browser.close()
                return False
        else:
            print("FAILURE: Clips were NOT reordered")

            # Debug: Check if drag was detected
            console_logs = []
            page.on('console', lambda msg: console_logs.append(msg.text))
            await asyncio.sleep(0.5)
            print(f"Console logs: {console_logs}")

            await browser.close()
            return False

if __name__ == '__main__':
    result = asyncio.run(test_reorder())
    print(f"\nTest result: {'PASS' if result else 'FAIL'}")
    exit(0 if result else 1)
