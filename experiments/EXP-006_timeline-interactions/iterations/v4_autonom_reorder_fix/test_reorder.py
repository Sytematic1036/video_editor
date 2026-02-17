"""
Automated test for drag-and-drop reorder functionality.
Uses Playwright to simulate real user interaction.
"""
import asyncio
from playwright.async_api import async_playwright
from pathlib import Path
import time

async def test_reorder():
    async with async_playwright() as p:
        print("Launching browser...")
        browser = await p.chromium.launch(headless=False)  # headless=False to see what happens
        page = await browser.new_page()

        print("Loading page...")
        await page.goto('http://localhost:5011')
        await page.wait_for_load_state('networkidle')

        # Wait for page to be ready
        await asyncio.sleep(1)

        # Check if there are clips loaded
        clips = await page.query_selector_all('.timeline-clip.video')
        print(f"Found {len(clips)} video clips")

        # If no clips, create mock clips via JavaScript
        if len(clips) < 2:
            print("Creating mock video clips for testing...")

            # Inject mock clips directly into the JavaScript state
            await page.evaluate('''() => {
                // Create mock video clips
                videoClips = [
                    {
                        id: 'test_clip_1',
                        filename: 'clip_A.mp4',
                        path: '/test/clip_A.mp4',
                        type: 'video',
                        duration: 10,
                        trimStart: 0,
                        trimEnd: 0,
                        preview_url: ''
                    },
                    {
                        id: 'test_clip_2',
                        filename: 'clip_B.mp4',
                        path: '/test/clip_B.mp4',
                        type: 'video',
                        duration: 8,
                        trimStart: 0,
                        trimEnd: 0,
                        preview_url: ''
                    },
                    {
                        id: 'test_clip_3',
                        filename: 'clip_C.mp4',
                        path: '/test/clip_C.mp4',
                        type: 'video',
                        duration: 12,
                        trimStart: 0,
                        trimEnd: 0,
                        preview_url: ''
                    }
                ];
                renderTimeline();
            }''')

            await asyncio.sleep(0.5)

            clips = await page.query_selector_all('.timeline-clip.video')
            print(f"After mock injection: {len(clips)} video clips")

        if len(clips) < 2:
            print("Need to upload test videos first...")
            # The videos should already be uploaded via curl
            print("ERROR: Not enough clips found. Make sure to upload videos first.")
            await browser.close()
            return False

        # Get clip names before reorder
        clip_names_before = []
        for clip in clips:
            name_el = await clip.query_selector('.clip-name')
            name = await name_el.inner_text() if name_el else "unknown"
            clip_names_before.append(name)

        print(f"Clips before: {clip_names_before}")

        # Get bounding boxes
        clip0 = clips[0]
        clip1 = clips[1]

        box0 = await clip0.bounding_box()
        box1 = await clip1.bounding_box()

        print(f"Clip 0 position: x={box0['x']}, width={box0['width']}")
        print(f"Clip 1 position: x={box1['x']}, width={box1['width']}")

        # Calculate drag coordinates
        start_x = box0['x'] + box0['width'] / 2
        start_y = box0['y'] + box0['height'] / 2
        end_x = box1['x'] + box1['width'] + 20  # Drop after clip 1
        end_y = box1['y'] + box1['height'] / 2

        print(f"Dragging from ({start_x}, {start_y}) to ({end_x}, {end_y})")

        # Try using Playwright's built-in drag_and_drop
        # This should properly trigger HTML5 drag events
        try:
            await clip0.drag_to(clip1, target_position={"x": box1['width'] + 10, "y": box1['height'] / 2})
        except Exception as e:
            print(f"drag_to failed: {e}")
            # Fallback to manual drag
            await page.mouse.move(start_x, start_y)
            await page.mouse.down()
            await asyncio.sleep(0.1)

            # Move in steps for better drag detection
            steps = 10
            for i in range(1, steps + 1):
                x = start_x + (end_x - start_x) * i / steps
                y = start_y + (end_y - start_y) * i / steps
                await page.mouse.move(x, y)
                await asyncio.sleep(0.02)

            await asyncio.sleep(0.1)
            await page.mouse.up()

        print("Drag completed, waiting for re-render...")
        await asyncio.sleep(0.5)

        # Get clip names after reorder
        clips_after = await page.query_selector_all('.timeline-clip.video')
        clip_names_after = []
        for clip in clips_after:
            name_el = await clip.query_selector('.clip-name')
            name = await name_el.inner_text() if name_el else "unknown"
            clip_names_after.append(name)

        print(f"Clips after: {clip_names_after}")

        # Check if reorder worked
        if clip_names_before != clip_names_after:
            print("SUCCESS: Clips were reordered!")
            print(f"  Before: {clip_names_before}")
            print(f"  After:  {clip_names_after}")

            # Wait a moment and check if it persists
            await asyncio.sleep(1)
            clips_final = await page.query_selector_all('.timeline-clip.video')
            clip_names_final = []
            for clip in clips_final:
                name_el = await clip.query_selector('.clip-name')
                name = await name_el.inner_text() if name_el else "unknown"
                clip_names_final.append(name)

            if clip_names_final == clip_names_after:
                print("SUCCESS: Order persisted after 1 second!")
                await browser.close()
                return True
            else:
                print(f"FAILURE: Order reverted to {clip_names_final}")
                await browser.close()
                return False
        else:
            print("FAILURE: Clips were NOT reordered")
            await browser.close()
            return False

if __name__ == '__main__':
    result = asyncio.run(test_reorder())
    print(f"\nTest result: {'PASS' if result else 'FAIL'}")
    exit(0 if result else 1)
