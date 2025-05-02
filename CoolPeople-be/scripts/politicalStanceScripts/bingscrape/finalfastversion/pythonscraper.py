# import os
# import re
# import asyncio
# import hashlib
# import sys
# from urllib.parse import urlparse, urljoin

# from bs4 import BeautifulSoup
# import requests
# from playwright.async_api import async_playwright
# import random

# KEYWORDS = ['issue', 'platform', 'vision', 'priorities', 'agenda', 'legislation', 'bill', 'leg']
# EXCLUDED_DOMAIN = 'nyccfb'
# PARKED_KEYWORDS = ['buy this domain', 'this domain is for sale', 'site not found', '404', 'domain parking']

# visited = set()
# scraped_text_hashes = set()

# def is_valid_first_level(url, candidate_name):
#     try:
#         parsed = urlparse(url)
#         domain = parsed.hostname.lower() if parsed.hostname else ''
#         if EXCLUDED_DOMAIN in domain:
#             return False
#         if domain.endswith('.gov'):
#             return True
#         name_parts = re.findall(r'\w+', candidate_name.lower())
#         return any(part in domain for part in name_parts)
#     except Exception:
#         return False

# def is_internal_or_gov(link, base_url, candidate_name=''):
#     try:
#         link_host = urlparse(link).hostname or ''
#         base_host = urlparse(base_url).hostname or ''
#         full_url = link.lower()

#         # 🚫 Block legistar links
#         if 'legistar.council.nyc.gov' in full_url:
#             print(f"⛔ Skipping legistar link: {link}")
#             return False

#         # Special council.nyc.gov rule
#         if 'council.nyc.gov' in full_url:
#             name_parts = re.findall(r'\w+', candidate_name.lower())
#             if not any(part in full_url for part in name_parts):
#                 print(f"⛔ Skipping council.nyc.gov link without candidate name: {link}")
#                 return False

#         # Normal internal or .gov domain logic
#         return (link_host == base_host) or (link_host.endswith('.gov') and EXCLUDED_DOMAIN not in link_host)
#     except Exception:
#         return False

# async def extract_text_and_links(url, page):
#     headers = {
#         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...'
#     }
#     try:
#         res = requests.get(url, headers=headers, timeout=10)
#         if res.status_code == 403:
#             print(f"❌ 403 Forbidden from requests: {url}")
#             return await extract_with_playwright(url, page)
#         if 'text/html' not in res.headers.get('Content-Type', ''):
#             return '', []
#         soup = BeautifulSoup(res.text, 'html.parser')
#     except Exception as e:
#         print(f"⚠️ Requests failed for {url}: {e}")
#         return await extract_with_playwright(url, page)

#     return parse_html_and_links(soup, url)

# async def extract_with_playwright(url, page):
#     try:
#         await page.goto(url, timeout=15000)
#         content = await page.content()
#         soup = BeautifulSoup(content, 'html.parser')
#         return parse_html_and_links(soup, url)
#     except Exception as e:
#         print(f"❌ Playwright failed for {url}: {e}")
#         return '', []

# def parse_html_and_links(soup, url):
#     text = ' '.join(el.get_text(separator=' ', strip=True) for el in soup.select('p, h1, h2, h3, h4, h5, h6, li, td, span, article'))
#     if any(kw in text.lower() for kw in PARKED_KEYWORDS):
#         return '', []
#     base_url = f"{urlparse(url).scheme}://{urlparse(url).netloc}"
#     links = [urljoin(base_url, a.get('href')) for a in soup.find_all('a', href=True)]
#     links = [link for link in links if link.startswith('http')]
#     return text.strip(), list(set(links))

# async def search_bing(candidate_name, page):
#     await page.goto(f'https://www.bing.com/search?q={candidate_name}')
#     await page.wait_for_timeout(2000)
#     elements = await page.query_selector_all('li.b_algo a')
#     urls = []
#     for el in elements:
#         href = await el.get_attribute('href')
#         if href and href.startswith('http'):
#             urls.append(href)
#     return list(set(urls))

# async def scrape_link(url, context, writer, level):
#     try:
#         page = await context.new_page()
#         text, links = await extract_text_and_links(url, page)
#         await page.close()

#         # 🧹 Avoid scraping same text twice
#         text_hash = hashlib.md5(text.encode('utf-8')).hexdigest()
#         if text_hash in scraped_text_hashes:
#             print(f"🔁 Skipped duplicate page text: {url}")
#             return []

#         scraped_text_hashes.add(text_hash)

