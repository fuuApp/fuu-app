import sys
sys.path.insert(0, '/sessions/epic-sleepy-lovelace/.local/lib/python3.12/site-packages')
from playwright.sync_api import sync_playwright
import os

OUT = "/sessions/epic-sleepy-lovelace/mnt/outputs"
files = [
    ("fuu_user_lp_v2.html", "lp_screenshot.png", 480),
]

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    for html_file, out_name, width in files:
        path = f"file://{OUT}/{html_file}"
        page = browser.new_page(viewport={"width": width, "height": 900})
        page.goto(path, wait_until="networkidle")
        page.wait_for_timeout(1000)
        # full page screenshot
        page.screenshot(path=f"{OUT}/{out_name}", full_page=True)
        print(f"Screenshot saved: {out_name}")
    browser.close()

print("Done")
