# import os
# import subprocess

# # Determine the directory of the current script
# script_dir = os.path.dirname(os.path.abspath(__file__))

# # Construct the absolute path to candidates.txt
# candidates_file = os.path.join(script_dir, 'candidates.txt')

# # Construct the absolute paths to the Python and Node.js scripts
# pythonscraper_path = os.path.join(script_dir, 'pythonscraper.py')
# scoring_path = os.path.join(script_dir, 'scoring.js')

# # Read the candidates from the file
# with open(candidates_file, 'r') as file:
#     candidates = [line.strip() for line in file if line.strip()]

# # Process each candidate
# for candidate in candidates:
#     print(f"Processing: {candidate}")
    
#     # Step 1: Run the Python scraper with a timeout
#     try:
#         subprocess.run(['python3', pythonscraper_path, candidate], timeout=300)
#     except subprocess.TimeoutExpired:
#         print(f"⏱️ Timeout: Skipping candidate {candidate} after 5 minutes.")
#         continue  # Skip to the next candidate
    
#     # Step 2: Run the Node.js summarizer with a timeout
#     try:
#         subprocess.run(['node', scoring_path, candidate], timeout=300)
#     except subprocess.TimeoutExpired:
#         print(f"⏱️ Timeout: Skipping candidate {candidate} after 5 minutes.")
#         continue  # Skip to the next candidate

import os
import asyncio
import subprocess
import random

# Paths
script_dir = os.path.dirname(os.path.abspath(__file__))
candidates_file = os.path.join(script_dir, 'candidates.txt')
pythonscraper_path = os.path.join(script_dir, 'pythonscraper.py')
scoring_path = os.path.join(script_dir, 'scoring.js')

# Read candidates
with open(candidates_file, 'r') as file:
    candidates = [line.strip() for line in file if line.strip()]

# Settings
SCRAPE_TIMEOUT = 300
SCORE_TIMEOUT = 300
async def run_subprocess(cmd, timeout, label):
    try:
        await asyncio.to_thread(
            subprocess.run,
            cmd,
            timeout=timeout,
            stdout=subprocess.DEVNULL,  # discard stdout to avoid EPIPE crash
            stderr=subprocess.STDOUT
        )
        print(f"✅ {label} completed.")  # ✅ now properly indented
        return True
    except subprocess.TimeoutExpired:
        print(f"⏱️ Timeout: {label} after {timeout} seconds.")
        return False
    except Exception as e:
        print(f"❌ Error during {label}: {e}")
        return False

async def safe_run(cmd, timeout, label):
    success = await run_subprocess(cmd, timeout, label)
    if not success:
        print(f"🔁 Retrying {label}...")
        await asyncio.sleep(2)
        success = await run_subprocess(cmd, timeout, f"{label} (retry)")
    return success

async def process_candidate(candidate, scrape_sem, score_sem):
    async with scrape_sem:
        print(f"\n🚀 Starting scrape: {candidate}")
        scraped = await safe_run(['python3', pythonscraper_path, candidate], SCRAPE_TIMEOUT, f"Scraping {candidate}")
        if not scraped:
            print(f"⚠️ Skipping {candidate} - scraping failed twice.")
            return

    await asyncio.sleep(random.uniform(2.5, 5.5))  # 💨 relax

    async with score_sem:
        print(f"\n🎯 Starting score: {candidate}")
        scored = await safe_run(['node', scoring_path, candidate], SCORE_TIMEOUT, f"Scoring {candidate}")
        if not scored:
            print(f"⚠️ Skipping {candidate} - scoring failed twice.")
            return

    print(f"✅ Done fully: {candidate}")

async def main():
    scrape_sem = asyncio.Semaphore(5)  # 🔥 5 scrapers
    score_sem = asyncio.Semaphore(2)   # 🚶‍♂️ 2 scorers
    tasks = [process_candidate(candidate, scrape_sem, score_sem) for candidate in candidates]
    await asyncio.gather(*tasks)

if __name__ == "__main__":
    asyncio.run(main())