#         writer.write(f'\n--- {level} Level Page: {url} ---\n')
#         writer.write(text + '\n')
#         await asyncio.sleep(random.uniform(1.2, 3.0))
#         return links
#     except Exception as e:
#         print(f"⚠️ Error scraping {url}: {e}")
#         return []

# async def scrape_candidate(candidate_name):
#     candidate_slug = candidate_name.replace(' ', '_')
#     OUTPUT_PATH = f'data/individualstancedata2/{candidate_slug}.txt'
#     os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

#     async with async_playwright() as p:
#         browser = await p.chromium.launch(headless=True)
#         context = await browser.new_context()
#         main_page = await context.new_page()

#         urls = await search_bing(candidate_name, main_page)
#         filtered = [u for u in urls if is_valid_first_level(u, candidate_name)]

#         with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
#             for url in filtered:
#                 if url in visited:
#                     continue
#                 visited.add(url)

#                 print(f'🟢 Scraping landing: {url}')
#                 links_lvl1 = await scrape_link(url, context, f, 'Landing')

#                 scrape_tasks_lvl1 = []
#                 for link1 in links_lvl1:
#                     if link1 in visited or not any(k in link1.lower() for k in KEYWORDS) or not is_internal_or_gov(link1, url, candidate_name):
#                         continue
#                     visited.add(link1)
#                     scrape_tasks_lvl1.append(scrape_link(link1, context, f, '2nd'))

#                 second_level_links = await asyncio.gather(*scrape_tasks_lvl1)

#                 scrape_tasks_lvl2 = []
#                 for links_set in second_level_links:
#                     for link2 in links_set:
#                         if link2 in visited or not is_internal_or_gov(link2, link2, candidate_name):
#                             continue
#                         visited.add(link2)
#                         scrape_tasks_lvl2.append(scrape_link(link2, context, f, '3rd'))

#                 await asyncio.gather(*scrape_tasks_lvl2)

#         await browser.close()

# if __name__ == "__main__":
#     if len(sys.argv) < 2:
#         print("Usage: python3 scriptname.py 'Candidate Name'")
#     else:
#         candidate = sys.argv[1]
#         try:
#             asyncio.run(asyncio.wait_for(scrape_candidate(candidate), timeout=300))
#         except asyncio.TimeoutError:
#             print(f"⏱️ Timeout occurred while processing {candidate}. Skipping.")

import os
import re
import asyncio
import hashlib
import sys
import json
from urllib.parse import urlparse, urljoin

from bs4 import BeautifulSoup
import requests
from playwright.async_api import async_playwright
import random

# --- Configuration ---
KEYWORDS = ['issue', 'platform', 'vision', 'priorities', 'agenda', 'legislation', 'bill', 'leg']
EXCLUDED_DOMAIN = 'nyccfb'
PARKED_KEYWORDS = ['buy this domain', 'this domain is for sale', 'site not found', '404', 'domain parking']

visited = set()
scraped_text_hashes = set()

# --- Utility Functions ---
def is_valid_first_level(url, candidate_name):
    try:
        parsed = urlparse(url)
        domain = parsed.hostname.lower() if parsed.hostname else ''
        if EXCLUDED_DOMAIN in domain:
            return False
        if domain.endswith('.gov'):
            return True
        name_parts = re.findall(r'\w+', candidate_name.lower())
        return any(part in domain for part in name_parts)
    except Exception:
        return False

def is_internal_or_gov(link, base_url, candidate_name=''):
    try:
        link = link.lower()
        candidate_parts = re.findall(r'\w+', candidate_name.lower())
        link_host = urlparse(link).hostname or ''
        base_host = urlparse(base_url).hostname or ''

        # 🚫 Always skip anything Legistar
        if 'legistar.council.nyc.gov' in link:
            print(f"⛔ Skipping legistar link: {link}")
            return False

        # 🚫 council.nyc.gov requires candidate name inside the URL path
        if 'council.nyc.gov' in link_host:
            if any(part in link for part in candidate_parts):
                return True  # ✅ candidate-specific page
            else:
                print(f"⛔ Skipping council.nyc.gov without candidate name: {link}")
                return False

        # ✅ Other .gov pages allowed if they are NOT nyccfb
        if link_host.endswith('.gov') and EXCLUDED_DOMAIN not in link_host:
            return True

        # ✅ Allow candidate personal websites (if name appears in host)
        if any(part in link_host for part in candidate_parts):
            return True

        # 🚫 Otherwise
        return False

    except Exception as e:
        print(f"⚠️ Error checking link validity: {e}")
        return False


async def extract_text_and_links(url, page):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...'
    }
    try:
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code == 403:
            print(f"❌ 403 Forbidden from requests: {url}")
            return await extract_with_playwright(url, page)
        if 'text/html' not in res.headers.get('Content-Type', ''):
            return '', []
        soup = BeautifulSoup(res.text, 'html.parser')
    except Exception as e:
        print(f"⚠️ Requests failed for {url}: {e}")
        return await extract_with_playwright(url, page)

    return parse_html_and_links(soup, url)

async def extract_with_playwright(url, page):
    try:
        await page.goto(url, timeout=15000)
        content = await page.content()
        soup = BeautifulSoup(content, 'html.parser')
        return parse_html_and_links(soup, url)
    except Exception as e:
        print(f"❌ Playwright failed for {url}: {e}")
        return '', []

def parse_html_and_links(soup, url):
    text = ' '.join(el.get_text(separator=' ', strip=True) for el in soup.select('p, h1, h2, h3, h4, h5, h6, li, td, span, article'))
    if any(kw in text.lower() for kw in PARKED_KEYWORDS):
        return '', []
    base_url = f"{urlparse(url).scheme}://{urlparse(url).netloc}"
    links = [urljoin(base_url, a.get('href')) for a in soup.find_all('a', href=True)]
    links = [link for link in links if link.startswith('http')]
    return text.strip(), list(set(links))

async def search_bing(candidate_name, page):
    await page.goto(f'https://www.bing.com/search?q={candidate_name}')
    await page.wait_for_timeout(2000)
    elements = await page.query_selector_all('li.b_algo a')
    urls = []
    for el in elements:
        href = await el.get_attribute('href')
        if href and href.startswith('http'):
            urls.append(href)
    return list(set(urls))

async def scrape_link(url, context, collected_data, level):
    try:
        page = await context.new_page()
        text, links = await extract_text_and_links(url, page)
        await page.close()

        if not text.strip():
            return []

        text_hash = hashlib.md5(text.encode('utf-8')).hexdigest()
        if text_hash in scraped_text_hashes:
            print(f"🔁 Skipped duplicate page text: {url}")
            return []

        scraped_text_hashes.add(text_hash)

        # ✅ Collect {source, text}
        collected_data.append({
            "source": url,
            "text": text
        })

        await asyncio.sleep(random.uniform(1.2, 3.0))
        return links
    except Exception as e:
        print(f"⚠️ Error scraping {url}: {e}")
        return []

async def scrape_candidate(candidate_name):
    candidate_slug = candidate_name.replace(' ', '_')
    OUTPUT_PATH = f'data/individualstancedata2/{candidate_slug}.json'
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

    collected_data = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        main_page = await context.new_page()

        urls = await search_bing(candidate_name, main_page)
        filtered = [u for u in urls if is_valid_first_level(u, candidate_name)]

        for url in filtered:
            if url in visited:
                continue
            visited.add(url)

            print(f'🟢 Scraping landing: {url}')
            links_lvl1 = await scrape_link(url, context, collected_data, 'Landing')

            scrape_tasks_lvl1 = []
            for link1 in links_lvl1:
                if link1 in visited or not any(k in link1.lower() for k in KEYWORDS) or not is_internal_or_gov(link1, url, candidate_name):
                    continue
                visited.add(link1)
                scrape_tasks_lvl1.append(scrape_link(link1, context, collected_data, '2nd'))

            second_level_links = await asyncio.gather(*scrape_tasks_lvl1)

            scrape_tasks_lvl2 = []
            for links_set in second_level_links:
                for link2 in links_set:
                    if link2 in visited or not is_internal_or_gov(link2, link2, candidate_name):
                        continue
                    visited.add(link2)
                    scrape_tasks_lvl2.append(scrape_link(link2, context, collected_data, '3rd'))

            await asyncio.gather(*scrape_tasks_lvl2)

        await browser.close()

    # 🔥 Save final structured output
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as out_json:
        json.dump(collected_data, out_json, ensure_ascii=False, indent=2)

    print(f"✅ Finished saving structured JSON to {OUTPUT_PATH}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 scraper.py 'Candidate Name'")
    else:
        candidate = sys.argv[1]
        try:
            asyncio.run(asyncio.wait_for(scrape_candidate(candidate), timeout=300))
        except asyncio.TimeoutError:
            print(f"⏱️ Timeout occurred while processing {candidate}. Skipping.")

